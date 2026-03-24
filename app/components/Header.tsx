"use client";

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/react";
import { useUser } from "@clerk/react";

export default function Header() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  return (
    <header className="border-b border-border bg-background dark:bg-[#2B262C] dark:border-gray-700">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-foreground dark:text-[#F5F1E8] tracking-tight">
            VanCal
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard"
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground dark:text-gray-300 dark:hover:text-[#F5F1E8] transition-colors rounded-md hover:bg-muted/50 dark:hover:bg-gray-800"
            >
              Dashboard
            </Link>
            <Link
              href="/calendar"
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground dark:text-gray-300 dark:hover:text-[#F5F1E8] transition-colors rounded-md hover:bg-muted/50 dark:hover:bg-gray-800"
            >
              Calendar
            </Link>
            <Link
              href="/events"
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground dark:text-gray-300 dark:hover:text-[#F5F1E8] transition-colors rounded-md hover:bg-muted/50 dark:hover:bg-gray-800"
            >
              Events
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {isSignedIn ? (
            <>
              <Link
                href="/profile"
                className="text-sm text-muted-foreground hover:text-foreground dark:text-gray-300 dark:hover:text-[#F5F1E8] transition-colors px-3 py-2 rounded-md hover:bg-muted/50"
              >
                Profile
              </Link>
              <div className="h-6 w-px bg-border dark:bg-gray-700" />
              <span className="text-sm text-muted-foreground dark:text-gray-300">
                {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </span>
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/sign-in"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground dark:text-gray-300 dark:hover:text-[#F5F1E8] transition-colors rounded-lg hover:bg-muted/50"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
