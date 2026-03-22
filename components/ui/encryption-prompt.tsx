"use client";

import { useState, useEffect } from "react";
import { Lock, Key, AlertCircle, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./dialog";
import { Button } from "./button";
import { Input } from "./input";

interface EncryptionPasswordPromptProps {
  isOpen: boolean;
  onUnlock: (password: string) => Promise<boolean>;
  onUnlockWithRecovery?: (phrase: string) => Promise<boolean>;
  onSetup?: (password: string) => Promise<{ success: boolean; recoveryPhrase?: string }>;
  isLoading?: boolean;
  error?: string | null;
  hasExistingKeys?: boolean;
  mode?: "unlock" | "setup";
  onClose?: () => void;
}

export function EncryptionPasswordPrompt({
  isOpen,
  onUnlock,
  onUnlockWithRecovery,
  onSetup,
  isLoading = false,
  error = null,
  hasExistingKeys = false,
  mode: initialMode,
  onClose,
}: EncryptionPasswordPromptProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryPhrase, setRecoveryPhrase] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRecoveryInput, setShowRecoveryInput] = useState(false);
  const [displayedRecovery, setDisplayedRecovery] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const mode = initialMode || (hasExistingKeys ? "unlock" : "setup");

  useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);

  useEffect(() => {
    if (!isOpen) {
      setPassword("");
      setConfirmPassword("");
      setRecoveryPhrase("");
      setShowPassword(false);
      setShowRecoveryInput(false);
      setDisplayedRecovery(null);
      setLocalError(null);
    }
  }, [isOpen]);

  const handleUnlock = async () => {
    if (!password) {
      setLocalError("Please enter your password");
      return;
    }
    setLocalError(null);
    const success = await onUnlock(password);
    if (!success) {
      setLocalError("Incorrect password. Please try again.");
    }
  };

  const handleSetup = async () => {
    if (!password) {
      setLocalError("Please enter a password");
      return;
    }
    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }
    setLocalError(null);
    if (onSetup) {
      const result = await onSetup(password);
      if (result.success && result.recoveryPhrase) {
        setDisplayedRecovery(result.recoveryPhrase);
      }
    }
  };

  const handleRecoveryUnlock = async () => {
    if (!recoveryPhrase) {
      setLocalError("Please enter your recovery phrase");
      return;
    }
    setLocalError(null);
    if (onUnlockWithRecovery) {
      const success = await onUnlockWithRecovery(recoveryPhrase);
      if (!success) {
        setLocalError("Invalid recovery phrase");
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (mode === "setup") {
        handleSetup();
      } else {
        handleUnlock();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle>
              {mode === "setup" ? "Set Up Encryption" : "Unlock Your Data"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {mode === "setup"
              ? "Create a password to encrypt your calendar data. This password will be required to access your data on any device."
              : "Enter your encryption password to decrypt and access your data."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {displayedRecovery ? (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800 mb-2">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="font-medium">Save Your Recovery Phrase</span>
                </div>
                <p className="text-sm text-amber-700 mb-3">
                  Write down this recovery phrase and store it safely. You&apos;ll need it to recover your data if you forget your password.
                </p>
                <code className="block p-3 bg-amber-100 rounded-md font-mono text-sm break-all">
                  {displayedRecovery}
                </code>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  setDisplayedRecovery(null);
                  onClose?.();
                }}
              >
                I&apos;ve Saved My Recovery Phrase
              </Button>
            </div>
          ) : showRecoveryInput ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Recovery Phrase</label>
                <Input
                  type="text"
                  value={recoveryPhrase}
                  onChange={(e) => setRecoveryPhrase(e.target.value)}
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your recovery phrase to unlock your data
                </p>
              </div>
              <Button
                className="w-full"
                onClick={handleRecoveryUnlock}
                isLoading={isLoading}
              >
                <Key className="h-4 w-4 mr-2" />
                Recover with Phrase
              </Button>
              {hasExistingKeys && (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowRecoveryInput(false)}
                  disabled={isLoading}
                >
                  Back to Password
                </Button>
              )}
            </div>
          ) : mode === "setup" ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Encryption Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a strong password"
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Confirm Password</label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSetup}
                isLoading={isLoading}
              >
                <Lock className="h-4 w-4 mr-2" />
                Set Up Encryption
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={handleUnlock}
                isLoading={isLoading}
              >
                <Lock className="h-4 w-4 mr-2" />
                Unlock
              </Button>
              {onUnlockWithRecovery && (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowRecoveryInput(true)}
                  disabled={isLoading}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Use Recovery Phrase
                </Button>
              )}
            </div>
          )}

          {(localError || error) && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {localError || error}
            </div>
          )}

          {mode === "setup" && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                Your data is encrypted locally before being sent to the server
              </p>
              <p className="flex items-center gap-1">
                <Lock className="h-3 w-3" />
                We never see or store your password
              </p>
              <p className="flex items-center gap-1">
                <Key className="h-3 w-3" />
                Same password works on all your devices
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
