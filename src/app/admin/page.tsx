// src/app/admin/page.tsx
"use client"; // Adicionado para permitir o uso de hooks de cliente

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CalendarDays, Clock, Users, DollarSign, PlusCircle, LayoutGrid } from 'lucide-react'; // NEW: Added LayoutGrid icon
import { PageHeader } from '@/components/shared/PageHeader';
import { useAuth } from '@/contexts/AuthContext'; // NEW: Import useAuth
import { getAppointmentsForReporting, getProfessionalsBySalon } from '@/lib/firestoreService'; // NEW: Import getAppointmentsForReporting, getProfessionalsBySalon
import { useState, useEffect, useMemo } from 'react'; // NEW: Import useState, useEffect, useMemo
import { Loader2 } from 'lucide-react'; // NEW: Import Loader2 for loading state


export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth(); //
  const [isLoadingData, setIsLoadingData] = useState(true); // NEW: Loading state for data
  const [upcomingAppointments, setUpcomingAppointments] = useState(0); //
  const [totalProfessionals, setTotalProfessionals] = useState(0); //
  const [dailyRevenue, setDailyRevenue] = useState(0); //
  const [weeklyRevenue, setWeeklyRevenue] = useState(0); //
  const [monthlyRevenue, setMonthlyRevenue] = useState(0); //

  useEffect(() => {
    const fetchData = async () => {
      if (user) { //
        setIsLoadingData(true);
        // Fetch upcoming appointments
        const allAppointments = await getAppointmentsForReporting(user.uid, 'daily'); //
        // Filter future appointments
        const futureAppointments = allAppointments.filter(appt => appt.startTime.getTime() > new Date().getTime()); //
        setUpcomingAppointments(futureAppointments.length); //

        // Fetch professionals
        const professionalsList = await getProfessionalsBySalon(user.uid); //
        setTotalProfessionals(professionalsList.length); //

        // Fetch revenue data
        const completedDailyAppointments = await getAppointmentsForReporting(user.uid, 'daily'); //
        const completedWeeklyAppointments = await getAppointmentsForReporting(user.uid, 'weekly'); //
        const completedMonthlyAppointments = await getAppointmentsForReporting(user.uid, 'monthly'); //

        const sumRevenue = (appointments: any[]) => appointments.reduce((sum, appt) => sum + (appt.price || 0), 0); //

        setDailyRevenue(sumRevenue(completedDailyAppointments)); //
        setWeeklyRevenue(sumRevenue(completedWeeklyAppointments)); //
        setMonthlyRevenue(sumRevenue(completedMonthlyAppointments)); //

        setIsLoadingData(false);
      }
    };

    if (!authLoading) { //
      fetchData();
    }
  }, [user, authLoading]); //

  // Mock data for available slots today (this still needs real implementation)
  const availableSlotsToday = 12;

  if (authLoading || isLoadingData) { //
    return (
      <>
        <PageHeader
          title="Painel de Administração"
          description="Visão geral da atividade do seu salão."
          actions={
            <Link href="/admin/agendamentos/new">
              <Button disabled><PlusCircle className="mr-2 h-4 w-4" /> Novo Agendamento</Button>
            </Link>
          }
        />
        <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Carregando dados do painel...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Painel de Administração"
        description="Visão geral da atividade do seu salão."
        actions={
          <Link href="/admin/agendamentos/new">
            <Button><PlusCircle className="mr-2 h-4 w-4" /> Novo Agendamento</Button>
          </Link>
        }
      />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Futuros</CardTitle>
            <CalendarDays className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">{upcomingAppointments}</div>
            <p className="text-xs text-muted-foreground">Próximos 7 dias</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horários Disponíveis Hoje</CardTitle>
            <Clock className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">{availableSlotsToday}</div>
            <p className="text-xs text-muted-foreground">Em todos os profissionais</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Profissionais</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">{totalProfessionals}</div>
            <p className="text-xs text-muted-foreground">Membros da equipe ativos</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total (Est.)</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-headline">
              Dia: R$ {dailyRevenue.toFixed(2)}
            </div>
            <div className="text-xl font-bold font-headline">
              Semana: R$ {weeklyRevenue.toFixed(2)}
            </div>
            <div className="text-xl font-bold font-headline">
              Mês: R$ {monthlyRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Considerando agendamentos concluídos.</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/slots">
              <Button variant="outline" className="w-full justify-start"><Clock className="mr-2 h-4 w-4" /> Gerenciar Disponibilidade</Button>
            </Link>
            <Link href="/admin/professionals">
              <Button variant="outline" className="w-full justify-start"><Users className="mr-2 h-4 w-4" /> Adicionar/Editar Profissionais</Button>
            </Link>
            {/* NEW: Link to manage services */}
            <Link href="/admin/services">
              <Button variant="outline" className="w-full justify-start"><LayoutGrid className="mr-2 h-4 w-4" /> Gerenciar Serviços</Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline" className="w-full justify-start"><Users className="mr-2 h-4 w-4" /> Atualizar Detalhes do Salão</Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Atividade Recente</CardTitle>
            <CardDescription>Últimas reservas e atualizações.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="text-sm text-muted-foreground">Nova reserva: João S. para Corte de Cabelo - Amanhã às 14h.</li>
              <li className="text-sm text-muted-foreground">Disponibilidade atualizada para Joana D.</li>
              <li className="text-sm text-muted-foreground">Reserva cancelada: Alex P. - Hoje às 10h.</li>
            </ul>
            <Button variant="link" className="mt-2 px-0">Ver toda a atividade</Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}