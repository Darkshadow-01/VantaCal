import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { SharedCalendar, CalendarInvitation, CalendarShare } from "../model/types";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export interface RealTimeUpdate {
  type: "event_created" | "event_updated" | "event_deleted" | "calendar_shared" | "member_added" | "member_removed";
  calendarId: string;
  userId: string;
  timestamp: number;
  data: unknown;
}

export interface CollaborationConfig {
  userId: string;
  userName: string;
  email: string;
  onUpdate?: (update: RealTimeUpdate) => void;
  onUserJoined?: (userId: string, userName: string) => void;
  onUserLeft?: (userId: string) => void;
}

class CollaborationService {
  private config: CollaborationConfig | null = null;
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  configure(config: CollaborationConfig): void {
    this.config = config;
  }

  connect(calendarId: string): void {
    if (!this.config || this.isConnected) return;

    const calendarToken = btoa(`${calendarId}_${this.config.userId}`);
    const url = `${process.env.NEXT_PUBLIC_CONVEX_URL?.replace("https://", "wss://").replace("http://", "ws://")}/collaboration/${calendarToken}`;

    try {
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log("[Collaboration] Connected to real-time updates");
      };

      this.eventSource.onmessage = (event) => {
        try {
          const update: RealTimeUpdate = JSON.parse(event.data);
          this.handleUpdate(update);
        } catch (err) {
          console.error("[Collaboration] Failed to parse update:", err);
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        this.handleReconnect(calendarId);
      };
    } catch (err) {
      console.error("[Collaboration] Failed to connect:", err);
    }
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
    this.config = null;
  }

  private handleReconnect(calendarId: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`[Collaboration] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(calendarId), delay);
    } else {
      console.error("[Collaboration] Max reconnection attempts reached");
    }
  }

  private handleUpdate(update: RealTimeUpdate): void {
    if (this.config?.onUpdate) {
      this.config.onUpdate(update);
    }

    const eventListeners = this.listeners.get(update.type);
    if (eventListeners) {
      eventListeners.forEach((listener) => listener(update.data));
    }
  }

  subscribe(eventType: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  async broadcastUpdate(calendarId: string, update: RealTimeUpdate): Promise<void> {
    try {
      await convex.mutation(api.collaboration.index.broadcastUpdate, {
        calendarId: calendarId as Id<"shared_calendars">,
        type: update.type,
        userId: update.userId,
        data: update.data,
      });
    } catch (err) {
      console.error("[Collaboration] Failed to broadcast update:", err);
    }
  }

  async getActiveUsers(calendarId: string): Promise<Array<{ userId: string; userName: string; lastSeen: number }>> {
    try {
      return await convex.query(api.collaboration.index.getActiveUsers, { 
        calendarId: calendarId as Id<"shared_calendars"> 
      }) as Array<{ userId: string; userName: string; lastSeen: number }>;
    } catch {
      return [];
    }
  }

  async updatePresence(calendarId: string, status: "active" | "idle" | "away"): Promise<void> {
    if (!this.config) return;

    try {
      await convex.mutation(api.collaboration.index.updatePresence, {
        calendarId: calendarId as Id<"shared_calendars">,
        userId: this.config.userId,
        userName: this.config.userName,
        status,
      });
    } catch (err) {
      console.error("[Collaboration] Failed to update presence:", err);
    }
  }

  isUserActive(userId: string): boolean {
    return true;
  }

  getConnectionStatus(): { connected: boolean; reconnectAttempt: number } {
    return {
      connected: this.isConnected,
      reconnectAttempt: this.reconnectAttempts,
    };
  }
}

export const collaborationService = new CollaborationService();

export function createShareLink(calendarId: string, permission: string = "view"): string {
  const token = btoa(`${calendarId}_${permission}_${Date.now()}`);
  return `${typeof window !== "undefined" ? window.location.origin : ""}/calendar/join/${token}`;
}

export async function parseShareLink(token: string): Promise<{ calendarId: string; permission: string } | null> {
  try {
    const decoded = atob(token);
    const [calendarId, permission] = decoded.split("_");
    return { calendarId, permission };
  } catch {
    return null;
  }
}