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
import { ptBR } from 'date-fns/locale'; // Importa o locale ptBR
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
    return null; // Ou algum estado de carregamento/erro
  }

  // Formato de data em português
  const appointmentTime = format(new Date(appointmentDetails.startTime), "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  const service = appointmentDetails.serviceName;
  const professionalName = professionalDetails.name;
  const salonName = salonDetails.name;
  const salonContact = salonDetails.contactNumber ?? "";
  const clientName = appointmentDetails.clientName;

  // Mensagem de confirmação em português
  const confirmationMessage = 
`Olá ${salonName}! Esta é uma confirmação do agendamento de ${clientName}:
Serviço: ${service}
Com: ${professionalName}
Quando: ${appointmentTime}
Até breve! - Hairflow Booking`;

  const encodedMessage = encodeURIComponent(confirmationMessage);
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
          <AlertDialogTitle className="text-2xl font-headline text-center">Agendamento Confirmado!</AlertDialogTitle>
          <AlertDialogDescription className="text-center text-muted-foreground text-md">
            Seu agendamento para <span className="font-semibold text-foreground">{service}</span> com <span className="font-semibold text-foreground">{professionalName}</span> no <span className="font-semibold text-foreground">{salonName}</span> foi confirmado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="my-6 space-y-3 p-4 bg-muted/50 rounded-lg border">
            <p><strong className="font-medium text-foreground">Cliente:</strong> {clientName}</p>
            <p><strong className="font-medium text-foreground">Data & Horário:</strong> {appointmentTime}</p>
            <p><strong className="font-medium text-foreground">Serviço:</strong> {service}</p>
            <p><strong className="font-medium text-foreground">Profissional:</strong> {professionalName}</p>
            {salonDetails.address && <p><strong className="font-medium text-foreground">Local:</strong> {salonDetails.address}</p>}
        </div>

        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleCopyToClipboard} className="w-full sm:w-auto">
            {copied ? <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? "Copiado!" : "Copiar detalhes"}
          </Button>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
            <Button className="w-full bg-[#25D366] hover:bg-[#1DAE50] text-white">
              <Share2 className="mr-2 h-4 w-4" /> Compartilhar no WhatsApp
            </Button>
          </a>
          <AlertDialogAction onClick={() => onOpenChange(false)} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
            Concluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

