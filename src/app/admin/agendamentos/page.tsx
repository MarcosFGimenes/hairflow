"use client";

import Link from 'next/link';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MoreHorizontal, PlusCircle, Filter, Eye, Edit, Trash2, CheckCircle, XCircle, Hourglass, Loader2, UserCheck } from 'lucide-react';
import { getAppointmentsBySalon, getProfessionalsBySalon, updateAppointmentStatus, cancelAppointment } from '@/lib/firestoreService';
import type { Appointment, Professional } from '@/lib/types';
import { PageHeader } from '@/components/shared/PageHeader';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";

// Função para formatar a data e hora
const formatDateTime = (date: Date) => {
  return format(date, "d 'de' MMM, yyyy 'às' HH:mm");
};

// Variações de badge para o status
const statusBadgeVariant = (status: Appointment['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case 'confirmed': return 'default';
        case 'scheduled': return 'secondary';
        case 'completed': return 'outline';
        case 'cancelled': return 'destructive';
        default: return 'secondary';
    }
};

// Ícones para o status
const statusIcon = (status: Appointment['status']) => {
    switch (status) {
        case 'confirmed': return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'scheduled': return <Hourglass className="h-4 w-4 text-yellow-500" />;
        case 'completed': return <CheckCircle className="h-4 w-4 text-blue-500" />;
        case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
        default: return null;
    }
};


export default function AppointmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchAppointments = useCallback(async () => {
    if (user) {
      setIsLoading(true);
      const [fetchedProfessionals, fetchedAppointments] = await Promise.all([
        getProfessionalsBySalon(user.uid),
        getAppointmentsBySalon(user.uid),
      ]);
      setProfessionals(fetchedProfessionals);
      setAppointments(fetchedAppointments);
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchAppointments();
    }
  }, [user, authLoading, fetchAppointments]);

  const handleStatusUpdate = async (appointmentId: string, status: Appointment['status']) => {
    try {
      await updateAppointmentStatus(appointmentId, status);
      toast({ title: 'Sucesso', description: `Agendamento atualizado para ${status}.` });
      fetchAppointments(); // Re-busca os dados para atualizar a UI
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar o status.', variant: 'destructive' });
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await cancelAppointment(appointmentId);
      toast({ title: 'Sucesso', description: 'Agendamento cancelado.' });
      fetchAppointments();
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível cancelar o agendamento.', variant: 'destructive' });
    }
  };

  const getProfessionalName = useCallback((profId: string) => {
    const prof = professionals.find(p => p.id === profId);
    return prof ? prof.name : 'N/A';
  }, [professionals]);

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter(appt => statusFilter === 'all' || appt.status === statusFilter)
      .filter(appt => 
        appt.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appt.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [appointments, statusFilter, searchTerm]);

  if (authLoading || isLoading) {
    return (
        <>
        <PageHeader 
          title="Gerenciar Agendamentos"
          description="Visualize, edite e gerencie todas as reservas de clientes."
          actions={
            <Link href="/admin/agendamentos/new">
              <Button disabled><PlusCircle className="mr-2 h-4 w-4" /> Novo Agendamento</Button>
            </Link>
          }
        />
        <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Carregando agendamentos...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader 
        title="Gerenciar Agendamentos"
        description="Visualize, edite e gerencie todas as reservas de clientes."
        actions={
          <Link href="/admin/agendamentos/new">
            <Button><PlusCircle className="mr-2 h-4 w-4" /> Novo Agendamento</Button>
          </Link>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="font-headline">Reservas do Seu Salão</CardTitle>
              <CardDescription>Uma lista de todos os agendamentos para o seu salão.</CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Input 
                placeholder="Pesquisar cliente ou serviço..." 
                className="max-w-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filtrar</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setStatusFilter('all')}>Todos os Status</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setStatusFilter('scheduled')}>Agendados</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setStatusFilter('confirmed')}>Confirmados</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setStatusFilter('completed')}>Concluídos</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setStatusFilter('cancelled')}>Cancelados</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Data e Hora</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length > 0 ? filteredAppointments.map((appt) => (
                <TableRow key={appt.id}>
                  <TableCell>
                    <div className="font-medium">{appt.clientName}</div>
                    <div className="text-sm text-muted-foreground">{appt.clientPhone}</div>
                  </TableCell>
                  <TableCell>{appt.serviceName}</TableCell>
                  <TableCell>{getProfessionalName(appt.professionalId)}</TableCell>
                  <TableCell>{formatDateTime(appt.startTime)}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(appt.status)} className="flex items-center gap-1.5 cursor-pointer">
                      {statusIcon(appt.status)}
                      {appt.status === 'scheduled' && 'Agendado'}
                      {appt.status === 'confirmed' && 'Confirmado'}
                      {appt.status === 'completed' && 'Concluído'}
                      {appt.status === 'cancelled' && 'Cancelado'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleStatusUpdate(appt.id, 'confirmed')}>
                                <UserCheck className="mr-2 h-4 w-4" /> Marcar como Confirmado
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleStatusUpdate(appt.id, 'completed')}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Marcar como Concluído
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive" onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Cancelar Agendamento
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                Esta ação irá cancelar o agendamento para {appt.clientName}. Isso não pode ser desfeito.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Voltar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleCancelAppointment(appt.id)}>
                                Continuar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Nenhum agendamento encontrado com os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}