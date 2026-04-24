"use client";

import { useState, useCallback } from "react";
import { X, Clock, Users, Check, AlertCircle, Sparkles } from "lucide-react";
import { useConvex, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { DURATION_OPTIONS, type TimeSlot, type ScheduleTeamFormData } from "@/src/features/team-scheduling/types/scheduling";
import { computeAvailableSlots, formatTimeSlot } from "@/src/features/team-scheduling/services/availabilityEngine";
import type { CalendarEvent } from "@/lib/types";

interface ScheduleTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: Id<"workspaces">;
  currentUserId: string;
  existingEvents: CalendarEvent[];
}

export function ScheduleTeamModal({
  isOpen,
  onClose,
  workspaceId,
  currentUserId,
  existingEvents,
}: ScheduleTeamModalProps) {
  const convex = useConvex();
  const [step, setStep] = useState<"form" | "slots" | "creating" | "done">("form");
  const [formData, setFormData] = useState<ScheduleTeamFormData>({
    title: "",
    attendeeIds: [],
    durationMinutes: 30,
  });
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch team members
  const teamMembers = useQuery(api.teamSchedules.getTeamMembers, { workspaceId });

  // Fetch team preferences
  const teamPreferences = useQuery(api.teamSchedules.getTeamPreferences, { workspaceId });

  const handleFindSlots = useCallback(async () => {
    if (!formData.title.trim()) {
      setError("Please enter a meeting title");
      return;
    }
    if (formData.attendeeIds.length === 0) {
      setError("Please select at least one attendee");
      return;
    }

    setStep("creating");
    setError(null);

    try {
      // Get preferences for all attendees
      const preferences = teamPreferences?.map(pref => ({
        userId: pref.userId,
        userName: pref.userName,
        workingHoursStart: pref.workingHoursStart,
        workingHoursEnd: pref.workingHoursEnd,
        workingDaysOfWeek: pref.workingDaysOfWeek,
        focusTimeEnabled: pref.focusTimeEnabled,
        focusTimeStart: pref.focusTimeStart || 0,
        focusTimeEnd: pref.focusTimeEnd || 0,
        timezone: "UTC",
      })) || [];

      // Compute available slots
      const slots = await computeAvailableSlots(existingEvents, preferences, {
        durationMinutes: formData.durationMinutes,
        searchWindowDays: 7,
        incrementMinutes: 30,
        respectWorkingHours: true,
        respectFocusTime: true,
        requireAllAttendees: false,
        ignorePartialConflicts: false,
      });

      setAvailableSlots(slots);
      setStep("slots");
    } catch (err) {
      console.error("Failed to find slots:", err);
      setError("Failed to find available times. Please try again.");
      setStep("form");
    }
  }, [formData, existingEvents, teamPreferences]);

  const handleSelectSlot = useCallback(async (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep("creating");

    try {
      // Create the meeting request
      const result = await convex.mutation(api.meetingRequests.create, {
        organizerId: currentUserId,
        workspaceId,
        title: formData.title,
        durationMinutes: formData.durationMinutes,
        scheduledStartTime: slot.startTime,
        scheduledEndTime: slot.endTime,
        attendeeIds: formData.attendeeIds,
        availabilityScore: slot.availabilityScore,
        wasOptimalSlot: slot.isOptimal,
      });

      // TODO: Create actual calendar events for all attendees

      setStep("done");
      setTimeout(() => {
        onClose();
        setStep("form");
        setFormData({ title: "", attendeeIds: [], durationMinutes: 30 });
        setSelectedSlot(null);
        setAvailableSlots([]);
      }, 1500);
    } catch (err) {
      console.error("Failed to create meeting:", err);
      setError("Failed to schedule meeting. Please try again.");
      setStep("slots");
    }
  }, [convex, currentUserId, workspaceId, formData, onClose]);

  const toggleAttendee = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      attendeeIds: prev.attendeeIds.includes(userId)
        ? prev.attendeeIds.filter(id => id !== userId)
        : [...prev.attendeeIds, userId],
    }));
  };

  const selectAllAttendees = () => {
    if (teamMembers && formData.attendeeIds.length < teamMembers.length) {
      setFormData(prev => ({
        ...prev,
        attendeeIds: teamMembers.map(m => m.userId),
      }));
    } else {
      setFormData(prev => ({ ...prev, attendeeIds: [] }));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={() => step !== "creating" && onClose()}
    >
      <div
        className="bg-[var(--bg-primary)] rounded-2xl w-full max-w-lg border border-[var(--border)] shadow-2xl overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: "80vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--accent)]/10">
              <Sparkles className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Schedule Team
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg-secondary)] rounded-full transition-colors"
            disabled={step === "creating"}
          >
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(80vh - 140px)" }}>
          {step === "form" && (
            <div className="space-y-6">
              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  What are we scheduling?
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Team Sync, Sprint Planning..."
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  autoFocus
                />
              </div>

              {/* Attendee Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Who?</label>
                  {teamMembers && (
                    <button
                      onClick={selectAllAttendees}
                      className="text-xs text-[var(--accent)] hover:underline"
                    >
                      {formData.attendeeIds.length === teamMembers.length ? "Deselect all" : "Select all"}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {teamMembers?.map(member => (
                    <button
                      key={member.userId}
                      onClick={() => toggleAttendee(member.userId)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        formData.attendeeIds.includes(member.userId)
                          ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm"
                          : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                      }`}
                    >
                      {member.name || member.email}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Selection */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[var(--text-primary)]">
                  <Clock className="w-4 h-4" />
                  <label className="text-sm font-medium">Duration</label>
                </div>
                <select
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) }))}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  {DURATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-[var(--danger)] bg-[var(--danger)]/10 px-4 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Find Times Button */}
              <button
                onClick={handleFindSlots}
                disabled={!formData.title || formData.attendeeIds.length === 0}
                className="w-full py-3 px-4 bg-[var(--accent)] hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed text-[var(--accent-contrast)] font-medium rounded-lg transition-colors shadow-sm"
              >
                Find Available Times
              </button>
            </div>
          )}

          {step === "slots" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Suggested Times
                </h3>
                <button
                  onClick={() => setStep("form")}
                  className="text-xs text-[var(--accent)] hover:underline"
                >
                  ← Back
                </button>
              </div>

              {availableSlots.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No available times found</p>
                  <p className="text-xs mt-1">Try adjusting your preferences</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={`${slot.startTime}-${index}`}
                      onClick={() => handleSelectSlot(slot)}
                      className="w-full p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-elevated)] transition-all text-left group hover-lift"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {slot.isOptimal && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--success)]/20 text-[var(--success)]">
                                <Check className="w-3 h-3" />
                                Best time
                              </span>
                            )}
                            <span className="text-sm font-medium text-[var(--text-primary)]">
                              {formatTimeSlot(slot)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {slot.availableMembers.length} available
                            </span>
                            {slot.conflictedMembers.length > 0 && (
                              <span className="flex items-center gap-1 text-[var(--warning)]">
                                <AlertCircle className="w-3 h-3" />
                                {slot.conflictedMembers.length} conflict
                                {slot.conflictedMembers.length > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs text-[var(--accent)] font-medium">Select →</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === "creating" && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-[var(--text-secondary)]">
                Scheduling meeting...
              </p>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-[var(--success)]/20 flex items-center justify-center mb-4 animate-scale-in">
                <Check className="w-8 h-8 text-[var(--success)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                Meeting Scheduled!
              </h3>
              <p className="text-sm text-[var(--text-muted)]">
                Invitations sent to {formData.attendeeIds.length} team members
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
