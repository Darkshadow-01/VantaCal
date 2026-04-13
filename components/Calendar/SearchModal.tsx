"use client";

import { useState, useMemo, ReactNode } from "react";
import { Search, X, ChevronRight, MapPin, Calendar } from "lucide-react";
import { MONTHS } from "@/lib/constants";

interface SearchModalProps<T extends { id?: string; title: string; startTime?: number; location?: string; system?: string } = any> {
  isOpen: boolean;
  onClose: () => void;
  events: T[];
  onSelectEvent: (event: T) => void;
}

export function SearchModal<T extends { id?: string; title: string; startTime?: number; location?: string; system?: string } = any>({ 
  isOpen, 
  onClose, 
  events, 
  onSelectEvent 
}: SearchModalProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"all" | "title" | "location" | "date">("all");

  const searchResults = useMemo(() => {
    if (!isOpen || !searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    
    return events.filter(e => {
      if (searchType === "title" || searchType === "all") {
        if (e.title?.toLowerCase().includes(query)) return true;
      }
      if (searchType === "location" || searchType === "all") {
        if (e.location?.toLowerCase().includes(query)) return true;
      }
      if (searchType === "date" || searchType === "all") {
        if (e.startTime) {
          const dateStr = new Date(e.startTime).toDateString().toLowerCase();
          if (dateStr.includes(query)) return true;
        }
      }
      if (e.system?.toLowerCase().includes(query)) return true;
      return false;
    });
  }, [searchQuery, events, searchType, isOpen]);

  const formatEventDate = (timestamp?: number) => {
    if (!timestamp) return "Unknown date";
    const date = new Date(timestamp);
    return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1A1D24] rounded-xl w-full max-w-lg border border-gray-200 dark:border-[#333] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 dark:border-[#333]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events by title, location, or date..."
              autoFocus
              className="w-full bg-gray-100 dark:bg-[#252830] border-0 rounded-lg pl-10 pr-10 py-3 text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5B8DEF]"
            />
            <button onClick={onClose} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-[#333] rounded">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          
          <div className="flex gap-2 mt-3">
            {(["all", "title", "location", "date"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSearchType(type)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  searchType === type 
                    ? "bg-[#5B8DEF] text-white" 
                    : "bg-gray-100 dark:bg-[#252830] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#333]"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {searchResults.length > 0 ? (
            <div className="p-2">
              {searchResults.map((event, idx) => (
                <button
                  key={event.id || idx}
                  onClick={() => { onSelectEvent(event); onClose(); }}
                  className="w-full p-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-[#252830] rounded-lg text-left transition-colors"
                >
                  <div className="w-3 h-3 rounded-full bg-[#5B8DEF]" />
                  <div className="flex-1">
                    <p className="text-gray-900 dark:text-white font-medium">{event.title}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatEventDate(event.startTime)}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="p-8 text-center text-gray-500">
              No results found for &quot;{searchQuery}&quot;
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Start typing to search events
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
