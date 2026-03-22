"use client";

import { format } from "date-fns";
import { Clock, AlertTriangle, Zap, Coffee, Car } from "lucide-react";

export interface BufferBlock {
  id: string;
  beforeEventId?: string;
  afterEventId?: string;
  startTime: number;
  endTime: number;
  duration: number;
  purpose: "transition" | "recovery" | "buffer" | "travel";
  riskReduction: number;
  recommended: boolean;
}

export interface EventWithBuffer {
  id: string;
  title: string;
  system: "Health" | "Work" | "Relationships";
  startTime: number;
  endTime: number;
  isBuffer: boolean;
  bufferPurpose?: string;
  bufferId?: string;
  predictedEndTime?: number;
  delayRisk?: "low" | "medium" | "high";
}

interface BufferBlocksProps {
  buffers: BufferBlock[];
  onBufferClick?: (buffer: BufferBlock) => void;
  compact?: boolean;
}

const BUFFER_CONFIG = {
  transition: {
    icon: Clock,
    color: "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600",
    textColor: "text-gray-600 dark:text-gray-300",
    bgPattern: "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(107, 114, 128, 0.1) 4px, rgba(107, 114, 128, 0.1) 8px)",
    label: "Transition",
  },
  recovery: {
    icon: Coffee,
    color: "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700",
    textColor: "text-amber-700 dark:text-amber-300",
    bgPattern: "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(245, 158, 11, 0.1) 4px, rgba(245, 158, 11, 0.1) 8px)",
    label: "Recovery",
  },
  buffer: {
    icon: Zap,
    color: "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700",
    textColor: "text-blue-700 dark:text-blue-300",
    bgPattern: "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(59, 130, 246, 0.1) 4px, rgba(59, 130, 246, 0.1) 8px)",
    label: "Buffer",
  },
  travel: {
    icon: Car,
    color: "bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700",
    textColor: "text-purple-700 dark:text-purple-300",
    bgPattern: "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(147, 51, 234, 0.1) 4px, rgba(147, 51, 234, 0.1) 8px)",
    label: "Travel",
  },
};

export function BufferBlockComponent({ buffer, onClick, compact }: { buffer: BufferBlock; onClick?: () => void; compact?: boolean }) {
  const config = BUFFER_CONFIG[buffer.purpose] || BUFFER_CONFIG.buffer;
  const Icon = config.icon;
  const durationMins = buffer.duration;
  const heightPercent = Math.max(50, durationMins * 2);

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`${config.color} ${config.bgPattern} border-l-4 ${buffer.recommended ? "border-l-yellow-500" : "border-l-gray-400"} p-1 px-2 rounded-r text-xs ${config.textColor} cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1`}
        title={`${config.label}: ${durationMins}min${buffer.recommended ? " (recommended)" : ""}`}
      >
        <Icon className="w-3 h-3" />
        <span>{durationMins}m</span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`${config.color} ${config.bgPattern} border ${buffer.recommended ? "border-yellow-400 dark:border-yellow-600 shadow-sm" : "border-gray-300 dark:border-gray-600"} rounded-lg p-2 cursor-pointer hover:shadow-md transition-all ${buffer.recommended ? "ring-2 ring-yellow-400/30" : ""}`}
      style={{ minHeight: `${heightPercent}px` }}
    >
      <div className="flex items-start gap-2">
        <Icon className={`w-4 h-4 ${config.textColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-medium ${config.textColor}`}>{config.label}</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {durationMins} min
          </div>
          {buffer.recommended && (
            <div className="flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3 text-yellow-500" />
              <span className="text-xs text-yellow-600 dark:text-yellow-400">Recommended</span>
            </div>
          )}
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {format(new Date(buffer.startTime), "HH:mm")} - {format(new Date(buffer.endTime), "HH:mm")}
          </div>
          {buffer.riskReduction > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Risk reduction: {Math.round(buffer.riskReduction * 100)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function BufferBlocks({ buffers, onBufferClick, compact = false }: BufferBlocksProps) {
  if (buffers.length === 0) return null;

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {buffers.map((buffer) => (
          <BufferBlockComponent
            key={buffer.id}
            buffer={buffer}
            onClick={() => onBufferClick?.(buffer)}
            compact
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Buffer Blocks
        </h4>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {buffers.length} blocks, {buffers.reduce((sum, b) => sum + b.duration, 0)}min total
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {buffers.map((buffer) => (
          <BufferBlockComponent
            key={buffer.id}
            buffer={buffer}
            onClick={() => onBufferClick?.(buffer)}
          />
        ))}
      </div>
    </div>
  );
}

interface TimelineWithBuffersProps {
  events: EventWithBuffer[];
  buffers: BufferBlock[];
  dayStart?: number;
  dayEnd?: number;
}

export function TimelineWithBuffers({ events, buffers, dayStart = 6 * 60, dayEnd = 22 * 60 }: TimelineWithBuffersProps) {
  const bufferMap = new Map<string, BufferBlock[]>();
  
  buffers.forEach(buffer => {
    if (buffer.afterEventId) {
      if (!bufferMap.has(buffer.afterEventId)) {
        bufferMap.set(buffer.afterEventId, []);
      }
      bufferMap.get(buffer.afterEventId)!.push(buffer);
    }
    if (buffer.beforeEventId) {
      if (!bufferMap.has(buffer.beforeEventId)) {
        bufferMap.set(buffer.beforeEventId, []);
      }
      bufferMap.get(buffer.beforeEventId)!.push(buffer);
    }
  });

  const sortedEvents = [...events].sort((a, b) => a.startTime - b.startTime);
  const totalMinutes = dayEnd - dayStart;

  const getTopPercent = (time: number) => {
    const date = new Date(time);
    const minutes = date.getHours() * 60 + date.getMinutes();
    return Math.max(0, ((minutes - dayStart) / totalMinutes) * 100);
  };

  const getHeightPercent = (start: number, end: number) => {
    const startMins = new Date(start).getHours() * 60 + new Date(start).getMinutes();
    const endMins = new Date(end).getHours() * 60 + new Date(end).getMinutes();
    return Math.max(2, ((endMins - startMins) / totalMinutes) * 100);
  };

  const SYSTEM_STYLES = {
    Health: "bg-green-500 border-green-600",
    Work: "bg-blue-500 border-blue-600",
    Relationships: "bg-purple-500 border-purple-600",
  };

  return (
    <div className="relative h-full">
      <div className="absolute inset-0 flex flex-col">
        {Array.from({ length: Math.ceil(totalMinutes / 60) }).map((_, i) => {
          const hour = dayStart / 60 + i;
          return (
            <div key={i} className="flex-1 border-t border-gray-200 dark:border-gray-700 relative">
              <span className="absolute -top-3 left-0 text-xs text-gray-500 dark:text-gray-400">
                {Math.floor(hour)}:00
              </span>
            </div>
          );
        })}
      </div>

      <div className="absolute inset-0">
        {sortedEvents.map((event) => {
          const buffers = bufferMap.get(event.id) || [];
          const top = getTopPercent(event.startTime);
          const height = getHeightPercent(event.startTime, event.predictedEndTime || event.endTime);

          return (
            <div
              key={event.id}
              className="absolute left-2 right-2"
              style={{ top: `${top}%`, height: `${height}%` }}
            >
              <div className={`${SYSTEM_STYLES[event.system]} border-l-4 rounded-md p-2 h-full shadow-sm ${event.delayRisk === "high" ? "ring-2 ring-red-400" : ""}`}>
                <div className="text-white text-sm font-medium truncate">
                  {event.title}
                </div>
                <div className="text-white/80 text-xs">
                  {format(new Date(event.startTime), "HH:mm")} - {format(new Date(event.predictedEndTime || event.endTime), "HH:mm")}
                </div>
                {event.delayRisk && event.delayRisk !== "low" && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3 h-3 text-yellow-200" />
                    <span className="text-xs text-white/90">
                      {event.delayRisk === "high" ? "High" : "Medium"} risk
                    </span>
                  </div>
                )}
              </div>

              {buffers.map((buffer) => {
                const bufferTop = getTopPercent(buffer.startTime);
                const bufferHeight = getHeightPercent(buffer.startTime, buffer.endTime);
                const config = BUFFER_CONFIG[buffer.purpose];

                return (
                  <div
                    key={buffer.id}
                    className={`absolute left-0 right-0 ${config?.bgPattern || ""}`}
                    style={{ top: `${bufferTop}%`, height: `${bufferHeight}%` }}
                  >
                    <div className={`${config?.color || "bg-gray-100"} border ${buffer.recommended ? "border-yellow-400" : "border-gray-300"} rounded p-1 h-full`}>
                      <div className={`text-xs font-medium ${config?.textColor || "text-gray-600"}`}>
                        {buffer.duration}m {config?.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ScheduleAnalysisProps {
  optimizationScore: number;
  totalBufferMinutes: number;
  highRiskEvents: string[];
  recommendedBuffers: Array<{ eventTitle: string; bufferMinutes: number; reason: string }>;
}

export function ScheduleAnalysis({
  optimizationScore,
  totalBufferMinutes,
  highRiskEvents,
  recommendedBuffers,
}: ScheduleAnalysisProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/30";
    if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900/30";
    return "bg-red-100 dark:bg-red-900/30";
  };

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-lg ${getScoreBg(optimizationScore)}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Schedule Optimization Score
          </span>
          <span className={`text-2xl font-bold ${getScoreColor(optimizationScore)}`}>
            {optimizationScore}%
          </span>
        </div>
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          {optimizationScore >= 80
            ? "Excellent! Your schedule has good buffer coverage."
            : optimizationScore >= 60
            ? "Good schedule, but consider adding more buffers."
            : "Schedule needs optimization. High risk of delays."}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {totalBufferMinutes}
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300">
            Total buffer minutes
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {recommendedBuffers.length}
          </div>
          <div className="text-xs text-amber-700 dark:text-amber-300">
            Recommended buffers
          </div>
        </div>
      </div>

      {highRiskEvents.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-700 dark:text-red-300">
              High Risk Events
            </span>
          </div>
          <ul className="space-y-1">
            {highRiskEvents.map((title, i) => (
              <li key={i} className="text-xs text-red-600 dark:text-red-400">
                {title}
              </li>
            ))}
          </ul>
        </div>
      )}

      {recommendedBuffers.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Suggested Buffers
          </h4>
          {recommendedBuffers.map((rec, i) => (
            <div
              key={i}
              className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-gray-900 dark:text-white">
                  {rec.eventTitle}
                </span>
                <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  +{rec.bufferMinutes}min
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {rec.reason}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
