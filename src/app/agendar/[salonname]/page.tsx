// src/app/agendar/[salonname]/page.tsx

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
    getProfessionalsBySalon, 
    getSalonBySlug, 
    getAvailableSlotsForProfessional, 
    createAppointment, 
    getSalonServices,
    findCustomerByPhone,
    createCustomer
} from '@/lib/firestoreService';
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
import type { Salon, Professional, TimeSlot, Appointment, Service, Customer } from '@/lib/types';
import { User, Phone, Mail, CheckCircle, ChevronLeft, Loader2, ArrowLeft, Calendar, Clock, Star } from 'lucide-react';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import './booking-page.css';

const bookingSteps = {
  PHONE_INPUT: 1,
  SCHEDULING: 2,
  CONFIRMATION: 3,
};

export default function SalonAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const salonSlug = params.salonname as string;

  const [currentStep, setCurrentStep] = useState(bookingSteps.PHONE_INPUT);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [isLoadingSalon, setIsLoadingSalon] = useState(true);
  
  const [clientPhone, setClientPhone] = useState('');
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [salonServices, setSalonServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | undefined>();
  const [selectedServiceName, setSelectedServiceName] = useState<string | undefined>();
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  const currentProfessional = useMemo(() => 
    professionals.find(p => p.id === selectedProfessionalId), 
    [professionals, selectedProfessionalId]
  );

  const selectedService = useMemo(() => 
    salonServices.find(s => s.name === selectedServiceName), 
    [salonServices, selectedServiceName]
  );

  useEffect(() => {
    if (!salonSlug) return;

    const fetchSalonAndData = async () => {
      setIsLoadingSalon(true);
      try {
        const fetchedSalon = await getSalonBySlug(salonSlug);
        if (!fetchedSalon) {
          toast({ 
            title: "Salão Não Encontrado", 
            variant: "destructive"
          });
          return;
        }

        setSalon(fetchedSalon);
        const [salonProfessionals, fetchedServices] = await Promise.all([
          getProfessionalsBySalon(fetchedSalon.id),
          getSalonServices(fetchedSalon.id)
        ]);
        setProfessionals(salonProfessionals);
        setSalonServices(fetchedServices);
      } catch (error) {
        console.error("Failed to fetch salon data:", error);
        toast({ 
          title: "Erro ao carregar dados", 
          description: "Não foi possível buscar as informações do salão.", 
          variant: "destructive"
        });
      } finally {
        setIsLoadingSalon(false);
      }
    };

    fetchSalonAndData();
  }, [salonSlug, toast]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate || !selectedProfessionalId || !selectedService) {
        setAvailableSlots([]);
        setSelectedSlot(null);
        return;
      }

      setIsLoadingSlots(true);
      try {
        const slots = await getAvailableSlotsForProfessional(
          selectedProfessionalId, 
          new Date(selectedDate), 
          selectedService.duration
        );
        setAvailableSlots(slots);
      } catch (error) {
        console.error("Error fetching slots:", error);
        toast({
          title: "Erro ao buscar horários",
          description: "Não foi possível carregar os horários disponíveis.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingSlots(false);
        setSelectedSlot(null);
      }
    };

    fetchSlots();
  }, [selectedDate, selectedProfessionalId, selectedService, toast]);

  const handlePhoneCheck = async () => {
    if (!clientPhone || !salon) return;
    
    setIsCheckingPhone(true);
    try {
      const foundCustomer = await findCustomerByPhone(clientPhone, salon.id);
      
      if (foundCustomer) {
        setCustomer(foundCustomer);
        setNewCustomerName(foundCustomer.name);
        setNewCustomerEmail(foundCustomer.email || '');
        toast({ 
          title: `Bem-vindo(a) de volta, ${foundCustomer.name}!`, 
          description: "Seus dados foram carregados." 
        });
      } else {
        setCustomer(null);
        setNewCustomerName('');
        setNewCustomerEmail('');
        toast({ 
          title: "Cliente novo!", 
          description: "Por favor, complete seus dados para agendar." 
        });
      }
      setCurrentStep(bookingSteps.SCHEDULING);
    } catch (error) {
      console.error("Erro ao buscar cliente:", error);
      toast({ 
        title: "Erro", 
        description: "Ocorreu um problema ao verificar seu número. Por favor, preencha os dados manualmente.", 
        variant: "destructive"
      });
      setCurrentStep(bookingSteps.SCHEDULING);
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handleSubmitBooking = async () => {
    if (!salon || !selectedProfessionalId || !selectedSlot || !selectedService || !currentProfessional || !newCustomerName) {
      toast({ 
        title: "Dados incompletos", 
        description: "Preencha todos os campos obrigatórios.", 
        variant: "destructive" 
      });
      return;
    }

    setIsConfirming(true);
    try {
      // Create customer if doesn't exist
      if (!customer) {
        const newCustomerData: Omit<Customer, 'id'> = {
          phone: clientPhone,
          name: newCustomerName,
          email: newCustomerEmail,
          salonId: salon.id,
          createdAt: new Date().toISOString(),
        };
        await createCustomer(clientPhone, newCustomerData);
      }

      const appointmentData: Omit<Appointment, 'id'> = {
        salonId: salon.id,
        professionalId: selectedProfessionalId,
        clientName: newCustomerName,
        clientPhone: clientPhone,
        serviceName: selectedService.name,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        status: 'scheduled',
        price: selectedService.price,
      };

      const newAppointment = await createAppointment(appointmentData);
      setConfirmedAppointment(newAppointment);
      setCurrentStep(bookingSteps.CONFIRMATION);
      toast({ 
        title: "Agendamento Enviado!", 
        description: "Sua solicitação foi enviada com sucesso." 
      });

    } catch(error) {
      console.error("Booking error:", error);
      toast({ 
        title: "Erro no Agendamento", 
        description: "Não foi possível criar seu agendamento.", 
        variant: "destructive" 
      });
    } finally {
      setIsConfirming(false);
    }
  };

  if (isLoadingSalon) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-slate-600">Salão não encontrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <GlobalHeader />
      
      {/* Header with salon info */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-slate-200">
                <AvatarImage src={salon.logoUrl || ''} alt={`Logo de ${salon.name}`} />
                <AvatarFallback className="bg-teal-500 text-white font-semibold">
                  {salon.name.substring(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{salon.name}</h1>
                {salon.address && (
                  <p className="text-sm text-slate-600">{salon.address}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-md">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">
              {currentStep === bookingSteps.PHONE_INPUT && "Começar"}
            </span>
            <span className="text-sm text-slate-500">
              0{currentStep}/03
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-teal-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Phone Input */}
        {currentStep === bookingSteps.PHONE_INPUT && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-teal-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Vamos começar
                </h2>
                <p className="text-slate-600">
                  Digite seu número para agilizar o agendamento
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                    Número do celular
                  </Label>
                  <Input 
                    id="phone"
                    type="tel" 
                    placeholder="(11) 99999-9999" 
                    value={clientPhone} 
                    onChange={(e) => setClientPhone(e.target.value)} 
                    className="mt-1 h-12 text-lg border-slate-200 focus:border-teal-500 focus:ring-teal-500"
                    onKeyDown={(e) => e.key === 'Enter' && handlePhoneCheck()}
                  />
                </div>
                
                <Button 
                  onClick={handlePhoneCheck} 
                  disabled={isCheckingPhone || clientPhone.length < 10} 
                  className="w-full h-12 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-xl"
                >
                  {isCheckingPhone ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Continuar"
                  )}
                </Button>
              </div>

              <p className="text-xs text-slate-500 text-center mt-4">
                Usamos seu número apenas para facilitar futuros agendamentos
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Service Selection */}
        {currentStep === bookingSteps.SCHEDULING && (
          <div className="space-y-6">
            {/* User info card */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Seus dados</h3>
                    <p className="text-sm text-slate-600">Complete as informações</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                      Nome completo
                    </Label>
                    <Input 
                      id="name"
                      type="text" 
                      placeholder="Digite seu nome" 
                      value={newCustomerName} 
                      onChange={(e) => setNewCustomerName(e.target.value)} 
                      className="mt-1 border-slate-200 focus:border-teal-500 focus:ring-teal-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                      E-mail (opcional)
                    </Label>
                    <Input 
                      id="email"
                      type="email" 
                      placeholder="seu@email.com" 
                      value={newCustomerEmail} 
                      onChange={(e) => setNewCustomerEmail(e.target.value)} 
                      className="mt-1 border-slate-200 focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service selection */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                    <Star className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Selecione o serviço</h3>
                    <p className="text-sm text-slate-600">Escolha o que você deseja</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">
                      Tipo de serviço
                    </Label>
                    <div className="mt-2 space-y-2">
                      {salonServices.map(service => (
                        <button
                          key={String(service.id)}
                          onClick={() => setSelectedServiceName(service.name)}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                            selectedServiceName === service.name
                              ? 'border-teal-500 bg-teal-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-slate-900">{service.name}</p>
                              <p className="text-sm text-slate-600">Duração: {service.duration}min</p>
                            </div>
                            <p className="font-bold text-teal-600">R$ {service.price.toFixed(2)}</p>
                          </div>
                          {selectedServiceName === service.name && (
                            <div className="mt-2">
                              <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center ml-auto">
                                <CheckCircle className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-slate-700">
                      Profissional
                    </Label>
                    <Select 
                      value={selectedProfessionalId} 
                      onValueChange={setSelectedProfessionalId}
                    >
                      <SelectTrigger className="mt-1 border-slate-200 focus:border-teal-500 focus:ring-teal-500">
                        <SelectValue placeholder="Escolha um profissional" />
                      </SelectTrigger>
                      <SelectContent>
                        {professionals.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date and time selection */}
            {selectedServiceName && selectedProfessionalId && (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Data e horário</h3>
                      <p className="text-sm text-slate-600">Quando você quer agendar?</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label className="text-sm font-medium text-slate-700 block mb-2">
                        Escolha a data
                      </Label>
                      <BookingCalendar 
                        selectedDate={selectedDate} 
                        onDateSelect={setSelectedDate} 
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-slate-700 block mb-2">
                        Horários disponíveis
                      </Label>
                      <SlotPicker 
                        availableSlots={availableSlots} 
                        selectedSlot={selectedSlot} 
                        onSlotSelect={setSelectedSlot} 
                        isLoading={isLoadingSlots}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setCustomer(null); 
                  setCurrentStep(bookingSteps.PHONE_INPUT);
                }}
                className="flex-1 h-12 border-slate-300 text-slate-700"
              >
                Voltar
              </Button>
              <Button 
                onClick={handleSubmitBooking} 
                disabled={isConfirming || !selectedSlot || !newCustomerName}
                className="flex-1 h-12 bg-teal-500 hover:bg-teal-600 text-white font-medium"
              >
                {isConfirming ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Agendar"
                )}
              </Button>
            </div>
          </div>
        )}
        
        {/* Step 3: Confirmation */}
        {currentStep === bookingSteps.CONFIRMATION && confirmedAppointment && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Agendamento enviado!
              </h2>
              <p className="text-slate-600 mb-8">
                Sua solicitação foi enviada com sucesso. O salão entrará em contato se necessário.
              </p>
              
              <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
                <h3 className="font-semibold text-slate-900 mb-3">Resumo do agendamento</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Serviço:</span>
                    <span className="font-medium">{confirmedAppointment.serviceName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Profissional:</span>
                    <span className="font-medium">{currentProfessional?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Data:</span>
                    <span className="font-medium">
                      {new Date(confirmedAppointment.startTime).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Horário:</span>
                    <span className="font-medium">
                      {new Date(confirmedAppointment.startTime).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-slate-600">Valor:</span>
                    <span className="font-bold text-teal-600">R$ {(confirmedAppointment.price ?? 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => router.push('/')} 
                className="w-full h-12 bg-teal-500 hover:bg-teal-600 text-white font-medium"
              >
                Voltar ao início
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
      
      <GlobalFooter />
      
      {confirmedAppointment && salon && currentProfessional && (
        <ConfirmationDialog 
          isOpen={!!confirmedAppointment} 
          onOpenChange={(open) => {
            if(!open) setConfirmedAppointment(null);
          }} 
          appointmentDetails={confirmedAppointment} 
          salonDetails={salon} 
          professionalDetails={currentProfessional}
        />
      )}
    </div>
  );
}

