"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/react";
import { AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { encryptData, hasMasterKey } from "@/features/encryption/service/e2ee";

const MIGRATION_KEY = "vancal-events-migrated";
const MAX_PROMPTS = 3;

interface LocalEvent {
  id: string;
  title: string;
  date: number;
  month: number;
  year: number;
  hour?: number;
  endHour?: number;
  color: string;
  type: string;
  calendarId: string;
  completed?: boolean;
  description?: string;
  location?: string;
  recurrence?: {
    type: string;
    interval: number;
  };
}

export function MigrationPrompt() {
  const { userId } = useAuth();
  const [isMigrating, setIsMigrating] = useState(false);
  const [promptCount, setPromptCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasLocalEvents, setHasLocalEvents] = useState(false);

  const createEvent = useMutation(api.events.index.createEvent);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const saved = localStorage.getItem(MIGRATION_KEY);
    if (saved) return;

    const count = parseInt(localStorage.getItem("vancal-migration-prompt-count") || "0");
    setPromptCount(count);

    try {
      const localEvents = localStorage.getItem("calendar-events");
      if (localEvents) {
        const parsed = JSON.parse(localEvents);
        setHasLocalEvents(parsed.length > 0);
      }
    } catch {
      setHasLocalEvents(false);
    }
  }, []);

  const hasMigrated = typeof window !== "undefined" && localStorage.getItem(MIGRATION_KEY);
  if (hasMigrated || !userId || !hasLocalEvents) return null;

  const shouldAutoProceed = promptCount >= MAX_PROMPTS;

  const handleMigrate = async () => {
    if (!hasMasterKey()) {
      setError("Please unlock the app first before migrating events.");
      return;
    }

    setIsMigrating(true);
    setError(null);

    try {
      const localEventsStr = localStorage.getItem("calendar-events");
      if (!localEventsStr) {
        localStorage.setItem(MIGRATION_KEY, "true");
        setIsMigrating(false);
        return;
      }

      const localEvents: LocalEvent[] = JSON.parse(localEventsStr);

      if (localEvents.length === 0) {
        localStorage.setItem(MIGRATION_KEY, "true");
        setIsMigrating(false);
        return;
      }

      let migratedCount = 0;
      const failedEvents: string[] = [];

      for (const event of localEvents) {
        try {
          const startTime = new Date(
            event.year,
            event.month,
            event.date,
            event.hour || 9,
            0,
            0
          ).getTime();
          
          const endTime = new Date(
            event.year,
            event.month,
            event.date,
            event.endHour || (event.hour || 9) + 1,
            0,
            0
          ).getTime();

          const eventData = {
            userId,
            title: event.title,
            description: event.description || "",
            startTime,
            endTime,
            allDay: !event.hour,
            system: "Work" as const,
            color: event.color || "#4F8DFD",
            recurrence: event.recurrence?.type,
            location: event.location || "",
          };

          const encrypted = await encryptData(eventData);
          
          await createEvent({
            userId,
            encryptedPayload: JSON.stringify(encrypted),
          });
          
          migratedCount++;
        } catch (eventError) {
          console.error(`Failed to migrate event "${event.title}":`, eventError);
          failedEvents.push(event.title);
        }
      }

      if (migratedCount > 0) {
        localStorage.setItem(MIGRATION_KEY, "true");
      }
      
      if (failedEvents.length > 0) {
        setError(`Failed to migrate: ${failedEvents.join(", ")}`);
      }
    } catch (err) {
      console.error("Migration failed:", err);
      setError("Migration failed. Please try again.");
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSkip = () => {
    const newCount = promptCount + 1;
    localStorage.setItem("vancal-migration-prompt-count", String(newCount));
  };

  if (shouldAutoProceed && !isMigrating) {
    handleMigrate();
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
            Upgrade Your Calendar Storage
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Your events will be encrypted and moved to your secure account. 
            This may take a few seconds.
          </p>
          {error && (
            <p className="text-xs text-red-500 mt-2">{error}</p>
          )}
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleMigrate}
              disabled={isMigrating}
              className="flex-1"
            >
              {isMigrating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Migrate <ArrowRight className="w-3 h-3 ml-1" />
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSkip}
              disabled={isMigrating}
            >
              Skip
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
