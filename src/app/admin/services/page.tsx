// src/app/admin/services/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/PageHeader';
import { PlusCircle, Save, Trash2, Edit, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getSalonByAdmin, saveSalonServices } from '@/lib/firestoreService';
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


export default function ManageServicesPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState<string>('');
  const [newServiceDuration, setNewServiceDuration] = useState<string>('');


  useEffect(() => {
    const fetchServices = async () => {
      if (user) {
        setIsLoading(true);
        const salonData = await getSalonByAdmin(user.uid);
        if (salonData && salonData.services) {
          setServices(salonData.services);
        }
        setIsLoading(false);
      } else {
        setServices([]);
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchServices();
    }
  }, [user, authLoading]);

  const handleAddService = () => {
    if (newServiceName.trim() && newServicePrice.trim() && newServiceDuration.trim()) {
      const price = parseFloat(newServicePrice);
      const duration = parseInt(newServiceDuration, 10);

      if (isNaN(price) || isNaN(duration) || price < 0 || duration <= 0) {
        toast({ title: "Erro de Validação", description: "Por favor, insira um preço e duração válidos.", variant: "destructive" });
        return;
      }

      if (editingIndex !== null) {
        // Edit existing service
        const updatedServices = services.map((service, index) =>
          index === editingIndex ? { name: newServiceName, price, duration } : service
        );
        setServices(updatedServices);
        setEditingIndex(null);
        toast({ title: "Sucesso", description: "Serviço atualizado." });
      } else {
        // Add new service
        setServices([...services, { name: newServiceName, price, duration }]);
        toast({ title: "Sucesso", description: "Novo serviço adicionado (ainda não salvo no banco de dados)." });
      }
      setNewServiceName('');
      setNewServicePrice('');
      setNewServiceDuration('');
    } else {
      toast({ title: "Campos Vazios", description: "Por favor, preencha todos os campos do serviço.", variant: "destructive" });
    }
  };

  const handleEditService = (index: number) => {
    setEditingIndex(index);
    setNewServiceName(services[index].name);
    setNewServicePrice(services[index].price.toFixed(2));
    setNewServiceDuration(services[index].duration.toString());
  };

  const handleRemoveService = (indexToRemove: number) => {
    setServices(services.filter((_, index) => index !== indexToRemove));
    toast({ title: "Serviço Removido", description: "Serviço removido da lista (ainda não salvo no banco de dados)." });
  };

  const handleSaveServices = async () => {
    if (!user) {
      toast({ title: "Erro", description: "Você precisa estar logado para salvar os serviços.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      await saveSalonServices(user.uid, services);
      toast({ title: "Sucesso!", description: "Serviços do salão atualizados com sucesso." });
    } catch (error) {
      console.error("Erro ao salvar serviços:", error);
      toast({ title: "Erro", description: "Não foi possível salvar os serviços. Tente novamente.", variant: "destructive" });
    } finally {
      setIsSaving(false);
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
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Adicionar/Editar Serviço</CardTitle>
          <CardDescription>Defina o nome, preço e duração de cada serviço.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <Label htmlFor="service-name">Nome do Serviço</Label>
              <Input
                id="service-name"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="Ex: Corte Masculino"
                disabled={isSaving}
              />
            </div>
            <div>
              <Label htmlFor="service-price">Preço (R$)</Label>
              <Input
                id="service-price"
                type="number"
                value={newServicePrice}
                onChange={(e) => setNewServicePrice(e.target.value)}
                placeholder="30.00"
                step="0.01"
                disabled={isSaving}
              />
            </div>
            <div>
              <Label htmlFor="service-duration">Duração (min)</Label>
              <Input
                id="service-duration"
                type="number"
                value={newServiceDuration}
                onChange={(e) => setNewServiceDuration(e.target.value)}
                placeholder="45"
                step="5"
                min="5"
                disabled={isSaving}
              />
            </div>
            <div className="md:col-span-4">
              <Button onClick={handleAddService} className="w-full bg-accent hover:bg-accent/90" disabled={isSaving}>
                {editingIndex !== null ? <><Edit className="mr-2 h-4 w-4" /> Atualizar Serviço</> : <><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Serviço</>}
              </Button>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold font-headline">Serviços Atuais:</h3>
            {services.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhum serviço adicionado ainda.</p>
            ) : (
              <ul className="space-y-3">
                {services.map((service, index) => (
                  <li key={index} className="flex justify-between items-center p-3 border rounded-md bg-muted/50">
                    <div>
                      <span className="font-medium">{service.name}</span> - R$ {service.price.toFixed(2)} ({service.duration} min)
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditService(index)} disabled={isSaving}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={isSaving}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta ação removerá o serviço "{service.name}". Isso não pode ser desfeito.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleRemoveService(index)}>
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
            
            <div className="flex justify-end pt-6 border-t">
              <Button onClick={handleSaveServices} disabled={isSaving || services.length === 0} className="bg-primary hover:bg-primary/90">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? 'Salvando...' : 'Salvar Serviços'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}