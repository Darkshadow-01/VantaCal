export interface LLMEventIntent {
  title: string;
  startTime: number;
  endTime: number;
  description?: string;
  location?: string;
  allDay: boolean;
  system: "Health" | "Work" | "Relationships";
  confidence: number;
}

const SYSTEM_PROMPT = `You are a calendar assistant that extracts event information from natural language.

Given a user's message, extract the following information:
- title: What the event is called
- startTime: When it starts (Unix timestamp in milliseconds)
- endTime: When it ends (Unix timestamp in milliseconds) 
- description: Optional description
- location: Optional location
- allDay: Whether it's an all-day event
- system: Which life area - "Health", "Work", or "Relationships"

Rules:
1. Parse natural dates: "tomorrow", "next Monday", "Jan 15"
2. Parse times: "10am", "2:30pm", "at 3"
3. Default duration is 1 hour unless specified
4. Default to next occurrence if day is mentioned without year
5. Return allDay=true only if user explicitly says "all day" or "all-day"
6. Infer system from context: gym/exercise/health = Health, meeting/work = Work, friends/family = Relationships

Respond ONLY with valid JSON. No explanations.`;

const CURRENT_DATE = new Date().toISOString();

const EXAMPLE_INPUTS = [
  {
    input: "Meeting with team tomorrow at 10am",
    output: {
      title: "Meeting with team",
      startTime: Math.floor(new Date(Date.now() + 86400000).setHours(10, 0, 0, 0)),
      endTime: Math.floor(new Date(Date.now() + 86400000).setHours(11, 0, 0, 0)),
      allDay: false,
      system: "Work",
      confidence: 0.9,
    },
  },
  {
    input: "Gym workout next Monday at 6am for 1 hour",
    output: {
      title: "Gym workout",
      startTime: Math.floor(new Date(Date.now() + 86400000 * 7).setHours(6, 0, 0, 0)),
      endTime: Math.floor(new Date(Date.now() + 86400000 * 7).setHours(7, 0, 0, 0)),
      allDay: false,
      system: "Health",
      confidence: 0.95,
    },
  },
];

async function callLLM(prompt: string): Promise<LLMEventIntent | null> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
  const baseUrl = process.env.OPENAI_API_KEY 
    ? "https://api.openai.com/v1"
    : "https://api.groq.com/openai/v1";
  const model = process.env.OPENAI_API_KEY ? "gpt-4o-mini" : "llama-3.1-70b-versatile";

  if (!apiKey) {
    console.warn("No LLM API key configured, falling back to regex parser");
    return null;
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Current date: ${CURRENT_DATE}\n\nUser message: "${prompt}"` },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return null;
    }

    const parsed = JSON.parse(content);
    
    return {
      title: parsed.title || "New Event",
      startTime: parsed.startTime || Date.now() + 86400000,
      endTime: parsed.endTime || Date.now() + 86400000 + 3600000,
      description: parsed.description,
      location: parsed.location,
      allDay: parsed.allDay || false,
      system: parsed.system || "Work",
      confidence: parsed.confidence || 0.7,
    };
  } catch (error) {
    console.error("LLM parsing error:", error);
    return null;
  }
}

export async function parseWithLLM(text: string): Promise<LLMEventIntent | null> {
  const result = await callLLM(text);
  
  if (result) {
    return result;
  }
  
  return null;
}

export async function testLLMParser(): Promise<void> {
  console.log("Testing LLM parser with example inputs...");
  
  for (const { input } of EXAMPLE_INPUTS) {
    const result = await parseWithLLM(input);
    console.log(`Input: "${input}"`);
    console.log("Result:", result);
    console.log("---");
  }
}
