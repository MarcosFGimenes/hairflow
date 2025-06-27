"use client";

import React from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ptBR } from "date-fns/locale";

interface BookingCalendarProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  // availableDates?: Date[]; // Potentially highlight dates with availability
  // bookedDates?: Date[]; // Potentially disable or mark fully booked dates
}

export function BookingCalendar({ selectedDate, onDateSelect }: BookingCalendarProps) {
  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="p-6 pb-0">
        <CardTitle className="font-semibold text-slate-900 text-center">Escolha a data</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center p-6 pt-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateSelect}
          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          locale={ptBR}
          // Modifiers can be used to style specific dates
          // modifiers={{ available: availableDates, booked: bookedDates }}
          // modifiersStyles={{ available: { fontWeight: 'bold' }, booked: { textDecoration: 'line-through', opacity: 0.5 } }}
          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} // Disable past dates
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-slate-500 rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md [&:has([aria-selected])]:bg-slate-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
            day_range_end: "day-range-end",
            day_selected: "bg-teal-500 text-white hover:bg-teal-600 hover:text-white focus:bg-teal-600 focus:text-white rounded-lg",
            day_today: "bg-slate-200 text-slate-900 rounded-lg",
            day_outside: "text-slate-500 opacity-50",
            day_disabled: "text-slate-500 opacity-50 cursor-not-allowed",
            day_range_middle: "aria-selected:bg-slate-100 aria-selected:text-slate-900",
            day_hidden: "invisible",
            // Add more custom classes as needed
          }}
        />
      </CardContent>
    </Card>
  );
}


