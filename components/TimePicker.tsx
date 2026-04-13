"use client";

import { useState, useMemo, useRef } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
}

export function TimePicker({ value, onChange, label }: TimePickerProps) {
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  const initialState = useMemo(() => {
    if (value) {
      const [h, m] = value.split(":").map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        return {
          hours: h >= 12 ? (h === 12 ? 12 : h - 12) : (h === 0 ? 12 : h),
          minutes: m,
          period: h >= 12 ? "PM" as const : "AM" as const,
        };
      }
    }
    return { hours: 12, minutes: 0, period: "AM" as const };
  }, [value]);

  const [hours, setHours] = useState(initialState.hours);
  const [minutes, setMinutes] = useState(initialState.minutes);
  const [period, setPeriod] = useState<"AM" | "PM">(initialState.period);

  const updateValue = (h: number, m: number, p: "AM" | "PM") => {
    let hour24 = h;
    if (p === "AM" && h === 12) hour24 = 0;
    if (p === "PM" && h !== 12) hour24 = h + 12;
    onChange(`${hour24.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
  };

  const scrollHours = (delta: number) => {
    let newHours = hours + delta;
    if (newHours > 12) newHours = 1;
    if (newHours < 1) newHours = 12;
    setHours(newHours);
    updateValue(newHours, minutes, period);
  };

  const scrollMinutes = (delta: number) => {
    let newMinutes = minutes + delta;
    if (newMinutes >= 60) newMinutes = 0;
    if (newMinutes < 0) newMinutes = 55;
    setMinutes(newMinutes);
    updateValue(hours, newMinutes, period);
  };

  const togglePeriod = () => {
    const newPeriod = period === "AM" ? "PM" : "AM";
    setPeriod(newPeriod);
    updateValue(hours, minutes, newPeriod);
  };

  const hoursList = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutesList = Array.from({ length: 12 }, (_, i) => i * 5);

  const getVisibleHours = () => {
    const activeIdx = hoursList.indexOf(hours);
    const result: { value: number; isActive: boolean }[] = [];
    for (let i = -2; i <= 2; i++) {
      const itemIdx = (activeIdx + i + hoursList.length) % hoursList.length;
      result.push({ value: hoursList[itemIdx], isActive: i === 0 });
    }
    return result;
  };

  const getVisibleMinutes = () => {
    const rounded = Math.round(minutes / 5) * 5 || 0;
    const activeIdx = minutesList.indexOf(rounded);
    const result: { value: number; isActive: boolean }[] = [];
    for (let i = -2; i <= 2; i++) {
      const itemIdx = (activeIdx + i + minutesList.length) % minutesList.length;
      result.push({ value: minutesList[itemIdx], isActive: i === 0 });
    }
    return result;
  };

  return (
    <div className="space-y-1">
      {label && <label className="text-xs text-gray-500 uppercase tracking-wide block">{label}</label>}
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => scrollHours(1)}
            className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 p-0.5 bg-[#252830] hover:bg-[#3a3f4a] rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <div 
            ref={hourRef}
            className="flex flex-col items-center bg-[#1A1D24] border border-[#2a2d33] rounded-lg overflow-hidden h-[120px] w-[55px]"
          >
            {getVisibleHours().map((item, idx) => (
              <div
                key={`${item.value}-${idx}`}
                className={`flex items-center justify-center w-full h-[24px] text-sm transition-all duration-200 cursor-pointer select-none ${
                  item.isActive 
                    ? "bg-[#5B8DEF] text-white font-semibold" 
                    : item.value === hoursList[hoursList.indexOf(hours)] 
                      ? "text-white" 
                      : "text-gray-500"
                }`}
                style={{
                  opacity: item.isActive ? 1 : 0.4,
                }}
                onClick={() => {
                  setHours(item.value);
                  updateValue(item.value, minutes, period);
                }}
              >
                {String(item.value).padStart(2, "0")}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => scrollHours(-1)}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10 p-0.5 bg-[#252830] hover:bg-[#3a3f4a] rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        <span className="text-white text-2xl font-light pb-4">:</span>

        <div className="relative">
          <button
            type="button"
            onClick={() => scrollMinutes(5)}
            className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 p-0.5 bg-[#252830] hover:bg-[#3a3f4a] rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <div 
            ref={minuteRef}
            className="flex flex-col items-center bg-[#1A1D24] border border-[#2a2d33] rounded-lg overflow-hidden h-[120px] w-[55px]"
          >
            {getVisibleMinutes().map((item, idx) => (
              <div
                key={`${item.value}-${idx}`}
                className={`flex items-center justify-center w-full h-[24px] text-sm transition-all duration-200 cursor-pointer select-none ${
                  item.isActive 
                    ? "bg-[#5B8DEF] text-white font-semibold" 
                    : "text-gray-500"
                }`}
                style={{
                  opacity: item.isActive ? 1 : 0.4,
                }}
                onClick={() => {
                  setMinutes(item.value);
                  updateValue(hours, item.value, period);
                }}
              >
                {String(item.value).padStart(2, "0")}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => scrollMinutes(-5)}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10 p-0.5 bg-[#252830] hover:bg-[#3a3f4a] rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        <div className="flex flex-col gap-1 ml-2">
          <button
            type="button"
            onClick={togglePeriod}
            className={`w-12 h-[54px] rounded-lg text-xs font-bold transition-colors ${
              period === "AM" 
                ? "bg-[#5B8DEF] text-white" 
                : "bg-[#252830] text-gray-400 hover:text-white"
            }`}
          >
            AM
          </button>
          <button
            type="button"
            onClick={togglePeriod}
            className={`w-12 h-[54px] rounded-lg text-xs font-bold transition-colors ${
              period === "PM" 
                ? "bg-[#5B8DEF] text-white" 
                : "bg-[#252830] text-gray-400 hover:text-white"
            }`}
          >
            PM
          </button>
        </div>
      </div>
    </div>
  );
}
