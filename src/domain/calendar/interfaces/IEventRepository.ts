import type { CalendarEvent, EventInput } from "../event";

export interface EventFilter {
  userId?: string;
  calendarId?: string;
  startDate?: Date;
  endDate?: Date;
  type?: string;
  system?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IEventRepository {
  findById(id: string): Promise<CalendarEvent | null>;
  findByUserId(userId: string): Promise<CalendarEvent[]>;
  findByDateRange(userId: string, start: Date, end: Date): Promise<CalendarEvent[]>;
  findByCalendarId(calendarId: string): Promise<CalendarEvent[]>;
  findPaginated(filter: EventFilter, page: number, pageSize: number): Promise<PaginatedResult<CalendarEvent>>;
  save(event: EventInput): Promise<CalendarEvent>;
  update(id: string, event: Partial<EventInput>): Promise<CalendarEvent>;
  delete(id: string): Promise<void>;
  count(filter?: EventFilter): Promise<number>;
}

export interface IEventRepositoryFactory {
  create(): IEventRepository;
}