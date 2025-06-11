// src/app/admin/professionals/new/page.tsx

"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/PageHeader';
import { UserPlus, Save, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/contexts/AuthContext';
import { createProfessional } from '@/lib/firestoreService';
import { useToast } from "@/hooks/use-toast";

export default function NewProfessionalPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null); // Estado para armazenar a URL da imagem
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Erro de Autenticação", description: "Você não está logado.", variant: "destructive" });
      return;
    }
    if (!name) {
      toast({ title: "Campo Obrigatório", description: "O nome do profissional é obrigatório.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    
    try {
      const professionalData = {
        name,
        specialty,
        // Usamos a URL do estado diretamente. Se estiver vazia, usamos um placeholder.
        imageUrl: imageUrl || `https://ui-avatars.com/api/?name=${name.replace(/\s/g, '+')}&background=random`,
        // Adicionando os campos de contato, se preenchidos
        email: email || null,
        phone: phone || null,
      };

      await createProfessional(user.uid, professionalData);
      
      toast({ title: "Sucesso!", description: `${name} foi adicionado(a) à sua equipe.` });
      router.push('/admin/professionals');

    } catch (error) {
      console.error("Erro ao adicionar profissional:", error);
      toast({ title: "Erro", description: "Não foi possível adicionar o profissional. Tente novamente.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <PageHeader 
        title="Adicionar Novo Profissional"
        description="Insira os detalhes do novo membro da equipe."
      />
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" /> Informações do Profissional
          </CardTitle>
          <CardDescription>Todos os campos marcados com * são obrigatórios.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* CAMPO DE IMAGEM ATUALIZADO PARA USAR URL */}
            <div className="flex items-center gap-4 pt-2">
              <Avatar className="h-24 w-24 rounded-lg shadow">
                <AvatarImage src={imageUrl || ''} alt="Prévia do perfil" />
                <AvatarFallback className="rounded-lg">
                  <UserPlus className="h-10 w-10 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-grow space-y-1">
                <Label htmlFor="prof-image-url">URL da Imagem de Perfil</Label>
                <Input
                    id="prof-image-url"
                    type="url"
                    value={imageUrl || ''}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://exemplo.com/foto.png"
                    disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">Cole a URL de uma imagem para o perfil.</p>
              </div>
            </div>

            <div>
              <Label htmlFor="prof-name">Nome Completo *</Label>
              <Input id="prof-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: João Silva" required disabled={isSaving}/>
            </div>

            <div>
              <Label htmlFor="prof-specialty">Especialidade / Função</Label>
              <Input id="prof-specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Ex: Estilista, Especialista em Cores" disabled={isSaving}/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="prof-email">Endereço de E-mail (Opcional)</Label>
                <Input id="prof-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="joao.silva@exemplo.com" disabled={isSaving}/>
              </div>
              <div>
                <Label htmlFor="prof-phone">Número de Telefone (Opcional)</Label>
                <Input id="prof-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(XX) XXXXX-XXXX" disabled={isSaving}/>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Link href="/admin/professionals">
                <Button variant="outline" type="button" disabled={isSaving}>Cancelar</Button>
              </Link>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? 'Salvando...' : 'Salvar Profissional'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}