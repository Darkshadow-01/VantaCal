<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend with E2EE encryption.

When working with Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns.
<!-- convex-ai-end -->

## Code Architecture

This project follows **Clean Architecture** with clear layer separation:

```
src/
├── domain/                    # Pure business logic (framework-free)
│   ├── calendar/
│   │   ├── interfaces/       # IEventRepository, IStoragePort, IAIServicePort
│   │   ├── useCases/         # CreateEventUseCase, CalculateFocusUseCase
│   │   ├── event.ts         # CalendarEvent entity
│   │   └── valueObjects/    # EventTime, CalendarColor
│   ├── events/              # Domain events
│   └── ai/
│       └── interfaces/       # IAIServicePort
├── useCases/                # Application business rules
│   └── ScheduleWithAI.ts    # ScheduleWithAIUseCase, ManageFocusUseCase
├── adapters/               # Concrete implementations
│   ├── storage/           # IndexedDBStorageAdapter
│   └── ai/              # LocalAIServiceAdapter
├── infrastructure/        # Framework wiring
│   ├── adapters/          # ConvexEventRepository
│   └── container.ts      # DI container
├── src/features/          # Feature modules
│   ├── calendar/         # Calendar CRUD, conflict detection, recurrence
│   ├── encryption/       # E2EE encryption hooks
│   ├── shared-calendars/  # Sharing
│   ├── sync/           # Sync services
│   └── team-scheduling/ # Team scheduling
├── components/           # UI components
├── hooks/              # Thin React wrappers (call use cases)
└── lib/               # Utilities (encryption, storage, types)
```

### Dependency Rule

**Dependencies point inward only:**
- `domain/` and `useCases/` import nothing from `adapters/` or `infrastructure/`
- `hooks/` are thin wrappers that call use cases
- Business logic lives in domain/use cases, not hooks

### Import Guidelines

| Category | Path |
|----------|------|
| Types | `@/lib/types` or `@/src/domain/calendar/event` |
| Domain Ports | `@/src/domain/calendar/interfaces/IEventRepository` |
| Use Cases | `@/src/domain/calendar/useCases/*` or `@/src/useCases` |
| Encryption | `@/lib/e2ee` |
| Components | `@/components/Calendar` or `@/components/ui` |

### Build Verification

Run `npm run build` to verify changes — must pass before committing.

### E2EE Encryption

All events encrypted client-side before storage:
- **Canonical**: `@/lib/e2ee` exports `encryptData`, `decryptData`
- **Legacy re-exports**: `@/lib/encryption` for backward compat

### React Hooks Best Practices

1. **Hooks call use cases** — minimal logic in hooks
2. **No early returns before hook calls** — React rule
3. **Event hook**: `@/hooks/useEvents` (localStorage/IndexedDB)
4. **Focus hook**: `@/hooks/useFocusEngine` (delegates to domain use case)

### Type Safety

```typescript
// CalendarEvent.startTime is optional - check before use
event.startTime ? format(new Date(event.startTime), "h:mm a") : "All day"

// Or use lib/date-utils helpers
import { formatTime, formatDateTime } from "@/lib/date-utils";
```

### Files to Avoid

- `@/lib/schedulerWithBuffers` - deprecated
- `@/lib/encryptedHooks` - consolidated to `@/src/features/encryption/service/hooks`
- Direct imports to `src/features/ai/services` - path may not exist

<skills_system priority="1">

## Available Skills

<!-- SKILLS_TABLE_START -->
<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively.
</usage>

<available_skills>

<skill>
<name>algorithmic-art</name>
<description>Creating algorithmic art using p5.js. Use when users request generative art, flow fields, or particle systems.</description>
<location>project</location>
</skill>

<skill>
<name>canvas-design</name>
<description>Create beautiful visual art in .png and .pdf documents.</description>
<location>project</location>
</skill>

<skill>
<name>frontend-design</name>
<description>Create distinctive, production-grade frontend interfaces.</description>
<location>project</location>
</skill>

<skill>
<name>pptx</name>
<description>Use when a .pptx file is involved.</description>
<location>project</location>
</skill>

<skill>
<name>web-design-guidelines</name>
<description>Review UI code for Web Interface Guidelines compliance.</description>
<location>project</location>
</skill>

<skill>
<name>xlsx</name>
<description>Use when a spreadsheet file is the primary input or output.</description>
<location>project</location>
</skill>

</available_skills>
<!-- SKILLS_TABLE_END -->

</skills_system>