# VanCal - AI-Powered Systemic Calendar

<p align="center">
  <img src="https://via.placeholder.com/120x40/4F46E5/FFFFFF?text=VanCal" alt="VanCal Logo" />
</p>

> **Your AI-powered calendar that thinks ahead, buffers time, and keeps you in flow.**

VanCal is a next-generation calendar application that combines intelligent scheduling with predictive AI, helping you manage your time across Health, Work, and Relationships systems.

## Current Status

✅ **Build Passing** | ✅ **Production Ready** (with demo mode)

### Recently Fixed Issues
- Clerk authentication now works properly
- Fixed "Hooks called in wrong order" React errors in modals
- Demo mode with localStorage persistence
- Clean build with no TypeScript errors

## ✨ Features

### 🎯 Core Calendar Views
- **Daily View** - 24-hour timeline with event blocks
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

#### 💡 Smart Insights
- Schedule optimization score
- Delay risk assessment
- System balance analysis
- Personalized recommendations

### 📅 Event Management

#### Create Events
- **Quick Add** - Natural language input: "Gym tomorrow at 7am"
- **Manual Creation** - Full event form with all details
- **Recurring Events** - Daily, weekly, monthly, yearly patterns
- **Conflict Detection** - Warns when events overlap

#### Event Details
- Title, description, location
- System tag (Health, Work, Relationships)
- Custom colors
- Recurrence patterns
- Reminder notifications

### 🎨 System Color Coding

| System | Color | Use Case |
|--------|-------|----------|
| **Health** | 🟢 Green | Exercise, sleep, nutrition, self-care |
| **Work** | 🔵 Blue | Meetings, deadlines, projects |
| **Relationships** | 🟣 Purple | Family, friends, social |

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

## 📦 Environment Variables

Create `.env.local` with:

```env
# Clerk Authentication (get from clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Convex Database (optional - currently uses localStorage)
CONVEX_DEPLOYMENT=dev:your-deployment
NEXT_PUBLIC_CONVEX_URL=https://...
```

## 🎯 Key Components

### CreateEventModal
Event creation with conflict detection:

```tsx
<CreateEventModal
  isOpen={showCreateModal}
  onClose={() => setShowCreateModal(false)}
  onSave={handleCreateEvent}
  existingEvents={events}
/>
```

### MonthView
Monthly calendar grid:

```tsx
<MonthView
  currentDate={currentDate}
  events={filteredEvents}
  onEventClick={handleEventClick}
  onDateClick={handleDateClick}
  onDoubleClick={handleDoubleClick}
/>
```

### EventDetailModal
View and edit event details:

```tsx
<EventDetailModal
  isOpen={showEventDetail}
  event={selectedEvent}
  calendars={calendars}
  onClose={() => setShowEventDetail(false)}
  onEdit={handleEditEvent}
  onDelete={handleDeleteEvent}
/>
```

## 🧪 Testing

### Create Event
```json
{
  "title": "Team Standup",
  "date": 1,
  "month": 3,
  "year": 2026,
  "hour": 10,
  "color": "#4F8DFD",
  "type": "meeting"
}
```

## 🏗️ Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── calendar/           # Calendar page
│   ├── api/               # API routes (AI agents)
│   └── sign-in/           # Clerk auth pages
├── components/
│   ├── Calendar/          # Calendar components
│   └── ui/                # UI components
├── hooks/                 # Custom React hooks
│   ├── useEvents.ts       # Event management
│   ├── useSettings.ts     # Settings management
│   └── useCalendarState.ts
├── lib/                   # Utilities
│   ├── types.ts           # TypeScript types
│   ├── constants.ts       # Constants
│   └── offline-storage.ts # IndexedDB storage
└── features/              # Feature modules (reserved)
```

## 🤖 AI Integration

The app includes AI agent API routes:
- `/api/scheduler` - Schedule optimization
- `/api/reflection` - Pattern learning
- `/api/behavior-coach` - Behavior insights
- `/api/localAI` - Local LLM integration (Ollama)

## 🔧 Known Limitations

1. **Convex** - Not fully integrated (using localStorage)
2. **Google Calendar** - Import not configured
3. **Clerk** - Requires valid keys for full auth

## 🙏 Tech Stack

- **Frontend**: Next.js 16 (React 19 + TypeScript)
- **Styling**: Tailwind CSS
- **Backend**: Convex (optional), localStorage (default)
- **Authentication**: Clerk
- **Icons**: Lucide React

---

<p align="center">
  <strong>VanCal</strong> - Think ahead. Stay in flow.
</p>