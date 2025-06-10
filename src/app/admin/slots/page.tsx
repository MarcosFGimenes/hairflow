"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Mantido para campos não-formulário, se houver
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/shared/PageHeader';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getProfessionalsBySalon, 
  getProfessionalAvailability, 
  saveRecurringAvailability, 
  saveDateOverrides 
} from '@/lib/firestoreService';
import { useToast } from "@/hooks/use-toast";
import type { Professional } from '@/lib/types';
import { CalendarIcon, Clock, PlusCircle, Trash2, Loader2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation'; // Hooks para gerenciar URL params

const daysOfWeek = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

export default function ManageSlotsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [salonProfessionals, setSalonProfessionals] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast(); // Hook para notificações

  const [isSavingRecurring, setIsSavingRecurring] = useState(false);
  const [isSavingOverrides, setIsSavingOverrides] = useState(false);

  // O estado para disponibilidade e overrides permanece o mesmo por enquanto
  type RecurringDayAvailability = { isOpen: boolean; startTime: string; endTime: string };
  type RecurringAvailability = { [day: string]: RecurringDayAvailability };

  const [recurringAvailability, setRecurringAvailability] = useState<RecurringAvailability>(
    daysOfWeek.reduce((acc, day) => ({ ...acc, [day]: { isOpen: false, startTime: '09:00', endTime: '17:00' } }), {} as RecurringAvailability)
  );
  const [specificOverrides, setSpecificOverrides] = useState<{ date: Date | undefined, startTime: string, endTime: string, type: 'available' | 'unavailable' }[]>([]);
  const [overrideDate, setOverrideDate] = useState<Date | undefined>();
  const [overrideStartTime, setOverrideStartTime] = useState('09:00');
  const [overrideEndTime, setOverrideEndTime] = useState('17:00');
  const [overrideType, setOverrideType] = useState<'available' | 'unavailable'>('available');

  // Efeito para buscar profissionais e definir o padrão
  useEffect(() => {
    const fetchAndSetData = async () => {
      if (user) {
        setIsLoading(true);
        const fetchedProfessionals = await getProfessionalsBySalon(user.uid);
        setSalonProfessionals(fetchedProfessionals);

        // Verifica se há um profissional na URL, senão define o primeiro da lista como padrão
        const professionalFromUrl = searchParams.get('professional');
        if (professionalFromUrl && fetchedProfessionals.some(p => p.id === professionalFromUrl)) {
          setSelectedProfessional(professionalFromUrl);
        } else if (fetchedProfessionals.length > 0) {
          setSelectedProfessional(fetchedProfessionals[0].id);
        }
        
        setIsLoading(false);
      } else {
        setSalonProfessionals([]);
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchAndSetData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]); // A dependência de searchParams é intencionalmente omitida para evitar re-fetches

  // Efeito para buscar a disponibilidade do profissional selecionado
  useEffect(() => {
    const fetchAvailability = async () => {
      if (selectedProfessional) {
        setIsLoading(true);
        const availability = await getProfessionalAvailability(selectedProfessional);
        if (availability) {
          // Garante que todos os dias da semana estejam no estado
          const initialRecurring = daysOfWeek.reduce((acc, day) => ({ 
              ...acc, 
              [day]: availability.recurringAvailability[day] || { isOpen: false, startTime: '09:00', endTime: '17:00' }
          }), {});
          setRecurringAvailability(initialRecurring);
          setSpecificOverrides(availability.dateOverrides || []);
        } else {
           // Reseta para o padrão se não encontrar dados
           setRecurringAvailability(daysOfWeek.reduce((acc, day) => ({ ...acc, [day]: { isOpen: false, startTime: '09:00', endTime: '17:00' } }), {}));
           setSpecificOverrides([]);
        }
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

  const handleAddOverride = () => {
    if (overrideDate) {
      setSpecificOverrides([...specificOverrides, { date: overrideDate, startTime: overrideStartTime, endTime: overrideEndTime, type: overrideType }]);
      setOverrideDate(undefined); // Reseta após adicionar
    }
  };
  
  const handleRemoveOverride = (index: number) => {
    setSpecificOverrides(specificOverrides.filter((_, i) => i !== index));
  };

  // Função para lidar com mudanças na disponibilidade recorrente
  const handleRecurringChange = (day: string, field: 'isOpen' | 'startTime' | 'endTime', value: string | boolean) => {
    setRecurringAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day as keyof typeof prev], [field]: value }
    }));
  };

  // Função para salvar a disponibilidade recorrente
  const handleSaveRecurring = async () => {
    if (!selectedProfessional) return;
    setIsSavingRecurring(true);
    try {
      await saveRecurringAvailability(selectedProfessional, recurringAvailability);
      toast({ title: "Sucesso!", description: "Disponibilidade semanal salva." });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível salvar a disponibilidade.", variant: "destructive" });
    } finally {
      setIsSavingRecurring(false);
    }
  };

  // Função para salvar as exceções
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
        <PageHeader 
          title="Gerenciar Disponibilidade"
          description="Defina os horários de trabalho para seus profissionais e gerencie a disponibilidade de datas específicas."
        />
        <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Carregando configurações de disponibilidade...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title="Gerenciar Disponibilidade"
        description="Defina os horários de trabalho para seus profissionais e gerencie a disponibilidade de datas específicas."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Seleção de Profissional */}
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Selecionar Profissional</CardTitle>
          </CardHeader>
          <CardContent>
            {salonProfessionals.length > 0 ? (
              <Select value={selectedProfessional} onValueChange={handleProfessionalChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um profissional" />
                </SelectTrigger>
                <SelectContent>
                  {salonProfessionals.map(prof => (
                    <SelectItem key={prof.id} value={prof.id}>{prof.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum profissional encontrado para o seu salão. Por favor, adicione profissionais primeiro.</p>
            )}
            {selectedProfessional && salonProfessionals.length > 0 && (
                     <p className="mt-2 text-sm text-muted-foreground">Gerenciando a disponibilidade para {salonProfessionals.find(p => p.id === selectedProfessional)?.name}.</p>
            )}
          </CardContent>
        </Card>

        {/* Disponibilidade Recorrente (Somente se um profissional estiver selecionado e disponível) */}
        {selectedProfessional && salonProfessionals.length > 0 ? (
          <>
            <Card className="lg:col-span-2 shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline">Disponibilidade Semanal Recorrente</CardTitle>
                <CardDescription>Defina os horários de trabalho padrão para cada dia da semana para o profissional selecionado.</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {daysOfWeek.map(day => (
                    <AccordionItem value={day} key={day}>
                      <AccordionTrigger className="font-semibold">{day}</AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id={`isOpen-${day}`}
                            checked={recurringAvailability[day as keyof typeof recurringAvailability].isOpen}
                            onCheckedChange={(checked) => handleRecurringChange(day, 'isOpen', !!checked)}
                            disabled={!selectedProfessional || isSavingRecurring}
                          />
                          <Label htmlFor={`isOpen-${day}`}>Aberto(a) na {day}</Label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`startTime-${day}`}>Hora de Início</Label>
                            <Input 
                              type="time" 
                              id={`startTime-${day}`}
                              value={recurringAvailability[day as keyof typeof recurringAvailability].startTime}
                              onChange={(e) => handleRecurringChange(day, 'startTime', e.target.value)}
                              disabled={!recurringAvailability[day as keyof typeof recurringAvailability].isOpen || !selectedProfessional || isSavingRecurring}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`endTime-${day}`}>Hora de Término</Label>
                            <Input 
                              type="time" 
                              id={`endTime-${day}`}
                              value={recurringAvailability[day as keyof typeof recurringAvailability].endTime}
                              onChange={(e) => handleRecurringChange(day, 'endTime', e.target.value)}
                              disabled={!recurringAvailability[day as keyof typeof recurringAvailability].isOpen || !selectedProfessional || isSavingRecurring}
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                <Button onClick={handleSaveRecurring} disabled={isSavingRecurring || !selectedProfessional} className="mt-6 w-full bg-primary hover:bg-primary/90">
                  {isSavingRecurring && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                  Salvar Disponibilidade Recorrente
                </Button>
              </CardContent>
            </Card>

            {/* Exceções de Data Específicas */}
            <Card className="lg:col-span-3 shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline">Exceções de Data Específicas</CardTitle>
                <CardDescription>Adicione ou bloqueie datas e horários específicos para o profissional selecionado, substituindo as configurações recorrentes.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6 p-4 border rounded-md">
                  <h4 className="font-semibold text-md">Adicionar Nova Exceção</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                      <Label htmlFor="override-date">Data</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !overrideDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {overrideDate ? format(overrideDate, "PPP") : <span>Selecione uma data</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={overrideDate}
                            onSelect={setOverrideDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="override-type">Tipo</Label>
                      <Select value={overrideType} onValueChange={(value) => setOverrideType(value as 'available' | 'unavailable')}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Disponível</SelectItem>
                          <SelectItem value="unavailable">Indisponível (Bloquear)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {overrideType === 'available' && (
                      <>
                        <div>
                          <Label htmlFor="override-startTime">Hora de Início</Label>
                          <Input type="time" id="override-startTime" value={overrideStartTime} onChange={e => setOverrideStartTime(e.target.value)} />
                        </div>
                        <div>
                          <Label htmlFor="override-endTime">Hora de Término</Label>
                          <Input type="time" id="override-endTime" value={overrideEndTime} onChange={e => setOverrideEndTime(e.target.value)} />
                        </div>
                      </>
                    )}
                    <Button onClick={handleAddOverride} disabled={!overrideDate} className="lg:mt-auto bg-accent hover:bg-accent/90">
                      <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Exceção
                    </Button>
                  </div>
                </div>

                {specificOverrides.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-md mb-2">Exceções Atuais:</h4>
                    <ul className="space-y-2">
                      {specificOverrides.map((override, index) => (
                        <li key={index} className="flex justify-between items-center p-3 border rounded-md bg-muted/50">
                          <div>
                            <span className="font-medium">{format(override.date!, "PPP")}</span> -
                            <span className={`ml-1 ${override.type === 'available' ? 'text-green-600' : 'text-red-600'}`}>
                              {override.type === 'available' ? `Disponível das ${override.startTime} às ${override.endTime}` : 'Bloqueado'}
                            </span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveOverride(index)} className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {specificOverrides.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">Nenhuma exceção específica adicionada ainda para este profissional.</p>
                )}
                <Button onClick={handleSaveOverrides} disabled={isSavingOverrides || !selectedProfessional} className="mt-6 w-full bg-primary hover:bg-primary/90">
                  {isSavingOverrides && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                  Salvar Todas as Exceções
                </Button>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="lg:col-span-2 shadow-lg">
               <CardHeader>
                 <CardTitle className="font-headline">Gerenciar Disponibilidade</CardTitle>
               </CardHeader>
            <CardContent className="text-center py-10">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {salonProfessionals.length === 0 
                  ? "Por favor, adicione profissionais ao seu salão primeiro para gerenciar a disponibilidade deles."
                  : "Selecione um profissional para gerenciar sua disponibilidade recorrente e exceções de datas específicas."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
