"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Settings } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { TimezoneService } from "@/src/domain/calendar/services/TimezoneService";

const SETTINGS_KEY = "calendar-settings";

function getInitialSettings(): Settings {
  const defaultWithTimezone = {
    ...DEFAULT_SETTINGS,
    timezone: TimezoneService.getDefault(),
  };
  
  if (typeof window === 'undefined') {
    return defaultWithTimezone;
  }
  
  const saved = localStorage.getItem(SETTINGS_KEY);
  if (saved) {
    try {
      return { ...defaultWithTimezone, ...JSON.parse(saved) };
    } catch {
      return defaultWithTimezone;
    }
  }
  
  return defaultWithTimezone;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window === 'undefined') {
      return { ...DEFAULT_SETTINGS, timezone: TimezoneService.getDefault() };
    }
    
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, timezone: TimezoneService.getDefault(), ...JSON.parse(saved) };
      } catch (error) {
        console.error("Failed to parse settings:", error);
      }
    }
    return { ...DEFAULT_SETTINGS, timezone: TimezoneService.getDefault() };
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.darkMode]);

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
  }, []);

  return {
    settings,
    setSettings,
    updateSetting,
    toggleDarkMode,
  };
}
