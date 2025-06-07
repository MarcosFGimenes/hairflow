
"use client";

import Link from 'next/link';
import React, { useState, useEffect } from 'react'; // Added useState and useEffect
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Filter, Eye, Edit, Trash2, CheckCircle, XCircle, Hourglass, Loader2 } from 'lucide-react';
import { placeholderAppointments, placeholderProfessionals } from '@/lib/placeholder-data';
import type { Appointment } from '@/lib/types';
import { PageHeader } from '@/components/shared/PageHeader';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

// Function to get professional name
const getProfessionalName = (profId: string) => {
  const prof = placeholderProfessionals.find(p => p.id === profId);
  return prof ? prof.name : 'N/A';
};

// Function to format date and time
const formatDateTime = (date: Date) => {
  return format(date, "MMM d, yyyy 'at' h:mm a");
};

const statusBadgeVariant = (status: Appointment['status']): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'confirmed': return 'default';
    case 'scheduled': return 'secondary';
    case 'completed': return 'outline';
    case 'cancelled': return 'destructive';
    default: return 'secondary';
  }
};

const statusIcon = (status: Appointment['status']) => {
  switch (status) {
    case 'confirmed': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'scheduled': return <Hourglass className="h-4 w-4 text-yellow-500" />;
    case 'completed': return <CheckCircle className="h-4 w-4 text-blue-500" />;
    case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
    default: return null;
  }
}


export default function AppointmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      // Filter placeholderAppointments based on the logged-in user's salonId (user.uid)
      // In a real app, you would fetch appointments from Firestore filtered by salonId
      const userSalonId = user.uid;
      const filtered = placeholderAppointments.filter(appt => appt.salonId === userSalonId);
      setAppointments(filtered);
      setIsLoading(false);
    } else if (!authLoading && !user) {
      // No user, so no appointments to show, or redirect handled by AdminLayout
      setAppointments([]);
      setIsLoading(false);
    }
  }, [user, authLoading]);

  if (authLoading || isLoading) {
    return (
      <>
        <PageHeader 
          title="Manage Appointments"
          description="View, edit, and manage all client bookings."
          actions={
            <Link href="/admin/appointments/new">
              <Button disabled><PlusCircle className="mr-2 h-4 w-4" /> New Appointment</Button>
            </Link>
          }
        />
        <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Loading appointments...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title="Manage Appointments"
        description="View, edit, and manage all client bookings."
        actions={
          <Link href="/admin/appointments/new">
            <Button><PlusCircle className="mr-2 h-4 w-4" /> New Appointment</Button>
          </Link>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="font-headline">Your Salon's Bookings</CardTitle>
              <CardDescription>A list of all appointments for your salon.</CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Input placeholder="Search client or service..." className="max-w-xs" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {/* These should be actual SelectItems, not DropdownMenuItems for a select-like filter */}
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Professional</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appt) => (
                <TableRow key={appt.id}>
                  <TableCell>
                    <div className="font-medium">{appt.clientName}</div>
                    <div className="text-sm text-muted-foreground">{appt.clientPhone}</div>
                  </TableCell>
                  <TableCell>{appt.serviceName}</TableCell>
                  <TableCell>{getProfessionalName(appt.professionalId)}</TableCell>
                  <TableCell>{formatDateTime(appt.startTime)}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(appt.status)} className="flex items-center gap-1.5">
                      {statusIcon(appt.status)}
                      {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/appointments/${appt.id}`}
                            className="flex items-center w-full">
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/appointments/${appt.id}/edit`}
                            className="flex items-center w-full">
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Cancel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {appointments.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              No appointments found for your salon.
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

