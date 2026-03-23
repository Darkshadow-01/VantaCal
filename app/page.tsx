"use client";

import { useState } from "react";
import { Sidebar, Topbar, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { VanCal } from "@/components/Calendar";
import { Sparkles, TrendingUp, Clock, CheckCircle } from "lucide-react";

const SYSTEM_COLORS = {
  Health: {
    bg: "bg-green-500",
    bgLight: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-500",
    text: "text-green-700 dark:text-green-300",
  },
  Work: {
    bg: "bg-blue-500",
    bgLight: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-500",
    text: "text-blue-700 dark:text-blue-300",
  },
  Relationships: {
    bg: "bg-purple-500",
    bgLight: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-500",
    text: "text-purple-700 dark:text-purple-300",
  },
};

export default function Home() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<"daily" | "weekly" | "monthly" | "yearly">("weekly");

  return (
    <div className="flex h-screen bg-background dark:bg-[#1a1517]">
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar
          currentDate={currentDate}
          currentView={currentView}
          onViewChange={setCurrentView}
          onDateChange={setCurrentDate}
        />

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Calendar */}
          <main className="flex-1 overflow-auto bg-background dark:bg-[#1a1517]">
            <VanCal />
          </main>

          {/* Right Sidebar - AI Insights */}
          <aside className="w-80 bg-card dark:bg-[#3a3436] border-l border-border overflow-y-auto p-6 space-y-6">
            {/* AI Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Schedule Score</p>
                      <p className="text-xs text-muted-foreground">Optimization</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-foreground">85%</span>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Your schedule is well-balanced with good buffer coverage between activities.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* System Balance */}
            <Card>
              <CardHeader>
                <CardTitle>System Balance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(SYSTEM_COLORS).map(([system, colors]) => (
                  <div key={system} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
                        <span className="font-medium text-foreground">{system}</span>
                      </div>
                      <span className="text-muted-foreground">8.5h</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colors.bg} rounded-full transition-all duration-300`}
                        style={{ width: "65%" }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Today's Focus */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Today
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Morning Yoga</p>
                    <p className="text-xs text-muted-foreground">7:00 AM - 7:30 AM</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Team Standup</p>
                    <p className="text-xs text-muted-foreground">9:00 AM - 9:30 AM</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/50 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Deep Work Session</p>
                    <p className="text-xs text-muted-foreground">10:00 AM - 12:00 PM</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-medium text-purple-600">15</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Lunch with Sarah</p>
                      <p className="text-xs text-muted-foreground">Tomorrow, 12:30 PM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-medium text-green-600">17</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Gym Workout</p>
                      <p className="text-xs text-muted-foreground">Tomorrow, 5:00 PM</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
