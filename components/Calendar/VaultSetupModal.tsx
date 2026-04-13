"use client";

import { useState } from "react";
import { setupMasterKey, unlockWithMasterKey } from "@/lib/e2ee";
import { initializeVault } from "@/src/infrastructure/storage/encryptedStorage";
import { X, Shield, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VaultSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function VaultSetupModal({ isOpen, onClose, onSuccess }: VaultSetupModalProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSetup, setIsSetup] = useState(false);

  if (!isOpen) return null;

  const handleSetup = async () => {
    setError(null);
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await setupMasterKey(password);
      
      if (result.success && result.storage) {
        localStorage.setItem("vault_key_storage", JSON.stringify(result.storage));
        
        await initializeVault();
        
        setIsSetup(true);
        onSuccess();
        
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError("Failed to set up vault");
      }
    } catch (err) {
      console.error("Vault setup error:", err);
      setError("Failed to set up vault. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md border border-gray-200 dark:border-gray-700 shadow-2xl" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Set Up Vault
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {isSetup ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="text-green-600 dark:text-green-400 font-medium">
                Vault set up successfully!
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your events are now encrypted
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-sm text-gray-700 dark:text-gray-300">
                  Create a password to encrypt your events
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This password will be used to encrypt your calendar data. Make sure to remember it!
                </p>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (min 8 characters)"
                    className="pr-10 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1 dark:border-gray-600 dark:text-gray-300"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSetup}
                  disabled={isLoading || !password || !confirmPassword}
                  className="flex-1"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Set Up Vault"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}