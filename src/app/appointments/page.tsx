
"use client";

import { GlobalHeader } from '@/components/shared/GlobalHeader';
import { GlobalFooter } from '@/components/shared/GlobalFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import Image from 'next/image';
import { placeholderSalons } from '@/lib/placeholder-data'; // For listing example salons

export default function AppointmentsLandingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // For now, let's assume searchQuery is a salon slug
      // In a real app, this would search for salons and then redirect
      // or show a list of matching salons.
      // Here, we'll try to find a direct match with placeholder salon slugs.
      const matchedSalon = placeholderSalons.find(s => s.slug.toLowerCase() === searchQuery.trim().toLowerCase() || s.name.toLowerCase().includes(searchQuery.trim().toLowerCase()));
      if (matchedSalon) {
        router.push(`/appointments/${matchedSalon.slug}`);
      } else {
        alert("Salon not found. Please try a different name or check our list.");
      }
    } else {
        alert("Please enter a salon name or location to search.")
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
            <CardDescription className="text-center">Enter salon name or your city to find available bookings.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input 
                type="text" 
                placeholder="Salon name or city (e.g., Cool Cuts or Anytown)" 
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
            <h2 className="text-3xl font-bold font-headline mb-8 text-center text-foreground">Or Browse Our Featured Salons</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {placeholderSalons.map(salon => (
                    <Card key={salon.id} className="overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
                        <div className="relative h-48 w-full">
                            <Image 
                                src={`https://placehold.co/400x240.png`} // Generic placeholder
                                alt={`${salon.name} exterior`} 
                                layout="fill" 
                                objectFit="cover"
                                data-ai-hint="salon building"
                            />
                        </div>
                        <CardHeader>
                            <CardTitle className="font-headline text-xl">{salon.name}</CardTitle>
                            <CardDescription>{salon.address}</CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Link href={`/appointments/${salon.slug}`}>
                                <Button className="w-full bg-primary hover:bg-primary/90">View Availability</Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </section>
      </main>
      <GlobalFooter />
    </>
  );
}

