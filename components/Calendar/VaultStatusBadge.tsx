"use client";

import { useVaultState, getVaultStateIcon, getVaultStateDescription } from "@/hooks";
import { type VaultState } from "@/src/infrastructure/storage/encryptedStorage";
import { Lock, Unlock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VaultStatusBadgeProps {
  className?: string;
  showDescription?: boolean;
  onClick?: () => void;
}

export function VaultStatusBadge({ className, showDescription = false, onClick }: VaultStatusBadgeProps) {
  const { vaultState, isLoading } = useVaultState();

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-1.5 text-xs text-gray-400", className)}>
        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
        <span>Loading...</span>
      </div>
    );
  }

  const icon = getVaultStateIcon(vaultState);
  const description = getVaultStateDescription(vaultState);

  const stateConfig = {
    UNLOCKED: {
      icon: <Unlock className="w-3 h-3" />,
      bg: "bg-green-500/10 dark:bg-green-500/20",
      text: "text-green-600 dark:text-green-400",
      border: "border-green-500/30",
    },
    LOCKED: {
      icon: <Lock className="w-3 h-3" />,
      bg: "bg-amber-500/10 dark:bg-amber-500/20",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-500/30",
    },
    NO_KEY: {
      icon: <AlertTriangle className="w-3 h-3" />,
      bg: "bg-red-500/10 dark:bg-red-500/20",
      text: "text-red-600 dark:text-red-400",
      border: "border-red-500/30",
    },
  };

  const config = stateConfig[vaultState] || stateConfig.NO_KEY;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium transition-colors",
        config.bg,
        config.text,
        config.border,
        onClick && "cursor-pointer hover:opacity-80",
        !onClick && "cursor-default",
        className
      )}
    >
      {config.icon}
      <span>{icon} {vaultState}</span>
      {showDescription && (
        <span className="hidden sm:inline ml-1 opacity-75">— {description}</span>
      )}
    </button>
  );
}

interface VaultWarningBannerProps {
  onSetupClick?: () => void;
}

export function VaultWarningBanner({ onSetupClick }: VaultWarningBannerProps) {
  const { vaultState, isLoading } = useVaultState();

  if (isLoading || vaultState !== "NO_KEY") {
    return null;
  }

  const tempEventsCount = (() => {
    try {
      const temp = sessionStorage.getItem("temp_calendar_events");
      if (temp) {
        const events = JSON.parse(temp);
        return Array.isArray(events) ? events.length : 0;
      }
    } catch {
      return 0;
    }
    return 0;
  })();

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-red-500/10 dark:bg-red-500/20 border-b border-red-500/30 text-red-600 dark:text-red-400 text-sm">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>
          {tempEventsCount > 0 
            ? `Temporary mode — ${tempEventsCount} event(s) will be lost when browser closes.`
            : "Temporary mode — events will be lost when browser closes."}
        </span>
      </div>
      {onSetupClick && (
        <button
          onClick={onSetupClick}
          className="px-3 py-1 text-xs font-medium bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
        >
          Set up vault
        </button>
      )}
    </div>
  );
}