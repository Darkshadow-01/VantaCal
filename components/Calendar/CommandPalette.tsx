"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format, addMinutes } from "date-fns";
import { Calendar, Clock, Tag, X, Plus, GripVertical } from "lucide-react";
import { useEncryption } from "@/hooks/useEncryption";

interface QuickEventData {
  title: string;
  system: "Health" | "Work" | "Relationships";
  duration: number;
  startTime: Date;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateEvent: (data: QuickEventData) => void;
}

const SYSTEMS = [
  { id: "Work", label: "Work", color: "bg-[#374151]" },
  { id: "Health", label: "Health", color: "bg-[#16A34A]" },
  { id: "Relationships", label: "Relationships", color: "bg-[#9333EA]" },
] as const;

const DURATIONS = [15, 30, 45, 60, 90, 120];

export function CommandPalette({ isOpen, onClose, onCreateEvent }: CommandPaletteProps) {
  const [title, setTitle] = useState("");
  const [system, setSystem] = useState<"Health" | "Work" | "Relationships">("Work");
  const [duration, setDuration] = useState(30);
  const [step, setStep] = useState<"title" | "details">("title");
  const { status: encryptionStatus } = useEncryption();

  const handleSubmit = useCallback(() => {
    if (!title.trim()) return;
    
    onCreateEvent({
      title: title.trim(),
      system,
      duration,
      startTime: new Date(),
    });
    
    setTitle("");
    setSystem("Work");
    setDuration(30);
    setStep("title");
    onClose();
  }, [title, system, duration, onCreateEvent, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setStep("title");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Quick event creation"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      
      <div className="relative w-full max-w-lg bg-[var(--bg-elevated)] rounded-xl border border-[var(--border)] shadow-2xl overflow-hidden">
        {encryptionStatus !== "unlocked" && (
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Unlock encryption to create events
            </p>
          </div>
        )}
        
        <div className="p-4">
          {step === "title" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-3 py-2.5 bg-[var(--bg-secondary)] rounded-lg">
                <Plus className="w-5 h-5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="What do you need to schedule?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && title.trim()) {
                      setStep("details");
                    }
                  }}
                  className="flex-1 bg-transparent outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  autoFocus
                  aria-label="Event title"
                />
              </div>
              
              <div className="flex gap-2">
                {SYSTEMS.map((sys) => (
                  <button
                    key={sys.id}
                    onClick={() => {
                      setSystem(sys.id);
                      setStep("details");
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--border)] transition-colors"
                  >
                    <span className={`w-2 h-2 rounded-full ${sys.color}`} />
                    {sys.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep("title")}
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                >
                  ← Back
                </button>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-[var(--bg-secondary)] rounded"
                >
                  <X className="w-4 h-4 text-[var(--text-muted)]" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Duration</label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {DURATIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          duration === d
                            ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                            : "bg-[var(--bg-secondary)] hover:bg-[var(--border)]"
                        }`}
                      >
                        {d} min
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Category</label>
                  <div className="flex gap-2 mt-1.5">
                    {SYSTEMS.map((sys) => (
                      <button
                        key={sys.id}
                        onClick={() => setSystem(sys.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          system === sys.id
                            ? "ring-2 ring-[var(--accent)]"
                            : "hover:bg-[var(--bg-secondary)]"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${sys.color}`} />
                        {sys.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleSubmit}
                disabled={!title.trim() || encryptionStatus !== "unlocked"}
                className="w-full py-2.5 bg-[var(--accent)] text-[var(--accent-contrast)] rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Calendar
              </button>
            </div>
          )}
        </div>
        
        <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-muted)]">
          <span className="font-mono bg-[var(--bg-primary)] px-1.5 py-0.5 rounded">↵</span> to continue &nbsp;
          <span className="font-mono bg-[var(--bg-primary)] px-1.5 py-0.5 rounded">esc</span> to close
        </div>
      </div>
    </div>
  );
}

export function useCommandPalette(onCreateEvent: (data: QuickEventData) => void) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // Cmd+K or Ctrl+K on desktop
      if (ctrlOrCmd && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen(true);
      }

      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    isOpen,
    setIsOpen,
    CommandPalette: () => (
      <CommandPalette
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onCreateEvent={onCreateEvent}
      />
    ),
  };
}