import { NextRequest, NextResponse } from "next/server";
import type { ApiKeyPermission } from "@/lib/api-auth";

async function getApiKeyService() {
  if (typeof window === "undefined") {
    throw new Error("This endpoint requires browser context");
  }
  const mod = await import("@/lib/api-auth");
  return mod.apiKeyService;
}

async function getApiKeyAuth() {
  const mod = await import("@/lib/api-auth");
  return mod.withApiKeyAuth;
}

export async function GET(request: NextRequest) {
  if (typeof window === "undefined") {
    return NextResponse.json({ error: "This endpoint requires browser context" }, { status: 400 });
  }
  const apiKeyService = await getApiKeyService();
  const withApiKeyAuth = await getApiKeyAuth();
  const auth = await withApiKeyAuth(request, "admin");
  if (!auth.authorized) return auth.error!;

  try {
    const keys = apiKeyService.getAllKeys();
    return NextResponse.json({ keys });
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (typeof window === "undefined") {
    return NextResponse.json({ error: "This endpoint requires browser context" }, { status: 400 });
  }
  const apiKeyService = await getApiKeyService();
  const withApiKeyAuth = await getApiKeyAuth();
  const auth = await withApiKeyAuth(request, "admin");
  if (!auth.authorized) return auth.error!;

  try {
    const body = await request.json();
    const { name, permissions } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return NextResponse.json({ error: "At least one permission is required" }, { status: 400 });
    }

    const validPermissions: ApiKeyPermission[] = [
      "events:read",
      "events:write",
      "events:delete",
      "calendars:read",
      "calendars:write",
      "webhooks:read",
      "webhooks:write",
      "admin",
    ];

    const invalidPermissions = permissions.filter(
      (p: string) => !validPermissions.includes(p as ApiKeyPermission)
    );
    if (invalidPermissions.length > 0) {
      return NextResponse.json(
        { error: `Invalid permissions: ${invalidPermissions.join(", ")}` },
        { status: 400 }
      );
    }

    const apiKey = apiKeyService.createKey(name, permissions);

    return NextResponse.json(
      {
        success: true,
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          key: apiKey.key,
          permissions: apiKey.permissions,
          createdAt: apiKey.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating API key:", error);
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
  }
}
