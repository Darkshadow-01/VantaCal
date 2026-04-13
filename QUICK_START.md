# VanCal Quick Start Guide

## Installation & Setup

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

## Key URLs

| Page | Route | Purpose |
|------|-------|---------|
| Calendar | `/calendar` | Main calendar interface |
| Sign In | `/sign-in` | User authentication |
| Sign Up | `/sign-up` | User registration |

## Sample Events Available

The app includes sample events for April 2026:

- Ramzan Id (Mar 21) - Holiday
- Team Standup (Apr 1, 10am) - Meeting
- Project Review (Apr 3, 2pm) - Meeting
- Doctor Appt (Apr 7, 9am) - Personal
- John Birthday (Apr 15) - Personal
- Weekly Planning (Apr 8, 10am) - Work
- Yoga Session (Apr 10, 7am) - Health

## Quick Testing

### Test 1: View Calendar
1. Navigate to `/calendar`
2. Use top navigation to switch views (Day/Week/Month/Year)
3. Use chevron buttons to navigate dates
4. Verify events display with correct colors

### Test 2: Create an Event
1. Click "Create event" button in sidebar
2. Fill in: Title, Date, Time, Type
3. Click "Save"

### Test 3: View Event Details
1. Click on any event
2. View event details in modal
3. Edit or delete from there

### Test 4: Toggle Dark Mode
1. Click moon/sun icon in header
2. Verify theme changes

### Test 5: AI Assistant
1. Click the sparkle icon in the toolbar (or press Ctrl+Shift+A)
2. Type "Meeting with John tomorrow at 3pm" or click the mic to speak
3. Review the parsed event details
4. Click "Add to Calendar"

### Test 6: AI in Event Modal
1. Click "Create event" button
2. Click "Add with AI" below the title
3. Type or speak your event
4. Click "Parse" to auto-fill the form

## Color Scheme

| System | Hex | Usage |
|--------|-----|-------|
| Health | #3BA55D | Green events |
| Work | #4F8DFD | Blue events |
| Relationships | #EC4899 | Pink/purple events |
| Tasks | #F59E0B | Orange events |

## Component Structure

```
src/
├── app/                     # Next.js App Router
│   ├── calendar/page.tsx    # Main calendar page
│   ├── sign-in/             # Clerk sign-in
│   └── sign-up/             # Clerk sign-up
├── components/
│   ├── Calendar/            # Calendar components
│   │   ├── MonthView.tsx
│   │   ├── WeekView.tsx
│   │   ├── DayView.tsx
│   │   ├── YearView.tsx
│   │   ├── CreateEventModal.tsx
│   │   ├── EventDetailModal.tsx
│   │   ├── SearchModal.tsx
│   │   └── SettingsModal.tsx
│   └── ui/                  # UI components
├── hooks/                   # React hooks
│   ├── useEvents.ts         # Event management
│   ├── useSettings.ts       # Settings
│   └── useCalendarState.ts  # Calendar state
└── lib/                     # Utilities
    ├── types.ts
    ├── constants.ts
    └── offline-storage.ts
```

## Key Features Enabled

- [x] Calendar views (Day, Week, Month, Year)
- [x] Event CRUD operations
- [x] Event filtering by calendar
- [x] Dark mode support
- [x] Responsive design
- [x] Sidebar with mini calendar
- [x] Search functionality
- [x] Settings modal
- [x] Conflict detection
- [x] Recurring events
- [x] User authentication (Clerk)
- [x] Demo mode (no auth required)
- [x] **AI Voice/Text Assistant** (toolbar sparkle button)
- [x] **AI in EventModal** ("Add with AI" button)
- [x] Week numbers in Week view
- [x] Custom color picker (9 colors)
- [x] Reminders dropdown
- [x] Recurrence end options
- [x] Guests/attendees
- [x] Import/Export ICS
- [x] Working hours in Settings
- [x] Keyboard shortcuts
- [x] AgendaView (list)

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CONVEX_URL=https://...  # optional
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| t | Go to today (Day view) |
| d | Day view |
| w | Week view |
| m | Month view |
| y | Year view |
| n | New event |
| j/k | Navigate next/prev |
| ←/→ | Navigate prev/next |
| s+alt | Open search |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Stuck on loading | Refresh page |
| Demo mode shows | Check Clerk keys in .env.local |
| Events not saving | Normal in demo mode (localStorage) |
| Build errors | Run `npm run lint` |

## Running the Project

```bash
# Development
npm run dev
# Opens http://localhost:3000/calendar

# Production build
npm run build
npm start
```

---

**Version**: 1.0.0
**Status**: Production Ready
**Last Updated**: April 4, 2026