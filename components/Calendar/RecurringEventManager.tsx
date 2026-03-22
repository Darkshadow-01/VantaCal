"use client";

import { useState } from "react";
import { format, addDays, addWeeks, addMonths, addYears } from "date-fns";
import { Calendar, Plus, X, Repeat, AlertCircle } from "lucide-react";

export interface RecurrencePattern {
  type: "daily" | "weekly" | "monthly" | "yearly" | "custom";
  interval?: number;
  daysOfWeek?: number[];
  endDate?: number;
  occurrences?: number;
  exceptions?: number[];
}

interface RecurringEventManagerProps {
  pattern?: RecurrencePattern;
  startDate: Date;
  onPatternChange: (pattern: RecurrencePattern | undefined) => void;
  onPreviewOccurrences: () => Date[];
}

const PRESET_PATTERNS: Array<{ type: "daily" | "weekly" | "monthly" | "yearly"; label: string; icon: string }> = [
  { type: "daily", label: "Daily", icon: "📅" },
  { type: "weekly", label: "Weekly", icon: "📆" },
  { type: "monthly", label: "Monthly", icon: "🗓️" },
  { type: "yearly", label: "Yearly", icon: "📆" },
];

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export function RecurringEventManager({
  pattern,
  startDate,
  onPatternChange,
  onPreviewOccurrences,
}: RecurringEventManagerProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handlePresetClick = (type: RecurrencePattern["type"]) => {
    if (type === "custom") {
      setShowAdvanced(true);
      return;
    }

    const newPattern: RecurrencePattern = {
      type,
      interval: 1,
    };

    if (type === "weekly") {
      newPattern.daysOfWeek = [startDate.getDay()];
    }

    onPatternChange(newPattern);
  };

  const handleCustomPattern = (updates: Partial<RecurrencePattern>) => {
    const newPattern: RecurrencePattern = {
      type: "custom",
      interval: 1,
      ...pattern,
      ...updates,
    };
    onPatternChange(newPattern);
  };

  const toggleDayOfWeek = (day: number) => {
    const currentDays = pattern?.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];

    handleCustomPattern({ daysOfWeek: newDays });
  };

  const generateOccurrences = (): Date[] => {
    if (!pattern) return [startDate];

    const occurrences: Date[] = [];
    const maxOccurrences = pattern.occurrences || 52;
    const endDate = pattern.endDate ? new Date(pattern.endDate) : addWeeks(startDate, 52);
    let currentDate = new Date(startDate);
    let count = 0;

    while (currentDate <= endDate && count < maxOccurrences) {
      if (pattern.type === "daily") {
        occurrences.push(new Date(currentDate));
        currentDate = addDays(currentDate, pattern.interval || 1);
        count++;
      } else if (pattern.type === "weekly") {
        if (pattern.daysOfWeek?.includes(currentDate.getDay())) {
          occurrences.push(new Date(currentDate));
          count++;
        }
        currentDate = addDays(currentDate, 1);
        
        if (currentDate.getDay() === 0 && pattern.interval && pattern.interval > 1) {
          currentDate = addWeeks(currentDate, pattern.interval - 1);
        }
      } else if (pattern.type === "monthly") {
        occurrences.push(new Date(currentDate));
        currentDate = addMonths(currentDate, pattern.interval || 1);
        count++;
      } else if (pattern.type === "yearly") {
        occurrences.push(new Date(currentDate));
        currentDate = addYears(currentDate, pattern.interval || 1);
        count++;
      }
    }

    return occurrences;
  };

  const previewOccurrences = generateOccurrences().slice(0, 10);

  if (!pattern && !showAdvanced) {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Recurrence
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_PATTERNS.map((preset) => (
            <button
              key={preset.type}
              onClick={() => handlePresetClick(preset.type)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span>{preset.icon}</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (showAdvanced || pattern?.type === "custom") {
    return (
      <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Custom Recurrence
            </span>
          </div>
          <button
            onClick={() => {
              setShowAdvanced(false);
              onPatternChange(undefined);
            }}
            className="p-1 hover:bg-purple-100 dark:hover:bg-purple-800 rounded"
          >
            <X className="w-4 h-4 text-purple-600" />
          </button>
        </div>

        {/* Repeat Pattern */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Repeat every
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="99"
              value={pattern?.interval || 1}
              onChange={(e) => handleCustomPattern({ interval: parseInt(e.target.value) || 1 })}
              className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <select
              value={pattern?.type || "daily"}
              onChange={(e) => {
                const val = e.target.value as "daily" | "weekly" | "monthly" | "yearly";
                handleCustomPattern({ type: val });
              }}
              className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="daily">day(s)</option>
              <option value="weekly">week(s)</option>
              <option value="monthly">month(s)</option>
              <option value="yearly">year(s)</option>
            </select>
          </div>
        </div>

        {/* Days of Week (for weekly) */}
        {pattern?.type === "weekly" && (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              On these days
            </label>
            <div className="flex flex-wrap gap-1">
              {WEEKDAYS.map((day) => (
                <button
                  key={day.value}
                  onClick={() => toggleDayOfWeek(day.value)}
                  className={`
                    w-10 h-10 rounded-full text-xs font-medium transition-colors
                    ${pattern.daysOfWeek?.includes(day.value)
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300"
                    }
                  `}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* End Condition */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Ends
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="endCondition"
                checked={!pattern?.endDate && !pattern?.occurrences}
                onChange={() => handleCustomPattern({ endDate: undefined, occurrences: undefined })}
                className="text-purple-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Never</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="endCondition"
                checked={!!pattern?.occurrences}
                onChange={() => handleCustomPattern({ endDate: undefined, occurrences: 10 })}
                className="text-purple-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">After</span>
              <input
                type="number"
                min="1"
                max="999"
                value={pattern?.occurrences || 10}
                onChange={(e) => handleCustomPattern({ occurrences: parseInt(e.target.value) || 10 })}
                disabled={!pattern?.occurrences}
                className="w-16 px-2 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">occurrences</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="endCondition"
                checked={!!pattern?.endDate}
                onChange={() => handleCustomPattern({ endDate: Date.now() + 365 * 24 * 60 * 60 * 1000, occurrences: undefined })}
                className="text-purple-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">On date</span>
              <input
                type="date"
                value={pattern?.endDate ? format(new Date(pattern.endDate), "yyyy-MM-dd") : ""}
                onChange={(e) => handleCustomPattern({ endDate: new Date(e.target.value).getTime(), occurrences: undefined })}
                disabled={!pattern?.endDate}
                className="px-2 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              />
            </label>
          </div>
        </div>

        {/* Preview */}
        {previewOccurrences.length > 0 && (
          <div className="pt-3 border-t border-purple-200 dark:border-purple-700">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                Next occurrences
              </span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {previewOccurrences.map((date, idx) => (
                <div
                  key={idx}
                  className="text-xs text-gray-600 dark:text-gray-400"
                >
                  {format(date, "EEE, MMM d, yyyy")}
                </div>
              ))}
              {previewOccurrences.length >= 10 && (
                <div className="text-xs text-purple-600 dark:text-purple-400">
                  + {generateOccurrences().length - 10} more occurrences
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Simple pattern display
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Recurrence
      </label>
      <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <Repeat className="w-4 h-4 text-purple-600" />
        <span className="flex-1 text-sm text-purple-700 dark:text-purple-300 capitalize">
          {pattern?.type}
          {pattern?.interval && pattern.interval > 1 && ` every ${pattern.interval}`}
          {pattern?.type === "weekly" && pattern.daysOfWeek && (
            ` on ${pattern.daysOfWeek.map(d => WEEKDAYS.find(w => w.value === d)?.label).join(", ")}`
          )}
        </span>
        <button
          onClick={() => setShowAdvanced(true)}
          className="text-xs text-purple-600 hover:text-purple-700"
        >
          Edit
        </button>
        <button
          onClick={() => onPatternChange(undefined)}
          className="p-1 hover:bg-purple-100 dark:hover:bg-purple-800 rounded"
        >
          <X className="w-4 h-4 text-purple-600" />
        </button>
      </div>
    </div>
  );
}

export function expandRecurringEvents(
  event: any,
  pattern: RecurrencePattern
): any[] {
  const events: any[] = [];
  const occurrences = generateOccurrencesFromPattern(event.startTime, pattern);

  occurrences.forEach((date) => {
    const duration = event.endTime - event.startTime;
    events.push({
      ...event,
      _id: `${event._id}-${date.getTime()}`,
      startTime: date.getTime(),
      endTime: date.getTime() + duration,
      isRecurrenceInstance: true,
      recurrenceId: event._id,
    });
  });

  return events;
}

function generateOccurrencesFromPattern(
  startTime: number,
  pattern: RecurrencePattern
): Date[] {
  const occurrences: Date[] = [];
  const startDate = new Date(startTime);
  const maxOccurrences = pattern.occurrences || 100;
  const endDate = pattern.endDate ? new Date(pattern.endDate) : addYears(startDate, 2);
  
  let currentDate = new Date(startDate);
  let count = 0;

  while (currentDate <= endDate && count < maxOccurrences) {
    switch (pattern.type) {
      case "daily":
        occurrences.push(new Date(currentDate));
        currentDate = addDays(currentDate, pattern.interval || 1);
        count++;
        break;

      case "weekly":
        if (pattern.daysOfWeek?.includes(currentDate.getDay())) {
          occurrences.push(new Date(currentDate));
          count++;
        }
        currentDate = addDays(currentDate, 1);
        break;

      case "monthly":
        occurrences.push(new Date(currentDate));
        currentDate = addMonths(currentDate, pattern.interval || 1);
        count++;
        break;

      case "yearly":
        occurrences.push(new Date(currentDate));
        currentDate = addYears(currentDate, pattern.interval || 1);
        count++;
        break;

      default:
        occurrences.push(new Date(currentDate));
        count++;
        currentDate = addDays(currentDate, 1);
    }
  }

  return occurrences;
}
