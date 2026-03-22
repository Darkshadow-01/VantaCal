"use client";

import { EventList } from "../components/EventList";

export default function EventsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Events
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your events across Health, Work, and Relationships systems
        </p>
      </div>
      <EventList />
    </div>
  );
}
