/**
 * Events API v1
 * 
 * Standardized response format with pagination
 * Previous versions deprecated in favor of this version
 */

import { NextRequest, NextResponse } from "next/server";
import { ApiErrorBuilder, createPaginationMeta, checkRateLimit, getRateLimitKey, getClientIp, DEFAULT_RATE_LIMIT } from "@/src/api";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/src/api/pagination";
import { EventCreateSchema, EventQuerySchema, EventUpdateSchema, validateRequest } from "@/src/api/schemas";

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

    const validation = validateRequest(EventCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: ApiErrorBuilder.validationError(
            "Invalid event data",
            { errors: validation.errors.flatten().fieldErrors }
          ) 
        },
        { status: 422 }
      );
    }

    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: validation.data.title,
      description: validation.data.description,
      startTime: validation.data.startTime,
      endTime: validation.data.endTime,
      allDay: validation.data.allDay,
      calendarId: validation.data.calendarId,
      color: validation.data.color || "#5B8DEF",
      type: validation.data.type,
      system: validation.data.system,
      location: validation.data.location,
      guests: validation.data.guests,
      reminder: validation.data.reminder,
      notification: validation.data.notification,
      recurrence: validation.data.recurrence,
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

    const validation = validateRequest(EventUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: ApiErrorBuilder.validationError(
            "Invalid event data",
            { errors: validation.errors.flatten().fieldErrors }
          ) 
        },
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

    const updatedEvent = {
      ...existingEvent,
      ...validation.data,
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