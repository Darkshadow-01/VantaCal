export interface ParsedEventIntent {
  title: string;
  startTime: number;
  endTime: number;
  description?: string;
  location?: string;
  allDay: boolean;
  system: "Health" | "Work" | "Relationships";
  confidence: number;
}

export interface IAIServicePort {
  parseNaturalLanguage(text: string): Promise<ParsedEventIntent | null>;
  isAvailable(): boolean;
}