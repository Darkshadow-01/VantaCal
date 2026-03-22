"use client";

import { useMemo } from "react";
import { useAuth } from "@clerk/react";
import { useEncryptedEvents } from "@/lib/use-encrypted-events";
import { hasMasterKey } from "@/lib/e2ee";
import { Lock } from "lucide-react";

const SYSTEM_CONFIG = {
  Health: {
    color: "bg-green-500",
    bgLight: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-500",
    icon: "❤️",
    recommended: 30, // percentage
  },
  Work: {
    color: "bg-blue-500",
    bgLight: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-500",
    icon: "💼",
    recommended: 50,
  },
  Relationships: {
    color: "bg-purple-500",
    bgLight: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-500",
    icon: "👥",
    recommended: 20,
  },
};

export function SystemBalance() {
  const { userId } = useAuth();
  const { events, isDecrypting } = useEncryptedEvents(userId || undefined);

  const balance = useMemo(() => {
    if (!events || events.length === 0) {
      return {
        Health: { hours: 0, percentage: 0 },
        Work: { hours: 0, percentage: 0 },
        Relationships: { hours: 0, percentage: 0 },
      };
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyEvents = events.filter(
      (e) => new Date(e.startTime) >= weekAgo && new Date(e.startTime) <= now
    );

    const totals = {
      Health: 0,
      Work: 0,
      Relationships: 0,
    };

    weeklyEvents.forEach((event) => {
      const duration = (event.endTime - event.startTime) / (1000 * 60 * 60);
      totals[event.system] += duration;
    });

    const total = totals.Health + totals.Work + totals.Relationships;

    return {
      Health: {
        hours: Math.round(totals.Health * 10) / 10,
        percentage: total > 0 ? Math.round((totals.Health / total) * 100) : 0,
      },
      Work: {
        hours: Math.round(totals.Work * 10) / 10,
        percentage: total > 0 ? Math.round((totals.Work / total) * 100) : 0,
      },
      Relationships: {
        hours: Math.round(totals.Relationships * 10) / 10,
        percentage: total > 0 ? Math.round((totals.Relationships / total) * 100) : 0,
      },
    };
  }, [events]);

  if (!hasMasterKey()) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4 flex items-center justify-center h-48">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Unlock app to view balance</p>
        </div>
      </div>
    );
  }

  const getBalanceStatus = (system: keyof typeof SYSTEM_CONFIG) => {
    const diff = balance[system].percentage - SYSTEM_CONFIG[system].recommended;
    if (Math.abs(diff) <= 10) return "optimal";
    return diff > 0 ? "over" : "under";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
        System Balance (7 days)
      </h3>
      
      {isDecrypting && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
          Decrypting events...
        </div>
      )}
      
      {!isDecrypting && (
        <div className="space-y-4">
          {(Object.keys(SYSTEM_CONFIG) as Array<keyof typeof SYSTEM_CONFIG>).map((system) => {
            const config = SYSTEM_CONFIG[system];
            const status = getBalanceStatus(system);
            const data = balance[system];

            return (
              <div key={system}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span>{config.icon}</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {system}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {data.hours}h ({data.percentage}%)
                    </span>
                    {status === "optimal" && (
                      <span className="text-green-500 text-xs">✓</span>
                    )}
                    {status === "over" && (
                      <span className="text-yellow-500 text-xs">↑</span>
                    )}
                    {status === "under" && (
                      <span className="text-red-500 text-xs">↓</span>
                    )}
                  </div>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${config.color} transition-all duration-500`}
                    style={{ width: `${data.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">
                    Recommended: {config.recommended}%
                  </span>
                  <span className={`text-xs font-medium ${
                    status === "optimal" ? "text-green-500" :
                    status === "over" ? "text-yellow-500" : "text-red-500"
                  }`}>
                    {status === "optimal" ? "Balanced" :
                     status === "over" ? "Above target" : "Below target"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
