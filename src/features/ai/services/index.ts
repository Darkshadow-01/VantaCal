export * from "./localAI";
export * from "./orchestrator";
export { systemPrompt as schedulerSystemPrompt, inputSchema as schedulerInputSchema, outputSchema as schedulerOutputSchema } from "./scheduler";
export { systemPrompt as plannerSystemPrompt, inputSchema as plannerInputSchema, outputSchema as plannerOutputSchema } from "./planner";
export { systemPrompt as reflectionSystemPrompt, inputSchema as reflectionInputSchema, outputSchema as reflectionOutputSchema } from "./reflection";
export { systemPrompt as behaviorCoachSystemPrompt, inputSchema as coachInputSchema, outputSchema as coachOutputSchema } from "./behaviorCoach";
export * from "../model/types";

// Re-export scheduler and suggestions with error handling (from lib/)
import { analyzeScheduleWithPredictions, type ScheduleWithBuffers } from "@/lib/schedulerWithBuffers";
import { generateSuggestions, type Suggestion } from "@/lib/suggestions";

export { generateSuggestions, type Suggestion };

// Safe wrapper for schedule analysis
export async function analyzeScheduleSafe(
  userId: string,
  events: Array<{
    id: string;
    title: string;
    system: "Health" | "Work" | "Relationships";
    startTime: number;
    endTime: number;
  }>
): Promise<{
  data: ScheduleWithBuffers;
  error: string | null;
}> {
  try {
    const data = await analyzeScheduleWithPredictions(userId, events);
    return { data, error: null };
  } catch (err) {
    console.error('[Scheduler] Analysis failed:', err);
    return {
      data: {
        events: [],
        buffers: [],
        totalBufferMinutes: 0,
        optimizationScore: 0,
        riskAssessment: { highRiskEvents: [], recommendedBuffers: [] }
      },
      error: 'AI scheduling temporarily unavailable'
    };
  }
}