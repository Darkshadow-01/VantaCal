"use client";

import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useEncryptedEvents } from "@/lib/use-encrypted-events";
import { hasMasterKey } from "@/lib/e2ee";
import { Plus, Lock } from "lucide-react";

const SYSTEM_COLORS = {
  Health: "bg-green-500",
  Work: "bg-blue-500",
  Relationships: "bg-purple-500",
};

export function QuickAddEvent() {
  const { userId } = useAuth();
  const { createEvent } = useEncryptedEvents(userId || undefined);
  const [title, setTitle] = useState("");
  const [system, setSystem] = useState<"Health" | "Work" | "Relationships">("Work");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!hasMasterKey()) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Lock className="w-5 h-5" />
          <span className="text-sm">Unlock app to add events</span>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !userId) return;

    setIsSubmitting(true);
    try {
      const now = Date.now();
      await createEvent({
        title: title.trim(),
        startTime: now,
        endTime: now + 3600000,
        allDay: false,
        userId,
        system,
        color: SYSTEM_COLORS[system],
      });
      setTitle("");
      setIsExpanded(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
        
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quick add an event..."
          className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onFocus={() => setIsExpanded(true)}
        />

        {isExpanded && (
          <div className="flex gap-2">
            {(["Health", "Work", "Relationships"] as const).map((sys) => (
              <button
                key={sys}
                type="button"
                onClick={() => setSystem(sys)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${system === sys
                    ? `${SYSTEM_COLORS[sys]} text-white`
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  }
                `}
              >
                {sys}
              </button>
            ))}
          </div>
        )}

        {isExpanded && (
          <button
            type="submit"
            disabled={!title.trim() || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Adding..." : "Add"}
          </button>
        )}
      </form>
    </div>
  );
}
