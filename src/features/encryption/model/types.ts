export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
}

export interface MasterKeyStorage {
  encryptedMasterKey: string;
  salt: string;
  iv: string;
}

export interface RecoveryKeyData {
  recoveryKey: string;
  encryptedMasterKey: string;
  salt: string;
  iv: string;
}

export interface EncryptedEventData {
  title: string;
  description?: string;
  startTime: number;
  endTime: number;
  allDay: boolean;
  userId: string;
  system: "Health" | "Work" | "Relationships";
  color?: string;
  recurrence?: string;
  location?: string;
}

export interface EncryptedSystemData {
  name: "Health" | "Work" | "Relationships";
  description?: string;
  color: string;
  icon?: string;
}

export interface EncryptedMemoryData {
  type: "episodic" | "semantic" | "procedural";
  category: string;
  content: string;
  embedding?: number[];
  metadata?: {
    system?: string;
    eventId?: string;
    confidence?: number;
    source?: string;
    tags?: string[];
  };
  importance: number;
}