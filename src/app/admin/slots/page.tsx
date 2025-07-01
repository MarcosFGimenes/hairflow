// src/app/admin/slots/page.tsx

"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/PageHeader';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
    getProfessionalsBySalon, 
    getProfessionalAvailability, 
    saveRecurringAvailability, 
    saveDateOverrides 
} from '@/lib/firestoreService';
import { useToast } from "@/hooks/use-toast";
import type { Professional, WorkDay } from '@/lib/types';
import { CalendarIcon, PlusCircle, Trash2, Loader2, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';

// --- CORREÇÃO 1: MAPEAMENTO DE DIAS ---
// Mapeia o nome de exibição (Português) para a chave de dados (Inglês, minúsculo)
const dayMapping: { [key: string]: string } = {
  'Segunda-feira': 'monday',
  'Terça-feira': 'tuesday',
  'Quarta-feira': 'wednesday',
  'Quinta-feira': 'thursday',
  'Sexta-feira': 'friday',
  'Sábado': 'saturday',
  'Domingo': 'sunday',
};
// Array usado para a interface, mantendo a ordem e o nome em Português
const displayDaysOfWeek = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];


export default function ManageSlotsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
  
    const [salonProfessionals, setSalonProfessionals] = useState<Professional[]>([]);
    const [selectedProfessional, setSelectedProfessional] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const [isSavingRecurring, setIsSavingRecurring] = useState(false);
    const [isSavingOverrides, setIsSavingOverrides] = useState(false);

    // O estado agora usará as chaves em INGLÊS para consistência
    const [recurringAvailability, setRecurringAvailability] = useState<{ [key: string]: WorkDay }>({});
    
    // O resto do estado permanece o mesmo
    const [specificOverrides, setSpecificOverrides] = useState<{ date: Date | undefined, startTime: string, endTime: string, type: 'available' | 'unavailable' }[]>([]);
    const [overrideDate, setOverrideDate] = useState<Date | undefined>();
    const [overrideStartTime, setOverrideStartTime] = useState('09:00');
    const [overrideEndTime, setOverrideEndTime] = useState('17:00');
    const [overrideType, setOverrideType] = useState<'available' | 'unavailable'>('available');


    // Efeito para buscar profissionais e definir o profissional selecionado a partir da URL
    useEffect(() => {
      const fetchAndSetData = async () => {
        if (user) {
          setIsLoading(true);
          const fetchedProfessionals = await getProfessionalsBySalon(user.uid);
          setSalonProfessionals(fetchedProfessionals);

          const professionalFromUrl = searchParams.get('professional');
          if (professionalFromUrl && fetchedProfessionals.some(p => p.id === professionalFromUrl)) {
            setSelectedProfessional(professionalFromUrl);
          } else if (fetchedProfessionals.length > 0) {
            setSelectedProfessional(fetchedProfessionals[0].id);
            // Atualiza a URL com o primeiro profissional como padrão
            router.replace(`/admin/slots?professional=${fetchedProfessionals[0].id}`);
          }
          
          setIsLoading(false);
        } else if (!authLoading) {
           setIsLoading(false);
           setSalonProfessionals([]);
        }
      };

      fetchAndSetData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, authLoading]);

    // Efeito para buscar a disponibilidade do profissional selecionado
    useEffect(() => {
      const fetchAvailability = async () => {
        if (selectedProfessional) {
          setIsLoading(true);
          const availability = await getProfessionalAvailability(selectedProfessional);
          
          // --- CORREÇÃO 2: LER DADOS DO FIREBASE E NORMALIZAR ---
          // Esta lógica garante que todos os dias estejam no estado com chaves em INGLÊS,
          // mesmo que tenham sido salvos em Português anteriormente.
          const normalizedAvailability: { [key: string]: WorkDay } = {};
          
          displayDaysOfWeek.forEach(displayDay => {
              const keyInEnglish = dayMapping[displayDay]; // ex: 'monday'
              const keyInPortuguese = displayDay; // ex: 'Segunda-feira'

              // Verifica se há dados salvos (em inglês ou português) ou usa o padrão
              const dayData = availability?.recurringAvailability?.[keyInEnglish] ||
                              availability?.recurringAvailability?.[keyInPortuguese] || 
                              { isWorkDay: false, startTime: '09:00', endTime: '17:00' };
              
              normalizedAvailability[keyInEnglish] = dayData;
          });

          setRecurringAvailability(normalizedAvailability);
          setSpecificOverrides(availability?.dateOverrides || []);
          setIsLoading(false);
        }
      };
      fetchAvailability();
    }, [selectedProfessional]);


    // Função para atualizar a URL quando o profissional for alterado
    const handleProfessionalChange = (professionalId: string) => {
        setSelectedProfessional(professionalId);
        router.push(`/admin/slots?professional=${professionalId}`);
    };

    // Função para lidar com mudanças na disponibilidade recorrente
    const handleRecurringChange = (dayKey: string, field: 'isWorkDay' | 'startTime' | 'endTime', value: string | boolean) => {
        setRecurringAvailability(prev => ({
            ...prev,
            [dayKey]: { ...prev[dayKey], [field]: value }
        }));
    };

    // --- CORREÇÃO 3: SALVAR DADOS COM CHAVES EM INGLÊS ---
    const handleSaveRecurring = async () => {
      if (!selectedProfessional) return;
      setIsSavingRecurring(true);
      
      // O estado 'recurringAvailability' já está com as chaves em inglês, então podemos salvar diretamente.
      try {
        await saveRecurringAvailability(selectedProfessional, recurringAvailability);
        toast({ title: "Sucesso!", description: "Disponibilidade semanal salva." });
      } catch (error) {
        console.error("Erro ao salvar disponibilidade:", error);
        toast({ title: "Erro", description: "Não foi possível salvar a disponibilidade.", variant: "destructive" });
      } finally {
        setIsSavingRecurring(false);
      }
    };

    // O resto das funções (overrides, etc.) permanecem as mesmas
    const handleAddOverride = () => {
        if (overrideDate) {
          setSpecificOverrides([...specificOverrides, { date: overrideDate, startTime: overrideStartTime, endTime: overrideEndTime, type: overrideType }]);
          setOverrideDate(undefined); // Reseta após adicionar
        }
    };
      
    const handleRemoveOverride = (index: number) => {
        setSpecificOverrides(specificOverrides.filter((_, i) => i !== index));
    };

    const handleSaveOverrides = async () => {
        if (!selectedProfessional) return;
        setIsSavingOverrides(true);
        try {
            await saveDateOverrides(selectedProfessional, specificOverrides);
            toast({ title: "Sucesso!", description: "Exceções de data salvas." });
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível salvar as exceções.", variant: "destructive" });
        } finally {
            setIsSavingOverrides(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <>
                <PageHeader title="Gerenciar Disponibilidade" description="Defina os horários de trabalho para seus profissionais." />
                <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            </>
        );
    }

    return (
        <>
            <PageHeader title="Gerenciar Disponibilidade" description="Defina os horários de trabalho e exceções para seus profissionais."/>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Seleção de Profissional */}
                <Card className="lg:col-span-1 shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Selecionar Profissional</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {salonProfessionals.length > 0 ? (
                            <Select value={selectedProfessional} onValueChange={handleProfessionalChange}>
                                <SelectTrigger><SelectValue placeholder="Selecione um profissional" /></SelectTrigger>
                                <SelectContent>
                                    {salonProfessionals.map(prof => (
                                        <SelectItem key={prof.id} value={prof.id}>{prof.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <p className="text-sm text-muted-foreground">Nenhum profissional encontrado.</p>
                        )}
                        {selectedProfessional && (
                            <p className="mt-2 text-sm text-muted-foreground">Gerenciando a disponibilidade para {salonProfessionals.find(p => p.id === selectedProfessional)?.name}.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Disponibilidade Recorrente */}
                {selectedProfessional && (
                    <Card className="lg:col-span-2 shadow-lg">
                        <CardHeader>
                            <CardTitle className="font-headline">Disponibilidade Semanal</CardTitle>
                            <CardDescription>Defina os horários de trabalho padrão para cada dia da semana.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="multiple" className="w-full">
                                {displayDaysOfWeek.map(displayDay => {
                                    const dayKey = dayMapping[displayDay]; // Chave em INGLÊS (ex: 'monday')
                                    const dayData = recurringAvailability[dayKey] || { isWorkDay: false, startTime: '09:00', endTime: '17:00' };

                                    return (
                                        <AccordionItem value={displayDay} key={displayDay}>
                                            <AccordionTrigger className="font-semibold">{displayDay}</AccordionTrigger>
                                            <AccordionContent className="space-y-4 pt-2">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox 
                                                        id={`isOpen-${dayKey}`}
                                                        checked={dayData.isWorkDay}
                                                        onCheckedChange={(checked) => handleRecurringChange(dayKey, 'isWorkDay', !!checked)}
                                                        disabled={isSavingRecurring}
                                                    />
                                                    <Label htmlFor={`isOpen-${dayKey}`}>Aberto(a) neste dia</Label>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor={`startTime-${dayKey}`}>Hora de Início</Label>
                                                        <Input 
                                                            type="time" 
                                                            id={`startTime-${dayKey}`}
                                                            value={dayData.startTime}
                                                            onChange={(e) => handleRecurringChange(dayKey, 'startTime', e.target.value)}
                                                            disabled={!dayData.isWorkDay || isSavingRecurring}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor={`endTime-${dayKey}`}>Hora de Término</Label>
                                                        <Input 
                                                            type="time" 
                                                            id={`endTime-${dayKey}`}
                                                            value={dayData.endTime}
                                                            onChange={(e) => handleRecurringChange(dayKey, 'endTime', e.target.value)}
                                                            disabled={!dayData.isWorkDay || isSavingRecurring}
                                                        />
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )
                                })}
                            </Accordion>
                            <Button onClick={handleSaveRecurring} disabled={isSavingRecurring} className="mt-6 w-full">
                                {isSavingRecurring && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Salvar Disponibilidade
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* (O restante do código para Exceções permanece o mesmo) */}
                {/* Exceções de Data Específicas */}
                {selectedProfessional && (
                     <Card className="lg:col-span-3 shadow-lg">
                        {/* ... (código do CardHeader para exceções) ... */}
                        <CardContent>
                           {/* ... (código para adicionar e listar exceções) ... */}
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}