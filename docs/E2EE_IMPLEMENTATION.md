# End-to-End Encryption (E2EE) Implementation Guide

## Overview

This implementation provides enterprise-grade end-to-end encryption for the calendar app, ensuring that sensitive data is encrypted on the client before being sent to the backend.

## Security Architecture

### Encryption Scheme

- **Algorithm**: AES-GCM (256-bit)
- **Key Derivation**: PBKDF2 with SHA-256, 600,000 iterations
- **IV**: 12 bytes, randomly generated per encryption (authenticated encryption)
- **Salt**: 16 bytes for key stretching

### Key Hierarchy

```
User Password
     ↓
PBKDF2 (600k iterations)
     ↓
Password Key
     ↓
Encrypt/Decrypt
     ↓
Master Key (AES-256)
     ↓
Encrypt/Decrypt
     ↓
User Data (Events, Systems, Memories)
```

## How It Works

### 1. Initial Setup (First Login)

When a new user sets up encryption:

1. User enters a password
2. System generates a random Master Key (256-bit)
3. Password Key is derived using PBKDF2
4. Master Key is encrypted with Password Key
5. Encrypted Master Key + Salt + IV stored in Convex
6. Recovery phrase is generated and encrypted Master Key is stored

```
User Password → PBKDF2 → Password Key → AES-GCM → Encrypted Master Key
                                                      ↓
                                              Store in Convex
```

### 2. Login (Subsequent Logins)

1. User enters password
2. Password Key is derived using stored Salt
3. Password Key decrypts Master Key
4. Master Key stored in memory (NOT localStorage)
5. User can now encrypt/decrypt data

### 3. Data Encryption

Every piece of sensitive data is encrypted before storage:

```typescript
const eventData = { title: "Doctor's Appointment", ... };
const encrypted = await encryptData(eventData, masterKey);
// { ciphertext: "base64...", iv: "base64..." }
await createEvent({ encryptedPayload: JSON.stringify(encrypted) });
```

### 4. Multi-Device Support

Any device can decrypt data using the same password:

1. Enter same password on new device
2. Password Key derived locally
3. Master Key decrypted locally
4. Access granted

### 5. Recovery

If password is forgotten:

1. User enters Recovery Phrase
2. Recovery phrase → PBKDF2 → Recovery Key
3. Recovery Key decrypts stored encrypted Master Key
4. Access restored

## Example Encrypted Payload

```json
{
  "ciphertext": "W9sJmZ9B3xK2mN5pQ7sT1vW8yZ0aB4cD6eF8gH0jI2kL4mN6oP8qR0sT2",
  "iv": "A1bB2cC3dD4eE5fF"
}
```

The actual decrypted content:

```json
{
  "title": "Doctor's Appointment",
  "description": "Annual checkup",
  "startTime": 1699994400000,
  "endTime": 1699998000000,
  "allDay": false,
  "userId": "user_123abc",
  "system": "Health",
  "color": "#22c55e"
}
```

## Security Rules

### DO ✓

- Store encrypted keys in backend (Convex)
- Keep decrypted key only in memory
- Use unique IV for every encryption
- Use strong password (8+ characters)
- Generate and store recovery phrase

### DON'T ✗

- Never store decrypted key in localStorage
- Never store decrypted key in database
- Never send password to backend
- Never reuse IV (it's randomly generated)
- Never hardcode keys

## Implementation Files

| File | Purpose |
|------|---------|
| `src/features/encryption/service/e2ee.ts` | Core encryption/decryption functions |
| `src/features/encryption/service/hooks/use-encrypted-events.ts` | React hooks for encrypted events |
| `src/features/encryption/model/types.ts` | Type definitions |
| `src/features/encryption/service/__tests__/e2ee.test.ts` | E2EE test suite |
| `components/ui/encryption-prompt.tsx` | Password prompt UI |
| `components/ui/lock-button.tsx` | Lock app button & overlay |
| `src/features/users/repository/userKeys.ts` | Key storage mutations/queries |
| `convex/schema.ts` | Database schema with encryptedPayload |

## Testing

### Create Event (Encrypted)

```typescript
const encrypted = await encryptEvent({
  title: "Meeting",
  startTime: Date.now(),
  endTime: Date.now() + 3600000,
  userId: "user_123",
  system: "Work",
  allDay: false,
});
// Stored in Convex: { userId, encryptedPayload }
```

### Retrieve & Decrypt

```typescript
const encrypted = await fetchEvent(eventId);
const decrypted = await decryptEvent(encrypted.encryptedPayload);
console.log(decrypted.title); // "Meeting"
```

### Multi-Device

1. Login on Device A, create events
2. Events encrypted with Master Key
3. Login on Device B with same password
4. Master Key decrypted
5. Access to all events restored

### Wrong Password

```typescript
await unlockWithPassword("wrongpassword");
// Returns false, error shown
// No data exposed
```

### Recovery

```typescript
await unlockWithRecoveryPhrase("xxxx-xxxx-xxxx-xxxx");
// If valid, Master Key restored
// Full access restored
```

## Migration Path

### Phase 1: Dual Storage (Optional)
- Keep both encrypted and plaintext fields
- Encrypt new data, migrate old data gradually

### Phase 2: Full Encryption
- All new data encrypted
- Migrate all existing data
- Remove plaintext fields

### Phase 3: Schema Cleanup
- Remove legacy fields
- Optimize indexes for encryptedPayload

## Performance Considerations

- Key derivation: ~200-500ms (one-time per session)
- Encryption: ~5-10ms per item
- Decryption: ~5-10ms per item
- Batch operations recommended for large datasets
