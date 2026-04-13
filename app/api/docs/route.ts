import { NextResponse } from "next/server";

const API_DOCS = {
  title: "VanCal API",
  version: "1.0.0",
  description: "API for VanCal calendar application with webhook support",
  baseUrl: "/api",
  authentication: {
    header: "x-api-key",
    description: "Include your API key in the x-api-key header for authenticated endpoints",
  },
  permissions: [
    "events:read - Read events",
    "events:write - Create and update events",
    "events:delete - Delete events",
    "calendars:read - Read calendars",
    "calendars:write - Create and update calendars",
    "webhooks:read - Read webhooks",
    "webhooks:write - Create and manage webhooks",
    "admin - Full access",
  ],
  endpoints: [
    {
      method: "GET",
      path: "/events",
      description: "List all events with optional filtering",
      auth: "events:read",
      queryParams: [
        { name: "startDate", type: "string", description: "Filter events from this date (ISO)" },
        { name: "endDate", type: "string", description: "Filter events until this date (ISO)" },
        { name: "calendarId", type: "string", description: "Filter by calendar ID" },
        { name: "type", type: "string", description: "Filter by event type" },
      ],
      response: {
        events: [],
        count: 0,
      },
    },
    {
      method: "POST",
      path: "/events",
      description: "Create a new event",
      auth: "events:write",
      body: {
        title: "string (required)",
        date: "number (required)",
        month: "number (required)",
        year: "number (required)",
        hour: "number (optional)",
        endHour: "number (optional)",
        color: "string (optional)",
        type: "string (optional)",
        calendarId: "string (optional)",
        description: "string (optional)",
        location: "string (optional)",
        guests: "array (optional)",
        reminder: "number (optional)",
      },
      response: {
        success: true,
        event: {},
      },
    },
    {
      method: "GET",
      path: "/events/:id",
      description: "Get a specific event",
      auth: "events:read",
      response: {
        event: {},
      },
    },
    {
      method: "PUT",
      path: "/events/:id",
      description: "Update an event",
      auth: "events:write",
      response: {
        success: true,
        event: {},
      },
    },
    {
      method: "DELETE",
      path: "/events/:id",
      description: "Delete an event",
      auth: "events:delete",
      response: {
        success: true,
        message: "Event deleted",
      },
    },
    {
      method: "GET",
      path: "/calendars",
      description: "List all calendars",
      auth: "calendars:read",
      response: {
        calendars: [],
      },
    },
    {
      method: "POST",
      path: "/calendars",
      description: "Create a new calendar",
      auth: "calendars:write",
      body: {
        name: "string (required)",
        color: "string (optional)",
        visible: "boolean (optional)",
      },
    },
    {
      method: "GET",
      path: "/webhooks",
      description: "List all webhooks",
      auth: "webhooks:read",
      response: {
        webhooks: [],
      },
    },
    {
      method: "POST",
      path: "/webhooks",
      description: "Register a new webhook",
      auth: "webhooks:write",
      body: {
        url: "string (required) - HTTPS URL",
        events: "array (required) - Array of event types",
        secret: "string (optional) - Custom secret for signing",
      },
      events: [
        "event.created",
        "event.updated",
        "event.deleted",
        "event.completed",
        "calendar.created",
        "calendar.updated",
        "calendar.deleted",
      ],
    },
    {
      method: "PUT",
      path: "/webhooks/:id",
      description: "Update a webhook",
      auth: "webhooks:write",
    },
    {
      method: "DELETE",
      path: "/webhooks/:id",
      description: "Delete a webhook",
      auth: "webhooks:write",
    },
    {
      method: "POST",
      path: "/webhooks/:id/test",
      description: "Test a webhook",
      auth: "webhooks:write",
    },
    {
      method: "GET",
      path: "/keys",
      description: "List all API keys",
      auth: "admin",
    },
    {
      method: "POST",
      path: "/keys",
      description: "Create a new API key",
      auth: "admin",
      body: {
        name: "string (required)",
        permissions: "array (required)",
      },
    },
  ],
  webhookPayload: {
    event: "string",
    timestamp: "number",
    data: {},
  },
  webhookHeaders: {
    "Content-Type": "application/json",
    "X-Webhook-Event": "event type",
    "X-Webhook-Timestamp": "timestamp",
    "X-Webhook-Signature": "signature (if secret configured)",
  },
};

export async function GET() {
  return NextResponse.json(API_DOCS);
}
