// src/lib/firestoreService.ts
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, limit, addDoc, orderBy, deleteDoc } from 'firebase/firestore';
import { getDay, format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'; // Adicionado date-fns
import type { Appointment, TimeSlot, Salon, Professional, Service } from '@/lib/types';

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

// Creates a new salon document in Firestore.
// Uses adminUserId as the document ID for simplicity.
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
    adminUserId,
    name: salonName,
    slug: salonSlug,
    email: email,
    contactNumber: contactNumber,
    address: address || "", 
    description: description || "",
    services: [],
  };
  await setDoc(salonRef, newSalon);
  console.log(`Salon created for user ${adminUserId} with slug ${salonSlug} and details:`, newSalon);
  return salonSlug;
};

// Fetches salon data for a given admin user ID.
export const getSalonByAdmin = async (adminUserId: string): Promise<Salon | null> => {
  if (!adminUserId) return null;
  const salonRef = doc(db, 'salons', adminUserId);
  const salonSnap = await getDoc(salonRef);
  if (salonSnap.exists()) {
    return salonSnap.data() as Salon;
  }
  console.warn(`No salon found for admin user ID: ${adminUserId}`);
  return null;
};

// Updates salon settings.
export const updateSalonSettings = async (
  adminUserId: string,
  data: Partial<Omit<Salon, 'id' | 'adminUserId'>>
): Promise<void> => {
  const salonRef = doc(db, 'salons', adminUserId);
  
  const currentSalonSnap = await getDoc(salonRef);
  if (!currentSalonSnap.exists()) {
    console.error(`Salon with ID ${adminUserId} not found for update.`);
    throw new Error("Salon not found for update.");
  }
  const currentSalonData = currentSalonSnap.data() as Salon;

  const updateData = { ...data };
  if (data.name && data.name !== currentSalonData.name) {
    updateData.slug = generateSlug(data.name);
  }
  await updateDoc(salonRef, updateData);
  console.log(`Salon settings updated for admin user ID: ${adminUserId}`);
};

// Adds or updates a service for a salon
export const saveSalonServices = async (salonId: string, services: Service[]): Promise<void> => {
  const salonRef = doc(db, 'salons', salonId);
  await updateDoc(salonRef, {
    services: services,
  });
  console.log(`Services updated for salon ${salonId}`);
};

// Gets services for a salon
export const getSalonServices = async (salonId: string): Promise<Service[]> => {
  const salonRef = doc(db, 'salons', salonId);
  const salonSnap = await getDoc(salonRef);
  if (salonSnap.exists()) {
    const data = salonSnap.data();
    return (data.services || []) as Service[];
  }
  return [];
};

// Fetches salon data by its slug.
export const getSalonBySlug = async (slug: string): Promise<Salon | null> => {
  if (!slug) return null;
  const salonsCollectionRef = collection(db, 'salons');
  const q = query(salonsCollectionRef, where('slug', '==', slug), limit(1));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const salonDoc = querySnapshot.docs[0];
    return { id: salonDoc.id, ...salonDoc.data() } as Salon;
  }
  console.warn(`No salon found with slug: ${slug}`);
  return null;
};

// Creates a new professional document in Firestore.
export const createProfessional = async (
  salonId: string,
  professionalData: Omit<Professional, 'id' | 'salonId'>
): Promise<string> => {
  const professionalsCollectionRef = collection(db, 'professionals');
  const newProfessionalDoc = await addDoc(professionalsCollectionRef, {
    ...professionalData,
    salonId: salonId,
  });
  console.log(`Professional created with ID: ${newProfessionalDoc.id} for salon ${salonId}`);
  return newProfessionalDoc.id;
};

// Fetches professionals for a given salon ID.
export const getProfessionalsBySalon = async (salonId: string): Promise<Professional[]> => {
  if (!salonId) return [];
  
  const professionalsCollectionRef = collection(db, 'professionals');
  const q = query(professionalsCollectionRef, where('salonId', '==', salonId));
  
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    console.log(`No professionals found for salon ID: ${salonId}`);
    return [];
  }
  
  const professionals: Professional[] = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Professional));
  
  return professionals;
};

// Salva a disponibilidade recorrente de um profissional
export const saveRecurringAvailability = async (
  professionalId: string,
  availability: any
): Promise<void> => {
  const profRef = doc(db, 'professionals', professionalId);
  await updateDoc(profRef, {
    recurringAvailability: availability,
  });
  console.log(`Recurring availability updated for professional ${professionalId}`);
};

// Salva as exceções de data (disponível/indisponível)
export const saveDateOverrides = async (
  professionalId: string,
  overrides: any[]
): Promise<void> => {
  const profRef = doc(db, 'professionals', professionalId);
  await updateDoc(profRef, {
    dateOverrides: overrides,
  });
  console.log(`Date overrides updated for professional ${professionalId}`);
};

// Busca a configuração de disponibilidade completa de um profissional
export const getProfessionalAvailability = async (professionalId: string) => {
  if (!professionalId) return null;
  const profRef = doc(db, 'professionals', professionalId);
  const profSnap = await getDoc(profRef);
  if (profSnap.exists()) {
    const data = profSnap.data();
    return {
      recurringAvailability: data.recurringAvailability || {},
      dateOverrides: data.dateOverrides || [],
    };
  }
  return null;
};

// Função para gerar slots de 30 minutos entre duas horas
const generateTimeSlots = (start: string, end: string, date: Date, duration = 30): Date[] => {
  const slots = [];
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);

  let currentTime = new Date(date);
  currentTime.setHours(startHour, startMinute, 0, 0);

  const endTime = new Date(date);
  endTime.setHours(endHour, endMinute, 0, 0);

  // Ajuste para evitar que o último slot ultrapasse a hora final
  // Se o endTime for 17:00 e o duration for 30, o último slot deve começar no máximo às 16:30
  const maxStartTime = new Date(endTime);
  maxStartTime.setMinutes(endTime.getMinutes() - duration);

  while (currentTime.getTime() <= maxStartTime.getTime()) { // Changed condition to <=
    slots.push(new Date(currentTime));
    currentTime.setMinutes(currentTime.getMinutes() + duration);
  }
  return slots;
}

export const getAvailableSlotsForProfessional = async (professionalId: string, selectedDate: Date): Promise<TimeSlot[]> => {
  if (!professionalId || !selectedDate) return [];

  const profRef = doc(db, 'professionals', professionalId);
  const profSnap = await getDoc(profRef);

  if (!profSnap.exists()) {
    console.warn("Professional not found:", professionalId);
    return [];
  }

  const professionalData = profSnap.data();
  const dayOfWeekIndex = selectedDate.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
  const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const dayOfWeek = dayNames[dayOfWeekIndex]; // Get the day name in Portuguese

  let workHours = professionalData.recurringAvailability?.[dayOfWeek];

  // Verificar exceções (overrides)
  const dateOverrides = professionalData.dateOverrides || [];
  const override = dateOverrides.find((o: any) => {
    const overrideDate = o.date?.seconds
      ? new Date(o.date.seconds * 1000)
      : (typeof o.date === 'string' ? new Date(o.date) : undefined);
    return overrideDate && overrideDate.toDateString() === selectedDate.toDateString();
  });

  if (override) {
    if (override.type === 'unavailable') {
      return []; // Dia bloqueado
    }
    workHours = { isOpen: true, startTime: override.startTime, endTime: override.endTime };
  }
  
  if (!workHours || !workHours.isOpen) {
    return []; // Não trabalha neste dia
  }

  // Gerar todos os slots possíveis para o dia
  const allPossibleSlots = generateTimeSlots(workHours.startTime, workHours.endTime, selectedDate);

  // Buscar agendamentos existentes para filtrar
  const startOfSelectedDay = startOfDay(selectedDate);
  const endOfSelectedDay = endOfDay(selectedDate);

  const appointmentsQuery = query(
    collection(db, 'appointments'),
    where('professionalId', '==', professionalId),
    where('startTime', '>=', startOfSelectedDay),
    where('startTime', '<=', endOfSelectedDay),
    // Consider only 'scheduled' and 'confirmed' appointments as booked
    where('status', 'in', ['scheduled', 'confirmed']) // NEW: Filter by relevant statuses
  );
  
  const appointmentsSnapshot = await getDocs(appointmentsQuery);
  const bookedSlots = appointmentsSnapshot.docs.map(doc => {
    const data = doc.data();
    // Ensure startTime and endTime are Date objects for accurate comparison
    const apptStartTime = data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime);
    const apptEndTime = data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime);
    return { startTime: apptStartTime.getTime(), endTime: apptEndTime.getTime() };
  });

  // Filtrar slots já agendados
  const availableTimeSlots: TimeSlot[] = allPossibleSlots
    .filter(slotTime => {
      const slotEndTime = new Date(slotTime);
      slotEndTime.setMinutes(slotEndTime.getMinutes() + 30); // Assuming 30min duration for a slot
      
      // Check if this slot overlaps with any booked appointment
      return !bookedSlots.some(bookedAppt => {
        // Check for overlap: (start1 < end2) && (end1 > start2)
        return (slotTime.getTime() < bookedAppt.endTime) && (slotEndTime.getTime() > bookedAppt.startTime);
      });
    })
    .map((slotTime, index) => {
      const endTime = new Date(slotTime);
      endTime.setMinutes(endTime.getMinutes() + 30); // Assumindo duração de 30min
      return {
        id: `slot-${index}-${slotTime.getTime()}`,
        professionalId,
        salonId: professionalData.salonId,
        startTime: slotTime,
        endTime: endTime,
        isBooked: false, // Mark as false because it's available after filtering
      };
    });

  return availableTimeSlots;
};

// Busca agendamentos para um determinado salão, ordenados pelos mais recentes
export const getAppointmentsBySalon = async (salonId: string): Promise<Appointment[]> => {
  if (!salonId) return [];

  const appointmentsCollectionRef = collection(db, 'appointments');
  const q = query(
    appointmentsCollectionRef, 
    where('salonId', '==', salonId),
    orderBy('startTime', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    console.log(`No appointments found for salon ID: ${salonId}`);
    return [];
  }
  
  const appointments: Appointment[] = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startTime: data.startTime.toDate(),
      endTime: data.endTime.toDate(),
    } as Appointment;
  });
  
  return appointments;
};

// Function to get appointments for a specific period (daily, weekly, monthly)
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
    // startOfWeek uses Sunday as default start, locale might affect it
    startDate = startOfWeek(now, { weekStartsOn: 0 }); // Sunday as start of week
    endDate = endOfWeek(now, { weekStartsOn: 0 });
  } else { // monthly
    startDate = startOfMonth(now);
    endDate = endOfMonth(now);
  }

  const appointmentsCollectionRef = collection(db, 'appointments');
  const q = query(
    appointmentsCollectionRef,
    where('salonId', '==', salonId),
    where('status', '==', 'completed'), // Only count completed appointments for revenue
    where('startTime', '>=', startDate),
    where('startTime', '<=', endDate),
    orderBy('startTime', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const appointments: Appointment[] = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startTime: data.startTime.toDate(),
      endTime: data.endTime.toDate(),
    } as Appointment;
  });

  return appointments;
};


// Cria um novo agendamento no Firestore
export const createAppointment = async (appointmentData: Omit<Appointment, 'id'>): Promise<Appointment> => {
  const appointmentsCollectionRef = collection(db, 'appointments');
  const newAppointmentDocRef = await addDoc(appointmentsCollectionRef, appointmentData);
  
  return {
    id: newAppointmentDocRef.id,
    ...appointmentData
  };
};

// Atualiza o status de um agendamento existente
export const updateAppointmentStatus = async (appointmentId: string, status: Appointment['status']): Promise<void> => {
  const appointmentRef = doc(db, 'appointments', appointmentId);
  await updateDoc(appointmentRef, { status: status });
};

// Cancela (deleta) um agendamento.
export const cancelAppointment = async (appointmentId: string): Promise<void> => {
  await updateAppointmentStatus(appointmentId, 'cancelled');
};

// Se você realmente quiser deletar o documento do Firestore:
export const deleteAppointment = async (appointmentId: string): Promise<void> => {
  const appointmentRef = doc(db, 'appointments', appointmentId);
  await deleteDoc(appointmentRef);
};

// Busca todos os salões cadastrados no Firestore
export const getAllSalons = async (): Promise<Salon[]> => {
  const salonsCollectionRef = collection(db, 'salons');
  const q = query(salonsCollectionRef);
  
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    console.log("No salons found in the database.");
    return [];
  }
  
  const salons: Salon[] = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Salon));
  
  return salons;
};