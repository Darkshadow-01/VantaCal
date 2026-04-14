"use client";

import { useState, useMemo } from "react";
import { X, AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { TimePicker } from "@/components/TimePicker";
import type { CalendarEvent } from "@/lib/types";
import { detectConflicts, type ConflictInfo } from "@/lib/conflict-detection";

interface NewEventState {
  title: string;
  date: string;
  time: string;
  endTime: string;
  type: "event" | "task" | "reminder";
  color: string;
  allDay: boolean;
  repeat: string;
  repeatType: "daily" | "weekly" | "monthly" | "yearly" | "custom";
  repeatInterval: number;
  repeatEndDate: string;
  repeatDays: number[];
  location: string;
  description: string;
  calendarId: string;
  reminder: number;
  reminderUnit: string;
  guests: string[];
  busy: boolean;
  isPublic: boolean;
  guestEmail: string;
}

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (events: CalendarEvent[], conflicts?: ConflictInfo[]) => void;
  initialDate?: string;
  initialHour?: number;
  isEditing?: boolean;
  editingEvent?: CalendarEvent | null;
  existingEvents?: CalendarEvent[];
}

const defaultEvent = (): NewEventState => ({
  title: "",
  date: "",
  time: "",
  endTime: "",
  type: "event",
  color: "#1C1917",
  allDay: false,
  repeat: "none",
  repeatType: "daily",
  repeatInterval: 1,
  repeatEndDate: "",
  repeatDays: [],
  location: "",
  description: "",
  calendarId: "personal",
  reminder: 30,
  reminderUnit: "minutes",
  guests: [],
  busy: true,
  isPublic: false,
  guestEmail: ""
});

function getDefaultEvent(dateStr?: string, hour?: number): NewEventState {
  const now = new Date();
  const date = dateStr || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return {
    ...defaultEvent(),
    date,
    time: hour !== undefined ? `${String(hour).padStart(2, '0')}:00` : "",
    endTime: hour !== undefined ? `${String((hour + 1) % 24).padStart(2, '0')}:00` : "",
    allDay: hour === undefined,
  };
}

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export function CreateEventModal({ isOpen, onClose, onSave, initialDate, initialHour, isEditing, editingEvent, existingEvents = [] }: CreateEventModalProps) {
  const [newEvent, setNewEvent] = useState<NewEventState>(() => getDefaultEvent(initialDate, initialHour));
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [detectedConflicts, setDetectedConflicts] = useState<ConflictInfo[]>([]);

  const conflicts = useMemo(() => {
    if (!isOpen || !newEvent.date || !newEvent.time || !newEvent.endTime || newEvent.allDay) return [];
    
    const dateParts = newEvent.date.split("-");
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1;
    const day = parseInt(dateParts[2]);
    const hour = parseInt(newEvent.time.split(":")[0]);
    const endHour = parseInt(newEvent.endTime.split(":")[0]);

    if (isNaN(hour) || isNaN(endHour)) return [];

    const startTime = new Date(year, month, day, hour).getTime();
    const endTime = new Date(year, month, day, endHour).getTime();

    const tempEvent = {
      id: editingEvent?.id || "temp",
      title: newEvent.title,
      startTime,
      endTime,
      allDay: false,
      calendarId: newEvent.calendarId,
      color: newEvent.color,
      type: newEvent.type,
      version: 1,
      updatedAt: Date.now(),
    };

    return detectConflicts(tempEvent as CalendarEvent, existingEvents);
  }, [isOpen, newEvent.date, newEvent.time, newEvent.endTime, newEvent.allDay, existingEvents, editingEvent?.id, newEvent.title, newEvent.color, newEvent.type, newEvent.calendarId]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!newEvent.title || !newEvent.date) return;

    if (conflicts.length > 0 && !isEditing) {
      setDetectedConflicts(conflicts);
      setShowConflictWarning(true);
      return;
    }

    const dateParts = newEvent.date.split("-");
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1;
    const day = parseInt(dateParts[2]);
    const hour = newEvent.time ? parseInt(newEvent.time.split(":")[0]) : undefined;
    const endHour = newEvent.endTime ? parseInt(newEvent.endTime.split(":")[0]) : undefined;

    const recurringEventId = Date.now().toString();

    const createEvent = (d: number, m: number, y: number, isFirst: boolean = false): CalendarEvent => {
      const h = hour ?? 9;
      const eh = endHour ?? h + 1;
      const startTime = new Date(y, m, d, h).getTime();
      const endTime = new Date(y, m, d, eh).getTime();

      return {
        id: isFirst ? recurringEventId : `${recurringEventId}-${d}-${m}-${y}`,
        title: newEvent.title,
        startTime,
        endTime,
        allDay: false,
        calendarId: newEvent.calendarId,
        color: newEvent.color,
        type: newEvent.type,
        system: "Work",
        completed: false,
        guests: newEvent.guests,
        location: newEvent.location,
        description: newEvent.description,
        reminder: newEvent.reminder,
        recurrence: newEvent.repeat !== "none" ? {
          type: newEvent.repeat === "custom" ? newEvent.repeatType : newEvent.repeat as "daily" | "weekly" | "monthly" | "yearly",
          interval: newEvent.repeatInterval,
          endDate: newEvent.repeatEndDate ? new Date(newEvent.repeatEndDate).getTime() : undefined,
          daysOfWeek: newEvent.repeatDays.length > 0 ? newEvent.repeatDays : undefined,
        } : undefined,
        recurringEventId: newEvent.repeat !== "none" ? recurringEventId : undefined,
        isRecurringInstance: !isFirst,
        version: 1,
        updatedAt: Date.now(),
      };
    };

    const newEvents: CalendarEvent[] = [createEvent(day, month, year, true)];

    if (newEvent.repeat !== "none") {
      const endDate = newEvent.repeatEndDate ? new Date(newEvent.repeatEndDate) : new Date(year + 2, month, day);
      const maxOccurrences = 365;
      const currentDate = new Date(year, month, day);

      for (let i = 1; i <= maxOccurrences; i++) {
        switch (newEvent.repeat === "custom" ? newEvent.repeatType : newEvent.repeat) {
          case "daily":
            currentDate.setDate(currentDate.getDate() + newEvent.repeatInterval);
            break;
          case "weekly":
            currentDate.setDate(currentDate.getDate() + (7 * newEvent.repeatInterval));
            break;
          case "biweekly":
            currentDate.setDate(currentDate.getDate() + 14);
            break;
          case "monthly":
            currentDate.setMonth(currentDate.getMonth() + newEvent.repeatInterval);
            break;
          case "yearly":
            currentDate.setFullYear(currentDate.getFullYear() + newEvent.repeatInterval);
            break;
        }

        if (currentDate > endDate || currentDate.getFullYear() > year + 2) break;

        if ((newEvent.repeatType === "weekly" || newEvent.repeat === "weekly") && newEvent.repeatDays.length > 0) {
          const dayOfWeek = currentDate.getDay();
          if (!newEvent.repeatDays.includes(dayOfWeek)) continue;
        }

        newEvents.push(createEvent(currentDate.getDate(), currentDate.getMonth(), currentDate.getFullYear()));
      }
    }

    onSave(newEvents, conflicts);
    setNewEvent(getDefaultEvent());
    onClose();
  };

  const handleForceSave = () => {
    if (!newEvent.title || !newEvent.date) return;

    const dateParts = newEvent.date.split("-");
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1;
    const day = parseInt(dateParts[2]);
    const hour = newEvent.time ? parseInt(newEvent.time.split(":")[0]) : undefined;
    const endHour = newEvent.endTime ? parseInt(newEvent.endTime.split(":")[0]) : undefined;

    const recurringEventId = Date.now().toString();

    const createEvent = (d: number, m: number, y: number, isFirst: boolean = false): CalendarEvent => {
      const h = hour ?? 9;
      const eh = endHour ?? h + 1;
      const startTime = new Date(y, m, d, h).getTime();
      const endTime = new Date(y, m, d, eh).getTime();

      return {
        id: isFirst ? recurringEventId : `${recurringEventId}-${d}-${m}-${y}`,
        title: newEvent.title,
        startTime,
        endTime,
        allDay: false,
        calendarId: newEvent.calendarId,
        color: newEvent.color,
        type: newEvent.type,
        system: "Work",
        completed: false,
        guests: newEvent.guests,
        location: newEvent.location,
        description: newEvent.description,
        reminder: newEvent.reminder,
        recurrence: newEvent.repeat !== "none" ? {
          type: newEvent.repeat === "custom" ? newEvent.repeatType : newEvent.repeat as "daily" | "weekly" | "monthly" | "yearly",
          interval: newEvent.repeatInterval,
          endDate: newEvent.repeatEndDate ? new Date(newEvent.repeatEndDate).getTime() : undefined,
          daysOfWeek: newEvent.repeatDays.length > 0 ? newEvent.repeatDays : undefined,
        } : undefined,
        recurringEventId: newEvent.repeat !== "none" ? recurringEventId : undefined,
        isRecurringInstance: !isFirst,
        version: 1,
        updatedAt: Date.now(),
      };
    };

    const newEvents: CalendarEvent[] = [createEvent(day, month, year, true)];

    if (newEvent.repeat !== "none") {
      const endDate = newEvent.repeatEndDate ? new Date(newEvent.repeatEndDate) : new Date(year + 2, month, day);
      const maxOccurrences = 365;
      const currentDate = new Date(year, month, day);

      for (let i = 1; i <= maxOccurrences; i++) {
        switch (newEvent.repeat === "custom" ? newEvent.repeatType : newEvent.repeat) {
          case "daily":
            currentDate.setDate(currentDate.getDate() + newEvent.repeatInterval);
            break;
          case "weekly":
            currentDate.setDate(currentDate.getDate() + (7 * newEvent.repeatInterval));
            break;
          case "biweekly":
            currentDate.setDate(currentDate.getDate() + 14);
            break;
          case "monthly":
            currentDate.setMonth(currentDate.getMonth() + newEvent.repeatInterval);
            break;
          case "yearly":
            currentDate.setFullYear(currentDate.getFullYear() + newEvent.repeatInterval);
            break;
        }

        if (currentDate > endDate || currentDate.getFullYear() > year + 2) break;

        if ((newEvent.repeatType === "weekly" || newEvent.repeat === "weekly") && newEvent.repeatDays.length > 0) {
          const dayOfWeek = currentDate.getDay();
          if (!newEvent.repeatDays.includes(dayOfWeek)) continue;
        }

        newEvents.push(createEvent(currentDate.getDate(), currentDate.getMonth(), currentDate.getFullYear()));
      }
    }

    onSave(newEvents, conflicts);
    setNewEvent(getDefaultEvent());
    setShowConflictWarning(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2" onClick={onClose}>
      <div className="bg-white dark:bg-[#1A1D24] rounded-xl w-full max-w-lg border border-gray-200 dark:border-gray-700 shadow-2xl max-h-[70vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {isEditing ? "Edit Event" : "Create Event"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-2 overflow-y-auto flex-1">
          <div className="space-y-2">
            <div>
              <Input
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Event title"
                className="text-sm font-medium h-8 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
              />
            </div>

            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <Input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={newEvent.allDay}
                  onChange={(e) => setNewEvent({ ...newEvent, allDay: e.target.checked })}
                  id="allDay"
                  className="w-3 h-3"
                />
                <label htmlFor="allDay" className="text-xs text-gray-600 dark:text-gray-400">All day</label>
              </div>
            </div>

            {!newEvent.allDay && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <TimePicker
                    value={newEvent.time}
                    onChange={(time) => setNewEvent({ ...newEvent, time })}
                  />
                </div>
                <div className="flex-1">
                  <TimePicker
                    value={newEvent.endTime}
                    onChange={(endTime) => setNewEvent({ ...newEvent, endTime })}
                  />
                </div>
              </div>
            )}

            <Select value={newEvent.repeat} onValueChange={(v) => setNewEvent({ ...newEvent, repeat: v })}>
              <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg w-full h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 z-[100] max-h-40 overflow-y-auto">
                <SelectItem value="none" className="text-gray-900 dark:text-white dark:focus:bg-gray-700 text-sm">Does not repeat</SelectItem>
                <SelectItem value="daily" className="text-gray-900 dark:text-white dark:focus:bg-gray-700 text-sm">Daily</SelectItem>
                <SelectItem value="weekly" className="text-gray-900 dark:text-white dark:focus:bg-gray-700 text-sm">Weekly</SelectItem>
                <SelectItem value="biweekly" className="text-gray-900 dark:text-white dark:focus:bg-gray-700 text-sm">Every 2 weeks</SelectItem>
                <SelectItem value="monthly" className="text-gray-900 dark:text-white dark:focus:bg-gray-700 text-sm">Monthly</SelectItem>
                <SelectItem value="yearly" className="text-gray-900 dark:text-white dark:focus:bg-gray-700 text-sm">Yearly</SelectItem>
              </SelectContent>
            </Select>

{(newEvent.repeat === "weekly" || newEvent.repeat === "biweekly" || (newEvent.repeat === "custom" && newEvent.repeatType === "weekly")) && (
              <div className="flex gap-1 flex-wrap">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => {
                      const days = newEvent.repeatDays.includes(day.value)
                        ? newEvent.repeatDays.filter(d => d !== day.value)
                        : [...newEvent.repeatDays, day.value].sort();
                      setNewEvent({ ...newEvent, repeatDays: days });
                    }}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      newEvent.repeatDays.includes(day.value)
                        ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                        : "bg-gray-100 dark:bg-[#252830] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#333]"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setNewEvent({ ...newEvent, repeatDays: [1, 2, 3, 4, 5] })}
                  className="text-xs text-[var(--accent)] hover:underline ml-2"
                >
                  Weekdays (M-F)
                </button>
              </div>
            )}

            {newEvent.repeat === "custom" && (
              <div className="space-y-3 p-3 bg-gray-100 dark:bg-[#1A1D24] rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Repeat every</span>
                  <Input
                    type="number"
                    min="1"
                    max="99"
                    value={newEvent.repeatInterval}
                    onChange={(e) => setNewEvent({ ...newEvent, repeatInterval: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-16 bg-white dark:bg-[#252830] border-gray-300 dark:border-[#2a2d33] text-gray-900 dark:text-white text-center"
                  />
                  <Select value={newEvent.repeatType} onValueChange={(v: any) => setNewEvent({ ...newEvent, repeatType: v })}>
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg w-24 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 z-[100]">
                      <SelectItem value="daily" className="text-gray-900 dark:text-white dark:focus:bg-gray-700 text-sm">day(s)</SelectItem>
                      <SelectItem value="weekly" className="text-gray-900 dark:text-white dark:focus:bg-gray-700 text-sm">week(s)</SelectItem>
                      <SelectItem value="monthly" className="text-gray-900 dark:text-white dark:focus:bg-gray-700 text-sm">month(s)</SelectItem>
                      <SelectItem value="yearly" className="text-gray-900 dark:text-white dark:focus:bg-gray-700 text-sm">year(s)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newEvent.repeatType === "weekly" && (
                  <div className="flex gap-1 flex-wrap">
                    {WEEKDAYS.map((day) => (
                      <button
                        key={day.value}
                        onClick={() => {
                          const days = newEvent.repeatDays.includes(day.value)
                            ? newEvent.repeatDays.filter(d => d !== day.value)
                            : [...newEvent.repeatDays, day.value].sort();
                          setNewEvent({ ...newEvent, repeatDays: days });
                        }}
                        className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                          newEvent.repeatDays.includes(day.value)
                            ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                            : "bg-gray-200 dark:bg-[#252830] text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Ends</span>
                  <Input
                    type="date"
                    value={newEvent.repeatEndDate}
                    onChange={(e) => setNewEvent({ ...newEvent, repeatEndDate: e.target.value })}
                    className="bg-white dark:bg-[#252830] border-gray-300 dark:border-[#2a2d33] text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs text-gray-500 uppercase tracking-wide">Calendar</Label>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: newEvent.color }} />
                <Select value={newEvent.calendarId} onValueChange={(v) => setNewEvent({ ...newEvent, calendarId: v })}>
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg flex-1 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 z-[100]">
                    <SelectItem value="personal" className="text-gray-900 dark:text-white dark:focus:bg-gray-700 text-sm">Personal</SelectItem>
                    <SelectItem value="work" className="text-gray-900 dark:text-white dark:focus:bg-gray-700 text-sm">Work</SelectItem>
                    <SelectItem value="birthdays" className="text-gray-900 dark:text-white dark:focus:bg-gray-700 text-sm">Birthdays</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-500 uppercase tracking-wide">Description</Label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Add description"
                rows={3}
                className="w-full bg-white dark:bg-[#1A1D24] border border-gray-300 dark:border-[#2a2d33] rounded-lg text-gray-900 dark:text-white placeholder:text-gray-500 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-500 uppercase tracking-wide">Color</Label>
              <div className="flex gap-2">
                {["#5B8DEF", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899", "#3BA55D", "#14B8A6", "#F97316"].map(color => (
                  <button
                    key={color}
                    onClick={() => setNewEvent({ ...newEvent, color })}
                    className={`w-8 h-8 rounded-full transition-transform ${newEvent.color === color ? "scale-110 ring-2 ring-white dark:ring-offset-2 dark:ring-offset-[#121417]" : "hover:scale-105"}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {showConflictWarning && detectedConflicts.length > 0 && (
          <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="font-medium text-red-800 dark:text-red-200">Scheduling Conflict Detected</span>
            </div>
            <div className="space-y-1 mb-3">
              {detectedConflicts.slice(0, 3).map((conflict, idx) => (
                <div key={idx} className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>&quot;{conflict.title}&quot; overlaps by {conflict.overlapMinutes} min</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleForceSave} variant="outline" className="flex-1 border-red-300 text-red-700 hover:bg-red-100">
                Save Anyway
              </Button>
              <Button onClick={() => setShowConflictWarning(false)} className="flex-1">
                Go Back
              </Button>
            </div>
          </div>
        )}

        <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex gap-2 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1 h-8 text-sm dark:border-gray-600 dark:text-gray-300">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!newEvent.title || !newEvent.date} className="flex-1 h-8 text-sm">
            {isEditing ? "Save" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}
