import { useCallback } from "react";
import { useAuth } from "@clerk/react";
import { useEvents } from "@/hooks/useEvents";
import { parseWithLLM } from "../infrastructure/llm-parser";
import type { CalendarEvent } from "@/lib/types";

export interface ParsedEventIntent {
  title: string;
  startTime: number;
  endTime: number;
  description?: string;
  location?: string;
  allDay: boolean;
  system: "Health" | "Work" | "Relationships";
  confidence: number;
}

export function useLLMScheduler(userId: string | undefined) {
  const { createEvent } = useEvents();

  const scheduleFromText = useCallback(async (text: string): Promise<ParsedEventIntent | null> => {
    if (!userId || !text.trim()) return null;

    try {
      const intent = await parseWithLLM(text);
      
      if (!intent || intent.confidence < 0.5) {
        console.warn("Low confidence parse result:", intent);
        return null;
      }

      const eventDate = new Date(intent.startTime);
      const now = Date.now();
      const newEvent = {
        id: `event-${now}-${Math.random().toString(36).substr(2, 9)}`,
        title: intent.title,
        description: intent.description,
        startTime: intent.startTime,
        endTime: intent.endTime,
        allDay: intent.allDay || false,
        calendarId: "personal",
        color: "#4F8DFD",
        type: "event",
        system: intent.system,
        location: intent.location,
        version: 1,
        updatedAt: now,
      };

      await createEvent(newEvent);

      return intent;
    } catch (error) {
      console.error("Failed to schedule from text:", error);
      return null;
    }
  }, [userId, createEvent]);

  return { scheduleFromText };
}