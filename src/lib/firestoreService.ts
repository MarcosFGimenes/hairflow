// src/lib/firestoreService.ts
import { db } from '@/lib/firebase';
import { 
  doc, setDoc, getDoc, updateDoc, collection, query, where, 
  getDocs, limit, addDoc, orderBy, deleteDoc, serverTimestamp 
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from "firebase/functions";
import { getDay, format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import type { Appointment, TimeSlot, Salon, Professional, Service, Customer } from '@/lib/types';

// Function to create a URL-friendly slug
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

// Creates a new salon document in Firestore
export const createSalon = async (
  adminUserId: string,
  salonName: string,
  email: string,
  contactNumber: string,
  address?: string,
  description?: string
): Promise<string> => {
  const salonSlug = generateSlug(salonName);
  const salonRef = doc(db, 'salons', adminUserId);
  const newSalon: Salon = {
    id: adminUserId,

    name: salonName,
    slug: salonSlug,
    email,
    contactNumber,
    address: address || "",
    description: description || "",
    services: [],
    adminId: '',
    pixCity: ''
  };
  await setDoc(salonRef, newSalon);
  return salonSlug;
};

// Fetches salon data for a given admin user ID
export const getSalonByAdmin = async (adminUserId: string): Promise<Salon | null> => {
  if (!adminUserId) return null;
  const salonRef = doc(db, 'salons', adminUserId);
  const salonSnap = await getDoc(salonRef);
  return salonSnap.exists() ? salonSnap.data() as Salon : null;
};

// Updates salon settings
export const updateSalonSettings = async (
  adminUserId: string,
  data: Partial<Omit<Salon, 'id' | 'adminUserId'>>
): Promise<void> => {
  const salonRef = doc(db, 'salons', adminUserId);
  const currentSalonSnap = await getDoc(salonRef);
  
  if (!currentSalonSnap.exists()) {
    throw new Error("Salon not found for update.");
  }

  const updateData = { ...data };
  if (data.name && data.name !== (currentSalonSnap.data() as Salon).name) {
    updateData.slug = generateSlug(data.name);
  }
  
  await updateDoc(salonRef, updateData);
};

// Adds or updates services for a salon
export const saveSalonServices = async (salonId: string, services: Service[]): Promise<void> => {
  const salonRef = doc(db, 'salons', salonId);
  await updateDoc(salonRef, { services });
};

// Gets services for a salon
export const getSalonServices = async (salonId: string): Promise<Service[]> => {
  const salonRef = doc(db, 'salons', salonId);
  const salonSnap = await getDoc(salonRef);
  return salonSnap.exists() ? (salonSnap.data().services || []) as Service[] : [];
};

// Fetches salon data by its slug
export const getSalonBySlug = async (slug: string): Promise<Salon | null> => {
  if (!slug) return null;
  const q = query(collection(db, 'salons'), where('slug', '==', slug), limit(1));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Salon;
};

// Creates a new professional
export const createProfessional = async (
  salonId: string,
  professionalData: Omit<Professional, 'id' | 'salonId'>
): Promise<string> => {
  const docRef = await addDoc(collection(db, 'professionals'), {
    ...professionalData,
    salonId,
  });
  return docRef.id;
};

// Fetches professionals for a salon
export const getProfessionalsBySalon = async (salonId: string): Promise<Professional[]> => {
  if (!salonId) return [];
  const q = query(collection(db, 'professionals'), where('salonId', '==', salonId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Professional));
};

// Saves recurring availability for a professional
export const saveRecurringAvailability = async (
  professionalId: string,
  availability: any
): Promise<void> => {
  await updateDoc(doc(db, 'professionals', professionalId), {
    recurringAvailability: availability,
  });
};

// Saves date overrides for a professional
export const saveDateOverrides = async (
  professionalId: string,
  overrides: any[]
): Promise<void> => {
  await updateDoc(doc(db, 'professionals', professionalId), {
    dateOverrides: overrides,
  });
};

// Gets professional availability
export const getProfessionalAvailability = async (professionalId: string) => {
  if (!professionalId) return null;
  const snap = await getDoc(doc(db, 'professionals', professionalId));
  return snap.exists() ? {
    recurringAvailability: snap.data().recurringAvailability || {},
    dateOverrides: snap.data().dateOverrides || [],
  } : null;
};

// Generates time slots between two times
const generateTimeSlots = (start: string, end: string, date: Date, duration = 30): Date[] => {
  const slots = [];
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);

  let currentTime = new Date(date);
  currentTime.setHours(startHour, startMinute, 0, 0);

  const endTime = new Date(date);
  endTime.setHours(endHour, endMinute, 0, 0);

  const maxStartTime = new Date(endTime);
  maxStartTime.setMinutes(endTime.getMinutes() - duration);

  while (currentTime.getTime() <= maxStartTime.getTime()) {
    slots.push(new Date(currentTime));
    currentTime.setMinutes(currentTime.getMinutes() + duration);
  }
  return slots;
}

// Gets available time slots for a professional
export const getAvailableSlotsForProfessional = async (
  professionalId: string, 
  selectedDate: Date, 
  duration: number
): Promise<TimeSlot[]> => {
  if (!professionalId || !selectedDate) return [];

  const profSnap = await getDoc(doc(db, 'professionals', professionalId));
  if (!profSnap.exists()) return [];

  const professionalData = profSnap.data();
  const dayOfWeekIndex = selectedDate.getDay();
  const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const dayOfWeek = dayNames[dayOfWeekIndex];

  let workHours = professionalData.recurringAvailability?.[dayOfWeek];

  // Check for date overrides
  const override = (professionalData.dateOverrides || []).find((o: any) => {
    const overrideDate = o.date?.seconds
      ? new Date(o.date.seconds * 1000)
      : (typeof o.date === 'string' ? new Date(o.date) : undefined);
    return overrideDate && overrideDate.toDateString() === selectedDate.toDateString();
  });

  if (override) {
    if (override.type === 'unavailable') return [];
    workHours = { isOpen: true, startTime: override.startTime, endTime: override.endTime };
  }
  
  if (!workHours || !workHours.isOpen) return [];

  // Generate all possible slots
  const allPossibleSlots = generateTimeSlots(workHours.startTime, workHours.endTime, selectedDate);

  // Get booked appointments
  const appointmentsQuery = query(
    collection(db, 'appointments'),
    where('professionalId', '==', professionalId),
    where('startTime', '>=', startOfDay(selectedDate)),
    where('startTime', '<=', endOfDay(selectedDate)),
    where('status', 'in', ['scheduled', 'confirmed'])
  );
  
  const bookedSlots = (await getDocs(appointmentsQuery)).docs.map(doc => {
    const data = doc.data();
    return {
      startTime: data.startTime?.toDate?.()?.getTime() || new Date(data.startTime).getTime(),
      endTime: data.endTime?.toDate?.()?.getTime() || new Date(data.endTime).getTime()
    };
  });

  // Filter available slots
  return allPossibleSlots
    .filter(slotTime => {
      const slotEndTime = new Date(slotTime);
      slotEndTime.setMinutes(slotEndTime.getMinutes() + 30);
      return !bookedSlots.some(
        booked => slotTime.getTime() < booked.endTime && slotEndTime.getTime() > booked.startTime
      );
    })
    .map((slotTime, index) => ({
      id: `slot-${index}-${slotTime.getTime()}`,
      professionalId,
      salonId: professionalData.salonId,
      startTime: slotTime,
      endTime: new Date(slotTime.getTime() + 30 * 60000),
      isBooked: false,
    }));
};

// Gets appointments for a salon
export const getAppointmentsBySalon = async (salonId: string): Promise<Appointment[]> => {
  if (!salonId) return [];
  const q = query(
    collection(db, 'appointments'), 
    where('salonId', '==', salonId),
    orderBy('startTime', 'desc')
  );
  return (await getDocs(q)).docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    startTime: doc.data().startTime.toDate(),
    endTime: doc.data().endTime.toDate(),
  } as Appointment));
};

// Gets appointments for reporting
export const getAppointmentsForReporting = async (
  salonId: string,
  period: 'daily' | 'weekly' | 'monthly'
): Promise<Appointment[]> => {
  if (!salonId) return [];

  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  if (period === 'daily') {
    startDate = startOfDay(now);
    endDate = endOfDay(now);
  } else if (period === 'weekly') {
    startDate = startOfWeek(now, { weekStartsOn: 0 });
    endDate = endOfWeek(now, { weekStartsOn: 0 });
  } else {
    startDate = startOfMonth(now);
    endDate = endOfMonth(now);
  }

  const q = query(
    collection(db, 'appointments'),
    where('salonId', '==', salonId),
    where('status', '==', 'completed'),
    where('startTime', '>=', startDate),
    where('startTime', '<=', endDate),
    orderBy('startTime', 'desc')
  );

  return (await getDocs(q)).docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    startTime: doc.data().startTime.toDate(),
    endTime: doc.data().endTime.toDate(),
  } as Appointment));
};

// Creates a new appointment
export const createAppointment = async (appointmentData: Omit<Appointment, 'id'>): Promise<Appointment> => {
  const docRef = await addDoc(collection(db, 'appointments'), appointmentData);
  return { id: docRef.id, ...appointmentData };
};

// Updates appointment status
export const updateAppointmentStatus = async (appointmentId: string, status: string): Promise<void> => {
  await updateDoc(doc(db, 'appointments', appointmentId), { status });
};

// Cancels an appointment
export const cancelAppointment = async (appointmentId: string): Promise<void> => {
  await updateAppointmentStatus(appointmentId, 'cancelled');
};

// Deletes an appointment
export const deleteAppointment = async (appointmentId: string): Promise<void> => {
  await deleteDoc(doc(db, 'appointments', appointmentId));
};

// Gets all salons
export const getAllSalons = async (): Promise<Salon[]> => {
  return (await getDocs(collection(db, 'salons'))).docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Salon));
};

// Finds customer by phone and salon
export const findCustomerByPhone = async (phone: string, salonId: string): Promise<Customer | null> => {
  const q = query(
    collection(db, 'customers'),
    where('phone', '==', phone),
    where('salonId', '==', salonId),
    limit(1)
  );
  const snapshot = await getDocs(q);
  return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Customer;
};

// Creates a new customer
export const createCustomer = async (phone: string, customerData: Omit<Customer, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'customers'), {
    ...customerData,
    phone,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

// Updates customer data
export const updateCustomer = async (customerId: string, data: Partial<Customer>): Promise<void> => {
  try {
    const customerRef = doc(db, 'customers', customerId);
    await updateDoc(customerRef, data);
  } catch (error) {
    console.error("Error updating customer:", error);
    throw error;
  }
};

// Deletes a customer
export const deleteCustomer = async (customerId: string): Promise<void> => {
  try {
    const customerRef = doc(db, 'customers', customerId);
    await deleteDoc(customerRef);
  } catch (error) {
    console.error("Error deleting customer:", error);
    throw error;
  }
};

// Gets all customers for a salon, ordered by creation date
export const getCustomersBySalon = async (salonId: string): Promise<Customer[]> => {
  try {
    const customersRef = collection(db, 'customers');
    const q = query(
      customersRef,
      where('salonId', '==', salonId)
      // Removido orderBy('createdAt', 'desc') para evitar erro se algum cliente não tiver esse campo
    );
    const querySnapshot = await getDocs(q);
    // Ordena manualmente se o campo existir
    return querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Customer))
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        // Suporta tanto string ISO quanto Timestamp do Firestore
        const getTime = (val: any) => {
          if (typeof val === 'string') return new Date(val).getTime();
          if (val && typeof val.seconds === 'number') return val.seconds * 1000;
          return 0;
        };
        return getTime(b.createdAt) - getTime(a.createdAt);
      });
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw new Error("Failed to fetch customers");
  }
};

export const generatePixForAppointment = async (salonId: string, amount: number, reference: string) => {
  const functions = getFunctions();
  const generatePix = httpsCallable(functions, 'generatePix');
  try {
    const result = await generatePix({ salonId, amount, reference });
    return result.data as { pixCode: string };
  } catch (error) {
    console.error("Erro ao chamar a Cloud Function 'generatePix':", error);
    throw new Error("Não foi possível gerar o QR Code Pix.");
  }
};