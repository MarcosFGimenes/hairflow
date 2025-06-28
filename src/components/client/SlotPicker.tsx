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
  // Estilos reutilizáveis para o Card, agora com suporte ao tema escuro
  const cardClassName = "border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl";
  const cardHeaderClassName = "p-6 pb-2"; // Reduzido o padding inferior para melhor espaçamento
  const cardTitleClassName = "font-semibold text-slate-900 dark:text-slate-100 text-center text-xl";
  const cardDescriptionClassName = "text-center text-slate-600 dark:text-slate-400 pt-1";

  // --- Estado de Carregamento ---
  if (isLoading) {
    return (
      <Card className={cardClassName}>
        <CardHeader className={cardHeaderClassName}>
          <CardTitle className={cardTitleClassName}>Horários Disponíveis</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center py-10">
          <Clock className="animate-spin h-8 w-8 text-teal-500 dark:text-teal-400 mb-3" />
          <p className="text-slate-600 dark:text-slate-400">Carregando horários...</p>
        </CardContent>
      </Card>
    );
  }

  // --- Estado Sem Horários Disponíveis ---
  if (availableSlots.length === 0) {
    return (
      <Card className={cardClassName}>
        <CardHeader className={cardHeaderClassName}>
          <CardTitle className={cardTitleClassName}>Horários Disponíveis</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-10">
          <p className="font-medium text-slate-700 dark:text-slate-300">Nenhum horário disponível.</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Por favor, tente outra data ou profissional.</p>
        </CardContent>
      </Card>
    );
  }

  // --- Seletor de Horários ---
  return (
    <Card className={cardClassName}>
      <CardHeader className={cardHeaderClassName}>
        <CardTitle className={cardTitleClassName}>Horários Disponíveis</CardTitle>
        <CardDescription className={cardDescriptionClassName}>
          Clique em um horário para agendar.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {availableSlots.map((slot) => {
            const isSelected = selectedSlot?.id === slot.id;
            return (
              <Button
                key={slot.id}
                // A variante do botão muda dinamicamente, mas os estilos são sobrescritos abaixo para maior controle
                variant={isSelected ? "default" : "outline"}
                onClick={() => onSlotSelect(slot)}
                disabled={slot.isBooked}
                className={`w-full py-3 text-md font-semibold transition-all duration-200 ease-in-out transform focus:scale-105 focus:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900
                  ${
                    slot.isBooked
                      ? 'cursor-not-allowed opacity-40 line-through'
                      : ''
                  }
                  ${
                    isSelected
                      ? 'bg-teal-500 hover:bg-teal-600 text-white dark:bg-teal-400 dark:hover:bg-teal-500 dark:text-slate-900 ring-teal-500 dark:ring-teal-400 shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-200'
                  }`
                }
              >
                {isSelected && <Check className="mr-2 h-5 w-5" />}
                {format(new Date(slot.startTime), 'HH:mm', { locale: ptBR })}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}