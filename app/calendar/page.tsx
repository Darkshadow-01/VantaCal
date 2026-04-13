import { VanCal } from "@/components/Calendar/VanCal";
import { AIChatInput } from "@/components/AIChatInput";

export default function CalendarPage() {
  return (
    <div className="relative">
      <VanCal />
      <div className="absolute bottom-4 right-4 z-40 w-80">
        <AIChatInput />
      </div>
    </div>
  );
}
