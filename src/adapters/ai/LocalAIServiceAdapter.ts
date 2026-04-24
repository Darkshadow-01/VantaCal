import type { IAIServicePort, ParsedEventIntent } from "@/src/domain/ai/interfaces/IAIServicePort";

export class LocalAIServiceAdapter implements IAIServicePort {
  async parseNaturalLanguage(text: string): Promise<ParsedEventIntent | null> {
    const lower = text.toLowerCase();

    const titleMatch = lower.match(/^(?:schedule|meeting|call|appointment|event)?\s*(?:with\s+)?(.+?)(?:\s+(?:on|at|tomorrow|today|next))?$/i);
    const title = titleMatch ? titleMatch[1] || this.extractTitle(lower) : this.extractTitle(lower);

    let startTime = Date.now();
    let endTime = startTime + 3600000;

    if (/\btomorrow\b/.test(lower)) {
      startTime += 86400000;
      endTime += 86400000;
    }

    const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1], 10);
      const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const period = timeMatch[3]?.toLowerCase();

      if (period === "pm" && hour < 12) hour += 12;
      if (period === "am" && hour === 12) hour = 0;

      const date = new Date(startTime);
      date.setHours(hour, minute, 0, 0);
      startTime = date.getTime();
      endTime = startTime + 3600000;
    }

    const durationMatch = lower.match(/for\s+(\d+)\s*(hour|hr|h|minute|min|m)/i);
    let duration = 3600000;
    if (durationMatch) {
      const value = parseInt(durationMatch[1], 10);
      const unit = durationMatch[2];
      duration = unit.startsWith("m") ? value * 60000 : value * 3600000;
      endTime = startTime + duration;
    }

    let system: "Health" | "Work" | "Relationships" = "Work";
    if (/\b(gym|exercise|workout|run|walk|health|doctor|meditat)/i.test(lower)) {
      system = "Health";
    } else if (/\b(family|friend|date|dinner|lunch|celebrat)/i.test(lower)) {
      system = "Relationships";
    }

    return {
      title,
      startTime,
      endTime,
      allDay: /\ballday\b/.test(lower),
      system,
      confidence: 0.85,
    };
  }

  private extractTitle(text: string): string {
    const words = text.split(/\s+/).slice(0, 5);
    return words.join(" ").replace(/^(schedule|meeting|event)/i, "").trim() || "New Event";
  }

  isAvailable(): boolean {
    return true;
  }
}

let aiInstance: IAIServicePort | null = null;

export function getAIServiceAdapter(): IAIServicePort {
  if (!aiInstance) {
    aiInstance = new LocalAIServiceAdapter();
  }
  return aiInstance;
}