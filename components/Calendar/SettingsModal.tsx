"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Settings } from "@/lib/types";
import { TimezoneSelect } from "@/components/ui/TimezoneSelect";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

export function SettingsModal({ isOpen, onClose, settings, onUpdateSetting }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState("calendar");

  if (!isOpen) return null;

  const tabs = [
    { id: "calendar", label: "Calendar" },
    { id: "appearance", label: "Appearance" },
    { id: "notifications", label: "Notifications" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1A1D24] rounded-xl w-full max-w-2xl border border-gray-200 dark:border-[#333] shadow-2xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex border-b border-gray-200 dark:border-[#333]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-gray-900 dark:text-white border-b-2 border-[#5B8DEF] bg-gray-100 dark:bg-[#252830]"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button onClick={onClose} className="ml-auto p-4 hover:bg-gray-100 dark:hover:bg-[#252830] rounded">
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {activeTab === "calendar" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Time Zone</label>
                <TimezoneSelect 
                  value={settings.timezone} 
                  onChange={(tz) => onUpdateSetting("timezone", tz)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Default View</label>
                <select 
                  value={settings.defaultView} 
                  onChange={(e) => onUpdateSetting("defaultView", e.target.value as any)}
                  className="w-full bg-white dark:bg-[#252830] border border-gray-300 dark:border-[#333] rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Start Week On</label>
                <select 
                  value={settings.startWeekOn} 
                  onChange={(e) => onUpdateSetting("startWeekOn", e.target.value as any)}
                  className="w-full bg-white dark:bg-[#252830] border border-gray-300 dark:border-[#333] rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                >
                  <option value="sunday">Sunday</option>
                  <option value="monday">Monday</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">Show Weekends</p>
                  <p className="text-xs text-gray-500">Display Saturday and Sunday in views</p>
                </div>
                <button
                  onClick={() => onUpdateSetting("showWeekends", !settings.showWeekends)}
                  className={`w-12 h-6 rounded-full transition-colors ${settings.showWeekends ? "bg-[#5B8DEF]" : "bg-gray-300 dark:bg-gray-600"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.showWeekends ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Working Hours</label>
                <div className="flex items-center gap-4">
                  <select
                    value={settings.workingHours?.start ?? 9}
                    onChange={(e) => onUpdateSetting("workingHours", { ...settings.workingHours, start: parseInt(e.target.value) })}
                    className="bg-white dark:bg-[#252830] border border-gray-300 dark:border-[#333] rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                    ))}
                  </select>
                  <span className="text-gray-500">to</span>
                  <select
                    value={settings.workingHours?.end ?? 17}
                    onChange={(e) => onUpdateSetting("workingHours", { ...settings.workingHours, end: parseInt(e.target.value) })}
                    className="bg-white dark:bg-[#252830] border border-gray-300 dark:border-[#333] rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500">Events outside working hours may be shown differently</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">Focus Time</p>
                  <p className="text-xs text-gray-500">Block time for deep work (declines meetings)</p>
                </div>
                <button
                  onClick={() => onUpdateSetting("focusTimeEnabled", !settings.focusTimeEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${settings.focusTimeEnabled ? "bg-[#5B8DEF]" : "bg-gray-300 dark:bg-gray-600"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.focusTimeEnabled ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>

              {settings.focusTimeEnabled && (
                <div className="space-y-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">Focus Hours</label>
                  <div className="flex items-center gap-4">
                    <select
                      value={settings.focusTimeStart ?? 9}
                      onChange={(e) => onUpdateSetting("focusTimeStart", parseInt(e.target.value))}
                      className="bg-white dark:bg-[#252830] border border-gray-300 dark:border-[#333] rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                      ))}
                    </select>
                    <span className="text-gray-500">to</span>
                    <select
                      value={settings.focusTimeEnd ?? 17}
                      onChange={(e) => onUpdateSetting("focusTimeEnd", parseInt(e.target.value))}
                      className="bg-white dark:bg-[#252830] border border-gray-300 dark:border-[#333] rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">Dark Mode</p>
                  <p className="text-xs text-gray-500">Use dark theme</p>
                </div>
                <button
                  onClick={() => onUpdateSetting("darkMode", !settings.darkMode)}
                  className={`w-12 h-6 rounded-full transition-colors ${settings.darkMode ? "bg-[#5B8DEF]" : "bg-gray-300 dark:bg-gray-600"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.darkMode ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Theme Color</label>
                <div className="flex gap-2">
                  {["#5B8DEF", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899", "#3BA55D"].map(color => (
                    <button
                      key={color}
                      onClick={() => onUpdateSetting("themeColor", color)}
                      className={`w-8 h-8 rounded-full transition-transform ${settings.themeColor === color ? "scale-110 ring-2 ring-white dark:ring-offset-2 dark:ring-offset-[#121417]" : "hover:scale-105"}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">Compact View</p>
                  <p className="text-xs text-gray-500">Show more events with less spacing</p>
                </div>
                <button
                  onClick={() => onUpdateSetting("compactView", !settings.compactView)}
                  className={`w-12 h-6 rounded-full transition-colors ${settings.compactView ? "bg-[#5B8DEF]" : "bg-gray-300 dark:bg-gray-600"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.compactView ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">Push Notifications</p>
                  <p className="text-xs text-gray-500">Receive browser notifications for events</p>
                </div>
                <button
                  onClick={() => onUpdateSetting("pushNotifications", !settings.pushNotifications)}
                  className={`w-12 h-6 rounded-full transition-colors ${settings.pushNotifications ? "bg-[#5B8DEF]" : "bg-gray-300 dark:bg-gray-600"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.pushNotifications ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">Email Notifications</p>
                  <p className="text-xs text-gray-500">Receive email reminders for events</p>
                </div>
                <button
                  onClick={() => onUpdateSetting("emailNotifications", !settings.emailNotifications)}
                  className={`w-12 h-6 rounded-full transition-colors ${settings.emailNotifications ? "bg-[#5B8DEF]" : "bg-gray-300 dark:bg-gray-600"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.emailNotifications ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Default Reminder</label>
                <select 
                  value={settings.defaultReminder} 
                  onChange={(e) => onUpdateSetting("defaultReminder", e.target.value)}
                  className="w-full bg-white dark:bg-[#252830] border border-gray-300 dark:border-[#333] rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                >
                  <option value="0">At time of event</option>
                  <option value="5">5 minutes before</option>
                  <option value="10">10 minutes before</option>
                  <option value="15">15 minutes before</option>
                  <option value="30">30 minutes before</option>
                  <option value="60">1 hour before</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
