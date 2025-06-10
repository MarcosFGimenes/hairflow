// src/app/admin/page.tsx
"use client"; // Adicionado para permitir o uso de hooks de cliente

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CalendarDays, Clock, Users, DollarSign, PlusCircle, LayoutGrid } from 'lucide-react'; // NEW: Added LayoutGrid icon
import { PageHeader } from '@/components/shared/PageHeader';
import { useAuth } from '@/contexts/AuthContext'; // NEW: Import useAuth
import { getAppointmentsBySalon, getAppointmentsForReporting, getProfessionalsBySalon } from '@/lib/firestoreService'; // NEW: Import getAppointmentsForReporting, getProfessionalsBySalon
import { useState, useEffect, useMemo } from 'react'; // NEW: Import useState, useEffect, useMemo
import { Loader2 } from 'lucide-react'; // NEW: Import Loader2 for loading state
import { startOfDay, format } from 'date-fns'; // Import startOfDay and format


export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState(0);
  const [totalProfessionals, setTotalProfessionals] = useState(0);
  const [dailyRevenue, setDailyRevenue] = useState(0);
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [availableSlotsToday, setAvailableSlotsToday] = useState(0); // Assuming this will be calculated or fetched
  const [allAppointments, setAllAppointments] = useState<any[]>([]); // Store all appointments for recent activity

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        setIsLoadingData(true);
        const salonId = user.uid; // Your salon's ID is the user's UID

        // Fetch all appointments first to be used for multiple cards
        const fetchedAllAppointments = await getAppointmentsBySalon(salonId);
        setAllAppointments(fetchedAllAppointments);

        // Calculate upcoming appointments
        const startOfToday = startOfDay(new Date()).getTime();
        const futureAppointments = fetchedAllAppointments.filter((appt: any) => appt.startTime.getTime() >= startOfToday);
        setUpcomingAppointments(futureAppointments.length);

        // Fetch professionals
        const professionalsList = await getProfessionalsBySalon(salonId);
        setTotalProfessionals(professionalsList.length);

        // Fetch revenue data (only for 'completed' appointments)
        const completedDailyAppointments = await getAppointmentsForReporting(salonId, 'daily');
        const completedWeeklyAppointments = await getAppointmentsForReporting(salonId, 'weekly');
        const completedMonthlyAppointments = await getAppointmentsForReporting(salonId, 'monthly');

        const sumRevenue = (appointments: any[]) => appointments.reduce((sum, appt) => sum + (appt.price || 0), 0);

        setDailyRevenue(sumRevenue(completedDailyAppointments));
        setWeeklyRevenue(sumRevenue(completedWeeklyAppointments));
        setMonthlyRevenue(sumRevenue(completedMonthlyAppointments));

        // TODO: Implement actual calculation for available slots today
        // This would require fetching availability for each professional for today
        // and subtracting booked slots from it. For now, it remains a placeholder.
        setAvailableSlotsToday(0); // Placeholder

        setIsLoadingData(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading]);

  if (authLoading || isLoadingData) {
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
            <p className="text-xs text-muted-foreground">Próximos agendamentos</p>
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
            {/* Link to manage services */}
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
              {allAppointments.length > 0 ? (
                allAppointments.slice(0, 3).map((appt: any) => (
                  <li key={appt.id} className="text-sm text-muted-foreground">
                    {appt.status === 'scheduled' && (
                      <>
                        Nova reserva: <span className="font-medium">{appt.clientName}</span> para {appt.serviceName} - {format(appt.startTime, "PPP 'às' HH:mm")}.
                      </>
                    )}
                    {appt.status === 'cancelled' && (
                      <>
                        Reserva cancelada: <span className="font-medium">{appt.clientName}</span> - {format(appt.startTime, "PPP 'às' HH:mm")}.
                      </>
                    )}
                    {appt.status === 'confirmed' && (
                      <>
                        Reserva confirmada: <span className="font-medium">{appt.clientName}</span> para {appt.serviceName} - {format(appt.startTime, "PPP 'às' HH:mm")}.
                      </>
                    )}
                    {appt.status === 'completed' && (
                      <>
                        Reserva concluída: <span className="font-medium">{appt.clientName}</span> para {appt.serviceName} - {format(appt.startTime, "PPP 'às' HH:mm")}.
                      </>
                    )}
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">Nenhuma atividade recente.</li>
              )}
            </ul>
            <Link href="/admin/agendamentos" passHref>
              <Button variant="link" className="mt-2 px-0">Ver toda a atividade</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}