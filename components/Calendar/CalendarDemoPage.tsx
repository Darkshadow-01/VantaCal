"use client";

import { useState } from "react";
import { CalendarView } from "@/components/Calendar";
import { SAMPLE_EVENTS, SAMPLE_BUFFERS } from "@/components/Calendar/sampleData";
import type { EventData } from "@/lib/use-encrypted-events";
import type { BufferBlock } from "@/lib/schedulerWithBuffers";

export default function CalendarDemoPage() {
  const [events, setEvents] = useState<any[]>(SAMPLE_EVENTS);
  const [buffers, setBuffers] = useState<BufferBlock[]>(SAMPLE_BUFFERS);
  const [userId] = useState("demo-user");

  const handleSaveEvent = async (data: any) => {
    // Simulate Convex API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newEvent = {
      ...data,
      _id: `event-${Date.now()}`,
      _creationTime: Date.now(),
    };

    // Optimistic update
    setEvents((prev) => [...prev, newEvent]);

    // Recalculate buffers (simulate AI analysis)
    await recalculateBuffers([...events, newEvent]);
  };

  const handleDeleteEvent = async (eventId: string) => {
    // Optimistic update
    setEvents((prev) => prev.filter((e) => e._id !== eventId));

    // Recalculate buffers
    await recalculateBuffers(events.filter((e) => e._id !== eventId));
  };

  const recalculateBuffers = async (updatedEvents: EventData[]) => {
    // Simulate AI buffer calculation
    await new Promise((resolve) => setTimeout(resolve, 300));

    const newBuffers: BufferBlock[] = [];

    updatedEvents.forEach((event, index) => {
      // Add transition buffers between events
      if (index < updatedEvents.length - 1) {
        const nextEvent = updatedEvents[index + 1];
        const gap = nextEvent.startTime - event.endTime;

        if (gap > 30 * 60 * 1000) { // > 30 minutes
          newBuffers.push({
            id: `buffer-${event._id}-transition`,
            afterEventId: event._id,
            beforeEventId: nextEvent._id,
            startTime: event.endTime,
            endTime: event.endTime + 15 * 60 * 1000,
            duration: 15,
            purpose: "transition",
            riskReduction: 0.3,
            recommended: true,
          });
        }
      }

      // Add recovery buffers for high-effort events
      if (event.system === "Work") {
        newBuffers.push({
          id: `buffer-${event._id}-recovery`,
          afterEventId: event._id,
          startTime: event.endTime,
          endTime: event.endTime + 10 * 60 * 1000,
          duration: 10,
          purpose: "recovery",
          riskReduction: 0.5,
          recommended: true,
        });
      }
    });

    setBuffers(newBuffers);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-[1600px] mx-auto">
        <CalendarView />
      </div>
    </div>
  );
}
