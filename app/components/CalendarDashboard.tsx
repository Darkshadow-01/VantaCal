"use client";

import { useAuth } from "@clerk/react";
import { WeeklyCalendar } from "./WeeklyCalendar";
import { MiniCalendar } from "./MiniCalendar";
import { QuickAddEvent } from "./QuickAddEvent";
import { SystemBalance } from "./SystemBalance";
import { UpcomingEvents } from "./UpcomingEvents";

export function CalendarDashboard() {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 dark:text-gray-400">
          Please sign in to view your calendar
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Add */}
      <QuickAddEvent />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Mini Calendar */}
          <MiniCalendar />
          
          {/* System Balance */}
          <SystemBalance />
        </div>

        {/* Main Calendar */}
        <div className="lg:col-span-3">
          <WeeklyCalendar />
        </div>
      </div>

      {/* Upcoming Events */}
      <UpcomingEvents />
    </div>
  );
}
