import { NextRequest, NextResponse } from "next/server";
import {
  runPlannerAgent,
  runSchedulerAgent,
  runReflectionAgent,
  runCoachAgent,
  runNaturalLanguageParse,
  checkLocalAIHealth,
  isLocalAIAvailable,
} from "@/lib/localAI";

function useFallbackParser(input: string): Record<string, unknown> {
  const text = input.toLowerCase();
  let system: "Health" | "Work" | "Relationships" = "Work";
  let title = input;
  let duration = 60;
  let allDay = false;
  let recurrence: "daily" | "weekly" | "monthly" | null = null;
  
  // Detect system from keywords
  if (text.includes("exercise") || text.includes("workout") || text.includes("gym") || 
      text.includes("run") || text.includes("walk") || text.includes("yoga") ||
      text.includes("meditate") || text.includes("sleep") || text.includes("health")) {
    system = "Health";
  } else if (text.includes("dinner") || text.includes("lunch") || text.includes("coffee") ||
             text.includes("friend") || text.includes("family") || text.includes("date") ||
             text.includes("birthday") || text.includes("party")) {
    system = "Relationships";
  } else if (text.includes("meeting") || text.includes("call") || text.includes("project") ||
             text.includes("deadline") || text.includes("email") || text.includes("office")) {
    system = "Work";
  }
  
  // Extract title - take first meaningful phrase (exclude day/time words)
  const stopWords = ["today", "tomorrow", "yesterday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "am", "pm", "morning", "afternoon", "evening", "night", "at"];
  const words = input.split(" ").filter(w => !stopWords.includes(w.toLowerCase()) && !/^\d+(:\d+)?$/.test(w));
  title = words.slice(0, 8).join(" ");
  if (!title.trim()) title = input;
  
  // Set duration based on keywords
  if (text.includes("hour")) {
    const hourMatch = text.match(/(\d+)\s*hour/);
    if (hourMatch) duration = parseInt(hourMatch[1]) * 60;
  } else if (text.includes("30 min") || text.includes("half hour")) {
    duration = 30;
  } else if (text.includes("15 min")) {
    duration = 15;
  }
  
  // Check for all-day events
  if (text.includes("all day") || text.includes("allday")) {
    allDay = true;
  }
  
  // Check recurrence
  if (text.includes("every day") || text.includes("daily")) {
    recurrence = "daily";
  } else if (text.includes("every week") || text.includes("weekly")) {
    recurrence = "weekly";
  } else if (text.includes("every month") || text.includes("monthly")) {
    recurrence = "monthly";
  }
  
  const now = new Date();
  let hour = 9;
  let minute = 0;
  let dayOfWeek: number | undefined = undefined;
  let dayOfMonth: number | undefined = undefined;
  
  // Determine the day
  if (text.includes("tomorrow")) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    dayOfMonth = tomorrow.getDate();
  } else if (text.includes("today")) {
    dayOfMonth = now.getDate();
  } else if (text.includes("monday") || text.includes("mon")) {
    dayOfWeek = 1;
  } else if (text.includes("tuesday") || text.includes("tue")) {
    dayOfWeek = 2;
  } else if (text.includes("wednesday") || text.includes("wed")) {
    dayOfWeek = 3;
  } else if (text.includes("thursday") || text.includes("thu")) {
    dayOfWeek = 4;
  } else if (text.includes("friday") || text.includes("fri")) {
    dayOfWeek = 5;
  } else if (text.includes("saturday") || text.includes("sat")) {
    dayOfWeek = 6;
  } else if (text.includes("sunday") || text.includes("sun")) {
    dayOfWeek = 0;
  }
  
  // Try to extract time - multiple formats
  // Format: "3pm", "3 pm", "3:00pm", "3:00 pm", "3:00", "15:00"
  const timePatterns = [
    /(\d{1,2})\s*(?:am|AM|a\.?m\.?)/,
    /(\d{1,2})\s*(?:pm|PM|p\.m\.?)/,
    /(\d{1,2}):(\d{2})\s*(?:am|PM)?/,
    /^(\d{1,2}):(\d{2})$/
  ];
  
  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[2]) {
        hour = parseInt(match[1]);
        minute = parseInt(match[2]);
      } else {
        hour = parseInt(match[1]);
        minute = 0;
      }
      // Handle PM (but not 12pm)
      if (text.includes("pm") && hour < 12 && hour !== 0) {
        hour += 12;
      }
      // Handle midnight/noon cases
      if (text.includes("12pm") || text.includes("12 pm")) hour = 12;
      if (text.includes("12am") || text.includes("12 am")) hour = 0;
      break;
    }
  }
  
  // If no specific time found, check general time of day
  if (hour === 9 && minute === 0 && !text.match(/\d/)) {
    if (text.includes("morning")) {
      hour = 9;
    } else if (text.includes("afternoon")) {
      hour = 14;
    } else if (text.includes("evening")) {
      hour = 18;
    } else if (text.includes("noon") || text.includes("lunch")) {
      hour = 12;
    } else if (text.includes("night") || text.includes("dinner")) {
      hour = 19;
    }
  }
  
  return {
    title,
    system,
    startTime: { hour, minute, dayOfWeek, dayOfMonth },
    duration,
    recurrence,
    allDay,
    confidence: 0.6,
    reasoning: "Used improved fallback parser",
  };
}

export async function GET() {
  const health = await checkLocalAIHealth();
  const usingLocal = isLocalAIAvailable();

  return NextResponse.json({
    status: health.available ? "healthy" : "degraded",
    usingLocalAI: usingLocal,
    provider: health.provider,
    model: health.model,
    latency: health.latency,
    error: health.error,
    endpoints: {
      planner: "POST /api/localAI - Run planner agent",
      scheduler: "POST /api/localAI - Run scheduler agent",
      reflection: "POST /api/localAI - Run reflection agent",
      coach: "POST /api/localAI - Run behavior coach agent",
      parse: "POST /api/localAI - Natural language parse",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent, action, ...data } = body;

    if (!agent) {
      return NextResponse.json(
        { error: "Missing required field: agent" },
        { status: 400 }
      );
    }

    const health = await checkLocalAIHealth();
    const startTime = Date.now();

    let result: Record<string, unknown>;

    switch (agent) {
      case "planner": {
        if (!data.input) {
          return NextResponse.json(
            { error: "Missing required field: input" },
            { status: 400 }
          );
        }
        result = await runPlannerAgent(data.input as string);
        break;
      }

      case "scheduler": {
        if (!action) {
          return NextResponse.json(
            { error: "Missing required field: action" },
            { status: 400 }
          );
        }
        result = await runSchedulerAgent({
          action,
          events: data.events,
          system: data.system,
          userId: data.userId,
        });
        break;
      }

      case "reflection": {
        if (!data.totalEvents || !data.completed || !data.missed || !data.distribution) {
          return NextResponse.json(
            { error: "Missing required fields: totalEvents, completed, missed, distribution" },
            { status: 400 }
          );
        }
        result = await runReflectionAgent({
          totalEvents: data.totalEvents,
          completed: data.completed,
          missed: data.missed,
          distribution: data.distribution,
        });
        break;
      }

      case "coach": {
        if (!action || !data.userId) {
          return NextResponse.json(
            { error: "Missing required fields: action, userId" },
            { status: 400 }
          );
        }
        result = await runCoachAgent({
          action,
          userId: data.userId,
          system: data.system,
          streakData: data.streakData,
          motivationLevel: data.motivationLevel,
          recentWins: data.recentWins,
          barriers: data.barriers,
          context: data.context,
        });
        break;
      }

      case "parse": {
        const input = data.input || data.text;
        if (!input) {
          return NextResponse.json(
            { error: "Missing required field: input" },
            { status: 400 }
          );
        }
        
        try {
          const health = await checkLocalAIHealth();
          if (!health.available) {
            // Use fallback parser when AI is not available
            result = useFallbackParser(input as string);
          } else {
            result = await runNaturalLanguageParse(input as string);
          }
        } catch (parseError) {
          // Fallback parser on any error
          console.warn("AI parse failed, using fallback:", parseError);
          result = useFallbackParser(input as string);
        }
        break;
      }

      default:
        return NextResponse.json(
          {
            error: `Unknown agent: ${agent}`,
            validAgents: ["planner", "scheduler", "reflection", "coach", "parse"],
          },
          { status: 400 }
        );
    }

    const latency = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      agent,
      action,
      result,
      metadata: {
        latency,
        localAIAvailable: health.available,
        provider: health.provider,
        model: health.model,
      },
    });
  } catch (error) {
    console.error("Local AI API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
