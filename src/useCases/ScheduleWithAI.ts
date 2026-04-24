import type { IEventRepository } from "@/src/domain/calendar/interfaces/IEventRepository";
import type { IAIServicePort, ParsedEventIntent } from "@/src/domain/ai/interfaces/IAIServicePort";
import { CreateEventUseCase } from "@/src/domain/calendar/useCases/CreateEventUseCase";

export interface ScheduleWithAIInput {
  userId: string;
  text: string;
}

export interface ScheduleWithAIResult {
  success: boolean;
  event?: ParsedEventIntent;
  error?: string;
}

export class ScheduleWithAIUseCase {
  constructor(
    private eventRepository: IEventRepository,
    private aiService: IAIServicePort
  ) {}

  async execute(input: ScheduleWithAIInput): Promise<ScheduleWithAIResult> {
    if (!input.text?.trim()) {
      return { success: false, error: "Text is required" };
    }

    if (!input.userId) {
      return { success: false, error: "User ID is required" };
    }

    try {
      const intent = await this.aiService.parseNaturalLanguage(input.text);

      if (!intent) {
        return { success: false, error: "Could not understand the request" };
      }

      if (intent.confidence < 0.5) {
        return { success: false, error: `Low confidence: ${Math.round(intent.confidence * 100)}%` };
      }

      return { success: true, event: intent };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to parse text",
      };
    }
  }
}

export interface ManageFocusInput {
  events: { startTime: number; endTime?: number; system?: string }[];
  date: Date;
  workingHours?: { start: number; end: number };
}

export interface FocusMetrics {
  healthHours: number;
  workHours: number;
  relationshipsHours: number;
  bufferHours: number;
  totalScheduledHours: number;
  focusScore: number;
}

export interface DailyBuffer {
  startTime: number;
  endTime: number;
  reason: string;
}

export interface ManageFocusResult {
  metrics: FocusMetrics;
  buffers: DailyBuffer[];
  suggestions: string[];
}

export class ManageFocusUseCase {
  constructor() {}

  execute(input: ManageFocusInput): ManageFocusResult {
    const { events, date, workingHours } = input;
    const defaultWorkingHours = workingHours || { start: 9, end: 17 };

    const dayStart = new Date(date);
    dayStart.setHours(defaultWorkingHours.start, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(defaultWorkingHours.end, 0, 0, 0);

    let healthHours = 0;
    let workHours = 0;
    let relationshipsHours = 0;
    let totalScheduledHours = 0;

    for (const event of events) {
      if (!event.endTime) continue;
      const duration = (event.endTime - event.startTime) / 3600000;
      totalScheduledHours += duration;

      switch (event.system) {
        case "Health":
          healthHours += duration;
          break;
        case "Work":
          workHours += duration;
          break;
        case "Relationships":
          relationshipsHours += duration;
          break;
      }
    }

    const availableHours = defaultWorkingHours.end - defaultWorkingHours.start;
    const bufferHours = Math.max(0, availableHours - totalScheduledHours);
    const focusScore = availableHours > 0
      ? Math.round((totalScheduledHours / availableHours) * 100)
      : 0;

    const buffers: DailyBuffer[] = [];

    if (bufferHours > 0 && workHours < 4) {
      buffers.push({
        startTime: dayEnd.getTime() - bufferHours * 3600000,
        endTime: dayEnd.getTime(),
        reason: "Recovery time",
      });
    }

    const suggestions: string[] = [];
    if (workHours > 6) {
      suggestions.push("Consider splitting work sessions with short breaks");
    }
    if (healthHours < 1 && totalScheduledHours > 4) {
      suggestions.push("Add a health activity to balance your schedule");
    }

    return {
      metrics: {
        healthHours,
        workHours,
        relationshipsHours,
        bufferHours,
        totalScheduledHours,
        focusScore,
      },
      buffers,
      suggestions,
    };
  }
}