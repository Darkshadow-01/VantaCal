"use client";

import { useEffect, useState } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    import("@sentry/nextjs").then((Sentry) => {
      Sentry.captureException(error);
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-red-500">Application Error</h2>
            <p className="mt-4 text-gray-400">
              {isReporting
                ? "The error has been reported to our team."
                : "An unexpected error occurred."}
            </p>
            <button
              onClick={() => {
                setIsReporting(true);
                reset();
              }}
              className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              {isReporting ? "Reloading..." : "Try again"}
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}