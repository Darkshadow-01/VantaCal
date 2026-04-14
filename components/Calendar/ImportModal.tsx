"use client";

import { useState } from "react";
import { X, Calendar, Upload, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initGoogleApi, authorizeGoogle, fetchGoogleEvents, isGoogleConfigured, convertGoogleEvent } from "@/lib/google-calendar";
import type { CalendarEvent } from "@/lib/types";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (events: CalendarEvent[]) => void;
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "connecting" | "importing" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [importedCount, setImportedCount] = useState(0);

  if (!isOpen) return null;

  const handleGoogleImport = async () => {
    setIsLoading(true);
    setStatus("connecting");
    setError("");

    try {
      const initialized = await initGoogleApi();
      if (!initialized) {
        throw new Error("Failed to initialize Google API");
      }

      const authorized = await authorizeGoogle();
      if (!authorized) {
        throw new Error("Authorization failed");
      }

      setStatus("importing");
      const events = await fetchGoogleEvents();
      
      if (events.length === 0) {
        setError("No events found in Google Calendar");
        setStatus("error");
        setIsLoading(false);
        return;
      }

      setImportedCount(events.length);
      onImport(events);
      setStatus("success");
    } catch (err: any) {
      console.error("Import error:", err);
      setError(err.message || "Failed to import events");
      setStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStatus("idle");
    setError("");
    setImportedCount(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-white dark:bg-[#1A1D24] rounded-xl w-full max-w-md border border-gray-200 dark:border-[#333] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#333]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Import Events
          </h2>
          <button onClick={handleClose} className="p-1 hover:bg-gray-100 dark:hover:bg-[#252830] rounded">
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {status === "idle" && (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Import events from other calendar apps to get started quickly.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleGoogleImport}
                  disabled={!isGoogleConfigured() || isLoading}
                  className="w-full p-4 border border-gray-200 dark:border-[#333] rounded-lg hover:bg-gray-50 dark:hover:bg-[#252830] transition-colors flex items-center gap-3 disabled:opacity-50"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow">
                    <svg viewBox="0 0 24 24" className="w-6 h-6">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">Google Calendar</p>
                    <p className="text-sm text-gray-500">
                      {isGoogleConfigured() ? "Import from your Google account" : "Not configured"}
                    </p>
                  </div>
                </button>

                <div className="w-full p-4 border border-gray-200 dark:border-[#333] rounded-lg opacity-50">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-10 h-10 text-gray-400" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">Apple Calendar</p>
                      <p className="text-sm text-gray-500">Coming soon</p>
                    </div>
                  </div>
                </div>

                <div className="w-full p-4 border border-gray-200 dark:border-[#333] rounded-lg opacity-50">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-10 h-10 text-gray-400" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">Outlook Calendar</p>
                      <p className="text-sm text-gray-500">Coming soon</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-3 bg-gray-100 dark:bg-[#252830] rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>Note:</strong> You can also import events from .ics files using the export/import feature.
                </p>
              </div>
            </>
          )}

          {status === "connecting" && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-stone-600 dark:text-stone-400" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">Connecting to Google...</p>
            </div>
          )}

          {status === "importing" && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-stone-600 dark:text-stone-400" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">Importing events...</p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                Successfully imported!
              </p>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {importedCount} events added to your calendar
              </p>
              <Button onClick={handleClose} className="mt-6">
                Done
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <p className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                Import Failed
              </p>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {error}
              </p>
              <Button onClick={() => setStatus("idle")} variant="outline" className="mt-6">
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
