"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/shared/PageHeader';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from '@/contexts/AuthContext';
import { getSalonByAdmin, updateSalonSettings } from '@/lib/firestoreService';
import type { Salon } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from 'lucide-react';

const salonSettingsSchema = z.object({
  name: z.string().min(3, "O nome do salão deve ter pelo menos 3 caracteres."),
  slug: z.string().min(3, "O slug da URL deve ter pelo menos 3 caracteres.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "O slug pode conter apenas letras minúsculas, números e hífens."),
  contactNumber: z.string().min(10, "O número de contato parece muito curto."),
  address: z.string().optional(),
  description: z.string().max(500, "A descrição é muito longa.").optional(),
  email: z.string().email("Endereço de e-mail inválido.").optional(),
});

type SalonSettingsFormValues = z.infer<typeof salonSettingsSchema>;

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true); // Para carregar dados do salão
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<SalonSettingsFormValues>({
    resolver: zodResolver(salonSettingsSchema),
    defaultValues: {
      name: "",
      slug: "",
      contactNumber: "",
      address: "",
      description: "",
      email: "",
    },
  });

  useEffect(() => {
    if (user) {
      const fetchSalonData = async () => {
        setIsLoading(true);
        const salonData = await getSalonByAdmin(user.uid);
        if (salonData) {
          form.reset({
            name: salonData.name || "",
            slug: salonData.slug || "",
            contactNumber: salonData.contactNumber || "",
            address: salonData.address || "",
            description: salonData.description || "",
            email: salonData.email || "",
          });
        } else {
          toast({ title: "Erro", description: "Não foi possível carregar os dados do salão. Pode ser que ainda não exista.", variant: "destructive" });
        }
        setIsLoading(false);
      };
      fetchSalonData();
    } else if (!authLoading) {
        setIsLoading(false);
    }
  }, [user, authLoading, form, toast]);

  const onSubmit = async (data: SalonSettingsFormValues) => {
    if (!user) {
      toast({ title: "Erro", description: "Você precisa estar logado para salvar as configurações.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const { slug, ...updateData } = data; // O slug é derivado do nome em firestoreService se o nome mudar
      await updateSalonSettings(user.uid, updateData);
      toast({ title: "Sucesso", description: "Configurações do salão atualizadas com sucesso!" });
      const updatedSalon = await getSalonByAdmin(user.uid);
      if (updatedSalon) form.reset(updatedSalon);

    } catch (error) {
      console.error("Erro ao atualizar as configurações do salão:", error);
      toast({ title: "Erro", description: "Falha ao atualizar as configurações do salão.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader 
        title="Configurações do Salão"
        description="Gerencie as informações públicas e as configurações operacionais do seu salão."
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline">Informações Básicas</CardTitle>
              <CardDescription>Esta informação será exibida na página pública de agendamentos do seu salão.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Salão</FormLabel>
                    <FormControl><Input placeholder="Nome do seu salão" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug da URL Personalizada</FormLabel>
                    <FormControl><Input placeholder="nome-do-seu-salao" {...field} disabled /></FormControl>
                    <FormDescription>
                      Isso fará parte da URL de agendamento do seu salão: hairflow.com/agendar/{form.getValues().slug || "nome-do-seu-salao"}. 
                      É gerado automaticamente a partir do nome do seu salão.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail de Contato</FormLabel>
                    <FormControl><Input type="email" placeholder="contato@seusalão.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Telefone para Contato</FormLabel>
                    <FormControl><Input type="tel" placeholder="+55 (XX) XXXXX-XXXX" {...field} /></FormControl>
                    <FormDescription>Usado para confirmações de agendamento via WhatsApp e contato com o cliente.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço do Salão</FormLabel>
                    <FormControl><Input placeholder="Rua Principal, 123, Cidade, País" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição do Salão (Opcional)</FormLabel>
                    <FormControl><Textarea placeholder="Conte aos clientes um pouco sobre seu salão..." {...field} rows={4} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" /> Salvar Alterações
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}