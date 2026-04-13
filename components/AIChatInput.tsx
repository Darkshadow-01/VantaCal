"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@clerk/react";
import { useEvents } from "@/hooks/useEvents";
import dayjs from "dayjs";
import type { CalendarEvent } from "@/lib/types";

interface ParsedIntent {
  title: string;
  startTime: number;
  endTime: number;
  description?: string;
}

function parseNaturalLanguage(input: string): ParsedIntent | null {
  const now = new Date();
  const lowerInput = input.toLowerCase().trim();

  let date = now;
  let hasDateModifier = false;

  // Handle date modifiers
  if (lowerInput.includes("tomorrow")) {
    date = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    hasDateModifier = true;
  } else if (lowerInput.includes("today")) {
    date = now;
    hasDateModifier = true;
  } else if (lowerInput.includes("next week")) {
    date = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    hasDateModifier = true;
  } else if (lowerInput.includes("next monday")) {
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
    date = new Date(now.getTime() + daysUntilMonday * 24 * 60 * 60 * 1000);
    hasDateModifier = true;
  } else if (lowerInput.includes("monday")) {
    const dayMatch = lowerInput.match(/monday|tuesday|wednesday|thursday|friday|saturday|sunday/);
    if (dayMatch) {
      const targetDay = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].indexOf(dayMatch[0]);
      let daysUntil = targetDay - now.getDay();
      if (daysUntil <= 0) daysUntil += 7;
      date = new Date(now.getTime() + daysUntil * 24 * 60 * 60 * 1000);
      hasDateModifier = true;
    }
  }

  // If no date specified, default to tomorrow
  if (!hasDateModifier) {
    date = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }

  // Parse time
  let hour = 10; // Default 10am
  let minute = 0;

  // Match patterns like "10am", "10:30pm", "at 2pm", "at 3:30"
  const timePatterns = [
    /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
    /at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
  ];

  for (const pattern of timePatterns) {
    const match = lowerInput.match(pattern);
    if (match) {
      hour = parseInt(match[1]);
      if (match[2]) minute = parseInt(match[2]);
      
      const period = match[3]?.toLowerCase();
      if (period === "pm" && hour !== 12) hour += 12;
      if (period === "am" && hour === 12) hour = 0;
      break;
    }
  }

  // Parse duration
  let durationMinutes = 60; // Default 1 hour
  const durationMatch = lowerInput.match(/(\d+)\s*(hour|hr|minute|min)/i);
  if (durationMatch) {
    const num = parseInt(durationMatch[1]);
    if (durationMatch[2].startsWith("hour") || durationMatch[2].startsWith("hr")) {
      durationMinutes = num * 60;
    } else {
      durationMinutes = num;
    }
  }

  // Extract title - remove common phrases
  let title = lowerInput
    .replace(/(schedule|book|create|add)\s+(a\s+)?(meeting|event|appointment)\s+/i, "")
    .replace(/(for|on|at|tomorrow|today|next week|next monday)\s*[\w\s,]+/gi, "")
    .replace(/\d{1,2}(?::\d{2})?\s*(am|pm)?/gi, "")
    .replace(/\d+\s*(hour|hr|minute|min)/gi, "")
    .replace(/with\s+[\w@.\s]+/gi, "")
    .trim();

  // Capitalize title
  title = title.charAt(0).toUpperCase() + title.slice(1);

  if (!title) {
    title = "New Event";
  }

  // Set time
  date.setHours(hour, minute, 0, 0);
  const startTime = date.getTime();
  const endTime = startTime + durationMinutes * 60 * 1000;

  return {
    title,
    startTime,
    endTime,
  };
}

export function AIChatInput() {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const { userId } = useAuth();
  
  const { createEvent } = useEvents();

  const handleSubmit = async () => {
    if (!input.trim() || !userId) return;
    
    setIsProcessing(true);
    setMessage(null);

    try {
      const intent = parseNaturalLanguage(input);
      
      if (!intent) {
        setMessage({ text: "Could not understand the request. Try 'Meeting tomorrow at 10am'", type: "error" });
        return;
      }

      const eventDate = new Date(intent.startTime);
      const now = Date.now();
      const newEvent = {
        id: `event-${now}-${Math.random().toString(36).substr(2, 9)}`,
        title: intent.title,
        description: intent.description,
        startTime: intent.startTime,
        endTime: intent.endTime,
        allDay: false,
        calendarId: "personal",
        color: "#4F8DFD",
        type: "event",
        system: "Work" as const,
        version: 1,
        updatedAt: now,
      };

      await createEvent(newEvent);

      setInput("");
      setMessage({
        text: `Created "${intent.title}" for ${dayjs(intent.startTime).format("MMM D, h:mm A")}`,
        type: "success",
      });

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ text: "Failed to create event. Please try again.", type: "error" });
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='e.g., "Meeting tomorrow at 10am"'
          className="flex-1 px-3 py-2 border rounded-md bg-background text-sm"
          disabled={isProcessing}
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isProcessing}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 text-sm"
        >
          {isProcessing ? "..." : "Add"}
        </button>
      </div>
      
      {message && (
        <div className={`text-xs px-2 py-1 rounded ${
          message.type === "success" 
            ? "bg-green-100 text-green-800" 
            : "bg-red-100 text-red-800"
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

export function useAIScheduler(userId: string | undefined) {
  const { createEvent } = useEvents();
  
  const scheduleFromText = useCallback(async (text: string) => {
    const intent = parseNaturalLanguage(text);
    if (!intent || !userId) return null;

    const eventDate = new Date(intent.startTime);
    const now = Date.now();
    const newEvent = {
      id: `event-${now}-${Math.random().toString(36).substr(2, 9)}`,
      title: intent.title,
      description: intent.description,
      startTime: intent.startTime,
      endTime: intent.endTime,
      allDay: false,
      calendarId: "personal",
      color: "#4F8DFD",
      type: "event",
      system: "Work" as const,
      version: 1,
      updatedAt: now,
    };

    await createEvent(newEvent);

    return intent;
  }, [userId, createEvent]);

  return { scheduleFromText };
}
