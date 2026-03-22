# Quick Reference - Event CRUD

## Creating Events

### Method 1: Header Button
```tsx
// CalendarView has "New Event" button built-in
// Click it to open modal with current date/time
```

### Method 2: Click Time Slot
```tsx
// In Daily/Weekly views, click any hour slot
onSlotClick={(date, hour) => console.log(date, hour)}
```

### Method 3: Click Date
```tsx
// In Monthly/Yearly views, click any date cell
onDateClick={(date) => console.log(date)}
```

## Event Modal Form

```tsx
<EventModal
  event={null}  // null = create, event object = edit
  selectedSlot={{ date: new Date(), hour: 10 }}
  systemColors={SYSTEM_COLORS}
  onSave={handleSave}
  onDelete={handleDelete}
  onClose={() => setShow(false)}
/>
```

## Convex Operations

### Create
```typescript
await createEvent({
  title: "New Event",
  startTime: timestamp,
  endTime: timestamp,
  system: "Work",
  userId: userId,
});
```

### Update
```typescript
await updateEvent({
  eventId: event._id,
  title: "Updated Title",
});
```

### Delete
```typescript
await deleteEvent({
  eventId: event._id,
});
```

## AI Buffers

Automatically calculated after any event change:

```typescript
// Call this to recalculate
await loadScheduleAnalysis();
```

Returns:
- `buffers` - Array of buffer blocks
- `optimizationScore` - Schedule quality (0-100)
- `riskAssessment` - High-risk events

## Tailwind Classes

### Modal
- Container: `bg-white dark:bg-gray-800 rounded-xl shadow-2xl`
- Inputs: `border border-gray-300 dark:border-gray-600 rounded-lg`
- Buttons: `px-4 py-2 bg-blue-600 text-white rounded-lg`

### Events
- Health: `bg-green-500`
- Work: `bg-blue-500`
- Relationships: `bg-purple-500`

### Buffers
- Transition: `bg-gray-200 dark:bg-gray-600`
- Recovery: `bg-amber-200 dark:bg-amber-700`
- Recommended: `ring-2 ring-yellow-400/30`

## File Locations

```
components/Calendar/
├── CalendarView.tsx         # Main container
├── EventModal.tsx           # Form modal
├── DailyView.tsx            # Timeline view
├── WeeklyView.tsx           # Week grid
├── MonthlyView.tsx          # Month grid
├── YearlyView.tsx           # Year summary
├── EventBlock.tsx           # Event display
├── CRUD_INTEGRATION.md       # Full docs
└── README.md                # Overview
```

## Key Props

### DailyView
```typescript
interface DailyViewProps {
  date: Date;
  events: Doc<"events">[];
  buffers: BufferBlock[];
  systemColors: any;
  onSlotClick?: (date: Date, hour: number) => void;
  onEventClick?: (event: Doc<"events">, e: React.MouseEvent) => void;
}
```

### WeeklyView
```typescript
interface WeeklyViewProps {
  date: Date;
  events: Doc<"events">[];
  buffers: BufferBlock[];
  systemColors: any;
  onSlotClick?: (date: Date, hour: number) => void;
  onEventClick?: (event: Doc<"events">, e: React.MouseEvent) => void;
}
```

### MonthlyView
```typescript
interface MonthlyViewProps {
  date: Date;
  events: Doc<"events">[];
  buffers: BufferBlock[];
  systemColors: any;
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: Doc<"events">, e: React.MouseEvent) => void;
}
```

### YearlyView
```typescript
interface YearlyViewProps {
  date: Date;
  events: Doc<"events">[];
  buffers: BufferBlock[];
  systemColors: any;
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: Doc<"events">, e: React.MouseEvent) => void;
}
```

## Example Flow

```tsx
// 1. User clicks time slot
onSlotClick={(date, hour) => {
  setEditingEvent(null);
  setSelectedSlot({ date, hour });
  setShowModal(true);
}}

// 2. User fills form and saves
const handleSave = async (data) => {
  await createEvent({ ...data, userId });
  await loadScheduleAnalysis(); // Recalc buffers
  setShowModal(false);
}

// 3. AI calculates buffers
const analysis = await analyzeScheduleWithPredictions(userId, events);
setBuffers(analysis.buffers);
```

## Color Reference

| System | Background | Light | Border | Text |
|--------|-----------|-------|--------|------|
| Health | green-500 | green-50 | green-500 | green-700 |
| Work | blue-500 | blue-50 | blue-500 | blue-700 |
| Relationships | purple-500 | purple-50 | purple-500 | purple-700 |

## Buffer Purposes

- **transition**: Between activities
- **recovery**: After high-effort
- **buffer**: General padding
- **travel**: Location changes

## Performance Tips

1. Use `useMemo` for event filtering
2. Debounce form saves
3. Optimistic UI updates
4. Lazy load views

## Accessibility

- Tab navigation
- Enter to submit
- Escape to close modal
- ARIA labels
- Focus management
