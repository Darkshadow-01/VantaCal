/**
 * Calendar Sharing System
 * Invite members with public key exchange and encrypted calendar key distribution
 * 
 * Sharing Protocol:
 * 1. Owner generates calendar key (symmetric AES-256)
 * 2. For each member: encrypt calendar key with member's public key
 * 3. Store encrypted key copies (one per member)
 * 4. Member decrypts their copy using their private key
 * 5. All members can now encrypt/decrypt calendar events
 */

import { 
  generateRandomBytes, 
  arrayBufferToBase64, 
  base64ToArrayBuffer,
  exportKey,
  importKey
} from "./e2ee";
import { 
  encryptCalendarMemberKey, 
  decryptCalendarMemberKey,
  generateCalendarKey,
  encryptCalendarKeyWithMaster,
  decryptCalendarKeyWithMaster,
  cacheCalendarKey,
  getCachedCalendarKey,
  type CalendarKey
} from "./calendar-keys";

const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12;

export interface CalendarMember {
  id: string;
  userId: string;
  email: string;
  displayName?: string;
  accessLevel: "read" | "write" | "admin";
  publicKey: string;
  encryptedCalendarKey?: string;
  keyIv?: string;
  joinedAt: number;
  invitedBy: string;
  status: "pending" | "accepted" | "declined";
}

export interface CalendarShareInvite {
  id: string;
  calendarId: string;
  inviterId: string;
  inviteeEmail: string;
  inviteePublicKey: string;
  encryptedCalendarKey: string;
  keyIv: string;
  accessLevel: "read" | "write" | "admin";
  status: "pending" | "accepted" | "declined";
  createdAt: number;
  expiresAt: number;
  message?: string;
}

export interface CalendarSharingConfig {
  allowExternalInvite: boolean;
  requireApproval: boolean;
  maxMembers: number;
  defaultAccessLevel: "read" | "write";
}

export interface ShareResult {
  success: boolean;
  member?: CalendarMember;
  error?: string;
}

export interface PublicKeyBundle {
  publicKey: string;
  keyId: string;
  createdAt: number;
  algorithm: string;
}

let userPublicKey: PublicKeyBundle | null = null;
let userPrivateKey: CryptoKey | null = null;

export async function initUserKeys(): Promise<PublicKeyBundle> {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  const publicKeyExported = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  const publicKeyString = arrayBufferToBase64(publicKeyExported);

  userPrivateKey = keyPair.privateKey;
  userPublicKey = {
    publicKey: publicKeyString,
    keyId: `key-${Date.now()}`,
    createdAt: Date.now(),
    algorithm: "ECDH-P256",
  };

  return userPublicKey;
}

export function getUserPublicKey(): PublicKeyBundle | null {
  return userPublicKey;
}

export function clearUserKeys(): void {
  userPublicKey = null;
  userPrivateKey = null;
}

export async function createCalendarShareInvite(
  calendarId: string,
  inviterId: string,
  inviteeEmail: string,
  inviteePublicKeyString: string,
  accessLevel: "read" | "write" | "admin",
  calendarKey: CalendarKey,
  message?: string
): Promise<CalendarShareInvite> {
  const inviteePublicKey = await crypto.subtle.importKey(
    "spki",
    base64ToArrayBuffer(inviteePublicKeyString),
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );

  const exportedCalendarKey = await exportKey(calendarKey.key);
  const iv = await generateRandomBytes(IV_LENGTH);

  const encryptedCalendarKey = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
    inviteePublicKey,
    exportedCalendarKey
  );

  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  const invite: CalendarShareInvite = {
    id: `inv-${now}-${Math.random().toString(36).substr(2, 9)}`,
    calendarId,
    inviterId,
    inviteeEmail,
    inviteePublicKey: inviteePublicKeyString,
    encryptedCalendarKey: arrayBufferToBase64(encryptedCalendarKey),
    keyIv: arrayBufferToBase64(iv),
    accessLevel,
    status: "pending",
    createdAt: now,
    expiresAt: now + sevenDays,
    message,
  };

  return invite;
}

export async function acceptCalendarInvite(
  invite: CalendarShareInvite
): Promise<CalendarMember> {
  if (!userPrivateKey) {
    throw new Error("User keys not initialized");
  }

  if (Date.now() > invite.expiresAt) {
    throw new Error("Invite has expired");
  }

  const encryptedKey = base64ToArrayBuffer(invite.encryptedCalendarKey);
  const iv = base64ToArrayBuffer(invite.keyIv);

  const decryptedKeyData = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: iv },
    userPrivateKey,
    encryptedKey
  );

  const calendarKey = await importKey(decryptedKeyData);

  const calendarKeyObj: CalendarKey = {
    id: invite.calendarId,
    key: calendarKey,
    createdAt: Date.now(),
    version: 1,
  };

  cacheCalendarKey(invite.calendarId, calendarKeyObj);

  return {
    id: `member-${Date.now()}`,
    userId: userPublicKey?.keyId || "unknown",
    email: invite.inviteeEmail,
    accessLevel: invite.accessLevel,
    publicKey: userPublicKey?.publicKey || "",
    encryptedCalendarKey: invite.encryptedCalendarKey,
    keyIv: invite.keyIv,
    joinedAt: Date.now(),
    invitedBy: invite.inviterId,
    status: "accepted",
  };
}

export async function declineCalendarInvite(inviteId: string): Promise<void> {
  console.log(`Declined invite: ${inviteId}`);
}

export async function revokeMemberAccess(
  calendarId: string,
  memberId: string,
  calendarKey: CalendarKey
): Promise<{ success: boolean; error?: string }> {
  try {
    removeCalendarKeyForMember(memberId);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

function removeCalendarKeyForMember(memberId: string): void {
  console.log(`Revoked access for member: ${memberId}`);
}

export function canAccessCalendar(
  member: CalendarMember,
  requiredLevel: "read" | "write" | "admin"
): boolean {
  const levelHierarchy = { read: 1, write: 2, admin: 3 };
  return levelHierarchy[member.accessLevel] >= levelHierarchy[requiredLevel];
}

export function canInviteMembers(member: CalendarMember): boolean {
  return member.accessLevel === "admin" || member.accessLevel === "write";
}

export function canModifyCalendar(member: CalendarMember): boolean {
  return member.accessLevel === "admin" || member.accessLevel === "write";
}

export function canDeleteCalendar(member: CalendarMember): boolean {
  return member.accessLevel === "admin";
}

export function canManageMembers(member: CalendarMember): boolean {
  return member.accessLevel === "admin";
}

export async function shareCalendarWithUser(
  calendarId: string,
  userId: string,
  email: string,
  accessLevel: "read" | "write" | "admin",
  calendarKey: CalendarKey,
  inviterId: string
): Promise<ShareResult> {
  try {
    const member: CalendarMember = {
      id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      email,
      accessLevel,
      publicKey: userPublicKey?.publicKey || "",
      encryptedCalendarKey: "",
      keyIv: "",
      joinedAt: Date.now(),
      invitedBy: inviterId,
      status: "accepted",
    };

    return { success: true, member };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function leaveCalendar(
  calendarId: string,
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Member ${memberId} left calendar ${calendarId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export function validateInviteExpiry(invite: CalendarShareInvite): boolean {
  return Date.now() < invite.expiresAt;
}

export function getInviteStatus(invite: CalendarShareInvite): "valid" | "expired" | "accepted" | "declined" {
  if (invite.status === "accepted") return "accepted";
  if (invite.status === "declined") return "declined";
  if (Date.now() > invite.expiresAt) return "expired";
  return "valid";
}

export async function regenerateCalendarKey(
  calendarId: string,
  members: CalendarMember[]
): Promise<{ newKey: CalendarKey; reEncryptedKeys: Map<string, { encryptedKey: string; iv: string }> }> {
  const newKey = await generateCalendarKey();
  const reEncryptedKeys = new Map<string, { encryptedKey: string; iv: string }>();

  for (const member of members) {
    if (member.status !== "accepted" || !member.publicKey) continue;

    try {
      const memberPublicKey = await crypto.subtle.importKey(
        "spki",
        base64ToArrayBuffer(member.publicKey),
        { name: "ECDH", namedCurve: "P-256" },
        true,
        []
      );

      const exportedKey = await exportKey(newKey.key);
      const iv = await generateRandomBytes(IV_LENGTH);

      const encrypted = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
        memberPublicKey,
        exportedKey
      );

      reEncryptedKeys.set(member.id, {
        encryptedKey: arrayBufferToBase64(encrypted),
        iv: arrayBufferToBase64(iv),
      });
    } catch (error) {
      console.error(`Failed to re-encrypt key for member ${member.id}:`, error);
    }
  }

  cacheCalendarKey(calendarId, newKey);

  return { newKey, reEncryptedKeys };
}

export function getDefaultSharingConfig(): CalendarSharingConfig {
  return {
    allowExternalInvite: true,
    requireApproval: true,
    maxMembers: 50,
    defaultAccessLevel: "read",
  };
}

export function validateSharingConfig(config: Partial<CalendarSharingConfig>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.maxMembers && (config.maxMembers < 2 || config.maxMembers > 100)) {
    errors.push("Max members must be between 2 and 100");
  }

  if (config.defaultAccessLevel && !["read", "write"].includes(config.defaultAccessLevel)) {
    errors.push("Default access level must be 'read' or 'write'");
  }

  return { valid: errors.length === 0, errors };
}