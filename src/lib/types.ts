import { Key } from "readline";

// src/lib/types.ts
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  salonId: string;
  createdAt: string | any; // Use 'any' para Timestamp se não houver import
  tags?: string[]; // NEW: Optional array of tags for the customer
  lastVisit?: string | { seconds: number }; // Adicionado para controle de última visita
  // outros campos que você precise
}

export interface Salon {
  pixCity: string;
  id: string; // This will often be the adminUserId or a Firestore-generated ID
  name: string;
  slug: string; // For hairflow.com/appointments/[slug]
  adminId: string; // ID of the Firebase user who owns this salon
  contactNumber?: string; // For WhatsApp link
  address?: string;
  description?: string; // New field for salon description
  email?: string; // Contact email for the salon
  themeColors?: { [key: string]: string }; // NEW: Object for theme colors
  logoUrl?: string; // URL for the salon's logo
  coverImageUrl?: string; // URL for the cover image
  services?: Service[]; // NEW: Array of services offered by the salon
  pixKey?: string; // <-- ADICIONADO
  pixKeyType?: 'CPF' | 'CNPJ' | 'Email' | 'Telefone' | 'Aleatória'; // <-- ADICIONADO
}

export interface Service {
  id: string | number | null | undefined;
  name: string;
  price: number;
  duration: number; // Duration in minutes
}

export interface Professional {
  id: string;
  salonId: string;
  name: string;
  specialty?: string; // e.g., "Cutting", "Coloring"
  imageUrl?: string;
}

export interface TimeSlot {
  id: string;
  professionalId: string;
  salonId: string;
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
  // Could also store day explicitly if not deriving from startTime
}

export interface Appointment {
  id:string;
  salonId: string;
  professionalId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  serviceName: string;
  startTime: Date;
  endTime: Date;
  notes?: string; // For admin, or client requests
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus?: 'paid' | 'unpaid'; // Simplified credit/debit
  price?: number;
  paymentMethod: string; // <-- ADICIONADO
}

export interface UserProfile {
  id: string; // Firebase UID
  email: string | null;
  displayName: string | null;
  role: 'salon_admin' | 'client'; // Simplified roles
  salonId?: string; // If salon_admin, which salon they manage
}