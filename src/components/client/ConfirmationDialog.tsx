"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Appointment, Salon, Professional } from "@/lib/types";
import { format } from 'date-fns';
import { Share2, Copy, CheckCircle } from 'lucide-react';
import React from "react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentDetails: Appointment | null;
  salonDetails: Salon | null;
  professionalDetails: Professional | null;
}

export function ConfirmationDialog({ 
  isOpen, 
  onOpenChange, 
  appointmentDetails, 
  salonDetails, 
  professionalDetails 
}: ConfirmationDialogProps) {
  const [copied, setCopied] = React.useState(false);

  if (!appointmentDetails || !salonDetails || !professionalDetails) {
    return null; // Or some loading/error state
  }

  const appointmentTime = format(new Date(appointmentDetails.startTime), "eeee, MMMM do, yyyy 'at' h:mm a");
  const service = appointmentDetails.serviceName;
  const professionalName = professionalDetails.name;
  const salonName = salonDetails.name;
  const salonContact = salonDetails.contactNumber; // Make sure this is in E.164 format for WhatsApp, e.g., +15551234567
  const clientName = appointmentDetails.clientName;

  const confirmationMessage = 
`Hi ${salonName}! This is a confirmation for ${clientName}'s appointment:
Service: ${service}
With: ${professionalName}
When: ${appointmentTime}
See you soon! - Hairflow Booking`;

  const encodedMessage = encodeURIComponent(confirmationMessage);
  // Ensure salonContact is digits only for the wa.me link if it contains formatting
  const whatsappNumber = salonContact.replace(/\D/g, '');
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(confirmationMessage).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <AlertDialogTitle className="text-2xl font-headline text-center">Appointment Confirmed!</AlertDialogTitle>
          <AlertDialogDescription className="text-center text-muted-foreground text-md">
            Your booking for <span className="font-semibold text-foreground">{service}</span> with <span className="font-semibold text-foreground">{professionalName}</span> at <span className="font-semibold text-foreground">{salonName}</span> is confirmed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="my-6 space-y-3 p-4 bg-muted/50 rounded-lg border">
            <p><strong className="font-medium text-foreground">Client:</strong> {clientName}</p>
            <p><strong className="font-medium text-foreground">Date & Time:</strong> {appointmentTime}</p>
            <p><strong className="font-medium text-foreground">Service:</strong> {service}</p>
            <p><strong className="font-medium text-foreground">Professional:</strong> {professionalName}</p>
            {salonDetails.address && <p><strong className="font-medium text-foreground">Location:</strong> {salonDetails.address}</p>}
        </div>

        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleCopyToClipboard} className="w-full sm:w-auto">
            {copied ? <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? "Copied!" : "Copy Details"}
          </Button>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
            <Button className="w-full bg-[#25D366] hover:bg-[#1DAE50] text-white">
              <Share2 className="mr-2 h-4 w-4" /> Share on WhatsApp
            </Button>
          </a>
          <AlertDialogAction onClick={() => onOpenChange(false)} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
            Done
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

