"use client";

import React from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BookingCalendarProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  // availableDates?: Date[]; // Potentially highlight dates with availability
  // bookedDates?: Date[]; // Potentially disable or mark fully booked dates
}

export function BookingCalendar({ selectedDate, onDateSelect }: BookingCalendarProps) {
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-center">Select a Date</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateSelect}
          className="rounded-md border"
          // Modifiers can be used to style specific dates
          // modifiers={{ available: availableDates, booked: bookedDates }}
          // modifiersStyles={{ available: { fontWeight: 'bold' }, booked: { textDecoration: 'line-through', opacity: 0.5 } }}
          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} // Disable past dates
        />
      </CardContent>
    </Card>
  );
}
