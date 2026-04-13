/**
 * Runtime Safeguards for Data Consistency
 * 
 * This module provides runtime checks to detect data inconsistency
 * between the old localStorage system and new Convex + E2EE system.
 * 
 * Usage: Add to app initialization (e.g., in useEffect in CalendarView)
 */

const STORAGE_KEY = "vancal-data-version";
const CURRENT_VERSION = "2.0.0-convex";

interface StorageCheck {
  key: string;
  hasLegacyData: boolean;
  hasNewData: boolean;
  status: "ok" | "warning" | "conflict";
  message: string;
}

export function checkStorageConsistency(): StorageCheck[] {
  const checks: StorageCheck[] = [];

  // Check 1: Legacy localStorage events
  const legacyEvents = localStorage.getItem("calendar-events");
  checks.push({
    key: "calendar-events",
    hasLegacyData: !!legacyEvents && legacyEvents !== "[]",
    hasNewData: false, // Will be checked via Convex
    status: "warning",
    message: "Legacy localStorage events found",
  });

  // Check 2: Data version
  const version = localStorage.getItem(STORAGE_KEY);
  checks.push({
    key: STORAGE_KEY,
    hasLegacyData: version !== CURRENT_VERSION,
    hasNewData: version === CURRENT_VERSION,
    status: version === CURRENT_VERSION ? "ok" : "warning",
    message: version === CURRENT_VERSION 
      ? "Data version current" 
      : "Data needs migration",
  });

  // Check 3: Migration status
  const migrated = localStorage.getItem("vancal-events-migrated");
  if (legacyEvents && !migrated) {
    checks.push({
      key: "migration-status",
      hasLegacyData: true,
      hasNewData: false,
      status: "conflict",
      message: "Events exist but not migrated to Convex",
    });
  }

  return checks;
}

export function logStorageWarnings(): void {
  const checks = checkStorageConsistency();
  
  console.group("🔍 Storage Consistency Check");
  
  for (const check of checks) {
    if (check.status !== "ok") {
      console.warn(`[${check.status.toUpperCase()}] ${check.key}: ${check.message}`);
    }
  }
  
  console.groupEnd();
}

export function setDataVersion(version: string = CURRENT_VERSION): void {
  localStorage.setItem(STORAGE_KEY, version);
}

export function clearLegacyStorage(): void {
  // Only clear after confirming migration successful
  const checks = checkStorageConsistency();
  const hasConflict = checks.some(c => c.status === "conflict");
  
  if (!hasConflict) {
    localStorage.removeItem("calendar-events");
    localStorage.removeItem("last-synced-events");
    localStorage.removeItem("pending-sync");
    console.log("🗑️ Legacy localStorage cleared");
  } else {
    console.warn("⚠️ Cannot clear legacy storage - conflict detected");
  }
}

export function assertSingleSource(): void {
  if (typeof window === "undefined") return;
  
  const checks = checkStorageConsistency();
  const conflicts = checks.filter(c => c.status === "conflict");
  
  if (conflicts.length > 0) {
    const message = `Data inconsistency detected: ${conflicts.map(c => c.message).join(", ")}`;
    console.error("❌", message);
    // In development, throw to catch issues early
    if (process.env.NODE_ENV === "development") {
      throw new Error(message);
    }
  } else {
    console.log("✅ Single source of truth verified");
  }
}
