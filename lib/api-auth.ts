import { NextRequest, NextResponse } from "next/server";

const API_KEY_HEADER = "x-api-key";
const API_KEYS_STORAGE_KEY = "vancal-api-keys";

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: ApiKeyPermission[];
  createdAt: number;
  lastUsed?: number;
}

export type ApiKeyPermission = 
  | "events:read" 
  | "events:write" 
  | "events:delete"
  | "calendars:read"
  | "calendars:write"
  | "webhooks:read"
  | "webhooks:write"
  | "admin";

class ApiKeyService {
  private keys: Map<string, ApiKey> = new Map();
  private initialized = false;

  private ensureClientSide(): boolean {
    if (typeof window === "undefined") return false;
    if (!this.initialized) {
      this.loadKeys();
      this.initialized = true;
    }
    return true;
  }

  private loadKeys(): void {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(API_KEYS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ApiKey[];
        parsed.forEach(k => this.keys.set(k.key, k));
      }
    } catch (error) {
      console.error("Failed to load API keys:", error);
    }
  }

  private saveKeys(): void {
    if (typeof window === "undefined") return;
    try {
      const data = Array.from(this.keys.values());
      localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save API keys:", error);
    }
  }

  createKey(name: string, permissions: ApiKeyPermission[]): ApiKey {
    const id = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const key = `vancal_${this.generateKey()}`;
    
    const apiKey: ApiKey = {
      id,
      name,
      key,
      permissions,
      createdAt: Date.now(),
    };

    this.keys.set(key, apiKey);
    this.saveKeys();

    return apiKey;
  }

  revokeKey(key: string): boolean {
    const deleted = this.keys.delete(key);
    if (deleted) {
      this.saveKeys();
    }
    return deleted;
  }

  validateKey(key: string): ApiKey | null {
    const apiKey = this.keys.get(key);
    if (!apiKey) return null;

    apiKey.lastUsed = Date.now();
    this.saveKeys();

    return apiKey;
  }

  hasPermission(key: string, permission: string): boolean {
    const apiKey = this.keys.get(key);
    if (!apiKey) return false;
    if (apiKey.permissions.includes("admin" as ApiKeyPermission)) return true;
    return apiKey.permissions.includes(permission as ApiKeyPermission);
  }

  getAllKeys(): Omit<ApiKey, "key">[] {
    return Array.from(this.keys.values()).map(({ key, ...rest }) => rest);
  }

  private generateKey(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

export const apiKeyService = new ApiKeyService();

export async function withApiKeyAuth(
  request: NextRequest,
  requiredPermission?: string
): Promise<{ authorized: boolean; apiKey?: ApiKey; error?: NextResponse }> {
  const apiKey = request.headers.get(API_KEY_HEADER);

  if (!apiKey) {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: `Missing ${API_KEY_HEADER} header` },
        { status: 401 }
      ),
    };
  }

  const validKey = apiKeyService.validateKey(apiKey);
  if (!validKey) {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      ),
    };
  }

  if (requiredPermission && !apiKeyService.hasPermission(apiKey, requiredPermission)) {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, apiKey: validKey };
}
