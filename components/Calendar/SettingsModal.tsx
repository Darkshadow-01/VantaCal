"use client";

import { useState } from "react";
import { X, Moon, Sun, Globe, Bell, Eye, Calendar, Clock, Palette } from "lucide-react";
import type { Settings } from "@/lib/types";
import { TimezoneSelect } from "@/components/ui/TimezoneSelect";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

interface TabConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export function SettingsModal({ isOpen, onClose, settings, onUpdateSetting }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState("general");

  if (!isOpen) return null;

  const tabs: TabConfig[] = [
    { id: "general", label: "General", icon: <Globe className="w-4 h-4" /> },
    { id: "appearance", label: "Appearance", icon: <Palette className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-[var(--bg-primary)] rounded-2xl w-full max-w-lg border border-[var(--border)] shadow-2xl overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: "85vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Settings</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-[var(--bg-secondary)] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        <div className="flex" style={{ height: "calc(85vh - 73px)" }}>
          {/* Sidebar */}
          <div className="w-44 border-r border-[var(--border)] p-3 space-y-1 bg-[var(--bg-secondary)]/30">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  activeTab === tab.id
                    ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === "general" && (
              <div className="space-y-6">
                <SettingSection title="Time & Location">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text-primary)]">Time zone</label>
                      <TimezoneSelect 
                        value={settings.timezone} 
                        onChange={(tz) => onUpdateSetting("timezone", tz)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text-primary)]">Default view</label>
                      <select 
                        value={settings.defaultView} 
                        onChange={(e) => onUpdateSetting("defaultView", e.target.value as Settings["defaultView"])}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-[var(--text-primary)] text-sm"
                      >
                        <option value="day">Day</option>
                        <option value="week">Week</option>
                        <option value="month">Month</option>
                        <option value="year">Year</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text-primary)]">Start week on</label>
                      <select 
                        value={settings.startWeekOn} 
                        onChange={(e) => onUpdateSetting("startWeekOn", e.target.value as Settings["startWeekOn"])}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-[var(--text-primary)] text-sm"
                      >
                        <option value="sunday">Sunday</option>
                        <option value="monday">Monday</option>
                      </select>
                    </div>
                  </div>
                </SettingSection>

                <SettingSection title="Display">
                  <div className="space-y-4">
                    <ToggleOption
                      label="Show weekends"
                      description="Display Saturday and Sunday in week view"
                      checked={settings.showWeekends}
                      onChange={() => onUpdateSetting("showWeekends", !settings.showWeekends)}
                    />

                    <ToggleOption
                      label="Compact view"
                      description="Show more events with less spacing"
                      checked={settings.compactView}
                      onChange={() => onUpdateSetting("compactView", !settings.compactView)}
                    />
                  </div>
                </SettingSection>

                <SettingSection title="Working Hours">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                        <select
                          value={settings.workingHours?.start ?? 9}
                          onChange={(e) => onUpdateSetting("workingHours", { ...settings.workingHours, start: parseInt(e.target.value) })}
                          className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                          ))}
                        </select>
                      </div>
                      <span className="text-[var(--text-muted)]">to</span>
                      <div className="flex items-center gap-2 flex-1">
                        <select
                          value={settings.workingHours?.end ?? 17}
                          onChange={(e) => onUpdateSetting("workingHours", { ...settings.workingHours, end: parseInt(e.target.value) })}
                          className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">Events outside working hours may appear differently</p>
                  </div>
                </SettingSection>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-6">
                <SettingSection title="Theme">
                  <ToggleOption
                    label="Dark mode"
                    description="Use dark theme for the interface"
                    checked={settings.darkMode}
                    onChange={() => onUpdateSetting("darkMode", !settings.darkMode)}
                    icon={settings.darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  />
                </SettingSection>

                <SettingSection title="Calendar Color">
                  <div className="flex gap-3 flex-wrap">
                    {[
                      "#4285F4", "#EA4335", "#FBBC05", "#34A853",
                      "#FF6D01", "#46BDC6", "#7B1FA2", "#C2185B",
                      "#00796B", "#FBC02D"
                    ].map(color => (
                      <button
                        key={color}
                        className="w-10 h-10 rounded-full border-2 border-transparent hover:border-[var(--text-muted)] transition-all shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </SettingSection>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <SettingSection title="Notifications">
                  <div className="space-y-4">
                    <ToggleOption
                      label="Push notifications"
                      description="Receive browser notifications for events"
                      checked={settings.pushNotifications}
                      onChange={() => onUpdateSetting("pushNotifications", !settings.pushNotifications)}
                    />

                    <ToggleOption
                      label="Email notifications"
                      description="Receive email reminders for events"
                      checked={settings.emailNotifications}
                      onChange={() => onUpdateSetting("emailNotifications", !settings.emailNotifications)}
                    />
                  </div>
                </SettingSection>

                <SettingSection title="Reminders">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-primary)]">Default reminder</label>
                    <select 
                      value={settings.defaultReminder} 
                      onChange={(e) => onUpdateSetting("defaultReminder", e.target.value)}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-[var(--text-primary)] text-sm"
                    >
                      <option value="0">At time of event</option>
                      <option value="5">5 minutes before</option>
                      <option value="10">10 minutes before</option>
                      <option value="15">15 minutes before</option>
                      <option value="30">30 minutes before</option>
                      <option value="60">1 hour before</option>
                      <option value="1440">1 day before</option>
                    </select>
                  </div>
                </SettingSection>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

function ToggleOption({
  label,
  description,
  checked,
  onChange,
  icon
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        {icon && <span className="text-[var(--text-muted)]">{icon}</span>}
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
          <p className="text-xs text-[var(--text-muted)]">{description}</p>
        </div>
      </div>
      <button
        onClick={onChange}
        className={`w-11 h-6 rounded-full transition-all ${
          checked 
            ? "bg-[#4285F4]" // Google Blue
            : "bg-[var(--bg-secondary)]"
        }`}
      >
        <div 
          className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`} 
        />
      </button>
    </div>
  );
}
