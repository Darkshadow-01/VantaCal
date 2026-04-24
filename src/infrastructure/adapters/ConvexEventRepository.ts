import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { IEventRepository } from "@/src/domain/calendar/interfaces/IEventRepository";
import type { CalendarEvent, EventInput } from "../../domain/calendar/event";
import { encryptData, decryptData, hasMasterKey } from "@/features/encryption/service/e2ee";

interface EncryptedEventDoc {
  _id: Id<"events">;
  _creationTime: number;
  userId: string;
  encryptedPayload: string;
  createdAt: number;
  updatedAt: number;
}

export class ConvexEventRepository implements IEventRepository {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  private getQueries() {
    return {
      events: useQuery(api.events.index.getEvents, this.userId ? { userId: this.userId } : "skip"),
      create: useMutation(api.events.index.createEvent),
      update: useMutation(api.events.index.updateEvent),
      delete: useMutation(api.events.index.deleteEvent),
    };
  }

  private async decryptEvent(doc: EncryptedEventDoc): Promise<CalendarEvent | null> {
    if (!hasMasterKey()) return null;
    try {
      const payload = JSON.parse(doc.encryptedPayload);
      const decrypted = await decryptData<EventInput>(payload);
      const now = Date.now();
      return {
        id: doc._id || `temp-${now}`,
        title: decrypted.title,
        startTime: decrypted.startTime,
        endTime: decrypted.endTime,
        allDay: decrypted.allDay || false,
        calendarId: "personal",
        color: decrypted.color || "#4F8DFD",
        type: (decrypted.system?.toLowerCase() as CalendarEvent["type"]) || "event",
        system: decrypted.system,
        completed: false,
        description: decrypted.description,
        location: decrypted.location,
        version: 1,
        updatedAt: now,
      };
    } catch {
      return null;
    }
  }

  async findById(id: string): Promise<CalendarEvent | null> {
    const docs = useQuery(api.events.index.getEvents, { userId: this.userId }) as EncryptedEventDoc[] | undefined;
    if (!docs) return null;
    const doc = docs.find(d => d._id === id);
    return doc ? this.decryptEvent(doc) : null;
  }

  async findByUserId(userId: string): Promise<CalendarEvent[]> {
    const docs = useQuery(api.events.index.getEvents, { userId }) as EncryptedEventDoc[] | undefined;
    if (!docs) return [];
    const decrypted = await Promise.all(docs.map(d => this.decryptEvent(d)));
    return decrypted.filter((e): e is CalendarEvent => e !== null);
  }

  async findByDateRange(userId: string, start: Date, end: Date): Promise<CalendarEvent[]> {
    const all = await this.findByUserId(userId);
    return all.filter(e => e.startTime >= start.getTime() && e.startTime <= end.getTime());
  }

  async findByCalendarId(calendarId: string): Promise<CalendarEvent[]> {
    const all = await this.findByUserId(this.userId);
    return all.filter(e => e.calendarId === calendarId);
  }

  async save(event: EventInput): Promise<CalendarEvent> {
    const create = useMutation(api.events.index.createEvent);
    const encrypted = await encryptData(event);
    const now = Date.now();
    const result = await create({
      userId: event.userId,
      encryptedPayload: JSON.stringify(encrypted),
    });
    return {
      id: result as string,
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
  }

  async update(id: string, event: Partial<EventInput>): Promise<CalendarEvent> {
    const update = useMutation(api.events.index.updateEvent);
    const encrypted = await encryptData(event);
    await update({
      eventId: id as unknown as Id<"events">,
      encryptedPayload: JSON.stringify(encrypted),
    });
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error("Event not found");
    }
    const updated: CalendarEvent = {
      ...existing,
      title: event.title ?? existing.title,
      description: event.description ?? existing.description,
      startTime: event.startTime ?? existing.startTime,
      endTime: event.endTime ?? existing.endTime,
      allDay: event.allDay ?? existing.allDay,
      system: event.system ?? existing.system,
      color: event.color ?? existing.color,
      location: event.location ?? existing.location,
      updatedAt: Date.now(),
    };
    return updated;
  }

  async delete(id: string): Promise<void> {
    const remove = useMutation(api.events.index.deleteEvent);
    await remove({ eventId: id as unknown as Id<"events"> });
  }

  async findPaginated(filter: { userId?: string; calendarId?: string; startDate?: Date; endDate?: Date; type?: string; system?: string }, page: number, pageSize: number): Promise<{ items: CalendarEvent[]; total: number; page: number; pageSize: number }> {
    const all = await this.findByUserId(filter.userId || this.userId);
    let filtered = all;
    
    if (filter.calendarId) filtered = filtered.filter(e => e.calendarId === filter.calendarId);
    if (filter.startDate) filtered = filtered.filter(e => e.startTime >= filter.startDate!.getTime());
    if (filter.endDate) filtered = filtered.filter(e => e.startTime <= filter.endDate!.getTime());
    if (filter.type) filtered = filtered.filter(e => e.type === filter.type);
    if (filter.system) filtered = filtered.filter(e => e.system === filter.system);

    const total = filtered.length;
    const offset = (page - 1) * pageSize;
    const items = filtered.slice(offset, offset + pageSize);

    return { items, total, page, pageSize };
  }

  async count(filter?: { userId?: string; calendarId?: string; startDate?: Date; endDate?: Date; type?: string; system?: string }): Promise<number> {
    const all = await this.findByUserId(filter?.userId || this.userId);
    let filtered = all;
    
    if (filter?.calendarId) filtered = filtered.filter(e => e.calendarId === filter.calendarId);
    if (filter?.startDate) filtered = filtered.filter(e => e.startTime >= filter.startDate!.getTime());
    if (filter?.endDate) filtered = filtered.filter(e => e.startTime <= filter.endDate!.getTime());
    if (filter?.type) filtered = filtered.filter(e => e.type === filter.type);
    if (filter?.system) filtered = filtered.filter(e => e.system === filter.system);

    return filtered.length;
  }
}

export function createEventRepository(userId: string): IEventRepository {
  return new ConvexEventRepository(userId);
}