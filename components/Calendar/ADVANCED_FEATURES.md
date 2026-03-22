# Advanced Calendar Features - Complete Guide

## Overview

Comprehensive advanced features for the Systemic Calendar App including drag-and-drop, recurring events, notifications, AI insights, and more.

## Dependencies Installed

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## New Components Created

### 1. RecurringEventManager.tsx

**Features:**
- Preset recurrence patterns (daily, weekly, monthly, yearly)
- Custom recurrence with advanced options
- Multiple days per week selection
- End conditions (never, after X occurrences, on date)
- Preview of next occurrences

**Usage:**
```tsx
import { RecurringEventManager, expandRecurringEvents } from "./RecurringEventManager";

<RecurringEventManager
  pattern={recurrencePattern}
  startDate={eventStartDate}
  onPatternChange={setRecurrencePattern}
  onPreviewOccurrences={generatePreview}
/>

// Expand recurring events into instances
const instances = expandRecurringEvents(event, pattern);
```

**Tailwind Styling:**
```tsx
// Pattern selection buttons
<button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">

// Custom pattern container
<div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200">

// Day selector
<button className="w-10 h-10 rounded-full bg-purple-600 text-white">
```

### 2. Notifications.tsx

**Features:**
- Browser notification integration
- Preset reminder times (5, 15, 30, 60 min, 1 day)
- Per-event reminder management
- Permission handling
- Toast notifications

**Usage:**
```tsx
import { NotificationCenter, NotificationToast } from "./Notifications";

<NotificationCenter
  events={events}
  reminders={reminders}
  onReminderChange={setReminders}
/>

// Show toast when event is upcoming
{upcomingEvent && (
  <NotificationToast event={upcomingEvent} onClose={() => setUpcomingEvent(null)} />
)}
```

**Browser Notification API:**
```typescript
// Request permission
const permission = await Notification.requestPermission();

// Send notification
new Notification("Event Title", {
  body: "Starting in 15 minutes",
  icon: "/calendar-icon.png",
  tag: reminderId,
  requireInteraction: true,
});
```

**Tailwind Styling:**
```tsx
// Permission banner
<div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">

// Reminder buttons
<button className="px-2 py-1 text-xs rounded-full bg-green-600 text-white">

// Toast notification
<div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-2xl p-4 max-w-sm">
```

### 3. QuickAddInput.tsx

**Features:**
- Natural language event creation
- AI-powered parsing
- System auto-detection
- Time parsing (at 7am, tomorrow, today)
- Duration parsing (for 1 hour)
- Recurrence detection (every Monday)
- Preview of parsed event

**Usage:**
```tsx
import { QuickAddInput } from "./QuickAddInput";

<QuickAddInput
  onParse={(result) => createEvent(result)}
  systems={[{ name: "Health", color: "#10b981" }]}
/>
```

**Supported Patterns:**
- "Gym tomorrow at 7am"
- "Team meeting every Monday at 10am"
- "Lunch with Sarah for 1 hour"
- "Doctor appointment next week"

**Tailwind Styling:**
```tsx
// Input field
<input className="w-full pl-10 pr-20 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500">

// Quick add button
<button className="absolute right-2 px-4 py-1.5 bg-purple-600 text-white rounded-md">

// Parsed result preview
<div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
```

### 4. EventPopover.tsx

**Features:**
- Detailed event information display
- AI insights integration
- System and recurrence badges
- Location display
- Edit and delete actions
- Mini popover variant for quick views

**Usage:**
```tsx
import { EventPopover, MiniEventPopover } from "./EventPopover";

// Full popover
<EventPopover
  event={selectedEvent}
  aiInsights={{ avgDuration: 45, completionRate: 85 }}
  onEdit={() => openEditModal()}
  onDelete={() => deleteEvent()}
/>

// Mini popover on hover
<MiniEventPopover event={event} position={{ x: 100, y: 200 }} />
```

**Tailwind Styling:**
```tsx
// Popover container
<div className="fixed inset-0 z-50 flex items-center justify-center">

// Header with system color
<div className="bg-green-500 p-4 text-white">

// Event details
<div className="flex items-start gap-3 p-4">

// AI insights section
<div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200">
```

### 5. BulkOperations.tsx

**Features:**
- Multi-select events
- Bulk delete
- Bulk system change
- Bulk reschedule
- Visual selection indicators
- Selection count display

**Usage:**
```tsx
import { BulkOperations } from "./BulkOperations";

<BulkOperations
  selectedEvents={selectedEvents}
  events={allEvents}
  onEventsChange={setEvents}
  systemColors={SYSTEM_COLORS}
/>
```

**Tailwind Styling:**
```tsx
// Selection header
<div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b">

// Selected event item
<div className="flex items-center gap-2 text-sm">
  <div className="w-2 h-2 rounded-full bg-green-500" />
  <span className="flex-1 truncate">{event.title}</span>
</div>

// Bulk action buttons
<button className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50">
```

### 6. MiniMonthView.tsx

**Features:**
- Compact month calendar
- Event indicators per day
- Month navigation
- Date selection
- Week numbers (optional)

**Usage:**
```tsx
import { MiniMonthView } from "./MiniMonthView";

<MiniMonthView
  selectedDate={currentDate}
  events={events}
  onDateSelect={(date) => navigateToDate(date)}
/>
```

**Tailwind Styling:**
```tsx
// Mini calendar container
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border">

// Calendar grid
<div className="grid grid-cols-7">

// Day cell with indicators
<button className="p-1 aspect-square flex flex-col items-center justify-center">
  <span className="text-sm font-medium">15</span>
  <div className="flex gap-0.5">
    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
  </div>
</button>
```

## Drag and Drop Integration

### Setup

```tsx
import { DndContext, DragOverlay, useSensor, useSensors, MouseSensor, TouchSensor } from "@dnd-kit/core";

const sensors = useSensors(
  useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
  useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
);

<DndContext
  sensors={sensors}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
>
  <CalendarView />
  <DragOverlay>
    {draggedEvent && (
      <div className="bg-blue-500 text-white px-3 py-2 rounded shadow-xl opacity-90">
        {draggedEvent.title}
      </div>
    )}
  </DragOverlay>
</DndContext>
```

### Event Component with Drag

```tsx
import { useDraggable } from "@dnd-kit/core";

function DraggableEvent({ event }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event._id,
    data: { event },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-grab active:cursor-grabbing"
    >
      {event.title}
    </div>
  );
}
```

### Drop Zones

```tsx
import { useDroppable } from "@dnd-kit/core";

function TimeSlot({ date, hour }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${date}-${hour}`,
    data: { date: new Date(date), hour },
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[60px] border ${isOver ? "bg-blue-50" : ""}`}
    >
      Drop event here
    </div>
  );
}
```

## Event Modal Enhancements

### Updated EventModal.tsx

**New Features:**
- Reminder selection
- Recurrence manager integration
- Color picker
- Enhanced form validation

**Usage:**
```tsx
import { EventModal } from "./EventModal";

<EventModal
  event={editingEvent}
  selectedSlot={{ date: new Date(), hour: 10 }}
  systemColors={SYSTEM_COLORS}
  onSave={handleSave}
  onDelete={handleDelete}
  onClose={() => setShowModal(false)}
/>
```

**Form Fields:**
- Title (required)
- System selection with colors
- Date/Time range
- All-day toggle
- Location
- Description
- Recurrence (via RecurringEventManager)
- Reminders (via Notifications)
- Custom color picker

## Convex Backend Updates

### Update Event Mutation

```typescript
// In convex/events/index.ts
export const updateEvent = mutation({
  args: {
    eventId: v.id("events"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    allDay: v.optional(v.boolean()),
    system: v.optional(v.union(
      v.literal("Health"),
      v.literal("Work"),
      v.literal("Relationships")
    )),
    color: v.optional(v.string()),
    recurrence: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { eventId, ...updates } = args;
    await ctx.db.patch(eventId, updates);
    
    // Trigger Scheduler Agent recalculation
    const event = await ctx.db.get(eventId);
    if (event) {
      await runSchedulerAgent(event.userId);
    }
    
    return eventId;
  },
});
```

### Recurring Event Expansion

```typescript
export const expandRecurringEvents = mutation({
  args: {
    eventId: v.id("events"),
    recurrence: v.object({
      type: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("yearly")),
      interval: v.optional(v.number()),
      daysOfWeek: v.optional(v.array(v.number())),
      endDate: v.optional(v.number()),
      occurrences: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const originalEvent = await ctx.db.get(args.eventId);
    if (!originalEvent) throw new Error("Event not found");

    const instances = generateOccurrences(originalEvent.startTime, args.recurrence);
    const duration = originalEvent.endTime - originalEvent.startTime;

    const eventIds = [];
    for (const date of instances) {
      const eventId = await ctx.db.insert("events", {
        ...originalEvent,
        startTime: date,
        endTime: date + duration,
        recurrenceInstance: args.eventId,
      });
      eventIds.push(eventId);
    }

    return eventIds;
  },
});
```

## AI Integration

### Scheduler Agent Buffer Recalculation

After any event change (create, update, delete, move):

```typescript
const handleEventChange = async (eventId: string) => {
  const event = await getEvent(eventId);
  
  // Recalculate all buffers for user's events
  const analysis = await analyzeScheduleWithPredictions(event.userId, allUserEvents);
  
  // Update buffers in state
  setScheduleAnalysis(analysis);
  
  // Generate new AI insights
  const insights = generateInsights(analysis);
  setAiInsights(insights);
};
```

### Reflection Agent Updates

```typescript
// After event completion
await storeEpisodicEvent({
  userId,
  eventId,
  system: event.system,
  title: event.title,
  actualDuration: actualDurationMinutes,
  plannedDuration: plannedDurationMinutes,
  completed: true,
});

// Reflection Agent generates insights
const reflection = await generateWeeklyReflection(userId);
```

## Example JSON Events

### Simple Event
```json
{
  "_id": "evt-123",
  "title": "Team Standup",
  "startTime": 1705312800000,
  "endTime": 1705314600000,
  "system": "Work",
  "color": "bg-blue-500",
  "allDay": false,
  "recurrence": "daily",
  "location": "Zoom"
}
```

### Recurring Event
```json
{
  "_id": "evt-456",
  "title": "Gym Workout",
  "startTime": 1705312800000,
  "endTime": 1705316400000,
  "system": "Health",
  "color": "bg-green-500",
  "recurrence": "weekly",
  "location": "Gym",
  "recurrencePattern": {
    "type": "weekly",
    "interval": 1,
    "daysOfWeek": [1, 3, 5],
    "occurrences": 52
  }
}
```

### Event with Reminders
```json
{
  "_id": "evt-789",
  "title": "Doctor Appointment",
  "startTime": 1705312800000,
  "endTime": 1705316400000,
  "system": "Health",
  "color": "#10b981",
  "reminders": [
    { "minutes": 1440, "sent": false },
    { "minutes": 60, "sent": false }
  ]
}
```

## Performance Optimizations

### Memoization
```typescript
const filteredEvents = useMemo(() => {
  return events.filter(e => isSameDay(new Date(e.startTime), selectedDate));
}, [events, selectedDate]);

const scheduleAnalysis = useMemo(() => {
  return analyzeScheduleWithPredictions(userId, filteredEvents);
}, [userId, filteredEvents]);
```

### Virtualization for Large Lists
```tsx
import { useVirtualizer } from "@tanstack/react-virtual";

const rowVirtualizer = useVirtualizer({
  count: events.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 60,
});
```

### Debounced Updates
```typescript
const debouncedSave = useMemo(
  () => debounce(handleSave, 500),
  [handleSave]
);
```

## Accessibility

### Keyboard Navigation
```tsx
<button
  onClick={handleDelete}
  aria-label="Delete event"
  className="focus:ring-2 focus:ring-red-500"
>
  Delete
</button>
```

### Screen Reader Support
```tsx
<div role="grid" aria-label="Calendar events">
  <div role="row" aria-label="Event: Team Standup, 9am-9:30am">
    <EventBlock />
  </div>
</div>
```

### Focus Management
```typescript
useEffect(() => {
  if (showModal) {
    const firstInput = modalRef.current?.querySelector('input');
    firstInput?.focus();
  }
}, [showModal]);
```

## Future Enhancements

1. **Real-time collaboration** - Multi-user editing
2. **Calendar sync** - Google Calendar, iCal integration
3. **Time zone support** - Multi-timezone events
4. **File attachments** - Event documents
5. **Video conferencing** - Built-in meeting links
6. **Smart scheduling** - AI-powered optimal times
7. **Analytics dashboard** - Usage statistics
8. **Custom fields** - User-defined event metadata
9. **Templates** - Reusable event templates
10. **Mobile app** - React Native version

## Testing

### Create Event Test
```typescript
const event = await createEvent({
  title: "Test Event",
  startTime: Date.now(),
  endTime: Date.now() + 3600000,
  system: "Work",
  userId: "test-user",
});

expect(event._id).toBeDefined();
```

### Drag and Drop Test
```typescript
const { getByText } = render(<CalendarView />);
const event = getByText("Team Meeting");

fireEvent.dragStart(event);
fireEvent.dragEnd(dropZone);

expect(updateEvent).toHaveBeenCalled();
```

### Notification Test
```typescript
test("sends notification before event", async () => {
  const event = createEvent({ startTime: Date.now() + 1000 * 60 * 15 });
  const reminder = { minutesBefore: 15 };
  
  await waitFor(() => {
    expect(Notification).toHaveBeenCalled();
  });
});
```

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Support

For implementation questions:
- See component source files in `/components/Calendar/`
- Check Convex schema in `convex/schema.ts`
- Review AI agents in `agents/` directory
- Consult Tailwind docs for styling patterns
