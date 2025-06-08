"use client";

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, UserPlus, Edit, Trash2, Loader2 } from 'lucide-react';
import { getProfessionalsBySalon } from '@/lib/firestoreService'; // Importar a nova função
import type { Professional } from '@/lib/types';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfessionalsPage() {
  const { user, loading: authLoading } = useAuth();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Função assíncrona para buscar os profissionais
    const fetchProfessionals = async () => {
      if (user) {
        setIsLoading(true);
        const fetchedProfessionals = await getProfessionalsBySalon(user.uid);
        setProfessionals(fetchedProfessionals);
        setIsLoading(false);
      } else {
        setProfessionals([]);
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchProfessionals();
    }
  }, [user, authLoading]);

  if (authLoading || isLoading) {
    return (
      <>
        <PageHeader 
          title="Manage Professionals"
          description="Add, edit, or remove staff members for your salon."
          actions={
            <Link href="/admin/professionals/new">
              <Button disabled><UserPlus className="mr-2 h-4 w-4" /> Add New Professional</Button>
            </Link>
          }
        />
        <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Loading professionals...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title="Manage Professionals"
        description="Add, edit, or remove staff members for your salon."
        actions={
          <Link href="/admin/professionals/new">
            <Button><UserPlus className="mr-2 h-4 w-4" /> Add New Professional</Button>
          </Link>
        }
      />
      {professionals.length === 0 && (
        <Card className="shadow-lg">
          <CardContent className="py-10 text-center">
            <UserPlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold font-headline text-foreground">No Professionals Added Yet</h3>
            <p className="text-muted-foreground mb-4">Start by adding your talented staff members to this salon.</p>
            <Link href="/admin/professionals/new">
              <Button>Add First Professional</Button>
            </Link>
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {professionals.map((prof) => (
          <Card key={prof.id} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary">
                  <AvatarImage src={prof.imageUrl || `https://placehold.co/100x100.png`} alt={prof.name} />
                  <AvatarFallback>{prof.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl font-headline">{prof.name}</CardTitle>
                  {prof.specialty && <CardDescription>{prof.specialty}</CardDescription>}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" /> Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardFooter>
                <Link href={`/admin/slots?professional=${prof.id}`} className="w-full">
                    <Button variant="outline" className="w-full">Manage Availability</Button>
                </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}