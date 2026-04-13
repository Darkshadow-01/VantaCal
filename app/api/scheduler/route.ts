import { NextRequest, NextResponse } from "next/server";

// NOTE: Events are now encrypted client-side using E2EE.
// This API route runs on the server and CANNOT access the browser's crypto key.
// 
// IMPORTANT: This route receives ENCRYPTED event data from Convex and cannot decrypt it.
// The functions below (checkConflicts, analyzeBalance, findOptimalSlots, etc.) that 
// access event properties (title, system, startTime, etc.) will NOT work correctly
// with encrypted events.
// 
// SOLUTIONS:
// 1. (RECOMMENDED) Decrypt events on the client before sending to this API
//    - Client calls useEncryptedEvents() to get decrypted EventData
//    - Client passes already-decrypted event data to this API
// 2. Implement server-side decryption with the master key
//    - Would require the master key to be available on the server
//    - This defeats the purpose of E2EE
//
// For now, the event-related processing is commented out/stubbed below.

interface ConflictCheck {
  hasConflict: boolean;
  conflicts: Array<{
    eventId: string;
    title: string;
    startTime: number;
    endTime: number;
    overlapMinutes: number;
    severity: "warning" | "blocking";
  }>;
  suggestions: string[];
}

interface ScheduleOptimization {
  userId: string;
  date: string;
  existingEvents: Array<{
    title: string;
    system: string;
    startTime: number;
    endTime: number;
  }>;
  balanceAnalysis: {
    health: { hours: number; percentage: number; status: "optimal" | "low" | "high" };
    work: { hours: number; percentage: number; status: "optimal" | "low" | "high" };
    relationships: { hours: number; percentage: number; status: "optimal" | "low" | "high" };
  };
  recommendations: Array<{
    type: "buffer" | "balance" | "energy" | "reschedule";
    message: string;
    priority: "high" | "medium" | "low";
    action?: string;
  }>;
  optimalSlots: Array<{
    startTime: number;
    endTime: number;
    system: "Health" | "Work" | "Relationships";
    score: number;
    reason: string;
  }>;
}

function calculateOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): number {
  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);
  return Math.max(0, (overlapEnd - overlapStart) / (1000 * 60));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function checkConflicts(
  events: any[],
  newEvent: { startTime: number; endTime: number; system: string }
): Promise<ConflictCheck> {
  const conflicts: ConflictCheck["conflicts"] = [];
  const suggestions: string[] = [];

  for (const event of events) {
    if (event.system === newEvent.system) {
      const overlap = calculateOverlap(
        newEvent.startTime,
        newEvent.endTime,
        event.startTime,
        event.endTime
      );

      if (overlap > 0) {
        conflicts.push({
          eventId: event._id,
          title: event.title,
          startTime: event.startTime,
          endTime: event.endTime,
          overlapMinutes: overlap,
          severity: overlap > 30 ? "blocking" : "warning",
        });
      }
    }
  }

  if (conflicts.length > 0) {
    const sameSystemConflicts = conflicts.filter(c => c.severity === "blocking");
    if (sameSystemConflicts.length > 0) {
      suggestions.push("Move to a different time slot to avoid conflicts within the same system.");
    }
    suggestions.push("Consider scheduling similar events on different days of the week.");
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
    suggestions,
  };
}

 
async function analyzeBalance(
  events: any[],
  missedTasks: any[]
): Promise<ScheduleOptimization["balanceAnalysis"]> {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  
  const weeklyEvents = events.filter(e => e.startTime >= weekAgo);
  
  const totals = { Health: 0, Work: 0, Relationships: 0 };
  
  weeklyEvents.forEach(event => {
    const duration = (event.endTime - event.startTime) / (1000 * 60 * 60);
    totals[event.system as keyof typeof totals] += duration;
  });

  const total = totals.Health + totals.Work + totals.Relationships;
  
  const getStatus = (hours: number, recommended: number): "optimal" | "low" | "high" => {
    const percentage = total > 0 ? (hours / total) * 100 : 0;
    if (percentage >= recommended - 10 && percentage <= recommended + 10) return "optimal";
    if (percentage < recommended) return "low";
    return "high";
  };

  return {
    health: {
      hours: Math.round(totals.Health * 10) / 10,
      percentage: total > 0 ? Math.round((totals.Health / total) * 100) : 0,
      status: getStatus(totals.Health, 30),
    },
    work: {
      hours: Math.round(totals.Work * 10) / 10,
      percentage: total > 0 ? Math.round((totals.Work / total) * 100) : 0,
      status: getStatus(totals.Work, 50),
    },
    relationships: {
      hours: Math.round(totals.Relationships * 10) / 10,
      percentage: total > 0 ? Math.round((totals.Relationships / total) * 100) : 0,
      status: getStatus(totals.Relationships, 20),
    },
  };
}

function findOptimalSlots(
  existingEvents: any[],
  system: "Health" | "Work" | "Relationships",
  date: Date
): ScheduleOptimization["optimalSlots"] {
  const slots: ScheduleOptimization["optimalSlots"] = [];
  const dayOfWeek = date.getDay();
  
  const energyPatterns: Record<number, Record<string, number>> = {
    0: { morning: 4, afternoon: 5, evening: 6 },
    1: { morning: 7, afternoon: 6, evening: 5 },
    2: { morning: 7, afternoon: 6, evening: 5 },
    3: { morning: 7, afternoon: 6, evening: 5 },
    4: { morning: 7, afternoon: 5, evening: 4 },
    5: { morning: 6, afternoon: 5, evening: 3 },
    6: { morning: 5, afternoon: 4, evening: 6 },
  };

  const systemEnergyMatch: Record<string, string[]> = {
    Health: ["morning"],
    Work: ["morning", "afternoon"],
    Relationships: ["afternoon", "evening"],
  };

  const energyTimes = energyPatterns[dayOfWeek];
  const preferredTimes = systemEnergyMatch[system] || ["morning"];

  for (const timeSlot of preferredTimes) {
      const baseHour = timeSlot === "morning" ? 7 : timeSlot === "afternoon" ? 13 : 18;
    const energyScore = energyTimes[timeSlot] / 10;

    for (let hour = baseHour; hour < baseHour + 3; hour++) {
      if (hour >= 6 && hour <= 22) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

        const hasConflict = existingEvents.some(e => {
          return (slotStart.getTime() < e.endTime && slotEnd.getTime() > e.startTime);
        });

        if (!hasConflict) {
          slots.push({
            startTime: slotStart.getTime(),
            endTime: slotEnd.getTime(),
            system,
            score: Math.round(energyScore * 100),
            reason: `${timeSlot.charAt(0).toUpperCase() + timeSlot.slice(1)} is optimal for ${system} activities on ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayOfWeek]}.`,
          });
        }
      }
    }
  }

  return slots.sort((a, b) => b.score - a.score).slice(0, 5);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, eventData, date } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    switch (action) {
      case "check_conflicts": {
        // NOTE: Events are now encrypted. This check cannot be performed server-side.
        // The client should decrypt events locally using useEncryptedEvents()
        // and perform conflict checking on the decrypted data.
        // For now, we return a stub response.
        
        return NextResponse.json({
          success: false,
          action: "check_conflicts",
          error: "Conflict checking requires decrypted event data. Please perform conflict checking on the client side after decrypting events with useEncryptedEvents().",
          note: "Events are encrypted and cannot be processed server-side",
          hasConflict: false,
          conflicts: [],
          suggestions: [
            "Decrypt events on the client using useEncryptedEvents() hook",
            "Perform conflict checking on the decrypted EventData objects",
            "Pass already-decrypted event data if you need server-side processing"
          ],
        });
      }

      case "optimize_schedule": {
        // NOTE: Events are now encrypted. Cannot analyze encrypted event data.
        // The client should decrypt events locally and pass the decrypted data to this API,
        // or implement client-side schedule optimization.
        
        const existingEvents = eventData?.existingEvents || [];
        const recommendations: ScheduleOptimization["recommendations"] = [];

        if (existingEvents.length === 0) {
          recommendations.push({
            type: "balance",
            message: "No events available for analysis.",
            priority: "medium",
            action: "Unlock the app to see your decrypted events, or pass decrypted event data to this API.",
          });
        }

        const balanceAnalysis: ScheduleOptimization["balanceAnalysis"] = existingEvents.length > 0
          ? await analyzeBalance(existingEvents, [])
          : {
              health: { hours: 0, percentage: 0, status: "low" as const },
              work: { hours: 0, percentage: 0, status: "low" as const },
              relationships: { hours: 0, percentage: 0, status: "low" as const },
            };

        const optimalSlots = findOptimalSlots(
          existingEvents,
          eventData?.system || "Work",
          date ? new Date(date) : new Date()
        );

        return NextResponse.json({
          success: true,
          action: "optimize_schedule",
          userId,
          date: date || new Date().toISOString(),
          existingEvents,
          balanceAnalysis,
          recommendations,
          optimalSlots,
        });
      }

      case "suggest_reschedule": {
        // NOTE: Events are now encrypted. Cannot access event properties server-side.
        // The client should decrypt the event locally and pass the decrypted data to this API.
        
        if (!eventData?.eventId) {
          return NextResponse.json(
            { error: "Missing eventId for reschedule suggestion" },
            { status: 400 }
          );
        }

        // Client should pass decrypted event data in eventData.decryptedEvent
        // For now, return a stub response
        return NextResponse.json({
          success: false,
          action: "suggest_reschedule",
          error: "Reschedule suggestions require decrypted event data. Please pass decrypted event data in eventData.decryptedEvent from the client.",
          note: "Events are encrypted and cannot be processed server-side",
          originalEvent: {
            id: eventData.eventId,
            title: null,
            system: null,
            startTime: null,
          },
          missedCount: 0,
          pattern: "Event data is encrypted - cannot analyze patterns server-side",
          suggestedSlots: [],
          recommendedAction: "reschedule" as const,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Scheduler error:", error);
    return NextResponse.json(
      { error: "Failed to process scheduler request" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    usage: "POST /api/scheduler",
    actions: {
      check_conflicts: {
        description: "Check for scheduling conflicts",
        body: {
          userId: "string (required)",
          action: "check_conflicts",
          eventData: {
            startTime: "number (timestamp)",
            endTime: "number (timestamp)",
            system: "Health | Work | Relationships"
          }
        }
      },
      optimize_schedule: {
        description: "Get schedule optimization recommendations",
        body: {
          userId: "string (required)",
          action: "optimize_schedule",
          date: "string (optional, ISO date)"
        }
      },
      suggest_reschedule: {
        description: "Get smart reschedule suggestions for a missed event",
        body: {
          userId: "string (required)",
          action: "suggest_reschedule",
          eventData: {
            eventId: "string (required)"
          }
        }
      }
    }
  });
}
