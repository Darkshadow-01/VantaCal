import { NextRequest, NextResponse } from "next/server";
import { orchestrateWeeklyPlan, getWeeklyPlan, extractActionableItems } from "@/lib/aiOrchestrator";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const weekOffset = parseInt(searchParams.get("weekOffset") || "0");
  const extract = searchParams.get("extract");

  if (!userId) {
    return NextResponse.json(
      { error: "Missing required parameter: userId" },
      { status: 400 }
    );
  }

  try {
    if (extract === "true") {
      const plan = await getWeeklyPlan(userId, weekOffset);
      if (!plan) {
        return NextResponse.json(
          { error: "No plan found for this week" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        ...extractActionableItems(plan),
      });
    }

    const plan = await getWeeklyPlan(userId, weekOffset);

    return NextResponse.json({
      success: true,
      plan,
    });
  } catch (error) {
    console.error("Weekly plan API error:", error);
    return NextResponse.json(
      { error: "Failed to generate weekly plan", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, goals, weekOffset } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required field: userId" },
        { status: 400 }
      );
    }

    const plan = await orchestrateWeeklyPlan(
      userId,
      goals,
      weekOffset || 0
    );

    return NextResponse.json({
      success: true,
      plan,
      actionableItems: extractActionableItems(plan),
    });
  } catch (error) {
    console.error("Weekly plan generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate weekly plan", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
