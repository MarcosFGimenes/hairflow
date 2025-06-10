import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GlobalHeader } from '@/components/shared/GlobalHeader';
import { GlobalFooter } from '@/components/shared/GlobalFooter';
import Image from 'next/image';
import { Scissors, CalendarCheck, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <>
      <GlobalHeader />
      <main className="flex-grow">
        {/* Seção Hero */}
        <section className="py-20 md:py-32 bg-gradient-to-br from-background to-secondary">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl md:text-7xl font-bold font-headline mb-6 text-primary">
              Bem-vindo ao Hairflow
            </h1>
            <p className="text-lg md:text-xl text-foreground mb-10 max-w-2xl mx-auto">
              A solução de agendamento de horários perfeita para barbearias e salões modernos. Eleve seu negócio e encante seus clientes.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/agendar">
                <Button size="lg" variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  Agendar um Horário
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="lg" variant="outline">
                  Liste Seu Salão
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Seção de Recursos */}
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold font-headline text-center mb-12 text-foreground">Por Que Escolher o Hairflow?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 rounded-lg shadow-lg border border-border">
                <Scissors className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-headline font-semibold mb-2 text-foreground">Gerenciamento Fácil de Horários</h3>
                <p className="text-muted-foreground">Administradores podem definir e gerenciar facilmente os horários disponíveis para seus serviços e profissionais.</p>
              </div>
              <div className="text-center p-6 rounded-lg shadow-lg border border-border">
                <CalendarCheck className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-headline font-semibold mb-2 text-foreground">Agendamento Simples para Clientes</h3>
                <p className="text-muted-foreground">Os clientes desfrutam de uma experiência de agendamento tranquila com URLs de salão personalizadas e disponibilidade clara.</p>
              </div>
              <div className="text-center p-6 rounded-lg shadow-lg border border-border">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-headline font-semibold mb-2 text-foreground">Perfis Profissionais</h3>
                <p className="text-muted-foreground">Apresente sua equipe talentosa e permita que os clientes agendem com seu profissional preferido.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Seção Como Funciona */}
        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold font-headline text-center mb-12 text-primary">Como Funciona</h2>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <Image
                  src="https://placehold.co/600x400.png"
                  alt="Prévia do painel do salão"
                  width={600}
                  height={400}
                  className="rounded-lg shadow-xl"
                  data-ai-hint="painel do salão"
                />
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-headline font-semibold text-foreground">1. Configuração do Salão</h3>
                  <p className="text-muted-foreground">Proprietários de salões se cadastram, configuram seus serviços, profissionais e horários de funcionamento em minutos.</p>
                </div>
                <div>
                  <h3 className="text-2xl font-headline font-semibold text-foreground">2. Agendamento do Cliente</h3>
                  <p className="text-muted-foreground">Os clientes visitam a página exclusiva do seu salão, selecionam um serviço, profissional e horário que lhes convém.</p>
                </div>
                <div>
                  <h3 className="text-2xl font-headline font-semibold text-foreground">3. Confirmações Instantâneas</h3>
                  <p className="text-muted-foreground">Tanto o cliente quanto o salão recebem notificações instantâneas. Os clientes podem facilmente compartilhar sua reserva via WhatsApp.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <GlobalFooter />
    </>
  );
}