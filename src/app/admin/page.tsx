// src/app/admin/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
// ÍCONES ATUALIZADOS: Adicionado 'Contact'
import { CalendarDays, Clock, Users, DollarSign, PlusCircle, LayoutGrid, Contact } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
// SERVIÇOS DO FIRESTORE ATUALIZADOS: Adicionado 'getCustomersBySalon'
import { 
  getAppointmentsBySalon, 
  getAppointmentsForReporting, 
  getProfessionalsBySalon,
  getCustomersBySalon // Adicione esta importação
} from '@/lib/firestoreService';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { startOfDay, format } from 'date-fns';

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Estados dos cards
  const [upcomingAppointments, setUpcomingAppointments] = useState(0);
  const [totalProfessionals, setTotalProfessionals] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0); // <-- NOVO: Estado para total de clientes
  const [dailyRevenue, setDailyRevenue] = useState(0);
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  
  // Estado para atividade recente
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        setIsLoadingData(true);
        const salonId = user.uid;

        // Executar todas as buscas em paralelo para otimização
        const [
            fetchedAllAppointments,
            professionalsList,
            customersList, // <-- NOVO: Busca de clientes
            completedDaily,
            completedWeekly,
            completedMonthly
        ] = await Promise.all([
            getAppointmentsBySalon(salonId),
            getProfessionalsBySalon(salonId),
            getCustomersBySalon(salonId), // <-- NOVO: Chamada da função
            getAppointmentsForReporting(salonId, 'daily'),
            getAppointmentsForReporting(salonId, 'weekly'),
            getAppointmentsForReporting(salonId, 'monthly')
        ]);

        // Processar dados
        const startOfToday = startOfDay(new Date()).getTime();
        const futureAppointments = fetchedAllAppointments.filter((appt: any) => appt.startTime.getTime() >= startOfToday);
        
        setUpcomingAppointments(futureAppointments.length);
        setRecentAppointments(fetchedAllAppointments.slice(0, 4)); // Pega os 4 mais recentes para a lista
        setTotalProfessionals(professionalsList.length);
        setTotalCustomers(customersList.length); // <-- NOVO: Atualiza o estado dos clientes

        const sumRevenue = (appointments: any[]) => appointments.reduce((sum, appt) => sum + (appt.price || 0), 0);
        setDailyRevenue(sumRevenue(completedDaily));
        setWeeklyRevenue(sumRevenue(completedWeekly));
        setMonthlyRevenue(sumRevenue(completedMonthly));

        setIsLoadingData(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading]);

  // Tela de Carregamento
  if (authLoading || isLoadingData) {
    return (
      <>
        <PageHeader
          title="Painel de Administração"
          description="Visão geral da atividade do seu salão."
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

      {/* GRID DE CARDS PRINCIPAIS */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Futuros</CardTitle>
            <CalendarDays className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">{upcomingAppointments}</div>
            <p className="text-xs text-muted-foreground">Próximos na agenda</p>
          </CardContent>
        </Card>

        {/* NOVO CARD: TOTAL DE CLIENTES */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Contact className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Clientes cadastrados na base</p>
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
            <CardTitle className="text-sm font-medium">Faturamento (Concluídos)</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">Dia: R$ {dailyRevenue.toFixed(2)}</div>
            <div className="text-lg font-bold">Semana: R$ {weeklyRevenue.toFixed(2)}</div>
            <div className="text-lg font-bold">Mês: R$ {monthlyRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* GRID DE AÇÕES RÁPIDAS E ATIVIDADE RECENTE */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* NOVO BOTÃO: GERENCIAR CLIENTES */}
            <Link href="/admin/customers">
              <Button variant="outline" className="w-full justify-start"><Contact className="mr-2 h-4 w-4" /> Gerenciar Clientes</Button>
            </Link>
            <Link href="/admin/professionals">
              <Button variant="outline" className="w-full justify-start"><Users className="mr-2 h-4 w-4" /> Gerenciar Profissionais</Button>
            </Link>
            <Link href="/admin/services">
              <Button variant="outline" className="w-full justify-start"><LayoutGrid className="mr-2 h-4 w-4" /> Gerenciar Serviços</Button>
            </Link>
            <Link href="/admin/slots">
              <Button variant="outline" className="w-full justify-start"><Clock className="mr-2 h-4 w-4" /> Definir Disponibilidade</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Atividade Recente</CardTitle>
            <CardDescription>Últimas reservas e atualizações de status.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recentAppointments.length > 0 ? (
                recentAppointments.map((appt: any) => (
                  <li key={appt.id} className="text-sm text-muted-foreground flex items-center gap-2">
                     <span className={`h-2 w-2 rounded-full ${
                        appt.status === 'scheduled' ? 'bg-blue-500' :
                        appt.status === 'completed' ? 'bg-green-500' :
                        appt.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-400'
                     }`}></span>
                    Reserva de <span className="font-medium text-foreground">{appt.clientName}</span> para {format(appt.startTime, "dd/MM 'às' HH:mm")}.
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">Nenhuma atividade recente.</li>
              )}
            </ul>
            <Link href="/admin/agendamentos" passHref>
              <Button variant="link" className="mt-2 px-0">Ver todos os agendamentos</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
