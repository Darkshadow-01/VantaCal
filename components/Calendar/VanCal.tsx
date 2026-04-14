"use client";

import { useState, useMemo, useEffect } from "react";
import { format, subMonths, addMonths, subWeeks, addWeeks, subDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from "date-fns";
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
import { VaultWarningBanner } from "./VaultStatusBadge";
import { VaultSetupModal } from "./VaultSetupModal";
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
  Health: { 
    bg: "bg-[#16A34A]", 
    bgLight: "bg-[#DCFCE7] dark:bg-[#16A34A]/20", 
    border: "border-[#16A34A]", 
    text: "text-[#16A34A] dark:text-[#4ADE80]", 
    hover: "hover:bg-[#DCFCE7] dark:hover:bg-[#16A34A]/30" 
  },
  Work: { 
    bg: "bg-[var(--accent)]", 
    bgLight: "bg-[var(--bg-secondary)] dark:bg-[var(--accent)]/20", 
    border: "border-[var(--accent)]", 
    text: "text-[var(--text-primary)] dark:text-[var(--accent)]", 
    hover: "hover:bg-[var(--bg-secondary)] dark:hover:bg-[var(--accent)]/30" 
  },
  Relationships: { 
    bg: "bg-[#9333EA]", 
    bgLight: "bg-[#F3E8FF] dark:bg-[#9333EA]/20", 
    border: "border-[#9333EA]", 
    text: "text-[#9333EA] dark:text-[#C084FC]", 
    hover: "hover:bg-[#F3E8FF] dark:hover:bg-[#9333EA]/30" 
  },
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

  const getSystemColor = (system?: string) => {
    switch (system) {
      case "Health": return "bg-[#16A34A]";
      case "Work": return "bg-[#2563EB]";
      case "Relationships": return "bg-[#9333EA]";
      default: return "bg-[#57534E]";
    }
  };

  return (
    <div className="bg-[var(--bg-elevated)] rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-[var(--border)]">
        <button 
          onClick={() => setViewMonth(subMonths(viewMonth, 1))} 
          className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-lg transition-all duration-150 press-scale"
        >
          <ChevronLeft className="w-4 h-4 text-[var(--text-muted)]" />
        </button>
        <span className="text-sm font-medium text-[var(--text-primary)] font-sans">{format(viewMonth, "MMMM yyyy")}</span>
        <button 
          onClick={() => setViewMonth(addMonths(viewMonth, 1))} 
          className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-lg transition-all duration-150 press-scale"
        >
          <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
        </button>
      </div>
      <div className="grid grid-cols-7 border-b border-[var(--border)]">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="p-2 text-[10px] text-center font-medium text-[var(--text-muted)]">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 p-2 gap-1">
        {emptyDays.map((_, i) => <div key={`empty-${i}`} className="h-7" />)}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay.get(key) || [];
          const isSelected = format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
          const isTodayDate = isToday(day);
          
          return (
            <button
              key={key}
              onClick={() => onDateSelect(day)}
              className={cn(
                "h-7 text-xs flex flex-col items-center justify-center rounded-lg transition-all duration-150 relative",
                isSelected 
                  ? "bg-[var(--accent)] text-[var(--accent-contrast)] font-medium" 
                  : isTodayDate 
                    ? "bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium ring-1 ring-[var(--accent)] ring-inset" 
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]",
                dayEvents.length > 0 && !isSelected && !isTodayDate && "text-[var(--text-primary)]"
              )}
            >
              {format(day, "d")}
              {dayEvents.length > 0 && (
                <div className="absolute bottom-0.5 flex gap-0.5">
                  {dayEvents.slice(0, 2).map((e, i) => (
                    <div key={i} className={cn("w-1 h-1 rounded-full", getSystemColor(e.system))} />
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
  const [vaultSetupOpen, setVaultSetupOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour?: number } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

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

  const handleViewChange = (newView: ViewType) => {
    if (newView === view) return;
    setIsAnimating(true);
    setTimeout(() => {
      setView(newView);
      setIsAnimating(false);
    }, 150);
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
      color: data.color || "#1C1917",
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

  useKeyboardShortcuts({
    onCreateEvent: handleCreate,
    onToggleSearch: () => setSearchOpen(!searchOpen),
    onGoToToday: handleToday,
    onNext: handleNext,
    onPrev: handlePrev,
    onDayView: () => handleViewChange("daily"),
    onWeekView: () => handleViewChange("weekly"),
    onMonthView: () => handleViewChange("monthly"),
    onYearView: () => handleViewChange("yearly"),
  });

  const viewTabs: { id: ViewType; label: string }[] = [
    { id: "daily", label: "Day" },
    { id: "weekly", label: "Week" },
    { id: "monthly", label: "Month" },
    { id: "yearly", label: "Year" },
    { id: "agenda", label: "Agenda" },
  ];

  return (
    <div className="h-screen flex bg-[var(--bg-primary)]">
      {/* Left Sidebar - Glass Morphism */}
      <aside className="w-72 border-r border-[var(--border)] p-4 flex flex-col gap-4 glass-light overflow-hidden">
        <div className="flex items-center gap-2 px-2">
          <CalendarIcon className="w-5 h-5 text-[var(--text-primary)]" />
          <span className="text-xl font-serif tracking-tight text-[var(--text-primary)]">VanCal</span>
        </div>
        
        <MiniCalendar 
          currentDate={date} 
          selectedDate={date} 
          events={events} 
          onDateSelect={(d) => { setDate(d); handleViewChange("daily"); }} 
        />
        
        {/* Quick Actions */}
        <div className="space-y-2">
          <button
            onClick={handleCreate}
            className="w-full flex items-center gap-3 px-3 py-2.5 bg-[var(--accent)] text-[var(--accent-contrast)] rounded-lg hover-lift shadow-sm transition-all duration-150 press-scale"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New Event</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-primary)]">
          <div className="flex items-center gap-4">
            {/* View Tabs - Underline indicator */}
            <div className="flex items-center bg-[var(--bg-secondary)] rounded-lg p-1">
              {viewTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleViewChange(tab.id)}
                  className={cn(
                    "relative px-3 py-1.5 text-sm rounded-md transition-all duration-150",
                    view === tab.id 
                      ? "text-[var(--text-primary)]" 
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  )}
                >
                  {tab.label}
                  {view === tab.id && (
                    <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-[var(--accent)] rounded-full animate-scale-in" />
                  )}
                </button>
              ))}
            </div>
            
            {/* Navigation */}
            <div className="flex items-center gap-1">
              <button 
                onClick={handlePrev} 
                className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-all duration-150 press-scale"
              >
                <ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
              <button 
                onClick={handleToday} 
                className="px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-all duration-150 font-medium press-scale"
              >
                Today
              </button>
              <button 
                onClick={handleNext} 
                className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-all duration-150 press-scale"
              >
                <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
              <span className="ml-2 text-lg font-serif text-[var(--text-primary)] tracking-tight">{dateLabel}</span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setSearchOpen(!searchOpen)} 
              className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-all duration-150 press-scale" 
              title="Search (Ctrl+F)"
            >
              <Search className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
            <button 
              onClick={() => setImportExportOpen(true)} 
              className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-all duration-150 press-scale" 
              title="Import/Export"
            >
              <Download className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
            <button 
              onClick={() => setAiAssistantOpen(true)} 
              className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-all duration-150 press-scale" 
              title="AI Assistant (Ctrl+Shift+A)"
            >
              <Sparkles className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
            <button 
              onClick={() => setSettingsOpen(true)} 
              className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-all duration-150 press-scale" 
              title="Settings"
            >
              <Settings className="w-5 h-5 text-[var(--text-muted)]" />
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

        <VaultWarningBanner onSetupClick={() => setVaultSetupOpen(true)} />

        <VaultSetupModal
          isOpen={vaultSetupOpen}
          onClose={() => setVaultSetupOpen(false)}
          onSuccess={() => setVaultSetupOpen(false)}
        />

        <main className={cn(
          "flex-1 overflow-auto",
          isAnimating ? "opacity-0 animate-view-exit" : "animate-view-enter"
        )}>
          {view === "daily" && (
            <DayView 
              date={date} 
              events={events} 
              buffers={[]} 
              systemColors={SYSTEM_COLORS} 
              onSlotClick={handleSlotClick} 
              onEventClick={handleEdit} 
              onEventMove={(id: string, start: number, end: number) => updateEvent(id, { startTime: start, endTime: end })} 
            />
          )}
          {view === "weekly" && (
            <WeekView 
              date={date} 
              events={events} 
              buffers={[]} 
              systemColors={SYSTEM_COLORS} 
              onSlotClick={handleSlotClick} 
              onEventClick={handleEdit} 
              onEventMove={(id: string, start: number, end: number) => updateEvent(id, { startTime: start, endTime: end })} 
            />
          )}
          {view === "monthly" && (
            <MonthView 
              date={date} 
              events={events} 
              buffers={[]} 
              systemColors={SYSTEM_COLORS} 
              onDateClick={(d: Date) => { setDate(d); handleViewChange("daily"); }} 
              onEventClick={handleEdit} 
              onEventMove={(id: string, start: number, end: number) => updateEvent(id, { startTime: start, endTime: end })} 
            />
          )}
          {view === "yearly" && (
            <YearView 
              date={date} 
              events={events} 
              buffers={[]} 
              systemColors={SYSTEM_COLORS} 
              onDateClick={(d: Date) => { setDate(d); handleViewChange("monthly"); }} 
              onEventClick={handleEdit} 
              onYearChange={(year) => setDate(new Date(year, 0, 1))}
            />
          )}
          {view === "agenda" && (
            <AgendaView 
              date={date} 
              events={events} 
              buffers={[]} 
              systemColors={SYSTEM_COLORS} 
              onEventClick={handleEdit} 
            />
          )}
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