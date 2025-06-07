"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/shared/PageHeader';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { placeholderSalons } from '@/lib/placeholder-data'; // For pre-filling form
import { Save } from 'lucide-react';

const salonSettingsSchema = z.object({
  salonName: z.string().min(3, "Salon name must be at least 3 characters."),
  salonSlug: z.string().min(3, "URL slug must be at least 3 characters.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
  contactNumber: z.string().min(10, "Contact number seems too short."),
  address: z.string().optional(),
  description: z.string().max(500, "Description is too long.").optional(),
});

type SalonSettingsFormValues = z.infer<typeof salonSettingsSchema>;

// Assuming salon1 is the current salon for the admin
const currentSalonData = placeholderSalons[0];

export default function SettingsPage() {
  const form = useForm<SalonSettingsFormValues>({
    resolver: zodResolver(salonSettingsSchema),
    defaultValues: {
      salonName: currentSalonData.name || "",
      salonSlug: currentSalonData.slug || "",
      contactNumber: currentSalonData.contactNumber || "",
      address: currentSalonData.address || "",
      description: "", // Add a placeholder description field
    },
  });

  const onSubmit = (data: SalonSettingsFormValues) => {
    console.log("Salon settings updated:", data);
    // TODO: Implement actual save logic
    alert("Settings saved successfully! (This is a demo)");
  };

  return (
    <>
      <PageHeader 
        title="Salon Settings"
        description="Manage your salon's public information and operational settings."
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline">Basic Information</CardTitle>
              <CardDescription>This information will be displayed on your salon's public booking page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="salonName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salon Name</FormLabel>
                    <FormControl><Input placeholder="Your Salon's Name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salonSlug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom URL Slug</FormLabel>
                    <FormControl><Input placeholder="your-salon-name" {...field} /></FormControl>
                    <FormDescription>
                      This will be part of your salon&apos;s booking URL: hairflow.com/appointments/{form.getValues().salonSlug || "your-salon-name"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone Number</FormLabel>
                    <FormControl><Input type="tel" placeholder="+1 (555) 123-4567" {...field} /></FormControl>
                    <FormDescription>Used for WhatsApp booking confirmations.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salon Address</FormLabel>
                    <FormControl><Input placeholder="123 Main St, Anytown, USA" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salon Description (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="Tell clients a bit about your salon..." {...field} rows={4} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Add more setting sections here if needed, e.g., Payment Settings, Notification Preferences */}

          <div className="flex justify-end">
            <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90">
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
