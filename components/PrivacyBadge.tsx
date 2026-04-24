"use client";

import { useState } from "react";
import { Shield, CheckCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrivacyNoticeProps {
  className?: string;
}

export function PrivacyBadge({ className }: PrivacyNoticeProps) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowInfo(true)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-sm text-green-600 dark:text-green-400",
          "bg-green-50 dark:bg-green-900/30 rounded-lg",
          "hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors",
          className
        )}
        aria-label="Privacy information"
      >
        <Shield className="w-4 h-4" />
        <span className="font-medium">Private</span>
      </button>

      {showInfo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-title"
        >
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setShowInfo(false)}
            aria-hidden="true"
          />
          
          <div className="relative w-full max-w-md bg-[var(--bg-elevated)] rounded-xl border border-[var(--border)] shadow-2xl p-6">
            <button
              onClick={() => setShowInfo(false)}
              className="absolute top-4 right-4 p-1 hover:bg-[var(--bg-secondary)] rounded"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-[var(--text-muted)]" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 
                id="privacy-title" 
                className="text-lg font-semibold text-[var(--text-primary)]"
              >
                Your Privacy Matters
              </h2>
            </div>

            <div className="space-y-4 text-sm text-[var(--text-secondary)]">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[var(--text-primary)]">End-to-End Encryption</p>
                  <p>All your events are encrypted before leaving your device. Only you can read them.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Zero-Knowledge Design</p>
                  <p>We cannot access your calendar data. Your encryption key never leaves your device.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Private by Default</p>
                  <p>Encryption is always on. No extra setup needed.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Local Processing</p>
                  <p>Event parsing and focus analysis happen locally on your device.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border)]">
              <div className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  VanCal uses AES-256-GCM encryption with PBKDF2 key derivation. Your data is encrypted client-side before any network transmission.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInfo(false)}
              className="mt-6 w-full py-2 bg-[var(--accent)] text-[var(--accent-contrast)] rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}