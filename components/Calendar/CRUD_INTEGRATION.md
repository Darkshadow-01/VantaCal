# Event CRUD Operations - Integration Guide

## Overview

Complete event creation, editing, and deletion functionality with AI-powered predictive buffers. All operations are integrated with the Convex backend and Scheduler Agent for intelligent buffer management.

## Components

### 1. EventModal.tsx

**Purpose:** Reusable modal for creating and editing events

**Features:**
- Full event form with all fields
- System selection with color preview
- Date/time pickers with all-day support
- Recurrence options
- AI buffer prediction notice
- Delete confirmation flow
- Responsive design
- Dark mode support

**Props:**
```typescript
interface EventModalProps {
  event?: Doc<"events"> | null;          // Existing event for editing
  selectedSlot?: { date: Date; hour?: number } | null;  // Pre-filled slot
  systemColors: Record<"Health" | "Work" | "Relationships", SystemColors>;
  onSave: (data: EventFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

interface EventFormData {
  title: string;
  description?: string;
  startTime: number;
  endTime: number;
  allDay: boolean;
  system: "Health" | "Work" | "Relationships";
  color?: string;
  recurrence?: string;
  location?: string;
}
```

**Tailwind Styling:**
```tsx
// Modal container
<div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

// Form inputs
<input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">

// System selection buttons
<button className="p-3 rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-900/20">

// Primary button
<button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">
```

**Usage:**
```tsx
<EventModal
  event={existingEvent}        // null for new event
  selectedSlot={{ date: new Date(), hour: 10 }}
  systemColors={SYSTEM_COLORS}
  onSave={handleSaveEvent}
  onDelete={handleDeleteEvent}
  onClose={() => setShowModal(false)}
/>
```

### 2. CalendarView.tsx (Updated)

**Purpose:** Main calendar with integrated CRUD operations

**New Features:**
- Event creation via header button
- Click on time slots to create events
- Click on events to edit
- Modal management
- AI buffer recalculation on changes

**Event Handlers:**
```typescript
const handleCreateEvent = (slot?: { date: Date; hour?: number }) => {
  setEditingEvent(null);
  setSelectedSlot(slot || null);
  setShowModal(true);
};

const handleEditEvent = (event: Doc<"events">, e: React.MouseEvent) => {
  e.stopPropagation();
  setEditingEvent(event);
  setSelectedSlot(null);
  setShowModal(true);
};

const handleSaveEvent = async (data: EventFormData) => {
  if (editingEvent) {
    await updateEvent({ eventId: editingEvent._id, ...data });
  } else {
    await createEvent(data);
  }
  // Recalculate buffers
  await loadScheduleAnalysis();
};

const handleDeleteEvent = async () => {
  await deleteEvent({ eventId: editingEvent._id });
  // Recalculate buffers
  await loadScheduleAnalysis();
};
```

**Passing Handlers to Views:**
```tsx
{currentView === "daily" && (
  <DailyView
    onSlotClick={(date, hour) => handleCreateEvent({ date, hour })}
    onEventClick={handleEditEvent}
  />
)}
```

### 3. DailyView.tsx (Updated)

**Features:**
- Click on hour slots to create event
- Click on events to edit
- Click on event cards in sidebar to edit

**New Props:**
```typescript
onSlotClick?: (date: Date, hour: number) => void;
onEventClick?: (event: Doc<"events">, e: React.MouseEvent) => void;
```

**Click Handling:**
```tsx
// Hour slot click
<div 
  className="flex-1 relative hover:bg-gray-50 cursor-pointer"
  onClick={() => onSlotClick?.(date, hour)}
/>

// Event click
<EventBlock
  onClick={(e) => onEventClick?.(event, e)}
/>

// Sidebar event card
<div 
  className="cursor-pointer hover:opacity-90"
  onClick={(e) => onEventClick?.(event, e)}
>
```

### 4. WeeklyView.tsx (Updated)

**Features:**
- Click on time slots to create events
- Click on events to edit
- Current time indicator

**New Props:**
```typescript
onSlotClick?: (date: Date, hour: number) => void;
onEventClick?: (event: Doc<"events">, e: React.MouseEvent) => void;
```

### 5. MonthlyView.tsx (Updated)

**Features:**
- Click on date cells to create events
- Click on event dots to edit
- Click on event titles to edit

**New Props:**
```typescript
onDateClick?: (date: Date) => void;
onEventClick?: (event: Doc<"events">, e: React.MouseEvent) => void;
```

**Click Handling:**
```tsx
// Date cell click
<div onClick={() => isCurrentMonthDay && onDateClick?.(day)}>

// Event dot click
<div onClick={(e) => onEventClick?.(event, e)}>

// Event title click
<div onClick={(e) => onEventClick?.(event, e)}>
```

### 6. YearlyView.tsx (Updated)

**Features:**
- Click on month cards to create events
- Click on system hours to navigate to that month

**New Props:**
```typescript
onDateClick?: (date: Date) => void;
onEventClick?: (event: Doc<"events">, e: React.MouseEvent) => void;
```

## Convex Backend Integration

### API Functions

**Create Event:**
```typescript
const createEvent = useCreateEvent();

await createEvent({
  title: "Team Standup",
  description: "Daily sync",
  startTime: new Date("2024-01-15T09:00:00").getTime(),
  endTime: new Date("2024-01-15T09:30:00").getTime(),
  allDay: false,
  userId: "user-123",
  system: "Work",
  color: "bg-blue-500",
  recurrence: "daily",
  location: "Zoom",
});
```

**Update Event:**
```typescript
const updateEvent = useUpdateEvent();

await updateEvent({
  eventId: "event-456",
  title: "Updated Title",
  startTime: new Date("2024-01-15T10:00:00").getTime(),
  endTime: new Date("2024-01-15T11:00:00").getTime(),
});
```

**Delete Event:**
```typescript
const deleteEvent = useDeleteEvent();

await deleteEvent({
  eventId: "event-456",
});
```

### Event Schema
```typescript
// Convex schema (convex/schema.ts)
events: defineTable({
  title: v.string(),
  description: v.optional(v.string()),
  startTime: v.number(),
  endTime: v.number(),
  allDay: v.boolean(),
  userId: v.string(),
  system: v.union(v.literal("Health"), v.literal("Work"), v.literal("Relationships")),
  color: v.optional(v.string()),
  recurrence: v.optional(v.string()),
  location: v.optional(v.string()),
}).index("by_user", ["userId"])
 .index("by_system", ["system"])
 .index("by_time", ["startTime", "endTime"]);
```

## AI Agent Integration

### Scheduler Agent (Predictive Buffers)

When events are created, edited, or deleted, the Scheduler Agent automatically recalculates predictive buffers:

**Flow:**
1. User creates/updates/deletes event
2. Convex mutation is called
3. CalendarView triggers `loadScheduleAnalysis()`
4. `analyzeScheduleWithPredictions()` is called with all user events
5. Scheduler Agent analyzes:
   - Historical duration patterns
   - Event overlap/conflicts
   - System balance
   - Delay risks
6. Returns optimized buffer recommendations
7. UI updates with new buffers

**Example:**
```typescript
const analysis = await analyzeScheduleWithPredictions(userId, events);

// Returns:
{
  events: [...],                    // Events with predictions
  buffers: [...],                   // Suggested buffer blocks
  totalBufferMinutes: 120,           // Total buffer time
  optimizationScore: 85,             // Schedule quality (0-100)
  riskAssessment: {
    highRiskEvents: ["Team Standup"],
    recommendedBuffers: [
      {
        eventTitle: "Deep Work Session",
        bufferMinutes: 15,
        reason: "80% chance of overrun, avg 12min delay"
      }
    ]
  }
}
```

**Buffer Types:**
- **Transition:** Time between activities
- **Recovery:** After high-effort tasks
- **Buffer:** General padding
- **Travel:** Location changes

### Reflection Agent Integration

After event changes, the Reflection Agent updates memory:

**Episodic Memory:**
- Records event completion
- Tracks missed events
- Logs conflicts

**Semantic Memory:**
- Learns duration patterns
- Identifies scheduling habits
- Tracks system balance

**Procedural Memory:**
- Scheduling best practices
- Optimal buffer strategies

## Predictive Buffer Algorithm

```typescript
async function analyzeScheduleWithPredictions(userId, events) {
  // 1. Get historical duration data
  const durationStats = await getTaskDurationStats(userId);
  
  // 2. Get delay-prone tasks
  const delayProneTasks = await getDelayProneTasks(userId);
  
  // 3. Generate buffer recommendations
  const buffers = generateBufferBlocks(events, delayProneTasks);
  
  // 4. Calculate optimization score
  const score = calculateOptimizationScore(events, buffers);
  
  return { events, buffers, optimizationScore: score };
}
```

**Buffer Generation Rules:**
- Events with >30% delay probability get recovery buffers
- >15min gap between events gets transition buffer
- Events with >10min avg variance get travel buffer
- Recommended buffers are flagged for user attention

## UI/UX Guidelines

### Event Form

**Layout:**
```
┌─ New Event ────────────────────── ✕ ┐
│                                         │
│ Title *                               │
│ [________________________]            │
│                                         │
│ System *                               │
│ ┌────────┐ ┌────────┐ ┌──────────┐    │
│ │ ●Health│ │ ●Work │ │●Relations│    │
│ └────────┘ └────────┘ └──────────┘    │
│                                         │
│ ☐ All day event                        │
│                                         │
│ Start              End                  │
│ [2024-01-15]      [2024-01-15]          │
│ [09:00]          [10:00]                │
│                                         │
│ Location                               │
│ [________________________]            │
│                                         │
│ Description                            │
│ [________________________]            │
│ [________________________]            │
│                                         │
│ Recurrence                             │
│ [Does not repeat      ▾]              │
│                                         │
│ ┌─ AI Buffer Prediction ──────────┐    │
│ │ ✨ After creating, AI will      │    │
│ │    suggest optimal buffers      │    │
│ └─────────────────────────────────┘    │
│                                         │
│ ┌─ Delete Event ─┐     [Cancel] [Create]│
└─────────────────────────────────────────┘
```

**Styling:**
```tsx
// System selection
<button className={`
  p-3 rounded-lg border-2 
  ${selected ? "border-green-500 bg-green-50" : "border-gray-200"}
  hover:border-gray-300
`}>

// Primary action
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">

// Delete button
<button className="text-sm text-red-600 hover:text-red-700 font-medium">
```

### Event Colors

| System | Background | Text | Hover |
|--------|-----------|------|-------|
| Health | bg-green-500 | text-white | hover:opacity-90 |
| Work | bg-blue-500 | text-white | hover:opacity-90 |
| Relationships | bg-purple-500 | text-white | hover:opacity-90 |

### Buffer Visualization

```tsx
// Buffer block styling
<div className={`
  bg-gray-200 dark:bg-gray-600
  rounded border border-dashed border-gray-400
  opacity-70
`}>

// Recommended buffer (highlighted)
<div className={`
  bg-amber-200 dark:bg-amber-700
  border-yellow-400
  ring-2 ring-yellow-400/30
`}>
```

## Example Event Data

**Create Event Request:**
```json
{
  "title": "Morning Yoga",
  "description": "30-minute yoga session",
  "startTime": 1705312800000,
  "endTime": 1705314600000,
  "allDay": false,
  "userId": "user-123",
  "system": "Health",
  "color": "bg-green-500",
  "recurrence": "daily",
  "location": "Home"
}
```

**Event Response:**
```json
{
  "_id": "event-new-789",
  "_creationTime": 1705310000000,
  "title": "Morning Yoga",
  "description": "30-minute yoga session",
  "startTime": 1705312800000,
  "endTime": 1705314600000,
  "allDay": false,
  "userId": "user-123",
  "system": "Health",
  "color": "bg-green-500",
  "recurrence": "daily",
  "location": "Home"
}
```

**Predictive Buffer:**
```json
{
  "id": "buffer-after-event-789",
  "afterEventId": "event-new-789",
  "startTime": 1705314600000,
  "endTime": 1705316100000,
  "duration": 25,
  "purpose": "recovery",
  "riskReduction": 0.65,
  "recommended": true
}
```

## Performance Optimization

### Memoization
```typescript
const dayEvents = useMemo(() => {
  return events.filter((e) => isSameDay(new Date(e.startTime), date));
}, [events, date]);
```

### Debouncing
```typescript
// Debounce save operations
const debouncedSave = useMemo(
  () => debounce(handleSaveEvent, 500),
  [handleSaveEvent]
);
```

### Optimistic Updates
```typescript
// Update UI immediately
setEvents(prev => [...prev, newEvent]);

// Send to server
await createEvent(eventData).catch(() => {
  // Rollback on error
  setEvents(prev => prev.filter(e => e._id !== tempId));
});
```

## Error Handling

```typescript
try {
  await createEvent(eventData);
  toast.success("Event created successfully");
} catch (error) {
  toast.error("Failed to create event");
  console.error(error);
}
```

**Common Errors:**
- Network failure → Show retry button
- Validation error → Display field errors
- Conflict detected → Show conflict resolution modal
- Unauthorized → Redirect to login

## Accessibility

- Keyboard navigation (Tab, Enter, Escape)
- ARIA labels for all interactive elements
- Focus management in modal
- Screen reader announcements
- High contrast mode support

```tsx
<button
  onClick={handleSave}
  aria-label="Save event"
  className="focus:ring-2 focus:ring-blue-500"
>
  Save
</button>
```

## Testing

**Create Event Test:**
```typescript
const eventData = {
  title: "Test Event",
  startTime: Date.now(),
  endTime: Date.now() + 3600000,
  system: "Work",
};

await createEvent(eventData);
const analysis = await loadScheduleAnalysis();
expect(analysis.buffers.length).toBeGreaterThan(0);
```

**Edit Event Test:**
```typescript
await updateEvent({ eventId, title: "Updated Title" });
const updated = await getEventById(eventId);
expect(updated.title).toBe("Updated Title");
```

**Delete Event Test:**
```typescript
await deleteEvent({ eventId });
const analysis = await loadScheduleAnalysis();
const eventBuffers = analysis.buffers.filter(b => b.afterEventId === eventId);
expect(eventBuffers.length).toBe(0);
```

## Future Enhancements

1. **Drag & Drop:** Move events between slots
2. **Recurring Events:** Visual indicators for recurring
3. **Multi-day Events:** Spanning blocks
4. **Conflict Resolution:** AI-powered suggestions
5. **Smart Defaults:** Learn user preferences
6. **Batch Operations:** Create multiple events
7. **Templates:** Save event templates
8. **Undo/Redo:** Action history
9. **Real-time Collaboration:** Multi-user editing
10. **Export:** iCal, Google Calendar
