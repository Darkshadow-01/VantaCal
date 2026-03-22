"use client";

import { useMemo } from "react";
import { format, startOfYear, endOfYear, eachMonthOfInterval, isSameYear } from "date-fns";
import { Clock, AlertTriangle, TrendingUp } from "lucide-react";
import type { EventData } from "@/lib/use-encrypted-events";
import type { BufferBlock } from "@/lib/schedulerWithBuffers";

interface YearlyViewProps {
  date: Date;
  events: EventData[];
  buffers: BufferBlock[];
  systemColors: Record<string, any>;
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: EventData, e: React.MouseEvent) => void;
}

export function YearlyView({ date, events, buffers, systemColors, onDateClick, onEventClick }: YearlyViewProps) {
  const year = date.getFullYear();
  const months = useMemo(() => {
    const yearStart = startOfYear(date);
    const yearEnd = endOfYear(date);
    return eachMonthOfInterval({ start: yearStart, end: yearEnd });
  }, [date]);

  const yearStats = useMemo(() => {
    const yearEvents = events.filter((e) => isSameYear(new Date(e.startTime), date));
    
    const byMonth = new Map<string, EventData[]>();
    months.forEach((month) => {
      const key = format(month, "yyyy-MM");
      byMonth.set(key, []);
    });

    yearEvents.forEach((event) => {
      const eventMonth = format(new Date(event.startTime), "yyyy-MM");
      if (byMonth.has(eventMonth)) {
        byMonth.get(eventMonth)!.push(event);
      }
    });

    const bySystem = {
      Health: 0,
      Work: 0,
      Relationships: 0,
    };

    yearEvents.forEach((event) => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      bySystem[event.system as keyof typeof bySystem] += hours;
    });

    const totalHours = bySystem.Health + bySystem.Work + bySystem.Relationships;

    return {
      totalEvents: yearEvents.length,
      totalHours,
      byMonth,
      bySystem,
      totalBuffers: buffers.filter((b) => isSameYear(new Date(b.startTime), date))
        .reduce((sum, b) => sum + b.duration, 0),
    };
  }, [events, buffers, months, date]);

  const getMonthStats = (month: Date) => {
    const key = format(month, "yyyy-MM");
    const monthEvents = yearStats.byMonth.get(key) || [];

    const bySystem = {
      Health: 0,
      Work: 0,
      Relationships: 0,
    };

    monthEvents.forEach((event) => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      bySystem[event.system as keyof typeof bySystem] += hours;
    });

    return {
      events: monthEvents,
      hours: bySystem,
      total: Object.values(bySystem).reduce((sum, h) => sum + h, 0),
    };
  };

  return (
    <div className="p-6">
      {/* Year Summary */}
      <div className="mb-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-6 text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-4">{year} Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-4xl font-bold">{yearStats.totalEvents}</div>
            <div className="text-sm opacity-80">Total Events</div>
          </div>
          <div>
            <div className="text-4xl font-bold">{yearStats.totalHours.toFixed(0)}</div>
            <div className="text-sm opacity-80">Total Hours</div>
          </div>
          <div>
            <div className="text-4xl font-bold">{yearStats.totalBuffers}</div>
            <div className="text-sm opacity-80">Buffer Minutes</div>
          </div>
          <div>
            <div className="text-4xl font-bold">
              {yearStats.totalHours > 0
                ? Math.round((yearStats.bySystem.Health / yearStats.totalHours) * 100)
                : 0}%
            </div>
            <div className="text-sm opacity-80">Health Focus</div>
          </div>
        </div>
      </div>

      {/* System Breakdown */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Annual Hours by System
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["Health", "Work", "Relationships"] as const).map((system) => {
            const hours = yearStats.bySystem[system];
            const percentage = yearStats.totalHours > 0 
              ? Math.round((hours / yearStats.totalHours) * 100) 
              : 0;
            
            return (
              <div
                key={system}
                className={`${systemColors[system]?.bgLight || "bg-gray-50"} rounded-lg p-4 border ${systemColors[system]?.border || "border-gray-200"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${systemColors[system]?.bg || "bg-gray-500"}`} />
                    <h4 className={`font-medium ${systemColors[system]?.text || "text-gray-700"}`}>
                      {system}
                    </h4>
                  </div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {hours.toFixed(0)}h
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                  <div
                    className={`${systemColors[system]?.bg || "bg-gray-500"} h-3 rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {percentage}% of total time
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Grid */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Monthly Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {months.map((month) => {
            const stats = getMonthStats(month);
            const monthName = format(month, "MMM");

            return (
              <div
                key={month.toISOString()}
                className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onDateClick?.(month)}
              >
                {/* Month Header */}
                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 border-b dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {format(month, "MMMM")}
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.events.length} events | {stats.total.toFixed(1)}h
                  </div>
                </div>

                {/* Hours Breakdown */}
                <div className="p-4 space-y-2">
                  {(["Health", "Work", "Relationships"] as const).map((system) => {
                    const hours = stats.hours[system];
                    if (hours === 0) return null;

                    return (
                      <div key={system} className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded px-1 -mx-1" onClick={() => onDateClick?.(month)}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${systemColors[system]?.bg || "bg-gray-500"}`} />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {system}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {hours.toFixed(1)}h
                        </span>
                      </div>
                    );
                  })}

                  {stats.events.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                      No events scheduled
                    </p>
                  )}
                </div>

                {/* Visual Bar */}
                <div className="px-4 pb-4">
                  <div className="flex h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    {(["Health", "Work", "Relationships"] as const).map((system) => {
                      const hours = stats.hours[system];
                      const percentage = stats.total > 0 ? (hours / stats.total) * 100 : 0;
                      if (percentage === 0) return null;

                      return (
                        <div
                          key={system}
                          className={`${systemColors[system]?.bg || "bg-gray-500"}`}
                          style={{ width: `${percentage}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="mt-8 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-6 h-6 text-purple-500 mt-1" />
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-3">
              AI Recommendations for {year}
            </h4>
            <div className="space-y-3">
              {yearStats.totalHours > 0 && (
                <>
                  {yearStats.bySystem.Health / yearStats.totalHours < 0.2 && (
                    <div className="flex items-start gap-2 bg-white dark:bg-gray-800 rounded-lg p-3">
                      <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Low Health Focus
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Only {Math.round((yearStats.bySystem.Health / yearStats.totalHours) * 100)}% of your time is
                          dedicated to Health. Consider allocating more time for exercise, rest, and self-care.
                        </p>
                      </div>
                    </div>
                  )}

                  {yearStats.bySystem.Relationships / yearStats.totalHours < 0.15 && (
                    <div className="flex items-start gap-2 bg-white dark:bg-gray-800 rounded-lg p-3">
                      <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Relationship Time Low
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Only {Math.round((yearStats.bySystem.Relationships / yearStats.totalHours) * 100)}% dedicated to
                          Relationships. Prioritize quality time with loved ones for better work-life balance.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex items-start gap-2 bg-white dark:bg-gray-800 rounded-lg p-3">
                <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Buffer Time Optimization
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {yearStats.totalBuffers > 0
                      ? `You have ${yearStats.totalBuffers} minutes of recommended buffer time scheduled. This will help reduce stress and improve schedule adherence.`
                      : "Consider adding buffer time between activities to reduce rush and improve schedule flexibility."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
