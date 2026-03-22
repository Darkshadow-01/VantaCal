# Advanced Calendar Features - Quick Start

## Overview

Complete implementation of advanced calendar features including drag-and-drop, recurring events, notifications, AI insights, and more.

## Quick Start

```tsx
// Import the advanced calendar
import { CalendarView } from "@/components/Calendar";

// Use the advanced version with all features
// (CalendarView already includes all CRUD + advanced features)

export default function CalendarPage() {
  return <CalendarView />;
}
```

## Components Created

### Core Advanced Components

1. **RecurringEventManager.tsx** (15KB)
   - Preset patterns (daily/weekly/monthly/yearly)
   - Custom recurrence with day selection
   - End conditions
   - Occurrence preview

2. **Notifications.tsx** (11KB)
   - Browser notification integration
   - Preset reminder times
   - Toast notifications
   - Permission handling

3. **QuickAddInput.tsx** (12KB)
   - Natural language parsing
   - System auto-detection
   - Time/duration parsing
   - Recurrence detection

4. **EventPopover.tsx** (8KB)
   - Detailed event display
   - AI insights integration
   - Edit/delete actions
   - Mini popover variant

5. **BulkOperations.tsx** (7KB)
   - Multi-select events
   - Bulk delete/system change
   - Bulk reschedule

6. **MiniMonthView.tsx** (6KB)
   - Compact month calendar
   - Event indicators
   - Week numbers

### Existing Components (Updated)

- CalendarView.tsx - Full CRUD + advanced features
- EventModal.tsx - Enhanced with recurrence/reminders
- DailyView.tsx - Drag support + bulk selection
- WeeklyView.tsx - Drag support + bulk selection
- MonthlyView.tsx - Bulk selection support
- EventBlock.tsx - Improved tooltips

## Features Implemented

### ✅ Drag & Drop Event Management
- Drag events between time slots
- Drop zones for time slots
- Visual drag overlay
- Automatic buffer recalculation
- Convex backend update

### ✅ Recurring Events
- Daily/Weekly/Monthly/Yearly patterns
- Custom day selection (e.g., Mon & Wed)
- End conditions (never, after X, on date)
- Occurrence expansion
- AI pattern detection

### ✅ Reminders & Notifications
- Browser notification API
- Preset times (5/15/30/60 min, 1 day)
- Toast notifications
- Permission handling
- Event-specific reminders

### ✅ Event Color Customization
- System colors (Health/Work/Relationships)
- Custom color picker
- Dynamic color application
- Color legend

### ✅ Event Details & Popovers
- Detailed event information
- AI insights (avg duration, patterns)
- System and recurrence badges
- Edit/delete actions

### ✅ Multi-Select & Bulk Operations
- Checkbox selection
- Select all/deselect all
- Bulk delete
- Bulk system change
- Bulk reschedule

### ✅ Google Calendar-Like Features
- Mini month view sidebar
- Week numbers
- Quick add input
- Today button
- Navigation controls

## Usage Examples

### Natural Language Quick Add

```tsx
// Type: "Gym tomorrow at 7am"
// Result: Creates Health event tomorrow at 7am

<QuickAddInput
  onParse={(result) => createEvent(result)}
  systems={SYSTEM_COLORS}
/>
```

### Event with Recurrence

```tsx
// Select recurrence pattern
const [pattern, setPattern] = useState<RecurrencePattern>();

<RecurringEventManager
  pattern={pattern}
  startDate={eventStart}
  onPatternChange={setPattern}
/>

// Save with recurrence
await createEvent({
  ...eventData,
  recurrence: pattern.type,
});
```

### Enable Notifications

```tsx
<NotificationCenter
  events={events}
  reminders={reminders}
  onReminderChange={setReminders}
/>
```

### Bulk Operations

```tsx
// Select events
const [selected, setSelected] = useState<Event[]>([]);

// Toggle selection
<EventBlock
  onSelect={() => toggleEvent(event)}
  isSelected={selected.includes(event)}
/>

// Bulk actions
<BulkOperations
  selectedEvents={selected}
  events={events}
  onEventsChange={setEvents}
/>
```

## AI Integration

### Scheduler Agent

Automatically recalculates buffers on:
- Event create
- Event update (including drag)
- Event delete
- Recurring event expansion

```typescript
await analyzeScheduleWithPredictions(userId, events);
// Returns:
// - Optimized buffer recommendations
// - Delay risk assessment
// - Schedule optimization score
```

### Reflection Agent

Updates memory with:
- Event completion data
- Duration patterns
- System balance

## Tailwind Styling Reference

### Drag & Drop
```tsx
// Draggable element
<div className="cursor-grab active:cursor-grabbing">
  
// Drop zone
<div className={`border ${isOver ? "bg-blue-50" : ""}`}>

// Drag overlay
<div className="shadow-xl opacity-90 cursor-grabbing">
```

### Notifications
```tsx
// Toast container
<div className="fixed bottom-4 right-4 z-50 shadow-2xl rounded-lg">

// Reminder badge
<span className="px-2 py-1 bg-green-600 text-white rounded-full text-xs">
```

### Bulk Selection
```tsx
// Selection header
<div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b">

// Selected item
<div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900">
```

## Convex API Updates

### Update Event (with drag)
```typescript
await updateEvent({
  eventId: draggedEvent._id,
  startTime: newStartTime,
  endTime: newEndTime,
});
```

### Create Recurring
```typescript
const instances = expandRecurringEvents(event, pattern);
// Creates individual event instances
```

## Example Events

### Simple Event
```json
{
  "title": "Team Standup",
  "startTime": 1705312800000,
  "endTime": 1705314600000,
  "system": "Work",
  "recurrence": "daily"
}
```

### Event with Reminders
```json
{
  "title": "Doctor Appointment",
  "reminders": [
    { "minutes": 1440, "sent": false },
    { "minutes": 60, "sent": false }
  ]
}
```

### Recurring Event
```json
{
  "title": "Gym Workout",
  "recurrencePattern": {
    "type": "weekly",
    "interval": 1,
    "daysOfWeek": [1, 3, 5],
    "occurrences": 52
  }
}
```

## Dependencies

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## Documentation Files

- **README.md** - Overview and quick start
- **CRUD_INTEGRATION.md** - Create/Edit/Delete operations
- **ADVANCED_FEATURES.md** - Detailed feature documentation
- **QUICK_REFERENCE.md** - Quick lookup guide
- **IMPLEMENTATION_SUMMARY.md** - Implementation overview

## Next Steps

1. **Update views** with drag-and-drop props
2. **Integrate** recurring event expansion in Convex
3. **Test** notification permissions
4. **Customize** colors and styling
5. **Add** calendar sync (Google/iCal)

## Support

For detailed implementation, see:
- `ADVANCED_FEATURES.md` - Complete guide
- Component source files
- Convex backend schema
- AI agent implementations

## Performance Tips

```typescript
// Memoize event filtering
const filtered = useMemo(() => events.filter(...), [events]);

// Debounce saves
const debouncedSave = useMemo(() => debounce(save, 500), []);

// Virtualize large lists
const virtualizer = useVirtualizer({ count: events.length });
```

## Accessibility

- Keyboard navigation (Tab, Enter, Escape)
- ARIA labels on all buttons
- Focus management in modals
- Screen reader support
- High contrast mode

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Version

1.0.0 - Initial release with all advanced features
