"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { TimeSlot } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Check } from 'lucide-react';

interface SlotPickerProps {
  availableSlots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
  isLoading?: boolean;
}

export function SlotPicker({ availableSlots, selectedSlot, onSlotSelect, isLoading }: SlotPickerProps) {
  // Common Card styling for consistency with BookingCalendar
  const cardClassName = "border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-2xl";
  const cardHeaderClassName = "p-6 pb-0";
  const cardTitleClassName = "font-semibold text-slate-900 text-center text-xl";

  if (isLoading) {
    return (
      <Card className={cardClassName}>
        <CardHeader className={cardHeaderClassName}>
          <CardTitle className={cardTitleClassName}>Horários Disponíveis</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8"> {/* py-8 for vertical centering of loading state */}
          <Clock className="animate-spin h-8 w-8 mx-auto text-teal-500 mb-2" />
          <p className="text-slate-500">Carregando horários disponíveis...</p>
        </CardContent>
      </Card>
    );
  }

  if (availableSlots.length === 0) {
    return (
      <Card className={cardClassName}>
        <CardHeader className={cardHeaderClassName}>
          <CardTitle className={cardTitleClassName}>Horários Disponíveis</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8"> {/* py-8 for vertical centering of no slots message */}
          <p className="text-slate-500">Nenhum horário disponível para a data/profissional selecionado.</p>
          <p className="text-sm text-slate-500">Por favor, tente uma seleção diferente.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cardClassName}>
      <CardHeader className={cardHeaderClassName}>
        <CardTitle className={cardTitleClassName}>Horários Disponíveis</CardTitle>
        <CardDescription className="text-center text-slate-500">Clique em um horário para selecionar o seu agendamento.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-4"> {/* Consistent padding with BookingCalendar content */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {availableSlots.map((slot) => (
            <Button
              key={slot.id}
              variant={selectedSlot?.id === slot.id ? "default" : "outline"}
              onClick={() => onSlotSelect(slot)}
              disabled={slot.isBooked}
              className={`w-full py-3 text-md transition-all duration-150 ease-in-out transform hover:scale-105
                ${slot.isBooked ? 'cursor-not-allowed opacity-50 line-through text-slate-500' : ''}
                ${selectedSlot?.id === slot.id ? 'ring-2 ring-teal-500 ring-offset-2 shadow-lg bg-teal-500 hover:bg-teal-600 text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-900'}`}
            >
              {selectedSlot?.id === slot.id && <Check className="mr-2 h-4 w-4" />}
              {format(new Date(slot.startTime), 'HH:mm', { locale: ptBR })}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
