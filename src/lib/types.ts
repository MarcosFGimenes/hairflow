export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  salonId: string;
  createdAt: string; // ISO string or Firestore Timestamp converted to string
  tags?: string[]; // Optional array of tags for the customer
  lastVisit?: string; // ISO string for last visit date
}

export interface Salon {
  abacatepayApiKey: string;
  id: string; // Firestore document ID (adminUid)
  name: string;
  slug: string; // URL-friendly slug
  adminUid: string; // ID of the Firebase user who owns this salon
  contactNumber?: string; // For WhatsApp link
  address?: string;
  description?: string; // Salon description
  email?: string; // Contact email for the salon
  themeColors?: { [key: string]: string }; // Object for theme colors
  logoUrl?: string; // URL for the salon's logo
  coverImageUrl?: string; // URL for the cover image
  pixCity: string; // Pix city field used in createSalon
}

export interface Service {
  id: string; // Firestore document ID
  name: string;
  price: number;
  duration: number; // Duration in minutes
}

export interface WorkDay {
  isWorkDay: boolean; // Whether the professional works on this day
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "17:00"
}

export interface Professional {
  id: string;
  salonId: string;
  name: string;
  specialty?: string; // e.g., "Cutting", "Coloring"
  imageUrl?: string;
  workHours?: { [key: string]: WorkDay }; // Recurring availability by day of week
  dateOverrides?: any[]; // Specific date overrides
}

export interface TimeSlot {
  isBooked: boolean | undefined;
  startTime: string; // ISO string
  endTime: string; // ISO string
}

export interface Appointment {
  id: string;
  salonId: string;
  professionalId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  serviceName: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  notes?: string; // For admin or client requests
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus?: 'paid' | 'unpaid';
  price?: number;
  paymentMethod?: string;
  paymentTransactionId?: string;
}