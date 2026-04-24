"use client";

import { useState, useEffect, useRef } from "react";
import { getLastSystem, setLastSystem } from "@/hooks/useEncryption";
import { format, addHours, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { AlertTriangle, Calendar, Clock, MapPin, Repeat, FileText, X, ChevronLeft, ChevronRight, Bell, Users, Sparkles } from "lucide-react";
import type { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { findAvailableSlots } from "@/src/features/calendar/service/meeting-scheduler";

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
  recurrenceEndType?: "never" | "onDate" | "after";
  recurrenceEndDate?: string;
  recurrenceCount?: number;
  location?: string;
  reminder?: number;
  guests?: string[];
}

interface EventModalProps {
  event?: CalendarEvent | null;
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
    (event?.system as "Health" | "Work" | "Relationships") || 
    (typeof window !== "undefined" ? getLastSystem() as "Health" | "Work" | "Relationships" : "Work")
  );
  const [allDay, setAllDay] = useState(event?.allDay || false);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState(event?.location || "");
  const [recurrence, setRecurrence] = useState<string>(typeof event?.recurrence === 'string' ? event.recurrence : "none");
  const [recurrenceEndType, setRecurrenceEndType] = useState<"never" | "onDate" | "after">("never");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [recurrenceCount, setRecurrenceCount] = useState(10);
  const [guests, setGuests] = useState<string[]>(event?.guests || []);
  const [newGuest, setNewGuest] = useState("");
  const [reminder, setReminder] = useState<number>(event?.reminder || 30);
  const [customColor, setCustomColor] = useState<string | undefined>(event?.color);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const datePickerRef = useRef<HTMLDivElement>(null);

  const [suggestedTimes, setSuggestedTimes] = useState<string[]>([]);
  const [showSuggestedTimes, setShowSuggestedTimes] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (event) {
      const start = event.startTime ? new Date(event.startTime) : new Date();
      const end = event.endTime ? new Date(event.endTime) : new Date(start.getTime() + 3600000);
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

  useEffect(() => {
    if (startDate) {
      const date = new Date(startDate);
      const slots = findAvailableSlots(date.getDate(), date.getMonth(), date.getFullYear(), [], 9, 17, 60);
      const formattedTimes = slots.slice(0, 5).map(slot => `${slot.startHour}:00`);
      setSuggestedTimes(formattedTimes);
    }
  }, [startDate]);

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
        color: customColor,
        location: location.trim() || undefined,
        recurrence: recurrence === "none" ? undefined : recurrence,
        recurrenceEndType: recurrence !== "none" ? recurrenceEndType : undefined,
        recurrenceEndDate: recurrenceEndType === "onDate" && recurrenceEndDate ? recurrenceEndDate : undefined,
        recurrenceCount: recurrenceEndType === "after" ? recurrenceCount : undefined,
        reminder: reminder > 0 ? reminder : undefined,
        guests: guests.length > 0 ? guests : undefined,
      });
      
      setLastSystem(system);
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-2" onClick={onClose}>
      <div 
        className="bg-[var(--bg-primary)] rounded-lg w-full max-w-lg sm:max-w-xl shadow-xl border border-[var(--border)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-2 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-serif text-[var(--text-primary)] font-medium">
              {event ? "Edit event" : "Create event"}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-[var(--bg-secondary)] rounded press-scale">
              <X className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Title Input */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add title..."
              className="w-full text-lg font-semibold bg-transparent border-b-2 border-[var(--border)] focus:border-[var(--accent)] outline-none placeholder:text-[var(--text-muted)] text-[var(--text-primary)] py-2"
              autoFocus
            />
          </div>

          {/* System Selection */}
          <div>
            <div className="grid grid-cols-3 gap-3">
              {(["Health", "Work", "Relationships"] as const).map((sys) => {
                const bgColor = sys === "Health" ? "#16A34A" : sys === "Relationships" ? "#9333EA" : "#374151";
                const isSelected = system === sys && !customColor;
                return (
                  <button
                    key={sys}
                    type="button"
                    onClick={() => { setSystem(sys); setCustomColor(undefined); }}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all duration-200 text-center",
                      isSelected 
                        ? "border-[var(--text-primary)] bg-[var(--bg-secondary)]" 
                        : "border-[var(--border)] hover:border-[var(--text-muted)] hover:scale-[1.02] active:scale-[0.98]"
                    )}
                  >
                    <div 
                      className={cn("w-4 h-4 rounded-full mx-auto mb-2 transition-transform", isSelected && "scale-125")} 
                      style={{ backgroundColor: bgColor }}
                    />
                    <span className={cn("text-sm font-semibold", isSelected ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]")}>{sys}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Color Picker */}
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] mb-2 block">Or choose a color</label>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { bg: "bg-red-500", value: "red" },
                { bg: "bg-orange-500", value: "orange" },
                { bg: "bg-yellow-500", value: "yellow" },
                { bg: "bg-green-500", value: "green" },
                { bg: "bg-teal-500", value: "teal" },
                { bg: "bg-[#3B82F6]", value: "blue" },
                { bg: "bg-indigo-500", value: "indigo" },
                { bg: "bg-purple-500", value: "purple" },
                { bg: "bg-pink-500", value: "pink" },
              ].map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => { setCustomColor(color.value); setSystem("Work"); }}
                  className={cn(
                    "w-6 h-6 rounded-full transition-all duration-150 hover:scale-110",
                    color.bg,
                    customColor === color.value ? "ring-2 ring-offset-2 ring-gray-400" : ""
                  )}
                  title={color.value}
                />
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-3">
            {/* Date picker button */}
            <div className="relative" ref={datePickerRef}>
              <button
                type="button"
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors duration-200 group"
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                <Calendar className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] dark:group-hover:text-gray-300 transition-colors" />
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{startDate ? format(new Date(startDate), "EEE, MMM d, yyyy") : "Select date"}</span>
                  </div>
                  {!allDay && startTime && endTime && (
                    <div className="text-sm text-gray-500">{startTime} - {endTime}</div>
                  )}
                </div>
              </button>

              {/* Date picker dropdown */}
              {showDatePicker && (
                <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-[#1A1D24] rounded-xl shadow-xl border border-[var(--border)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-3 border-b border-gray-100 dark:border-[#333]">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setPickerDate(subMonths(pickerDate, 1))}
                        className="p-1.5 hover:bg-gray-100 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-[var(--text-secondary)]" />
                      </button>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {format(pickerDate, "MMMM yyyy")}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPickerDate(addMonths(pickerDate, 1))}
                        className="p-1.5 hover:bg-gray-100 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                        <div key={i} className="text-xs text-center text-[var(--text-muted)] font-medium">{day}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {eachDayOfInterval({
                        start: startOfMonth(pickerDate),
                        end: endOfMonth(pickerDate)
                      }).map((day, idx) => {
                        const dateStr = format(day, "yyyy-MM-dd");
                        const isSelected = startDate === dateStr;
                        const isCurrentMonth = isSameMonth(day, pickerDate);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setStartDate(dateStr);
                              setEndDate(dateStr);
                              setShowDatePicker(false);
                            }}
                            className={cn(
                              "w-8 h-8 rounded-full text-sm transition-all duration-150",
                              isCurrentMonth ? "text-[var(--text-primary)]" : "text-gray-300 dark:text-gray-600",
                              isSelected && "bg-[var(--accent)] text-[var(--accent-contrast)]",
                              !isSelected && isToday(day) && "ring-2 ring-[var(--accent)] ring-inset",
                              !isSelected && isCurrentMonth && "hover:bg-gray-100 hover:bg-[var(--bg-secondary)]"
                            )}
                          >
                            {format(day, "d")}
                          </button>
                        );
                      })}
                </div>
              </div>

              {suggestedTimes.length > 0 && !allDay && (
                <div className="px-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowSuggestedTimes(!showSuggestedTimes)}
                    className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1"
                  >
                    <Clock className="w-3 h-3" />
                    Suggested times
                  </button>
                  {showSuggestedTimes && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {suggestedTimes.map(time => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => { setStartTime(time); setShowSuggestedTimes(false); }}
                          className="px-2 py-1 text-xs bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded hover:bg-[var(--border)]"
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
              )}
            </div>

            {/* All Day Toggle */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer" onClick={() => setAllDay(!allDay)}>
              <div className={cn(
                "w-10 h-6 rounded-full transition-all duration-300 relative",
                allDay ? "bg-[var(--accent)]" : "bg-[var(--border)]"
              )}>
                <div className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300",
                  allDay ? "left-5" : "left-1"
                )} />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">All-day</span>
            </div>

            {/* Time dropdowns when not all-day */}
            {!allDay && (
              <div className="grid grid-cols-2 gap-3 px-3">
                <div className="relative group">
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full appearance-none p-2 pl-8 rounded border border-[var(--border)] bg-white dark:bg-[#1A1D24] text-gray-900 dark:text-white cursor-pointer hover:border-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-mono"
                  >
                    {Array.from({ length: 24 * 2 }, (_, i) => {
                      const h = Math.floor(i / 2);
                      const m = i % 2 === 0 ? "00" : "30";
                      const val = `${h.toString().padStart(2, "0")}:${m}`;
                      return <option key={val} value={val}>{format(new Date(`2024-01-01T${val}`), "h:mm a")}</option>;
                    })}
                  </select>
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                </div>
                <div className="relative group">
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full appearance-none p-2 pl-8 rounded border border-[var(--border)] bg-white dark:bg-[#1A1D24] text-gray-900 dark:text-white cursor-pointer hover:border-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-mono"
                  >
                    {Array.from({ length: 24 * 2 }, (_, i) => {
                      const h = Math.floor(i / 2);
                      const m = i % 2 === 0 ? "00" : "30";
                      const val = `${h.toString().padStart(2, "0")}:${m}`;
                      return <option key={val} value={val}>{format(new Date(`2024-01-01T${val}`), "h:mm a")}</option>;
                    })}
                  </select>
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          {/* More Options Toggle */}
          <button type="button" onClick={() => setShowMoreOptions(!showMoreOptions)} className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] py-1">
            <ChevronRight className={cn("w-3 h-3 transition-transform", showMoreOptions && "rotate-90")} />
            {showMoreOptions ? "Less options" : "More options"}
          </button>

          {/* Advanced Options - Collapsible */}
          {showMoreOptions && (
            <div className="space-y-2">
              {/* Location */}
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors duration-200 group cursor-pointer">
                <MapPin className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] dark:group-hover:text-gray-300 transition-colors" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Add location"
                  className="flex-1 bg-transparent border-none outline-none placeholder:text-[var(--text-muted)] text-sm text-[var(--text-primary)]"
                />
              </div>

              {/* Recurrence */}
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors duration-200 group cursor-pointer">
                <Repeat className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] dark:group-hover:text-gray-300 transition-colors" />
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value)}
                  className="flex-1 bg-white dark:bg-[#1A1D24] border-none outline-none text-sm text-gray-900 dark:text-white cursor-pointer"
                >
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every 2 weeks</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

{/* Recurrence End Options */}
              {recurrence !== "none" && (
                <div className="pl-11 space-y-2">
                  <select
                    value={recurrenceEndType}
                    onChange={(e) => setRecurrenceEndType(e.target.value as typeof recurrenceEndType)}
                    className="w-full bg-white dark:bg-[#1A1D24] border-none outline-none text-sm text-gray-900 dark:text-white cursor-pointer"
                  >
                    <option value="never">Never ends</option>
                    <option value="onDate">Ends on date</option>
                    <option value="after">Ends after occurrences</option>
                  </select>
                  
                  {recurrenceEndType === "onDate" && (
                    <input
                      type="date"
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                      className="w-full bg-[var(--bg-secondary)] dark:bg-[#252830] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
                    />
                  )}
                  
                  {recurrenceEndType === "after" && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">After</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={recurrenceCount}
                        onChange={(e) => setRecurrenceCount(Number(e.target.value))}
                        className="w-16 bg-[var(--bg-secondary)] dark:bg-[#252830] border border-[var(--border)] rounded-lg px-2 py-1 text-sm text-[var(--text-primary)]"
                      />
                      <span className="text-sm text-gray-500">occurrences</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Reminder - always visible */}
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors duration-200 group cursor-pointer">
            <Bell className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] dark:group-hover:text-gray-300 transition-colors" />
            <select
              value={reminder}
              onChange={(e) => setReminder(Number(e.target.value))}
              className="flex-1 bg-white dark:bg-[#1A1D24] border-none outline-none text-sm text-gray-900 dark:text-white cursor-pointer"
            >
              <option value={0}>No reminder</option>
              <option value={5}>5 minutes before</option>
              <option value={10}>10 minutes before</option>
              <option value={15}>15 minutes before</option>
              <option value={30}>30 minutes before</option>
              <option value={60}>1 hour before</option>
              <option value={1440}>1 day before</option>
            </select>
          </div>

          {/* Advanced options (collapsible) */}
          {showMoreOptions && (
            <div className="space-y-2">
              {/* Guests */}
              <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors duration-200 group">
                <Users className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] dark:group-hover:text-gray-300 transition-colors mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-sm text-[var(--text-primary)]">Add guests</span>
                    {guests.length > 0 && (
                      <span className="text-xs text-[var(--text-muted)]">({guests.length})</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {guests.map((guest, idx) => (
                      <span 
                        key={idx} 
                        className="inline-flex items-center gap-1 text-xs bg-[var(--bg-secondary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full"
                      >
                        {guest}
                        <button 
                          type="button"
                          onClick={() => setGuests(guests.filter((_, i) => i !== idx))}
                          className="hover:text-[var(--text-primary)]"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="email"
                      value={newGuest}
                      onChange={(e) => setNewGuest(e.target.value)}
                      placeholder="Enter email"
                      className="flex-1 bg-transparent border-b border-[var(--border)] outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newGuest.trim()) {
                          setGuests([...guests, newGuest.trim()]);
                          setNewGuest("");
                        }
                      }}
                    />
                    {newGuest.trim() && (
                      <button
                        type="button"
                        onClick={() => { setGuests([...guests, newGuest.trim()]); setNewGuest(""); }}
                        className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors duration-200 group cursor-pointer">
                <FileText className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] dark:group-hover:text-gray-300 transition-colors mt-0.5" />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
placeholder="Add description"
                  rows={2}
                  className="flex-1 bg-transparent border-none outline-none placeholder:text-[var(--text-muted)] dark:placeholder:text-gray-500 text-sm text-[var(--text-primary)] resize-none"
                />
              </div>
            </div>
          )}
          {/* Reminder stays visible */}
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors duration-200 group cursor-pointer">
            <Bell className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] dark:group-hover:text-gray-300 transition-colors" />
            <select
              value={reminder}
              onChange={(e) => setReminder(Number(e.target.value))}
              className="flex-1 bg-white dark:bg-[#1A1D24] border-none outline-none text-sm text-gray-900 dark:text-white cursor-pointer"
            >
              <option value={0}>No reminder</option>
              <option value={5}>5 minutes before</option>
              <option value={10}>10 minutes before</option>
              <option value={15}>15 minutes before</option>
              <option value={30}>30 minutes before</option>
              <option value={60}>1 hour before</option>
              <option value={1440}>1 day before</option>
            </select>
          </div>

          {/* Guests */}
          <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors duration-200 group">
            <Users className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] dark:group-hover:text-gray-300 transition-colors mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-sm text-[var(--text-primary)]">Add guests</span>
                {guests.length > 0 && (
                  <span className="text-xs text-[var(--text-muted)]">({guests.length})</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {guests.map((guest, idx) => (
                  <span 
                    key={idx} 
                    className="inline-flex items-center gap-1 text-xs bg-[var(--bg-secondary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full"
                  >
                    {guest}
                    <button 
                      type="button"
                      onClick={() => setGuests(guests.filter((_, i) => i !== idx))}
                      className="hover:text-[var(--text-primary)]"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1">
                <input
                  type="email"
                  value={newGuest}
                  onChange={(e) => setNewGuest(e.target.value)}
                  placeholder="Enter email"
                  className="flex-1 bg-transparent border-b border-[var(--border)] outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newGuest.trim()) {
                      setGuests([...guests, newGuest.trim()]);
                      setNewGuest("");
                    }
                  }}
                />
                {newGuest.trim() && (
                  <button
                    type="button"
                    onClick={() => { setGuests([...guests, newGuest.trim()]); setNewGuest(""); }}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors duration-200 group cursor-pointer">
            <FileText className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] dark:group-hover:text-gray-300 transition-colors mt-0.5" />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description"
              rows={2}
              className="flex-1 bg-transparent border-none outline-none placeholder:text-[var(--text-muted)] dark:placeholder:text-gray-500 text-sm text-[var(--text-primary)] resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-[#333]">
            <div>
              {event && onDelete && (
                showDeleteConfirm ? (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isSaving}
                      className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                )
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 hover:bg-[var(--bg-secondary)] rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !title.trim()}
                className={cn(
                  "px-5 py-2 text-sm font-medium text-white rounded-full transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg",
                  !title.trim() || isSaving
                    ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
                    : "bg-[var(--accent)] hover:opacity-90"
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </span>
                ) : event ? (
                  "Update"
                ) : (
                  <span className="flex items-center gap-1.5">
                    Create
                    <Sparkles className={cn("w-4 h-4 transition-all", isHovered ? "opacity-100 scale-100" : "opacity-0 scale-50")} />
                  </span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}