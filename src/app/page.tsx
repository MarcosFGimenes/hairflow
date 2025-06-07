
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
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-br from-background to-secondary">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl md:text-7xl font-bold font-headline mb-6 text-primary">
              Welcome to Hairflow
            </h1>
            <p className="text-lg md:text-xl text-foreground mb-10 max-w-2xl mx-auto">
              The seamless appointment scheduling solution for modern barbershops and salons. Elevate your business and delight your clients.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/appointments">
                <Button size="lg" variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  Book an Appointment
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="lg" variant="outline">
                  List Your Salon
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold font-headline text-center mb-12 text-foreground">Why Choose Hairflow?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 rounded-lg shadow-lg border border-border">
                <Scissors className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-headline font-semibold mb-2 text-foreground">Easy Slot Management</h3>
                <p className="text-muted-foreground">Admins can effortlessly define and manage available time slots for their services and professionals.</p>
              </div>
              <div className="text-center p-6 rounded-lg shadow-lg border border-border">
                <CalendarCheck className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-headline font-semibold mb-2 text-foreground">Simple Client Booking</h3>
                <p className="text-muted-foreground">Clients enjoy a smooth booking experience with custom salon URLs and clear availability.</p>
              </div>
              <div className="text-center p-6 rounded-lg shadow-lg border border-border">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-headline font-semibold mb-2 text-foreground">Professional Profiles</h3>
                <p className="text-muted-foreground">Showcase your talented team and allow clients to book with their preferred professional.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works Section */}
        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold font-headline text-center mb-12 text-primary">How It Works</h2>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <Image
                  src="https://placehold.co/600x400.png"
                  alt="Salon dashboard preview"
                  width={600}
                  height={400}
                  className="rounded-lg shadow-xl"
                  data-ai-hint="salon dashboard"
                />
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-headline font-semibold text-foreground">1. Salon Setup</h3>
                  <p className="text-muted-foreground">Salon owners register, set up their services, professionals, and working hours in minutes.</p>
                </div>
                <div>
                  <h3 className="text-2xl font-headline font-semibold text-foreground">2. Client Booking</h3>
                  <p className="text-muted-foreground">Clients visit your unique salon page, select a service, professional, and time slot that works for them.</p>
                </div>
                <div>
                  <h3 className="text-2xl font-headline font-semibold text-foreground">3. Instant Confirmations</h3>
                  <p className="text-muted-foreground">Both client and salon receive instant notifications. Clients can easily share their booking via WhatsApp.</p>
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
