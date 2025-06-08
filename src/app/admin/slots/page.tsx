"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PageHeader } from '@/components/shared/PageHeader';
import { getProfessionalsBySalon } from '@/lib/firestoreService'; // Importando do Firestore
import type { Professional } from '@/lib/types';
import { CalendarIcon, Clock, PlusCircle, Trash2, Loader2, Users } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation'; // Hooks para gerenciar URL params

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ManageSlotsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [salonProfessionals, setSalonProfessionals] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  // O estado para disponibilidade e overrides permanece o mesmo por enquanto
  const [recurringAvailability, setRecurringAvailability] = useState(
    daysOfWeek.reduce((acc, day) => ({ ...acc, [day]: { isOpen: false, startTime: '09:00', endTime: '17:00' } }), {})
  );
  const [specificOverrides, setSpecificOverrides] = useState<{ date: Date | undefined, startTime: string, endTime: string, type: 'available' | 'unavailable' }[]>([]);
  const [overrideDate, setOverrideDate] = useState<Date | undefined>();
  const [overrideStartTime, setOverrideStartTime] = useState('09:00');
  const [overrideEndTime, setOverrideEndTime] = useState('17:00');
  const [overrideType, setOverrideType] = useState<'available' | 'unavailable'>('available');

  // Efeito para buscar profissionais e definir o padrão
  useEffect(() => {
    const fetchAndSetData = async () => {
      if (user) {
        setIsLoading(true);
        const fetchedProfessionals = await getProfessionalsBySalon(user.uid);
        setSalonProfessionals(fetchedProfessionals);

        // Verifica se há um profissional na URL, senão define o primeiro da lista como padrão
        const professionalFromUrl = searchParams.get('professional');
        if (professionalFromUrl && fetchedProfessionals.some(p => p.id === professionalFromUrl)) {
          setSelectedProfessional(professionalFromUrl);
        } else if (fetchedProfessionals.length > 0) {
          setSelectedProfessional(fetchedProfessionals[0].id);
        }
        
        setIsLoading(false);
      } else {
        setSalonProfessionals([]);
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchAndSetData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]); // A dependência de searchParams é intencionalmente omitida para evitar re-fetches

  // Função para atualizar a URL quando o profissional for alterado
  const handleProfessionalChange = (professionalId: string) => {
    setSelectedProfessional(professionalId);
    router.push(`/admin/slots?professional=${professionalId}`);
  };

  const handleAddOverride = () => {
    if (overrideDate) {
      setSpecificOverrides([...specificOverrides, { date: overrideDate, startTime: overrideStartTime, endTime: overrideEndTime, type: overrideType }]);
      setOverrideDate(undefined); // Reset after adding
    }
  };
  
  const handleRemoveOverride = (index: number) => {
    setSpecificOverrides(specificOverrides.filter((_, i) => i !== index));
  };

  if (authLoading || isLoading) {
    return (
      <>
        <PageHeader 
          title="Manage Availability"
          description="Set working hours for your professionals and manage specific date availabilities."
        />
        <div className="flex min-h-[calc(100vh-300px)] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Loading availability settings...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title="Manage Availability"
        description="Set working hours for your professionals and manage specific date availabilities."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Professional Selection */}
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Select Professional</CardTitle>
          </CardHeader>
          <CardContent>
            {salonProfessionals.length > 0 ? (
              <Select value={selectedProfessional} onValueChange={handleProfessionalChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a professional" />
                </SelectTrigger>
                <SelectContent>
                  {salonProfessionals.map(prof => (
                    <SelectItem key={prof.id} value={prof.id}>{prof.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">No professionals found for your salon. Please add professionals first.</p>
            )}
            {selectedProfessional && salonProfessionals.length > 0 && (
                 <p className="mt-2 text-sm text-muted-foreground">Managing availability for {salonProfessionals.find(p => p.id === selectedProfessional)?.name}.</p>
            )}
          </CardContent>
        </Card>

        {/* Recurring Availability (Only if a professional is selected and available) */}
        {selectedProfessional && salonProfessionals.length > 0 ? (
          <>
            <Card className="lg:col-span-2 shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline">Recurring Weekly Availability</CardTitle>
                <CardDescription>Set the standard working hours for each day of the week for the selected professional.</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {daysOfWeek.map(day => (
                    <AccordionItem value={day} key={day}>
                      <AccordionTrigger className="font-semibold">{day}</AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id={`isOpen-${day}`} 
                          />
                          <Label htmlFor={`isOpen-${day}`}>Open on {day}</Label>
                        </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`startTime-${day}`}>Start Time</Label>
                              <Input 
                                type="time" 
                                id={`startTime-${day}`} 
                              />
                            </div>
                            <div>
                              <Label htmlFor={`endTime-${day}`}>End Time</Label>
                              <Input 
                                type="time" 
                                id={`endTime-${day}`} 
                              />
                            </div>
                          </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                <Button className="mt-6 w-full bg-primary hover:bg-primary/90">Save Recurring Availability</Button>
              </CardContent>
            </Card>

            {/* Specific Date Overrides */}
            <Card className="lg:col-span-3 shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline">Specific Date Overrides</CardTitle>
                <CardDescription>Add or block specific dates and times for the selected professional, overriding recurring settings.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6 p-4 border rounded-md">
                  <h4 className="font-semibold text-md">Add New Override</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                      <Label htmlFor="override-date">Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !overrideDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {overrideDate ? format(overrideDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={overrideDate}
                            onSelect={setOverrideDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="override-type">Type</Label>
                      <Select value={overrideType} onValueChange={(value) => setOverrideType(value as 'available' | 'unavailable')}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="unavailable">Unavailable (Block Out)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {overrideType === 'available' && (
                      <>
                        <div>
                          <Label htmlFor="override-startTime">Start Time</Label>
                          <Input type="time" id="override-startTime" value={overrideStartTime} onChange={e => setOverrideStartTime(e.target.value)} />
                        </div>
                        <div>
                          <Label htmlFor="override-endTime">End Time</Label>
                          <Input type="time" id="override-endTime" value={overrideEndTime} onChange={e => setOverrideEndTime(e.target.value)} />
                        </div>
                      </>
                    )}
                    <Button onClick={handleAddOverride} disabled={!overrideDate} className="lg:mt-auto bg-accent hover:bg-accent/90">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Override
                    </Button>
                  </div>
                </div>

                {specificOverrides.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-md mb-2">Current Overrides:</h4>
                    <ul className="space-y-2">
                      {specificOverrides.map((override, index) => (
                        <li key={index} className="flex justify-between items-center p-3 border rounded-md bg-muted/50">
                          <div>
                            <span className="font-medium">{format(override.date!, "PPP")}</span> -
                            <span className={`ml-1 ${override.type === 'available' ? 'text-green-600' : 'text-red-600'}`}>
                              {override.type === 'available' ? `Available ${override.startTime} - ${override.endTime}` : 'Blocked Out'}
                            </span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveOverride(index)} className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {specificOverrides.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No specific overrides added yet for this professional.</p>
                )}
                <Button className="mt-6 w-full bg-primary hover:bg-primary/90">Save All Overrides</Button>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="lg:col-span-2 shadow-lg">
             <CardHeader>
                <CardTitle className="font-headline">Manage Availability</CardTitle>
             </CardHeader>
            <CardContent className="text-center py-10">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {salonProfessionals.length === 0 
                  ? "Please add professionals to your salon first to manage their availability."
                  : "Select a professional to manage their recurring availability and specific date overrides."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}