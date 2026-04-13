/**
 * Import Rules - Preventing Path Chaos
 * 
 * This file documents the import restrictions enforced by ESLint.
 * Run: npm run lint
 * 
 * RULES:
 * 
 * 1. NEVER use relative paths to features:
 *    ❌ import { useEvents } from "../../features/calendar/hooks"
 *    ✅ import { useCalendarEvents } from "@/features/calendar"
 * 
 * 2. NEVER import directly from lib/ (use feature paths instead):
 *    ❌ import { CalendarEvent } from "@/lib/types"
 *    ✅ import { CalendarEvent } from "@/features/calendar"
 * 
 * 3. NEVER import from hooks/ root (use src/shared/hooks or features):
 *    ❌ import { useEvents } from "@/hooks"
 *    ✅ import { useCalendarState } from "@/shared/hooks" (for non-event hooks)
 *    ✅ import { useCalendarEvents } from "@/features/calendar"
 * 
 * 4. NEVER import from deprecated paths:
 *    - @/lib/offline-storage (use Convex + E2EE)
 *    - @/lib/sync-manager (use Convex)
 *    - @/lib/recurrence (use @/features/calendar)
 * 
 * 5. ALWAYS use feature public APIs (index.ts exports):
 *    - @/features/calendar - exports types, hooks, services
 *    - @/features/encryption - exports encryption functions
 *    - @/features/ai - exports AI services
 *    - @/shared - exports constants, utils, shared hooks
 * 
 * EXCEPTIONS (allowed imports):
 * - @/lib/constants (DAYS, MONTHS)
 * - @/lib/utils (cn, date helpers)
 * - @/components/ui/* (shadcn/ui components)
 * - @/convex/* (generated Convex API)
 * 
 * ENFORCEMENT:
 * Run `npm run lint` to check imports. The ESLint config blocks:
 * - Direct feature internal imports (must use public API)
 * - Legacy lib/ imports (migrated to features)
 * - Direct hooks/ imports (use src/shared or features)
 * - Agent imports (migrated to features/ai)
 */

// This file is documentation only - actual enforcement in eslint.config.mjs
export const IMPORT_RULES = {
  allowedPatterns: [
    "@/features/*",
    "@/shared/*",
    "@/components/ui/*",
    "@/convex/*",
    "@/lib/constants",
    "@/lib/utils",
  ],
  blockedPatterns: [
    "../../features/*/internal-path", // Must use index.ts
    "@/lib/types", // Use @/features/calendar
    "@/lib/offline-storage", // Use Convex
    "@/lib/sync-manager", // Use Convex
    "@/lib/recurrence", // Use @/features/calendar
    "@/lib/localStorage", // Use encryption hooks
    "@/hooks/useEvents", // Use @/features/calendar
    "@/agents/*", // Use @/features/ai
  ],
};
