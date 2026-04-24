import { NextRequest, NextResponse } from "next/server";
import { ApiErrorBuilder } from "@/src/api";

const DEFAULT_CALENDARS = [
  { id: "personal", name: "Personal", color: "#4F8DFD", visible: true },
  { id: "birthdays", name: "Birthdays", color: "#EC4899", visible: true },
  { id: "tasks", name: "Tasks", color: "#F59E0B", visible: true },
  { id: "holidays", name: "Holidays in India", color: "#3BA55D", visible: true },
];

export async function GET() {
  try {
    return NextResponse.json({ data: DEFAULT_CALENDARS });
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
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: ApiErrorBuilder.validationError("Calendar name is required", { field: "name" }) },
        { status: 422 }
      );
    }

    const calendar = {
      id: body.id || `cal_${Date.now()}`,
      name: body.name,
      color: body.color || "#4F8DFD",
      visible: body.visible ?? true,
    };
    
    return NextResponse.json({ data: calendar }, { status: 201 });
  } catch (error) {
    console.error("Error creating calendar:", error);
    return NextResponse.json(
      { error: ApiErrorBuilder.internalError("Failed to create calendar") },
      { status: 500 }
    );
  }
}