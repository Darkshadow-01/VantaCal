"use client";

import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

type ViewType = "daily" | "weekly" | "monthly" | "yearly";

interface TopbarProps {
  currentDate: Date;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onDateChange: (date: Date) => void;
  onCreateEvent?: () => void;
}

const views: { id: ViewType; label: string }[] = [
  { id: "daily", label: "Day" },
  { id: "weekly", label: "Week" },
  { id: "monthly", label: "Month" },
  { id: "yearly", label: "Year" },
];

export function Topbar({ 
  currentDate, 
  currentView, 
  onViewChange, 
  onDateChange,
  onCreateEvent 
}: TopbarProps) {

  const getDateRangeLabel = () => {
    switch (currentView) {
      case "daily":
        return format(currentDate, "EEEE, MMMM d, yyyy");
      case "weekly":
        const weekStart = subDays(currentDate, currentDate.getDay());
        const weekEnd = addDays(weekStart, 6);
        return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
      case "monthly":
        return format(currentDate, "MMMM yyyy");
      case "yearly":
        return format(currentDate, "yyyy");
    }
  };

  const handlePrevious = () => {
    let newDate = new Date(currentDate);
    switch (currentView) {
      case "daily":
        newDate = subDays(currentDate, 1);
        break;
      case "weekly":
        newDate = subWeeks(currentDate, 1);
        break;
      case "monthly":
        newDate = subMonths(currentDate, 1);
        break;
      case "yearly":
        newDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1);
        break;
    }
    onDateChange(newDate);
  };

  const handleNext = () => {
    let newDate = new Date(currentDate);
    switch (currentView) {
      case "daily":
        newDate = addDays(currentDate, 1);
        break;
      case "weekly":
        newDate = addWeeks(currentDate, 1);
        break;
      case "monthly":
        newDate = addMonths(currentDate, 1);
        break;
      case "yearly":
        newDate = new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1);
        break;
    }
    onDateChange(newDate);
  };

  return (
    <header className="h-16 px-6 flex items-center justify-between bg-background dark:bg-[#2B262C] border-b border-border dark:border-gray-800">
      {/* Left: Date Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => onDateChange(new Date())}>
          Today
        </Button>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handlePrevious}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <h1 className="text-lg font-semibold text-foreground dark:text-[#F5F1E8]">
          {getDateRangeLabel()}
        </h1>
      </div>

      {/* Center: View Switcher */}
      <div className="flex items-center gap-1 p-1 bg-muted dark:bg-gray-800 rounded-lg">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150",
              currentView === view.id
                ? "bg-background dark:bg-gray-700 text-foreground dark:text-[#F5F1E8] shadow-sm"
                : "text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-[#F5F1E8]"
            )}
          >
            {view.label}
          </button>
        ))}
      </div>

      {/* Right: Add Event */}
      {onCreateEvent && (
        <Button onClick={onCreateEvent}>
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>
      )}
    </header>
  );
}
