"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Appointment, Salon, Professional } from "@/lib/types";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
        return null;
    }

    const appointmentTime = format(new Date(appointmentDetails.startTime), "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    const service = appointmentDetails.serviceName;
    const professionalName = professionalDetails.name;
    const salonName = salonDetails.name;
    const salonContact = salonDetails.contactNumber ?? "";
    const clientName = appointmentDetails.clientName;

    // A mensagem para copiar/compartilhar continua detalhada, como você queria.
    const confirmationMessage = 
`Comprovante de Agendamento Hairflow\n\nSalão: ${salonName}\nCliente: ${clientName}\nServiço: ${service}\nProfissional: ${professionalName}\nData: ${appointmentTime}\nPagamento: ${appointmentDetails.paymentMethod || '-'}\nValor: R$ ${(appointmentDetails.price ?? 0).toFixed(2)}\n\nAgradecemos por agendar conosco!`;

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
            <AlertDialogContent className="max-w-md p-0 overflow-hidden border-border shadow-2xl bg-card">
                <AlertDialogHeader className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30">
                            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <AlertDialogTitle className="text-2xl font-bold text-card-foreground">Agendamento Confirmado!</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                        Seu horário foi agendado com sucesso.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                
                {/* Corpo do Dialog com os detalhes (agora sem duplicação) */}
                <div className="px-6 pb-6 space-y-4">
                    <div className="p-4 space-y-3 rounded-lg bg-muted/50 border">
                        <DetailRow label="Serviço" value={service} />
                        <DetailRow label="Profissional" value={professionalName} />
                        <DetailRow label="Data & Horário" value={appointmentTime} />
                        {salonDetails.address && (
                            <DetailRow label="Local" value={salonDetails.address} />
                        )}
                        {appointmentDetails.paymentMethod && (
                            <DetailRow label="Pagamento" value={appointmentDetails.paymentMethod} />
                        )}
                        <div className="pt-2 mt-2 border-t border-border">
                            <DetailRow 
                                label="Valor" 
                                value={`R$ ${(appointmentDetails.price ?? 0).toFixed(2)}`} 
                                valueClassName="text-lg font-bold text-primary"
                            />
                        </div>
                    </div>
                    {/* O BLOCO REDUNDANTE "Comprovante visual" FOI REMOVIDO DAQUI */}
                </div>

                {/* Rodapé com os botões de ação */}
                <AlertDialogFooter className="flex-col-reverse gap-2 p-6 pt-0 sm:flex-row bg-muted/30">
                    <Button 
                        variant="outline" 
                        onClick={handleCopyToClipboard} 
                        className="w-full sm:w-auto"
                    >
                        {copied ? <CheckCircle className="w-4 h-4 mr-2 text-primary" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copied ? "Copiado!" : "Copiar texto"}
                    </Button>
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                        <Button className="w-full">
                            <Share2 className="w-4 h-4 mr-2" /> Compartilhar
                        </Button>
                    </a>
                    <AlertDialogAction 
                        onClick={() => onOpenChange(false)} 
                        className="w-full sm:w-auto"
                    >
                        Concluir
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// Componente auxiliar para padronizar as linhas de detalhe
const DetailRow = ({ label, value, valueClassName = "" }: { label: string, value: string, valueClassName?: string }) => (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <p className="text-sm font-medium text-muted-foreground">{label}:</p>
        <p className={`text-sm text-right text-card-foreground ${valueClassName}`}>{value}</p>
    </div>
);