"use client";

import { useState, useCallback } from "react";
import { X, Mic, Send, Loader2, Calendar, Clock, Repeat, AlertCircle } from "lucide-react";
import { format, addMinutes, addDays, addWeeks, addMonths } from "date-fns";
import type { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ParsedEvent {
  title: string;
  system: "Health" | "Work" | "Relationships";
  startTime: { hour: number; minute: number; dayOfWeek?: number; dayOfMonth?: number; month?: number };
  duration: number;
  recurrence: "daily" | "weekly" | "monthly" | null;
  allDay: boolean;
  confidence: number;
  reasoning: string;
}

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: (event: Partial<CalendarEvent>) => void;
}

export function AIAssistantModal({ isOpen, onClose, onAddEvent }: AIAssistantModalProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedEvent, setParsedEvent] = useState<ParsedEvent | null>(null);
  const [isListening, setIsListening] = useState(false);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }
      if (transcript) {
        setInput(transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (err) {
      setError("Failed to start speech recognition");
    }
  }, []);

  const parseInput = async (text: string) => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setParsedEvent(null);

    try {
      const response = await fetch("/api/localAI", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent: "parse",
          input: text,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to parse input");
      }

      setParsedEvent(data.result as ParsedEvent);
      
      if (data.metadata?.warning) {
        console.warn("AI parse warning:", data.metadata.warning);
      }
    } catch (err) {
      console.error("Parse error:", err);
      setError(err instanceof Error ? err.message : "Failed to parse input. Try typing a simpler command.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    parseInput(input);
  };

  const handleAddToCalendar = () => {
    if (!parsedEvent) return;

    const now = new Date();
    let eventStart: Date;

    if (parsedEvent.startTime.dayOfWeek !== undefined) {
      const daysUntil = (parsedEvent.startTime.dayOfWeek - now.getDay() + 7) % 7 || 7;
      eventStart = addDays(now, daysUntil);
      eventStart.setHours(parsedEvent.startTime.hour, parsedEvent.startTime.minute, 0, 0);
    } else if (parsedEvent.startTime.dayOfMonth) {
      eventStart = new Date(now.getFullYear(), now.getMonth(), parsedEvent.startTime.dayOfMonth, parsedEvent.startTime.hour, parsedEvent.startTime.minute);
    } else {
      eventStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, parsedEvent.startTime.hour, parsedEvent.startTime.minute);
    }

    const eventEnd = addMinutes(eventStart, parsedEvent.duration);

    const event: Partial<CalendarEvent> = {
      id: `ai-${Date.now()}`,
      title: parsedEvent.title,
      system: parsedEvent.system,
      startTime: eventStart.getTime(),
      endTime: eventEnd.getTime(),
      allDay: parsedEvent.allDay,
      type: "event",
      calendarId: "personal",
      color: parsedEvent.system === "Health" ? "#3BA55D" : parsedEvent.system === "Work" ? "#5B8DEF" : "#EC4899",
    };

    if (parsedEvent.recurrence) {
      event.recurrence = { type: parsedEvent.recurrence };
    }

    onAddEvent(event);
    handleClose();
  };

  const handleClose = () => {
    setInput("");
    setParsedEvent(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const systemColors = {
    Health: "bg-green-500",
    Work: "bg-blue-500",
    Relationships: "bg-purple-500",
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-white dark:bg-[#1A1D24] rounded-xl w-full max-w-lg border border-gray-200 dark:border-[#333] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#333]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#5B8DEF] to-[#8B5CF6] rounded-lg flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h2>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 dark:hover:bg-[#252830] rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., Meeting with John tomorrow at 3pm"
                className="w-full px-4 py-3 pr-12 bg-gray-100 dark:bg-[#252830] border border-transparent rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-[#5B8DEF]"
              />
              <button
                type="button"
                onClick={startListening}
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors",
                  isListening ? "bg-red-500 text-white animate-pulse" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-[#5B8DEF] text-white rounded-lg hover:bg-[#4A7EDE] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {parsedEvent && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-[#252830] rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className={cn("px-2 py-0.5 rounded text-xs text-white", systemColors[parsedEvent.system])}>
                    {parsedEvent.system}
                  </span>
                  <span className="text-xs text-gray-500">
                    Confidence: {Math.round(parsedEvent.confidence * 100)}%
                  </span>
                </div>

                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{parsedEvent.title}</h3>

                <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {parsedEvent.allDay ? "All day" : `${parsedEvent.startTime.hour.toString().padStart(2, '0')}:${parsedEvent.startTime.minute.toString().padStart(2, '0')}`}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {parsedEvent.duration} min
                  </div>
                  {parsedEvent.recurrence && (
                    <div className="flex items-center gap-1">
                      <Repeat className="w-4 h-4" />
                      {parsedEvent.recurrence}
                    </div>
                  )}
                </div>

                {parsedEvent.reasoning && (
                  <p className="text-xs text-gray-500 italic">{parsedEvent.reasoning}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddToCalendar}
                  className="flex-1 px-4 py-2 bg-[#5B8DEF] text-white rounded-lg hover:bg-[#4A7EDE] transition-colors"
                >
                  Add to Calendar
                </button>
                <button
                  onClick={() => setParsedEvent(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-[#333] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252830] transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}