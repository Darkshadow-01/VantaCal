import { NextRequest, NextResponse } from "next/server";

interface ParsedEvent {
  title: string;
  system: "Health" | "Work" | "Relationships";
  startTime: {
    dayOfWeek?: number;
    hour: number;
    minute: number;
    dayOfMonth?: number;
    month?: number;
  };
  duration: number;
  recurrence: "daily" | "weekly" | "biweekly" | "monthly" | "yearly" | null;
  allDay: boolean;
  confidence: number;
  reasoning: string;
}

function detectSystem(title: string, context: string): "Health" | "Work" | "Relationships" {
  const combined = (title + " " + context).toLowerCase();
  
  const healthKeywords = ["workout", "exercise", "gym", "run", "yoga", "meditation", "sleep", "health", "doctor", "therapy", "walk", "bike", "swim", "meal", "diet", "nutrition"];
  const workKeywords = ["meeting", "call", "presentation", "deadline", "project", "client", "email", "office", "work", "interview", "review", "standup", "sync"];
  const relationshipKeywords = ["dinner", "lunch", "date", "friend", "family", "birthday", "anniversary", "party", "social", "coffee", "visit", "call mom", "call dad"];

  for (const keyword of healthKeywords) {
    if (combined.includes(keyword)) return "Health";
  }
  for (const keyword of workKeywords) {
    if (combined.includes(keyword)) return "Work";
  }
  for (const keyword of relationshipKeywords) {
    if (combined.includes(keyword)) return "Relationships";
  }
  
  return "Work";
}

function parseRecurrence(input: string): { recurrence: string | null; dayOfWeek?: number } {
  const lower = input.toLowerCase();
  
  if (lower.includes("every day") || lower.includes("daily")) {
    return { recurrence: "daily" };
  }
  if (lower.includes("every week") || (lower.includes("every") && lower.includes("monday") || lower.includes("every") && lower.includes("tuesday") || lower.includes("every") && lower.includes("wednesday") || lower.includes("every") && lower.includes("thursday") || lower.includes("every") && lower.includes("friday") || lower.includes("every") && lower.includes("saturday") || lower.includes("every") && lower.includes("sunday"))) {
    return { recurrence: "weekly", dayOfWeek: 1 };
  }
  if (lower.includes("every other") || lower.includes("biweekly")) {
    return { recurrence: "biweekly" };
  }
  if (lower.includes("monthly") || lower.includes("every month")) {
    return { recurrence: "monthly" };
  }
  if (lower.includes("yearly") || lower.includes("every year")) {
    return { recurrence: "yearly" };
  }
  
  return { recurrence: null };
}

const DAY_MAP: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

function parseTime(input: string): { hour: number; minute: number } {
  const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const match = input.match(timeRegex);
  
  if (match) {
    let hour = parseInt(match[1]);
    const minute = parseInt(match[2] || "0");
    const period = match[3]?.toLowerCase();
    
    if (period === "pm" && hour < 12) hour += 12;
    if (period === "am" && hour === 12) hour = 0;
    
    return { hour, minute };
  }
  
  return { hour: 9, minute: 0 };
}

function parseDuration(input: string): number {
  const hourMatch = input.match(/(\d+)\s*hour/i);
  const minMatch = input.match(/(\d+)\s*min/i);
  
  const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
  const minutes = minMatch ? parseInt(minMatch[1]) : 30;
  
  return (hours * 60) + minutes;
}

function extractDayOfWeek(input: string): number | undefined {
  const lower = input.toLowerCase();
  
  for (const [day, num] of Object.entries(DAY_MAP)) {
    if (lower.includes(day)) {
      return num;
    }
  }
  
  return undefined;
}

function parseNaturalLanguage(input: string): ParsedEvent {
  const cleanedInput = input.trim();
  
  let title = cleanedInput;
  let recurrence: string | null = null;
  
  const recurrenceResult = parseRecurrence(cleanedInput);
  recurrence = recurrenceResult.recurrence;
  const dayOfWeek = recurrenceResult.dayOfWeek || extractDayOfWeek(cleanedInput);
  
  title = title
    .replace(/every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi, "")
    .replace(/every\s+day/gi, "")
    .replace(/every\s+other/gi, "")
    .replace(/\s+at\s+\d.*$/i, "")
    .replace(/daily|weekly|monthly|yearly|biweekly/gi, "")
    .trim();
  
  if (!title) {
    title = "New Event";
  }
  
  const { hour, minute } = parseTime(cleanedInput);
  const duration = parseDuration(cleanedInput);
  const system = detectSystem(title, cleanedInput);
  
  const dayOfMonthMatch = cleanedInput.match(/(\d{1,2})(st|nd|rd|th)?\s+(of)?\s*(january|february|march|april|may|june|july|august|september|october|november|december)/i);
  const monthMap: Record<string, number> = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
  };
  const month = dayOfMonthMatch ? monthMap[dayOfMonthMatch[4].toLowerCase()] : undefined;
  const dayOfMonth = dayOfMonthMatch ? parseInt(dayOfMonthMatch[1]) : undefined;
  
  const hasTime = /\d.*(am|pm|:00)/i.test(cleanedInput);
  const allDay = !hasTime && !cleanedInput.match(/\d/);
  
  let confidence = 0.7;
  if (dayOfWeek) confidence += 0.1;
  if (hour !== 9 || minute !== 0) confidence += 0.1;
  if (recurrence) confidence += 0.1;
  
  const reasoning = `Parsed "${cleanedInput}" as "${title}" in ${system} system. ` +
    `Scheduled for ${dayOfWeek !== undefined ? ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][dayOfWeek] : "one-time"} ` +
    `at ${hour}:${minute.toString().padStart(2, "0")}. ${recurrence ? `Recurring ${recurrence}.` : ""} ` +
    `Duration: ${duration} minutes.`;
  
  return {
    title,
    system,
    startTime: {
      hour,
      minute,
      dayOfWeek,
      dayOfMonth,
      month,
    },
    duration,
    recurrence: recurrence as ParsedEvent["recurrence"],
    allDay,
    confidence: Math.min(confidence, 1),
    reasoning,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, userId } = body;
    
    if (!input || typeof input !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'input' field" },
        { status: 400 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: "Missing 'userId' field" },
        { status: 400 }
      );
    }
    
    const parsed = parseNaturalLanguage(input);
    
    const response = {
      success: true,
      originalInput: input,
      parsed,
      nextSteps: [
        "Review the parsed event details",
        parsed.confidence < 0.8 
          ? "Consider adjusting the details if parsing seems incorrect"
          : "Event looks good - ready to create",
        "Confirm to add to calendar"
      ],
      confidence: parsed.confidence,
      needsConfirmation: parsed.confidence < 0.8,
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse input" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    usage: "POST /api/parse",
    body: {
      input: "string (required) - Natural language event description",
      userId: "string (required) - Clerk user ID"
    },
    examples: [
      {
        input: "Workout every Monday at 7am",
        response: {
          title: "Workout",
          system: "Health",
          startTime: { dayOfWeek: 1, hour: 7, minute: 0 },
          duration: 60,
          recurrence: "weekly",
          allDay: false,
          confidence: 0.9
        }
      },
      {
        input: "Team standup meeting at 9am daily",
        response: {
          title: "Team standup meeting",
          system: "Work",
          startTime: { hour: 9, minute: 0 },
          duration: 30,
          recurrence: "daily",
          allDay: false,
          confidence: 0.95
        }
      },
      {
        input: "Dinner with Sarah next Friday at 7pm",
        response: {
          title: "Dinner with Sarah",
          system: "Relationships",
          startTime: { dayOfWeek: 5, hour: 19, minute: 0 },
          duration: 90,
          recurrence: null,
          allDay: false,
          confidence: 0.85
        }
      }
    ]
  });
}
