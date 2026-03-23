"use client";

import { ClerkProvider } from "@clerk/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/react";
import React, { ReactNode } from "react";

// Initialize Convex client if URL is available
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

function ConvexClientProviderInner({
  children,
}: {
  children: ReactNode;
}) {
  // If Convex URL is not available, show a helpful message
  if (!convex || !convexUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-[#2B262C]">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold text-foreground dark:text-[#F5F1E8] mb-4">
            Setup Required
          </h1>
          <p className="text-muted-foreground dark:text-gray-400 mb-4">
            Environment variables are not configured. Please add NEXT_PUBLIC_CONVEX_URL and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to your environment.
          </p>
          <p className="text-xs text-muted-foreground dark:text-gray-500">
            For local development, run <code className="bg-muted dark:bg-gray-800 px-2 py-1 rounded">convex dev</code> and ensure your .env.local file is populated.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!clerkKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-[#2B262C]">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold text-foreground dark:text-[#F5F1E8] mb-4">
            Configuration Required
          </h1>
          <p className="text-muted-foreground dark:text-gray-400">
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable is missing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkKey}>
      <ConvexClientProviderInner>{children}</ConvexClientProviderInner>
    </ClerkProvider>
  );
}
