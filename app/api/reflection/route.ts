import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const memoryApi = api as any;

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
  habitProgress: Array<{ habit: string; system: string; currentStreak: number; longestStreak: number; status: "building" | "maintaining" | "at_risk" }>;
  nextWeekRecommendations: Array<{ system: string; action: string; priority: "high" | "medium" | "low" }>;
}

async function getWeeklyData(userId: string, startDate: Date, endDate: Date) {
  const events = await convex.query(api.events.index.getEvents, { userId }) as any[];
  const memories = await convex.query(memoryApi["memory/index"].getMemories, { userId, limit: 100 }) as any[];
  const missedTasks = await convex.query(memoryApi["memory/index"].getMissedTasks, { userId, limit: 20 }) as any[];
  const patterns = await convex.query(memoryApi["memory/index"].getPatterns, { userId }) as any[];
  const habitTrends = await convex.query(memoryApi["memory/index"].getHabitTrends, { userId }) as any[];

  const weekEvents = (events || []).filter(e => {
    const eventTime = e.startTime;
    return eventTime >= startDate.getTime() && eventTime <= endDate.getTime();
  });

  const weekMissed = (missedTasks || []).filter(m => {
    const missedTime = m.missedAt;
    return missedTime >= startDate.getTime() && missedTime <= endDate.getTime();
  });

  const previousWeekStart = new Date(startDate);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  const previousWeekEnd = new Date(endDate);
  previousWeekEnd.setDate(previousWeekEnd.getDate() - 7);

  const prevWeekEvents = (events || []).filter(e => {
    const eventTime = e.startTime;
    return eventTime >= previousWeekStart.getTime() && eventTime <= previousWeekEnd.getTime();
  });

  const prevWeekMissed = (missedTasks || []).filter(m => {
    const missedTime = m.missedAt;
    return missedTime >= previousWeekStart.getTime() && missedTime <= previousWeekEnd.getTime();
  });

  return { events: weekEvents, missed: weekMissed, patterns, memories, habitTrends, prevEvents: prevWeekEvents, prevMissed: prevWeekMissed };
}

function calculateTrend(current: number, previous: number): "up" | "down" | "stable" {
  const diff = current - previous;
  if (Math.abs(diff) < 5) return "stable";
  return diff > 0 ? "up" : "down";
}

function calculateSystemBalanceScore(breakdown: WeeklyReflection["systemBreakdown"]): { score: number; grade: WeeklyReflection["systemBalance"]["grade"]; analysis: string } {
  const healthScore = breakdown.health.rate * 0.3;
  const workScore = Math.min(breakdown.work.rate, 100) * 0.4;
  const relationshipsScore = breakdown.relationships.rate * 0.3;
  
  const totalScore = healthScore + workScore + relationshipsScore;
  
  let grade: WeeklyReflection["systemBalance"]["grade"];
  if (totalScore >= 85) grade = "A";
  else if (totalScore >= 70) grade = "B";
  else if (totalScore >= 55) grade = "C";
  else if (totalScore >= 40) grade = "D";
  else grade = "F";

  let analysis = "";
  if (breakdown.health.rate < 50) analysis += "Health activities need attention. ";
  if (breakdown.work.rate > 90) analysis += "Work is consuming too much time. ";
  if (breakdown.relationships.rate < 40) analysis += "Relationships may be neglected. ";

  return { score: Math.round(totalScore), grade, analysis: analysis || "Well balanced week!" };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, startDate: startDateStr } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    let startDate: Date;
    const endDate = new Date();

    if (startDateStr) {
      startDate = new Date(startDateStr);
    } else {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - startDate.getDay());
      startDate.setHours(0, 0, 0, 0);
    }
    endDate.setTime(startDate.getTime());
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    const { events, missed, patterns, memories, habitTrends, prevEvents, prevMissed } = await getWeeklyData(userId, startDate, endDate);

    const systemStats = (eventsData: any[], missedData: any[]) => {
      const stats: Record<string, { planned: number; completed: number }> = {
        Health: { planned: 0, completed: 0 },
        Work: { planned: 0, completed: 0 },
        Relationships: { planned: 0, completed: 0 },
      };

      eventsData.forEach(e => {
        if (stats[e.system]) {
          stats[e.system].planned++;
          if (!missedData.some((m: any) => m.eventId === e._id)) {
            stats[e.system].completed++;
          }
        }
      });

      return {
        health: stats.Health,
        work: stats.Work,
        relationships: stats.Relationships,
      };
    };

    const currentStats = systemStats(events, missed);
    const previousStats = systemStats(prevEvents, prevMissed);

    const systemBreakdown: WeeklyReflection["systemBreakdown"] = {
      health: {
        planned: currentStats.health.planned,
        completed: currentStats.health.completed,
        rate: currentStats.health.planned > 0 
          ? Math.round((currentStats.health.completed / currentStats.health.planned) * 100)
          : 100,
        trend: calculateTrend(
          currentStats.health.completed,
          previousStats.health.completed
        ),
      },
      work: {
        planned: currentStats.work.planned,
        completed: currentStats.work.completed,
        rate: currentStats.work.planned > 0
          ? Math.round((currentStats.work.completed / currentStats.work.planned) * 100)
          : 100,
        trend: calculateTrend(
          currentStats.work.completed,
          previousStats.work.completed
        ),
      },
      relationships: {
        planned: currentStats.relationships.planned,
        completed: currentStats.relationships.completed,
        rate: currentStats.relationships.planned > 0
          ? Math.round((currentStats.relationships.completed / currentStats.relationships.planned) * 100)
          : 100,
        trend: calculateTrend(
          currentStats.relationships.completed,
          previousStats.relationships.completed
        ),
      },
    };

    const totalPlanned = events.length;
    const totalMissed = missed.length;
    const totalCompleted = totalPlanned - totalMissed;
    const completionRate = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 100;

    const wins = events
      .filter(e => !missed.some((m: any) => m.eventId === e._id))
      .slice(0, 3)
      .map(e => ({
        title: e.title,
        system: e.system,
        description: `Successfully completed ${e.title} in ${e.system}`,
      }));

    const missedEvents = missed.map(m => ({
      title: m.eventTitle,
      system: m.system,
      reason: m.reason,
      rescheduled: m.wasRescheduled,
    }));

    const highConfidencePatterns = (patterns || [])
      .filter((p: any) => p.confidence >= 0.7)
      .slice(0, 5)
      .map((p: any) => ({
        type: p.patternType,
        description: p.description,
        confidence: p.confidence,
        actionableStep: p.actionableSteps[0] || "Continue monitoring",
      }));

    const weeklyMemories = (memories || []).filter((m: any) => {
      const memTime = m.createdAt;
      return memTime >= startDate.getTime() && memTime <= endDate.getTime();
    });

    const insights: string[] = [];
    if (completionRate >= 90) insights.push("Excellent week! You achieved almost all your planned events.");
    else if (completionRate >= 70) insights.push("Good week overall. Some room for improvement.");
    else insights.push("Challenging week. Consider what barriers prevented completion.");

    if (systemBreakdown.health.rate < systemBreakdown.work.rate - 20) {
      insights.push("Health activities were overshadowed by work this week.");
    }
    if (systemBreakdown.relationships.rate < 50) {
      insights.push("Relationships took a backseat. Try to prioritize quality time next week.");
    }

    const balanceScore = calculateSystemBalanceScore(systemBreakdown);

    const habitProgress = (habitTrends || []).map((h: any) => {
      let status: "building" | "maintaining" | "at_risk";
      if (h.streak === 0 && h.longestStreak > 7) status = "at_risk";
      else if (h.streak > h.longestStreak * 0.8) status = "maintaining";
      else status = "building";

      return {
        habit: h.habit,
        system: h.system,
        currentStreak: h.streak,
        longestStreak: h.longestStreak,
        status,
      };
    });

    const nextWeekRecommendations: WeeklyReflection["nextWeekRecommendations"] = [];

    if (systemBreakdown.health.rate < 70) {
      nextWeekRecommendations.push({
        system: "Health",
        action: "Schedule at least 3 health activities for next week",
        priority: "high",
      });
    }
    if (systemBreakdown.work.rate > 95) {
      nextWeekRecommendations.push({
        system: "Work",
        action: "Set boundaries - aim for 80% completion rate",
        priority: "medium",
      });
    }
    if (systemBreakdown.relationships.rate < 60) {
      nextWeekRecommendations.push({
        system: "Relationships",
        action: "Block dedicated time for family and friends",
        priority: "high",
      });
    }

    const reflection: WeeklyReflection = {
      weekStartDate: startDate.toISOString(),
      weekEndDate: endDate.toISOString(),
      summary: {
        totalPlanned,
        totalCompleted,
        totalMissed,
        completionRate,
      },
      systemBreakdown,
      wins,
      missedEvents,
      patterns: highConfidencePatterns,
      insights,
      systemBalance: {
        score: balanceScore.score,
        grade: balanceScore.grade,
        analysis: balanceScore.analysis,
        recommendation: nextWeekRecommendations[0]?.action || "Keep up the good work!",
      },
      habitProgress,
      nextWeekRecommendations,
    };

    return NextResponse.json({
      success: true,
      reflection,
    });

  } catch (error) {
    console.error("Reflection error:", error);
    return NextResponse.json(
      { error: "Failed to generate reflection" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    usage: "POST /api/reflection",
    body: {
      userId: "string (required)",
      startDate: "string (optional, ISO date for week start)"
    },
    response: {
      summary: "Weekly completion stats",
      systemBreakdown: "Health/Work/Relationships completion rates",
      systemBalance: "Overall score and grade",
      insights: "AI-generated insights",
      nextWeekRecommendations: "Prioritized action items"
    }
  });
}
