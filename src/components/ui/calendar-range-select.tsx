"use client";

import { useState } from "react";
import { type DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar-range-select-utils/calendar";

export interface CustomRangeSelectProps {
  dateRange?: DateRange | undefined;
  onSelect?: (range: DateRange | undefined) => void;
  className?: string;
  defaultMonth?: Date;
}

const CustomRangeSelectDemo = ({
  dateRange: controlledRange,
  onSelect: controlledOnSelect,
  className = "rounded-md border",
  defaultMonth,
}: CustomRangeSelectProps = {}) => {
  const [internalDateRange, setInternalDateRange] = useState<DateRange | undefined>({
    from: new Date(2026, 5, 4),
    to: new Date(2026, 5, 17),
  });

  const isControlled = controlledRange !== undefined || controlledOnSelect !== undefined;
  const dateRange = isControlled ? controlledRange : internalDateRange;

  const handleSelect = (range: DateRange | undefined) => {
    if (!isControlled) {
      setInternalDateRange(range);
    }
    if (controlledOnSelect) {
      controlledOnSelect(range);
    }
  };

  return (
    <>
      <Calendar
        mode="range"
        defaultMonth={defaultMonth || dateRange?.from}
        selected={dateRange}
        onSelect={handleSelect}
        className={className}
        classNames={{
          range_start: "bg-blue-500/20 rounded-l-full",
          range_end: "bg-blue-500/20 rounded-r-full",
          day_button:
            "data-[range-end=true]:rounded-full! data-[range-start=true]:rounded-full! data-[range-start=true]:bg-blue-500! data-[range-start=true]:text-white! data-[range-start=true]:group-data-[focused=true]/day:ring-blue-500/20  data-[range-end=true]:bg-blue-500! data-[range-end=true]:text-white! data-[range-end=true]:group-data-[focused=true]/day:ring-blue-500/20 data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-blue-500/20 hover:rounded-full",
          today:
            "data-[selected=true]:rounded-l-none! rounded-full bg-accent! data-[selected=true]:bg-blue-500/20! [&_button[data-range-middle=true]]:bg-transparent!",
        }}
      />
    </>
  );
};

export default CustomRangeSelectDemo;
