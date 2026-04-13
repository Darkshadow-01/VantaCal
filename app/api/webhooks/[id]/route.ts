import { NextRequest, NextResponse } from "next/server";

async function getWebhookService() {
  if (typeof window === "undefined") {
    throw new Error("This endpoint requires browser context");
  }
  const mod = await import("@/lib/webhook-service");
  return mod.webhookService;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const webhookService = await getWebhookService();
  try {
    const { id } = await params;
    const webhook = await webhookService.getWebhook(id);

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    return NextResponse.json({
      webhook: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        active: webhook.active,
        createdAt: webhook.createdAt,
      }
    });
  } catch (error) {
    console.error("Error fetching webhook:", error);
    return NextResponse.json({ error: "Failed to fetch webhook" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const webhookService = await getWebhookService();
  try {
    const { id } = await params;
    const body = await request.json();

    const { url, events, active, secret } = body;

    if (url) {
      try {
        new URL(url);
      } catch {
        return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
      }
    }

    if (events && (!Array.isArray(events) || events.length === 0)) {
      return NextResponse.json({ error: "Events must be a non-empty array" }, { status: 400 });
    }

    const updated = await webhookService.updateWebhook(id, {
      url,
      events,
      active,
      secret,
    });

    if (!updated) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      webhook: {
        id: updated.id,
        url: updated.url,
        events: updated.events,
        active: updated.active,
        createdAt: updated.createdAt,
      }
    });
  } catch (error) {
    console.error("Error updating webhook:", error);
    return NextResponse.json({ error: "Failed to update webhook" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const webhookService = await getWebhookService();
  try {
    const { id } = await params;
    const deleted = await webhookService.removeWebhook(id);

    if (!deleted) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Webhook deleted" });
  } catch (error) {
    console.error("Error deleting webhook:", error);
    return NextResponse.json({ error: "Failed to delete webhook" }, { status: 500 });
  }
}
