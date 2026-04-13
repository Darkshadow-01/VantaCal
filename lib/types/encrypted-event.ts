/**
 * Encrypted Event Types
 * Event structure with PGP-style splitting for privacy
 * 
 * Data Classification:
 * - Server-Indexable (signed only): timestamps, calendarId - for sorting/query
 * - Fully Encrypted + Signed: title, description, location, attendees, etc.
 */

export interface EncryptedEvent {
  id: string;
  
  calendarId: string;
  
  startTimeUnix: number;
  endTimeUnix: number;
  
  encryptedData: string;
  signature: string;
  
  sessionKeyPacket: string;
  calendarKeyId: string;
  
  recurrenceEncrypted?: string;
  recurrenceSignature?: string;
  
  createdAt: number;
  updatedAt: number;
  version: number;
}

export interface SignedOnlyFields {
  id: string;
  calendarId: string;
  startTimeUnix: number;
  endTimeUnix: number;
}

export interface EncryptedDataFields {
  title: string;
  description?: string;
  location?: string;
  attendees: string[];
  color?: string;
  system?: "Health" | "Work" | "Relationships";
  allDay?: boolean;
  reminderMinutes?: number[];
  timezone?: string;
}

export interface EventSignature {
  algorithm: "hmac-sha256" | "ed25519";
  signature: string;
  publicKey: string;
  timestamp: number;
}

export interface SessionKeyPacket {
  encryptedKey: string;
  iv: string;
  keyAlgorithm: string;
}

export interface RecurrenceEncrypted {
  encrypted: string;
  signature: string;
  type: string;
  interval?: number;
  endDate?: string;
  daysOfWeek?: number[];
  dayOfMonth?: number;
}

export interface EncryptedEventInput {
  calendarId: string;
  startTime: number;
  endTime: number;
  title: string;
  description?: string;
  location?: string;
  attendees?: string[];
  color?: string;
  system?: "Health" | "Work" | "Relationships";
  allDay?: boolean;
  reminderMinutes?: number[];
  timezone?: string;
  recurrence?: {
    type: "daily" | "weekly" | "biweekly" | "monthly" | "yearly" | "custom";
    interval?: number;
    endDate?: string;
    daysOfWeek?: number[];
    dayOfMonth?: number;
  };
}

export interface DecryptedEvent extends EncryptedEvent {
  decryptedData: EncryptedDataFields;
}

export interface EventValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export type EventAccessLevel = "none" | "availability" | "read" | "write" | "admin";

export interface CalendarAccess {
  calendarId: string;
  userId: string;
  accessLevel: EventAccessLevel;
  grantedAt: number;
  grantedBy: string;
}

export interface SharedEventInvite {
  eventId: string;
  inviterId: string;
  inviteeEmail: string;
  accessLevel: EventAccessLevel;
  encryptedKey: string;
  iv: string;
  status: "pending" | "accepted" | "declined";
  createdAt: number;
  expiresAt: number;
}

export interface EventSearchIndex {
  id: string;
  calendarId: string;
  startTimeUnix: number;
  endTimeUnix: number;
  hash?: string;
}

export interface BatchEncryptedEvents {
  events: EncryptedEvent[];
  syncToken: string;
  deletedIds: string[];
}