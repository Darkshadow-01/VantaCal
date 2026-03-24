"use client";

import { useState } from "react";
import { useAuth } from "@clerk/react";
import { Sidebar, Topbar, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { VanCal } from "@/components/Calendar";
import { Sparkles, TrendingUp, Clock, CheckCircle, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

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

function LandingPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-[#2B262C] flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted dark:bg-gray-800 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            AI-powered life balance calendar
          </div>
          <h1 className="text-5xl font-bold text-foreground dark:text-[#F5F1E8] leading-tight text-balance">
            Balance your life across every system
          </h1>
          <p className="text-lg text-muted-foreground dark:text-gray-400 leading-relaxed text-pretty">
            VanCal helps you manage Health, Work, and Relationships in one unified calendar with smart buffers, AI insights, and encrypted event storage.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-in"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/sign-in"
              className="px-6 py-3 text-muted-foreground hover:text-foreground dark:hover:text-[#F5F1E8] transition-colors font-medium"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 border-t border-border dark:border-gray-800">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Calendar className="w-6 h-6" />,
              title: "Systemic Calendar",
              desc: "Organize events into Health, Work, and Relationships for true life balance awareness.",
            },
            {
              icon: <Sparkles className="w-6 h-6" />,
              title: "AI Insights",
              desc: "Get schedule optimization scores and smart suggestions to improve your daily flow.",
            },
            {
              icon: <Clock className="w-6 h-6" />,
              title: "Smart Buffers",
              desc: "Automatically add recovery and travel buffers between events to prevent burnout.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl border border-border dark:border-gray-800 bg-card dark:bg-[#3a3436] space-y-3"
            >
              <div className="w-10 h-10 rounded-lg bg-muted dark:bg-gray-800 flex items-center justify-center text-foreground dark:text-[#F5F1E8]">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-foreground dark:text-[#F5F1E8]">{feature.title}</h3>
              <p className="text-sm text-muted-foreground dark:text-gray-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function CalendarApp() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<"daily" | "weekly" | "monthly" | "yearly">("weekly");

  return (
    <div className="flex h-[calc(100vh-65px)] bg-background dark:bg-[#1a1517]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          currentDate={currentDate}
          currentView={currentView}
          onViewChange={setCurrentView}
          onDateChange={setCurrentDate}
        />

        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-auto bg-background dark:bg-[#1a1517]">
            <VanCal />
          </main>

          <aside className="w-80 bg-card dark:bg-[#3a3436] border-l border-border overflow-y-auto p-6 space-y-6">
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
                <p className="text-sm text-muted-foreground">
                  Your schedule is well-balanced with good buffer coverage between activities.
                </p>
              </CardContent>
            </Card>

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
                      <div className={`h-full ${colors.bg} rounded-full transition-all duration-300`} style={{ width: "65%" }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Today
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { title: "Morning Yoga", time: "7:00 – 7:30 AM", done: true },
                  { title: "Team Standup", time: "9:00 – 9:30 AM", done: true },
                  { title: "Deep Work Session", time: "10:00 AM – 12:00 PM", done: false },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    {item.done
                      ? <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      : <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/40 mt-0.5 flex-shrink-0" />
                    }
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { title: "Lunch with Sarah", time: "Tomorrow, 12:30 PM", color: "bg-purple-100 dark:bg-purple-900/30", textColor: "text-purple-600", day: "25" },
                  { title: "Gym Workout", time: "Tomorrow, 5:00 PM", color: "bg-green-100 dark:bg-green-900/30", textColor: "text-green-600", day: "25" },
                  { title: "Family Dinner", time: "Friday, 7:00 PM", color: "bg-purple-100 dark:bg-purple-900/30", textColor: "text-purple-600", day: "27" },
                ].map((item) => (
                  <div key={item.title} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className={`w-8 h-8 ${item.color} rounded-lg flex items-center justify-center`}>
                      <span className={`text-xs font-medium ${item.textColor}`}>{item.day}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-[#2B262C]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <LandingPage />;
  }

  return <CalendarApp />;
}
