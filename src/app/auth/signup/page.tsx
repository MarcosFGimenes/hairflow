"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Logo } from '@/components/shared/Logo';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription, // Garantir que FormDescription está importado
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createSalon } from '@/lib/firestoreService';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const signupSchema = z.object({
  salonName: z.string().min(2, { message: "O nome do salão deve ter pelo menos 3 caracteres." }),
  contactNumber: z.string().min(10, { message: "O número de contato deve ter pelo menos 10 dígitos." }),
  address: z.string().optional(),
  description: z.string().max(500, "A descrição pode ter até 500 caracteres.").optional(),
  email: z.string().email({ message: "Endereço de e-mail inválido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      salonName: "",
      contactNumber: "",
      address: "",
      description: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      
      if (user) {
        await createSalon(
          user.uid, 
          data.salonName, 
          user.email || data.email,
          data.contactNumber,
          data.address,
          data.description
        );
        toast({ title: "Cadastro Bem-sucedido", description: "Salão criado. Redirecionando para o painel..." });
        router.push("/admin"); 
      } else {
        throw new Error("Falha na criação do usuário.");
      }
    } catch (error: any) {
      console.error("Erro de cadastro:", error);
      let errorMessage = "Ocorreu um erro inesperado.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Este endereço de e-mail já está em uso.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "O endereço de e-mail não é válido.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "A senha é muito fraca.";
      }
      toast({
        title: "Falha no Cadastro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
      <div className="mb-8">
        <Logo size="large" />
      </div>
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Crie Sua Conta de Salão</CardTitle>
          <CardDescription>Junte-se ao Hairflow e comece a gerenciar seus agendamentos sem complicações.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="salonName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Salão *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Barbearia Cortes Top" {...field} disabled={isLoading}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Telefone para Contato *</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="(55) 12345-6789" {...field} disabled={isLoading}/>
                    </FormControl>
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
                    <FormLabel>Endereço do Salão (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua Principal, 123, Cidade, País" {...field} disabled={isLoading}/>
                    </FormControl>
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
                    <FormControl>
                      <Textarea placeholder="Conte aos clientes um pouco sobre seu salão..." {...field} rows={3} disabled={isLoading}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço de E-mail para Login *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="voce@exemplo.com" {...field} disabled={isLoading}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={isLoading}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={isLoading}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full text-lg py-6 bg-primary hover:bg-primary/90" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Criar Conta
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link href="/auth/login" className="font-semibold text-primary hover:underline">
              Fazer login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
