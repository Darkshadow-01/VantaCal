import { systemPrompt as plannerSystemPrompt, inputSchema as plannerInputSchema, outputSchema as plannerOutputSchema } from "./planner";
import { systemPrompt as schedulerSystemPrompt, inputSchema as schedulerInputSchema, outputSchema as schedulerOutputSchema } from "./scheduler";
import { systemPrompt as reflectionSystemPrompt, inputSchema as reflectionInputSchema, outputSchema as reflectionOutputSchema } from "./reflection";
import { systemPrompt as behaviorCoachSystemPrompt, inputSchema as behaviorCoachInputSchema, outputSchema as behaviorCoachOutputSchema } from "./behaviorCoach";

export const plannerAgent = { systemPrompt: plannerSystemPrompt, inputSchema: plannerInputSchema, outputSchema: plannerOutputSchema };
export const schedulerAgent = { systemPrompt: schedulerSystemPrompt, inputSchema: schedulerInputSchema, outputSchema: schedulerOutputSchema };
export const reflectionAgent = { systemPrompt: reflectionSystemPrompt, inputSchema: reflectionInputSchema, outputSchema: reflectionOutputSchema };
export const behaviorCoachAgent = { systemPrompt: behaviorCoachSystemPrompt, inputSchema: behaviorCoachInputSchema, outputSchema: behaviorCoachOutputSchema };

export { plannerSystemPrompt, plannerInputSchema, plannerOutputSchema };
export { schedulerSystemPrompt, schedulerInputSchema, schedulerOutputSchema };
export { reflectionSystemPrompt, reflectionInputSchema, reflectionOutputSchema };
export { behaviorCoachSystemPrompt, behaviorCoachInputSchema, behaviorCoachOutputSchema };
