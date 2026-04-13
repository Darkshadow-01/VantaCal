"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { SharedCalendar, CalendarInvitation, CreateCalendarInput, InviteToCalendarInput } from "../model/types";

export function useSharedCalendars(userId: string | null | undefined) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sharedCalendars = useQuery(
    api.sharedCalendars.index.getSharedCalendars,
    userId ? { userId } : "skip"
  );

  const createCalendar = useMutation(api.sharedCalendars.index.createSharedCalendar);
  const updateCalendar = useMutation(api.sharedCalendars.index.updateSharedCalendar);
  const deleteCalendar = useMutation(api.sharedCalendars.index.deleteSharedCalendar);
  const inviteToCalendar = useMutation(api.sharedCalendars.index.inviteToCalendar);
  const respondToInvitation = useMutation(api.sharedCalendars.index.respondToInvitation);
  const removeUserFromCalendar = useMutation(api.sharedCalendars.index.removeUserFromCalendar);
  const updateUserPermission = useMutation(api.sharedCalendars.index.updateUserPermission);

  const create = useCallback(async (input: CreateCalendarInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await createCalendar(input);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create calendar");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [createCalendar]);

  const update = useCallback(async (calendarId: string, updates: { name?: string; color?: string; description?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      await updateCalendar({ calendarId: calendarId as Id<"shared_calendars">, ...updates });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update calendar");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [updateCalendar]);

  const deleteCalendarById = useCallback(async (calendarId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteCalendar({ calendarId: calendarId as Id<"shared_calendars"> });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete calendar");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [deleteCalendar]);

  const invite = useCallback(async (input: InviteToCalendarInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await inviteToCalendar({
        calendarId: input.calendarId as Id<"shared_calendars">,
        email: input.email,
        permission: input.permission,
        invitedBy: input.invitedBy,
      });
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [inviteToCalendar]);

  const acceptInvitation = useCallback(async (invitationId: string, userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await respondToInvitation({ 
        invitationId: invitationId as Id<"calendar_invitations">, 
        userId, 
        response: "accepted" 
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invitation");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [respondToInvitation]);

  const declineInvitation = useCallback(async (invitationId: string, userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await respondToInvitation({ 
        invitationId: invitationId as Id<"calendar_invitations">, 
        userId, 
        response: "declined" 
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decline invitation");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [respondToInvitation]);

  const removeMember = useCallback(async (calendarId: string, memberUserId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await removeUserFromCalendar({ 
        calendarId: calendarId as Id<"shared_calendars">, 
        userId: memberUserId 
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [removeUserFromCalendar]);

  const changePermission = useCallback(async (calendarId: string, memberUserId: string, permission: "view" | "edit" | "admin") => {
    setIsLoading(true);
    setError(null);
    try {
      await updateUserPermission({ 
        calendarId: calendarId as Id<"shared_calendars">, 
        userId: memberUserId, 
        permission 
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update permission");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [updateUserPermission]);

  return {
    calendars: sharedCalendars as SharedCalendar[] | undefined,
    isLoading,
    error,
    create,
    update: update,
    deleteCalendar: deleteCalendarById,
    invite,
    acceptInvitation,
    declineInvitation,
    removeMember,
    changePermission,
  };
}

export function useCalendarInvitations(email: string | null | undefined) {
  const invitations = useQuery(
    api.sharedCalendars.index.getUserInvitations,
    email ? { email } : "skip"
  );

  return {
    invitations: invitations as CalendarInvitation[] | undefined,
  };
}

export function useCalendarMembers(calendarId: string | null | undefined) {
  const members = useQuery(
    api.sharedCalendars.index.getCalendarMembers,
    calendarId ? { calendarId: calendarId as Id<"shared_calendars"> } : "skip"
  );

  return {
    members,
  };
}

export function useCanAccessCalendar(calendarId: string | null | undefined, userId: string | null | undefined) {
  const access = useQuery(
    api.sharedCalendars.index.canUserAccessCalendar,
    (calendarId && userId) ? { 
      calendarId: calendarId as Id<"shared_calendars">, 
      userId 
    } : "skip"
  );

  return {
    canAccess: access?.allowed ?? false,
    permission: access?.permission ?? null,
  };
}