import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, limit, addDoc, orderBy, deleteDoc } from 'firebase/firestore';
import { getDay, format } from 'date-fns';
import type { Appointment, TimeSlot, Salon, Professional } from '@/lib/types';

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
  email: string, // This is the login email for the admin user
  contactNumber: string,
  address?: string,
  description?: string
): Promise<string> => {
  const salonSlug = generateSlug(salonName);
  const salonRef = doc(db, 'salons', adminUserId); // Use adminUserId as salon document ID
  const newSalon: Salon = {
    id: adminUserId, // The document ID is the salon's ID
    adminUserId,
    name: salonName,
    slug: salonSlug,
    email: email, // This should be the contact email for the salon, could be same as admin's login email or different
    contactNumber: contactNumber,
    address: address || "", 
    description: description || "", 
  };
  await setDoc(salonRef, newSalon);
  console.log(`Salon created for user ${adminUserId} with slug ${salonSlug} and details:`, newSalon);
  return salonSlug; // Or return the full salon object if needed
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
  adminUserId: string, // Use adminUserId to identify the salon document
  data: Partial<Omit<Salon, 'id' | 'adminUserId'>> // Data to update
): Promise<void> => {
  const salonRef = doc(db, 'salons', adminUserId);
  
  const currentSalonSnap = await getDoc(salonRef);
  if (!currentSalonSnap.exists()) {
    console.error(`Salon with ID ${adminUserId} not found for update.`);
    throw new Error("Salon not found for update.");
  }
  const currentSalonData = currentSalonSnap.data() as Salon;

  const updateData = { ...data };
  // Ensure slug is regenerated if salonName changes and is different from current
  if (data.name && data.name !== currentSalonData.name) {
    updateData.slug = generateSlug(data.name);
  }
  await updateDoc(salonRef, updateData);
  console.log(`Salon settings updated for admin user ID: ${adminUserId}`);
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
    salonId: salonId, // Ensure the professional is associated with the correct salon
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
  availability: any // Idealmente, defina um tipo para isso
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
  overrides: any[] // Idealmente, defina um tipo para isso
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

  while (currentTime < endTime) {
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
  const dayOfWeek = format(selectedDate, 'EEEE'); // 'Monday', 'Tuesday', etc.
  let workHours = professionalData.recurringAvailability?.[dayOfWeek];

  // Verificar exceções (overrides)
  const dateOverrides = professionalData.dateOverrides || [];
  const override = dateOverrides.find((o: any) => {
    // Suporta tanto Firestore Timestamp quanto string ISO
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
  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const appointmentsQuery = query(
    collection(db, 'appointments'),
    where('professionalId', '==', professionalId),
    where('startTime', '>=', startOfDay),
    where('startTime', '<=', endOfDay)
  );
  
  const appointmentsSnapshot = await getDocs(appointmentsQuery);
  const bookedStartTimes = appointmentsSnapshot.docs.map(doc => {
    const data = doc.data();
    // Suporta tanto Firestore Timestamp quanto string ISO
    if (data.startTime?.seconds) {
      return new Date(data.startTime.seconds * 1000).getTime();
    }
    if (typeof data.startTime === 'string') {
      return new Date(data.startTime).getTime();
    }
    return null;
  }).filter(Boolean);

  // Filtrar slots já agendados
  const availableTimeSlots: TimeSlot[] = allPossibleSlots
    .filter(slotTime => !bookedStartTimes.includes(slotTime.getTime()))
    .map((slotTime, index) => {
      const endTime = new Date(slotTime);
      endTime.setMinutes(endTime.getMinutes() + 30); // Assumindo duração de 30min
      return {
        id: `slot-${index}-${slotTime.getTime()}`,
        professionalId,
        salonId: professionalData.salonId,
        startTime: slotTime,
        endTime: endTime,
        isBooked: false,
      };
    });

  return availableTimeSlots;
};

// Busca agendamentos para um determinado salão, ordenados pelos mais recentes
export const getAppointmentsBySalon = async (salonId: string): Promise<Appointment[]> => {
  if (!salonId) return [];

  const appointmentsCollectionRef = collection(db, 'appointments');
  // Criamos a query para filtrar por salonId e ordenar por data de início descendente
  const q = query(
    appointmentsCollectionRef, 
    where('salonId', '==', salonId),
    orderBy('startTime', 'desc') // Ordena para mostrar os mais recentes primeiro
  );
  
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    console.log(`No appointments found for salon ID: ${salonId}`);
    return [];
  }
  
  // Mapeia os documentos para o tipo Appointment, convertendo Timestamps para Dates
  const appointments: Appointment[] = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // É crucial converter os Timestamps do Firestore para objetos Date do JavaScript
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
  
  // Retorna o agendamento completo, incluindo o novo ID gerado pelo Firestore
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
// Uma abordagem melhor poderia ser apenas atualizar o status para 'cancelled'.
// Vamos usar a atualização de status para manter o histórico.
export const cancelAppointment = async (appointmentId: string): Promise<void> => {
  // Em vez de deletar, vamos apenas mudar o status para 'cancelled'
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
  const q = query(salonsCollectionRef); // Query simples para pegar todos
  
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


