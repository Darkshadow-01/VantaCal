"use client";

import { useUser } from "@clerk/react";
import { Calendar, CheckCircle2, Clock, Users } from "lucide-react";
import { AgentInsights } from "@/app/components/AgentInsights";
import { NaturalLanguageParser } from "@/app/components/NaturalLanguageParser";
import { SystemBalance } from "@/app/components/SystemBalance";
import { SchedulerPanel } from "@/app/components/SchedulerPanel";
import { ReflectionDashboard } from "@/app/components/ReflectionDashboard";

export default function Dashboard() {
  const { user, isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please sign in to access the dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You need to be authenticated to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground dark:text-[#F5F1E8] mb-2">
          Welcome back, {user.firstName || "User"}!
        </h1>
        <p className="text-muted-foreground dark:text-gray-400">
          Here&apos;s your dashboard overview for today and upcoming events
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card dark:bg-[#3a3436] rounded-lg shadow-sm p-6 border border-border dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-3xl font-bold text-foreground dark:text-[#F5F1E8]">18</span>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground dark:text-gray-400">
            Upcoming Events
          </h3>
          <p className="text-xs text-muted-foreground mt-2">+3 this week</p>
        </div>

        <div className="bg-card dark:bg-[#3a3436] rounded-lg shadow-sm p-6 border border-border dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-3xl font-bold text-foreground dark:text-[#F5F1E8]">68</span>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground dark:text-gray-400">
            Completed Events
          </h3>
          <p className="text-xs text-muted-foreground mt-2">+12 this month</p>
        </div>

        <div className="bg-card dark:bg-[#3a3436] rounded-lg shadow-sm p-6 border border-border dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-3xl font-bold text-foreground dark:text-[#F5F1E8]">24h</span>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground dark:text-gray-400">
            Scheduled Time
          </h3>
          <p className="text-xs text-muted-foreground mt-2">Balanced across systems</p>
        </div>

        <div className="bg-card dark:bg-[#3a3436] rounded-lg shadow-sm p-6 border border-border dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
              <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-3xl font-bold text-foreground dark:text-[#F5F1E8]">5</span>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground dark:text-gray-400">
            Shared Calendars
          </h3>
          <p className="text-xs text-muted-foreground mt-2">Active collaborations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card dark:bg-[#3a3436] rounded-lg shadow-sm p-6 border border-border dark:border-gray-700">
          <h2 className="text-lg font-semibold text-foreground dark:text-[#F5F1E8] mb-4">
            Upcoming This Week
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 px-3 bg-background dark:bg-[#2B262C] rounded-lg border border-border dark:border-gray-700">
              <div className="flex-1">
                <p className="font-medium text-foreground dark:text-[#F5F1E8]">Team Standup</p>
                <p className="text-sm text-muted-foreground">Today at 9:00 AM</p>
              </div>
              <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full font-medium">
                30m
              </span>
            </div>
            <div className="flex items-center justify-between py-3 px-3 bg-background dark:bg-[#2B262C] rounded-lg border border-border dark:border-gray-700">
              <div className="flex-1">
                <p className="font-medium text-foreground dark:text-[#F5F1E8]">Deep Work Session</p>
                <p className="text-sm text-muted-foreground">Today at 10:00 AM</p>
              </div>
              <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full font-medium">
                2h
              </span>
            </div>
            <div className="flex items-center justify-between py-3 px-3 bg-background dark:bg-[#2B262C] rounded-lg border border-border dark:border-gray-700">
              <div className="flex-1">
                <p className="font-medium text-foreground dark:text-[#F5F1E8]">Project Planning</p>
                <p className="text-sm text-muted-foreground">Wednesday at 2:00 PM</p>
              </div>
              <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full font-medium">
                1h
              </span>
            </div>
            <div className="flex items-center justify-between py-3 px-3 bg-background dark:bg-[#2B262C] rounded-lg border border-border dark:border-gray-700">
              <div className="flex-1">
                <p className="font-medium text-foreground dark:text-[#F5F1E8]">Gym Workout</p>
                <p className="text-sm text-muted-foreground">Thursday at 5:00 PM</p>
              </div>
              <span className="px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full font-medium">
                1h
              </span>
            </div>
          </div>
        </div>

        <div className="bg-card dark:bg-[#3a3436] rounded-lg shadow-sm p-6 border border-border dark:border-gray-700">
          <h2 className="text-lg font-semibold text-foreground dark:text-[#F5F1E8] mb-4">
            Recent Activity
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 py-3 px-3 bg-background dark:bg-[#2B262C] rounded-lg border border-border dark:border-gray-700">
              <div className="w-2 h-2 mt-2 bg-green-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-sm text-foreground dark:text-[#F5F1E8]">
                  Completed &quot;Morning Yoga&quot; session
                </p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 py-3 px-3 bg-background dark:bg-[#2B262C] rounded-lg border border-border dark:border-gray-700">
              <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-sm text-foreground dark:text-[#F5F1E8]">
                  Attended &quot;Team Standup&quot; meeting
                </p>
                <p className="text-xs text-muted-foreground">Today at 9:30 AM</p>
              </div>
            </div>
            <div className="flex items-start gap-3 py-3 px-3 bg-background dark:bg-[#2B262C] rounded-lg border border-border dark:border-gray-700">
              <div className="w-2 h-2 mt-2 bg-purple-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-sm text-foreground dark:text-[#F5F1E8]">
                  Shared calendar with Sarah
                </p>
                <p className="text-xs text-muted-foreground">Yesterday at 4:15 PM</p>
              </div>
            </div>
            <div className="flex items-start gap-3 py-3 px-3 bg-background dark:bg-[#2B262C] rounded-lg border border-border dark:border-gray-700">
              <div className="w-2 h-2 mt-2 bg-orange-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-sm text-foreground dark:text-[#F5F1E8]">
                  Added 3 new recurring events
                </p>
                <p className="text-xs text-muted-foreground">2 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Add Event
        </h2>
        <NaturalLanguageParser />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <SystemBalance />
        </div>
        <div>
          <AgentInsights />
        </div>
      </div>

      <div className="mb-8">
        <SchedulerPanel />
      </div>

      <div className="mb-8">
        <ReflectionDashboard />
      </div>
    </div>
  );
}
