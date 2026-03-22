# VanCal - AI-Powered Systemic Calendar

<p align="center">
  <img src="https://via.placeholder.com/120x40/4F46E5/FFFFFF?text=VanCal" alt="VanCal Logo" />
</p>

> **Your AI-powered calendar that thinks ahead, buffers time, and keeps you in flow.**

VanCal is a next-generation calendar application that combines intelligent scheduling with predictive AI, helping you manage your time across Health, Work, and Relationships systems.

## ✨ Features

### 🎯 Core Calendar Views
- **Daily View** - 24-hour timeline with event blocks and buffer visualization
- **Weekly View** - 7-day horizontal grid with hour-by-hour scheduling
- **Monthly View** - Traditional calendar grid with system color coding
- **Yearly View** - Annual overview with system hour breakdowns

### 🤖 AI-Powered Features

#### 🎰 Predictive Buffers
VanCal automatically calculates and suggests buffer time between events based on:
- Historical duration patterns
- Task complexity
- Transition time needs
- Recovery requirements

**Buffer Types:**
- **Transition** - Between different activities
- **Recovery** - After high-effort tasks
- **Buffer** - General padding time
- **Travel** - Location changes

#### 💡 Smart Insights
- Schedule optimization score (0-100%)
- Delay risk assessment
- System balance analysis
- Personalized recommendations

#### 🔮 Pattern Recognition
- Learns from your scheduling habits
- Predicts optimal meeting times
- Identifies recurring conflicts
- Tracks completion rates

### 📅 Event Management

#### Create Events
- **Quick Add** - Natural language input: "Gym tomorrow at 7am"
- **Manual Creation** - Full event form with all details
- **Recurring Events** - Daily, weekly, monthly, yearly patterns
- **Bulk Operations** - Multi-select and batch actions

#### Event Details
- Title, description, location
- System tag (Health, Work, Relationships)
- Custom colors
- Recurrence patterns
- Reminder notifications

### 🔔 Notifications & Reminders
- Browser push notifications
- Preset reminders (5, 15, 30, 60 min, 1 day)
- Custom reminder times
- Toast notifications

### 🎨 System Color Coding

| System | Color | Use Case |
|--------|-------|----------|
| **Health** | 🟢 Green | Exercise, sleep, nutrition, self-care |
| **Work** | 🔵 Blue | Meetings, deadlines, projects |
| **Relationships** | 🟣 Purple | Family, friends, social |

### 📊 Analytics Dashboard
- Weekly/Monthly system balance
- Hours per system breakdown
- Completion rates
- Buffer utilization

## 🚀 Quick Start

```tsx
import { VanCal } from "@/components/Calendar";

export default function CalendarPage() {
  return <VanCal />;
}
```

## 📦 Installation

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities date-fns
```

## 🎨 Usage

### Basic Usage
```tsx
import { VanCal } from "@/components/Calendar";

export default function App() {
  return <VanCal />;
}
```

### With Custom Components
```tsx
import { VanCal } from "@/components/Calendar";
import { QuickAddInput } from "@/components/Calendar/QuickAddInput";
import { NotificationCenter } from "@/components/Calendar/Notifications";

export default function App() {
  return (
    <div>
      <VanCal />
      <NotificationCenter events={events} />
    </div>
  );
}
```

## 🎯 Key Components

### VanCal (Main Component)
The complete calendar with all features built-in.

```tsx
<VanCal />
```

### Quick Add Input
Natural language event creation.

```tsx
// Examples:
// "Gym tomorrow at 7am"
// "Team meeting every Monday at 10am"
// "Lunch with Sarah for 1 hour"

<QuickAddInput
  onParse={(result) => createEvent(result)}
  systems={SYSTEM_COLORS}
/>
```

### Event Modal
Create and edit events with all options.

```tsx
<EventModal
  event={existingEvent}
  selectedSlot={{ date: new Date(), hour: 10 }}
  systemColors={SYSTEM_COLORS}
  onSave={handleSave}
  onDelete={handleDelete}
/>
```

### Recurring Event Manager
Advanced recurrence pattern configuration.

```tsx
<RecurringEventManager
  pattern={recurrencePattern}
  startDate={eventStart}
  onPatternChange={setPattern}
/>
```

### Notification Center
Browser notifications and reminders.

```tsx
<NotificationCenter
  events={events}
  reminders={reminders}
  onReminderChange={setReminders}
/>
```

### Event Popover
Detailed event information with AI insights.

```tsx
<EventPopover
  event={selectedEvent}
  aiInsights={{ avgDuration: 45, completionRate: 85 }}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

### Mini Month View
Compact calendar for sidebar.

```tsx
<MiniMonthView
  selectedDate={currentDate}
  events={events}
  onDateSelect={handleDateSelect}
/>
```

## 🤖 AI Integration

### Scheduler Agent
Automatically calculates predictive buffers:

```typescript
import { analyzeScheduleWithPredictions } from "@/lib/schedulerWithBuffers";

const analysis = await analyzeScheduleWithPredictions(userId, events);

// Returns:
// - events: Events with predictions
// - buffers: Suggested buffer blocks
// - optimizationScore: Schedule quality (0-100)
// - riskAssessment: High-risk events
```

### Reflection Agent
Updates memory with patterns:

```typescript
// After event completion
await storeEpisodicEvent({
  userId,
  eventId,
  system: "Work",
  title: "Team Meeting",
  actualDuration: 45,
  plannedDuration: 30,
});
```

## 🎨 Tailwind Classes

### Event Colors
```tsx
// System colors
bg-green-500   // Health
bg-blue-500    // Work
bg-purple-500  // Relationships

// Buffer blocks
bg-gray-300 opacity-50 rounded
```

### Modal Styling
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg">
```

### Buttons
```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  Create Event
</button>
```

## 📱 Responsive Design

```tsx
// Mobile: Stack vertically
<div className="flex flex-col lg:flex-row">

// Grid responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Breakpoints:
// sm: (640px)
// md: (768px)
// lg: (1024px)
// xl: (1280px)
```

## 🧪 Testing

### Create Event
```json
{
  "title": "Team Standup",
  "startTime": 1705312800000,
  "endTime": 1705314600000,
  "system": "Work",
  "color": "bg-blue-500"
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

## 🌐 Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 📚 Documentation

All detailed documentation is in `/components/Calendar/`:
- **README.md** - Component overview
- **CRUD_INTEGRATION.md** - Create/Edit/Delete operations
- **ADVANCED_FEATURES.md** - Detailed feature guide
- **QUICK_REFERENCE.md** - Quick lookup

## 🤝 Tech Stack

- **Frontend**: Next.js 16 (React 19 + TypeScript)
- **Styling**: Tailwind CSS v4
- **Backend**: Convex (real-time database)
- **Authentication**: Clerk
- **AI Agents**: Planner, Scheduler, Reflection, Behavior Coach
- **Drag & Drop**: @dnd-kit

## 🙏 Acknowledgments

- Built with Next.js, React, and Tailwind CSS
- AI powered by Convex and custom agents
- Icons from Lucide React
- Drag & drop by @dnd-kit

---

<p align="center">
  <strong>VanCal</strong> - Think ahead. Stay in flow.
</p>
