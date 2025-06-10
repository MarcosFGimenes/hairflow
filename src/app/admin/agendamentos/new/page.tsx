// src/app/admin/agendamentos/new/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { PageHeader } from '@/components/shared/PageHeader';
import { CalendarIcon, Clock, User, Phone, Briefcase, DollarSign, Save, Loader2 } from 'lucide-react'; // NEW: Added Loader2
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getProfessionalsBySalon, getSalonServices, createAppointment } from '@/lib/firestoreService'; // NEW: Import createAppointment
import { useToast } from "@/hooks/use-toast";
import type { Service, Professional } from '@/lib/types';
import { useRouter } from 'next/navigation'; // NEW: Import useRouter


export default function NewAppointmentPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter(); // NEW: Initialize useRouter

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("09:00");
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | undefined>();
  const [selectedServiceName, setSelectedServiceName] = useState<string | undefined>();
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState<number | string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // NEW: State for saving
  const [salonServices, setSalonServices] = useState<Service[]>([]);
  const [salonProfessionals, setSalonProfessionals] = useState<Professional[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        setIsLoading(true);
        const [fetchedServices, fetchedProfessionals] = await Promise.all([
          getSalonServices(user.uid),
          getProfessionalsBySalon(user.uid),
        ]);
        setSalonServices(fetchedServices);
        setSalonProfessionals(fetchedProfessionals);

        if (fetchedServices.length > 0) {
          setSelectedServiceName(fetchedServices[0].name);
          setPrice(fetchedServices[0].price);
        }
        if (fetchedProfessionals.length > 0) {
          setSelectedProfessionalId(fetchedProfessionals[0].id);
        }
        setIsLoading(false);
      } else if (!authLoading) {
        setIsLoading(false);
      }
    };
    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading]);


  const handleServiceChange = (serviceName: string) => {
    const service = salonServices.find(s => s.name === serviceName);
    setSelectedServiceName(serviceName);
    if (service) {
      setPrice(service.price);
    } else {
      setPrice("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Erro de Autenticação", description: "Você não está logado.", variant: "destructive" });
      return;
    }
    if (!selectedDate || !selectedTime || !selectedProfessionalId || !selectedServiceName || !clientName || !clientPhone || price === "") { // Check for price being empty
      toast({ title: "Campos Obrigatórios", description: "Por favor, preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }

    const selectedServiceDetails = salonServices.find(s => s.name === selectedServiceName);
    if (!selectedServiceDetails) {
        toast({ title: "Serviço Inválido", description: "O serviço selecionado não é válido.", variant: "destructive" });
        return;
    }

    const startDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    startDateTime.setHours(hours, minutes, 0, 0);

    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(startDateTime.getMinutes() + selectedServiceDetails.duration);

    setIsSaving(true); // Start saving state

    const appointmentData = {
      salonId: user.uid,
      professionalId: selectedProfessionalId,
      serviceName: selectedServiceName,
      clientName,
      clientPhone,
      startTime: startDateTime,
      endTime: endDateTime,
      notes,
      price: Number(price),
      status: "scheduled" as "scheduled",
    };

    try {
        await createAppointment(appointmentData); // Call the Firestore service
        toast({ title: "Sucesso", description: "Novo agendamento criado com sucesso!" });
        router.push('/admin/agendamentos'); // Redirect after successful creation
    } catch (error) {
        console.error("Error creating appointment:", error);
        toast({ title: "Erro", description: "Não foi possível criar o agendamento. Tente novamente.", variant: "destructive" });
    } finally {
        setIsSaving(false); // End saving state
    }
  };

  if (authLoading || isLoading) {
    return (
        <>
        <PageHeader
          title="Criar Novo Agendamento"
          description="Adicione manualmente um novo agendamento à agenda."
        />
        <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Carregando dados...</p>
        </div>
      </>
    )
  }


  return (
    <>
      <PageHeader
        title="Criar Novo Agendamento"
        description="Adicione manualmente um novo agendamento à agenda."
      />
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Detalhes do Agendamento</CardTitle>
          <CardDescription>Preencha o formulário abaixo para agendar um novo horário.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Data */}
              <div>
                <Label htmlFor="appointment-date" className="flex items-center mb-1">
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" /> Data
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      {selectedDate ? format(selectedDate, "PPP") : <span>Selecione uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Horário */}
              <div>
                <Label htmlFor="appointment-time" className="flex items-center mb-1">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" /> Horário
                </Label>
                <Input
                  id="appointment-time"
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                />
              </div>

              {/* Profissional */}
              <div>
                <Label htmlFor="professional" className="flex items-center mb-1">
                  <User className="mr-2 h-4 w-4 text-muted-foreground" /> Profissional
                </Label>
                {salonProfessionals.length > 0 ? (
                    <Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId}>
                    <SelectTrigger id="professional">
                        <SelectValue placeholder="Selecione o profissional" />
                    </SelectTrigger>
                    <SelectContent>
                        {salonProfessionals.map(prof => (
                        <SelectItem key={prof.id} value={prof.id}>{prof.name}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                ) : (
                    <Input disabled value="Nenhum profissional disponível" />
                )}
              </div>

              {/* Serviço */}
              <div>
                <Label htmlFor="service" className="flex items-center mb-1">
                  <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" /> Serviço
                </Label>
                {salonServices.length > 0 ? (
                    <Select value={selectedServiceName} onValueChange={handleServiceChange}>
                    <SelectTrigger id="service">
                        <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                    <SelectContent>
                        {salonServices.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                    </SelectContent>
                    </Select>
                ) : (
                    <Input disabled value="Nenhum serviço disponível" />
                )}
              </div>
            </div>
            
            <div className="border-t pt-6 space-y-6">
              <h3 className="text-lg font-semibold font-headline">Informações do Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="client-name" className="flex items-center mb-1">
                    <User className="mr-2 h-4 w-4 text-muted-foreground" /> Nome do Cliente
                  </Label>
                  <Input id="client-name" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nome Completo" />
                </div>
                <div>
                  <Label htmlFor="client-phone" className="flex items-center mb-1">
                    <Phone className="mr-2 h-4 w-4 text-muted-foreground" /> Telefone do Cliente
                  </Label>
                  <Input id="client-phone" type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="(55) 12345-6789" />
                </div>
              </div>
            </div>

            <div className="border-t pt-6 space-y-6">
              <h3 className="text-lg font-semibold font-headline">Detalhes Adicionais</h3>
              <div>
                <Label htmlFor="appointment-price" className="flex items-center mb-1">
                  <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" /> Preço (R$)
                </Label>
                <Input
                  id="appointment-price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex: 30.00"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="notes" className="flex items-center mb-1">Observações (Opcional)</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Quaisquer pedidos específicos ou detalhes..." rows={3} />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Link href="/admin/agendamentos">
                <Button variant="outline" type="button" disabled={isSaving}>Cancelar</Button> {/* Disable during saving */}
              </Link>
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? 'Salvando...' : 'Criar Agendamento'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}