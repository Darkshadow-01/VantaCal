"use client";

import { useAuth } from "@clerk/react";
import {
  useMemories,
  useMissedTasks,
  useHabitTrends,
  usePatterns,
  useStoreEpisodicEvent,
  useStorePattern,
} from "@/lib/memory";
import { Brain, TrendingUp, AlertTriangle, Zap } from "lucide-react";

export function AgentInsights() {
  const { userId } = useAuth();
  const storeEpisodic = useStoreEpisodicEvent();
  const storePattern = useStorePattern();

  const memories = useMemories(userId || "", undefined, undefined, 10);
  const missedTasks = useMissedTasks(userId || "", undefined, 5);
  const habitTrends = useHabitTrends(userId || "");
  const patterns = usePatterns(userId || "", undefined, 0.7);

  if (!userId) return null;

  const weeklyCompleted = memories?.filter((m) => m.category.includes("completed")).length || 0;
  const totalMissed = missedTasks?.reduce((sum, m) => sum + m.frequency, 0) || 0;
  const activeStreaks = habitTrends?.filter((h) => h.streak > 0).length || 0;
  const highConfidencePatterns = patterns?.filter((p) => p.confidence >= 0.8) || [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-purple-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">
          AI Insights
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{weeklyCompleted}</div>
          <div className="text-xs text-gray-500">Completed</div>
        </div>
        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{totalMissed}</div>
          <div className="text-xs text-gray-500">Missed</div>
        </div>
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{activeStreaks}</div>
          <div className="text-xs text-gray-500">Active Streaks</div>
        </div>
        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{highConfidencePatterns.length}</div>
          <div className="text-xs text-gray-500">Patterns Found</div>
        </div>
      </div>

      {missedTasks && missedTasks.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Frequently Missed
            </span>
          </div>
          <div className="space-y-2">
            {missedTasks.slice(0, 3).map((task, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded"
              >
                <span className="text-gray-700 dark:text-gray-300">{task.eventTitle}</span>
                <span className="text-xs text-yellow-600">{task.frequency}x missed</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {habitTrends && habitTrends.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active Habits
            </span>
          </div>
          <div className="space-y-2">
            {habitTrends.slice(0, 3).map((habit, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm p-2 bg-orange-50 dark:bg-orange-900/20 rounded"
              >
                <span className="text-gray-700 dark:text-gray-300">{habit.habit}</span>
                <span className="text-xs text-orange-600">{habit.streak} day streak</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {highConfidencePatterns.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              High-Confidence Insights
            </span>
          </div>
          <div className="space-y-2">
            {highConfidencePatterns.slice(0, 2).map((pattern, i) => (
              <div
                key={i}
                className="text-sm p-2 bg-blue-50 dark:bg-blue-900/20 rounded"
              >
                <p className="text-gray-700 dark:text-gray-300">{pattern.insight}</p>
                {pattern.actionableSteps.length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    Action: {pattern.actionableSteps[0]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {memories && memories.length > 0 && (
        <div className="mt-4 pt-4 border-t dark:border-gray-700">
          <h4 className="text-xs font-medium text-gray-500 mb-2">Recent Memory</h4>
          <div className="space-y-1">
            {memories.slice(0, 3).map((mem) => (
              <p key={mem._id} className="text-xs text-gray-600 dark:text-gray-400">
                {mem.content}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
