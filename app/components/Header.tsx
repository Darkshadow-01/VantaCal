"use client";

import Link from "next/link";
import { useAuth, UserButton, SignInButton } from "@clerk/react";
import { useUser } from "@clerk/react";

export default function Header() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  return (
    <header className="border-b bg-white dark:bg-gray-800 dark:border-gray-700">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
            Calendar
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/calendar"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
            >
              Calendar
            </Link>
            <Link
              href="/events"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
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
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                Profile
              </Link>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </span>
              <UserButton />
            </>
          ) : (
            <SignInButton mode="modal">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Sign In
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  );
}
