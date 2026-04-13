<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend with E2EE encryption.

When working with Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->

## Code Architecture

This project follows a feature-based architecture in `src/features/`:

```
src/
├── app/                    # Next.js App Router pages
│   ├── calendar/           # Main calendar page
│   ├── api/               # API routes (AI agents)
│   ├── sign-in/           # Clerk authentication
│   └── sign-up/           # Clerk authentication
├── src/features/          # Feature modules
│   ├── calendar/          # Calendar management (PRIMARY)
│   ├── encryption/        # E2EE encryption layer
│   ├── ai/               # AI services
│   └── shared-calendars/   # Calendar sharing
├── components/
│   ├── Calendar/        # Calendar UI components
│   │   ├── CalendarView.tsx
│   │   ├── MonthView.tsx
│   │   ├── WeekView.tsx
│   │   ├── DayView.tsx
│   │   ├── CreateEventModal.tsx
│   │   └── EventModal.tsx
│   └── ui/              # UI components (shadcn/ui)
├── hooks/                # Custom React hooks
│   ├── useEvents.ts     # Event management (localStorage)
│   ├── useSettings.ts # Settings management
│   └── useCalendarState.ts
└── lib/                 # Utilities
    ├── types.ts        # TypeScript types
    ├── constants.ts   # Calendar constants
    ├── e2ee.ts      # E2EE encryption
    └── offline-storage.ts
```

### Import Guidelines

- **Types**: `@/lib/types` or `@/src/features/calendar/model/types`
- **Components**: `@/components/Calendar` or `@/components/ui`
- **Hooks**: `@/hooks`
- **Encryption**: `@/lib/e2ee`, `@/lib/event-encryptor`
- **Calendar Features**: `@/src/features/calendar`
- **Path aliases**: Configured in `tsconfig.json`

### Important Notes for Agents

1. **Build passes** - Run `npm run build` to verify changes
2. **E2EE Encryption** - All events encrypted client-side before storage
   - Encryption keys: `@/lib/e2ee.ts`, `@/lib/calendar-keys.ts`
   - Event encryption: `@/lib/event-encryptor.ts`, `@/lib/access-control.ts`
3. **Clerk auth** - Requires valid keys in `.env.local`
4. **React Hooks order** - Don't call hooks after early returns
5. **localStorage** - Currently using localStorage for events
6. **Convex** - Stores encrypted payloads (cannot read data)

### Breaking Changes Avoid

- DO NOT import from `@/hooks/useEvents` - does not exist
- DO NOT use `@/src/features/ai/services` - path may not exist
- DO NOT use `@/lib/schedulerWithBuffers` - path may not exist

### Feature Dependencies

| Feature | Primary File | Status |
|---------|-------------|--------|
| Events | `hooks/useEvents.ts` | Use localStorage |
| Calendar CRUD | `src/features/calendar/` | Feature module |
| Encryption | `lib/e2ee.ts` | Working |
| Sharing | `lib/sharing-invite.ts` | Phase 3 complete |
| Notifications | `lib/metadata-free-notifications.ts` | Phase 4 complete |
| Storage | `lib/encrypted-backend.ts` | Phase 5 complete |
| AI Voice/Text | `components/Calendar/AIAssistantModal.tsx` | Implemented |

### AI Integration

**Voice & Text AI Assistant** (`components/Calendar/AIAssistantModal.tsx`):
- Floating button in toolbar (sparkle icon) - triggers modal
- Uses Web Speech API for voice input (Chrome/Safari/Edge)
- Natural language parsing via `/api/localAI` with `agent: "parse"`
- Parses: title, system (Health/Work/Relationships), time, duration, recurrence
- Shows preview with confidence score before adding

**EventModal AI Input** (`components/Calendar/EventModal.tsx`):
- "Add with AI" button reveals text input + mic button
- Parsed data auto-fills title, system, time, duration

### Type Safety Pattern

When using `CalendarEvent.startTime` or `.endTime` (both are optional), use null checks:

```typescript
// ❌ Wrong - will show TS error
format(new Date(event.startTime), "h:mm a")

// ✅ Correct - with conditional
event.startTime ? format(new Date(event.startTime), "h:mm a") : "All day"

// ✅ Use lib/date-utils.ts helpers
import { formatTime, formatDateTime } from "@/lib/date-utils";
formatTime(event.startTime)
formatDateTime(event.startTime)
```

### CalendarEvent Type

```typescript
interface CalendarEvent {
  id: string;
  title: string;
  startTime?: number;   // Optional - check before use
  endTime?: number;    // Optional - check before use
  // ...other fields
}
```

### Available Utilities

- `@/lib/date-utils.ts` - safeDate, formatTime, formatDateTime, getDurationMinutes
- `@/lib/types.ts` - CalendarEvent, Calendar, Settings (primary types)
- `@/src/features/calendar/model/types.ts` - Mirror of above (canonical source)

### Implemented Features

**High Priority (Complete):**
- Week numbers in Weekly view
- Reminders in EventModal
- Custom color picker (9 colors)
- List view (AgendaView)

**Medium Priority (Complete):**
- Recurrence end options (Never, End on date, End after X)
- Guests/attendees UI
- Import/Export ICS
- Working hours in Settings
- Keyboard shortcuts

**AI Integration (Complete):**
- AIAssistantModal with voice + text
- EventModal "Add with AI" button
- Ollama/OpenAI natural language parsing