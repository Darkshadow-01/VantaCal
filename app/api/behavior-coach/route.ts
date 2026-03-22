import { NextRequest, NextResponse } from "next/server";
import { behaviorCoachAgent } from "@/agents";

interface BehaviorCoachData {
  userId: string;
  system?: string;
  streakData?: {
    current: number;
    longest: number;
    atRisk: boolean;
  };
  motivationLevel?: number;
  recentWins?: string[];
  barriers?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, context, data } = body as { action: string; context?: string; data: BehaviorCoachData };

    const prompt = buildBehaviorCoachPrompt(action, context, data);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: behaviorCoachAgent.systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: "AI request failed", details: error }, { status: 500 });
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    const parsed = JSON.parse(content);

    return NextResponse.json({
      success: true,
      deliverable: parsed.deliverable || "behavior_coaching_response",
      message: parsed.message || "",
      encouragement: parsed.encouragement || "",
      recommendations: parsed.recommendations || [],
      milestones: parsed.milestones || [],
      motivationBoost: parsed.motivationBoost || "",
      followUp: parsed.followUp || ""
    });
  } catch (error) {
    console.error("Behavior Coach error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function buildBehaviorCoachPrompt(action: string, context: string | undefined, data: BehaviorCoachData): string {

  const actionDescriptions: Record<string, string> = {
    habit_coaching: "Run a habit coaching session to help the user build sustainable routines.",
    motivation_assessment: "Assess the user's current motivation levels across all systems.",
    streak_check: "Check and report on the user's habit streaks.",
    celebrate_win: "Celebrate a recent achievement with the user.",
    barrier_analysis: "Analyze barriers to habit formation and suggest solutions.",
    habit_plan: "Create a personalized habit plan for the user."
  };

  let prompt = `## Action Required: ${actionDescriptions[action] || action}\n\n`;

  if (context) {
    prompt += `## Context\n${context}\n\n`;
  }

  prompt += `## User Data\n`;
  prompt += `- User ID: ${data.userId}\n`;

  if (data.system) {
    prompt += `- Focus System: ${data.system}\n`;
  }

  if (data.streakData) {
    prompt += `- Current Streak: ${data.streakData.current} days\n`;
    prompt += `- Longest Streak: ${data.streakData.longest} days\n`;
    prompt += `- At Risk: ${data.streakData.atRisk ? "Yes" : "No"}\n`;
  }

  if (typeof data.motivationLevel === "number") {
    prompt += `- Motivation Level: ${data.motivationLevel}/10\n`;
  }

  if (data.recentWins && data.recentWins.length > 0) {
    prompt += `- Recent Wins: ${data.recentWins.join(", ")}\n`;
  }

  if (data.barriers && data.barriers.length > 0) {
    prompt += `- Barriers: ${data.barriers.join(", ")}\n`;
  }

  prompt += `\nPlease respond with a JSON object containing:\n`;
  prompt += `- deliverable: brief description of what you're providing\n`;
  prompt += `- message: main content/response\n`;
  prompt += `- encouragement: motivational message\n`;
  prompt += `- recommendations: array of {action, cue, rationale}\n`;
  prompt += `- milestones: array of {days, reward}\n`;
  prompt += `- motivationBoost: specific motivation tip\n`;
  prompt += `- followUp: how to follow up\n`;

  return prompt;
}
