// src/hooks/useDynamicTheme.ts

import { useState, useEffect } from 'react';
import ColorThief from 'colorthief';

// Define a estrutura do nosso objeto de tema
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

// Função auxiliar para converter RGB para HSL
const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
};

// Função auxiliar para determinar a cor do texto com base no fundo (preto ou branco)
const getContrastingTextColor = (rgb: number[]): string => {
    const [r, g, b] = rgb;
    // Fórmula de luminância do WCAG
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#020817' : '#FFFFFF'; // dark-slate-900 or white
};

// Função para clarear ou escurecer uma cor HSL
const adjustHsl = (hsl: [number, number, number], lAdjust: number): string => {
  let [h, s, l] = hsl;
  l = Math.max(0, Math.min(100, l + lAdjust));
  return `hsl(${h}, ${s}%, ${l}%)`;
};


export const useDynamicTheme = (imageUrl?: string | null): { theme: DynamicTheme | null; isLoading: boolean } => {
  const [theme, setTheme] = useState<DynamicTheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!imageUrl) {
      setIsLoading(false);
      setTheme(null); // Reseta para o tema padrão se não houver imagem
      return;
    }

    const colorThief = new ColorThief();
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Essencial para evitar erros de CORS
    img.src = imageUrl;

    img.onload = () => {
      try {
        // Extrai a cor predominante e a paleta
        const dominantRgb = colorThief.getColor(img);
        const paletteRgb = colorThief.getPalette(img, 5);

        // Define a cor primária como a mais vibrante da paleta (ou a dominante)
        const primaryRgb = paletteRgb[1] || dominantRgb;
        const backgroundRgb = paletteRgb[3] || [250, 250, 250]; // Um fallback claro

        // Converte para HSL para manipulação
        const primaryHsl = rgbToHsl(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
        const backgroundHsl = rgbToHsl(backgroundRgb[0], backgroundRgb[1], backgroundRgb[2]);
        
        // Determina se o fundo é escuro ou claro
        const isDarkBackground = backgroundHsl[2] < 50;

        // Cria a paleta de tema final
        const newTheme: DynamicTheme = {
          primary: `hsl(${primaryHsl[0]}, ${primaryHsl[1]}%, ${primaryHsl[2]}%)`,
          primaryForeground: getContrastingTextColor(primaryRgb),
          background: `hsl(${backgroundHsl[0]}, ${backgroundHsl[1]}%, ${backgroundHsl[2]}%)`,
          foreground: isDarkBackground ? '#FFFFFF' : '#020817',
          card: adjustHsl(backgroundHsl, isDarkBackground ? 5 : -5), // card um pouco diferente do fundo
          cardForeground: isDarkBackground ? '#FFFFFF' : '#020817',
          muted: adjustHsl(backgroundHsl, isDarkBackground ? 10 : -10),
          mutedForeground: adjustHsl(backgroundHsl, isDarkBackground ? 35 : -35),
        };
        
        setTheme(newTheme);
      } catch (error) {
        console.error('Erro ao extrair as cores:', error);
        setTheme(null); // Fallback para tema padrão em caso de erro
      } finally {
        setIsLoading(false);
      }
    };
    
    img.onerror = () => {
        console.error("Erro ao carregar a imagem para extração de cores.");
        setIsLoading(false);
        setTheme(null);
    };

  }, [imageUrl]);

  return { theme, isLoading };
};