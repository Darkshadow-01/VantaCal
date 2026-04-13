import { NextRequest, NextResponse } from "next/server";

async function getOfflineStorage() {
  if (typeof window === "undefined") {
    throw new Error("This endpoint requires browser context");
  }
  const mod = await import("@/lib/offline-storage");
  return mod.offlineStorage;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const offlineStorage = await getOfflineStorage();
  try {
    const { id } = await params;
    const event = await offlineStorage.getEvent(id);
    
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    return NextResponse.json({ event });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const offlineStorage = await getOfflineStorage();
  try {
    const { id } = await params;
    const body = await request.json();
    
    const existingEvent = await offlineStorage.getEvent(id);
    
    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    const updatedEvent = {
      ...existingEvent,
      ...body,
      id,
      synced: true,
    };
    
    await offlineStorage.saveEvent(updatedEvent);
    
    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const offlineStorage = await getOfflineStorage();
  try {
    const { id } = await params;
    
    const existingEvent = await offlineStorage.getEvent(id);
    
    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    await offlineStorage.hardDeleteEvent(id);
    
    return NextResponse.json({ success: true, message: "Event deleted" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
