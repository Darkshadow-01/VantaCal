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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user.firstName || "User"}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here&apos;s an overview of your calendar activity
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">12</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Upcoming Events
          </h3>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">48</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Completed
          </h3>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">5h</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Time this week
          </h3>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">3</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Shared calendars
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Upcoming Events
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b dark:border-gray-700">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Team Meeting</p>
                <p className="text-sm text-gray-500">Today at 2:00 PM</p>
              </div>
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 text-xs rounded-full">
                1h
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b dark:border-gray-700">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Project Review</p>
                <p className="text-sm text-gray-500">Tomorrow at 10:00 AM</p>
              </div>
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 text-xs rounded-full">
                2h
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Client Call</p>
                <p className="text-sm text-gray-500">Mar 25 at 3:00 PM</p>
              </div>
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-600 text-xs rounded-full">
                30m
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm text-gray-900 dark:text-white">
                  You created &quot;Sprint Planning&quot;
                </p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="text-sm text-gray-900 dark:text-white">
                  &quot;Team Meeting&quot; completed
                </p>
                <p className="text-xs text-gray-500">Yesterday</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 bg-purple-500 rounded-full"></div>
              <div>
                <p className="text-sm text-gray-900 dark:text-white">
                  Sarah shared calendar with you
                </p>
                <p className="text-xs text-gray-500">2 days ago</p>
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
