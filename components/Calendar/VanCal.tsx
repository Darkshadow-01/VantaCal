"use client";

import { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { 
  Calendar as CalendarIcon, List, Grid3X3, LayoutGrid, Sparkles, Plus,
  ChevronLeft, ChevronRight, X, Zap, Clock, CheckSquare, Square
} from "lucide-react";
import { useAuth } from "@clerk/react";
import { DailyView } from "./DailyView";
import { WeeklyView } from "./WeeklyView";
import { MonthlyView } from "./MonthlyView";
import { YearlyView } from "./YearlyView";
import { EventModal } from "./EventModal";
import { QuickAddInput } from "./QuickAddInput";
import { MiniMonthView } from "./MiniMonthView";
import { useEncryptedEvents } from "@/lib/use-encrypted-events";
import type { EventData } from "@/lib/use-encrypted-events";
import { hasMasterKey } from "@/lib/e2ee";
import { analyzeScheduleWithPredictions, BufferBlock } from "@/lib/schedulerWithBuffers";
import { NotificationCenter } from "./Notifications";

export type CalendarViewType = "daily" | "weekly" | "monthly" | "yearly";

interface ScheduleWithBuffers {
  events: Array<{
    id: string;
    title: string;
    system: "Health" | "Work" | "Relationships";
    startTime: number;
    endTime: number;
    plannedDuration: number;
    predictedDuration?: number;
    recommendedBuffer?: number;
    delayRisk?: "low" | "medium" | "high";
    actualEndTime?: number;
  }>;
  buffers: BufferBlock[];
  totalBufferMinutes: number;
  optimizationScore: number;
  riskAssessment: {
    highRiskEvents: string[];
    recommendedBuffers: Array<{ eventTitle: string; bufferMinutes: number; reason: string }>;
  };
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

const VIEW_TABS = [
  { id: "daily" as CalendarViewType, label: "Day", icon: List },
  { id: "weekly" as CalendarViewType, label: "Week", icon: CalendarIcon },
  { id: "monthly" as CalendarViewType, label: "Month", icon: Grid3X3 },
  { id: "yearly" as CalendarViewType, label: "Year", icon: LayoutGrid },
];

const SYSTEM_COLORS = {
  Health: {
    bg: "bg-green-500",
    bgLight: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-500",
    text: "text-green-700 dark:text-green-300",
    hover: "hover:bg-green-50 dark:hover:bg-green-900/30",
  },
  Work: {
    bg: "bg-blue-500",
    bgLight: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-500",
    text: "text-blue-700 dark:text-blue-300",
    hover: "hover:bg-blue-50 dark:hover:bg-blue-900/30",
  },
  Relationships: {
    bg: "bg-purple-500",
    bgLight: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-600",
    text: "text-purple-700 dark:text-purple-300",
    hover: "hover:bg-purple-50 dark:hover:bg-purple-900/30",
  },
};

export function VanCal() {
  const { userId } = useAuth();
  const [currentView, setCurrentView] = useState<CalendarViewType>("weekly");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduleAnalysis, setScheduleAnalysis] = useState<ScheduleWithBuffers | null>(null);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour?: number } | null>(null);

  // Selection state
  const [selectedEvents, setSelectedEvents] = useState<EventData[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);

  // Sidebar state
  const [showSidebar, setShowSidebar] = useState(false);

  const { events, isDecrypting, error, createEvent, updateEvent, deleteEvent, refresh } = useEncryptedEvents(userId || undefined);

  if (!hasMasterKey()) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <CalendarIcon className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Calendar Locked
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Unlock the app to view your events.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isDecrypting) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Decrypting events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center space-y-4">
          <p className="text-sm text-red-500">{error}</p>
          <button onClick={refresh} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Retry
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (userId && events && events.length > 0) {
      loadScheduleAnalysis();
    }
  }, [userId, events]);

  const loadScheduleAnalysis = async () => {
    if (!userId || !events) return;

    const eventData = events.map((e) => ({
      id: e._id!,
      title: e.title,
      system: e.system as "Health" | "Work" | "Relationships",
      startTime: e.startTime,
      endTime: e.endTime,
    }));

    try {
      const analysis = await analyzeScheduleWithPredictions(userId, eventData);
      setScheduleAnalysis(analysis);
      generateAIInsights(analysis);
    } catch (error) {
      console.error("Failed to analyze schedule:", error);
    }
  };

  const generateAIInsights = (analysis: ScheduleWithBuffers) => {
    const insights: string[] = [];

    if (analysis.optimizationScore >= 80) {
      insights.push("Your schedule is well-optimized with good buffer coverage.");
    } else if (analysis.optimizationScore < 60) {
      insights.push("Consider adding more buffer time between activities.");
    }

    if (analysis.riskAssessment.highRiskEvents.length > 0) {
      insights.push(`${analysis.riskAssessment.highRiskEvents.length} events have high delay risk.`);
    }

    const highBufferEvents = analysis.riskAssessment.recommendedBuffers.slice(0, 2);
    if (highBufferEvents.length > 0) {
      insights.push(`Tip: Add ${highBufferEvents[0].bufferMinutes}min buffer after "${highBufferEvents[0].eventTitle}".`);
    }

    setAiInsights(insights);
  };

  const handleNavigate = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      switch (currentView) {
        case "daily":
          newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
          break;
        case "weekly":
          newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
          break;
        case "monthly":
          newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
          break;
        case "yearly":
          newDate.setFullYear(newDate.getFullYear() + (direction === "next" ? 1 : -1));
          break;
      }
      return newDate;
    });
  };

  const handleToday = () => setCurrentDate(new Date());

  // Event handlers
  const handleCreateEvent = (slot?: { date: Date; hour?: number }) => {
    setEditingEvent(null);
    setSelectedSlot(slot || null);
    setShowModal(true);
  };

  const handleEditEvent = (event: EventData, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent(event);
    setSelectedSlot(null);
    setShowModal(true);
  };

  const handleSaveEvent = async (data: EventFormData) => {
    if (!userId) return;

    try {
      const eventData = {
        ...data,
        userId,
        color: SYSTEM_COLORS[data.system].bg,
      };

      if (editingEvent && editingEvent._id) {
        await updateEvent(editingEvent._id, {
          ...data,
          color: SYSTEM_COLORS[data.system].bg,
        });
      } else {
        await createEvent(eventData);
      }

      setTimeout(() => loadScheduleAnalysis(), 500);
      setShowModal(false);
      setEditingEvent(null);
      setSelectedSlot(null);
    } catch (error) {
      console.error("Failed to save event:", error);
    }
  };

  const handleDeleteEvent = async () => {
    if (!editingEvent) return;

    try {
      if (editingEvent._id) await deleteEvent(editingEvent._id);
      setTimeout(() => loadScheduleAnalysis(), 500);
      setShowModal(false);
      setEditingEvent(null);
      setSelectedSlot(null);
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  // Selection handlers
  const handleEventSelect = (event: EventData) => {
    const isSelected = selectedEvents.some((e) => e._id === event._id);
    if (isSelected) {
      setSelectedEvents(selectedEvents.filter((e) => e._id !== event._id));
    } else {
      setSelectedEvents([...selectedEvents, event]);
    }
  };

  const handleBulkDelete = async () => {
    for (const event of selectedEvents) {
      if (event._id) await deleteEvent(event._id);
    }
    setSelectedEvents([]);
    setTimeout(() => loadScheduleAnalysis(), 500);
  };

  const handleBulkSystemChange = async (system: "Health" | "Work" | "Relationships") => {
    for (const event of selectedEvents) {
      if (event._id) {
        await updateEvent(event._id, {
          system,
          color: SYSTEM_COLORS[system].bg,
        });
      }
    }
    setTimeout(() => loadScheduleAnalysis(), 500);
  };

  const handleQuickAdd = async (data: {
    title: string;
    startTime: number;
    endTime: number;
    system: "Health" | "Work" | "Relationships";
    recurrence?: string;
  }) => {
    if (!userId) return;

    await createEvent({
      ...data,
      userId,
      color: SYSTEM_COLORS[data.system].bg,
      allDay: false,
    });

    setTimeout(() => loadScheduleAnalysis(), 500);
  };

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });

  const getDateRangeLabel = () => {
    switch (currentView) {
      case "daily":
        return format(currentDate, "EEEE, MMMM d, yyyy");
      case "weekly":
        return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
      case "monthly":
        return format(currentDate, "MMMM yyyy");
      case "yearly":
        return format(currentDate, "yyyy");
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-4 flex-wrap">
            {/* VanCal Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  VanCal
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">AI-Powered Calendar</p>
              </div>
            </div>
            
            <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 hidden lg:block" />
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {getDateRangeLabel()}
            </h2>
            
            <button
              onClick={() => handleCreateEvent({ date: currentDate })}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Event</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* View Switcher */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {VIEW_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentView(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentView === tab.id
                        ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleNavigate("prev")}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => handleNavigate("next")}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Sidebar Toggle */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <CalendarIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Add */}
        <div className="px-4 py-3 border-b dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10">
          <QuickAddInput
            onParse={handleQuickAdd}
            systems={[
              { name: "Health", color: SYSTEM_COLORS.Health.bg },
              { name: "Work", color: SYSTEM_COLORS.Work.bg },
              { name: "Relationships", color: SYSTEM_COLORS.Relationships.bg },
            ]}
          />
        </div>

        {/* Bulk Operations Bar */}
        {selectedEvents.length > 0 && (
          <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                {selectedEvents.length} selected
              </span>
              <button
                onClick={() => setSelectedEvents([])}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900"
              >
                Clear
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkSystemChange("Health")}
                className="px-3 py-1 text-sm bg-green-500 text-white rounded-full hover:bg-green-600"
              >
                Health
              </button>
              <button
                onClick={() => handleBulkSystemChange("Work")}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded-full hover:bg-blue-600"
              >
                Work
              </button>
              <button
                onClick={() => handleBulkSystemChange("Relationships")}
                className="px-3 py-1 text-sm bg-purple-500 text-white rounded-full hover:bg-purple-600"
              >
                Relationships
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* System Legend */}
        <div className="flex items-center gap-6 px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
          {Object.entries(SYSTEM_COLORS).map(([system, colors]) => (
            <div key={system} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
              <span className="text-sm text-gray-600 dark:text-gray-400">{system}</span>
            </div>
          ))}
          
          <div className="ml-auto flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded border border-dashed border-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Buffer</span>
          </div>
          
          {scheduleAnalysis && (
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Score: {scheduleAnalysis.optimizationScore}%
              </span>
            </div>
          )}
        </div>

        {/* AI Insights */}
        {aiInsights.length > 0 && (
          <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 border-b dark:border-gray-700">
            <div className="flex items-start gap-2">
              <Sparkles className="w-5 h-5 text-purple-500 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  AI Insights
                </p>
                {aiInsights.map((insight, idx) => (
                  <p key={idx} className="text-xs text-purple-600 dark:text-purple-400">
                    {insight}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex gap-4">
        {/* Calendar Views */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {currentView === "daily" && (
            <DailyView
              date={currentDate}
              events={events || []}
              buffers={scheduleAnalysis?.buffers || []}
              systemColors={SYSTEM_COLORS}
              onSlotClick={(date, hour) => handleCreateEvent({ date, hour })}
              onEventClick={handleEditEvent}
              selectedEvents={selectedEvents}
              onEventSelect={handleEventSelect}
            />
          )}
          {currentView === "weekly" && (
            <WeeklyView
              date={currentDate}
              events={events || []}
              buffers={scheduleAnalysis?.buffers || []}
              systemColors={SYSTEM_COLORS}
              onSlotClick={(date, hour) => handleCreateEvent({ date, hour })}
              onEventClick={handleEditEvent}
              selectedEvents={selectedEvents}
              onEventSelect={handleEventSelect}
            />
          )}
          {currentView === "monthly" && (
            <MonthlyView
              date={currentDate}
              events={events || []}
              buffers={scheduleAnalysis?.buffers || []}
              systemColors={SYSTEM_COLORS}
              onDateClick={(date) => handleCreateEvent({ date })}
              onEventClick={handleEditEvent}
              selectedEvents={selectedEvents}
              onEventSelect={handleEventSelect}
            />
          )}
          {currentView === "yearly" && (
            <YearlyView
              date={currentDate}
              events={events || []}
              buffers={scheduleAnalysis?.buffers || []}
              systemColors={SYSTEM_COLORS}
              onDateClick={(date) => {
                setCurrentDate(date);
                setCurrentView("monthly");
              }}
              onEventClick={handleEditEvent}
            />
          )}
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="w-80 space-y-4 animate-in slide-in-from-right duration-200">
            {/* Mini Calendar */}
            <MiniMonthView
              selectedDate={currentDate}
              events={events || []}
              onDateSelect={(date) => {
                setCurrentDate(date);
                setCurrentView("daily");
              }}
            />

            {/* Notifications */}
            <NotificationCenter
              events={events || []}
              reminders={[]}
              onReminderChange={() => {}}
            />
          </div>
        )}
      </div>

      {/* Event Modal */}
      {showModal && (
        <EventModal
          event={editingEvent}
          selectedSlot={selectedSlot}
          systemColors={SYSTEM_COLORS}
          onSave={handleSaveEvent}
          onDelete={editingEvent ? handleDeleteEvent : undefined}
          onClose={() => {
            setShowModal(false);
            setEditingEvent(null);
            setSelectedSlot(null);
          }}
        />
      )}
    </div>
  );
}

// Export as both names for compatibility
export const CalendarView = VanCal;
export default VanCal;
