// src/app/admin/settings/page.tsx

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
// INÍCIO DA ALTERAÇÃO: Importando o componente Select
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
// FIM DA ALTERAÇÃO
import { useAuth } from '@/contexts/AuthContext';
import { getSalonByAdmin, updateSalonSettings } from '@/lib/firestoreService';
import type { Salon } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from 'lucide-react';

// Schema continua o mesmo
const salonSettingsSchema = z.object({
    name: z.string().min(3, "O nome do salão deve ter pelo menos 3 caracteres."),
    slug: z.string().min(3, "O slug da URL deve ter pelo menos 3 caracteres.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "O slug pode conter apenas letras minúsculas, números e hífens."),
    contactNumber: z.string().min(10, "O número de contato parece muito curto."),
    address: z.string().optional(),
    description: z.string().max(500, "A descrição é muito longa.").optional(),
    email: z.string().email("Endereço de e-mail inválido.").optional(),
    logoUrl: z.string().url("Por favor, insira uma URL válida para o logo.").optional().or(z.literal('')),
    coverImageUrl: z.string().url("Por favor, insira uma URL válida para a imagem de capa.").optional().or(z.literal('')),
    abacatepayApiKey: z.string()
        .refine(
            (key) => key === '' || key.startsWith('abc_') || key.startsWith('abs_'),
            {
                message: 'Formato de chave inválido. A chave deve começar com "abc_" ou "abs_".'
            }
        )
        .optional()
        .or(z.literal('')),
});

type SalonSettingsFormValues = z.infer<typeof salonSettingsSchema>;

export default function SettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<SalonSettingsFormValues>({
        resolver: zodResolver(salonSettingsSchema),
        defaultValues: {
            name: "", slug: "", contactNumber: "", address: "",
            description: "", email: "", logoUrl: "", coverImageUrl: "",
            abacatepayApiKey: "",
        },
    });

    useEffect(() => {
        if (user) {
            const fetchSalonData = async () => {
                setIsLoading(true);
                try {
                    const salonData = await getSalonByAdmin(user.uid);
                    if (salonData) {
                        form.reset({
                            name: salonData.name || "",
                            slug: salonData.slug || "",
                            contactNumber: salonData.contactNumber || "",
                            address: salonData.address || "",
                            description: salonData.description || "",
                            email: salonData.email || "",
                            logoUrl: salonData.logoUrl || "",
                            coverImageUrl: salonData.coverImageUrl || "",
                            abacatepayApiKey: salonData.abacatepayApiKey || "",
                        });
                    }
                } catch (error) {
                    toast({ title: "Erro", description: "Não foi possível carregar os dados do salão.", variant: "destructive" });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchSalonData();
        } else if (!authLoading) {
            setIsLoading(false);
        }
    }, [user, authLoading, form, toast]);

    const onSubmit = async (data: SalonSettingsFormValues) => {
        if (!user) {
            toast({ title: "Erro", description: "Você precisa estar logado para salvar.", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            await updateSalonSettings(user.uid, data);
            toast({ title: "Sucesso", description: "Configurações atualizadas com sucesso!" });
        } catch (error) {
            console.error("Erro ao atualizar as configurações:", error);
            toast({ title: "Erro", description: "Falha ao atualizar as configurações.", variant: "destructive" });
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
                description="Gerencie as informações públicas, pagamentos e a identidade visual do seu salão."
            />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* CARD INFORMAÇÕES BÁSICAS */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="font-headline">Informações Básicas</CardTitle>
                            <CardDescription>Esta informação será exibida na página pública de agendamentos.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Nome do Salão</FormLabel> <FormControl><Input placeholder="Nome do seu salão" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                            <FormField control={form.control} name="slug" render={({ field }) => ( <FormItem> <FormLabel>Slug da URL Personalizada</FormLabel> <FormControl><Input placeholder="nome-do-seu-salao" {...field} disabled /></FormControl> <FormDescription>URL: hairflow.com/agendar/{form.getValues().slug || "seu-slug"}</FormDescription> <FormMessage /> </FormItem> )}/>
                            <FormField control={form.control} name="email" render={({ field }) => ( <FormItem> <FormLabel>E-mail de Contato</FormLabel> <FormControl><Input type="email" placeholder="contato@seusalão.com" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                            <FormField control={form.control} name="contactNumber" render={({ field }) => ( <FormItem> <FormLabel>Número de Telefone</FormLabel> <FormControl><Input type="tel" placeholder="+55 (XX) XXXXX-XXXX" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                            <FormField control={form.control} name="address" render={({ field }) => ( <FormItem> <FormLabel>Endereço do Salão</FormLabel> <FormControl><Input placeholder="Rua Principal, 123, Cidade" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                            <FormField control={form.control} name="description" render={({ field }) => ( <FormItem> <FormLabel>Descrição do Salão</FormLabel> <FormControl><Textarea placeholder="Conte aos clientes um pouco sobre seu salão..." {...field} rows={4} /></FormControl> <FormMessage /> </FormItem> )}/>
                        </CardContent>
                    </Card>

                    {/* CARD IDENTIDADE VISUAL */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="font-headline">Identidade Visual</CardTitle>
                            <CardDescription>Personalize a página do seu salão com um logo e uma imagem de capa.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField control={form.control} name="logoUrl" render={({ field }) => (<FormItem><FormLabel>URL do Logo</FormLabel><FormControl><Input type="url" placeholder="https://exemplo.com/logo.png" {...field} /></FormControl><FormDescription>O logo aparecerá no topo da sua página de agendamento.</FormDescription><FormMessage /></FormItem>)}/>
                            <FormField control={form.control} name="coverImageUrl" render={({ field }) => (<FormItem><FormLabel>URL da Imagem de Capa</FormLabel><FormControl><Input type="url" placeholder="https://exemplo.com/capa.jpg" {...field} /></FormControl><FormDescription>Esta imagem será usada como banner principal.</FormDescription><FormMessage /></FormItem>)}/>
                        </CardContent>
                    </Card>

                    {/* INÍCIO DA ALTERAÇÃO: CARD DE CONFIGURAÇÕES ABACATEPAY */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="font-headline">Configurações de Pagamento (AbacatePay)</CardTitle>
                            <CardDescription>
                                Conecte sua conta AbacatePay para aceitar pagamentos online de forma segura.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="abacatepayApiKey"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Chave Secreta da API AbacatePay (Secret Key)</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="Cole sua chave aqui (ex: abs_prod_...)" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            É crucial que você insira sua <b>Chave Secreta</b> (geralmente com prefixo <code>abs_</code> ou <code>abc_</code>).<br/>
                                            Ela é usada para criar cobranças de forma segura no servidor.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                    {/* FIM DA ALTERAÇÃO */}

                    <div className="flex justify-end">
                        <Button type="submit" size="lg" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" /> Salvar Alterações
                        </Button>
                    </div>
                </form>
            </Form>
        </>
    );
}