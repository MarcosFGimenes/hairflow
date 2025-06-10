import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CalendarDays, Clock, Users, DollarSign, PlusCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';

// Mock data
const stats = {
  upcomingAppointments: 5,
  availableSlotsToday: 12,
  totalProfessionals: 3,
  monthlyRevenue: 1250.75, // Exemplo
};

export default function AdminDashboardPage() {
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
            <div className="text-3xl font-bold font-headline">{stats.upcomingAppointments}</div>
            <p className="text-xs text-muted-foreground">Próximos 7 dias</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horários Disponíveis Hoje</CardTitle>
            <Clock className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">{stats.availableSlotsToday}</div>
            <p className="text-xs text-muted-foreground">Em todos os profissionais</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Profissionais</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">{stats.totalProfessionals}</div>
            <p className="text-xs text-muted-foreground">Membros da equipe ativos</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Mensal (Est.)</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">R$ {stats.monthlyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Projeção do mês atual</p>
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