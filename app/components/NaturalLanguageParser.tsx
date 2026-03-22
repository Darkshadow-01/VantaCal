"use client";

import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useEncryptedEvents } from "@/lib/use-encrypted-events";
import { hasMasterKey } from "@/lib/e2ee";
import type { EventData } from "@/lib/use-encrypted-events";
import { Sparkles, Check, AlertCircle, Loader2, Lock } from "lucide-react";

interface ParsedEvent {
  title: string;
  system: "Health" | "Work" | "Relationships";
  startTime: {
    dayOfWeek?: number;
    hour: number;
    minute: number;
    dayOfMonth?: number;
    month?: number;
  };
  duration: number;
  recurrence: string | null;
  allDay: boolean;
  confidence: number;
  reasoning: string;
}

const SYSTEM_COLORS = {
  Health: {
    bg: "bg-green-500",
    bgLight: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-500",
    text: "text-green-700 dark:text-green-300",
  },
  Work: {
    bg: "bg-blue-500",
    bgLight: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-500",
    text: "text-blue-700 dark:text-blue-300",
  },
  Relationships: {
    bg: "bg-purple-500",
    bgLight: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-500",
    text: "text-purple-700 dark:text-purple-300",
  },
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function NaturalLanguageParser() {
  const { userId } = useAuth();
  const { createEvent, isDecrypting } = useEncryptedEvents(userId);
  const isLocked = !hasMasterKey();
  
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState<ParsedEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleParse = async () => {
    if (!input.trim() || !userId) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim(), userId }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to parse");
      }
      
      setParsed(data.parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse");
      setParsed(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!parsed || !userId) return;
    
    setLoading(true);
    
    try {
      const now = new Date();
      const startTime = new Date(now);
      
      if (parsed.startTime.dayOfWeek !== undefined) {
        const currentDay = now.getDay();
        const diff = parsed.startTime.dayOfWeek - currentDay;
        startTime.setDate(now.getDate() + (diff >= 0 ? diff : diff + 7));
      }
      
      startTime.setHours(parsed.startTime.hour, parsed.startTime.minute, 0, 0);
      
      const endTime = new Date(startTime.getTime() + parsed.duration * 60 * 1000);
      
      await createEvent({
        title: parsed.title,
        startTime: startTime.getTime(),
        endTime: endTime.getTime(),
        allDay: parsed.allDay,
        userId,
        system: parsed.system,
        color: SYSTEM_COLORS[parsed.system].bg,
        recurrence: parsed.recurrence || undefined,
      });
      
      setSuccess(true);
      setInput("");
      setParsed(null);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  if (isLocked) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4">
        <div className="flex items-center justify-center gap-2 py-4 text-gray-500 dark:text-gray-400">
          <Lock className="w-5 h-5" />
          <span>Unlock the app to use Quick Add</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Quick Add with AI
        </h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Try: 'Workout every Monday at 7am' or 'Team lunch Friday at noon'"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === "Enter" && handleParse()}
          />
          <button
            onClick={handleParse}
            disabled={!input.trim() || loading}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Parse
          </button>
        </div>
        
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-300">
              Event created successfully!
            </p>
          </div>
        )}
        
        {parsed && (
          <div className={`p-4 rounded-lg border ${SYSTEM_COLORS[parsed.system].bgLight} ${SYSTEM_COLORS[parsed.system].border}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${SYSTEM_COLORS[parsed.system].bg} text-white`}>
                    {parsed.system}
                  </span>
                  <span className="text-xs text-gray-500">
                    {Math.round(parsed.confidence * 100)}% confidence
                  </span>
                </div>
                
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {parsed.title}
                </h4>
                
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>
                    <span className="font-medium">Time:</span>{" "}
                    {parsed.startTime.dayOfWeek !== undefined 
                      ? `${DAYS[parsed.startTime.dayOfWeek]}s at `
                      : "One-time at "}
                    {parsed.startTime.hour.toString().padStart(2, "0")}:
                    {parsed.startTime.minute.toString().padStart(2, "0")}
                  </p>
                  <p>
                    <span className="font-medium">Duration:</span>{" "}
                    {parsed.duration >= 60 
                      ? `${Math.floor(parsed.duration / 60)}h ${parsed.duration % 60 > 0 ? `${parsed.duration % 60}m` : ""}`
                      : `${parsed.duration}m`}
                  </p>
                  {parsed.recurrence && (
                    <p>
                      <span className="font-medium">Repeats:</span>{" "}
                      {parsed.recurrence}
                    </p>
                  )}
                </div>
                
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                  {parsed.reasoning}
                </p>
              </div>
              
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleCreateEvent}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Add Event
                </button>
                <button
                  onClick={() => setParsed(null)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p className="font-medium mb-1">Try these examples:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>&quot;Workout every Monday at 7am&quot;</li>
            <li>&quot;Team standup at 9am daily&quot;</li>
            <li>&quot;Dinner with family Friday at 6pm&quot;</li>
            <li>&quot;Doctor appointment on the 15th at 2pm&quot;</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
