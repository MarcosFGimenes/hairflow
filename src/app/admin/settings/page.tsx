
"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Keep for non-form fields if any
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/shared/PageHeader';
import { useForm } from 'react-hook-form';
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
import { useAuth } from '@/contexts/AuthContext';
import { getSalonByAdmin, updateSalonSettings } from '@/lib/firestoreService';
import type { Salon } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from 'lucide-react';

const salonSettingsSchema = z.object({
  name: z.string().min(3, "Salon name must be at least 3 characters."),
  slug: z.string().min(3, "URL slug must be at least 3 characters.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
  contactNumber: z.string().min(10, "Contact number seems too short."),
  address: z.string().optional(),
  description: z.string().max(500, "Description is too long.").optional(),
  email: z.string().email("Invalid email address.").optional(),
});

type SalonSettingsFormValues = z.infer<typeof salonSettingsSchema>;

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true); // For loading salon data
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<SalonSettingsFormValues>({
    resolver: zodResolver(salonSettingsSchema),
    defaultValues: {
      name: "",
      slug: "",
      contactNumber: "",
      address: "",
      description: "",
      email: "",
    },
  });

  useEffect(() => {
    if (user) {
      const fetchSalonData = async () => {
        setIsLoading(true);
        const salonData = await getSalonByAdmin(user.uid);
        if (salonData) {
          form.reset({
            name: salonData.name || "",
            slug: salonData.slug || "",
            contactNumber: salonData.contactNumber || "",
            address: salonData.address || "",
            description: salonData.description || "",
            email: salonData.email || "",
          });
        } else {
          toast({ title: "Error", description: "Could not load salon data. It might not exist yet.", variant: "destructive" });
          // Potentially redirect or allow creation if salon not found for a logged in user,
          // but for settings, it should exist from signup.
        }
        setIsLoading(false);
      };
      fetchSalonData();
    } else if (!authLoading) {
        // If not authLoading and no user, means they are logged out, AuthContext handles redirect
        setIsLoading(false);
    }
  }, [user, authLoading, form, toast]);

  const onSubmit = async (data: SalonSettingsFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to save settings.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      // Omitting id and adminUserId as they are fixed or handled by the service function
      const { slug, ...updateData } = data; // Slug is derived from name in firestoreService if name changes
      await updateSalonSettings(user.uid, updateData);
      toast({ title: "Success", description: "Salon settings updated successfully!" });
      // Optionally re-fetch or update form.reset with potentially new slug if name changed
      const updatedSalon = await getSalonByAdmin(user.uid);
      if (updatedSalon) form.reset(updatedSalon);

    } catch (error) {
      console.error("Error updating salon settings:", error);
      toast({ title: "Error", description: "Failed to update salon settings.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading settings...</p>
      </div>
    );
  }

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
                name="name"
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
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom URL Slug</FormLabel>
                    <FormControl><Input placeholder="your-salon-name" {...field} disabled /></FormControl>
                    <FormDescription>
                      This will be part of your salon&apos;s booking URL: hairflow.com/appointments/{form.getValues().slug || "your-salon-name"}. 
                      It is automatically generated from your salon name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl><Input type="email" placeholder="contact@yoursalon.com" {...field} /></FormControl>
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
                    <FormDescription>Used for WhatsApp booking confirmations and client contact.</FormDescription>
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

          <div className="flex justify-end">
            <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
