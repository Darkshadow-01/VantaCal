"use client";

import { useState, useEffect } from "react";
import { format, addHours } from "date-fns";
import { Sparkles, AlertTriangle } from "lucide-react";
import type { EventData } from "@/lib/use-encrypted-events";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SystemColors {
  bg: string;
  bgLight: string;
  border: string;
  text: string;
  hover: string;
}

interface EventFormData {
  title: string;
  description?: string;
  startTime: number;
  endTime: number;
  allDay: boolean;
  system: "Health" | "Work" | "Relationships";
  color?: string;
  recurrence?: string;
  location?: string;
}

interface EventModalProps {
  event?: EventData | null;
  selectedSlot?: { date: Date; hour?: number } | null;
  systemColors: Record<"Health" | "Work" | "Relationships", SystemColors>;
  onSave: (data: EventFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

export function EventModal({
  event,
  selectedSlot,
  systemColors,
  onSave,
  onDelete,
  onClose,
}: EventModalProps) {
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [system, setSystem] = useState<"Health" | "Work" | "Relationships">(
    (event?.system as "Health" | "Work" | "Relationships") || "Work"
  );
  const [allDay, setAllDay] = useState(event?.allDay || false);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState(event?.location || "");
  const [recurrence, setRecurrence] = useState<string>(event?.recurrence || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (event) {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      setStartDate(format(start, "yyyy-MM-dd"));
      setStartTime(format(start, "HH:mm"));
      setEndDate(format(end, "yyyy-MM-dd"));
      setEndTime(format(end, "HH:mm"));
    } else if (selectedSlot) {
      const start = selectedSlot.hour !== undefined
        ? new Date(selectedSlot.date.setHours(selectedSlot.hour, 0, 0, 0))
        : selectedSlot.date;
      const end = addHours(start, 1);
      setStartDate(format(start, "yyyy-MM-dd"));
      setStartTime(format(start, "HH:mm"));
      setEndDate(format(end, "yyyy-MM-dd"));
      setEndTime(format(end, "HH:mm"));
    }
  }, [event, selectedSlot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        startTime: new Date(`${startDate}T${startTime}`).getTime(),
        endTime: new Date(`${endDate}T${endTime}`).getTime(),
        allDay,
        system,
        location: location.trim() || undefined,
        recurrence: recurrence || undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsSaving(true);
    try {
      await onDelete();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {event ? "Edit Event" : "Create New Event"}
          </DialogTitle>
          {!event && (
            <DialogDescription className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-500" />
              AI will suggest optimal buffers
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              required
            />
          </div>

          {/* System Selection */}
          <div className="space-y-2">
            <Label>System *</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["Health", "Work", "Relationships"] as const).map((sys) => (
                <button
                  key={sys}
                  type="button"
                  onClick={() => setSystem(sys)}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all text-center",
                    system === sys
                      ? `${systemColors[sys].border} ${systemColors[sys].bgLight}`
                      : "border-input hover:border-muted-foreground/50"
                  )}
                >
                  <div className={cn("w-4 h-4 rounded-full mx-auto mb-1", systemColors[sys].bg)} />
                  <span className="text-sm font-medium">{sys}</span>
                </button>
              ))}
            </div>
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="allDay"
              checked={allDay}
              onCheckedChange={(checked) => setAllDay(checked as boolean)}
            />
            <Label htmlFor="allDay" className="font-normal">All day event</Label>
          </div>

          {/* Date/Time Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start {allDay ? "Date" : "Date & Time"}</Label>
              <div className="flex gap-2">
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="flex-1"
                />
                {!allDay && (
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-28"
                  />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End {allDay ? "Date" : "Date & Time"}</Label>
              <div className="flex gap-2">
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="flex-1"
                />
                {!allDay && (
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-28"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description"
              rows={3}
            />
          </div>

          {/* Recurrence */}
          <div className="space-y-2">
            <Label htmlFor="recurrence">Recurrence</Label>
            <Select value={recurrence} onValueChange={setRecurrence}>
              <SelectTrigger>
                <SelectValue placeholder="Does not repeat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Does not repeat</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* AI Buffer Suggestion */}
          {!event && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    AI Buffer Prediction
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    After creating this event, the Scheduler Agent will analyze your schedule and suggest optimal buffer times.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between pt-4">
            <div>
              {event && onDelete && (
                showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isSaving}
                    >
                      Confirm Delete
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-destructive hover:text-destructive"
                  >
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                )
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || !title.trim()} isLoading={isSaving}>
                {event ? "Update" : "Create"}
                {!isSaving && !event && <Sparkles className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
