/**
 * OpenAPI Documentation Endpoint
 * 
 * Returns OpenAPI 3.0 specification for the API
 */

import { NextRequest, NextResponse } from "next/server";

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Calendar API",
    description: "E2EE Calendar Application API with versioning support",
    version: "1.0.0",
    contact: {
      name: "API Support",
    },
  },
  servers: [
    {
      url: "https://calendar-app.vercel.app",
      description: "Production server",
    },
    {
      url: "http://localhost:3000",
      description: "Development server",
    },
  ],
  paths: {
    "/api/v1/events": {
      get: {
        summary: "List events",
        description: "Retrieve a paginated list of events",
        parameters: [
          {
            name: "page",
            in: "query",
            description: "Page number (default: 1)",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "pageSize",
            in: "query",
            description: "Items per page (default: 20, max: 100)",
            schema: { type: "integer", default: 20 },
          },
          {
            name: "startDate",
            in: "query",
            description: "Filter events from this date (ISO 8601)",
            schema: { type: "string", format: "date-time" },
          },
          {
            name: "endDate",
            in: "query",
            description: "Filter events until this date (ISO 8601)",
            schema: { type: "string", format: "date-time" },
          },
          {
            name: "calendarId",
            in: "query",
            description: "Filter by calendar ID",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Event" },
                    },
                    meta: {
                      $ref: "#/components/schemas/PaginationMeta",
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create event",
        description: "Create a new calendar event",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/EventInput",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Event created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Event" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/events/{id}": {
      get: {
        summary: "Get event",
        description: "Retrieve a single event by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Event ID",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Event" },
                  },
                },
              },
            },
          },
          "404": {
            description: "Event not found",
          },
        },
      },
      patch: {
        summary: "Update event",
        description: "Update an existing event",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Event ID",
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/EventInput",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Event updated",
          },
          "404": {
            description: "Event not found",
          },
        },
      },
      delete: {
        summary: "Delete event",
        description: "Delete an event by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Event ID",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Event deleted",
          },
          "404": {
            description: "Event not found",
          },
        },
      },
    },
    "/api/v1/calendars": {
      get: {
        summary: "List calendars",
        description: "Retrieve a list of calendars",
        responses: {
          "200": {
            description: "Successful response",
          },
        },
      },
      post: {
        summary: "Create calendar",
        description: "Create a new calendar",
        responses: {
          "201": {
            description: "Calendar created",
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Event: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          startTime: { type: "integer", description: "Unix timestamp" },
          endTime: { type: "integer", description: "Unix timestamp" },
          allDay: { type: "boolean" },
          calendarId: { type: "string" },
          color: { type: "string" },
          type: { type: "string" },
          system: { type: "string" },
          completed: { type: "boolean" },
          guests: { type: "array", items: { type: "string" } },
          location: { type: "string" },
          description: { type: "string" },
        },
      },
      EventInput: {
        type: "object",
        required: ["title", "startTime"],
        properties: {
          title: { type: "string" },
          startTime: { type: "integer" },
          endTime: { type: "integer" },
          allDay: { type: "boolean" },
          calendarId: { type: "string" },
          color: { type: "string" },
          type: { type: "string" },
          system: { type: "string" },
          guests: { type: "array", items: { type: "string" } },
          location: { type: "string" },
          description: { type: "string" },
        },
      },
      PaginationMeta: {
        type: "object",
        properties: {
          page: { type: "integer" },
          pageSize: { type: "integer" },
          total: { type: "integer" },
          totalPages: { type: "integer" },
          hasNext: { type: "boolean" },
          hasPrev: { type: "boolean" },
        },
      },
      ApiError: {
        type: "object",
        properties: {
          error: { type: "string" },
          message: { type: "string" },
          details: { type: "object" },
          timestamp: { type: "string" },
        },
      },
    },
  },
  tags: [
    {
      name: "Events",
      description: "Event operations",
    },
    {
      name: "Calendars",
      description: "Calendar operations",
    },
  ],
};

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format");
  
  if (format === "yaml") {
    const yaml = `# OpenAPI Specification
# Convert JSON to YAML for display

openapi: "${openApiSpec.openapi}"
info:
  title: "${openApiSpec.info.title}"
  description: "${openApiSpec.info.description}"
  version: "${openApiSpec.info.version}"

servers:
  - url: "${openApiSpec.servers[0].url}"
    description: "${openApiSpec.servers[0].description}"
  - url: "${openApiSpec.servers[1].url}"
    description: "${openApiSpec.servers[1].description}"

# Full JSON spec available at /api/docs?format=json
`;
    return new NextResponse(yaml, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  return NextResponse.json(openApiSpec, {
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "*",
    },
  });
}