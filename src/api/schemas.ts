import { z } from "zod";

export const EventCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(5000).optional(),
  startTime: z.number().int().positive("Start time is required"),
  endTime: z.number().int().positive().optional(),
  allDay: z.boolean().default(false),
  calendarId: z.string().default("personal"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
  type: z.string().default("event"),
  system: z.enum(["Health", "Work", "Relationships"]).optional(),
  location: z.string().max(500).optional(),
  guests: z.array(z.string().email()).optional(),
  reminder: z.number().int().min(0).optional(),
  notification: z.string().optional(),
  recurrence: z
    .object({
      type: z.string(),
      interval: z.number().int().positive().optional(),
      endDate: z.number().int().positive().optional(),
      occurrences: z.number().int().positive().optional(),
      daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
      dayOfMonth: z.number().int().min(1).max(31).optional(),
    })
    .optional(),
});

export const EventUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  startTime: z.number().int().positive().optional(),
  endTime: z.number().int().positive().optional(),
  allDay: z.boolean().optional(),
  calendarId: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  type: z.string().optional(),
  system: z.enum(["Health", "Work", "Relationships"]).optional(),
  location: z.string().max(500).optional(),
  guests: z.array(z.string().email()).optional(),
  reminder: z.number().int().min(0).optional(),
  notification: z.string().optional(),
  completed: z.boolean().optional(),
  recurrence: z
    .object({
      type: z.string(),
      interval: z.number().int().positive().optional(),
      endDate: z.number().int().positive().optional(),
      occurrences: z.number().int().positive().optional(),
      daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
      dayOfMonth: z.number().int().min(1).max(31).optional(),
    })
    .optional(),
}).refine(
  (data) => {
    if (data.endTime && data.startTime) {
      return data.endTime > data.startTime;
    }
    return true;
  },
  { message: "End time must be after start time", path: ["endTime"] }
);

export const EventQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  calendarId: z.string().optional(),
  type: z.string().optional(),
});

export const EventIdSchema = z.object({
  id: z.string().min(1, "Event ID is required"),
});

export const CalendarCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  visible: z.boolean().default(true),
});

export const CalendarUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  visible: z.boolean().optional(),
});

export type EventCreateInput = z.infer<typeof EventCreateSchema>;
export type EventUpdateInput = z.infer<typeof EventUpdateSchema>;
export type EventQueryInput = z.infer<typeof EventQuerySchema>;
export type CalendarCreateInput = z.infer<typeof CalendarCreateSchema>;
export type CalendarUpdateInput = z.infer<typeof CalendarUpdateSchema>;

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true;
  data: T;
} | {
  success: false;
  errors: z.ZodError;
} {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}