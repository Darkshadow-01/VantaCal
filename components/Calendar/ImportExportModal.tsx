"use client";

import { useState, useRef } from "react";
import { format, parseISO } from "date-fns";
import { Download, Upload, X } from "lucide-react";
import type { CalendarEvent } from "@/lib/types";

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  onImport: (events: CalendarEvent[]) => void;
}

export function ImportExportModal({ isOpen, onClose, events, onImport }: ImportExportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string>("");

  const exportToICS = () => {
    const icsEvents = events.map(event => {
      const startDate = event.startTime ? new Date(event.startTime) : new Date();
      const endDate = event.endTime ? new Date(event.endTime) : new Date(startDate.getTime() + 3600000);
      
      const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      
      return [
        "BEGIN:VEVENT",
        `DTSTART:${formatDate(startDate)}`,
        `DTEND:${formatDate(endDate)}`,
        `SUMMARY:${event.title}`,
        event.description ? `DESCRIPTION:${event.description}` : "",
        event.location ? `LOCATION:${event.location}` : "",
        "END:VEVENT",
      ].filter(Boolean).join("\r\n");
    });

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//VanCal//EN",
      ...icsEvents,
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calendar-export-${format(new Date(), "yyyy-MM-dd")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedEvents = parseICS(content);
        onImport(importedEvents);
        setImportStatus(`Successfully imported ${importedEvents.length} events`);
        setTimeout(() => setImportStatus(""), 3000);
      } catch (error) {
        setImportStatus("Failed to parse ICS file");
        setTimeout(() => setImportStatus(""), 3000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const parseICS = (content: string): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const lines = content.split(/\r?\n/);
    let currentEvent: Partial<CalendarEvent> | null = null;

    for (const line of lines) {
      if (line === "BEGIN:VEVENT") {
        currentEvent = { title: "", color: "#4F8DFD", type: "event", calendarId: "personal", system: "Work" };
      } else if (line === "END:VEVENT" && currentEvent) {
        if (currentEvent.startTime) {
          const now = Date.now();
          events.push({
            ...currentEvent,
            id: `imported-${now}-${Math.random()}`,
            allDay: false,
            version: 1,
            updatedAt: now,
          } as CalendarEvent);
        }
        currentEvent = null;
      } else if (currentEvent) {
        if (line.startsWith("DTSTART")) {
          const dateStr = line.split(":")[1];
          currentEvent.startTime = parseICSDate(dateStr);
        } else if (line.startsWith("DTEND")) {
          const dateStr = line.split(":")[1];
          currentEvent.endTime = parseICSDate(dateStr);
        } else if (line.startsWith("SUMMARY")) {
          currentEvent.title = line.split(":")[1];
        } else if (line.startsWith("DESCRIPTION")) {
          currentEvent.description = line.split(":").slice(1).join(":");
        } else if (line.startsWith("LOCATION")) {
          currentEvent.location = line.split(":").slice(1).join(":");
        }
      }
    }

    return events;
  };

  const parseICSDate = (dateStr: string): number => {
    try {
      if (dateStr.includes("T")) {
        const year = parseInt(dateStr.slice(0, 4));
        const month = parseInt(dateStr.slice(4, 6)) - 1;
        const day = parseInt(dateStr.slice(6, 8));
        const hour = parseInt(dateStr.slice(9, 11)) || 0;
        const minute = parseInt(dateStr.slice(11, 13)) || 0;
        return new Date(Date.UTC(year, month, day, hour, minute)).getTime();
      }
      return Date.now();
    } catch {
      return Date.now();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-[#1A1D24] rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-[#333] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-[#333]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Import / Export</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-[#252830] rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Export */}
          <div className="p-4 rounded-xl border border-gray-200 dark:border-[#333]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <Download className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Export Calendar</h3>
                <p className="text-xs text-gray-500">Download all events as .ics file</p>
              </div>
            </div>
            <button
              onClick={exportToICS}
              className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Export to ICS
            </button>
          </div>

          {/* Import */}
          <div className="p-4 rounded-xl border border-gray-200 dark:border-[#333]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Import Calendar</h3>
                <p className="text-xs text-gray-500">Import events from .ics file</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".ics"
              onChange={handleFileImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Choose File
            </button>
            {importStatus && (
              <p className={`text-xs mt-2 ${importStatus.includes("Failed") ? "text-red-500" : "text-green-500"}`}>
                {importStatus}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}