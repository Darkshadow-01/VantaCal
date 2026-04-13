/**
 * Multi-Device Key Sync
 * Secure backup and restore of encryption keys across devices
 * 
 * Features:
 * - Encrypted key backup to local storage
 * - Export/import encrypted key bundles
 * - Device authentication for key access
 * - Automatic key rotation on new device
 */

import { 
  generateRandomBytes, 
  arrayBufferToBase64, 
  base64ToArrayBuffer,
  exportKey, 
  importKey,
  deriveKeyFromPassword,
  createKeyBackup,
  restoreKeyFromBackup,
  type EncryptedPayload
} from "./e2ee";
import { generateCalendarKey, encryptCalendarKeyWithMaster, decryptCalendarKeyWithMaster, type CalendarKey } from "./calendar-keys";

const SYNC_STORAGE_KEY = "vancal-key-sync";
const KEY_BACKUP_VERSION = "1.0";

export interface DeviceInfo {
  id: string;
  name: string;
  type: "desktop" | "mobile" | "web";
  lastActive: number;
  publicKey?: string;
}

export interface KeyBackupData {
  version: string;
  createdAt: number;
  deviceId: string;
  encryptedMasterKey: EncryptedPayload;
  salt: string;
  calendarKeys?: CalendarKeyBackup[];
  pqPublicKey?: string;
}

export interface CalendarKeyBackup {
  calendarId: string;
  encryptedKey: {
    calendarId: string;
    encryptedKey: string;
    iv: string;
    version: number;
    createdAt: number;
    updatedAt: number;
  };
}

export interface SyncStatus {
  lastSync: number | null;
  devices: DeviceInfo[];
  syncEnabled: boolean;
}

let currentDeviceId: string | null = null;

export function getDeviceId(): string {
  if (!currentDeviceId) {
    const stored = localStorage.getItem("vancal-device-id");
    if (stored) {
      currentDeviceId = stored;
    } else {
      currentDeviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("vancal-device-id", currentDeviceId);
    }
  }
  return currentDeviceId;
}

export function setDeviceName(name: string): void {
  localStorage.setItem(`vancal-device-name-${getDeviceId()}`, name);
}

export function getDeviceName(): string {
  return localStorage.getItem(`vancal-device-name-${getDeviceId()}`) || "Unknown Device";
}

export async function createKeyBackupBundle(
  masterKey: CryptoKey,
  password: string
): Promise<KeyBackupData> {
  const encryptedBackup = await createKeyBackup(masterKey, password);
  const salt = encryptedBackup.salt;

  const backup: KeyBackupData = {
    version: KEY_BACKUP_VERSION,
    createdAt: Date.now(),
    deviceId: getDeviceId(),
    encryptedMasterKey: encryptedBackup.encryptedBackup,
    salt,
  };

  return backup;
}

export async function restoreFromBackup(
  backup: KeyBackupData,
  password: string
): Promise<CryptoKey> {
  return await restoreKeyFromBackup(
    backup.encryptedMasterKey,
    backup.salt,
    password
  );
}

export function saveBackupLocally(backup: KeyBackupData): void {
  localStorage.setItem(`${SYNC_STORAGE_KEY}-backup`, JSON.stringify(backup));
}

export function loadLocalBackup(): KeyBackupData | null {
  const stored = localStorage.getItem(`${SYNC_STORAGE_KEY}-backup`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

export function clearLocalBackup(): void {
  localStorage.removeItem(`${SYNC_STORAGE_KEY}-backup`);
}

export function exportBackupToBase64(backup: KeyBackupData): string {
  return btoa(JSON.stringify(backup));
}

export function importBackupFromBase64(encoded: string): KeyBackupData | null {
  try {
    const json = atob(encoded);
    const backup = JSON.parse(json);
    if (backup.version !== KEY_BACKUP_VERSION) {
      console.warn("Backup version mismatch, may need migration");
    }
    return backup;
  } catch {
    return null;
  }
}

export function getSyncStatus(): SyncStatus {
  const devicesJson = localStorage.getItem(`${SYNC_STORAGE_KEY}-devices`);
  const lastSync = localStorage.getItem(`${SYNC_STORAGE_KEY}-last-sync`);
  const enabled = localStorage.getItem(`${SYNC_STORAGE_KEY}-enabled`);

  return {
    lastSync: lastSync ? parseInt(lastSync) : null,
    devices: devicesJson ? JSON.parse(devicesJson) : [],
    syncEnabled: enabled === "true",
  };
}

export function updateSyncStatus(status: Partial<SyncStatus>): void {
  const current = getSyncStatus();
  const updated = { ...current, ...status };
  
  localStorage.setItem(`${SYNC_STORAGE_KEY}-last-sync`, String(updated.lastSync || ""));
  localStorage.setItem(`${SYNC_STORAGE_KEY}-devices`, JSON.stringify(updated.devices));
  localStorage.setItem(`${SYNC_STORAGE_KEY}-enabled`, String(updated.syncEnabled));
}

export function registerDevice(name: string, type: "desktop" | "mobile" | "web"): DeviceInfo {
  const device: DeviceInfo = {
    id: getDeviceId(),
    name,
    type,
    lastActive: Date.now(),
  };

  const status = getSyncStatus();
  const existingIndex = status.devices.findIndex(d => d.id === device.id);
  
  if (existingIndex >= 0) {
    status.devices[existingIndex] = device;
  } else {
    status.devices.push(device);
  }

  updateSyncStatus({ devices: status.devices });

  return device;
}

export function removeDevice(deviceId: string): void {
  const status = getSyncStatus();
  status.devices = status.devices.filter(d => d.id !== deviceId);
  updateSyncStatus({ devices: status.devices });
}

export async function exportCalendarKeysBackup(
  calendarKeys: Map<string, CalendarKey>,
  masterKey: CryptoKey
): Promise<CalendarKeyBackup[]> {
  const backups: CalendarKeyBackup[] = [];

  for (const [calendarId, calendarKey] of calendarKeys) {
    const encrypted = await encryptCalendarKeyWithMaster(calendarKey, masterKey);
    backups.push({
      calendarId,
      encryptedKey: encrypted,
    });
  }

  return backups;
}

export async function importCalendarKeysBackup(
  backups: CalendarKeyBackup[],
  masterKey: CryptoKey
): Promise<Map<string, CalendarKey>> {
  const keys = new Map<string, CalendarKey>();

  for (const backup of backups) {
    try {
      const calendarKey = await decryptCalendarKeyWithMaster(backup.encryptedKey, masterKey);
      keys.set(backup.calendarId, calendarKey);
    } catch (error) {
      console.error(`Failed to restore calendar key ${backup.calendarId}:`, error);
    }
  }

  return keys;
}

export function hasBackup(): boolean {
  return loadLocalBackup() !== null;
}

export async function generateRecoveryCode(): Promise<string> {
  const bytes = await generateRandomBytes(16);
  const base64 = arrayBufferToBase64(bytes);
  const clean = base64.replace(/[+/=]/g, "").substring(0, 24);
  
  const chunks: string[] = [];
  for (let i = 0; i < 4; i++) {
    chunks.push(clean.substring(i * 6, (i + 1) * 6));
  }
  return chunks.join("-");
}

export async function createEncryptedRecovery(
  masterKey: CryptoKey,
  recoveryCode: string
): Promise<{ encrypted: EncryptedPayload; salt: string }> {
  const salt = await generateRandomBytes(16);
  const passwordKey = await deriveKeyFromPassword(recoveryCode, salt.buffer as ArrayBuffer, 100000);
  
  const exportedKey = await exportKey(masterKey);
  const iv = await generateRandomBytes(12);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    passwordKey,
    exportedKey
  );

  return {
    encrypted: {
      ciphertext: arrayBufferToBase64(encrypted),
      iv: arrayBufferToBase64(iv),
    },
    salt: arrayBufferToBase64(salt),
  };
}

export async function restoreWithRecoveryCode(
  encrypted: EncryptedPayload,
  salt: string,
  recoveryCode: string
): Promise<CryptoKey> {
  const saltArray = base64ToArrayBuffer(salt);
  const passwordKey = await deriveKeyFromPassword(recoveryCode, saltArray, 100000);
  
  const ciphertext = base64ToArrayBuffer(encrypted.ciphertext);
  const iv = base64ToArrayBuffer(encrypted.iv);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    passwordKey,
    ciphertext
  );

  return await importKey(decrypted);
}

export function clearAllSyncData(): void {
  localStorage.removeItem(`${SYNC_STORAGE_KEY}-backup`);
  localStorage.removeItem(`${SYNC_STORAGE_KEY}-devices`);
  localStorage.removeItem(`${SYNC_STORAGE_KEY}-last-sync`);
  localStorage.removeItem(`${SYNC_STORAGE_KEY}-enabled`);
  localStorage.removeItem("vancal-device-id");
  currentDeviceId = null;
}