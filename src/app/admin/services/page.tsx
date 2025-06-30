"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/PageHeader';
import { PlusCircle, Trash2, Edit, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
// Funções do Firestore atualizadas e corrigidas
import { 
    createSalonService,
    updateSalonService,
    deleteSalonService
} from '@/lib/firestoreService';
import type { Service } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ManageServicesPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Para o formulário
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');

  // Busca e escuta por atualizações em tempo real
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      const servicesCollectionRef = collection(db, "salons", user.uid, "services");
      const unsubscribe = onSnapshot(servicesCollectionRef, (snapshot) => {
        const servicesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Service));
        setServices(servicesData);
        setIsLoading(false);
      }, (error) => {
        console.error("Erro ao buscar serviços:", error);
        toast({ title: "Erro", description: "Não foi possível carregar os serviços." });
        setIsLoading(false);
      });
      
      // Limpa o listener quando o componente desmontar
      return () => unsubscribe();
    } else if (!authLoading) {
        setIsLoading(false);
        setServices([]);
    }
  }, [user, authLoading, toast]);


  const resetForm = () => {
    setCurrentService(null);
    setServiceName('');
    setServicePrice('');
    setServiceDuration('');
  }

  const handleEditClick = (service: Service) => {
    setCurrentService(service);
    setServiceName(service.name);
    setServicePrice(String(service.price));
    setServiceDuration(String(service.duration));
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (serviceName.trim() && servicePrice.trim() && serviceDuration.trim()) {
      const price = parseFloat(servicePrice);
      const duration = parseInt(serviceDuration, 10);

      if (isNaN(price) || isNaN(duration) || price <= 0 || duration <= 0) {
        toast({ title: "Erro de Validação", description: "Por favor, insira um preço e duração válidos.", variant: "destructive" });
        return;
      }
      
      setIsSaving(true);
      
      const serviceData = { name: serviceName, price, duration };

      try {
        if (currentService && currentService.id) {
            // Atualizar serviço existente
            await updateSalonService(user.uid, String(currentService.id), serviceData);
            toast({ title: "Sucesso", description: "Serviço atualizado com sucesso." });
        } else {
            // Criar novo serviço
            await createSalonService(user.uid, serviceData);
            toast({ title: "Sucesso", description: "Novo serviço adicionado com sucesso." });
        }
        resetForm();
      } catch (error) {
        console.error("Erro ao salvar serviço:", error);
        toast({ title: "Erro", description: "Não foi possível salvar o serviço. Tente novamente.", variant: "destructive" });
      } finally {
        setIsSaving(false);
      }
    } else {
      toast({ title: "Campos Vazios", description: "Por favor, preencha todos os campos.", variant: "destructive" });
    }
  };

  const handleDeleteService = async (serviceId: string | number | undefined | null) => {
    if (!user || !serviceId) return;
    
    // Garantir que serviceId é uma string
    const idToDelete = String(serviceId);
    
    try {
      await deleteSalonService(user.uid, idToDelete);
      toast({ title: "Serviço Removido", description: "O serviço foi removido com sucesso." });
    } catch(error) {
       console.error("Erro ao remover serviço:", error);
       toast({ title: "Erro", description: "Não foi possível remover o serviço.", variant: "destructive" });
    }
  };

  if (authLoading || isLoading) {
    return (
      <>
        <PageHeader
          title="Gerenciar Serviços"
          description="Adicione, edite ou remova os serviços oferecidos pelo seu salão."
        />
        <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Carregando serviços...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Gerenciar Serviços"
        description="Adicione, edite ou remova os serviços oferecidos pelo seu salão."
      />
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Formulário de Adicionar/Editar */}
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">{currentService ? 'Editar Serviço' : 'Adicionar Novo Serviço'}</CardTitle>
          </CardHeader>
          {/* CORREÇÃO: Usando a tag <form> explicitamente */}
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                <Label htmlFor="service-name">Nome do Serviço</Label>
                <Input
                  id="service-name"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Ex: Corte Masculino"
                  disabled={isSaving}
                  required
                />
              </div>
              <div>
                <Label htmlFor="service-price">Preço (R$)</Label>
                <Input
                  id="service-price"
                  type="number"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                  placeholder="30.00"
                  step="0.01"
                  min="0.01"
                  disabled={isSaving}
                  required
                />
              </div>
              <div>
                <Label htmlFor="service-duration">Duração (min)</Label>
                <Input
                  id="service-duration"
                  type="number"
                  value={serviceDuration}
                  onChange={(e) => setServiceDuration(e.target.value)}
                  placeholder="45"
                  step="5"
                  min="5"
                  disabled={isSaving}
                  required
                />
              </div>
              <div className="flex flex-col gap-2 pt-2">
                   <Button type="submit" className="w-full" disabled={isSaving}>
                      {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (currentService ? <Edit className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />)}
                      {isSaving ? 'Salvando...' : (currentService ? 'Atualizar Serviço' : 'Adicionar Serviço')}
                   </Button>
                   {currentService && (
                      <Button variant="outline" onClick={resetForm} type="button" disabled={isSaving}>
                          Cancelar Edição
                      </Button>
                   )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Lista de Serviços Atuais */}
        <Card className="lg:col-span-2 shadow-lg">
           <CardHeader>
             <CardTitle className="font-headline">Serviços Atuais</CardTitle>
             <CardDescription>Lista de todos os serviços cadastrados no seu salão.</CardDescription>
           </CardHeader>
           <CardContent>
            {services.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum serviço adicionado ainda.</p>
            ) : (
              <ul className="space-y-3">
                {services.map((service) => (
                  <li key={String(service.id)} className="flex justify-between items-center p-3 border rounded-md bg-muted/50">
                    <div>
                      <span className="font-medium">{service.name}</span>
                      <span className="text-muted-foreground text-sm"> - R$ {Number(service.price).toFixed(2)} ({service.duration} min)</span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleEditClick(service)} disabled={isSaving}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" disabled={isSaving}>
                                    <Trash2 className="h-4 w-4" />
                                     <span className="sr-only">Deletar</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta ação removerá o serviço "{service.name}" permanentemente.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteService(service.id)}>
                                        Remover
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  </li>
                ))}
              </ul>
            )}
           </CardContent>
        </Card>
      </div>
    </>
  );
}
