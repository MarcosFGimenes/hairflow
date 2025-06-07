"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Filter, Eye, Edit, Trash2, CheckCircle, XCircle, Hourglass } from 'lucide-react';
import { placeholderAppointments, placeholderProfessionals } from '@/lib/placeholder-data';
import type { Appointment } from '@/lib/types';
import { PageHeader } from '@/components/shared/PageHeader';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    case 'confirmed': return 'default'; // Using 'default' for a positive/confirmed status
    case 'scheduled': return 'secondary';
    case 'completed': return 'outline'; // Could be greenish, using outline for now
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
  const appointments = placeholderAppointments; // Assume these are for the logged-in salon

  return (
    <>
      <PageHeader 
        title="Manage Appointments"
        description="View, edit, and manage all client bookings."
        actions={
          <Link href="/admin/appointments/new" passHref legacyBehavior>
            <Button><PlusCircle className="mr-2 h-4 w-4" /> New Appointment</Button>
          </Link>
        }
      />

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="font-headline">All Bookings</CardTitle>
              <CardDescription>A list of all appointments for your salon.</CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Input placeholder="Search client or service..." className="max-w-xs" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
                        <DropdownMenuItem>
                          <Link href={`/admin/appointments/${appt.id}`} className="flex items-center w-full">
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link href={`/admin/appointments/${appt.id}/edit`} className="flex items-center w-full">
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
              No appointments found.
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
