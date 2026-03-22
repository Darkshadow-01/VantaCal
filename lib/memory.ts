import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id, Doc } from "../convex/_generated/dataModel";

export type { Id, Doc };

export type MemoryType = "episodic" | "semantic" | "procedural";
export type System = "Health" | "Work" | "Relationships";
export type PatternType = "time" | "frequency" | "conflict" | "system_balance";
export type HabitOutcome = "completed" | "missed" | "rescheduled";

export interface Memory {
  _id: Id<"memories">;
  _creationTime: number;
  userId: string;
  type: MemoryType;
  category: string;
  content: string;
  embedding?: number[];
  metadata?: {
    system?: System;
    eventId?: string;
    confidence?: number;
    source?: string;
    tags?: string[];
  };
  importance: number;
  accessCount: number;
  lastAccessed: number;
  createdAt: number;
  updatedAt: number;
}

export interface HabitTrack {
  _id: Id<"habit_tracks">;
  _creationTime: number;
  userId: string;
  habit: string;
  system: System;
  completedDates: string[];
  streak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number;
  lastCompleted?: number;
  createdAt: number;
}

export interface MissedTask {
  _id: Id<"missed_tasks">;
  _creationTime: number;
  userId: string;
  eventId: string;
  eventTitle: string;
  system: System;
  missedAt: number;
  reason?: string;
  wasRescheduled: boolean;
  frequency?: number;
}

export interface Pattern {
  _id: Id<"patterns">;
  _creationTime: number;
  userId: string;
  patternType: PatternType;
  description: string;
  frequency: number;
  system?: System;
  insight: string;
  confidence: number;
  actionableSteps: string[];
  createdAt: number;
  updatedAt: number;
}

export function useMemories(
  userId: string,
  type?: MemoryType,
  category?: string,
  limit?: number
): Memory[] | undefined {
  return useQuery((api as any)["memory/index"].getMemories, {
    userId,
    type,
    category,
    limit,
  }) as Memory[] | undefined;
}

export function useMissedTasks(
  userId: string,
  system?: System,
  limit?: number
): (MissedTask & { frequency: number })[] | undefined {
  return useQuery((api as any)["memory/index"].getMissedTasks, {
    userId,
    system,
    limit,
  }) as (MissedTask & { frequency: number })[] | undefined;
}

export function useHabitTrends(
  userId: string,
  system?: System
): HabitTrack[] | undefined {
  return useQuery((api as any)["memory/index"].getHabitTrends, {
    userId,
    system,
  }) as HabitTrack[] | undefined;
}

export function usePatterns(
  userId: string,
  patternType?: PatternType,
  minConfidence?: number
): Pattern[] | undefined {
  return useQuery((api as any)["memory/index"].getPatterns, {
    userId,
    patternType,
    minConfidence,
  }) as Pattern[] | undefined;
}

export function useStoreMemory() {
  return useMutation((api as any)["memory/index"].storeMemory);
}

export function useStoreEpisodicEvent() {
  return useMutation((api as any)["memory/index"].storeEpisodicEvent);
}

export function useStorePattern() {
  return useMutation((api as any)["memory/index"].storePattern);
}

export function useUpdateHabitTrack() {
  return useMutation((api as any)["memory/index"].updateHabitTrack);
}
