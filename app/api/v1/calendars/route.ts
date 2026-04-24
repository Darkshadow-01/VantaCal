/**
 * Calendars API v1
 * 
 * Standardized response format with pagination
 * Previous versions deprecated in favor of this version
 */

import { NextRequest, NextResponse } from "next/server";
import { ApiErrorBuilder, createPaginationMeta } from "@/src/api";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/src/api/pagination";

interface CalendarData {
  id: string;
  name: string;
  color: string;
  description?: string;
  ownerId: string;
  isDefault: boolean;
  visible: boolean;
  createdAt: number;
  updatedAt: number;
}

export async function GET(request: NextRequest) {
  try {
    if (typeof window !== "undefined") {
      return NextResponse.json(
        { error: ApiErrorBuilder.badRequest("This endpoint requires server context") },
        { status: 400 }
      );
    }

    const { offlineStorage } = await import("@/lib/offline-storage");
    const searchParams = request.nextUrl.searchParams;

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10)));
    
    const calendars: CalendarData[] = [
      {
        id: "personal",
        name: "Personal",
        color: "#5B8DEF",
        description: "My personal calendar",
        ownerId: "user",
        isDefault: true,
        visible: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: "work",
        name: "Work",
        color: "#F59E0B",
        description: "Work events",
        ownerId: "user",
        isDefault: false,
        visible: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: "health",
        name: "Health",
        color: "#10B981",
        description: "Health and fitness",
        ownerId: "user",
        isDefault: false,
        visible: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: "relationships",
        name: "Relationships",
        color: "#EC4899",
        description: "Family and friends",
        ownerId: "user",
        isDefault: false,
        visible: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const total = calendars.length;
    const offset = (page - 1) * pageSize;
    const paginatedCalendars = calendars.slice(offset, offset + pageSize);
    const pagination = createPaginationMeta(page, pageSize, total);

    const response = NextResponse.json({
      data: paginatedCalendars,
      meta: {
        pagination: {
          ...pagination,
          pageSize,
        },
        links: {
          self: `/api/v1/calendars?page=${page}&pageSize=${pageSize}`,
          next: pagination.hasNext ? `/api/v1/calendars?page=${page + 1}&pageSize=${pageSize}` : undefined,
          prev: pagination.hasPrev ? `/api/v1/calendars?page=${page - 1}&pageSize=${pageSize}` : undefined,
        },
      },
    });

    response.headers.set("X-API-Version", "v1");
    response.headers.set("X-API-Deprecation-Date", "2026-06-01");
    
    return response;
  } catch (error) {
    console.error("Error fetching calendars:", error);
    return NextResponse.json(
      { error: ApiErrorBuilder.internalError("Failed to fetch calendars") },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (typeof window !== "undefined") {
      return NextResponse.json(
        { error: ApiErrorBuilder.badRequest("This endpoint requires server context") },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: ApiErrorBuilder.validationError("Calendar name is required", { field: "name" }) },
        { status: 422 }
      );
    }

    const calendar: CalendarData = {
      id: body.id || `cal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: body.name,
      color: body.color || "#5B8DEF",
      description: body.description || "",
      ownerId: body.ownerId || "user",
      isDefault: false,
      visible: body.visible ?? true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const response = NextResponse.json({ data: calendar }, { status: 201 });
    response.headers.set("X-API-Version", "v1");
    
    return response;
  } catch (error) {
    console.error("Error creating calendar:", error);
    return NextResponse.json(
      { error: ApiErrorBuilder.internalError("Failed to create calendar") },
      { status: 500 }
    );
  }
}