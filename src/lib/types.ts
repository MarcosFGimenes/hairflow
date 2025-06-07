
export interface Salon {
  id: string; // This will often be the adminUserId or a Firestore-generated ID
  name: string;
  slug: string; // For hairflow.com/appointments/[slug]
  contactNumber: string; // For WhatsApp link
  address?: string;
  adminUserId: string; // ID of the Firebase user who owns this salon
  description?: string; // New field for salon description
  email?: string; // Contact email for the salon
  // openingHours: OpeningHours[]; // Define structure for opening hours
}

// export interface OpeningHours {
//   dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
//   isOpen: boolean;
//   openTime?: string; // e.g., "09:00"
//   closeTime?: string; // e.g., "17:00"
// }

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
}

export interface UserProfile {
  id: string; // Firebase UID
  email: string | null;
  displayName: string | null;
  role: 'salon_admin' | 'client'; // Simplified roles
  salonId?: string; // If salon_admin, which salon they manage
}
