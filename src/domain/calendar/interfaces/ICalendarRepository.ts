import type { Calendar } from "../event";

export interface ICalendarRepository {
  findById(id: string): Promise<Calendar | null>;
  findByUserId(userId: string): Promise<Calendar[]>;
  save(calendar: Calendar): Promise<Calendar>;
  update(calendar: Calendar): Promise<Calendar>;
  delete(id: string): Promise<void>;
}

export interface ICalendarVisibilityRepository {
  getVisibility(userId: string): Promise<Record<string, boolean>>;
  setVisibility(userId: string, visibility: Record<string, boolean>): Promise<void>;
}