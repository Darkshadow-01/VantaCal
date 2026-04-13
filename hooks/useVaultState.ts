"use client";

import { useState, useEffect, useCallback } from "react";
import { getVaultState, initializeVault, type VaultState } from "@/src/infrastructure/storage/encryptedStorage";

export interface UseVaultStateResult {
  vaultState: VaultState;
  isLoading: boolean;
  error: string | null;
  refreshVaultState: () => Promise<void>;
}

export function useVaultState(): UseVaultStateResult {
  const [vaultState, setVaultState] = useState<VaultState>("NO_KEY");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshVaultState = useCallback(async () => {
    try {
      const state = await initializeVault();
      setVaultState(state);
    } catch (err) {
      console.error("Failed to initialize vault:", err);
      setError("Vault initialization failed");
      setVaultState("NO_KEY");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshVaultState();
  }, []);

  return {
    vaultState,
    isLoading,
    error,
    refreshVaultState,
  };
}

export function getVaultStateLabel(state: VaultState): string {
  switch (state) {
    case "UNLOCKED":
      return "Secure Mode";
    case "LOCKED":
      return "Vault Locked";
    case "NO_KEY":
    default:
      return "Temporary Mode";
  }
}

export function getVaultStateIcon(state: VaultState): string {
  switch (state) {
    case "UNLOCKED":
      return "🔓";
    case "LOCKED":
      return "🔒";
    case "NO_KEY":
    default:
      return "⚠️";
  }
}

export function getVaultStateDescription(state: VaultState): string {
  switch (state) {
    case "UNLOCKED":
      return "Your events are encrypted and secure";
    case "LOCKED":
      return "Vault is locked. Events are protected.";
    case "NO_KEY":
    default:
      return "Temporary mode — data will be lost on browser close";
  }
}