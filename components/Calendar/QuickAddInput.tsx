"use client";

import { useState } from "react";
import { Sparkles, Calendar, Clock, Zap } from "lucide-react";

interface QuickAddInputProps {
  onParse: (result: {
    title: string;
    startTime: number;
    endTime: number;
    system: "Health" | "Work" | "Relationships";
    recurrence?: string;
  }) => void;
  systems: Array<{
    name: string;
    color: string;
  }>;
}

export function QuickAddInput({ onParse, systems }: QuickAddInputProps) {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedResult, setParsedResult] = useState<any>(null);

  const parseNaturalLanguage = async () => {
    if (!input.trim()) return;

    setIsProcessing(true);

    try {
      const result = parseInput(input);
      setParsedResult(result);
      
      if (result.isValid) {
        onParse({
          title: result.title,
          startTime: result.startTime,
          endTime: result.endTime,
          system: result.system,
          recurrence: result.recurrence,
        });
        setInput("");
        setParsedResult(null);
      }
    } catch (error) {
      console.error("Failed to parse input:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const parseInput = (text: string): any => {
    const now = new Date();
    let startTime = now.getTime();
    let endTime = startTime + 60 * 60 * 1000;
    let system: "Health" | "Work" | "Relationships" = "Work";
    let recurrence: string | undefined;
    let title = text;

    const lowerText = text.toLowerCase();

    // Detect system
    if (lowerText.includes("gym") || lowerText.includes("yoga") || lowerText.includes("run") || lowerText.includes("workout") || lowerText.includes("health")) {
      system = "Health";
    } else if (lowerText.includes("meeting") || lowerText.includes("call") || lowerText.includes("presentation") || lowerText.includes("deadline")) {
      system = "Work";
    } else if (lowerText.includes("lunch") || lowerText.includes("dinner") || lowerText.includes("date") || lowerText.includes("family")) {
      system = "Relationships";
    }

    // Detect time patterns
    const timePatterns = [
      { regex: /(\d{1,2}):(\d{2})\s*(am|pm)/i, handler: (match: RegExpMatchArray) => {
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const period = match[3].toLowerCase();
        if (period === "pm" && hours !== 12) hours += 12;
        if (period === "am" && hours === 12) hours = 0;
        
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date.getTime();
      }},
      { regex: /at\s*(\d{1,2})/i, handler: (match: RegExpMatchArray) => {
        const hours = parseInt(match[1]);
        const date = new Date();
        date.setHours(hours, 0, 0, 0);
        return date.getTime();
      }},
      { regex: /tomorrow/i, handler: () => {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        date.setHours(9, 0, 0, 0);
        return date.getTime();
      }},
      { regex: /today/i, handler: () => {
        const date = new Date();
        date.setHours(9, 0, 0, 0);
        return date.getTime();
      }},
    ];

    for (const pattern of timePatterns) {
      const match = text.match(pattern.regex);
      if (match) {
        startTime = pattern.handler(match);
        endTime = startTime + 60 * 60 * 1000;
        break;
      }
    }

    // Detect duration
    const durationMatch = text.match(/for\s*(\d+)\s*(hour|hr|h|min|m|minute)/i);
    if (durationMatch) {
      const value = parseInt(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();
      let durationMs = 0;
      
      if (unit.startsWith("h")) {
        durationMs = value * 60 * 60 * 1000;
      } else {
        durationMs = value * 60 * 1000;
      }
      
      endTime = startTime + durationMs;
    }

    // Detect recurrence
    if (lowerText.includes("every day") || lowerText.includes("daily")) {
      recurrence = "daily";
    } else if (lowerText.includes("every week") || lowerText.includes("weekly")) {
      recurrence = "weekly";
    } else if (lowerText.includes("every month") || lowerText.includes("monthly")) {
      recurrence = "monthly";
    } else if (lowerText.includes("every monday") || lowerText.includes("every tuesday") || lowerText.includes("every wednesday") || 
               lowerText.includes("every thursday") || lowerText.includes("every friday") || lowerText.includes("every saturday") ||
               lowerText.includes("every sunday")) {
      recurrence = "weekly";
    }

    // Extract title
    title = text
      .replace(/tomorrow|today|at\s*\d+|for\s*\d+\s*(hour|hr|h|min|m|minute)/gi, "")
      .replace(/every\s+(day|week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi, "")
      .replace(/gym|yoga|run|workout|meeting|call|presentation|lunch|dinner|date|family/gi, "")
      .trim();

    if (!title) {
      title = text.split(" ").slice(0, 3).join(" ");
    }

    return {
      isValid: !!title,
      title,
      startTime,
      endTime,
      system,
      recurrence,
    };
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      parseNaturalLanguage();
    }
  };

  const examplePrompts = [
    "Gym tomorrow at 7am",
    "Team meeting every Monday at 10am",
    "Lunch with Sarah for 1 hour",
  ];

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600 absolute left-3" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Quick add: Gym tomorrow at 7am..."
            className="w-full pl-10 pr-20 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={parseNaturalLanguage}
            disabled={!input.trim() || isProcessing}
            className="absolute right-2 px-4 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? (
              <span className="flex items-center gap-1">
                <Zap className="w-4 h-4 animate-pulse" />
                Parsing...
              </span>
            ) : (
              "Add"
            )}
          </button>
        </div>
      </div>

      {/* Parsed Result Preview */}
      {parsedResult && parsedResult.isValid && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-green-600 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                {parsedResult.title}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-green-600 dark:text-green-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(parsedResult.startTime).toLocaleString()}
                </span>
                <span className="px-1.5 py-0.5 bg-green-200 dark:bg-green-800 rounded text-xs">
                  {parsedResult.system}
                </span>
                {parsedResult.recurrence && (
                  <span className="px-1.5 py-0.5 bg-purple-200 dark:bg-purple-800 rounded text-xs">
                    {parsedResult.recurrence}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Example Prompts */}
      <div className="space-y-1">
        <p className="text-xs text-gray-500 dark:text-gray-400">Try these:</p>
        <div className="flex flex-wrap gap-1">
          {examplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => setInput(prompt)}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function parseNaturalLanguageToEvent(text: string) {
  const parser = new QuickAddParser();
  return parser.parse(text);
}

class QuickAddParser {
  parse(text: string) {
    let startTime = Date.now();
    let endTime = startTime + 60 * 60 * 1000;
    let system: "Health" | "Work" | "Relationships" = "Work";
    let recurrence: string | undefined;
    let title = text;
    let duration = 60;

    const lowerText = text.toLowerCase();

    // System detection
    if (lowerText.includes("gym") || lowerText.includes("yoga") || 
        lowerText.includes("run") || lowerText.includes("workout") || 
        lowerText.includes("health") || lowerText.includes("exercise")) {
      system = "Health";
      duration = 60;
    } else if (lowerText.includes("meeting") || lowerText.includes("call") || 
               lowerText.includes("presentation") || lowerText.includes("deadline") ||
               lowerText.includes("project") || lowerText.includes("work")) {
      system = "Work";
      duration = 60;
    } else if (lowerText.includes("lunch") || lowerText.includes("dinner") || 
               lowerText.includes("date") || lowerText.includes("family") ||
               lowerText.includes("friend") || lowerText.includes("birthday")) {
      system = "Relationships";
      duration = 90;
    }

    // Time patterns
    const hourMatch = text.match(/(\d{1,2})\s*(am|pm)/i);
    if (hourMatch) {
      let hours = parseInt(hourMatch[1]);
      const period = hourMatch[2].toLowerCase();
      if (period === "pm" && hours !== 12) hours += 12;
      if (period === "am" && hours === 12) hours = 0;
      
      const date = new Date();
      date.setHours(hours, 0, 0, 0);
      startTime = date.getTime();
    }

    // Duration patterns
    const durationMatch = text.match(/(\d+)\s*(hour|hr|h|min|m|minute|minutes|hours)/i);
    if (durationMatch) {
      const value = parseInt(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();
      if (unit.startsWith("h")) {
        duration = value * 60;
      } else {
        duration = value;
      }
    }

    endTime = startTime + duration * 60 * 1000;

    // Recurrence patterns
    if (lowerText.includes("every day") || lowerText.includes("daily")) {
      recurrence = "daily";
    } else if (lowerText.includes("every week") || lowerText.includes("weekly")) {
      recurrence = "weekly";
    } else if (lowerText.includes("every month") || lowerText.includes("monthly")) {
      recurrence = "monthly";
    } else if (lowerText.includes("every monday") || lowerText.includes("every tuesday") ||
               lowerText.includes("every wednesday") || lowerText.includes("every thursday") ||
               lowerText.includes("every friday") || lowerText.includes("every saturday") ||
               lowerText.includes("every sunday")) {
      recurrence = "weekly";
    }

    // Clean title
    title = title
      .replace(/\d{1,2}\s*(am|pm)/gi, "")
      .replace(/\d+\s*(hour|hr|h|min|m|minute|minutes|hours)/gi, "")
      .replace(/(every|tomorrow|today|at|for)\s*/gi, "")
      .replace(/(daily|weekly|monthly|gym|yoga|run|workout|meeting|call|lunch|dinner)/gi, "")
      .trim();

    return {
      title: title || "New Event",
      startTime,
      endTime,
      system,
      recurrence,
    };
  }
}
