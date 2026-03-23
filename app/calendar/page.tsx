import { CalendarDashboard } from "../components/CalendarDashboard";

export default function CalendarPage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground dark:text-[#F5F1E8] mb-2">
          Calendar View
        </h1>
        <p className="text-muted-foreground dark:text-gray-400">
          Manage and view your events across all systems
        </p>
      </div>
      <CalendarDashboard />
    </div>
  );
}
