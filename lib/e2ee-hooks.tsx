"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import {
  deriveKeyFromPassword,
  generateMasterKey,
  encryptMasterKey,
  decryptMasterKey,
  createRecoveryData,
  recoverMasterKeyFromPhrase,
  generateRecoveryPhrase,
  encryptData,
  decryptData,
  hasMasterKey,
  setMasterKey,
  clearMasterKey,
  base64ToArrayBuffer,
  arrayBufferToBase64,
  type MasterKeyStorage,
  type EncryptedPayload,
  type RecoveryKeyData,
} from "./e2ee";

export interface E2EEState {
  isInitialized: boolean;
  isUnlocked: boolean;
  isLoading: boolean;
  error: string | null;
  hasRecoveryKey: boolean;
}

export interface EncryptedEventData {
  title: string;
  description?: string;
  startTime: number;
  endTime: number;
  allDay: boolean;
  userId: string;
  system: "Health" | "Work" | "Relationships";
  color?: string;
  recurrence?: string;
  location?: string;
}

export interface DecryptedEventData extends EncryptedEventData {
  _id?: string;
  _creationTime?: number;
  userId: string;
  createdAt: number;
  updatedAt: number;
}

interface UserKeysData {
  userId: string;
  encryptedMasterKey: string;
  salt: string;
  iv: string;
  recoveryEncryptedMasterKey?: string;
  recoverySalt?: string;
  recoveryIv?: string;
  createdAt: number;
  updatedAt: number;
}

const userKeysApi = api as any;

export function useE2EE(userId: string | null | undefined) {
  const [state, setState] = useState<E2EEState>({
    isInitialized: false,
    isUnlocked: false,
    isLoading: true,
    error: null,
    hasRecoveryKey: false,
  });

  const [recoveryPhrase, setRecoveryPhrase] = useState<string | null>(null);
  const masterKeyRef = useRef<CryptoKey | null>(null);

  const getUserKeys = useQuery(
    userKeysApi.userKeys.index.getUserKeys,
    userId ? { userId } : "skip"
  ) as UserKeysData | null | undefined;
  const createUserKeys = useMutation(userKeysApi.userKeys.index.createUserKeys);
  const updateUserKeys = useMutation(userKeysApi.userKeys.index.updateUserKeys);

  useEffect(() => {
    if (getUserKeys) {
      setState((prev) => ({
        ...prev,
        isInitialized: true,
        hasRecoveryKey: !!getUserKeys.recoveryEncryptedMasterKey,
      }));
    }
  }, [getUserKeys]);

  const initializeEncryption = useCallback(
    async (password: string): Promise<{ success: boolean; recoveryPhrase?: string }> => {
      if (!userId) {
        setState((prev) => ({ ...prev, error: "User not authenticated" }));
        return { success: false };
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        if (getUserKeys) {
          const salt = base64ToArrayBuffer(getUserKeys.salt);
          const passwordKey = await deriveKeyFromPassword(password, salt);
          const masterKey = await decryptMasterKey(
            {
              encryptedMasterKey: getUserKeys.encryptedMasterKey,
              salt: getUserKeys.salt,
              iv: getUserKeys.iv,
            },
            passwordKey
          );

          masterKeyRef.current = masterKey;
          setMasterKey(masterKey);

          setState((prev) => ({
            ...prev,
            isUnlocked: true,
            isLoading: false,
            hasRecoveryKey: !!getUserKeys.recoveryEncryptedMasterKey,
          }));

          return { success: true };
        } else {
          const recovery = await generateRecoveryPhrase();
          const masterKey = await generateMasterKey();
          const randomSalt = crypto.getRandomValues(new Uint8Array(16));
          const passwordKey = await deriveKeyFromPassword(password, randomSalt);
          const encrypted = await encryptMasterKey(masterKey, passwordKey);
          const recoveryData = await createRecoveryData(masterKey, recovery);

          await createUserKeys({
            userId,
            encryptedMasterKey: encrypted.encryptedMasterKey,
            salt: encrypted.salt,
            iv: encrypted.iv,
            recoveryEncryptedMasterKey: recoveryData.encryptedMasterKey,
            recoverySalt: recoveryData.salt,
            recoveryIv: recoveryData.iv,
          });

          masterKeyRef.current = masterKey;
          setMasterKey(masterKey);

          setState((prev) => ({
            ...prev,
            isUnlocked: true,
            isLoading: false,
            hasRecoveryKey: true,
          }));

          setRecoveryPhrase(recovery);

          return { success: true, recoveryPhrase: recovery };
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Failed to decrypt. Please check your password.",
        }));
        return { success: false };
      }
    },
    [userId, getUserKeys, createUserKeys]
  );

  const unlockWithPassword = useCallback(
    async (password: string): Promise<boolean> => {
      const result = await initializeEncryption(password);
      return result.success;
    },
    [initializeEncryption]
  );

  const unlockWithRecoveryPhrase = useCallback(
    async (phrase: string): Promise<boolean> => {
      if (!userId || !getUserKeys?.recoveryEncryptedMasterKey) {
        setState((prev) => ({ ...prev, error: "Recovery not available" }));
        return false;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const recoveryData: RecoveryKeyData = {
          recoveryKey: phrase,
          encryptedMasterKey: getUserKeys.recoveryEncryptedMasterKey!,
          salt: getUserKeys.recoverySalt!,
          iv: getUserKeys.recoveryIv!,
        };

        const masterKey = await recoverMasterKeyFromPhrase(recoveryData, phrase);

        masterKeyRef.current = masterKey;
        setMasterKey(masterKey);

        setState((prev) => ({
          ...prev,
          isUnlocked: true,
          isLoading: false,
        }));

        return true;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Invalid recovery phrase",
        }));
        return false;
      }
    },
    [userId, getUserKeys]
  );

  const lockApp = useCallback(() => {
    masterKeyRef.current = null;
    clearMasterKey();
    setState((prev) => ({
      ...prev,
      isUnlocked: false,
      error: null,
    }));
  }, []);

  const encryptEvent = useCallback(
    async (eventData: EncryptedEventData): Promise<string> => {
      if (!masterKeyRef.current) {
        throw new Error("App is locked. Please unlock first.");
      }
      const encrypted = await encryptData(eventData, masterKeyRef.current);
      return JSON.stringify(encrypted);
    },
    []
  );

  const decryptEvent = useCallback(
    async <T extends DecryptedEventData>(
      encryptedPayload: string
    ): Promise<T> => {
      if (!masterKeyRef.current) {
        throw new Error("App is locked. Please unlock first.");
      }
      try {
        const encrypted: EncryptedPayload = JSON.parse(encryptedPayload);
        const decrypted = await decryptData<T>(encrypted, masterKeyRef.current);
        return decrypted;
      } catch (error) {
        throw new Error("Failed to decrypt event data");
      }
    },
    []
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<boolean> => {
      if (!userId || !getUserKeys || !masterKeyRef.current) {
        return false;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const currentSalt = base64ToArrayBuffer(getUserKeys.salt);
        const currentKey = await deriveKeyFromPassword(currentPassword, currentSalt);

        const testMasterKey = await decryptMasterKey(
          {
            encryptedMasterKey: getUserKeys.encryptedMasterKey,
            salt: getUserKeys.salt,
            iv: getUserKeys.iv,
          },
          currentKey
        );

        const newSalt = crypto.getRandomValues(new Uint8Array(16));
        const newPasswordKey = await deriveKeyFromPassword(newPassword, newSalt);
        const newEncrypted = await encryptMasterKey(masterKeyRef.current, newPasswordKey);

        await updateUserKeys({
          userId,
          encryptedMasterKey: newEncrypted.encryptedMasterKey,
          salt: newEncrypted.salt,
          iv: newEncrypted.iv,
          recoveryEncryptedMasterKey: getUserKeys.recoveryEncryptedMasterKey,
          recoverySalt: getUserKeys.recoverySalt,
          recoveryIv: getUserKeys.recoveryIv,
        });

        setState((prev) => ({ ...prev, isLoading: false }));
        return true;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Failed to change password. Check your current password.",
        }));
        return false;
      }
    },
    [userId, getUserKeys, updateUserKeys]
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const clearRecoveryPhrase = useCallback(() => {
    setRecoveryPhrase(null);
  }, []);

  return {
    ...state,
    recoveryPhrase,
    unlockWithPassword,
    unlockWithRecoveryPhrase,
    lockApp,
    encryptEvent,
    decryptEvent,
    changePassword,
    clearError,
    clearRecoveryPhrase,
    hasMasterKey: hasMasterKey(),
  };
}
