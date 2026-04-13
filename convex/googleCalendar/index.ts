import { v } from "convex/values";
import { mutation, query, internalMutation } from "../_generated/server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

export const initiateGoogleOAuth = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const state = JSON.stringify({ userId: args.userId });
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID || "");
    authUrl.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI || "");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/calendar.readonly");
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("state", state);

    return authUrl.toString();
  },
});

export const handleGoogleCallback = mutation({
  args: {
    userId: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenUrl = "https://oauth2.googleapis.com/token";
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: args.code,
        client_id: GOOGLE_CLIENT_ID || "",
        client_secret: GOOGLE_CLIENT_SECRET || "",
        redirect_uri: GOOGLE_REDIRECT_URI || "",
        grant_type: "authorization_code",
      }),
    });

    const tokens = await response.json();

    if (!tokens.access_token) {
      throw new Error("Failed to obtain access token");
    }

    const now = Date.now();
    
    // Store credentials (in production, encrypt these tokens)
    await ctx.db.insert("googleCredentials", {
      userId: args.userId,
      encryptedAccessToken: Buffer.from(tokens.access_token).toString("base64"),
      encryptedRefreshToken: Buffer.from(tokens.refresh_token || "").toString("base64"),
      tokenExpiry: now + (tokens.expires_in * 1000),
      createdAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});

export const syncGoogleCalendar = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const credentials = await ctx.db
      .query("googleCredentials")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!credentials) {
      throw new Error("No Google credentials found");
    }

    const accessToken = Buffer.from(credentials.encryptedAccessToken, "base64").toString();
    
    // Fetch events from Google Calendar
    const calendarUrl = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    const now = new Date().toISOString();
    calendarUrl.searchParams.set("timeMin", now);
    calendarUrl.searchParams.set("singleEvents", "true");
    calendarUrl.searchParams.set("orderBy", "startTime");

    const response = await fetch(calendarUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Google Calendar events");
    }

    const data = await response.json();
    const events = data.items || [];

    let syncedCount = 0;
    for (const gEvent of events) {
      if (gEvent.summary && gEvent.start?.dateTime) {
        syncedCount++;
      }
    }

    // Update last synced timestamp
    await ctx.db.patch(credentials._id, {
      lastSyncedAt: Date.now(),
    });

    return { syncedCount, total: events.length };
  },
});

export const getGoogleCredentials = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const credentials = await ctx.db
      .query("googleCredentials")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    return {
      connected: !!credentials,
      lastSyncedAt: credentials?.lastSyncedAt,
    };
  },
});

export const disconnectGoogleCalendar = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const credentials = await ctx.db
      .query("googleCredentials")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (credentials) {
      await ctx.db.delete(credentials._id);
    }

    return { success: true };
  },
});
