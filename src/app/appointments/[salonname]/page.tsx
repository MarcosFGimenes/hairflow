"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { getProfessionalsBySalon } from '@/lib/firestoreService';
import { useParams, useRouter } from 'next/navigation';
import { GlobalHeader } from '@/components/shared/GlobalHeader';
import { GlobalFooter } from '@/components/shared/GlobalFooter';
import { BookingCalendar } from '@/components/client/BookingCalendar';
import { SlotPicker } from '@/components/client/SlotPicker';
import { ConfirmationDialog } from '@/components/client/ConfirmationDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getSalonBySlug } from '@/lib/firestoreService';
import { placeholderProfessionals, placeholderTimeSlots, placeholderAppointments } from '@/lib/placeholder-data';
import type { Salon, Professional, TimeSlot, Appointment } from '@/lib/types';
import { User, Phone, Briefcase, Calendar as CalendarIconLucide, Clock, CheckCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";

const steps = [
  { id: 1, name: "Select Date & Professional" },
  { id: 2, name: "Choose Time Slot" },
  { id: 3, name: "Your Details" },
  { id: 4, name: "Confirmation" }
];

export default function SalonAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const salonSlug = params.salonname as string;

  const [currentStep, setCurrentStep] = useState(1);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [isLoadingSalon, setIsLoadingSalon] = useState(true);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | undefined>();
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  
  const [selectedService, setSelectedService] = useState<string>("Standard Haircut"); 
  const services = ["Standard Haircut", "Beard Trim", "Hair Wash & Style", "Kids Cut"];

  const currentProfessional = useMemo(() => professionals.find(p => p.id === selectedProfessionalId), [professionals, selectedProfessionalId]);

  useEffect(() => {
    if (salonSlug) {
      const fetchSalonAndProfessionals = async () => {
        setIsLoadingSalon(true);
        const fetchedSalon = await getSalonBySlug(salonSlug);
        if (fetchedSalon) {
          setSalon(fetchedSalon);

          // Busca os profissionais do Firestore em vez de usar os dados de exemplo
          const salonProfessionals = await getProfessionalsBySalon(fetchedSalon.id);
          setProfessionals(salonProfessionals);

          if (salonProfessionals.length > 0) {
            setSelectedProfessionalId(salonProfessionals[0].id);
          }
        } else {
          toast({ title: "Salon Not Found", description: "This salon does not exist or the URL is incorrect.", variant: "destructive"});
        }
        setIsLoadingSalon(false);
      };
      fetchSalonAndProfessionals();
    }
  }, [salonSlug, router, toast]);

  useEffect(() => {
    if (selectedDate && selectedProfessionalId && salon) {
      setIsLoadingSlots(true);
      setTimeout(() => {
        const slotsForDayAndProf = placeholderTimeSlots.filter(slot =>
          slot.salonId === salon.id &&
          slot.professionalId === selectedProfessionalId &&
          new Date(slot.startTime).toDateString() === selectedDate.toDateString() &&
          !slot.isBooked 
        );
        setAvailableSlots(slotsForDayAndProf);
        setIsLoadingSlots(false);
      }, 500);
    } else {
      setAvailableSlots([]);
    }
    setSelectedSlot(null);
  }, [selectedDate, selectedProfessionalId, salon]);

  const handleNextStep = () => {
    if (currentStep === 1 && (!selectedDate || !selectedProfessionalId)) {
        alert("Please select a date and professional."); return;
    }
    if (currentStep === 2 && !selectedSlot) {
        alert("Please select a time slot."); return;
    }
    if (currentStep === 3 && (!clientName || !clientPhone)) {
        alert("Please enter your name and phone number."); return;
    }
    if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
    }
  };
  const handlePrevStep = () => { if (currentStep > 1) setCurrentStep(currentStep -1);};

  const handleSubmitBooking = () => {
    if (!salon || !selectedProfessionalId || !selectedSlot || !clientName || !clientPhone || !selectedService || !currentProfessional) return;

    const newAppointment: Appointment = {
      id: `appt-${Date.now()}`,
      salonId: salon.id,
      professionalId: selectedProfessionalId,
      clientName,
      clientPhone,
      serviceName: selectedService,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      status: 'scheduled',
    };
    setConfirmedAppointment(newAppointment);
    setIsConfirming(true);
    setCurrentStep(4); 
    console.log("Booking submitted (visual only):", newAppointment);
    toast({ title: "Booking Submitted (Demo)", description: "Your appointment request has been sent."});
  };

  if (isLoadingSalon) {
    return (
      <>
        <GlobalHeader />
        <main className="container mx-auto px-4 py-8 flex-grow text-center flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading salon details...</p>
        </main>
        <GlobalFooter />
      </>
    );
  }

  if (!salon) {
    return (
      <>
        <GlobalHeader />
        <main className="container mx-auto px-4 py-8 flex-grow text-center">
          <h1 className="text-3xl font-bold font-headline mb-4">Salon Not Found</h1>
          <p className="text-muted-foreground">The salon you are looking for does not exist or the URL is incorrect.</p>
          <Button onClick={() => router.push('/')} className="mt-6">Go to Homepage</Button>
        </main>
        <GlobalFooter />
      </>
    );
  }

  return (
    <>
      <GlobalHeader />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Card className="max-w-4xl mx-auto shadow-2xl overflow-hidden">
          <div className="relative h-48 md:h-64 bg-secondary">
            <Image src={`https://placehold.co/1200x400.png`} alt={`${salon.name} storefront`} layout="fill" objectFit="cover" data-ai-hint="salon storefront"/>
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-4 text-center">
              <h1 className="text-3xl md:text-5xl font-bold font-headline text-white mb-2">{salon.name}</h1>
              {salon.address && <p className="text-lg text-gray-200">{salon.address}</p>}
              {salon.description && <p className="text-sm text-gray-300 mt-2 max-w-xl">{salon.description}</p>}
            </div>
          </div>

          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-2">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div className={`flex flex-col items-center ${currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold ${currentStep >= step.id ? 'bg-primary text-primary-foreground border-primary' : 'border-muted-foreground'}`}>
                      {currentStep > step.id ? <CheckCircle size={18} /> : step.id}
                    </div>
                    <p className={`text-xs mt-1 text-center hidden sm:block ${currentStep >= step.id ? 'font-semibold' : ''}`}>{step.name}</p>
                  </div>
                  {index < steps.length - 1 && <div className={`flex-1 h-1 mx-2 ${currentStep > step.id ? 'bg-primary' : 'bg-muted'}`}></div>}
                </React.Fragment>
              ))}
            </div>
          </div>
          
          <CardContent className="p-6 md:p-8">
            {currentStep === 1 && (
              <div className="space-y-8">
                <BookingCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
                <div>
                  <Label htmlFor="professional" className="text-lg font-semibold mb-2 block text-center">Select Professional</Label>
                  {professionals.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {professionals.map(prof => (
                        <Card 
                          key={prof.id} 
                          onClick={() => setSelectedProfessionalId(prof.id)}
                          className={`p-4 cursor-pointer hover:shadow-lg transition-shadow border-2 ${selectedProfessionalId === prof.id ? 'border-primary ring-2 ring-primary' : 'border-border'}`}
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={prof.imageUrl || `https://placehold.co/100x100.png`} alt={prof.name} data-ai-hint="person beauty" />
                              <AvatarFallback>{prof.name.substring(0,1)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-lg">{prof.name}</h3>
                              <p className="text-sm text-muted-foreground">{prof.specialty}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">No professionals available for this salon yet. (Placeholder)</p>
                  )}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                 {selectedDate && currentProfessional && (
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="font-semibold">Showing slots for <span className="text-primary">{format(selectedDate, 'MMMM d, yyyy')}</span> with <span className="text-primary">{currentProfessional.name}</span></p>
                  </div>
                )}
                <SlotPicker 
                  availableSlots={availableSlots} 
                  selectedSlot={selectedSlot} 
                  onSlotSelect={setSelectedSlot} 
                  isLoading={isLoadingSlots}
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 max-w-md mx-auto">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="font-headline text-2xl text-center">Your Details</CardTitle>
                  <CardDescription className="text-center">Please provide your name and phone number.</CardDescription>
                </CardHeader>
                <div>
                  <Label htmlFor="service" className="font-medium">Service</Label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger id="service">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="clientName" className="font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input id="clientName" type="text" placeholder="e.g., John Doe" value={clientName} onChange={(e) => setClientName(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="clientPhone" className="font-medium">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input id="clientPhone" type="tel" placeholder="e.g., (555) 123-4567" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="pl-10" />
                  </div>
                </div>
                 <div className="p-4 bg-muted rounded-lg space-y-1">
                    <p className="font-semibold text-sm">Booking Summary:</p>
                    {selectedDate && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><CalendarIconLucide size={14}/> {format(selectedDate, 'MMMM d, yyyy')}</p>}
                    {selectedSlot && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock size={14}/> {format(new Date(selectedSlot.startTime), 'p')}</p>}
                    {currentProfessional && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><User size={14}/> {currentProfessional.name}</p>}
                    {selectedService && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Briefcase size={14}/> {selectedService}</p>}
                </div>
              </div>
            )}
            
            {currentStep === 4 && confirmedAppointment && salon && currentProfessional && (
               <div className="text-center py-10">
                 <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                 <h2 className="text-3xl font-bold font-headline text-primary">Booking Submitted! (Demo)</h2>
                 <p className="text-muted-foreground mt-2">Your appointment request is sent. You will receive confirmation once approved.</p>
                 <p className="mt-1 text-sm text-muted-foreground">
                   Check the confirmation pop-up for WhatsApp sharing options (if applicable).
                 </p>
                 <Button onClick={() => router.push('/')} className="mt-8">Back to Homepage</Button>
               </div>
            )}

            {currentStep < 4 && (
                <div className="mt-10 flex justify-between items-center">
                    <Button variant="outline" onClick={handlePrevStep} disabled={currentStep === 1}>
                    <ChevronLeft className="mr-2 h-4 w-4"/> Previous
                    </Button>
                    {currentStep < 3 && <Button onClick={handleNextStep} className="bg-primary hover:bg-primary/90">Next <ChevronRight className="ml-2 h-4 w-4"/></Button>}
                    {currentStep === 3 && <Button onClick={handleSubmitBooking} className="bg-accent hover:bg-accent/90">Confirm Booking</Button>}
                </div>
            )}
          </CardContent>
        </Card>
      </main>
      <GlobalFooter />
      {isConfirming && confirmedAppointment && salon && currentProfessional && (
        <ConfirmationDialog
          isOpen={isConfirming}
          onOpenChange={setIsConfirming}
          appointmentDetails={confirmedAppointment}
          salonDetails={salon}
          professionalDetails={currentProfessional}
        />
      )}
    </>
  );
}