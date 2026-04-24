"use client";

import { useState, useCallback } from "react";
import { Plus, Users } from "lucide-react";
import { ScheduleTeamModal } from "./ScheduleTeamModal";
import type { Id } from "@/convex/_generated/dataModel";
import type { CalendarEvent } from "@/lib/types";

interface ScheduleTeamButtonProps {
  workspaceId: Id<"workspaces">;
  currentUserId: string;
  existingEvents: CalendarEvent[];
}

export function ScheduleTeamButton({
  workspaceId,
  currentUserId,
  existingEvents,
}: ScheduleTeamButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-3 px-5 py-3.5 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-[var(--accent-contrast)] font-medium rounded-full shadow-lg hover:shadow-xl transition-all hover-lift group"
        style={{
          boxShadow: "var(--accent-glow)",
        }}
      >
        <Users className="w-5 h-5" />
        <span className="overflow-hidden max-w-0 group-hover:max-w-[120px] transition-all duration-300 whitespace-nowrap">
          Schedule Team
        </span>
      </button>

      <ScheduleTeamModal
        isOpen={isModalOpen}
        onClose={handleClose}
        workspaceId={workspaceId}
        currentUserId={currentUserId}
        existingEvents={existingEvents}
      />
    </>
  );
}
