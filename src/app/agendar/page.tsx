// src/app/agendar/page.tsx

"use client";

import { GlobalHeader } from '@/components/shared/GlobalHeader';
import { GlobalFooter } from '@/components/shared/GlobalFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { getAllSalons } from '@/lib/firestoreService';
import type { Salon } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function AppointmentsLandingPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [allSalons, setAllSalons] = useState<Salon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchSalons = async () => {
      setIsLoading(true);
      try {
        const salons = await getAllSalons();
        setAllSalons(salons);
      } catch (error) {
        console.error("Failed to fetch salons:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar a lista de salões. Tente novamente mais tarde.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSalons();
  }, [toast]);
  
  const filteredSalons = useMemo(() => {
    if (!searchQuery) return allSalons;
    return allSalons.filter(salon =>
      salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salon.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, allSalons]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast({ title: "Busca", description: `Exibindo salões que correspondem a "${searchQuery}"`});
    } else {
      toast({ title: "Info", description: "Mostrando todos os salões disponíveis."});
    }
  };

  return (
    <>
      <GlobalHeader />
      <main className="flex-grow container mx-auto px-4 py-12">
        <section className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4 text-primary">Encontre Seu Salão Perfeito</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Descubra e agende horários nos melhores salões e barbearias perto de você.
            </p>
        </section>

        <Card className="max-w-2xl mx-auto mb-12 shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-center">Pesquisar por um Salão</CardTitle>
            <CardDescription className="text-center">Digite o nome ou endereço de um salão para filtrar a lista abaixo.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <Input 
                type="text" 
                placeholder="Nome do salão ou endereço..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow"
              />
              <Button type="submit" className="bg-accent hover:bg-accent/90">
                <Search className="mr-2 h-4 w-4" /> Pesquisar
              </Button>
            </form>
          </CardContent>
        </Card>

        <section>
            <h2 className="text-3xl font-bold font-headline mb-8 text-center text-foreground">Nossos Salões</h2>
            {isLoading ? (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredSalons.length > 0 ? filteredSalons.map(salon => (
                        <Card key={salon.id} className="overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
                            <div className="relative h-48 w-full">
                                <Image 
                                    // A MUDANÇA ESTÁ AQUI
                                    src={salon.coverImageUrl || 'https://placehold.co/400x240/a3e635/000000?text=Salão'}
                                    alt={`Imagem de capa de ${salon.name}`} 
                                    layout="fill" 
                                    objectFit="cover"
                                />
                            </div>
                            <CardHeader>
                                <CardTitle className="font-headline text-xl">{salon.name}</CardTitle>
                                <CardDescription>{salon.address || 'Endereço não fornecido'}</CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <Link href={`/agendar/${salon.slug}`} passHref>
                                    <Button className="w-full bg-primary hover:bg-primary/90">Ver Disponibilidade</Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    )) : (
                        <p className="col-span-full text-center text-muted-foreground">Nenhum salão encontrado correspondendo à sua busca.</p>
                    )}
                </div>
            )}
        </section>
      </main>
      <GlobalFooter />
    </>
  );
}