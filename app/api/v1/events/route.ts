/**
 * Events API v1
 * 
 * Standardized response format with pagination
 * Previous versions deprecated in favor of this version
 */

import { NextRequest, NextResponse } from "next/server";
import { ApiErrorBuilder, createPaginationMeta, checkRateLimit, getRateLimitKey, getClientIp, DEFAULT_RATE_LIMIT } from "@/src/api";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/src/api/pagination";

export async function GET(request: NextRequest) {
  try {
if (typeof window !== "undefined") {
      return NextResponse.json(
        { error: ApiErrorBuilder.badRequest("This endpoint requires browser context") },
        { status: 400 }
      );
    }

    const clientIp = getClientIp(request);
    const rateLimitKey = getRateLimitKey(clientIp, "events");
    const rateLimit = checkRateLimit(rateLimitKey, DEFAULT_RATE_LIMIT);

    if (!rateLimit.allowed) {
      const response = NextResponse.json(
        { error: ApiErrorBuilder.serviceUnavailable("Rate limit exceeded. Try again later.") },
        { status: 429 }
      );
      response.headers.set("X-RateLimit-Remaining", "0");
      response.headers.set("X-RateLimit-Reset", String(Math.floor(rateLimit.resetAt / 1000)));
      return response;
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

    const response = NextResponse.json({
      data: paginatedEvents,
      meta: {
        pagination: {
          ...pagination,
          pageSize,
        },
        links: {
          self: `/api/v1/events?page=${page}&pageSize=${pageSize}`,
          next: pagination.hasNext ? `/api/v1/events?page=${page + 1}&pageSize=${pageSize}` : undefined,
          prev: pagination.hasPrev ? `/api/v1/events?page=${page - 1}&pageSize=${pageSize}` : undefined,
        },
      },
    });

    // Add API version header
    response.headers.set("X-API-Version", "v1");
    response.headers.set("X-API-Deprecation-Date", "2026-06-01");
    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
    response.headers.set("X-RateLimit-Reset", String(Math.floor(rateLimit.resetAt / 1000)));
    
    return response;
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

    const clientIp = getClientIp(request);
    const rateLimitKey = getRateLimitKey(clientIp, "events");
    const rateLimit = checkRateLimit(rateLimitKey, DEFAULT_RATE_LIMIT);

    if (!rateLimit.allowed) {
      const response = NextResponse.json(
        { error: ApiErrorBuilder.serviceUnavailable("Rate limit exceeded. Try again later.") },
        { status: 429 }
      );
      response.headers.set("X-RateLimit-Remaining", "0");
      response.headers.set("X-RateLimit-Reset", String(Math.floor(rateLimit.resetAt / 1000)));
      return response;
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

    const response = NextResponse.json({ data: event }, { status: 201 });
    response.headers.set("X-API-Version", "v1");
    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
    response.headers.set("X-RateLimit-Reset", String(Math.floor(rateLimit.resetAt / 1000)));
    
    return response;
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: ApiErrorBuilder.internalError("Failed to create event") },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (typeof window !== "undefined") {
      return NextResponse.json(
        { error: ApiErrorBuilder.badRequest("This endpoint requires browser context") },
        { status: 400 }
      );
    }

    const clientIp = getClientIp(request);
    const rateLimitKey = getRateLimitKey(clientIp, "events");
    const rateLimit = checkRateLimit(rateLimitKey, DEFAULT_RATE_LIMIT);

    if (!rateLimit.allowed) {
      const response = NextResponse.json(
        { error: ApiErrorBuilder.serviceUnavailable("Rate limit exceeded. Try again later.") },
        { status: 429 }
      );
      response.headers.set("X-RateLimit-Remaining", "0");
      response.headers.set("X-RateLimit-Reset", String(Math.floor(rateLimit.resetAt / 1000)));
      return response;
    }

    const { offlineStorage } = await import("@/lib/offline-storage");
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("id");

    if (!eventId) {
      return NextResponse.json(
        { error: ApiErrorBuilder.validationError("Event ID is required", { field: "id" }) },
        { status: 422 }
      );
    }

    const events = await offlineStorage.getAllEvents();
    const event = events.find(e => e.id === eventId);

    if (!event) {
      return NextResponse.json(
        { error: ApiErrorBuilder.notFound("Event", eventId) },
        { status: 404 }
      );
    }

    await offlineStorage.deleteEvent(eventId);

    const response = NextResponse.json({ 
      data: { deleted: true, id: eventId } 
    });
    response.headers.set("X-API-Version", "v1");
    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
    response.headers.set("X-RateLimit-Reset", String(Math.floor(rateLimit.resetAt / 1000)));
    
    return response;
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: ApiErrorBuilder.internalError("Failed to delete event") },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (typeof window !== "undefined") {
      return NextResponse.json(
        { error: ApiErrorBuilder.badRequest("This endpoint requires browser context") },
        { status: 400 }
      );
    }

    const clientIp = getClientIp(request);
    const rateLimitKey = getRateLimitKey(clientIp, "events");
    const rateLimit = checkRateLimit(rateLimitKey, DEFAULT_RATE_LIMIT);

    if (!rateLimit.allowed) {
      const response = NextResponse.json(
        { error: ApiErrorBuilder.serviceUnavailable("Rate limit exceeded. Try again later.") },
        { status: 429 }
      );
      response.headers.set("X-RateLimit-Remaining", "0");
      response.headers.set("X-RateLimit-Reset", String(Math.floor(rateLimit.resetAt / 1000)));
      return response;
    }

    const { offlineStorage } = await import("@/lib/offline-storage");
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("id");
    const body = await request.json();

    if (!eventId) {
      return NextResponse.json(
        { error: ApiErrorBuilder.validationError("Event ID is required", { field: "id" }) },
        { status: 422 }
      );
    }

    const events = await offlineStorage.getAllEvents();
    const existingEvent = events.find(e => e.id === eventId);

    if (!existingEvent) {
      return NextResponse.json(
        { error: ApiErrorBuilder.notFound("Event", eventId) },
        { status: 404 }
      );
    }

    if (body.endTime && body.startTime && body.endTime <= body.startTime) {
      return NextResponse.json(
        { error: ApiErrorBuilder.validationError("End time must be after start time", { field: "endTime" }) },
        { status: 422 }
      );
    }

    const updatedEvent = {
      ...existingEvent,
      ...body,
      id: eventId,
      updatedAt: Date.now(),
    };

    await offlineStorage.saveEvent(updatedEvent);

    const response = NextResponse.json({ data: updatedEvent });
    response.headers.set("X-API-Version", "v1");
    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
    response.headers.set("X-RateLimit-Reset", String(Math.floor(rateLimit.resetAt / 1000)));
    
    return response;
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: ApiErrorBuilder.internalError("Failed to update event") },
      { status: 500 }
    );
  }
}