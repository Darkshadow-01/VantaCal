import { offlineStorage } from "./offline-storage";

export type WebhookEventType = 
  | "event.created" 
  | "event.updated" 
  | "event.deleted" 
  | "event.completed"
  | "calendar.created"
  | "calendar.updated"
  | "calendar.deleted";

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEventType[];
  secret: string;
  active: boolean;
  createdAt: number;
}

interface WebhookPayload {
  event: WebhookEventType;
  timestamp: number;
  data: any;
}

class WebhookService {
  private webhooks: Map<string, Webhook> = new Map();
  private initialized = false;

  private ensureClientSide(): boolean {
    if (typeof window === "undefined") return false;
    if (!this.initialized) {
      this.loadWebhooks();
      this.initialized = true;
    }
    return true;
  }

  private async loadWebhooks(): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("vancal-webhooks");
      if (stored) {
        const parsed = JSON.parse(stored) as Webhook[];
        parsed.forEach(w => this.webhooks.set(w.id, w));
      }
    } catch (error) {
      console.error("Failed to load webhooks:", error);
    }
  }

  private saveWebhooks(): void {
    if (typeof window === "undefined") return;
    try {
      const data = Array.from(this.webhooks.values());
      localStorage.setItem("vancal-webhooks", JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save webhooks:", error);
    }
  }

  async registerWebhook(
    url: string,
    events: WebhookEventType[],
    secret?: string
  ): Promise<Webhook> {
    const webhook: Webhook = {
      id: `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      events,
      secret: secret || this.generateSecret(),
      active: true,
      createdAt: Date.now(),
    };

    this.webhooks.set(webhook.id, webhook);
    this.saveWebhooks();

    return webhook;
  }

  async removeWebhook(id: string): Promise<boolean> {
    const deleted = this.webhooks.delete(id);
    if (deleted) {
      this.saveWebhooks();
    }
    return deleted;
  }

  async getWebhooks(): Promise<Webhook[]> {
    return Array.from(this.webhooks.values());
  }

  async getWebhook(id: string): Promise<Webhook | undefined> {
    return this.webhooks.get(id);
  }

  async updateWebhook(
    id: string,
    updates: Partial<Omit<Webhook, "id" | "createdAt">>
  ): Promise<Webhook | null> {
    const webhook = this.webhooks.get(id);
    if (!webhook) return null;

    const updated = { ...webhook, ...updates };
    this.webhooks.set(id, updated);
    this.saveWebhooks();

    return updated;
  }

  async testWebhook(id: string): Promise<{ success: boolean; message: string }> {
    const webhook = this.webhooks.get(id);
    if (!webhook) {
      return { success: false, message: "Webhook not found" };
    }

    const payload: WebhookPayload = {
      event: "event.created",
      timestamp: Date.now(),
      data: { test: true, message: "This is a test webhook" },
    };

    try {
      const response = await this.dispatchWebhook(webhook, payload);
      return { success: response.ok, message: response.ok ? "Test successful" : "Test failed" };
    } catch (error) {
      return { success: false, message: `Error: ${error}` };
    }
  }

  async dispatch(eventType: WebhookEventType, data: any): Promise<void> {
    const payload: WebhookPayload = {
      event: eventType,
      timestamp: Date.now(),
      data,
    };

    const promises = Array.from(this.webhooks.values())
      .filter(w => w.active && w.events.includes(eventType))
      .map(w => this.dispatchWebhook(w, payload));

    await Promise.allSettled(promises);
  }

  private async dispatchWebhook(
    webhook: Webhook,
    payload: WebhookPayload
  ): Promise<Response> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Webhook-Event": payload.event,
      "X-Webhook-Timestamp": String(payload.timestamp),
    };

    if (webhook.secret) {
      headers["X-Webhook-Signature"] = this.generateSignature(payload, webhook.secret);
    }

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      return response;
    } catch (error) {
      console.error(`Webhook delivery failed for ${webhook.url}:`, error);
      throw error;
    }
  }

  private generateSecret(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let secret = "whsec_";
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  private generateSignature(payload: WebhookPayload, secret: string): string {
    const data = JSON.stringify(payload);
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(data);
    
    let hash = 0;
    for (let i = 0; i < messageData.length; i++) {
      hash = ((hash << 5) - hash) + messageData[i];
      hash = hash & hash;
    }
    
    return `sha256=${Math.abs(hash).toString(16)}`;
  }
}

export const webhookService = new WebhookService();
