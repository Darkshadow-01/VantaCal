"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface UseKeyboardShortcutsProps {
  onCreateEvent: () => void;
  onToggleSearch: () => void;
  onGoToToday: () => void;
  onNext: () => void;
  onPrev: () => void;
  onDayView: () => void;
  onWeekView: () => void;
  onMonthView: () => void;
  onYearView: () => void;
}

export function useKeyboardShortcuts({
  onCreateEvent,
  onToggleSearch,
  onGoToToday,
  onNext,
  onPrev,
  onDayView,
  onWeekView,
  onMonthView,
  onYearView,
}: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in input/textarea
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
      return;
    }

    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

    // Ctrl/Cmd + key combinations
    if (ctrlOrCmd) {
      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault();
          onCreateEvent();
          break;
        case "f":
          e.preventDefault();
          onToggleSearch();
          break;
        case "d":
          e.preventDefault();
          onDayView();
          break;
        case "w":
          e.preventDefault();
          onWeekView();
          break;
        case "m":
          e.preventDefault();
          onMonthView();
          break;
        case "y":
          e.preventDefault();
          onYearView();
          break;
      }
      return;
    }

    // Regular keys
    switch (e.key) {
      case "t":
        onGoToToday();
        break;
      case "ArrowRight":
        onNext();
        break;
      case "ArrowLeft":
        onPrev();
        break;
      case "d":
        onDayView();
        break;
      case "w":
        onWeekView();
        break;
      case "m":
        onMonthView();
        break;
      case "y":
        onYearView();
        break;
      case "?":
        e.preventDefault();
        // Could show help modal
        break;
      case "Escape":
        // Global escape - could close modals
        break;
    }
  }, [onCreateEvent, onToggleSearch, onGoToToday, onNext, onPrev, onDayView, onWeekView, onMonthView, onYearView]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

export const KEYBOARD_SHORTCUTS = [
  { key: "N / Ctrl+N", action: "Create new event" },
  { key: "T", action: "Go to today" },
  { key: "← / →", action: "Navigate previous/next" },
  { key: "D", action: "Switch to day view" },
  { key: "W", action: "Switch to week view" },
  { key: "M", action: "Switch to month view" },
  { key: "Y", action: "Switch to year view" },
  { key: "Ctrl+F / Cmd+F", action: "Search" },
  { key: "?", action: "Show keyboard shortcuts" },
  { key: "Esc", action: "Close modal / Cancel" },
];