"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from "react";
import { 
  Shield, 
  Lock, 
  Unlock, 
  Wifi, 
  WifiOff,
  Database,
  Eye,
  EyeOff,
  Trash2,
  Download,
  RefreshCw
} from "lucide-react";
import { encryptedLocalStorage as localStorage } from "@/lib/localStorage";

interface PrivacySettings {
  encryptionEnabled: boolean;
  offlineMode: boolean;
  syncEnabled: boolean;
  showSensitiveData: boolean;
  autoSync: boolean;
  clearOnLogout: boolean;
}

const defaultSettings: PrivacySettings = {
  encryptionEnabled: true,
  offlineMode: false,
  syncEnabled: true,
  showSensitiveData: true,
  autoSync: true,
  clearOnLogout: true,
};

function getInitialSettings(): PrivacySettings {
  if (typeof window === "undefined") return defaultSettings;
  return localStorage.getSetting<PrivacySettings>("privacy", defaultSettings);
}

export function PrivacySettings() {
  const [settings, setSettings] = useState<PrivacySettings>(getInitialSettings);
  const [isOnline, setIsOnline] = useState(true);
  const [storageUsage, setStorageUsage] = useState({ used: 0, available: 0, percentage: 0 });
  const [syncing, setSyncing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const updateStorageUsage = () => {
    setStorageUsage(localStorage.getStorageUsage());
  };

  const saveSettings = (newSettings: PrivacySettings) => {
    setSettings(newSettings);
    localStorage.setSetting("privacy", newSettings);
  };

  useEffect(() => {
    updateStorageUsage();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const toggleEncryption = async () => {
    if (settings.encryptionEnabled) {
      saveSettings({ ...settings, encryptionEnabled: false });
    } else {
      const success = await localStorage.enableEncryption();
      if (success) {
        saveSettings({ ...settings, encryptionEnabled: true });
      }
    }
  };

  const toggleOfflineMode = () => {
    saveSettings({ ...settings, offlineMode: !settings.offlineMode });
  };

  const toggleSync = () => {
    saveSettings({ ...settings, syncEnabled: !settings.syncEnabled });
  };

  const toggleShowSensitive = () => {
    saveSettings({ ...settings, showSensitiveData: !settings.showSensitiveData });
  };

  const clearLocalData = async () => {
    if (confirm("Are you sure you want to clear all local data? This cannot be undone.")) {
      await localStorage.clearAll();
      updateStorageUsage();
    }
  };

  const exportData = async () => {
    const events = await localStorage.getEvents();
    const data = JSON.stringify(events, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calendar-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSync = async () => {
    setSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSyncing(false);
    updateStorageUsage();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-purple-500" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Privacy & Security
            </h2>
            <p className="text-sm text-gray-500">
              Manage encryption, offline mode, and data privacy
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs">
              <Wifi className="w-3 h-3" />
              Online
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs">
              <WifiOff className="w-3 h-3" />
              Offline
            </span>
          )}
        </div>
      </div>

      {/* Encryption */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.encryptionEnabled ? (
              <Lock className="w-5 h-5 text-green-500" />
            ) : (
              <Unlock className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Local Encryption
              </h3>
              <p className="text-sm text-gray-500">
                Encrypt sensitive data stored locally
              </p>
            </div>
          </div>
          <button
            onClick={toggleEncryption}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.encryptionEnabled ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                settings.encryptionEnabled ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Password Protection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Eye className="w-5 h-5 text-purple-500" />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              Password Protection
            </h3>
            <p className="text-sm text-gray-500">
              Add an extra layer of security
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter encryption password"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Set
          </button>
        </div>
      </div>

      {/* Offline Mode */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-blue-500" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Offline Mode
              </h3>
              <p className="text-sm text-gray-500">
                Cache events for offline access
              </p>
            </div>
          </div>
          <button
            onClick={toggleOfflineMode}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.offlineMode ? "bg-blue-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                settings.offlineMode ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>
        {settings.offlineMode && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Events are cached locally and encrypted for offline access.
            </p>
          </div>
        )}
      </div>

      {/* Sync Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <RefreshCw className={`w-5 h-5 text-gray-500 ${syncing ? "animate-spin" : ""}`} />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Auto Sync
              </h3>
              <p className="text-sm text-gray-500">
                Automatically sync when online
              </p>
            </div>
          </div>
          <button
            onClick={() => saveSettings({ ...settings, autoSync: !settings.autoSync })}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.autoSync ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                settings.autoSync ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing || !isOnline}
          className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync Now"}
        </button>
      </div>

      {/* Data Management */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">
          Data Management
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Local Storage
              </p>
              <p className="text-xs text-gray-500">
                {storageUsage.percentage}% used ({Math.round(storageUsage.used / 1024)}KB / 5MB)
              </p>
            </div>
            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  storageUsage.percentage > 80 ? "bg-red-500" : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(storageUsage.percentage, 100)}%` }}
              />
            </div>
          </div>
          <button
            onClick={exportData}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
          <button
            onClick={clearLocalData}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear Local Data
          </button>
        </div>
      </div>

      {/* Privacy Toggles */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 space-y-4">
        <h3 className="font-medium text-gray-900 dark:text-white">
          Privacy Options
        </h3>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Show Event Details
            </p>
            <p className="text-xs text-gray-500">
              Display sensitive info in preview
            </p>
          </div>
          <button
            onClick={toggleShowSensitive}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.showSensitiveData ? "bg-blue-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                settings.showSensitiveData ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Clear on Logout
            </p>
            <p className="text-xs text-gray-500">
              Remove local data when signing out
            </p>
          </div>
          <button
            onClick={() => saveSettings({ ...settings, clearOnLogout: !settings.clearOnLogout })}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.clearOnLogout ? "bg-blue-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                settings.clearOnLogout ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
