"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { PageHeader } from '@/components/shared/PageHeader';
import { placeholderProfessionals } from '@/lib/placeholder-data';
import { CalendarIcon, Clock, User, Phone, Briefcase, DollarSign, Save } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Dummy services for selection
const services = [
  { name: "Men's Haircut", price: 30, duration: 45 }, // duration in minutes
  { name: "Women's Haircut", price: 50, duration: 60 },
  { name: "Beard Trim", price: 15, duration: 20 },
  { name: "Hair Coloring", price: 80, duration: 120 },
  { name: "Kids Cut", price: 20, duration: 30 },
];


export default function NewAppointmentPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("09:00");
  const [selectedProfessional, setSelectedProfessional] = useState<string | undefined>();
  const [selectedService, setSelectedService] = useState<string | undefined>();
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState<number | string>("");

  const handleServiceChange = (serviceName: string) => {
    const service = services.find(s => s.name === serviceName);
    setSelectedService(serviceName);
    if (service) {
      setPrice(service.price);
    } else {
      setPrice("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!selectedDate || !selectedTime || !selectedProfessional || !selectedService || !clientName || !clientPhone) {
      alert("Please fill in all required fields.");
      return;
    }
    const appointmentData = {
      date: selectedDate,
      time: selectedTime,
      professionalId: selectedProfessional,
      serviceName: selectedService,
      clientName,
      clientPhone,
      notes,
      price: Number(price) || undefined,
    };
    console.log("New appointment data:", appointmentData);
    alert("New appointment created successfully (This is a demo).");
    // TODO: Implement actual save logic and redirect
    // router.push('/admin/appointments');
  };

  return (
    <>
      <PageHeader 
        title="Create New Appointment"
        description="Manually add a new booking to the schedule."
      />
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Appointment Details</CardTitle>
          <CardDescription>Fill in the form below to schedule a new appointment.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date */}
              <div>
                <Label htmlFor="appointment-date" className="flex items-center mb-1">
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" /> Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time */}
              <div>
                <Label htmlFor="appointment-time" className="flex items-center mb-1">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" /> Time
                </Label>
                <Input 
                  id="appointment-time" 
                  type="time" 
                  value={selectedTime} 
                  onChange={(e) => setSelectedTime(e.target.value)} 
                />
              </div>

              {/* Professional */}
              <div>
                <Label htmlFor="professional" className="flex items-center mb-1">
                  <User className="mr-2 h-4 w-4 text-muted-foreground" /> Professional
                </Label>
                <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                  <SelectTrigger id="professional">
                    <SelectValue placeholder="Select professional" />
                  </SelectTrigger>
                  <SelectContent>
                    {placeholderProfessionals.map(prof => (
                      <SelectItem key={prof.id} value={prof.id}>{prof.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Service */}
              <div>
                <Label htmlFor="service" className="flex items-center mb-1">
                  <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" /> Service
                </Label>
                <Select value={selectedService} onValueChange={handleServiceChange}>
                  <SelectTrigger id="service">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="border-t pt-6 space-y-6">
              <h3 className="text-lg font-semibold font-headline">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="client-name" className="flex items-center mb-1">
                    <User className="mr-2 h-4 w-4 text-muted-foreground" /> Client Name
                  </Label>
                  <Input id="client-name" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Full Name" />
                </div>
                <div>
                  <Label htmlFor="client-phone" className="flex items-center mb-1">
                    <Phone className="mr-2 h-4 w-4 text-muted-foreground" /> Client Phone
                  </Label>
                  <Input id="client-phone" type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="(555) 123-4567" />
                </div>
              </div>
            </div>

            <div className="border-t pt-6 space-y-6">
              <h3 className="text-lg font-semibold font-headline">Additional Details</h3>
              <div>
                <Label htmlFor="appointment-price" className="flex items-center mb-1">
                  <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" /> Price ($)
                </Label>
                <Input 
                  id="appointment-price" 
                  type="number" 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)} 
                  placeholder="e.g., 30.00" 
                  step="0.01" 
                />
              </div>
              <div>
                <Label htmlFor="notes" className="flex items-center mb-1">Notes (Optional)</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any specific requests or details..." rows={3} />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Link href="/admin/appointments" passHref legacyBehavior>
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                <Save className="mr-2 h-4 w-4" /> Create Appointment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

