
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Edit, Trash2, UserPlus } from 'lucide-react';
import { placeholderProfessionals } from '@/lib/placeholder-data';
import { PageHeader } from '@/components/shared/PageHeader';

export default function ProfessionalsPage() {
  // Assuming these professionals are for the currently logged-in salon
  const professionals = placeholderProfessionals.filter(p => p.salonId === 'salon1'); // Example filter

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
            <p className="text-muted-foreground mb-4">Start by adding your talented staff members.</p>
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
                  <AvatarImage src={prof.imageUrl} alt={prof.name} data-ai-hint="person beauty" />
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
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/admin/professionals/${prof.id}/edit`}
                      className="flex items-center w-full">
                      <Edit className="mr-2 h-4 w-4" /> Edit Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="flex-grow">
              {/* Could add more details here if needed, like contact info or a short bio */}
              <p className="text-sm text-muted-foreground">Manages own schedule: Yes</p>
              <p className="text-sm text-muted-foreground">Services offered: Haircuts, Fades, Beard Trims</p>
            </CardContent>
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
