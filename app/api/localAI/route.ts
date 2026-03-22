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
        if (!data.input) {
          return NextResponse.json(
            { error: "Missing required field: input" },
            { status: 400 }
          );
        }
        result = await runNaturalLanguageParse(data.input as string);
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
