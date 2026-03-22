import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id, Doc } from "../convex/_generated/dataModel";

export type { Id, Doc };

export function useEvents(userId?: string | null): Doc<"events">[] | undefined {
  return useQuery(api.events.index.getEvents, userId ? { userId } : "skip") as Doc<"events">[] | undefined;
}

export function useEventById(eventId: Id<"events">): Doc<"events"> | null | undefined {
  return useQuery(api.events.index.getEventById, { eventId }) as Doc<"events"> | null | undefined;
}

export function useCreateEvent() {
  return useMutation(api.events.index.createEvent);
}

export function useUpdateEvent() {
  return useMutation(api.events.index.updateEvent);
}

export function useDeleteEvent() {
  return useMutation(api.events.index.deleteEvent);
}

export function useSystems(userId?: string): Doc<"systems">[] | undefined {
  return useQuery(api.systems.index.getSystems, { userId }) as Doc<"systems">[] | undefined;
}

export function useCreateSystem() {
  return useMutation(api.systems.index.createSystem);
}

export function useUser(userId: string): Doc<"users"> | null | undefined {
  return useQuery(api.users.index.getUser, { userId }) as Doc<"users"> | null | undefined;
}

export function useCreateUser() {
  return useMutation(api.users.index.createUser);
}

export function useUpdateUser() {
  return useMutation(api.users.index.updateUser);
}

export { usePrivacyState, useEncryptedEvents, useOfflineSync } from "./encryptedHooks";
export { encryptedLocalStorage } from "./localStorage";
export { encrypt, decrypt } from "./encryption";
