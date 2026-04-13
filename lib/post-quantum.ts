/**
 * Post-Quantum Key Encapsulation
 * Placeholder for future Kyber integration
 * 
 * Currently provides classical ECDH with hybrid key derivation.
 * When Kyber libraries become available for WebCrypto, this can be updated.
 * 
 * Architecture:
 * - ECDH P-256 for classical key agreement
 * - SHA-256 based key derivation for hybrid security
 * - Future: Replace with liboqs or similar for actual Kyber
 */

import { generateRandomBytes, arrayBufferToBase64, base64ToArrayBuffer } from "./e2ee";

export interface PQKeyPair {
  publicKey: ArrayBuffer;
  privateKey: ArrayBuffer;
}

export interface KeyEncapsulation {
  ciphertext: ArrayBuffer;
  sharedSecret: ArrayBuffer;
}

export interface PQKeyMaterial {
  keyPair: PQKeyPair;
  publicKeyString: string;
  createdAt: number;
  expiresAt: number;
  algorithm: "ecdh" | "kyber-ready";
}

let currentPQKeys: PQKeyMaterial | null = null;

export function isPostQuantumAvailable(): boolean {
  return typeof crypto !== "undefined" && crypto.subtle !== undefined;
}

export async function generatePQKeyPair(): Promise<PQKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  const [publicKey, privateKey] = await Promise.all([
    crypto.subtle.exportKey("spki", keyPair.publicKey),
    crypto.subtle.exportKey("pkcs8", keyPair.privateKey)
  ]);

  return { publicKey, privateKey };
}

export async function encapsulate(
  recipientPublicKey: ArrayBuffer
): Promise<KeyEncapsulation> {
  const ephemeral = await generatePQKeyPair();
  
  const recipientKey = await crypto.subtle.importKey(
    "spki",
    recipientPublicKey,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );

  const privateKeyObj = await crypto.subtle.importKey(
    "pkcs8",
    ephemeral.privateKey,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveBits"]
  );

  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: recipientKey },
    privateKeyObj,
    256
  );

  const saltKey = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(32).fill(0).buffer as ArrayBuffer,
    "HKDF",
    false,
    ["deriveBits"]
  );

  const derived = await crypto.subtle.deriveBits(
    { name: "HKDF", salt: new Uint8Array(0), info: new TextEncoder().encode("pq"), hash: "SHA-256" },
    saltKey,
    256
  );

  return {
    ciphertext: ephemeral.publicKey,
    sharedSecret: derived,
  };
}

export async function decapsulate(
  encapsulation: KeyEncapsulation,
  privateKey: ArrayBuffer,
  senderPublicKey: ArrayBuffer
): Promise<ArrayBuffer> {
  const senderKey = await crypto.subtle.importKey(
    "spki",
    senderPublicKey,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );

  const privKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKey,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveBits"]
  );

  return await crypto.subtle.deriveBits(
    { name: "ECDH", public: senderKey },
    privKey,
    256
  );
}

export async function initPQKeys(): Promise<PQKeyMaterial> {
  const keyPair = await generatePQKeyPair();
  const publicKeyString = arrayBufferToBase64(keyPair.publicKey);
  
  const now = Date.now();
  const ninetyDays = 90 * 24 * 60 * 60 * 1000;

  currentPQKeys = {
    keyPair,
    publicKeyString,
    createdAt: now,
    expiresAt: now + ninetyDays,
    algorithm: "kyber-ready",
  };

  return currentPQKeys;
}

export function getPQKeys(): PQKeyMaterial | null {
  return currentPQKeys;
}

export function clearPQKeys(): void {
  currentPQKeys = null;
}

export function getPQPublicKey(): string | null {
  return currentPQKeys?.publicKeyString || null;
}

export function isPQKeyExpired(): boolean {
  return currentPQKeys ? Date.now() > currentPQKeys.expiresAt : true;
}

export async function rotatePQKeys(): Promise<PQKeyMaterial> {
  return await initPQKeys();
}

export function shouldRotatePQKeys(): boolean {
  if (!currentPQKeys) return true;
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return Date.now() > (currentPQKeys.expiresAt - sevenDays);
}

export async function hybridEncrypt(
  data: ArrayBuffer,
  recipientPublicKey: ArrayBuffer
): Promise<{ ciphertext: string; iv: string }> {
  if (!currentPQKeys) {
    await initPQKeys();
  }

  const encapsulation = await encapsulate(recipientPublicKey);
  
  const keyBits = new Uint8Array(encapsulation.sharedSecret);
  const key = await crypto.subtle.importKey("raw", keyBits.buffer as ArrayBuffer, "AES-GCM", false, ["encrypt"]);
  
  const ivBytes = await generateRandomBytes(12);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: ivBytes.buffer as ArrayBuffer }, key, data);

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(ivBytes),
  };
}

export async function hybridDecrypt(
  ciphertext: string,
  iv: string,
  privateKey: ArrayBuffer,
  senderPublicKey: ArrayBuffer
): Promise<ArrayBuffer> {
  if (!currentPQKeys) {
    throw new Error("PQ keys not initialized");
  }

  const sharedSecret = await decapsulate(
    { ciphertext: currentPQKeys.keyPair.publicKey, sharedSecret: new ArrayBuffer(0) },
    privateKey,
    senderPublicKey
  );

  const keyBits = new Uint8Array(sharedSecret);
  const key = await crypto.subtle.importKey("raw", keyBits.buffer as ArrayBuffer, "AES-GCM", false, ["decrypt"]);
  
  const encrypted = base64ToArrayBuffer(ciphertext);
  const ivBuffer = base64ToArrayBuffer(iv);

  return await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivBuffer }, key, encrypted);
}

export function exportPQPublicKeyString(): string {
  if (!currentPQKeys) {
    throw new Error("PQ keys not initialized");
  }
  return currentPQKeys.publicKeyString;
}

export async function importPQPublicKeyString(key: string): Promise<ArrayBuffer> {
  return base64ToArrayBuffer(key);
}