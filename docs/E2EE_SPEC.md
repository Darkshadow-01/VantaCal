# E2EE Encryption Specification

## Overview

VanCal implements **Zero-Knowledge End-to-End Encryption**. All event data is encrypted client-side before storage. The server (Convex) never sees plaintext event data, titles, descriptions, or participants.

## Security Properties

| Property | Value |
|----------|-------|
| Algorithm | AES-256-GCM |
| Key Derivation | PBKDF2 |
| Iterations | 1,000,000 |
| Key Stretching | 3 rounds |
| Salt Length | 16 bytes |
| IV Length | 12 bytes |

## Key Hierarchy

```
┌─────────────────────────────────────────────┐
│         Master Key (Password-derived)        │
└─────────────────────────────────────────────┘
                    ↓ HKDF
┌─────────────────────────────────────────────┐
│      Calendar Key (per calendar)            │
│      AES-256-GCM encrypted                 │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Event Encryption                   │
│      Session key + HMAC signature           │
└─────────────────────────────────────────────┘
```

## Implementation Files

### Primitives
- `lib/e2ee.ts` - Core encryption (master key derivation, encrypt/decrypt)
- `lib/calendar-keys.ts` - Per-calendar encryption keys

### Encryption Layers
- `lib/event-encryptor.ts` - Event encryption with PGP-style splitting
- `lib/access-control.ts` - RBAC for sharing

### Storage
- `lib/encrypted-backend.ts` - Client-side encrypted storage
- `lib/storage-keys.ts` - Storage key management

### Sharing
- `lib/sharing-invite.ts` - Key exchange for calendar sharing
- `lib/calendar-link.ts` - Public read-only links

### Notifications
- `lib/metadata-free-notifications.ts` - Privacy-preserving notifications

## Key Derivation

```typescript
// lib/e2ee.ts
import { deriveKeyFromPassword } from "./e2ee";

const key = await deriveKeyFromPassword(
  password,           // User's password
  salt,               // 16-byte random salt
  1000000             // iterations
);
```

## Event Encryption

```typescript
// lib/event-encryptor.ts
import { encryptEvent, decryptEvent } from "./lib/event-encryptor";

const encrypted = await encryptEvent(event, calendarKey, sessionKey);
const decrypted = await decryptEvent(encrypted, calendarKey, sessionKey);
```

### Dual-Key Encryption
1. **Calendar Key** - Derived from master key, unique per calendar
2. **Session Key** - Temporary key for event encryption

### HMAC Signatures
Each encrypted event includes an HMAC for integrity verification:
```typescript
const hmac = await crypto.subtle.sign(
  "HMAC",
  hmacKey,
  encryptedData
);
```

## Server-Blind Indexing

The server stores encrypted data plus metadata for indexing:

| Field | Stored | Encrypted |
|-------|--------|----------|
| `encryptedPayload` | - | YES |
| `startTime` | YES | Timestamp only |
| `endTime` | YES | Timestamp only |
| `calendarId` | YES | - |
| `userId` | YES | - |

This allows querying time ranges without decrypting.

## Convex Schema

```typescript
// convex/schema.ts
events: defineTable({
  userId: v.string(),
  calendarId: v.optional(v.id("shared_calendars")),
  encryptedPayload: v.string(),  // ENCRYPTED - server cannot read
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_user", ["userId"])
```

## Recovery

Users can recover their data using a **recovery phrase**:

```typescript
// lib/e2ee.ts
import { generateRecoveryPhrase, recoverFromPhrase } from "./e2ee";

// On setup - generate and store securely
const phrase = generateRecoveryPhrase();
// Store encrypted master key with phrase key

// On recovery
const key = await recoverFromPhrase(phrase);
```

## Calendar Sharing

When sharing a calendar:
1. Owner generates a share key for the calendar
2. Using ECDH, exchange keys with shared users
3. Each recipient gets their own encrypted copy of the calendar key

See `lib/sharing-invite.ts` for the full protocol.

## Metadata-Free Notifications

Notifications only show:
- "You have an upcoming event" (generic)
- Category (reminder, meeting, etc.)
- Urgency level

Not shown:
- Event title
- Event description
- Location
- Participants

See `lib/metadata-free-notifications.ts`.

## Usage

```typescript
// In a React component
import { useEvents } from "@/hooks";
import { CalendarEvent } from "@/lib/types";

const events = useEvents(); // Returns decrypted events

// Events are encrypted when saved
// Server stores: { encryptedPayload: "...", iv: "...", hmac: "..." }
```

## Security Considerations

1. **Password Strength** - Enforce minimum 12 characters
2. **Session Security** - Master key kept in memory only
3. **Key Rotation** - Calendar keys can be rotated
4. **Post-Quantum Ready** - Key encapsulation uses ECDH (P-256)

## Testing

Run encryption tests:
```bash
npm test -- --testPathPattern=e2ee
```