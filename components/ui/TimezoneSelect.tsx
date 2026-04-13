"use client";

import { useState, useMemo } from "react";
import { TimezoneService } from "@/src/domain/calendar/services/TimezoneService";
import { Search, ChevronDown, Check } from "lucide-react";

interface TimezoneSelectProps {
  value: string;
  onChange: (timezone: string) => void;
}

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Vancouver",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
  "UTC",
];

export function TimezoneSelect({ value, onChange }: TimezoneSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const allTimezones = useMemo(() => TimezoneService.getAvailableZones(), []);

  const filteredTimezones = useMemo(() => {
    if (!search) return allTimezones;
    const lower = search.toLowerCase();
    return allTimezones.filter((tz) => tz.toLowerCase().includes(lower));
  }, [allTimezones, search]);

  const showCommonOnly = !search && filteredTimezones.length > 20;
  const displayTimezones = showCommonOnly ? COMMON_TIMEZONES.filter(tz => filteredTimezones.includes(tz)) : filteredTimezones;

  const getTimezoneOffset = (tz: string): string => {
    try {
      const offset = TimezoneService.getOffset(new Date(), tz);
      const sign = offset >= 0 ? "+" : "";
      const hours = Math.floor(Math.abs(offset));
      const mins = (Math.abs(offset) % 1) * 60;
      return `UTC${sign}${offset}:${mins.toString().padStart(2, "0")}`;
    } catch {
      return "";
    }
  };

  const getTimezoneCity = (tz: string): string => {
    const parts = tz.split("/");
    return parts[parts.length - 1].replace(/_/g, " ");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="text-sm">{getTimezoneCity(value)}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">({getTimezoneOffset(value)})</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-80 overflow-hidden">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search timezone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-md text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-60">
            {displayTimezones.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                No timezones found
              </div>
            ) : (
              displayTimezones.map((tz) => (
                <button
                  key={tz}
                  type="button"
                  onClick={() => {
                    onChange(tz);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    tz === value ? "bg-primary/10 text-primary" : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <span className="flex flex-col">
                    <span className="text-sm font-medium">{getTimezoneCity(tz)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{tz}</span>
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {getTimezoneOffset(tz)}
                  </span>
                  {tz === value && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TimezoneSelect;