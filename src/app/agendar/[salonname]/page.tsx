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
                    toast({ title: "Salão Não Encontrado", variant: "destructive" });
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
                toast({ title: "Erro ao carregar dados", description: "Não foi possível buscar as informações do salão.", variant: "destructive" });
            } finally {
                setIsLoadingSalon(false);
            }
        };
        fetchSalonAndData();
    }, [salonSlug, toast]);

    useEffect(() => {
        if (!selectedDate || !selectedProfessionalId || !selectedService) {
            setAvailableSlots([]);
            setSelectedSlot(null);
            return;
        }
        const fetchSlots = async () => {
            setIsLoadingSlots(true);
            try {
                const slots = await getAvailableSlotsForProfessional(selectedProfessionalId, new Date(selectedDate), selectedService.duration);
                setAvailableSlots(slots);
            } catch (error) {
                console.error("Error fetching slots:", error);
                toast({ title: "Erro ao buscar horários", description: "Não foi possível carregar os horários disponíveis.", variant: "destructive" });
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
                toast({ title: `Bem-vindo(a) de volta, ${foundCustomer.name}!`, description: "Seus dados foram carregados." });
            } else {
                setCustomer(null);
                setNewCustomerName('');
                setNewCustomerEmail('');
                toast({ title: "Cliente novo!", description: "Por favor, complete seus dados para agendar." });
            }
            setCurrentStep(bookingSteps.SCHEDULING);
        } catch (error) {
            console.error("Erro ao buscar cliente:", error);
            toast({ title: "Erro", description: "Ocorreu um problema ao verificar seu número. Por favor, preencha os dados manualmente.", variant: "destructive" });
            setCurrentStep(bookingSteps.SCHEDULING);
        } finally {
            setIsCheckingPhone(false);
        }
    };

    const handleSubmitBooking = async () => {
        if (!salon || !selectedProfessionalId || !selectedSlot || !selectedService || !currentProfessional || !newCustomerName) {
            toast({ title: "Dados incompletos", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
            return;
        }
        setIsConfirming(true);
        try {
            if (!customer) {
                const newCustomerData: Omit<Customer, 'id'> = {
                    phone: clientPhone, name: newCustomerName, email: newCustomerEmail,
                    salonId: salon.id, createdAt: new Date().toISOString(),
                };
                await createCustomer(clientPhone, newCustomerData);
            }
            const appointmentData: Omit<Appointment, 'id'> = {
                salonId: salon.id, professionalId: selectedProfessionalId, clientName: newCustomerName,
                clientPhone: clientPhone, serviceName: selectedService.name, startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime, status: 'scheduled', price: selectedService.price,
            };
            const newAppointment = await createAppointment(appointmentData);
            setConfirmedAppointment(newAppointment);
            setCurrentStep(bookingSteps.CONFIRMATION);
            toast({ title: "Agendamento Enviado!", description: "Sua solicitação foi enviada com sucesso." });
        } catch(error) {
            console.error("Booking error:", error);
            toast({ title: "Erro no Agendamento", description: "Não foi possível criar seu agendamento.", variant: "destructive" });
        } finally {
            setIsConfirming(false);
        }
    };

    if (isLoadingSalon) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>
        );
    }

    if (!salon) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background"><p className="text-xl text-muted-foreground">Salão não encontrado.</p></div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <GlobalHeader />
            
            {/* INÍCIO DA ATUALIZAÇÃO: Seção Hero com Imagem */}
            <section className="relative flex items-center justify-center w-full h-64 md:h-80">
                <Image
                    src={salon.coverImageUrl || 'https://placehold.co/1200x400/27272a/FFF?text=Hairflow'}
                    alt={`Imagem de capa do salão ${salon.name}`}
                    layout="fill"
                    objectFit="cover"
                    className="z-0"
                    priority
                />
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
                <div className="relative z-20 flex flex-col items-center text-center text-white">
                    <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                        <AvatarImage src={salon.logoUrl || ''} alt={`Logo de ${salon.name}`} />
                        <AvatarFallback className="text-3xl font-semibold bg-primary text-primary-foreground">
                            {salon.name?.substring(0, 1) ?? 'H'}
                        </AvatarFallback>
                    </Avatar>
                    <h1 className="mt-4 text-5xl font-bold font-headline">{salon.name}</h1>
                    <p className="max-w-xl mt-2 text-lg text-white/90">{salon.description || salon.address}</p>
                </div>
            </section>
            {/* FIM DA ATUALIZAÇÃO */}

            <main className="container px-4 py-8 mx-auto max-w-md">
                {/* O restante do seu código permanece exatamente o mesmo */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {currentStep === bookingSteps.PHONE_INPUT && "Começar"}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-500">
                            0{currentStep}/03
                        </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700">
                        <div 
                            className="h-2 transition-all duration-300 rounded-full bg-teal-500 dark:bg-teal-600"
                            style={{ width: `${(currentStep / 3) * 100}%` }}
                        />
                    </div>
                </div>

                {currentStep === bookingSteps.PHONE_INPUT && (
                    <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm">
                        <CardContent className="p-8">
                            <div className="mb-8 text-center">
                                <div className="flex items-center justify-center mx-auto mb-4 rounded-full w-16 h-16 bg-teal-100 dark:bg-teal-900/50">
                                    <Phone className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                                </div>
                                <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Vamos começar</h2>
                                <p className="text-gray-600 dark:text-gray-400">Digite seu número para agilizar o agendamento</p>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">Número do celular</Label>
                                    <Input id="phone" type="tel" placeholder="(11) 99999-9999" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="h-12 mt-1 text-lg border-gray-200 dark:border-gray-600 focus:border-teal-500 focus:ring-teal-500 dark:bg-gray-700 dark:text-white" onKeyDown={(e) => e.key === 'Enter' && handlePhoneCheck()} />
                                </div>
                                <Button onClick={handlePhoneCheck} disabled={isCheckingPhone || clientPhone.length < 10} className="w-full h-12 font-medium text-white rounded-xl bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700">{isCheckingPhone ? (<Loader2 className="w-5 h-5 animate-spin" />) : ("Continuar")}</Button>
                            </div>
                            <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-500">Usamos seu número apenas para facilitar futuros agendamentos</p>
                        </CardContent>
                    </Card>
                )}

                {currentStep === bookingSteps.SCHEDULING && (
                    <div className="space-y-6">
                        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex items-center justify-center rounded-full w-10 h-10 bg-teal-100 dark:bg-teal-900/50"><User className="w-5 h-5 text-teal-600 dark:text-teal-400" /></div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">Seus dados</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Complete as informações</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Nome completo</Label>
                                        <Input id="name" type="text" placeholder="Digite seu nome" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} className="mt-1 border-gray-200 dark:border-gray-600 focus:border-teal-500 focus:ring-teal-500 dark:bg-gray-700 dark:text-white" required />
                                    </div>
                                    <div>
                                        <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">E-mail (opcional)</Label>
                                        <Input id="email" type="email" placeholder="seu@email.com" value={newCustomerEmail} onChange={(e) => setNewCustomerEmail(e.target.value)} className="mt-1 border-gray-200 dark:border-gray-600 focus:border-teal-500 focus:ring-teal-500 dark:bg-gray-700 dark:text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex items-center justify-center rounded-full w-10 h-10 bg-teal-100 dark:bg-teal-900/50"><Star className="w-5 h-5 text-teal-600 dark:text-teal-400" /></div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">Selecione o serviço</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Escolha o que você deseja</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de serviço</Label>
                                        <div className="mt-2 space-y-2">
                                            {salonServices.map(service => (<button key={String(service.id)} onClick={() => setSelectedServiceName(service.name)} className={`w-full p-4 text-left transition-all border-2 rounded-xl ${selectedServiceName === service.name ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30 dark:border-teal-600' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'}`}><div className="flex items-center justify-between"><div><p className="font-medium text-gray-900 dark:text-white">{service.name}</p><p className="text-sm text-gray-600 dark:text-gray-400">Duração: {service.duration}min</p></div><p className="font-bold text-teal-600 dark:text-teal-400">R$ {service.price.toFixed(2)}</p></div>{selectedServiceName === service.name && (<div className="mt-2"><div className="flex items-center justify-center ml-auto rounded-full w-6 h-6 bg-teal-500 dark:bg-teal-600"><CheckCircle className="w-4 h-4 text-white" /></div></div>)}</button>))}
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Profissional</Label>
                                        <Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId}><SelectTrigger className="mt-1 border-gray-200 dark:border-gray-600 focus:border-teal-500 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"><SelectValue placeholder="Escolha um profissional" /></SelectTrigger><SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">{professionals.map(p => (<SelectItem key={p.id} value={p.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">{p.name}</SelectItem>))}</SelectContent></Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        {selectedServiceName && selectedProfessionalId && (
                            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="flex items-center justify-center rounded-full w-10 h-10 bg-teal-100 dark:bg-teal-900/50"><Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" /></div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">Data e horário</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Quando você quer agendar?</p>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <Label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Escolha a data</Label>
                                            <BookingCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
                                        </div>
                                        <div>
                                            <Label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Horários disponíveis</Label>
                                            <SlotPicker availableSlots={availableSlots} selectedSlot={selectedSlot} onSlotSelect={setSelectedSlot} isLoading={isLoadingSlots} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        <div className="flex gap-3 pt-4">
                            <Button variant="outline" onClick={() => {setCustomer(null);setCurrentStep(bookingSteps.PHONE_INPUT);}} className="flex-1 h-12 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Voltar</Button>
                            <Button onClick={handleSubmitBooking} disabled={isConfirming || !selectedSlot || !newCustomerName} className="flex-1 h-12 font-medium text-white bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700">{isConfirming ? (<Loader2 className="w-5 h-5 animate-spin" />) : ("Agendar")}</Button>
                        </div>
                    </div>
                )}
                
                {currentStep === bookingSteps.CONFIRMATION && confirmedAppointment && (
                    <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm">
                        <CardContent className="p-8 text-center">
                            <div className="flex items-center justify-center mx-auto mb-6 rounded-full w-16 h-16 bg-green-100 dark:bg-green-900/30"><CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" /></div>
                            <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Agendamento enviado!</h2>
                            <p className="mb-8 text-gray-600 dark:text-gray-400">Sua solicitação foi enviada com sucesso. O salão entrará em contato se necessário.</p>
                            <div className="p-4 mb-6 text-left rounded-xl bg-gray-50 dark:bg-gray-700/50">
                                <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">Resumo do agendamento</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Serviço:</span><span className="font-medium text-gray-900 dark:text-white">{confirmedAppointment.serviceName}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Profissional:</span><span className="font-medium text-gray-900 dark:text-white">{currentProfessional?.name}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Data:</span><span className="font-medium text-gray-900 dark:text-white">{new Date(confirmedAppointment.startTime).toLocaleDateString('pt-BR')}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Horário:</span><span className="font-medium text-gray-900 dark:text-white">{new Date(confirmedAppointment.startTime).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</span></div>
                                    <div className="flex justify-between pt-2 mt-2 border-t border-gray-200 dark:border-gray-600"><span className="text-gray-600 dark:text-gray-400">Valor:</span><span className="font-bold text-teal-600 dark:text-teal-400">R$ {(confirmedAppointment.price ?? 0).toFixed(2)}</span></div>
                                </div>
                            </div>
                            <Button onClick={() => router.push('/')} className="w-full h-12 font-medium text-white bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700">Voltar ao início</Button>
                        </CardContent>
                    </Card>
                )}
            </main>
            
            <GlobalFooter />
            
            {confirmedAppointment && salon && currentProfessional && (
                <ConfirmationDialog 
                    isOpen={!!confirmedAppointment} 
                    onOpenChange={(open) => {if(!open) setConfirmedAppointment(null);}} 
                    appointmentDetails={confirmedAppointment} 
                    salonDetails={salon} 
                    professionalDetails={currentProfessional}
                />
            )}
        </div>
    );
}