// src/app/appointments/page.tsx

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
import { getAllSalons } from '@/lib/firestoreService'; // Importa a nova função
import type { Salon } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function AppointmentsLandingPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [allSalons, setAllSalons] = useState<Salon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Busca os salões do Firestore ao carregar a página
  useEffect(() => {
    const fetchSalons = async () => {
      setIsLoading(true);
      try {
        const salons = await getAllSalons();
        setAllSalons(salons);
      } catch (error) {
        console.error("Failed to fetch salons:", error);
        toast({
          title: "Error",
          description: "Could not load the list of salons. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSalons();
  }, [toast]);
  
  // Filtra os salões com base na busca do usuário
  const filteredSalons = useMemo(() => {
    if (!searchQuery) return allSalons;
    return allSalons.filter(salon =>
      salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salon.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, allSalons]);


  // A função de busca agora só precisa do slug, não precisa mais pesquisar na lista
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
        // A lista de salões já está sendo filtrada em tempo real,
        // então o botão de busca pode ser usado para uma lógica mais avançada no futuro,
        // como buscar por geolocalização. Por enquanto, a lista se atualiza ao digitar.
        toast({ title: "Search", description: `Displaying salons matching "${searchQuery}"`});
    } else {
        toast({ title: "Info", description: "Showing all available salons."});
    }
  };

  return (
    <>
      <GlobalHeader />
      <main className="flex-grow container mx-auto px-4 py-12">
        <section className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4 text-primary">Find Your Perfect Salon</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Discover and book appointments with top-rated barbershops and salons near you.
            </p>
        </section>

        <Card className="max-w-2xl mx-auto mb-12 shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-center">Search for a Salon</CardTitle>
            <CardDescription className="text-center">Enter a salon name or address to filter the list below.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <Input 
                type="text" 
                placeholder="Salon name or address..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow"
              />
              <Button type="submit" className="bg-accent hover:bg-accent/90">
                <Search className="mr-2 h-4 w-4" /> Search
              </Button>
            </form>
          </CardContent>
        </Card>

        <section>
            <h2 className="text-3xl font-bold font-headline mb-8 text-center text-foreground">Our Salons</h2>
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
                                    src={`https://placehold.co/400x240.png`}
                                    alt={`${salon.name} exterior`} 
                                    layout="fill" 
                                    objectFit="cover"
                                    data-ai-hint="salon building"
                                />
                            </div>
                            <CardHeader>
                                <CardTitle className="font-headline text-xl">{salon.name}</CardTitle>
                                <CardDescription>{salon.address || 'Address not provided'}</CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <Link href={`/appointments/${salon.slug}`} passHref>
                                    <Button className="w-full bg-primary hover:bg-primary/90">View Availability</Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    )) : (
                        <p className="col-span-full text-center text-muted-foreground">No salons found matching your search.</p>
                    )}
                </div>
            )}
        </section>
      </main>
      <GlobalFooter />
    </>
  );
}