"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { TimeSlot } from '@/lib/types';
import { format } from 'date-fns';
import { Clock, Check } from 'lucide-react';

interface SlotPickerProps {
  availableSlots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
  isLoading?: boolean;
}

export function SlotPicker({ availableSlots, selectedSlot, onSlotSelect, isLoading }: SlotPickerProps) {
  if (isLoading) {
    return (
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-center">Available Times</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Clock className="animate-spin h-8 w-8 mx-auto text-primary mb-2" />
          <p className="text-muted-foreground">Loading available slots...</p>
        </CardContent>
      </Card>
    );
  }

  if (availableSlots.length === 0) {
    return (
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-center">Available Times</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No available slots for the selected date/professional.</p>
          <p className="text-sm text-muted-foreground">Please try a different selection.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-center">Available Times</CardTitle>
        <CardDescription className="text-center">Click a time to select your appointment slot.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {availableSlots.map((slot) => (
            <Button
              key={slot.id}
              variant={selectedSlot?.id === slot.id ? "default" : "outline"}
              onClick={() => onSlotSelect(slot)}
              disabled={slot.isBooked}
              className={`w-full py-3 text-md transition-all duration-150 ease-in-out transform hover:scale-105
                ${slot.isBooked ? 'cursor-not-allowed opacity-50 line-through' : ''}
                ${selectedSlot?.id === slot.id ? 'ring-2 ring-primary ring-offset-2 shadow-lg' : 'hover:bg-accent/10'}`}
            >
              {selectedSlot?.id === slot.id && <Check className="mr-2 h-4 w-4" />}
              {format(new Date(slot.startTime), 'p')}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
