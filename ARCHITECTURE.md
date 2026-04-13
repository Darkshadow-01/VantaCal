# VanCal Architecture

## Overview

VanCal is a privacy-focused calendar app with **Zero-Knowledge E2E Encryption**. All event data is encrypted client-side before storage - the server (Convex) never sees plaintext data.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer                               │
│  components/Calendar/*  (VanCal.tsx, views, modals)      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                 Hooks Layer                               │
│  hooks/useEvents.ts - localStorage events                  │
│  hooks/useSettings.ts - UI preferences                   │
│  hooks/useCalendarState.ts - navigation state            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              Feature Modules (src/features/)              │
│  ├── calendar/     - Event CRUD, recurrence              │
│  ├── encryption/  - E2EE encryption layer            │
│  ├── ai/         - Schedule analysis, planning         │
│  └── shared-calendars/ - Sharing & collaboration      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              Encryption Layer (lib/)                    │
│  lib/e2ee.ts           - Master key derivation        │
│  lib/calendar-keys.ts   - Per-calendar keys           │
│  lib/event-encryptor.ts - Event encryption            │
│  lib/encrypted-backend.ts - Client storage          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                 Backend (Convex)                        │
│  events.encryptedPayload (unreadable server)             │
│  user_keys.encryptedMasterKey (unreadable server)       │
└─────────────────────────────────────────────────────────────┘
```

## Vault State Machine (v2.0)

```
┌─────────────────────────────────────────────────────────────┐
│              Vault State Transitions                         │
│                                                             │
│  NO_KEY (Temporary)                                          │
│       ↓ user sets password                                  │
│  UNLOCKED (Secure)                                          │
│       ↓ user locks vault                                    │
│  LOCKED (Vault exists, key not loaded)                       │
└─────────────────────────────────────────────────────────────┘
```

### Storage Keys

| Key | Type | Persistence | Encryption |
|-----|------|-------------|------------|
| encrypted_events_v1 | localStorage | ✅ Permanent | Encrypted |
| temp_calendar_events | sessionStorage | ❌ Session | Plaintext |
| vault_state | localStorage | ✅ Permanent | State flag |
| vault_key_storage | localStorage | ✅ Permanent | Encrypted key |

## Folder Structure

```
src/
├── app/                      # Next.js App Router
│   ├── calendar/page.tsx      # → VanCal
│   └── api/                  # AI agents
│
├── src/features/            # Feature modules (bounded contexts)
│   ├── calendar/           # Calendar management
│   │   ├── model/types.ts  # Event, Calendar types
│   │   ├── hooks/         # useCalendarEvents
│   │   └── service/       # recurrence, conflict
│   ├── encryption/         # E2EE (future)
│   ├── ai/                # AI services
│   │   └── services/      # scheduler, planner, coach
│   └── shared-calendars/    # Sharing
│
├── components/Calendar/     # UI components
│   ├── VanCal.tsx        # Main calendar
│   ├── [DWMY]View.tsx # Views
│   └── *Modal.tsx        # Modals
│
├── hooks/                 # React hooks
│   ├── useEvents.ts      # localStorage events
│   └── index.ts         # Barrel export
│
└── lib/                  # Utilities & encryption
    ├── types.ts        # TypeScript types
    ├── e2ee.ts        # E2EE primitives
    ├── calendar-keys.ts # Per-calendar keys
    ├── access-control.ts # RBAC
    ├── sharing-invite.ts # Calendar sharing
    ├── calendar-link.ts # Public links
    ├── metadata-free-notifications.ts # Privacy notifications
    ├── encrypted-backend.ts # Client storage
    └── storage-keys.ts  # Storage keys
```

## Data Flow

### Event Creation (E2EE)
```
User input (EventModal)
        ↓
useEvents.createEvent() [in hooks/useEvents.ts]
        ↓
encryptEvent() [lib/event-encryptor.ts]
        ↓
localStorage.set('events_...') OR Convex mutation
        ↓
Stored: { encryptedPayload, iv, hmac }
```

### Event Loading
```
localStorage.get() OR Convex query
        ↓
decryptEvent() [lib/event-encryptor.ts]
        ↓
useEvents hook provides decrypted data
        ↓
VanCal renders events
```

## Ownership

| Layer | Location | Responsibility |
|-------|---------|---------------|
| UI | `components/Calendar/` | Rendering, user input |
| Hooks | `hooks/` | State management |
| Feature | `src/features/` | Business logic |
| Crypto | `lib/` | Encryption primitives |
| Backend | `convex/` | Persistence (encrypted data only) |

## Import Guidelines

```typescript
// ✅ Good - Feature-based imports
import { CalendarEvent, useEvents } from "@/hooks";
import { encryptEvent, decryptEvent } from "@/lib/event-encryptor";
import { checkAccess } from "@/lib/access-control";

// ❌ Avoid - Direct Convex in components
import { api } from "@/convex/api";
import { useMutation } from "convex/react";
```

## Encryption Specification

### Key Hierarchy
```
Master Key (derived from password)
        ↓ (HKDF)
    Calendar Keys (per calendar)
        ↓ (AES-256-GCM)
    Event Encryption
```

### Security Properties
- **AES-256-GCM** for authenticated encryption
- **PBKDF2** with 1,000,000 iterations for key derivation
- **Key stretching** with 3 rounds (memory-hard equivalent)
- **Dual encryption**: session key + calendar key
- **HMAC signatures** for integrity verification

## Convex Integration

Data stored in Convex is **encrypted**:
- `events.encryptedPayload` - Cannot be read by server
- `user_keys.encryptedMasterKey` - Cannot be read by server
- Server sees only timestamps for indexing

## Migration Status

| Feature | Status |
|---------|--------|
| localStorage events | ✅ Working |
| E2EE encryption | ✅ Implemented |
| Calendar sharing | ✅ Implemented |
| Privacy notifications | ✅ Implemented |
| Encrypted backend | ✅ Implemented |
| Convex persistence | ✅ Working (encrypted) |
| AI Voice/Text Assistant | ✅ Implemented |
| Week numbers in Week view | ✅ Implemented |
| Custom color picker | ✅ Implemented (9 colors) |
| Import/Export ICS | ✅ Implemented |
| Working hours in Settings | ✅ Implemented |
| Keyboard shortcuts | ✅ Implemented |