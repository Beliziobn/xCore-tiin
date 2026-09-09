"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2 sm:p-3 select-none", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-3 sm:space-x-4 sm:space-y-0 relative",
        month: "space-y-3 w-full",
        month_caption: "flex justify-center items-center h-8 text-sm font-bold text-slate-800 tracking-tight capitalize",
        caption_label: "text-sm font-bold text-slate-800 select-none",
        nav: "flex items-center justify-between absolute top-0 inset-x-0 w-full px-0.5 pointer-events-none z-10",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-white/90 hover:bg-slate-100 p-0 text-slate-600 hover:text-slate-900 pointer-events-auto cursor-pointer shadow-2xs border-slate-200/80 rounded-lg"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-white/90 hover:bg-slate-100 p-0 text-slate-600 hover:text-slate-900 pointer-events-auto cursor-pointer shadow-2xs border-slate-200/80 rounded-lg"
        ),
        month_grid: "w-full border-collapse select-none mt-2",
        weekdays: "border-b border-slate-100",
        weekday:
          "text-slate-400 font-semibold text-[0.72rem] uppercase tracking-wider h-8 text-center align-middle w-9 sm:w-10 select-none pb-1",
        weeks: "w-full",
        week: "mt-1",
        day: "h-9 w-9 sm:h-9.5 sm:w-9.5 text-center p-0 relative align-middle focus-within:relative focus-within:z-20 text-sm",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 sm:h-8.5 sm:w-8.5 mx-auto p-0 font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-full flex items-center justify-center text-xs sm:text-sm transition-all cursor-pointer"
        ),
        range_start: "bg-blue-500/20 rounded-l-full",
        range_end: "bg-blue-500/20 rounded-r-full",
        range_middle: "bg-blue-500/20",
        selected: "text-slate-900",
        today: "font-bold text-blue-600",
        outside: "text-slate-300 opacity-40 hover:opacity-70 pointer-events-none",
        disabled: "text-slate-300 opacity-30 cursor-not-allowed",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClass }) => {
          if (orientation === "left") {
            return <ChevronLeft className={cn("h-4 w-4", chevronClass)} />;
          }
          return <ChevronRight className={cn("h-4 w-4", chevronClass)} />;
        },
        DayButton: ({ day, modifiers, className: btnClass, ...btnProps }: any) => {
          return (
            <button
              {...btnProps}
              data-range-start={modifiers.range_start ? "true" : undefined}
              data-range-end={modifiers.range_end ? "true" : undefined}
              data-range-middle={modifiers.range_middle ? "true" : undefined}
              data-selected={modifiers.selected ? "true" : undefined}
              data-today={modifiers.today ? "true" : undefined}
              data-disabled={modifiers.disabled ? "true" : undefined}
              data-outside={modifiers.outside ? "true" : undefined}
              className={btnClass}
            />
          );
        },
        Day: ({ day, modifiers, className: tdClass, ...tdProps }: any) => {
          return (
            <td
              {...tdProps}
              data-range-start={modifiers.range_start ? "true" : undefined}
              data-range-end={modifiers.range_end ? "true" : undefined}
              data-range-middle={modifiers.range_middle ? "true" : undefined}
              data-selected={modifiers.selected ? "true" : undefined}
              data-today={modifiers.today ? "true" : undefined}
              data-outside={modifiers.outside ? "true" : undefined}
              className={cn("group/day", tdClass)}
            />
          );
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }

