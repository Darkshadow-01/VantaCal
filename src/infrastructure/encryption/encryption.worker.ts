const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const ITERATIONS = 150000;

function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

async function generateRandomBytes(length: number): Promise<Uint8Array> {
  return crypto.getRandomValues(new Uint8Array(length));
}

async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array | ArrayBuffer,
  iterations: number
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const saltBuffer = salt instanceof Uint8Array ? salt.buffer as ArrayBuffer : salt;

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: iterations,
      hash: "SHA-512",
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encrypt(data: object, key?: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  const jsonString = JSON.stringify(data);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(jsonString);

  const iv = await generateRandomBytes(IV_LENGTH);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
    key!,
    dataBuffer
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv),
  };
}

async function decrypt(
  ciphertext: string,
  iv: string,
  key?: CryptoKey
): Promise<object> {
  const ciphertextBytes = base64ToArrayBuffer(ciphertext);
  const ivBytes = base64ToArrayBuffer(iv);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: ivBytes },
    key!,
    ciphertextBytes
  );

  const decoder = new TextDecoder();
  const jsonString = decoder.decode(decrypted);

  return JSON.parse(jsonString);
}

let masterKey: CryptoKey | null = null;

self.onmessage = async (e: MessageEvent) => {
  const { type, payload, id } = e.data;

  try {
    if (type === "SET_KEY") {
      const { exportedKey, keyData } = payload;
      
      if (keyData) {
        const salt = base64ToArrayBuffer(keyData.salt);
        masterKey = await deriveKeyFromPassword(keyData.password, salt, keyData.iterations || ITERATIONS);
      } else if (exportedKey) {
        const keyBuffer = base64ToArrayBuffer(exportedKey);
        masterKey = await crypto.subtle.importKey(
          "raw",
          keyBuffer,
          { name: ALGORITHM, length: KEY_LENGTH },
          false,
          ["encrypt", "decrypt"]
        );
      }
      
      self.postMessage({ type: "KEY_SET", id, success: true });
      return;
    }

    if (type === "ENCRYPT") {
      if (!masterKey) {
        throw new Error("No encryption key available");
      }
      const result = await encrypt(payload, masterKey);
      self.postMessage({ type: "ENCRYPTED", id, result });
      return;
    }

    if (type === "DECRYPT") {
      if (!masterKey) {
        throw new Error("No encryption key available");
      }
      const { ciphertext, iv } = payload;
      const result = await decrypt(ciphertext, iv, masterKey);
      self.postMessage({ type: "DECRYPTED", id, result });
      return;
    }

    if (type === "ENCRYPT_STRING") {
      if (!masterKey) {
        throw new Error("No encryption key available");
      }
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(payload.data);
      const iv = await generateRandomBytes(IV_LENGTH);
      
      const ciphertext = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
        masterKey,
        dataBuffer
      );
      
      self.postMessage({ 
        type: "ENCRYPTED_STRING", 
        id, 
        result: { 
          encrypted: arrayBufferToBase64(ciphertext),
          iv: arrayBufferToBase64(iv)
        }
      });
      return;
    }

    if (type === "DECRYPT_STRING") {
      if (!masterKey) {
        throw new Error("No encryption key available");
      }
      const { encrypted, iv } = payload;
      const encryptedBytes = base64ToArrayBuffer(encrypted);
      const ivBytes = base64ToArrayBuffer(iv);
      
      const decrypted = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv: ivBytes },
        masterKey,
        encryptedBytes
      );
      
      const decoder = new TextDecoder();
      self.postMessage({ type: "DECRYPTED_STRING", id, result: decoder.decode(decrypted) });
      return;
    }

    if (type === "EXPORT_KEY") {
      if (!masterKey) {
        throw new Error("No encryption key available");
      }
      const exported = await crypto.subtle.exportKey("raw", masterKey);
      self.postMessage({ type: "KEY_EXPORTED", id, result: arrayBufferToBase64(exported) });
      return;
    }

    if (type === "CLEAR_KEY") {
      masterKey = null;
      self.postMessage({ type: "KEY_CLEARED", id, success: true });
      return;
    }
  } catch (error) {
    self.postMessage({ 
      type: "ERROR", 
      id, 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
};

export {};