import { hasMasterKey, getMasterKey, setMasterKey as setE2EEMasterKey, exportKey as exportE2EEKey, deriveKeyFromPassword as deriveE2EEKey } from "@/lib/e2ee";

let worker: Worker | null = null;
let messageId = 0;
const pendingRequests = new Map<number, { resolve: (value: unknown) => void; reject: (reason: unknown) => void }>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./encryption.worker.ts", import.meta.url));
    
    worker.onmessage = (e: MessageEvent) => {
      const { type, id, result, error, success } = e.data;
      const pending = pendingRequests.get(id);
      if (!pending) return;

      if (type === "ERROR") {
        pending.reject(new Error(error));
      } else if (type === "ENCRYPTED" || type === "DECRYPTED" || type === "ENCRYPTED_STRING" || type === "DECRYPTED_STRING") {
        pending.resolve(result);
      } else if (type === "KEY_SET" || type === "KEY_CLEARED") {
        pending.resolve(success);
      } else if (type === "KEY_EXPORTED") {
        pending.resolve(result);
      }
      
      pendingRequests.delete(id);
    };
    
    worker.onerror = (error) => {
      console.error("Encryption worker crashed:", error);
      worker = null;
    };
  }
  return worker;
}

function sendMessage<T>(type: string, payload?: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = ++messageId;
    pendingRequests.set(id, { resolve: resolve as (value: unknown) => void, reject });
    
    let worker: Worker;
    try {
      worker = getWorker();
    } catch (workerError) {
      pendingRequests.delete(id);
      reject(new Error("Encryption service unavailable"));
      return;
    }
    
    worker.postMessage({ type, payload, id });
    
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error("Encryption operation timed out"));
      }
    }, 30000);
  });
}

export async function setEncryptionKey(password?: string, iterations?: number): Promise<boolean> {
  if (!hasMasterKey()) {
    return false;
  }

  const masterKey = getMasterKey();
  if (!masterKey) {
    return false;
  }

  try {
    const exported = await exportE2EEKey(masterKey);
    await sendMessage("SET_KEY", { exportedKey: exported });
    return true;
  } catch {
    if (password) {
      await sendMessage("SET_KEY", { keyData: { password, iterations: iterations || 150000 } });
      return true;
    }
    return false;
  }
}

export async function encryptAsync(data: object): Promise<{ ciphertext: string; iv: string }> {
  return sendMessage("ENCRYPT", data);
}

export async function decryptAsync<T = object>(payload: { ciphertext: string; iv: string }): Promise<T> {
  return sendMessage("DECRYPT", payload) as Promise<T>;
}

export async function encryptStringAsync(data: string): Promise<{ encrypted: string; iv: string }> {
  return sendMessage("ENCRYPT_STRING", { data });
}

export async function decryptStringAsync(payload: { encrypted: string; iv: string }): Promise<string> {
  return sendMessage("DECRYPT_STRING", payload);
}

export async function exportEncryptionKeyAsync(): Promise<string | null> {
  try {
    return await sendMessage("EXPORT_KEY");
  } catch {
    return null;
  }
}

export async function clearEncryptionKeyAsync(): Promise<void> {
  await sendMessage("CLEAR_KEY");
}

export function hasEncryptionWorkerKey(): boolean {
  return worker !== null;
}

export function hasEncryptionKey(): boolean {
  return hasMasterKey();
}

type UnlockCallback = () => void | Promise<void>;
let unlockCallbacks: UnlockCallback[] = [];

export function onVaultUnlock(callback: UnlockCallback): () => void {
  unlockCallbacks.push(callback);
  return () => {
    unlockCallbacks = unlockCallbacks.filter(cb => cb !== callback);
  };
}

export async function notifyVaultUnlocked(): Promise<void> {
  for (const callback of unlockCallbacks) {
    try {
      await callback();
    } catch (error) {
      console.error("Vault unlock callback error:", error);
    }
  }
}