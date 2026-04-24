/**
 * Single Event API v1
 * 
 * GET, PATCH, DELETE for individual events
 */

import { NextRequest, NextResponse } from "next/server";
import { ApiErrorBuilder } from "@/src/api";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    if (typeof window !== "undefined") {
      return NextResponse.json(
        { error: ApiErrorBuilder.badRequest("This endpoint requires server context") },
        { status: 400 }
      );
    }

    const { offlineStorage } = await import("@/lib/offline-storage");
    const { id } = await params;

    const events = await offlineStorage.getAllEvents();
    const event = events.find(e => e.id === id);

    if (!event) {
      return NextResponse.json(
        { error: ApiErrorBuilder.notFound("Event", id) },
        { status: 404 }
      );
    }

    const response = NextResponse.json({ data: event });
    response.headers.set("X-API-Version", "v1");
    
    return response;
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: ApiErrorBuilder.internalError("Failed to fetch event") },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    if (typeof window !== "undefined") {
      return NextResponse.json(
        { error: ApiErrorBuilder.badRequest("This endpoint requires server context") },
        { status: 400 }
      );
    }

    const { offlineStorage } = await import("@/lib/offline-storage");
    const { id } = await params;
    const body = await request.json();

    const events = await offlineStorage.getAllEvents();
    const existingEvent = events.find(e => e.id === id);

    if (!existingEvent) {
      return NextResponse.json(
        { error: ApiErrorBuilder.notFound("Event", id) },
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
      id,
      updatedAt: Date.now(),
    };

    await offlineStorage.saveEvent(updatedEvent);

    const response = NextResponse.json({ data: updatedEvent });
    response.headers.set("X-API-Version", "v1");
    
    return response;
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: ApiErrorBuilder.internalError("Failed to update event") },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    if (typeof window !== "undefined") {
      return NextResponse.json(
        { error: ApiErrorBuilder.badRequest("This endpoint requires server context") },
        { status: 400 }
      );
    }

    const { offlineStorage } = await import("@/lib/offline-storage");
    const { id } = await params;

    const events = await offlineStorage.getAllEvents();
    const event = events.find(e => e.id === id);

    if (!event) {
      return NextResponse.json(
        { error: ApiErrorBuilder.notFound("Event", id) },
        { status: 404 }
      );
    }

    await offlineStorage.deleteEvent(id);

    const response = NextResponse.json({ 
      data: { deleted: true, id } 
    });
    response.headers.set("X-API-Version", "v1");
    
    return response;
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: ApiErrorBuilder.internalError("Failed to delete event") },
      { status: 500 }
    );
  }
}