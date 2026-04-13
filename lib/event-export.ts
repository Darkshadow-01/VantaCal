import type { CalendarEvent } from "@/lib/types";

export function exportEventsAsJSON(events: CalendarEvent[]): string {
  const exportData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    count: events.length,
    events: events.map(e => ({
      id: e.id,
      title: e.title,
      description: e.description,
      startTime: e.startTime,
      endTime: e.endTime,
      allDay: e.allDay,
      calendarId: e.calendarId,
      color: e.color,
      type: e.type,
      system: e.system,
      completed: e.completed,
      location: e.location,
      recurrence: e.recurrence,
      deleted: e.deleted,
      version: e.version,
      updatedAt: e.updatedAt,
    })),
  };
  
  return JSON.stringify(exportData, null, 2);
}

export function downloadJSON(events: CalendarEvent[], filename: string = "vancal-export"): void {
  const json = exportEventsAsJSON(events);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportEventsAsICS(events: CalendarEvent[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//VanCal//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  
  for (const event of events) {
    if (event.deleted) continue;
    
    const uid = event.id;
    const dtstart = event.startTime 
      ? new Date(event.startTime).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
      : "";
    const dtend = event.endTime 
      ? new Date(event.endTime).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
      : "";
    
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTART:${dtstart}`);
    if (dtend) lines.push(`DTEND:${dtend}`);
    
    const summary = event.title || "Untitled Event";
    lines.push(`SUMMARY:${summary.replace(/[,;]/g, "\\$1")}`);
    
    if (event.description) {
      lines.push(`DESCRIPTION:${event.description.replace(/[,;]/g, "\\$1")}`);
    }
    
    if (event.location) {
      lines.push(`LOCATION:${event.location.replace(/[,;]/g, "\\$1")}`);
    }
    
    if (event.recurrence && typeof event.recurrence === "string") {
      const rrule = event.recurrence === "daily" ? "FREQ=DAILY" :
                   event.recurrence === "weekly" ? "FREQ=WEEKLY" :
                   event.recurrence === "monthly" ? "FREQ=MONTHLY" :
                   "FREQ=YEARLY";
      lines.push(`RRULE:${rrule}`);
    }
    
    lines.push("END:VEVENT");
  }
  
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadICS(events: CalendarEvent[], filename: string = "vancal-events"): void {
  const ics = exportEventsAsICS(events);
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split("T")[0]}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function loadEventsFromJSON(jsonString: string): Promise<CalendarEvent[]> {
  try {
    const data = JSON.parse(jsonString);
    if (data.events && Array.isArray(data.events)) {
      return data.events;
    }
    return [];
  } catch {
    return [];
  }
}