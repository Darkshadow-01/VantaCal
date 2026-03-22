"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@clerk/react";
import { Calendar, AlertTriangle, CheckCircle, Clock, TrendingUp } from "lucide-react";

interface ConflictCheck {
  hasConflict: boolean;
  conflicts: Array<{
    eventId: string;
    title: string;
    overlapMinutes: number;
    severity: "warning" | "blocking";
  }>;
  suggestions: string[];
}

interface ScheduleOptimization {
  balanceAnalysis: {
    health: { hours: number; percentage: number; status: string };
    work: { hours: number; percentage: number; status: string };
    relationships: { hours: number; percentage: number; status: string };
  };
  recommendations: Array<{
    type: string;
    message: string;
    priority: string;
    action?: string;
  }>;
  optimalSlots: Array<{
    startTime: number;
    endTime: number;
    system: string;
    score: number;
    reason: string;
  }>;
}

const SYSTEM_COLORS = {
  Health: { bg: "bg-green-500", light: "bg-green-50 dark:bg-green-900/20", text: "text-green-700" },
  Work: { bg: "bg-blue-500", light: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700" },
  Relationships: { bg: "bg-purple-500", light: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-700" },
};

export function SchedulerPanel() {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [optimization, setOptimization] = useState<ScheduleOptimization | null>(null);
  const [error, setError] = useState<string | null>(null);

  const optimizeSchedule = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/scheduler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "optimize_schedule",
          userId,
          date: new Date().toISOString(),
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setOptimization(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to fetch schedule optimization");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "optimal":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "low":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "high":
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Schedule Optimizer
          </h3>
        </div>
        <button
          onClick={optimizeSchedule}
          disabled={loading || !userId}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Analyzing..." : "Optimize"}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {optimization && (
        <div className="space-y-4">
          {/* System Balance */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              System Balance
            </h4>
            <div className="space-y-2">
              {(["health", "work", "relationships"] as const).map((system) => {
                const data = optimization.balanceAnalysis[system];
                const colors = SYSTEM_COLORS[system === "relationships" ? "Relationships" : system.charAt(0).toUpperCase() + system.slice(1) as keyof typeof SYSTEM_COLORS];
                
                return (
                  <div key={system} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${colors.bg}`} />
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize w-24">
                      {system}
                    </span>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors.bg} transition-all`}
                        style={{ width: `${data.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-12 text-right">
                      {data.hours}h
                    </span>
                    {getStatusIcon(data.status)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          {optimization.recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recommendations
              </h4>
              <div className="space-y-2">
                {optimization.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border ${
                      rec.priority === "high"
                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        : rec.priority === "medium"
                        ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                        : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                        rec.priority === "high" ? "text-red-500" : "text-yellow-500"
                      }`} />
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {rec.message}
                        </p>
                        {rec.action && (
                          <p className="text-xs text-gray-500 mt-1">
                            {rec.action}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optimal Slots */}
          {optimization.optimalSlots.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Best Times to Schedule
              </h4>
              <div className="space-y-2">
                {optimization.optimalSlots.slice(0, 3).map((slot, i) => {
                  const startDate = new Date(slot.startTime);
                  const colors = SYSTEM_COLORS[slot.system as keyof typeof SYSTEM_COLORS];
                  
                  return (
                    <div
                      key={i}
                      className={`p-3 rounded-lg ${colors.light} border border-gray-200 dark:border-gray-700`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors.bg} text-white`}>
                          {slot.system}
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.round(slot.score)}% optimal
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {startDate.toLocaleDateString("en-US", { weekday: "long" })} at{" "}
                        {startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{slot.reason}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {!optimization && !loading && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          Click &quot;Optimize&quot; to analyze your schedule and get personalized recommendations.
        </p>
      )}
    </div>
  );
}
