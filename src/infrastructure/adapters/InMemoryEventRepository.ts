import type { IEventRepository, EventFilter, PaginatedResult } from "@/src/domain/calendar/interfaces/IEventRepository";
import type { CalendarEvent, EventInput } from "@/src/domain/calendar/event";

export class InMemoryEventRepository implements IEventRepository {
  private events: Map<string, CalendarEvent> = new Map();

  async findById(id: string): Promise<CalendarEvent | null> {
    return this.events.get(id) || null;
  }

  async findByUserId(userId: string): Promise<CalendarEvent[]> {
    return Array.from(this.events.values()).filter((e) => e.userId === userId);
  }

  async findByDateRange(userId: string, start: Date, end: Date): Promise<CalendarEvent[]> {
    return Array.from(this.events.values()).filter(
      (e) => e.userId === userId && e.startTime >= start.getTime() && e.startTime <= end.getTime()
    );
  }

  async findByCalendarId(calendarId: string): Promise<CalendarEvent[]> {
    return Array.from(this.events.values()).filter((e) => e.calendarId === calendarId);
  }

  async findPaginated(filter: EventFilter, page: number, pageSize: number): Promise<PaginatedResult<CalendarEvent>> {
    let filtered = Array.from(this.events.values());

    if (filter.userId) {
      filtered = filtered.filter(e => e.userId === filter.userId);
    }
    if (filter.calendarId) {
      filtered = filtered.filter(e => e.calendarId === filter.calendarId);
    }
    if (filter.startDate) {
      filtered = filtered.filter(e => e.startTime >= filter.startDate!.getTime());
    }
    if (filter.endDate) {
      filtered = filtered.filter(e => e.startTime <= filter.endDate!.getTime());
    }
    if (filter.type) {
      filtered = filtered.filter(e => e.type === filter.type);
    }
    if (filter.system) {
      filtered = filtered.filter(e => e.system === filter.system);
    }

    const total = filtered.length;
    const offset = (page - 1) * pageSize;
    const items = filtered.slice(offset, offset + pageSize);

    return { items, total, page, pageSize };
  }

  async count(filter?: EventFilter): Promise<number> {
    let events = Array.from(this.events.values());
    
    if (filter) {
      if (filter.userId) events = events.filter(e => e.userId === filter.userId);
      if (filter.calendarId) events = events.filter(e => e.calendarId === filter.calendarId);
      if (filter.startDate) events = events.filter(e => e.startTime >= filter.startDate!.getTime());
      if (filter.endDate) events = events.filter(e => e.startTime <= filter.endDate!.getTime());
      if (filter.type) events = events.filter(e => e.type === filter.type);
      if (filter.system) events = events.filter(e => e.system === filter.system);
    }
    
    return events.length;
  }

  async save(event: EventInput): Promise<CalendarEvent> {
    const id = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const now = Date.now();
    const calendarEvent: CalendarEvent = {
      id,
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      allDay: event.allDay,
      calendarId: "personal",
      color: event.color || "#4F8DFD",
      type: event.system?.toLowerCase() || "event",
      system: event.system,
      location: event.location,
      version: 1,
      updatedAt: now,
    };
    this.events.set(id, calendarEvent);
    return calendarEvent;
  }

  async update(id: string, event: Partial<EventInput>): Promise<CalendarEvent> {
    const existing = this.events.get(id);
    if (!existing) {
      throw new Error("Event not found");
    }
    const updated: CalendarEvent = {
      id: existing.id,
      title: event.title ?? existing.title,
      description: event.description ?? existing.description,
      startTime: event.startTime ?? existing.startTime,
      endTime: event.endTime ?? existing.endTime,
      allDay: event.allDay ?? existing.allDay,
      calendarId: existing.calendarId,
      color: event.color ?? existing.color,
      type: event.system?.toLowerCase() ?? existing.type,
      system: event.system ?? existing.system,
      location: event.location ?? existing.location,
      version: existing.version + 1,
      updatedAt: Date.now(),
    };
    this.events.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.events.delete(id);
  }

  clear(): void {
    this.events.clear();
  }

  getAll(): CalendarEvent[] {
    return Array.from(this.events.values());
  }

  setEvents(events: CalendarEvent[]): void {
    this.events.clear();
    events.forEach((e) => this.events.set(e.id, e));
  }
}