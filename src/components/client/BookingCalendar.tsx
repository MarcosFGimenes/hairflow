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
    <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="p-6 pb-0">
        <CardTitle className="font-semibold text-slate-900 dark:text-slate-100 text-center">Escolha a data</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center p-6 pt-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateSelect}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4"
          locale={ptBR}
          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
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
            head_cell: "text-slate-500 dark:text-slate-400 rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md [&:has([aria-selected])]:bg-slate-100 dark:[&:has([aria-selected])]:bg-slate-800 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
            day_range_end: "day-range-end",
            day_selected: "bg-teal-500 text-white hover:bg-teal-600 hover:text-white focus:bg-teal-600 focus:text-white rounded-lg dark:bg-teal-400 dark:text-slate-900 dark:hover:bg-teal-500",
            day_today: "bg-slate-200 text-slate-900 rounded-lg dark:bg-slate-800 dark:text-slate-100",
            day_outside: "text-slate-500 opacity-50 dark:text-slate-400",
            day_disabled: "text-slate-500 opacity-50 dark:text-slate-400 cursor-not-allowed",
            day_range_middle: "aria-selected:bg-slate-100 aria-selected:text-slate-900 dark:aria-selected:bg-slate-800 dark:aria-selected:text-slate-100",
            day_hidden: "invisible",
          }}
        />
      </CardContent>
    </Card>
  );
}