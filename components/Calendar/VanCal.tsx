"use client";

import { useState, useMemo } from "react";
import { format, subMonths, addMonths, subWeeks, addWeeks, subDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Search, Calendar as CalendarIcon, Download, Upload, Settings, Sparkles } from "lucide-react";
import { DayView } from "./DayView";
import { WeekView } from "./WeekView";
import { MonthView } from "./MonthView";
import { YearView } from "./YearView";
import { AgendaView } from "./AgendaView";
import { EventModal } from "./EventModal";
import { SearchModal } from "./SearchModal";
import { ImportExportModal } from "./ImportExportModal";
import { SettingsModal } from "./SettingsModal";
import { AIAssistantModal } from "./AIAssistantModal";
import { useEvents } from "@/hooks/useEvents";
import { useSettings } from "@/hooks/useSettings";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { CalendarEvent } from "@/src/domain/calendar/event";
import { cn } from "@/lib/utils";

interface SystemColors {
  bg: string;
  bgLight: string;
  border: string;
  text: string;
  hover: string;
}

const SYSTEM_COLORS: Record<"Health" | "Work" | "Relationships", SystemColors> = {
  Health: { bg: "bg-green-500", bgLight: "bg-green-50", border: "border-green-500", text: "text-green-700", hover: "hover:bg-green-50" },
  Work: { bg: "bg-blue-500", bgLight: "bg-blue-50", border: "border-blue-500", text: "text-blue-700", hover: "hover:bg-blue-50" },
  Relationships: { bg: "bg-purple-500", bgLight: "bg-purple-50", border: "border-purple-500", text: "text-purple-700", hover: "hover:bg-purple-50" },
};

type ViewType = "daily" | "weekly" | "monthly" | "yearly" | "agenda";

function MiniCalendar({ currentDate, selectedDate, events, onDateSelect }: {
  currentDate: Date;
  selectedDate: Date;
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
}) {
  const [viewMonth, setViewMonth] = useState(selectedDate);
  
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const emptyDays = Array(startDay).fill(null);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      if (!event.startTime) return;
      const key = format(new Date(event.startTime), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    });
    return map;
  }, [events]);

  return (
    <div className="bg-white dark:bg-[#1A1D24] rounded-xl border border-gray-100 dark:border-[#333] overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-[#333]">
        <button onClick={() => setViewMonth(subMonths(viewMonth, 1))} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#252830] rounded-lg transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{format(viewMonth, "MMMM yyyy")}</span>
        <button onClick={() => setViewMonth(addMonths(viewMonth, 1))} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#252830] rounded-lg transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      <div className="grid grid-cols-7 border-b border-gray-100 dark:border-[#333]">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="p-2 text-[10px] text-center font-medium text-gray-400">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 p-2 gap-1">
        {emptyDays.map((_, i) => <div key={`empty-${i}`} className="h-7" />)}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay.get(key) || [];
          const isSelected = format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
          const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
          
          return (
            <button
              key={key}
              onClick={() => onDateSelect(day)}
              className={cn(
                "h-7 text-xs flex flex-col items-center justify-center rounded-lg transition-all duration-150 relative",
                isSelected ? "bg-blue-500 text-white font-medium" : isToday ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252830]",
                dayEvents.length > 0 && !isSelected && !isToday && "text-blue-600 dark:text-blue-400"
              )}
            >
              {format(day, "d")}
              {dayEvents.length > 0 && (
                <div className="absolute bottom-0.5 flex gap-0.5">
                  {dayEvents.slice(0, 2).map((e, i) => (
                    <div key={i} className={cn("w-1 h-1 rounded-full", e.system === "Health" ? "bg-green-500" : e.system === "Work" ? "bg-blue-500" : "bg-purple-500")} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function VanCal() {
  const [view, setView] = useState<ViewType>("monthly");
  const [date, setDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined);
  const [searchOpen, setSearchOpen] = useState(false);
  const [importExportOpen, setImportExportOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour?: number } | null>(null);

  const { events, createEvent, updateEvent, deleteEvent } = useEvents();
  const { settings, updateSetting } = useSettings();

  const handleSearchSelect = (event: CalendarEvent) => {
    if (event.startTime) {
      setDate(new Date(event.startTime));
      setView("daily");
    }
    handleEdit(event);
  };

  const handleSlotClick = (date: Date, hour?: number) => {
    setSelectedSlot({ date, hour });
    setEditingEvent(undefined);
    setShowModal(true);
  };

  const handlePrev = () => {
    if (view === "monthly") setDate(subMonths(date, 1));
    else if (view === "weekly") setDate(subWeeks(date, 1));
    else if (view === "daily") setDate(subDays(date, 1));
    else setDate(new Date(date.getFullYear() - 1, 0, 1));
  };

  const handleNext = () => {
    if (view === "monthly") setDate(addMonths(date, 1));
    else if (view === "weekly") setDate(addWeeks(date, 1));
    else if (view === "daily") setDate(addDays(date, 1));
    else setDate(new Date(date.getFullYear() + 1, 0, 1));
  };

  const handleToday = () => setDate(new Date());

  const handleCreate = () => {
    setEditingEvent(undefined);
    setShowModal(true);
  };

  const handleEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setShowModal(true);
  };

  const handleSave = async (data: { title: string; description?: string; startTime: number; endTime: number; allDay: boolean; system: "Health" | "Work" | "Relationships"; location?: string; recurrence?: string; reminder?: number; color?: string; recurrenceEndType?: string; recurrenceEndDate?: string; recurrenceCount?: number; guests?: string[] }) => {
    const now = Date.now();
    const eventData = {
      id: editingEvent?.id || `evt-${now}-${Math.random().toString(36).substr(2, 9)}`,
      title: data.title,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
      allDay: data.allDay,
      calendarId: "personal",
      color: data.color || "#4F8DFD",
      type: "event",
      system: data.system,
      location: data.location,
      reminder: data.reminder,
      recurrence: data.recurrence ? {
        type: data.recurrence,
        endDate: data.recurrenceEndDate ? new Date(data.recurrenceEndDate).getTime() : undefined,
        occurrences: data.recurrenceCount,
      } : undefined,
      guests: data.guests,
      version: 1,
      updatedAt: now,
    };

    if (editingEvent?.id) {
      await updateEvent(editingEvent.id, eventData);
    } else {
      await createEvent(eventData);
    }
    setShowModal(false);
    setEditingEvent(undefined);
  };

  const handleDelete = async () => {
    if (editingEvent?.id) {
      await deleteEvent(editingEvent.id);
      setShowModal(false);
      setEditingEvent(undefined);
    }
  };

  const dateLabel = useMemo(() => {
    if (view === "daily") return format(date, "EEEE, MMMM d, yyyy");
    if (view === "weekly") {
      const start = new Date(date);
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
    }
    if (view === "monthly") return format(date, "MMMM yyyy");
    return format(date, "yyyy");
  }, [view, date]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onCreateEvent: handleCreate,
    onToggleSearch: () => setSearchOpen(!searchOpen),
    onGoToToday: handleToday,
    onNext: handleNext,
    onPrev: handlePrev,
    onDayView: () => setView("daily"),
    onWeekView: () => setView("weekly"),
    onMonthView: () => setView("monthly"),
    onYearView: () => setView("yearly"),
  });

  return (
    <div className="h-screen flex bg-white dark:bg-gray-900">
      {/* Left Sidebar */}
      <aside className="w-72 border-r border-gray-100 dark:border-[#333] p-4 flex flex-col gap-4 bg-gray-50/50 dark:bg-[#1A1D24]">
        <div className="flex items-center gap-2 px-2">
          <CalendarIcon className="w-5 h-5 text-blue-500" />
          <span className="text-lg font-semibold text-gray-900 dark:text-white">Calendar</span>
        </div>
        <MiniCalendar currentDate={date} selectedDate={date} events={events} onDateSelect={(d) => { setDate(d); setView("daily"); }} />
        
        {/* Quick Actions */}
        <div className="space-y-2">
          <button
            onClick={handleCreate}
            className="w-full flex items-center gap-3 px-3 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm shadow-blue-500/30"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New Event</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-[#333]">
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-100 dark:bg-[#252830] rounded-lg p-1">
              {(["daily", "weekly", "monthly", "yearly", "agenda"] as ViewType[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${view === v ? "bg-white dark:bg-[#333] text-gray-900 dark:text-white shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
                >
                  {v === "agenda" ? "Agenda" : v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handlePrev} className="p-2 hover:bg-gray-100 dark:hover:bg-[#252830] rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button onClick={handleToday} className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors font-medium">
                Today
              </button>
              <button onClick={handleNext} className="p-2 hover:bg-gray-100 dark:hover:bg-[#252830] rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">{dateLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#252830] rounded-lg transition-colors" title="Search (Ctrl+F)">
              <Search className="w-5 h-5 text-gray-500" />
            </button>
            <button onClick={() => setImportExportOpen(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#252830] rounded-lg transition-colors" title="Import/Export">
              <Download className="w-5 h-5 text-gray-500" />
            </button>
            <button onClick={() => setAiAssistantOpen(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#252830] rounded-lg transition-colors text-[#5B8DEF]" title="AI Assistant (Ctrl+Shift+A)">
              <Sparkles className="w-5 h-5" />
            </button>
            <button onClick={() => setSettingsOpen(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#252830] rounded-lg transition-colors" title="Settings">
              <Settings className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </header>

        <SearchModal
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          events={events}
          onSelectEvent={handleSearchSelect}
        />

        <ImportExportModal
          isOpen={importExportOpen}
          onClose={() => setImportExportOpen(false)}
          events={events}
          onImport={(importedEvents) => {
            importedEvents.forEach((event) => createEvent(event));
          }}
        />

        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={settings}
          onUpdateSetting={updateSetting}
        />

        <AIAssistantModal
          isOpen={aiAssistantOpen}
          onClose={() => setAiAssistantOpen(false)}
          onAddEvent={(event) => createEvent(event as any)}
        />

        <main className="flex-1 overflow-auto">
          {view === "daily" && <DayView date={date} events={events} buffers={[]} systemColors={SYSTEM_COLORS} onSlotClick={handleSlotClick} onEventClick={handleEdit} onEventMove={(id: string, start: number, end: number) => updateEvent(id, { startTime: start, endTime: end })} />}
          {view === "weekly" && <WeekView date={date} events={events} buffers={[]} systemColors={SYSTEM_COLORS} onSlotClick={handleSlotClick} onEventClick={handleEdit} onEventMove={(id: string, start: number, end: number) => updateEvent(id, { startTime: start, endTime: end })} />}
          {view === "monthly" && <MonthView date={date} events={events} buffers={[]} systemColors={SYSTEM_COLORS} onDateClick={(d: Date) => { setDate(d); setView("daily"); }} onEventClick={handleEdit} onEventMove={(id: string, start: number, end: number) => updateEvent(id, { startTime: start, endTime: end })} />}
          {view === "yearly" && <YearView date={date} events={events} buffers={[]} systemColors={SYSTEM_COLORS} onDateClick={(d: Date) => { setDate(d); setView("monthly"); }} onEventClick={handleEdit} />}
          {view === "agenda" && <AgendaView date={date} events={events} buffers={[]} systemColors={SYSTEM_COLORS} onEventClick={handleEdit} />}
        </main>
      </div>

      {showModal && (
        <EventModal
          event={editingEvent}
          selectedSlot={selectedSlot}
          systemColors={SYSTEM_COLORS}
          onSave={handleSave}
          onDelete={editingEvent?.id ? handleDelete : undefined}
          onClose={() => { setShowModal(false); setEditingEvent(undefined); setSelectedSlot(null); }}
        />
      )}
    </div>
  );
}

export default VanCal;