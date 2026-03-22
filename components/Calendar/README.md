# Systemic Calendar Views - Complete Guide

## Overview

Comprehensive calendar views for the Systemic Calendar App with full CRUD operations, AI-powered predictive buffers, and system integration. Supports daily, weekly, monthly, and yearly views.

## Quick Start

```tsx
import { CalendarView } from "@/components/Calendar";

export default function CalendarPage() {
  return <CalendarView />;
}
```

## Components

### Core Components

| Component | Purpose | Key Features |
|-----------|---------|-------------|
| **CalendarView** | Main container with CRUD | View switching, modal management, AI analysis |
| **EventModal** | Create/edit events | Form, system selection, recurrence, AI notices |
| **DailyView** | 24-hour timeline | Click to create, event blocks, buffers |
| **WeeklyView** | 7-day grid | Click slots, compact buffers, today indicator |
| **MonthlyView** | Month grid | Click dates, event dots, system breakdown |
| **YearlyView** | Year summary | Month cards, hours by system, AI recommendations |
| **EventBlock** | Event display | Tooltips, drag support, system colors |

## Event CRUD Operations

### Creating Events

**Method 1: Header Button**
```tsx
// Click "New Event" button in header
<button onClick={() => handleCreateEvent({ date: currentDate })}>
  New Event
</button>
```

**Method 2: Click Time Slot**
```tsx
// Click on any hour slot in Daily/Weekly view
<div onClick={() => onSlotClick?.(date, hour)}>
```

**Method 3: Click Date Cell**
```tsx
// Click on any date in Monthly/Yearly view
<div onClick={() => onDateClick?.(day)}>
```

### Event Modal Form

```tsx
<EventModal
  event={null}  // null = create, event = edit
  selectedSlot={{ date: new Date(), hour: 10 }}
  systemColors={SYSTEM_COLORS}
  onSave={handleSaveEvent}
  onDelete={handleDeleteEvent}
  onClose={() => setShowModal(false)}
/>
```

**Form Fields:**
- Title (required)
- System (Health/Work/Relationships)
- Start/End Date & Time
- All Day toggle
- Location
- Description
- Recurrence

### Editing Events

```tsx
// Click any event to open edit modal
<EventBlock onClick={(e) => onEventClick?.(event, e)} />
```

### Deleting Events

```tsx
// Delete from modal
<button onClick={handleDeleteEvent}>Delete Event</button>
```

## AI Integration

### Scheduler Agent (Predictive Buffers)

Automatically generates buffer recommendations:

```typescript
const analysis = await analyzeScheduleWithPredictions(userId, events);

// Returns:
// - events: Events with predictions
// - buffers: Suggested buffer blocks
// - totalBufferMinutes: Total buffer time
// - optimizationScore: Schedule quality (0-100)
// - riskAssessment: High-risk events & recommendations
```

**Buffer Types:**
- **Transition:** Gap between activities
- **Recovery:** After high-effort tasks
- **Buffer:** General padding
- **Travel:** Location changes

### Integration Flow

```
User Action (create/edit/delete)
  ↓
Convex Backend (mutation)
  ↓
CalendarView.reloadScheduleAnalysis()
  ↓
Scheduler Agent analyzes all events
  ↓
Generate predictive buffers
  ↓
Update UI with buffers & insights
```

### Reflection Agent

Updates memory after event changes:
- **Episodic:** Records completions
- **Semantic:** Learns patterns
- **Procedural:** Updates strategies

## System Colors

Consistent across all views:

```tsx
const SYSTEM_COLORS = {
  Health: {
    bg: "bg-green-500",
    bgLight: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-500",
    text: "text-green-700 dark:text-green-300",
  },
  Work: {
    bg: "bg-blue-500",
    bgLight: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-500",
    text: "text-blue-700 dark:text-blue-300",
  },
  Relationships: {
    bg: "bg-purple-500",
    bgLight: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-500",
    text: "text-purple-700 dark:text-purple-300",
  },
};
```

## Tailwind Styling Reference

### Event Blocks
```tsx
// System-colored event
<div className="absolute left-1 right-1 bg-green-500 text-white px-2 py-1 rounded-md shadow-md">
  
// Event with border
<div className="absolute left-1 right-1 bg-green-500 text-white border-l-4 border-green-600 rounded-r">
  
// Compact event
<div className="bg-blue-500 text-white px-2 py-1 rounded text-xs">
```

### Buffer Blocks
```tsx
// Standard buffer
<div className="bg-gray-200 dark:bg-gray-600 rounded border border-dashed opacity-70">

// Recommended buffer (highlighted)
<div className="bg-amber-200 border-yellow-400 ring-2 ring-yellow-400/30">
```

### Modal Styling
```tsx
// Modal container
<div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg">

// Form inputs
<input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">

// Primary button
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">

// System selector
<button className="p-3 rounded-lg border-2 border-green-500 bg-green-50">
```

## Responsive Design

```tsx
// Mobile: Stack vertically
<div className="flex flex-col lg:flex-row">

// Grid responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Breakpoints:
// sm: (640px) - Small tablets
// md: (768px) - Tablets
// lg: (1024px) - Laptops
// xl: (1280px) - Desktops
```

## File Structure

```
/components/Calendar/
├── CalendarView.tsx         # Main container with CRUD
├── EventModal.tsx           # Event form modal
├── DailyView.tsx            # 24-hour timeline
├── WeeklyView.tsx           # 7-day grid
├── MonthlyView.tsx          # Month grid
├── YearlyView.tsx           # Year summary
├── EventBlock.tsx           # Event display component
├── index.ts                 # Exports
├── sampleData.ts            # Test data
├── README.md                # This file
└── CRUD_INTEGRATION.md      # Detailed CRUD guide
```

## Dependencies

- **React 19** - UI framework
- **Tailwind CSS 4** - Styling
- **date-fns** - Date manipulation
- **lucide-react** - Icons
- **Convex** - Real-time backend
- **Clerk** - Authentication

## Convex API

### Mutations

```typescript
// Create event
await createEvent({
  title: string,
  description?: string,
  startTime: number,
  endTime: number,
  allDay: boolean,
  userId: string,
  system: "Health" | "Work" | "Relationships",
  color?: string,
  recurrence?: string,
  location?: string,
});

// Update event
await updateEvent({
  eventId: string,
  title?: string,
  startTime?: number,
  endTime?: number,
  // ... other fields
});

// Delete event
await deleteEvent({ eventId: string });
```

### Queries

```typescript
// Get all user events
const events = useEvents(userId);

// Get single event
const event = useEventById(eventId);
```

## Example Usage

### Full Integration

```tsx
"use client";

import { CalendarView } from "@/components/Calendar";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";

export default function CalendarPage() {
  return (
    <ClerkProvider>
      <ConvexClientProvider>
        <CalendarView />
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
```

### With Sample Data

```tsx
import { DailyView } from "@/components/Calendar";
import { SAMPLE_EVENTS, SAMPLE_BUFFERS, SYSTEM_COLORS } from "@/components/Calendar/sampleData";

export default function DemoPage() {
  const [events, setEvents] = useState(SAMPLE_EVENTS);
  const [buffers, setBuffers] = useState(SAMPLE_BUFFERS);

  const handleSaveEvent = async (data) => {
    // Add to events list
    setEvents([...events, { ...data, _id: `event-${Date.now()}` }]);
    // Recalculate buffers
    const analysis = await analyzeScheduleWithPredictions(userId, events);
    setBuffers(analysis.buffers);
  };

  const handleDeleteEvent = async (eventId) => {
    setEvents(events.filter(e => e._id !== eventId));
    // Recalculate buffers
    const analysis = await analyzeScheduleWithPredictions(userId, events.filter(e => e._id !== eventId));
    setBuffers(analysis.buffers);
  };

  return (
    <DailyView
      date={new Date()}
      events={events}
      buffers={buffers}
      systemColors={SYSTEM_COLORS}
      onSlotClick={(date, hour) => console.log("Create event at", date, hour)}
      onEventClick={(event, e) => console.log("Edit event", event)}
    />
  );
}
```

## Testing

### Create Event
```json
{
  "title": "Team Standup",
  "startTime": 1705312800000,
  "endTime": 1705314600000,
  "system": "Work",
  "userId": "user-123"
}
```

### Response
```json
{
  "_id": "event-new-456",
  "title": "Team Standup",
  "startTime": 1705312800000,
  "endTime": 1705314600000,
  "system": "Work",
  "color": "bg-blue-500"
}
```

### Predictive Buffer
```json
{
  "id": "buffer-after-event-456",
  "afterEventId": "event-new-456",
  "duration": 15,
  "purpose": "transition",
  "recommended": true
}
```

## AI Agent Notes

### Scheduler Agent
- Analyzes historical duration data
- Predicts delay probabilities
- Generates buffer recommendations
- Calculates optimization scores
- Identifies high-risk events

### Reflection Agent
- Updates episodic memory on completions
- Logs missed events
- Tracks patterns
- Provides insights

### Buffer Calculation
```typescript
// Delay-prone tasks get buffers
if (delayProbability > 0.3) {
  buffer = avgVariance * 0.5;
}

// Large gaps get transition buffers
if (gap >= 10 minutes) {
  buffer = Math.max(5, gap / 2);
}
```

## Performance Tips

1. **Memoize event filtering:**
```typescript
const dayEvents = useMemo(() => events.filter(...), [events, date]);
```

2. **Debounce saves:**
```typescript
const debouncedSave = useMemo(() => debounce(save, 500), []);
```

3. **Optimistic updates:**
```typescript
setEvents(prev => [...prev, newEvent]);
await createEvent(newEvent);  // Rollback on error
```

## Accessibility

- Keyboard navigation (Tab, Enter, Escape)
- ARIA labels on all buttons
- Focus management in modals
- Screen reader support
- High contrast mode

## Future Enhancements

1. Drag & drop events
2. Recurring event indicators
3. Multi-day event spans
4. Conflict resolution AI
5. Event templates
6. Batch operations
7. Undo/redo
8. Real-time collaboration
9. Calendar export (iCal, Google)
10. Smart defaults from history

## Support

For issues or questions:
- Check `CRUD_INTEGRATION.md` for detailed API docs
- Review Convex schema in `convex/schema.ts`
- See AI agent prompts in `agents/scheduler.ts`
- Check buffer logic in `lib/schedulerWithBuffers.ts`
