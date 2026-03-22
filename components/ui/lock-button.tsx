"use client";

import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./dialog";

interface LockAppButtonProps {
  onLock: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function LockAppButton({
  onLock,
  variant = "outline",
  size = "default",
  className,
  showIcon = true,
  children,
}: LockAppButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLock = () => {
    setShowConfirm(false);
    onLock();
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setShowConfirm(true)}
      >
        {showIcon && <Lock className="h-4 w-4 mr-2" />}
        {children || "Lock App"}
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Lock App</DialogTitle>
            <DialogDescription>
              This will clear your encryption key from memory. You&apos;ll need to enter your
              password again to access your encrypted data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLock}>
              <Lock className="h-4 w-4 mr-2" />
              Lock Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface LockOverlayProps {
  isLocked: boolean;
  onUnlock: () => void;
}

export function LockOverlay({ isLocked, onUnlock }: LockOverlayProps) {
  const [isBlurred, setIsBlurred] = useState(false);

  useState(() => {
    if (isLocked) {
      const timer = setTimeout(() => setIsBlurred(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsBlurred(false);
    }
  });

  if (!isLocked) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-300 ${
        isBlurred ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="h-8 w-8 text-primary animate-pulse" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">App Locked</h2>
          <p className="text-sm text-muted-foreground">
            Click anywhere or press unlock to continue
          </p>
        </div>
        <Button onClick={onUnlock} size="lg">
          Unlock
        </Button>
      </div>
    </div>
  );
}
