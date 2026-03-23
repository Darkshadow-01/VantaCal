"use client";

import { EventList } from "../components/EventList";

export default function EventsPage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground dark:text-[#F5F1E8] mb-2">
          Your Events
        </h1>
        <p className="text-muted-foreground dark:text-gray-400">
          View and manage all your events across Health, Work, and Relationships systems
        </p>
      </div>
      <EventList />
    </div>
  );
}
