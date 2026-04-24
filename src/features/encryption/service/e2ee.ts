/**
 * End-to-End Encryption (E2EE) Library
 * 
 * ⚠️ DEPRECATED: This file re-exports from @/lib/e2ee which is the canonical implementation.
 * Direct imports from this file are discouraged - use @/lib/e2ee instead.
 * 
 * Security Properties (from canonical lib/e2ee.ts):
 * - AES-GCM with 256-bit keys for authenticated encryption
 * - PBKDF2 with 150,000-600,000 iterations for key derivation
 * - Additional key stretching with multiple derivation rounds
 * - Random 16-byte salt per operation
 * - Master key stored encrypted in backend (never in plaintext)
 * - Decrypted key kept only in memory (never persisted)
 * - Support for Argon2id-style memory-hard derivation (via WebCrypto fallback)
 * - Post-quantum ready key encapsulation
 */

export {
  isEncryptionAvailable,
  generateRandomBytes,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  deriveKeyFromPassword,
  deriveKeyWithStretching,
  generateMasterKey,
  exportKey,
  importKey,
  encryptMasterKey,
  decryptMasterKey,
  generateRecoveryPhrase,
  deriveKeyFromRecoveryPhrase,
  createRecoveryData,
  recoverMasterKeyFromPhrase,
  encryptData,
  decryptData,
  hasMasterKey,
  setMasterKey,
  onVaultUnlock,
  getMasterKey,
  clearMasterKey,
  verifyPassword,
  setupMasterKey,
  unlockWithMasterKey,
  getKeyDerivationParams,
  clearKeyDerivationParams,
  deriveSubkey,
  hashData,
  verifyKeyIntegrity,
  createKeyBackup,
  restoreKeyFromBackup,
} from "@/lib/e2ee";

export type {
  EncryptedPayload,
  MasterKeyStorage,
  RecoveryKeyData,
  KeyDerivationParams,
  EncryptedEventData,
  EncryptedSystemData,
  EncryptedMemoryData,
} from "@/lib/e2ee";