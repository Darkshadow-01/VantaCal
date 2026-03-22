"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/react";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Trophy,
  AlertCircle,
  Lightbulb,
  Calendar,
  Target,
  Zap,
  Shield
} from "lucide-react";

interface WeeklyReflection {
  weekStartDate: string;
  weekEndDate: string;
  summary: {
    totalPlanned: number;
    totalCompleted: number;
    totalMissed: number;
    completionRate: number;
  };
  systemBreakdown: {
    health: { planned: number; completed: number; rate: number; trend: "up" | "down" | "stable" };
    work: { planned: number; completed: number; rate: number; trend: "up" | "down" | "stable" };
    relationships: { planned: number; completed: number; rate: number; trend: "up" | "down" | "stable" };
  };
  wins: Array<{ title: string; system: string; description: string }>;
  missedEvents: Array<{ title: string; system: string; reason?: string; rescheduled: boolean }>;
  patterns: Array<{ type: string; description: string; confidence: number; actionableStep: string }>;
  insights: string[];
  systemBalance: {
    score: number;
    grade: "A" | "B" | "C" | "D" | "F";
    analysis: string;
    recommendation: string;
  };
  habitProgress: Array<{ habit: string; system: string; currentStreak: number; longestStreak: number; status: string }>;
  nextWeekRecommendations: Array<{ system: string; action: string; priority: string }>;
}

const SYSTEM_COLORS = {
  Health: { bg: "bg-green-500", light: "bg-green-50 dark:bg-green-900/20", border: "border-green-500", text: "text-green-700" },
  Work: { bg: "bg-blue-500", light: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-500", text: "text-blue-700" },
  Relationships: { bg: "bg-purple-500", light: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-500", text: "text-purple-700" },
};

export function ReflectionDashboard() {
  const { userId } = useAuth();
  const [reflection, setReflection] = useState<WeeklyReflection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReflection = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/reflection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setReflection(data.reflection);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to fetch reflection");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReflection();
  }, [userId]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "down": return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A": return "text-green-600 bg-green-100 dark:bg-green-900/30";
      case "B": return "text-blue-600 bg-blue-100 dark:bg-blue-900/30";
      case "C": return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30";
      case "D": return "text-orange-600 bg-orange-100 dark:bg-orange-900/30";
      default: return "text-red-600 bg-red-100 dark:bg-red-900/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "building": return <Zap className="w-4 h-4 text-orange-500" />;
      case "maintaining": return <Shield className="w-4 h-4 text-green-500" />;
      case "at_risk": return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  if (!userId) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-purple-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Weekly Reflection
            </h2>
            {reflection && (
              <p className="text-sm text-gray-500">
                {new Date(reflection.weekStartDate).toLocaleDateString()} - {new Date(reflection.weekEndDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={fetchReflection}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Analyzing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {reflection && (
        <>
          {/* Overall Score */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* System Balance Score */}
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5" />
                <span className="font-medium">System Balance</span>
              </div>
              <div className="flex items-center gap-4">
                <div className={`text-5xl font-bold ${getGradeColor(reflection.systemBalance.grade)} bg-white/20 rounded-lg w-20 h-20 flex items-center justify-center`}>
                  {reflection.systemBalance.grade}
                </div>
                <div>
                  <div className="text-3xl font-bold">{reflection.systemBalance.score}</div>
                  <div className="text-sm opacity-80">out of 100</div>
                </div>
              </div>
              <p className="mt-4 text-sm opacity-90">{reflection.systemBalance.analysis}</p>
            </div>

            {/* Completion Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-gray-900 dark:text-white">Completion</span>
              </div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {reflection.summary.completionRate}%
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-500">{reflection.summary.totalCompleted} completed</span>
                <span className="text-red-500">{reflection.summary.totalMissed} missed</span>
              </div>
            </div>

            {/* Next Week Priority */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <span className="font-medium text-gray-900 dark:text-white">Top Priority</span>
              </div>
              {reflection.nextWeekRecommendations[0] ? (
                <>
                  <div className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${
                    SYSTEM_COLORS[reflection.nextWeekRecommendations[0].system as keyof typeof SYSTEM_COLORS]?.bg
                  } text-white`}>
                    {reflection.nextWeekRecommendations[0].system}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {reflection.nextWeekRecommendations[0].action}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500">No specific priority</p>
              )}
            </div>
          </div>

          {/* System Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              System Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(["health", "work", "relationships"] as const).map((system) => {
                const data = reflection.systemBreakdown[system];
                const colors = SYSTEM_COLORS[system === "relationships" ? "Relationships" : system.charAt(0).toUpperCase() + system.slice(1) as keyof typeof SYSTEM_COLORS];
                
                return (
                  <div key={system} className={`p-4 rounded-lg ${colors.light} border ${colors.border}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${colors.bg} text-white capitalize`}>
                        {system}
                      </span>
                      {getTrendIcon(data.trend)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Completion</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{data.rate}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors.bg} transition-all`}
                          style={{ width: `${data.rate}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{data.completed}/{data.planned} events</span>
                        <span className="capitalize">{data.trend}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wins & Missed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wins */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Wins</h3>
              </div>
              {reflection.wins.length > 0 ? (
                <div className="space-y-3">
                  {reflection.wins.map((win, i) => {
                    const colors = SYSTEM_COLORS[win.system as keyof typeof SYSTEM_COLORS];
                    return (
                      <div key={i} className={`p-3 rounded-lg ${colors.light} border ${colors.border}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} text-white`}>
                            {win.system}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{win.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{win.description}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No wins recorded this week</p>
              )}
            </div>

            {/* Missed Events */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Missed Events</h3>
              </div>
              {reflection.missedEvents.length > 0 ? (
                <div className="space-y-3">
                  {reflection.missedEvents.slice(0, 4).map((missed, i) => {
                    const colors = SYSTEM_COLORS[missed.system as keyof typeof SYSTEM_COLORS];
                    return (
                      <div key={i} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{missed.title}</p>
                          {missed.rescheduled && (
                            <span className="text-xs text-green-600">Rescheduled</span>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} text-white`}>
                          {missed.system}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No missed events!</p>
              )}
            </div>
          </div>

          {/* Insights */}
          {reflection.insights.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Insights</h3>
              </div>
              <div className="space-y-2">
                {reflection.insights.map((insight, i) => (
                  <p key={i} className="text-sm text-gray-700 dark:text-gray-300">
                    • {insight}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Habit Progress */}
          {reflection.habitProgress.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Habit Progress</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reflection.habitProgress.slice(0, 6).map((habit, i) => {
                  const colors = SYSTEM_COLORS[habit.system as keyof typeof SYSTEM_COLORS];
                  return (
                    <div key={i} className={`p-4 rounded-lg ${colors.light} border ${colors.border}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{habit.habit}</span>
                        {getStatusIcon(habit.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">Streak:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{habit.currentStreak} days</span>
                        <span className="text-gray-400">Best: {habit.longestStreak}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {reflection.nextWeekRecommendations.length > 0 && (
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Next Week Recommendations</h3>
              <div className="space-y-3">
                {reflection.nextWeekRecommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className={`w-2 h-2 rounded-full mt-2 ${
                      rec.priority === "high" ? "bg-red-300" :
                      rec.priority === "medium" ? "bg-yellow-300" : "bg-white/50"
                    }`} />
                    <div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium bg-white/20 mr-2`}>
                        {rec.system}
                      </span>
                      <span className="text-sm">{rec.action}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!reflection && !loading && (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Click &quot;Refresh&quot; to generate your weekly reflection</p>
        </div>
      )}
    </div>
  );
}
