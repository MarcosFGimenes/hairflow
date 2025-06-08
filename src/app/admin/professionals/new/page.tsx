"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/PageHeader';
import { UserPlus, Save, UploadCloud, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext'; // Importar useAuth
import { createProfessional } from '@/lib/firestoreService'; // Importar a nova função
import { useToast } from "@/hooks/use-toast"; // Para notificações melhores

export default function NewProfessionalPage() {
  const router = useRouter();
  const { user } = useAuth(); // Obter o usuário logado
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // A função handleImageUpload permanece a mesma
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // setImageFile(file); // A lógica de upload de arquivo real seria necessária aqui
      setImageUrl(URL.createObjectURL(file));
    }
  };

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
        // Em um app real, você faria o upload da imagem para o Firebase Storage aqui
        // e usaria a URL retornada. Por enquanto, usaremos o placeholder.
        imageUrl: imageUrl || 'https://placehold.co/100x100.png',
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
        title="Add New Professional"
        description="Enter the details for the new staff member."
      />
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" /> Professional Information
          </CardTitle>
          <CardDescription>All fields marked with * are required.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2 text-center">
              <Label htmlFor="profile-image" className="block text-sm font-medium text-muted-foreground">Profile Image</Label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  {imageUrl ? (
                    <Image src={imageUrl} alt="Profile preview" width={128} height={128} className="mx-auto h-32 w-32 rounded-full object-cover shadow-md" />
                  ) : (
                    <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                  )}
                  <div className="flex text-sm text-muted-foreground justify-center">
                    <label
                      htmlFor="profile-image-upload"
                      className="relative cursor-pointer rounded-md bg-background font-medium text-primary hover:text-accent focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                    >
                      <span>{imageUrl ? 'Change image' : 'Upload an image'}</span>
                      <input id="profile-image-upload" name="profile-image-upload" type="file" className="sr-only" onChange={handleImageUpload} accept="image/*" />
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 2MB</p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="prof-name">Full Name *</Label>
              <Input id="prof-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John Doe" required disabled={isSaving}/>
            </div>

            <div>
              <Label htmlFor="prof-specialty">Specialty / Role</Label>
              <Input id="prof-specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="e.g., Senior Stylist, Color Expert" disabled={isSaving}/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="prof-email">Email Address (Optional)</Label>
                <Input id="prof-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john.doe@example.com" disabled={isSaving}/>
              </div>
              <div>
                <Label htmlFor="prof-phone">Phone Number (Optional)</Label>
                <Input id="prof-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" disabled={isSaving}/>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Link href="/admin/professionals">
                <Button variant="outline" type="button" disabled={isSaving}>Cancel</Button>
              </Link>
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? 'Saving...' : 'Save Professional'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}