import { NextRequest, NextResponse } from "next/server";
import type { WebhookEventType } from "@/lib/webhook-service";

async function getWebhookService() {
  if (typeof window === "undefined") {
    throw new Error("This endpoint requires browser context");
  }
  const mod = await import("@/lib/webhook-service");
  return mod.webhookService;
}

export async function GET() {
  const webhookService = await getWebhookService();
  try {
    const webhooks = await webhookService.getWebhooks();
    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const webhookService = await getWebhookService();
  try {
    const body = await request.json();
    const { url, events, secret } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "At least one event type is required" }, { status: 400 });
    }

    const validEvents: WebhookEventType[] = [
      "event.created",
      "event.updated",
      "event.deleted",
      "event.completed",
      "calendar.created",
      "calendar.updated",
      "calendar.deleted",
    ];

    const invalidEvents = events.filter((e: string) => !validEvents.includes(e as WebhookEventType));
    if (invalidEvents.length > 0) {
      return NextResponse.json({ 
        error: `Invalid event types: ${invalidEvents.join(", ")}` 
      }, { status: 400 });
    }

    const webhook = await webhookService.registerWebhook(url, events, secret);

    return NextResponse.json({ 
      success: true, 
      webhook: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        active: webhook.active,
        createdAt: webhook.createdAt,
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating webhook:", error);
    return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 });
  }
}
