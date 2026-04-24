import { NextRequest, NextResponse } from "next/server";
import { ApiErrorBuilder, createPaginationMeta } from "@/src/api";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/src/api/pagination";

export async function GET(request: NextRequest) {
  try {
    if (typeof window !== "undefined") {
      return NextResponse.json(
        { error: ApiErrorBuilder.badRequest("This endpoint requires browser context") },
        { status: 400 }
      );
    }

    const { offlineStorage } = await import("@/lib/offline-storage");
    const searchParams = request.nextUrl.searchParams;

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10)));
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const calendarId = searchParams.get("calendarId");
    const type = searchParams.get("type");

    let events = await offlineStorage.getAllEvents();

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      events = events.filter(e => {
        if (!e.startTime) return false;
        const eventDate = new Date(e.startTime);
        return eventDate >= start && eventDate <= end;
      });
    }

    if (calendarId) {
      events = events.filter(e => e.calendarId === calendarId);
    }

    if (type) {
      events = events.filter(e => e.type === type);
    }

    const total = events.length;
    const offset = (page - 1) * pageSize;
    const paginatedEvents = events.slice(offset, offset + pageSize);
    const pagination = createPaginationMeta(page, pageSize, total);

    return NextResponse.json({
      items: paginatedEvents,
      pagination: {
        ...pagination,
        pageSize,
      },
      links: {
        self: `/api/events?page=${page}&pageSize=${pageSize}`,
        next: pagination.hasNext ? `/api/events?page=${page + 1}&pageSize=${pageSize}` : undefined,
        prev: pagination.hasPrev ? `/api/events?page=${page - 1}&pageSize=${pageSize}` : undefined,
      },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: ApiErrorBuilder.internalError("Failed to fetch events") },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (typeof window !== "undefined") {
      return NextResponse.json(
        { error: ApiErrorBuilder.badRequest("This endpoint requires browser context") },
        { status: 400 }
      );
    }

    const { offlineStorage } = await import("@/lib/offline-storage");
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json(
        { error: ApiErrorBuilder.validationError("Event title is required", { field: "title" }) },
        { status: 422 }
      );
    }

    if (!body.startTime) {
      return NextResponse.json(
        { error: ApiErrorBuilder.validationError("Start time is required", { field: "startTime" }) },
        { status: 422 }
      );
    }
    
    if (body.endTime && body.endTime <= body.startTime) {
      return NextResponse.json(
        { error: ApiErrorBuilder.validationError("End time must be after start time", { field: "endTime" }) },
        { status: 422 }
      );
    }

    const event = {
      id: body.id || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: body.title || "Untitled",
      startTime: body.startTime || Date.now(),
      endTime: body.endTime || (body.startTime ? body.startTime + 3600000 : Date.now() + 3600000),
      allDay: body.allDay || false,
      calendarId: body.calendarId || "personal",
      color: body.color || "#5B8DEF",
      type: body.type || "event",
      system: body.system,
      completed: body.completed || false,
      guests: body.guests || [],
      location: body.location || "",
      description: body.description || "",
      notification: body.notification,
      reminder: body.reminder,
      recurrence: body.recurrence,
      recurringEventId: body.recurringEventId,
      isRecurringInstance: body.isRecurringInstance,
      version: 1,
      updatedAt: Date.now(),
      synced: true,
      deleted: false,
    };

    await offlineStorage.saveEvent(event);

    return NextResponse.json({ data: event }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: ApiErrorBuilder.internalError("Failed to create event") },
      { status: 500 }
    );
  }
}