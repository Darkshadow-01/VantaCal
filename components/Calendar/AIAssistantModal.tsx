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
      color: parsedEvent.system === "Health" ? "#16A34A" : parsedEvent.system === "Work" ? "#1C1917" : "#9333EA",
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
    Health: "bg-[#16A34A]",
    Work: "bg-[var(--accent)]",
    Relationships: "bg-[#9333EA]",
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-[var(--bg-elevated)] rounded-xl w-full max-w-lg border border-[var(--border)] shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
        {/* Header - Glass with sparkle */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-gradient-to-r from-[var(--bg-secondary)] to-[var(--bg-elevated)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[var(--accent)]/10 rounded-lg flex items-center justify-center">
              <Mic className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <h2 className="text-lg font-serif tracking-tight text-[var(--text-primary)]">AI Assistant</h2>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-all duration-150 press-scale">
            <X className="w-5 h-5 text-[var(--text-muted)]" />
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
                className="w-full px-4 py-3 pr-12 bg-[var(--bg-secondary)] border border-transparent rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all"
              />
              <button
                type="button"
                onClick={startListening}
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all duration-150",
                  isListening ? "bg-[#EF4444] text-white animate-pulse" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-contrast)] rounded-lg hover-lift press-scale disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-[var(--danger-light)] rounded-lg text-[var(--danger)] text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {parsedEvent && (
            <div className="space-y-4">
              <div className="p-4 bg-[var(--bg-secondary)] rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs text-white",
                    parsedEvent.system === "Health" ? "bg-[#16A34A]" : parsedEvent.system === "Work" ? "bg-[#2563EB]" : "bg-[#9333EA]"
                  )}>
                    {parsedEvent.system}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    Confidence: {Math.round(parsedEvent.confidence * 100)}%
                  </span>
                </div>

                <h3 className="text-lg font-medium text-[var(--text-primary)]">{parsedEvent.title}</h3>

                <div className="flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
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
                  <p className="text-xs text-[var(--text-muted)] italic">{parsedEvent.reasoning}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddToCalendar}
                  className="flex-1 px-4 py-2 bg-[var(--accent)] text-[var(--accent-contrast)] rounded-lg hover-lift press-scale transition-all"
                >
                  Add to Calendar
                </button>
                <button
                  onClick={() => setParsedEvent(null)}
                  className="px-4 py-2 border border-[var(--border)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-all press-scale"
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