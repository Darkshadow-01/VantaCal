"use client";

import { VanCal } from "@/components/Calendar";

export default function CalendarDemoPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-[1600px] mx-auto">
        <VanCal />
      </div>
    </div>
  );
}
