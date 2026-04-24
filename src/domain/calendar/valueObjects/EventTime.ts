import { addMinutes, differenceInMinutes, isBefore, isAfter, areIntervalsOverlapping } from "date-fns";

export class EventTime {
  private readonly _start: Date;
  private readonly _end: Date | null;

  constructor(start: number | Date, end?: number | Date) {
    const startDate = typeof start === "number" ? new Date(start) : start;
    if (isNaN(startDate.getTime())) {
      throw new Error("Invalid start time");
    }

    this._start = startDate;

    if (end !== undefined) {
      const endDate = typeof end === "number" ? new Date(end) : end;
      if (isNaN(endDate.getTime())) {
        throw new Error("Invalid end time");
      }
      if (!isAfter(endDate, startDate)) {
        throw new Error("End time must be after start time");
      }
      this._end = endDate;
    } else {
      this._end = null;
    }
  }

  get start(): Date {
    return this._start;
  }

  get end(): Date | null {
    return this._end;
  }

  get isAllDay(): boolean {
    return this._end === null;
  }

  get durationMinutes(): number | null {
    if (!this._end) return null;
    return differenceInMinutes(this._end, this._start);
  }

  isOverlapping(other: EventTime): boolean {
    if (!this._end || !other._end) return false;
    return areIntervalsOverlapping(
      { start: this._start, end: this._end },
      { start: other._start, end: other._end }
    );
  }

  isOnSameDay(other: EventTime): boolean {
    return this._start.toDateString() === other._start.toDateString();
  }

  withNewTimes(start: number, end?: number): EventTime {
    return new EventTime(start, end);
  }

  toMillis(): { start: number; end: number | undefined } {
    return {
      start: this._start.getTime(),
      end: this._end?.getTime(),
    };
  }

  static fromMillis(start: number, end?: number): EventTime {
    return new EventTime(start, end);
  }
}

export class TimeRange {
  private readonly _start: Date;
  private readonly _end: Date;

  constructor(start: number | Date, end: number | Date) {
    const startDate = typeof start === "number" ? new Date(start) : start;
    const endDate = typeof end === "number" ? new Date(end) : end;

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error("Invalid date");
    }
    if (!isAfter(endDate, startDate)) {
      throw new Error("End must be after start");
    }

    this._start = startDate;
    this._end = endDate;
  }

  get start(): Date {
    return this._start;
  }

  get end(): Date {
    return this._end;
  }

  get durationMinutes(): number {
    return differenceInMinutes(this._end, this._start);
  }

  contains(date: Date): boolean {
    return !isBefore(date, this._start) && !isAfter(date, this._end);
  }

  overlaps(other: TimeRange): boolean {
    return areIntervalsOverlapping(
      { start: this._start, end: this._end },
      { start: other._start, end: other._end }
    );
  }

  static today(): TimeRange {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return new TimeRange(start, end);
  }

  static thisWeek(): TimeRange {
    const now = new Date();
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return new TimeRange(start, end);
  }
}