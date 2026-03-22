import { plannerSystemPrompt } from "@/agents";
import { schedulerSystemPrompt } from "@/agents";
import { reflectionSystemPrompt } from "@/agents";
import { behaviorCoachSystemPrompt } from "@/agents";

export interface LocalAIConfig {
  provider: "ollama" | "lmstudio" | "lmify" | "external";
  baseUrl: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

const DEFAULT_CONFIG: LocalAIConfig = {
  provider: "ollama",
  baseUrl: process.env.LOCAL_AI_URL || "http://localhost:11434",
  model: process.env.LOCAL_AI_MODEL || "llama3.2",
  temperature: 0.7,
  maxTokens: 2048,
};

export function getLocalAIConfig(): LocalAIConfig {
  return {
    ...DEFAULT_CONFIG,
    provider: (process.env.LOCAL_AI_PROVIDER as LocalAIConfig["provider"]) || "ollama",
    baseUrl: process.env.LOCAL_AI_URL || "http://localhost:11434",
    model: process.env.LOCAL_AI_MODEL || "llama3.2",
    temperature: process.env.LOCAL_AI_TEMPERATURE ? parseFloat(process.env.LOCAL_AI_TEMPERATURE) : 0.7,
    maxTokens: process.env.LOCAL_AI_MAX_TOKENS ? parseInt(process.env.LOCAL_AI_MAX_TOKENS) : 2048,
  };
}

export function isLocalAIAvailable(): boolean {
  const config = getLocalAIConfig();
  return config.provider !== "external";
}

interface AIRequest {
  model?: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  format?: "json" | "text";
}

async function callLocalAI(
  config: LocalAIConfig,
  messages: Array<{ role: string; content: string }>,
  options?: { format?: "json" | "text"; temperature?: number; maxTokens?: number }
): Promise<string> {
  const { baseUrl, model, temperature, maxTokens } = config;

  let endpoint = `${baseUrl}/api/chat`;
  const body: AIRequest = {
    model: model,
    messages,
    temperature: options?.temperature ?? temperature,
    max_tokens: options?.maxTokens ?? maxTokens,
    stream: false,
  };

  if (config.provider === "ollama") {
    body.format = (options?.format as "json") || "json";
  } else if (config.provider === "lmstudio" || config.provider === "lmify") {
    endpoint = `${baseUrl}/v1/chat/completions`;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Local AI request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (config.provider === "ollama") {
    return data.message?.content || "";
  } else {
    return data.choices?.[0]?.message?.content || data.content || "";
  }
}

async function callExternalAI(
  messages: Array<{ role: string; content: string }>,
  options?: { temperature?: number; format?: "json" | "text" }
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("External AI API key not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages,
      temperature: options?.temperature ?? 0.7,
      response_format: options?.format === "json" ? { type: "json_object" } : undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(`External AI request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function runAI(
  systemPrompt: string,
  userMessage: string,
  options?: { temperature?: number; format?: "json" | "text"; maxTokens?: number }
): Promise<string> {
  const config = getLocalAIConfig();
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  if (config.provider === "external") {
    return callExternalAI(messages, options);
  }

  try {
    return await callLocalAI(config, messages, options);
  } catch {
    console.warn(`Local AI (${config.provider}) failed, falling back to external API`);
    return callExternalAI(messages, options);
  }
}

function buildPlannerPrompt(input: string): string {
  return `User request: ${input}

Generate a product planning response with:
1. Problem statement
2. Success metrics
3. Implementation timeline

Return valid JSON with this structure:
{
  "problemStatement": "string",
  "successMetrics": ["string"],
  "timeline": "string",
  "confidence": number (0-1)
}

Rules:
- Only reference the 3 systems: Health, Work, Relationships
- No hallucinated data
- Confidence should reflect evidence level`;
}

export async function runPlannerAgent(input: string): Promise<Record<string, unknown>> {
  const response = await runAI(plannerSystemPrompt, buildPlannerPrompt(input), {
    temperature: 0.7,
    format: "json",
    maxTokens: 2048,
  });

  try {
    return JSON.parse(response);
  } catch {
    return {
      problemStatement: input,
      successMetrics: [],
      timeline: "Unable to generate timeline",
      confidence: 0,
      rawResponse: response,
    };
  }
}

function buildSchedulerPrompt(input: {
  action: string;
  events?: Array<{ id: string; title: string; startTime: number; endTime: number; system: string }>;
  system?: string;
  userId?: string;
}): string {
  const actionDescriptions: Record<string, string> = {
    check_conflicts: "Check for scheduling conflicts and suggest optimal times.",
    optimize_schedule: "Optimize the user's schedule for better time allocation.",
    suggest_reschedule: "Suggest alternative times for frequently missed events.",
  };

  let prompt = `Action: ${actionDescriptions[input.action] || input.action}\n\n`;

  if (input.events && input.events.length > 0) {
    prompt += `Current Events:\n`;
    input.events.forEach((event) => {
      prompt += `- ${event.title} (${event.system}): ${new Date(event.startTime).toISOString()} - ${new Date(event.endTime).toISOString()}\n`;
    });
    prompt += `\n`;
  }

  if (input.system) {
    prompt += `Focus System: ${input.system}\n\n`;
  }

  prompt += `Return valid JSON with the appropriate structure for this action.`;

  return prompt;
}

export async function runSchedulerAgent(input: {
  action: string;
  events?: Array<{ id: string; title: string; startTime: number; endTime: number; system: string }>;
  system?: string;
  userId?: string;
}): Promise<Record<string, unknown>> {
  const response = await runAI(schedulerSystemPrompt, buildSchedulerPrompt(input), {
    temperature: 0.5,
    format: "json",
    maxTokens: 2048,
  });

  try {
    return JSON.parse(response);
  } catch {
    return {
      error: "Failed to parse scheduler response",
      rawResponse: response,
    };
  }
}

function buildReflectionPrompt(input: {
  totalEvents: number;
  completed: number;
  missed: number;
  distribution: Record<string, number>;
}): string {
  const distStr = Object.entries(input.distribution)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  return `Weekly Data:
- Total Events: ${input.totalEvents}
- Completed: ${input.completed}
- Missed: ${input.missed}
- System Distribution: ${distStr}

Generate a weekly reflection with insights.

Return valid JSON:
{
  "completionRate": number,
  "systemBalance": {
    "health": number,
    "work": number,
    "relationships": number
  },
  "insights": ["string"],
  "recommendations": ["string"],
  "grade": "A" | "B" | "C" | "D" | "F"
}

Rules:
- Completion rate must match (completed/total * 100)
- No hallucinated numbers
- Systems must be Health, Work, or Relationships only`;
}

export async function runReflectionAgent(input: {
  totalEvents: number;
  completed: number;
  missed: number;
  distribution: Record<string, number>;
}): Promise<Record<string, unknown>> {
  const response = await runAI(reflectionSystemPrompt, buildReflectionPrompt(input), {
    temperature: 0.8,
    format: "json",
    maxTokens: 2048,
  });

  try {
    return JSON.parse(response);
  } catch {
    const completionRate = Math.round((input.completed / input.totalEvents) * 100);
    return {
      completionRate,
      systemBalance: input.distribution,
      insights: ["Unable to generate insights"],
      recommendations: ["Unable to generate recommendations"],
      grade: completionRate >= 80 ? "B" : completionRate >= 60 ? "C" : "D",
      rawResponse: response,
    };
  }
}

function buildCoachPrompt(input: {
  action: string;
  userId: string;
  system?: string;
  streakData?: { current: number; longest: number; atRisk: boolean };
  motivationLevel?: number;
  recentWins?: string[];
  barriers?: string[];
  context?: string;
}): string {
  const actionDescriptions: Record<string, string> = {
    habit_coaching: "Run a habit coaching session to help the user build sustainable routines.",
    motivation_assessment: "Assess the user's current motivation levels across all systems.",
    streak_check: "Check and report on the user's habit streaks.",
    celebrate_win: "Celebrate a recent achievement with the user.",
    barrier_analysis: "Analyze barriers to habit formation and suggest solutions.",
    habit_plan: "Create a personalized habit plan for the user.",
  };

  let prompt = `## Action: ${actionDescriptions[input.action] || input.action}\n\n`;

  if (input.context) {
    prompt += `## Context\n${input.context}\n\n`;
  }

  prompt += `## User Data\n`;
  prompt += `- User ID: ${input.userId}\n`;

  if (input.system) {
    prompt += `- Focus System: ${input.system}\n`;
  }

  if (input.streakData) {
    prompt += `- Current Streak: ${input.streakData.current} days\n`;
    prompt += `- Longest Streak: ${input.streakData.longest} days\n`;
    prompt += `- At Risk: ${input.streakData.atRisk ? "Yes" : "No"}\n`;
  }

  if (input.motivationLevel) {
    prompt += `- Motivation Level: ${input.motivationLevel}/10\n`;
  }

  if (input.recentWins && input.recentWins.length > 0) {
    prompt += `- Recent Wins: ${input.recentWins.join(", ")}\n`;
  }

  if (input.barriers && input.barriers.length > 0) {
    prompt += `- Barriers: ${input.barriers.join(", ")}\n`;
  }

  prompt += `\nReturn valid JSON with:
{
  "deliverable": "string",
  "message": "string",
  "encouragement": "string",
  "recommendations": [{"action": "string", "cue": "string", "rationale": "string"}],
  "milestones": [{"days": number, "reward": "string"}],
  "motivationBoost": "string",
  "followUp": "string"
}`;

  return prompt;
}

export async function runCoachAgent(input: {
  action: string;
  userId: string;
  system?: string;
  streakData?: { current: number; longest: number; atRisk: boolean };
  motivationLevel?: number;
  recentWins?: string[];
  barriers?: string[];
  context?: string;
}): Promise<Record<string, unknown>> {
  const response = await runAI(behaviorCoachSystemPrompt, buildCoachPrompt(input), {
    temperature: 0.8,
    format: "json",
    maxTokens: 2048,
  });

  try {
    return JSON.parse(response);
  } catch {
    return {
      deliverable: "behavior_coaching_response",
      message: "Unable to generate coaching response",
      encouragement: "Keep going!",
      recommendations: [],
      milestones: [],
      motivationBoost: "Take it one step at a time.",
      followUp: "Check in tomorrow",
      rawResponse: response,
    };
  }
}

export async function runNaturalLanguageParse(input: string): Promise<Record<string, unknown>> {
  const parsePrompt = `Parse the following natural language calendar input and extract event details.

Input: "${input}"

Return valid JSON with this structure:
{
  "title": "string",
  "system": "Health" | "Work" | "Relationships",
  "startTime": {
    "hour": number (0-23),
    "minute": number (0-59),
    "dayOfWeek": number (0-6, Sunday-Saturday) | undefined,
    "dayOfMonth": number | undefined,
    "month": number | undefined
  },
  "duration": number (minutes),
  "recurrence": "daily" | "weekly" | "monthly" | null,
  "allDay": boolean,
  "confidence": number (0-1),
  "reasoning": "string"
}

Rules:
- System should be inferred from keywords (exercise/workout=Health, meeting/call/project=Work, dinner/lunch with family/friends=Relationships)
- Default duration is 60 minutes if not specified
- Confidence reflects how certain the parsing is`;

  const response = await runAI(plannerSystemPrompt, parsePrompt, {
    temperature: 0.3,
    format: "json",
    maxTokens: 1024,
  });

  try {
    return JSON.parse(response);
  } catch {
    return {
      title: input,
      system: "Work",
      startTime: { hour: 9, minute: 0 },
      duration: 60,
      recurrence: null,
      allDay: false,
      confidence: 0,
      reasoning: "Failed to parse",
      rawResponse: response,
    };
  }
}

export async function checkLocalAIHealth(): Promise<{
  available: boolean;
  provider: string;
  model: string;
  latency?: number;
  error?: string;
}> {
  const config = getLocalAIConfig();

  if (config.provider === "external") {
    return {
      available: false,
      provider: "external",
      model: "gpt-4o",
      error: "Using external API only",
    };
  }

  const start = Date.now();

  try {
    const response = await fetch(`${config.baseUrl}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    const latency = Date.now() - start;
    const models = await response.json();

    return {
      available: true,
      provider: config.provider,
      model: config.model,
      latency,
    };
  } catch (error) {
    return {
      available: false,
      provider: config.provider,
      model: config.model,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
