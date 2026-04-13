import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (typeof window === "undefined") {
    return NextResponse.json({ error: "This endpoint requires browser context" }, { status: 400 });
  }
  const { offlineStorage } = await import("@/lib/offline-storage");
  try {
    const searchParams = request.nextUrl.searchParams;
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

    return NextResponse.json({ events, count: events.length });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (typeof window === "undefined") {
    return NextResponse.json({ error: "This endpoint requires browser context" }, { status: 400 });
  }
  const { offlineStorage } = await import("@/lib/offline-storage");
  try {
    const body = await request.json();
    
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

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
