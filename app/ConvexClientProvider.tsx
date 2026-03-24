"use client";

import { ClerkProvider } from "@clerk/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/react";
import React, { ReactNode, useMemo } from "react";

// Safely initialize Convex client only if URL is available
let convex: ConvexReactClient | null = null;
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

try {
  if (convexUrl) {
    convex = new ConvexReactClient(convexUrl);
  }
} catch (error) {
  console.error("[v0] Failed to initialize Convex client:", error);
  convex = null;
}

function ConvexClientProviderInner({
  children,
}: {
  children: ReactNode;
}) {
  // If we have a valid Convex client, use it
  if (convex && convexUrl) {
    return (
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    );
  }

  // Fallback: Show demo mode message and render children anyway
  return (
    <>
      <div className="fixed top-0 left-0 right-0 bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-3 z-50">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <span className="font-semibold">Demo Mode:</span> Database not connected. Add NEXT_PUBLIC_CONVEX_URL to enable data persistence.
        </p>
      </div>
      <div className="pt-12">{children}</div>
    </>
  );
}

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // If no Clerk key, still render children in demo mode
  if (!clerkKey) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-3 z-50">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <span className="font-semibold">Demo Mode:</span> Authentication not configured. Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY for login.
          </p>
        </div>
        <div className="pt-12">{children}</div>
      </>
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerkKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/"
      afterSignUpUrl="/"
    >
      <ConvexClientProviderInner>{children}</ConvexClientProviderInner>
    </ClerkProvider>
  );
}
