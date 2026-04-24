"use client";

import { useCallback, useEffect, useRef } from "react";

interface FocusTrapOptions {
  onEscape?: () => void;
  initialFocus?: React.RefObject<HTMLElement | null>;
}

export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  options: FocusTrapOptions = {}
) {
  const { onEscape, initialFocus } = options;
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && onEscape) {
        onEscape();
        return;
      }

      if (event.key !== "Tab") return;

      const container = containerRef.current;
      if (!container) return;

      const focusableElements = container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    },
    [containerRef, onEscape]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (initialFocus?.current) {
      initialFocus.current.focus();
    } else if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [containerRef, handleKeyDown, initialFocus]);

  return {
    focusPreviousElement: () => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    },
  };
}

export function useAnnounce() {
  const announcerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!announcerRef.current) {
      const announcer = document.createElement("div");
      announcer.setAttribute("aria-live", "polite");
      announcer.setAttribute("aria-atomic", "true");
      announcer.className = "sr-only";
      announcer.style.cssText =
        "position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;";
      document.body.appendChild(announcer);
      announcerRef.current = announcer;
    }

    return () => {
      if (announcerRef.current) {
        document.body.removeChild(announcerRef.current);
        announcerRef.current = null;
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    if (announcerRef.current) {
      announcerRef.current.setAttribute("aria-live", priority);
      announcerRef.current.textContent = "";
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = message;
        }
      }, 50);
    }
  }, []);

  return { announce };
}

export function useKeyboardShortcuts(
  shortcuts: Record<
    string,
    {
      handler: () => void;
      description?: string;
      allowInInput?: boolean;
    }
  >
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      for (const [shortcut, config] of Object.entries(shortcuts)) {
        const keys = shortcut.toLowerCase().split("+");
        const ctrlKey = keys.includes("ctrl");
        const altKey = keys.includes("alt");
        const shiftKey = keys.includes("shift");
        const key = keys.filter((k) => !["ctrl", "alt", "shift"].includes(k))[0];

        if (
          (ctrlKey ? event.ctrlKey || event.metaKey : true) &&
          (altKey ? event.altKey : true) &&
          (shiftKey ? event.shiftKey : true) &&
          event.key.toLowerCase() === key &&
          (config.allowInInput || !isInputField)
        ) {
          event.preventDefault();
          config.handler();
          return;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}

export function generateId(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getAriaLabel(element: {
  label?: string;
  title?: string;
  placeholder?: string;
  name?: string;
  id?: string;
}): string | undefined {
  return element.label || element.title || element.placeholder || element.name || element.id;
}