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
    const [newCustomerTaxId, setNewCustomerTaxId] = useState('');

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

    // Adicione o estado para a chave da API do AbacatePay
    const [abacatepayApiKey, setAbacatepayApiKey] = useState<string>('');

    const currentProfessional = useMemo(() => 
        professionals.find(p => p.id === selectedProfessionalId), 
        [professionals, selectedProfessionalId]
    );

    const selectedService = useMemo(() => 
        salonServices.find(s => s.name === selectedServiceName), 
        [salonServices, selectedServiceName]
    );

    // --- EFEITO 1: BUSCAR DADOS DO SALÃO, SERVIÇOS E SETTINGS ---
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

                        // Busca settings do salão (incluindo abacatepayApiKey)
                        const settingsCollectionRef = collection(db, "salons", salonDoc.id, "settings");
                        const settingsSnapshot = await getDocs(settingsCollectionRef);
                        let abacatepayApiKey = '';
                        settingsSnapshot.forEach(doc => {
                          const data = doc.data();
                          if (data.abacatepayApiKey) abacatepayApiKey = data.abacatepayApiKey;
                        });
                        setAbacatepayApiKey(abacatepayApiKey);
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
        // Adiciona uma verificação para garantir que selectedDate é um objeto Date válido
        if (!selectedDate || !selectedProfessionalId || !selectedService || !(selectedDate instanceof Date)) {
            setAvailableSlots([]);
            return;
        }

        const fetchSlots = async () => {
            setIsLoadingSlots(true);
            setSelectedSlot(null);
            try {
                // --- CORREÇÃO AQUI ---
                // Passa o objeto 'selectedDate' diretamente, pois já garantimos que é um Date.
                // A lógica de `new Date(selectedDate)` foi removida pois era redundante e podia causar bugs.
                const slots = await getAvailableSlotsForProfessional(selectedProfessionalId, selectedDate, selectedService.duration);
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

    // Encontre a função handleSelectPaymentMethod e substitua-a por esta versão.

const handleSelectPaymentMethod = async (method: { id: string; name: string }) => {
    setSelectedPaymentMethod(method.name);

    if (method.id === 'in_person') {
        // Para pagamento no salão, o fluxo continua o mesmo, sem redirecionamento.
        return;
    }

    // Validações para garantir que todos os dados do agendamento estão prontos
    if (!salon || !selectedService || !newCustomerName || !clientPhone || !newCustomerEmail || !currentProfessional || !selectedSlot) {
        toast({
            title: "Dados Incompletos",
            description: "Por favor, preencha todos os seus dados e selecione um horário antes de prosseguir.",
            variant: "destructive",
        });
        return;
    }

    setIsLoadingPix(true); // Reutilizamos o estado de loading

    try {
        const paymentMethodToSend = method.id === 'pix' ? 'PIX' : 'CREDIT_CARD';
        const functionUrl = `https://us-central1-hairflow-lmlxh.cloudfunctions.net/createAbacatePayBilling`;

        const payload = {
            salonId: salon.id,
            serviceId: selectedService.id,
            paymentMethod: paymentMethodToSend,
            customer: {
                name: newCustomerName,
                email: newCustomerEmail,
                phone: clientPhone,
                taxId: newCustomerTaxId || "00000000000", // Inclua o taxId coletado ou um placeholder
            },
        };

        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        // Corrigido: pega a URL correta da resposta da API
        const billingUrl = result.data?.url;
        if (billingUrl) {
            // Salva os detalhes do agendamento no localStorage antes de redirecionar
            const pendingBooking = {
                salonId: salon.id,
                professionalId: selectedProfessionalId,
                currentProfessionalName: currentProfessional.name,
                clientName: newCustomerName,
                clientPhone: clientPhone,
                serviceName: selectedService.name,
                startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime,
                price: selectedService.price,
                paymentMethod: method.name,
            };
            localStorage.setItem('pendingBooking', JSON.stringify(pendingBooking));

            // Redireciona o cliente para a página de pagamento da AbacatePay
            window.location.href = billingUrl;
        } else {
            throw new Error("URL de pagamento não recebida da API.");
        }

    } catch (error: any) {
        toast({
            title: "Erro no Pagamento",
            description: error.message,
            variant: "destructive",
        });
        setIsLoadingPix(false);
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
    
    // --- HANDLE PAYMENT STATUS FROM URL ---
    useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const status = urlParams.get('status');
      if (status === 'success') {
        toast({ title: "Pagamento Confirmado", description: "Seu pagamento foi processado com sucesso." });
        setCurrentStep(bookingSteps.CONFIRMATION);
      } else if (status === 'cancelled') {
        toast({ title: "Pagamento Cancelado", description: "O pagamento foi cancelado. Tente novamente.", variant: "destructive" });
      }
      // Optionally, you may want to clean the query string after handling
    }, []);

    // --- EFEITO: TRATAR STATUS DE PAGAMENTO VIA QUERY STRING ---
    useEffect(() => {
        const handlePaymentSuccess = async () => {
            const pendingBookingString = localStorage.getItem('pendingBooking');
            if (!pendingBookingString) return;

            // Limpa o item do localStorage para não ser usado novamente
            localStorage.removeItem('pendingBooking'); 

            const pendingBooking = JSON.parse(pendingBookingString);
            // Simula o loading de confirmação
            setIsConfirming(true); 

            try {
                // Recria os objetos necessários para a tela de confirmação
                setConfirmedAppointment({
                    id: '', // O ID real virá da função de criação
                    ...pendingBooking
                });
                // O nome do profissional já está no objeto salvo
                setCurrentStep(bookingSteps.CONFIRMATION);
                // Cria o agendamento no Firestore
                await createAppointment(pendingBooking);
                toast({
                    title: "Pagamento Confirmado e Agendamento Realizado!",
                    description: "Seu agendamento foi confirmado com sucesso.",
                });
            } catch (error) {
                console.error("Erro ao criar agendamento após pagamento:", error);
                toast({
                    title: "Erro na Confirmação",
                    description: "Seu pagamento foi aprovado, mas houve um erro ao confirmar o agendamento. Entre em contato com o salão.",
                    variant: "destructive",
                });
            } finally {
                setIsConfirming(false);
            }
        };

        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');

        if (status === 'success') {
            handlePaymentSuccess();
        } else if (status === 'cancelled') {
            toast({
                title: "Pagamento Cancelado",
                description: "A operação de pagamento foi cancelada.",
                variant: "destructive",
            });
        }

        // Limpa os parâmetros da URL para evitar reprocessamento
        if (status) {
            const url = new URL(window.location.href);
            url.searchParams.delete('status');
            window.history.replaceState({}, document.title, url.pathname + url.search);
        }
    }, []); // Executa apenas uma vez quando o componente carrega

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
                                    <div>
                                      <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</Label>
                                      <Input
                                        id="email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={newCustomerEmail}
                                        onChange={(e) => setNewCustomerEmail(e.target.value)}
                                        className="mt-1 border-gray-200 dark:border-gray-600 focus:border-teal-500 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
                                        required
                                      />
                                    </div>
                                    {/* --- NOVO CAMPO ADICIONADO --- */}
                                    <div>
                                        <Label htmlFor="taxId" className="text-sm font-medium text-gray-700 dark:text-gray-300">CPF ou CNPJ</Label>
                                        <Input 
                                            id="taxId" 
                                            type="text" 
                                            placeholder="000.000.000-00" 
                                            value={newCustomerTaxId} 
                                            onChange={(e) => setNewCustomerTaxId(e.target.value)} 
                                            className="mt-1 border-gray-200 dark:border-gray-600 focus:border-teal-500 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
                                            required 
                                        />
                                    </div>
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
                                                disabled={isLoadingPix}
                                            >
                                                {isLoadingPix && option.id !== 'in_person' ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : option.icon}
                                                <span className="font-medium">{option.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                        </CardContent>
                        </Card>
                        {/* Botões de Ação */}
                        <div className="flex gap-3 pt-4">
                            <Button variant="outline" onClick={() => setCurrentStep(bookingSteps.SCHEDULING)} className="flex-1 h-12">Voltar</Button>
                            {/* O botão de confirmar só é útil para pagamento presencial agora */}
                            {selectedPaymentMethod === 'Pagar no Salão' && (
                                <Button onClick={handleSubmitBooking} disabled={isConfirming} className="flex-1 h-12">
                                    {isConfirming ? <Loader2 className="animate-spin" /> : 'Confirmar Agendamento'}
                                </Button>
                            )}
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