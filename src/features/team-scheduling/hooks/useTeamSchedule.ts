/**
 * useTeamSchedule Hook
 * Provides team scheduling data and actions
 */

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface UseTeamScheduleOptions {
  workspaceId: Id<"workspaces"> | null;
}

export function useTeamSchedule({ workspaceId }: UseTeamScheduleOptions) {
  // Fetch team members
  const teamMembers = useQuery(
    api.teamSchedules.getTeamMembers,
    workspaceId ? { workspaceId } : "skip"
  );

  // Fetch team preferences
  const teamPreferences = useQuery(
    api.teamSchedules.getTeamPreferences,
    workspaceId ? { workspaceId } : "skip"
  );

  // Get current user's schedule
  const currentUserSchedule = useQuery(
    api.teamSchedules.getOrCreate,
    workspaceId && teamMembers?.length
      ? { userId: teamMembers.find(m => m.role === "owner")?.userId || "", workspaceId }
      : "skip"
  );

  return {
    teamMembers: teamMembers || [],
    teamPreferences: teamPreferences || [],
    currentUserSchedule,
    isLoading: !teamMembers || !teamPreferences,
  };
}
