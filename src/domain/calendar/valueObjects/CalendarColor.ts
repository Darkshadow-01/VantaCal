const VALID_COLORS = new Set([
  "#4F8DFD", // Blue
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#3BA55D", // Green
  "#8B5CF6", // Purple
  "#EF4444", // Red
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#F97316", // Orange
]);

const DEFAULT_COLOR = "#4F8DFD";

export class CalendarColor {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || typeof value !== "string") {
      this._value = DEFAULT_COLOR;
      return;
    }

    const normalized = value.toUpperCase();
    this._value = VALID_COLORS.has(normalized) ? normalized : DEFAULT_COLOR;
  }

  get value(): string {
    return this._value;
  }

  get hex(): string {
    return this._value;
  }

  equals(other: CalendarColor): boolean {
    return this._value === other._value;
  }

  static default(): CalendarColor {
    return new CalendarColor(DEFAULT_COLOR);
  }

  static fromSystem(system: "Health" | "Work" | "Relationships"): CalendarColor {
    const colorMap: Record<string, string> = {
      Health: "#EC4899",
      Work: "#4F8DFD",
      Relationships: "#F59E0B",
    };
    return new CalendarColor(colorMap[system] || DEFAULT_COLOR);
  }

  static availableColors(): string[] {
    return Array.from(VALID_COLORS);
  }
}