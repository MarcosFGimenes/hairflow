// src/app/agendar/[salonname]/page.tsx

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
    getProfessionalsBySalon, 
    getAvailableSlotsForProfessional, 
    createAppointment, 
    findCustomerByPhone,
    createCustomer
} from '@/lib/firestoreService';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Salon, Professional, TimeSlot, Appointment, Service, Customer } from '@/lib/types';
import { User, Phone, CheckCircle, Loader2, Calendar, Star, Wallet, CreditCard, Landmark, DollarSign, Check, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import QRCode from "react-qr-code";
import './booking-page.css';

const bookingSteps = {
    PHONE_INPUT: 1,
    SCHEDULING: 2,
    PAYMENT: 3,
    CONFIRMATION: 4,
};

const paymentOptions = [
    { id: 'pix', name: 'Pix', icon: <Landmark className="w-5 h-5 mr-2" /> },
    { id: 'credit_card', name: 'Cartão de Crédito', icon: <CreditCard className="w-5 h-5 mr-2" /> },
    { id: 'in_person', name: 'Pagar no Salão', icon: <DollarSign className="w-5 h-5 mr-2" /> },
];

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
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | undefined>();
    const [pixCode, setPixCode] = useState<string | null>(null);
    const [pixCopiaECola, setPixCopiaECola] = useState<string>("");
    const [isLoadingPix, setIsLoadingPix] = useState(false);
    const [copied, setCopied] = useState(false);

    const currentProfessional = useMemo(() => 
        professionals.find(p => p.id === selectedProfessionalId), 
        [professionals, selectedProfessionalId]
    );

    const selectedService = useMemo(() => 
        salonServices.find(s => s.name === selectedServiceName), 
        [salonServices, selectedServiceName]
    );

    // --- EFEITO 1: BUSCAR DADOS DO SALÃO E SERVIÇOS ---
    useEffect(() => {
        const fetchSalonData = async () => {
            setIsLoadingSalon(true);
            if (salonSlug) {
                const normalizedSlug = Array.isArray(salonSlug)
                    ? salonSlug[0].toLowerCase()
                    : salonSlug.toLowerCase();
                const q = query(collection(db, "salons"), where("slug", "==", normalizedSlug));
                try {
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        const salonDoc = querySnapshot.docs[0];
                        const salonData = salonDoc.data() as Omit<Salon, 'id'>;
                        const currentSalon = { id: salonDoc.id, ...salonData };
                        setSalon(currentSalon);

                        // Busca serviços da subcoleção
                        const servicesCollectionRef = collection(db, "salons", salonDoc.id, "services");
                        const servicesSnapshot = await getDocs(servicesCollectionRef);
                        const servicesData: Service[] = servicesSnapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        } as Service));
                        setSalonServices(servicesData);
                    } else {
                        console.log("Nenhum salão encontrado com este slug!");
                        setSalon(null);
                    }
                } catch (error) {
                    console.error("Erro ao buscar dados do salão:", error);
                    toast({ title: "Erro", description: "Não foi possível carregar os dados do salão.", variant: "destructive" });
                    setSalon(null);
                } finally {
                    // O isLoadingSalon será desativado no próximo useEffect, após carregar os profissionais
                }
            } else {
                 setIsLoadingSalon(false);
            }
        };
        fetchSalonData();
    }, [salonSlug, toast]);

    // --- EFEITO 2: BUSCAR PROFISSIONAIS APÓS SALÃO SER CARREGADO ---
    useEffect(() => {
        const fetchProfessionals = async () => {
            if (salon?.id) {
                try {
                    const profs = await getProfessionalsBySalon(salon.id);
                    setProfessionals(profs);
                } catch (error) {
                     console.error("Erro ao buscar profissionais:", error);
                     toast({ title: "Erro", description: "Não foi possível carregar os profissionais.", variant: "destructive" });
                } finally {
                    setIsLoadingSalon(false); // Desativa o loading principal aqui
                }
            }
        }
        fetchProfessionals();
    }, [salon, toast]);


    // --- EFEITO 3: BUSCAR HORÁRIOS DISPONÍVEIS ---
    useEffect(() => {
        if (!selectedDate || !selectedProfessionalId || !selectedService) {
            setAvailableSlots([]);
            return;
        }
        const fetchSlots = async () => {
            setIsLoadingSlots(true);
            setSelectedSlot(null);
            try {
                const slots = await getAvailableSlotsForProfessional(selectedProfessionalId, new Date(selectedDate), selectedService.duration);
                setAvailableSlots(slots);
            } catch (error) {
                console.error("Error fetching slots:", error);
                toast({ title: "Erro ao buscar horários", description: "Não foi possível carregar os horários disponíveis.", variant: "destructive" });
            } finally {
                setIsLoadingSlots(false);
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
                toast({ title: "Cliente novo!", description: "Por favor, complete seus dados para agendar." });
            }
            setCurrentStep(bookingSteps.SCHEDULING);
        } catch (error) {
            console.error("Erro ao buscar cliente:", error);
            toast({ title: "Erro", description: "Ocorreu um problema ao verificar seu número. Por favor, preencha os dados manualmente.", variant: "destructive" });
            setCurrentStep(bookingSteps.SCHEDULING); // Avança mesmo com erro para não bloquear o usuário
        } finally {
            setIsCheckingPhone(false);
        }
    };

    const handleProceedToPayment = () => {
        if (!selectedSlot || !newCustomerName || !selectedService || !currentProfessional) {
            toast({
                title: "Quase lá!",
                description: "Por favor, selecione um serviço, profissional e horário para continuar.",
                variant: "destructive"
            });
            return;
        }
        setCurrentStep(bookingSteps.PAYMENT);
    };

     const handleSelectPaymentMethod = async (method: { id: string, name: string }) => {
        setSelectedPaymentMethod(method.name);
        setPixCode(null);
        setPixCopiaECola('');

        if (method.id === 'in_person') {
            return;
        }
        
        if (!salon || !selectedService || !newCustomerName) {
            toast({ title: "Erro", description: "Dados do agendamento incompletos para gerar pagamento.", variant: "destructive"});
            return;
        }

        if (method.id === 'pix' || method.id === 'credit_card') {
            setIsLoadingPix(true);
            try {
                const paymentMethodToSend = method.id === 'pix' ? 'PIX' : 'CREDIT_CARD';
                
                const functionUrl = `https://us-central1-hairflow-lmlxh.cloudfunctions.net/createAbacatePayBilling`;

                const payload = {
                    salonId: salon.id,
                    serviceId: selectedService.id, // ID do serviço agora está garantido
                    customerInfo: { name: newCustomerName, email: newCustomerEmail, phone: clientPhone },
                    paymentMethod: paymentMethodToSend,
                };
                
                console.log("Enviando para o Firebase Functions:", payload);

                const response = await fetch(functionUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error("Erro da API de pagamento:", errorBody);
                    throw new Error(errorBody || "Falha ao se comunicar com o serviço de pagamento.");
                }

                const result = await response.json();
                const responseData = result.data;

                if (paymentMethodToSend === 'CREDIT_CARD') {
                    if (responseData?.payment_url) {
                        window.location.href = responseData.payment_url;
                    } else {
                        throw new Error("URL de pagamento para cartão de crédito não recebida.");
                    }
                } else { // PIX
                    if (responseData?.pix_qr_code && responseData?.pix_string) {
                        setPixCode(responseData.pix_qr_code);
                        setPixCopiaECola(responseData.pix_string);
                    } else {
                        throw new Error("Dados do PIX não recebidos.");
                    }
                }
            } catch (error: any) {
                console.error(`Erro ao processar pagamento com ${method.name}:`, error);
                toast({ title: "Erro no Pagamento", description: error.message, variant: "destructive" });
            } finally {
                setIsLoadingPix(false);
            }
        }
    };

    const handleSubmitBooking = async () => {
        if (!salon || !selectedProfessionalId || !selectedSlot || !selectedService || !currentProfessional || !newCustomerName || !selectedPaymentMethod) {
            toast({ title: "Dados incompletos", description: "Preencha todos os campos e selecione uma forma de pagamento.", variant: "destructive" });
            return;
        }
        setIsConfirming(true);
        try {
            let customerId = customer?.id;
            if (!customer) {
                const newCustomerData: Omit<Customer, 'id'> = {
                    phone: clientPhone, 
                    name: newCustomerName, 
                    email: newCustomerEmail,
                    salonId: salon.id, 
                    createdAt: new Date().toISOString(),
                };
                // A função createCustomer deve retornar o ID do novo cliente
                customerId = await createCustomer(clientPhone, newCustomerData);
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
                paymentMethod: selectedPaymentMethod,
                // Adicione quaisquer outros campos necessários
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

    const handleCopyPixCode = () => {
        if (!pixCopiaECola) return;
        navigator.clipboard.writeText(pixCopiaECola).then(() => {
            setCopied(true);
            toast({ title: "Copiado!", description: "Código Pix copiado para a área de transferência." });
            setTimeout(() => setCopied(false), 2000);
        });
    };
    
    // RENDERIZAÇÃO
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

    // O restante do seu componente JSX permanece o mesmo.
    // ... cole o seu return (...) aqui
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <GlobalHeader />
            
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

            <main className="container px-4 py-8 mx-auto max-w-md">
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {currentStep === bookingSteps.PHONE_INPUT && "Passo 1"}
                            {currentStep === bookingSteps.SCHEDULING && "Passo 2"}
                            {currentStep === bookingSteps.PAYMENT && "Passo 3"}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-500">
                            {currentStep}/{Object.keys(bookingSteps).length -1}
                        </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700">
                        <div className="h-2 transition-all duration-300 rounded-full bg-teal-500 dark:bg-teal-600" style={{ width: `${(currentStep / (Object.keys(bookingSteps).length -1)) * 100}%` }}/>
                    </div>
                </div>

                {/* ETAPA 1: TELEFONE */}
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

                {/* ETAPA 2: AGENDAMENTO */}
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
                                    <div><Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Nome completo</Label><Input id="name" type="text" placeholder="Digite seu nome" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} className="mt-1 border-gray-200 dark:border-gray-600 focus:border-teal-500 focus:ring-teal-500 dark:bg-gray-700 dark:text-white" required /></div>
                                    <div><Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">E-mail (opcional)</Label><Input id="email" type="email" placeholder="seu@email.com" value={newCustomerEmail} onChange={(e) => setNewCustomerEmail(e.target.value)} className="mt-1 border-gray-200 dark:border-gray-600 focus:border-teal-500 focus:ring-teal-500 dark:bg-gray-700 dark:text-white" /></div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex items-center justify-center rounded-full w-10 h-10 bg-teal-100 dark:bg-teal-900/50"><Star className="w-5 h-5 text-teal-600 dark:text-teal-400" /></div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">Serviço e Profissional</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Escolha o que você deseja</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    {/* SELETOR DE SERVIÇO */}
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de serviço</Label>
                                        <div className="mt-2 space-y-2">
                                            {salonServices.map(service => (
                                                <button
                                                    key={String(service.id)}
                                                    onClick={() => {
                                                        setSelectedServiceName(service.name);
                                                    }}
                                                    className={`w-full p-4 text-left transition-all border-2 rounded-xl ${selectedServiceName === service.name ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30 dark:border-teal-600' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'}`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">{service.name}</p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">Duração: {service.duration}min</p>
                                                        </div>
                                                        <p className="font-bold text-teal-600 dark:text-teal-400">R$ {service.price.toFixed(2)}</p>
                                                    </div>
                                                    {selectedServiceName === service.name && (
                                                        <div className="mt-2 flex justify-end">
                                                            <div className="flex items-center justify-center rounded-full w-6 h-6 bg-teal-500 dark:bg-teal-600">
                                                                <CheckCircle className="w-4 h-4 text-white" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* SELETOR DE PROFISSIONAL */}
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Profissional</Label>
                                        <div className="relative mt-2">
                                            <div className="flex pb-2 space-x-3 overflow-x-auto">
                                                {professionals.map(prof => {
                                                    const isSelected = selectedProfessionalId === prof.id;
                                                    return (
                                                        <button 
                                                            key={prof.id} 
                                                            onClick={() => setSelectedProfessionalId(prof.id)}
                                                            className={`flex flex-col items-center justify-center flex-shrink-0 p-2 space-y-2 text-center border-2 rounded-lg w-28 h-28 transition-all duration-200
                                                                ${isSelected ? 'border-primary shadow-md' : 'border-transparent hover:bg-muted'}`}
                                                        >
                                                            <div className="relative">
                                                                <Avatar className="w-16 h-16">
                                                                    <AvatarImage src={prof.imageUrl || `https://ui-avatars.com/api/?name=${prof.name.replace(/\s/g, '+')}`} alt={prof.name} />
                                                                    <AvatarFallback>{prof.name.substring(0, 2)}</AvatarFallback>
                                                                </Avatar>
                                                                {isSelected && (
                                                                    <div className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 -mt-1 -mr-1 rounded-full bg-primary">
                                                                        <Check className="w-3 h-3 text-primary-foreground" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <p className="text-xs font-medium text-center truncate text-foreground">{prof.name}</p>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
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
                                        <div><Label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Escolha a data</Label><BookingCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} /></div>
                                        <div><Label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Horários disponíveis</Label><SlotPicker availableSlots={availableSlots} selectedSlot={selectedSlot} onSlotSelect={setSelectedSlot} isLoading={isLoadingSlots} /></div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        <div className="flex gap-3 pt-4">
                            <Button variant="outline" onClick={() => {setCustomer(null);setCurrentStep(bookingSteps.PHONE_INPUT);}} className="flex-1 h-12 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Voltar</Button>
                            <Button onClick={handleProceedToPayment} className="flex-1 h-12">Ir para Pagamento</Button>
                        </div>
                    </div>
                )}

                {/* ETAPA 3: PAGAMENTO */}
                {currentStep === bookingSteps.PAYMENT && selectedService && currentProfessional && selectedSlot && (
                    <div className="space-y-6">
                        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Wallet className="w-6 h-6 text-primary" />Resumo e Pagamento</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Resumo */}
                                <div className="p-4 space-y-3 rounded-lg bg-muted/50 border">
                                    <div className="flex justify-between"><p className="text-muted-foreground">Serviço:</p><p className="font-medium">{selectedService.name}</p></div>
                                    <div className="flex justify-between"><p className="text-muted-foreground">Profissional:</p><p className="font-medium">{currentProfessional.name}</p></div>
                                    <div className="flex justify-between"><p className="text-muted-foreground">Data:</p><p className="font-medium">{format(new Date(selectedSlot.startTime), "dd/MM/yyyy", { locale: ptBR })}</p></div>
                                    <div className="flex justify-between"><p className="text-muted-foreground">Horário:</p><p className="font-medium">{format(new Date(selectedSlot.startTime), "HH:mm", { locale: ptBR })}</p></div>
                                    <div className="pt-3 mt-3 text-lg font-bold border-t flex justify-between"><p className="text-muted-foreground">Total:</p><p className="text-primary">R$ {selectedService.price.toFixed(2)}</p></div>
                                </div>
                                {/* Seleção do Método de Pagamento */}
                                <div>
                                    <Label className="text-sm font-medium text-foreground">Escolha a forma de pagamento</Label>
                                    <div className="mt-2 space-y-2">
                                        {paymentOptions.map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => handleSelectPaymentMethod(option)}
                                                className={`w-full flex items-center p-4 text-left transition-all border-2 rounded-xl 
                                                    ${selectedPaymentMethod === option.name ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                                            >
                                                {option.icon}
                                                <span className="font-medium">{option.name}</span>
                                                {selectedPaymentMethod === option.name && (
                                                    <CheckCircle className="w-5 h-5 ml-auto text-primary" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Exibição do QR Code */}
                                {selectedPaymentMethod === 'Pix' && (
                                    <div className="mt-6 text-center">
                                        {isLoadingPix && <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />}
                                        
                                        {pixCode && !isLoadingPix && (
                                            <Card className="p-4 bg-white">
                                                <QRCode
                                                    value={pixCode}
                                                    size={256}
                                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                                    viewBox={`0 0 256 256`}
                                                />
                                                <Button onClick={handleCopyPixCode} className="w-full mt-4">
                                                    {copied ? <CheckCircle className="mr-2"/> : <Copy className="mr-2"/>}
                                                    {copied ? 'Copiado!' : 'Copiar Código Pix'}
                                                </Button>
                                            </Card>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <div className="flex gap-3 pt-4">
                            <Button variant="outline" onClick={() => setCurrentStep(bookingSteps.SCHEDULING)} className="flex-1 h-12">Voltar</Button>
                            <Button onClick={handleSubmitBooking} disabled={!selectedPaymentMethod || isConfirming} className="flex-1 h-12">
                                {isConfirming ? <Loader2 className="animate-spin" /> : 'Confirmar Agendamento'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* ETAPA 4: CONFIRMAÇÃO */}
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
                                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Pagamento:</span><span className="font-medium text-gray-900 dark:text-white">{confirmedAppointment.paymentMethod}</span></div>
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