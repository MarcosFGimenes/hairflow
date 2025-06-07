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
import { placeholderProfessionals } from '@/lib/placeholder-data';
import { CalendarIcon, Clock, PlusCircle, Trash2 } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ManageSlotsPage() {
  const [selectedProfessional, setSelectedProfessional] = React.useState<string | undefined>(placeholderProfessionals[0]?.id);
  const [recurringAvailability, setRecurringAvailability] = React.useState(
    daysOfWeek.reduce((acc, day) => ({ ...acc, [day]: { isOpen: false, startTime: '09:00', endTime: '17:00' } }), {})
  );
  const [specificOverrides, setSpecificOverrides] = React.useState<{ date: Date | undefined, startTime: string, endTime: string, type: 'available' | 'unavailable' }[]>([]);
  const [overrideDate, setOverrideDate] = React.useState<Date | undefined>();
  const [overrideStartTime, setOverrideStartTime] = React.useState('09:00');
  const [overrideEndTime, setOverrideEndTime] = React.useState('17:00');
  const [overrideType, setOverrideType] = React.useState<'available' | 'unavailable'>('available');


  const handleAddOverride = () => {
    if (overrideDate) {
      setSpecificOverrides([...specificOverrides, { date: overrideDate, startTime: overrideStartTime, endTime: overrideEndTime, type: overrideType }]);
      setOverrideDate(undefined); // Reset after adding
    }
  };
  
  const handleRemoveOverride = (index: number) => {
    setSpecificOverrides(specificOverrides.filter((_, i) => i !== index));
  };

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
            <CardTitle className="font-headline">Select Professional</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
              <SelectTrigger>
                <SelectValue placeholder="Select a professional" />
              </SelectTrigger>
              <SelectContent>
                {placeholderProfessionals.map(prof => (
                  <SelectItem key={prof.id} value={prof.id}>{prof.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProfessional && <p className="mt-2 text-sm text-muted-foreground">Managing availability for {placeholderProfessionals.find(p => p.id === selectedProfessional)?.name}.</p>}
          </CardContent>
        </Card>

        {/* Recurring Availability */}
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Recurring Weekly Availability</CardTitle>
            <CardDescription>Set the standard working hours for each day of the week.</CardDescription>
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
                        // checked={recurringAvailability[day].isOpen} 
                        // onCheckedChange={(checked) => handleRecurringChange(day, 'isOpen', checked)}
                      />
                      <Label htmlFor={`isOpen-${day}`}>Open on {day}</Label>
                    </div>
                    {/* {recurringAvailability[day].isOpen && ( */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`startTime-${day}`}>Start Time</Label>
                          <Input 
                            type="time" 
                            id={`startTime-${day}`} 
                            // value={recurringAvailability[day].startTime} 
                            // onChange={(e) => handleRecurringChange(day, 'startTime', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`endTime-${day}`}>End Time</Label>
                          <Input 
                            type="time" 
                            id={`endTime-${day}`} 
                            // value={recurringAvailability[day].endTime}
                            // onChange={(e) => handleRecurringChange(day, 'endTime', e.target.value)}
                          />
                        </div>
                      </div>
                    {/* )} */}
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
            <CardDescription>Add or block specific dates and times, overriding recurring settings.</CardDescription>
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
                <p className="text-muted-foreground text-center py-4">No specific overrides added yet.</p>
             )}
            <Button className="mt-6 w-full bg-primary hover:bg-primary/90">Save All Overrides</Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
