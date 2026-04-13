import { NextRequest, NextResponse } from "next/server";

const DEFAULT_CALENDARS = [
  { id: "personal", name: "Personal", color: "#4F8DFD", visible: true },
  { id: "birthdays", name: "Birthdays", color: "#EC4899", visible: true },
  { id: "tasks", name: "Tasks", color: "#F59E0B", visible: true },
  { id: "holidays", name: "Holidays in India", color: "#3BA55D", visible: true },
];

export async function GET() {
  try {
    return NextResponse.json({ calendars: DEFAULT_CALENDARS });
  } catch (error) {
    console.error("Error fetching calendars:", error);
    return NextResponse.json({ error: "Failed to fetch calendars" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const calendar = {
      id: body.id || `cal_${Date.now()}`,
      name: body.name,
      color: body.color || "#4F8DFD",
      visible: body.visible ?? true,
    };
    
    return NextResponse.json({ success: true, calendar }, { status: 201 });
  } catch (error) {
    console.error("Error creating calendar:", error);
    return NextResponse.json({ error: "Failed to create calendar" }, { status: 500 });
  }
}
