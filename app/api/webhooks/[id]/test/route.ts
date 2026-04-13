import { NextRequest, NextResponse } from "next/server";
import { webhookService } from "@/lib/webhook-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await webhookService.testWebhook(id);

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (error) {
    console.error("Error testing webhook:", error);
    return NextResponse.json({ error: "Failed to test webhook" }, { status: 500 });
  }
}
