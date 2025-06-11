// src/app/agendar/[salonname]/page.tsx

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { getProfessionalsBySalon, getSalonBySlug, getAvailableSlotsForProfessional, createAppointment, getSalonServices } from '@/lib/firestoreService';
import { useParams, useRouter } from 'next/navigation';
import { GlobalHeader } from '@/components/shared/GlobalHeader';
import { GlobalFooter } from '@/components/shared/GlobalFooter';
import { BookingCalendar } from '@/components/client/BookingCalendar';
import { SlotPicker } from '@/components/client/SlotPicker';
import { ConfirmationDialog } from '@/components/client/ConfirmationDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Salon, Professional, TimeSlot, Appointment, Service } from '@/lib/types';
import { User, Phone, Briefcase, Calendar as CalendarIconLucide, Clock, CheckCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";

const steps = [
  { id: 1, name: "Data e Profissional" },
  { id: 2, name: "Horário" },
  { id: 3, name: "Seus Detalhes" },
  { id: 4, name: "Confirmação" }
];

export default function SalonAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const salonSlug = params.salonname as string;

  const [currentStep, setCurrentStep] = useState(1);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [isLoadingSalon, setIsLoadingSalon] = useState(true);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | undefined>();
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  
  const [salonServices, setSalonServices] = useState<Service[]>([]);
  const [selectedServiceName, setSelectedServiceName] = useState<string | undefined>();

  const currentProfessional = useMemo(() => professionals.find(p => p.id === selectedProfessionalId), [professionals, selectedProfessionalId]);
  const selectedService = useMemo(() => salonServices.find(s => s.name === selectedServiceName), [salonServices, selectedServiceName]);

  useEffect(() => {
    if (salonSlug) {
      const fetchSalonAndData = async () => {
        setIsLoadingSalon(true);
        const fetchedSalon = await getSalonBySlug(salonSlug);
        if (fetchedSalon) {
          setSalon(fetchedSalon);
          const [salonProfessionals, fetchedServices] = await Promise.all([
            getProfessionalsBySalon(fetchedSalon.id),
            getSalonServices(fetchedSalon.id)
          ]);
          setProfessionals(salonProfessionals);
          if (salonProfessionals.length > 0) {
            setSelectedProfessionalId(salonProfessionals[0].id);
          }
          setSalonServices(fetchedServices);
          if (fetchedServices.length > 0) {
            setSelectedServiceName(fetchedServices[0].name);
          }
        } else {
          toast({ title: "Salão Não Encontrado", description: "Este salão não existe ou a URL está incorreta.", variant: "destructive"});
        }
        setIsLoadingSalon(false);
      };
      fetchSalonAndData();
    }
  }, [salonSlug, toast]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (selectedDate && selectedProfessionalId) {
        setIsLoadingSlots(true);
        const slots = await getAvailableSlotsForProfessional(selectedProfessionalId, new Date(selectedDate));
        setAvailableSlots(slots);
        setIsLoadingSlots(false);
      } else {
        setAvailableSlots([]);
      }
      setSelectedSlot(null);
    };
    fetchSlots();
  }, [selectedDate, selectedProfessionalId]);

  const handleNextStep = () => {
    if (currentStep === 1 && (!selectedDate || !selectedProfessionalId)) {
        toast({ title: "Atenção", description: "Por favor, selecione uma data e um profissional.", variant: "destructive" }); return;
    }
    if (currentStep === 2 && !selectedSlot) {
        toast({ title: "Atenção", description: "Por favor, selecione um horário.", variant: "destructive" }); return;
    }
    if (currentStep === 3 && (!clientName || !clientPhone || !selectedServiceName)) {
        toast({ title: "Atenção", description: "Preencha seu nome, telefone e selecione um serviço.", variant: "destructive" }); return;
    }
    if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
    }
  };
  const handlePrevStep = () => { if (currentStep > 1) setCurrentStep(currentStep -1); };

  const handleSubmitBooking = async () => {
    if (!salon || !selectedProfessionalId || !selectedSlot || !clientName || !clientPhone || !selectedService || !currentProfessional) return;
    setIsConfirming(true);
    try {
      const appointmentData = {
        salonId: salon.id,
        professionalId: selectedProfessionalId,
        clientName,
        clientPhone,
        clientEmail: '',
        serviceName: selectedService.name,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        status: 'scheduled',
        price: selectedService.price,
      } as Omit<Appointment, 'id'>;
      const newAppointment = await createAppointment(appointmentData);
      setConfirmedAppointment(newAppointment);
      setCurrentStep(4);
      toast({ title: "Agendamento Enviado!", description: "Sua solicitação foi enviada com sucesso."});
    } catch(error) {
      console.error("Booking error:", error);
      toast({ title: "Erro no Agendamento", description: "Não foi possível criar seu agendamento.", variant: "destructive" });
    } finally {
      setIsConfirming(false);
    }
  };

  if (isLoadingSalon) {
    return (
      <>
        <GlobalHeader />
        <main className="container mx-auto px-4 py-8 flex-grow text-center flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Carregando detalhes do salão...</p>
        </main>
        <GlobalFooter />
      </>
    );
  }

  if (!salon) {
    return (
      <>
        <GlobalHeader />
        <main className="container mx-auto px-4 py-8 flex-grow text-center min-h-screen">
          <h1 className="text-3xl font-bold font-headline mb-4">Salão Não Encontrado</h1>
          <p className="text-muted-foreground">O salão que você procura não existe ou a URL está incorreta.</p>
          <Button onClick={() => router.push('/')} className="mt-6">Ir para a Página Inicial</Button>
        </main>
        <GlobalFooter />
      </>
    );
  }

  return (
    <>
      <GlobalHeader />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Card className="max-w-4xl mx-auto shadow-2xl overflow-hidden">
          {/* SEÇÃO DO CABEÇALHO ATUALIZADA */}
          <div className="relative h-56 md:h-72 bg-secondary">
            <Image 
              src={salon.coverImageUrl || 'https://placehold.co/1200x400/000000/FFFFFF?text=Bem-vindo!'} 
              alt={`Imagem de capa de ${salon.name}`} 
              layout="fill" 
              objectFit="cover" 
              className="opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent flex flex-col items-center justify-center p-4 text-center">
              <Avatar className="h-24 w-24 mb-4 border-4 border-white/80 shadow-lg">
                <AvatarImage src={salon.logoUrl || ''} alt={`Logo de ${salon.name}`} />
                <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                  {salon.name.substring(0, 1)}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-3xl md:text-5xl font-bold font-headline text-white drop-shadow-lg">{salon.name}</h1>
              {salon.address && <p className="text-lg text-gray-200 mt-1 drop-shadow-md">{salon.address}</p>}
            </div>
          </div>

          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-2">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div className={`flex flex-col items-center ${currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold ${currentStep >= step.id ? 'bg-primary text-primary-foreground border-primary' : 'border-muted-foreground'}`}>
                      {currentStep > step.id ? <CheckCircle size={18} /> : step.id}
                    </div>
                    <p className={`text-xs mt-1 text-center hidden sm:block ${currentStep >= step.id ? 'font-semibold' : ''}`}>{step.name}</p>
                  </div>
                  {index < steps.length - 1 && <div className={`flex-1 h-1 mx-2 ${currentStep > step.id ? 'bg-primary' : 'bg-muted'}`}></div>}
                </React.Fragment>
              ))}
            </div>
          </div>
          
          <CardContent className="p-6 md:p-8">
            {currentStep === 1 && (
              <div className="space-y-8">
                <BookingCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
                <div>
                  <Label className="text-lg font-semibold mb-4 block text-center">Selecionar Profissional</Label>
                  {professionals.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {professionals.map(prof => (
                        <Card 
                          key={prof.id} 
                          onClick={() => setSelectedProfessionalId(prof.id)}
                          className={`p-4 cursor-pointer hover:shadow-lg transition-shadow border-2 ${selectedProfessionalId === prof.id ? 'border-primary ring-2 ring-primary' : 'border-border'}`}
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={prof.imageUrl || ''} alt={prof.name} />
                              <AvatarFallback>{prof.name.substring(0,1)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-lg">{prof.name}</h3>
                              <p className="text-sm text-muted-foreground">{prof.specialty}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">Nenhum profissional disponível.</p>
                  )}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                  {selectedDate && currentProfessional && (
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="font-semibold">Horários para <span className="text-primary">{format(selectedDate, 'd/MM/yyyy')}</span> com <span className="text-primary">{currentProfessional.name}</span></p>
                    </div>
                  )}
                <SlotPicker 
                  availableSlots={availableSlots} 
                  selectedSlot={selectedSlot} 
                  onSlotSelect={setSelectedSlot} 
                  isLoading={isLoadingSlots}
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 max-w-md mx-auto">
                <CardHeader className="p-0 mb-4 text-center">
                  <CardTitle className="font-headline text-2xl">Seus Detalhes</CardTitle>
                  <CardDescription>Preencha seus dados para finalizar.</CardDescription>
                </CardHeader>
                <div>
                  <Label htmlFor="service" className="font-medium">Serviço</Label>
                  {salonServices.length > 0 ? (
                    <Select value={selectedServiceName} onValueChange={setSelectedServiceName}>
                      <SelectTrigger id="service"><SelectValue placeholder="Selecione um serviço" /></SelectTrigger>
                      <SelectContent>
                        {salonServices.map(s => <SelectItem key={s.name} value={s.name}>{s.name} (R$ {s.price.toFixed(2)})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado.</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="clientName" className="font-medium">Nome Completo</Label>
                  <div className="relative"><User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input id="clientName" type="text" placeholder="Seu nome" value={clientName} onChange={(e) => setClientName(e.target.value)} className="pl-10" /></div>
                </div>
                <div>
                  <Label htmlFor="clientPhone" className="font-medium">Telefone (WhatsApp)</Label>
                  <div className="relative"><Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input id="clientPhone" type="tel" placeholder="(XX) XXXXX-XXXX" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="pl-10" /></div>
                </div>
                <div className="p-4 bg-muted rounded-lg space-y-2">
                    <p className="font-semibold text-sm">Resumo:</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {selectedDate && <p className="flex items-center gap-1.5"><CalendarIconLucide size={14}/> {format(selectedDate, 'd/MM/yyyy')}</p>}
                      {selectedSlot && <p className="flex items-center gap-1.5"><Clock size={14}/> {format(new Date(selectedSlot.startTime), 'HH:mm')}</p>}
                      {currentProfessional && <p className="flex items-center gap-1.5"><User size={14}/> {currentProfessional.name}</p>}
                      {selectedService && <p className="flex items-center gap-1.5"><Briefcase size={14}/> {selectedService.name} (R$ {selectedService.price.toFixed(2)})</p>}
                    </div>
                </div>
              </div>
            )}
            
            {currentStep === 4 && confirmedAppointment && (
              <div className="text-center py-10">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold font-headline text-primary">Agendamento Enviado!</h2>
                <p className="text-muted-foreground mt-2">Sua solicitação foi enviada e aguarda aprovação do salão.</p>
                <p className="mt-1 text-sm text-muted-foreground">Você pode usar o pop-up para adicionar um lembrete ao seu calendário.</p>
                <Button onClick={() => router.push('/')} className="mt-8">Voltar para a Página Inicial</Button>
              </div>
            )}

            {currentStep < 4 && (
              <div className="mt-10 flex justify-between items-center">
                <Button variant="outline" onClick={handlePrevStep} disabled={currentStep === 1}><ChevronLeft className="mr-2 h-4 w-4"/> Anterior</Button>
                {currentStep < 3 && <Button onClick={handleNextStep}>Próximo <ChevronRight className="ml-2 h-4 w-4"/></Button>}
                {currentStep === 3 && <Button onClick={handleSubmitBooking} disabled={isConfirming} className="bg-green-600 hover:bg-green-700 text-white">
                  {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar Agendamento
                </Button>}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <GlobalFooter />
      {confirmedAppointment && salon && currentProfessional && (
        <ConfirmationDialog
          isOpen={!!confirmedAppointment}
          onOpenChange={(open) => { if(!open) setConfirmedAppointment(null); }}
          appointmentDetails={confirmedAppointment}
          salonDetails={salon}
          professionalDetails={currentProfessional}
        />
      )}
    </>
  );
}