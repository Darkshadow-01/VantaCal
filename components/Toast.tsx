"use client";

import { useState, useEffect } from "react";
import { X, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastNotification {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  duration?: number;
}

interface ToastProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
  onRetry?: () => void;
}

export function ToastContainer({ toasts, onDismiss, onRetry }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem 
          key={toast.id} 
          toast={toast} 
          onDismiss={onDismiss}
          onRetry={onRetry}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: ToastNotification;
  onDismiss: (id: string) => void;
  onRetry?: () => void;
}

function ToastItem({ toast, onDismiss, onRetry }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    if (toast.type !== "error" && toast.duration !== 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss(toast.id), 300);
      }, toast.duration || 4000);
      
      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg transition-all duration-300",
        toast.type === "success" && "bg-green-50 dark:bg-green-900/50 border-green-200 dark:border-green-800",
        toast.type === "error" && "bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-800",
        toast.type === "info" && "bg-blue-50 dark:bg-blue-900/50 border-blue-200 dark:border-blue-800",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}
      role="alert"
    >
      {toast.type === "success" && (
        <CheckCircle className="w-5 h-5 text-green-500" />
      )}
      {toast.type === "error" && (
        <AlertCircle className="w-5 h-5 text-red-500" />
      )}
      {toast.type === "info" && (
        <AlertCircle className="w-5 h-5 text-blue-500" />
      )}
      
      <span className="flex-1 text-sm text-[var(--text-primary)]">
        {toast.message}
      </span>

      {toast.type === "error" && onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
          aria-label="Retry action"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      )}

      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onDismiss(toast.id), 300);
        }}
        className="p-1 hover:bg-[var(--bg-secondary)] rounded transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4 text-[var(--text-muted)]" />
      </button>
    </div>
  );
}

// Hook to manage toast notifications
export function useToastNotifications() {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = (type: ToastNotification["type"], message: string, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, message, duration }]);
    return id;
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const success = (message: string, duration?: number) => addToast("success", message, duration);
  const error = (message: string, duration?: number) => addToast("error", message, duration);
  const info = (message: string, duration?: number) => addToast("info", message, duration);

  return {
    toasts,
    addToast,
    dismissToast,
    success,
    error,
    info,
    ToastContainer: () => (
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    ),
  };
}