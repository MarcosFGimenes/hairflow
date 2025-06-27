"use client";

import { useState, useEffect } from 'react';

// Define a estrutura do objeto de tema
export interface DynamicTheme {
  primary: string;
  primaryForeground: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
}

export const useDynamicTheme = (): { theme: DynamicTheme; isLoading: boolean } => {
  const [theme, setTheme] = useState<DynamicTheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Define um tema universal com base no design do BookingCalendar
    const universalTheme: DynamicTheme = {
      primary: '#14B8A6', // teal-500, vibrante e profissional
      primaryForeground: '#FFFFFF', // branco para contraste com teal
      background: 'rgba(255, 255, 255, 0.8)', // fundo branco com transparência, como bg-white/80
      foreground: '#020817', // slate-900 para texto principal
      card: 'rgba(248, 250, 252, 0.9)', // slate-50 com leve transparência para cards
      cardForeground: '#020817', // slate-900 para texto em cards
      muted: 'rgba(241, 245, 249, 0.8)', // slate-100 com transparência para elementos suaves
      mutedForeground: '#64748B', // slate-500 para texto secundário
    };

    setTheme(universalTheme);
    setIsLoading(false);
  }, []);

  return { theme: theme!, isLoading };
};