import type { CalendarEvent } from "../../calendar/model/types";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

let tokenClient: any = null;

export async function initGoogleApi(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.onload = () => {
      window.gapi.load("client", async () => {
        await window.gapi.client.init({
          apiKey: GOOGLE_API_KEY,
          discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
        });
        
        const script2 = document.createElement("script");
        script2.src = "https://accounts.google.com/gsi/client";
        script2.onload = () => {
          tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: SCOPES,
            callback: () => {},
          });
          resolve(true);
        };
        document.body.appendChild(script2);
      });
    };
    document.body.appendChild(script);
  });
}

export async function authorizeGoogle(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!tokenClient) {
      resolve(false);
      return;
    }

    tokenClient.callback = (response: any) => {
      resolve(response.access_token ? true : false);
    };

    try {
      tokenClient.requestAccessToken({ prompt: "consent" });
    } catch (error) {
      console.error("Google auth error:", error);
      resolve(false);
    }
  });
}

export async function fetchGoogleEvents(
  timeMin?: Date,
  timeMax?: Date
): Promise<CalendarEvent[]> {
  if (!window.gapi?.client) {
    console.error("Google API not initialized");
    return [];
  }

  try {
    const startDate = timeMin || new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const endDate = timeMax || new Date();
    endDate.setMonth(endDate.getMonth() + 12);

    const response = await window.gapi.client.calendar.events.list({
      calendarId: "primary",
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    return response.result.items.map((event: any) => convertGoogleEvent(event));
  } catch (error) {
    console.error("Error fetching Google events:", error);
    return [];
  }
}

export function convertGoogleEvent(googleEvent: any): CalendarEvent {
  const start = googleEvent.start.dateTime || googleEvent.start.date;
  const end = googleEvent.end.dateTime || googleEvent.end.date;
  
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  const hour = startDate.getHours();
  const endHour = endDate.getHours();
  
  const colors: Record<string, string> = {
    default: "#5B8DEF",
    pastelBlue: "#4F8DFD",
    pastelGreen: "#3BA55D",
    pastelRed: "#EF4444",
    pastelYellow: "#F59E0B",
    pastelOrange: "#F97316",
    pastelPurple: "#8B5CF6",
    pastelPink: "#EC4899",
    pastelTeal: "#14B8A6",
  };

  return {
    id: googleEvent.id || `google-${Date.now()}`,
    title: googleEvent.summary || "Untitled Event",
    startTime: startDate.getTime(),
    endTime: endDate.getTime(),
    allDay: !hour,
    calendarId: "personal",
    color: colors[googleEvent.colorId] || colors.default,
    type: googleEvent.eventType || "event",
    completed: false,
    description: googleEvent.description || "",
    location: googleEvent.location || "",
    guests: googleEvent.attendees?.map((a: any) => a.email) || [],
    recurrence: undefined,
    isRecurringInstance: false,
    version: 1,
    updatedAt: Date.now(),
  };
}

export function isGoogleConfigured(): boolean {
  return !!(GOOGLE_CLIENT_ID && GOOGLE_API_KEY && GOOGLE_CLIENT_ID !== "your-client-id.apps.googleusercontent.com");
}

export function getGoogleConfigStatus(): { configured: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === "your-client-id.apps.googleusercontent.com") {
    missing.push("Google Client ID");
  }
  if (!GOOGLE_API_KEY || GOOGLE_API_KEY === "your-api-key") {
    missing.push("Google API Key");
  }
  return { configured: missing.length === 0, missing };
}