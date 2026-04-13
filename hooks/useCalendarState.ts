"use client";

import { useState, useCallback, useMemo } from "react";
import type { ViewType, TodayDate } from "@/lib/types";
import { DAYS, MONTHS } from "@/lib/constants";

export function useCalendarState() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>("month");
  const [miniCalSelectedDate, setMiniCalSelectedDate] = useState<Date | null>(null);

  const today = useMemo((): TodayDate => {
    const now = new Date();
    return { day: now.getDate(), month: now.getMonth(), year: now.getFullYear() };
  }, []);

  const navigate = useCallback((direction: "prev" | "next") => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (view === "day") {
        newDate.setDate(prev.getDate() + (direction === "next" ? 1 : -1));
      } else if (view === "week") {
        newDate.setDate(prev.getDate() + (direction === "next" ? 7 : -7));
      } else if (view === "month") {
        newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
      } else if (view === "year") {
        newDate.setFullYear(prev.getFullYear() + (direction === "next" ? 1 : -1));
      }
      return newDate;
    });
    setMiniCalSelectedDate(null);
  }, [view]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
    setMiniCalSelectedDate(null);
  }, []);

  const goToDate = useCallback((date: Date) => {
    setCurrentDate(date);
    if (view !== "year") {
      setMiniCalSelectedDate(date);
    }
  }, [view]);

  const changeView = useCallback((newView: ViewType) => {
    setView(newView);
  }, []);

  const getTitle = useCallback(() => {
    if (view === "day") {
      return `${DAYS[currentDate.getDay()]}, ${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
    } else if (view === "week") {
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (view === "month") {
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else {
      return `${currentDate.getFullYear()}`;
    }
  }, [currentDate, view]);

  return {
    currentDate,
    setCurrentDate,
    view,
    setView: changeView,
    today,
    navigate,
    goToToday,
    goToDate,
    getTitle,
    miniCalSelectedDate,
    setMiniCalSelectedDate,
  };
}
