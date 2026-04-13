"use client";

import { useState, useCallback } from "react";
import {
  createAccessRule,
  updateAccessRule,
  deleteAccessRule,
  getAccessRules,
  getPrincipalAccess,
  checkAccess,
  type AccessLevel,
  type AccessRule,
} from "@/lib/access-control";
import {
  createCalendarLink,
  getCalendarLink,
  deleteCalendarLink,
  getAllLinksForCalendar,
  type CalendarLinkConfig,
  type PublicCalendarLink,
} from "@/lib/calendar-link";
import {
  createCalendarShareInvite,
  type CalendarShareInvite,
} from "@/lib/sharing-invite";

export interface CalendarMember {
  id: string;
  email: string;
  name?: string;
  accessLevel: AccessLevel;
  joinedAt?: number;
  status: "pending" | "active";
}

export interface UseCalendarSharingReturn {
  members: CalendarMember[];
  links: CalendarLinkConfig[];
  invites: CalendarShareInvite[];
  isLoading: boolean;
  error: string | null;
  addMember: (email: string, accessLevel: AccessLevel) => Promise<void>;
  updateMember: (memberId: string, accessLevel: AccessLevel) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  createLink: (options?: {
    accessLevel?: "read" | "read-write";
    expiresAt?: number;
    maxUses?: number;
    title?: string;
    password?: string;
  }) => Promise<PublicCalendarLink>;
  removeLink: (linkKey: string) => Promise<void>;
  sendInvite: (
    inviteeEmail: string,
    inviteePublicKey: string,
    accessLevel: AccessLevel,
    calendarKey: CryptoKey
  ) => Promise<CalendarShareInvite>;
  hasPermission: (requiredLevel: AccessLevel) => boolean;
}

export function useCalendarSharing(
  calendarId: string,
  currentUserId: string,
  currentAccessLevel: AccessLevel = "read"
): UseCalendarSharingReturn {
  const [members, setMembers] = useState<CalendarMember[]>([]);
  const [links, setLinks] = useState<CalendarLinkConfig[]>([]);
  const [invites, setInvites] = useState<CalendarShareInvite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMember = useCallback(
    async (email: string, accessLevel: AccessLevel) => {
      setIsLoading(true);
      setError(null);
      try {
        createAccessRule(calendarId, email, "user", accessLevel, currentUserId);
        setMembers((prev) => [
          ...prev,
          { id: email, email, accessLevel, status: "active" },
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add member");
      } finally {
        setIsLoading(false);
      }
    },
    [calendarId, currentUserId]
  );

  const updateMember = useCallback(
    async (memberId: string, accessLevel: AccessLevel) => {
      setIsLoading(true);
      setError(null);
      try {
        updateAccessRule(calendarId, memberId, accessLevel);
        setMembers((prev) =>
          prev.map((m) =>
            m.id === memberId ? { ...m, accessLevel } : m
          )
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update member");
      } finally {
        setIsLoading(false);
      }
    },
    [calendarId]
  );

  const removeMember = useCallback(
    async (memberId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        deleteAccessRule(calendarId, memberId);
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to remove member");
      } finally {
        setIsLoading(false);
      }
    },
    [calendarId]
  );

  const createLink = useCallback(
    async (options?: {
      accessLevel?: "read" | "read-write";
      expiresAt?: number;
      maxUses?: number;
      title?: string;
      password?: string;
    }): Promise<PublicCalendarLink> => {
      setIsLoading(true);
      setError(null);
      try {
        const link = await createCalendarLink(
          calendarId,
          options?.accessLevel || "read",
          currentUserId,
          options
        );
        setLinks((prev) => [...prev, link.config]);
        return link;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create link");
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [calendarId, currentUserId]
  );

  const removeLink = useCallback(
    async (linkKey: string) => {
      setIsLoading(true);
      setError(null);
      try {
        deleteCalendarLink(linkKey);
        setLinks((prev) => prev.filter((l) => l.linkKey !== linkKey));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to remove link");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const sendInvite = useCallback(
    async (
      inviteeEmail: string,
      inviteePublicKey: string,
      accessLevel: AccessLevel,
      calendarKey: CryptoKey
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const _calendarKey = {
          id: calendarId,
          key: calendarKey,
          createdAt: Date.now(),
          version: 1,
        };
        const invite = await createCalendarShareInvite(
          calendarId,
          currentUserId,
          inviteeEmail,
          inviteePublicKey,
          accessLevel as "read" | "write" | "admin",
          _calendarKey
        );
        setInvites((prev) => [...prev, invite]);
        return invite;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to send invite");
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [calendarId, currentUserId]
  );

  const hasPermission = useCallback(
    (requiredLevel: AccessLevel): boolean => {
      const decision = checkAccess(calendarId, currentUserId, requiredLevel);
      return decision.allowed;
    },
    [calendarId, currentUserId]
  );

  return {
    members,
    links,
    invites,
    isLoading,
    error,
    addMember,
    updateMember,
    removeMember,
    createLink,
    removeLink,
    sendInvite,
    hasPermission,
  };
}