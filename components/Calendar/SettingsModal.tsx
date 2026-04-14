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
      <div className="bg-[var(--bg-elevated)] rounded-xl w-full max-w-2xl border border-[var(--border)] shadow-2xl max-h-[80vh] overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
        {/* Tab bar - Refined with underline */}
        <div className="flex border-b border-[var(--border)]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm transition-all relative ${
                activeTab === tab.id
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover-lift"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--accent)] rounded-full" />
              )}
            </button>
          ))}
          <button onClick={onClose} className="ml-auto p-3 hover:bg-[var(--bg-secondary)] rounded-lg hover-lift press-scale">
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {activeTab === "calendar" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm text-[var(--text-secondary)]">Time Zone</label>
                <TimezoneSelect 
                  value={settings.timezone} 
                  onChange={(tz) => onUpdateSetting("timezone", tz)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[var(--text-secondary)]">Default View</label>
                <select 
                  value={settings.defaultView} 
                  onChange={(e) => onUpdateSetting("defaultView", e.target.value as any)}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)]"
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[var(--text-secondary)]">Start Week On</label>
                <select 
                  value={settings.startWeekOn} 
                  onChange={(e) => onUpdateSetting("startWeekOn", e.target.value as any)}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)]"
                >
                  <option value="sunday">Sunday</option>
                  <option value="monday">Monday</option>
                </select>
              </div>

              {/* Toggle - Monochrome */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-primary)]">Show Weekends</p>
                  <p className="text-xs text-[var(--text-muted)]">Display Saturday and Sunday in views</p>
                </div>
                <button
                  onClick={() => onUpdateSetting("showWeekends", !settings.showWeekends)}
                  className={`w-11 h-6 rounded-full transition-all hover-lift press-scale ${settings.showWeekends ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings.showWeekends ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[var(--text-secondary)]">Working Hours</label>
                <div className="flex items-center gap-4">
                  <select
                    value={settings.workingHours?.start ?? 9}
                    onChange={(e) => onUpdateSetting("workingHours", { ...settings.workingHours, start: parseInt(e.target.value) })}
                    className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] font-mono"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                    ))}
                  </select>
                  <span className="text-[var(--text-muted)]">to</span>
                  <select
                    value={settings.workingHours?.end ?? 17}
                    onChange={(e) => onUpdateSetting("workingHours", { ...settings.workingHours, end: parseInt(e.target.value) })}
                    className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] font-mono"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-[var(--text-muted)]">Events outside working hours may be shown differently</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-primary)]">Focus Time</p>
                  <p className="text-xs text-[var(--text-muted)]">Block time for deep work (declines meetings)</p>
                </div>
                <button
                  onClick={() => onUpdateSetting("focusTimeEnabled", !settings.focusTimeEnabled)}
                  className={`w-11 h-6 rounded-full transition-all hover-lift press-scale ${settings.focusTimeEnabled ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings.focusTimeEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>

              {settings.focusTimeEnabled && (
                <div className="space-y-2">
                  <label className="text-sm text-[var(--text-secondary)]">Focus Hours</label>
                  <div className="flex items-center gap-4">
                    <select
                      value={settings.focusTimeStart ?? 9}
                      onChange={(e) => onUpdateSetting("focusTimeStart", parseInt(e.target.value))}
                      className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] font-mono"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                      ))}
                    </select>
                    <span className="text-[var(--text-muted)]">to</span>
                    <select
                      value={settings.focusTimeEnd ?? 17}
                      onChange={(e) => onUpdateSetting("focusTimeEnd", parseInt(e.target.value))}
                      className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] font-mono"
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
                  <p className="text-sm text-[var(--text-primary)]">Dark Mode</p>
                  <p className="text-xs text-[var(--text-muted)]">Use dark theme</p>
                </div>
                <button
                  onClick={() => onUpdateSetting("darkMode", !settings.darkMode)}
                  className={`w-11 h-6 rounded-full transition-all hover-lift press-scale ${settings.darkMode ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings.darkMode ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-primary)]">Compact View</p>
                  <p className="text-xs text-[var(--text-muted)]">Show more events with less spacing</p>
                </div>
                <button
                  onClick={() => onUpdateSetting("compactView", !settings.compactView)}
                  className={`w-11 h-6 rounded-full transition-all hover-lift press-scale ${settings.compactView ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings.compactView ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-primary)]">Push Notifications</p>
                  <p className="text-xs text-[var(--text-muted)]">Receive browser notifications for events</p>
                </div>
                <button
                  onClick={() => onUpdateSetting("pushNotifications", !settings.pushNotifications)}
                  className={`w-11 h-6 rounded-full transition-all hover-lift press-scale ${settings.pushNotifications ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings.pushNotifications ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-primary)]">Email Notifications</p>
                  <p className="text-xs text-[var(--text-muted)]">Receive email reminders for events</p>
                </div>
                <button
                  onClick={() => onUpdateSetting("emailNotifications", !settings.emailNotifications)}
                  className={`w-11 h-6 rounded-full transition-all hover-lift press-scale ${settings.emailNotifications ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings.emailNotifications ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[var(--text-secondary)]">Default Reminder</label>
                <select 
                  value={settings.defaultReminder} 
                  onChange={(e) => onUpdateSetting("defaultReminder", e.target.value)}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)]"
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
