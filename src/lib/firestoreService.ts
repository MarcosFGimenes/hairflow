import { db } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import type { Salon, Professional, Appointment, TimeSlot, Service, Customer, WorkDay } from './types';
import { addMinutes, formatISO, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Function to create a URL-friendly slug
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD') // Normalize to decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start
    .replace(/-+$/, ''); // Trim - from end
};

// --- Salon Functions ---

export const createSalon = async (
  adminUid: string,
  salonName: string,
  email: string,
  contactNumber: string,
  address?: string,
  description?: string
): Promise<string> => {
  if (!adminUid || !salonName || !email || !contactNumber) {
    throw new Error('Required fields are missing');
  }

  const salonSlug = generateSlug(salonName);
  const salonRef = doc(db, 'salons', adminUid);
  const newSalon: Omit<Salon, 'id' | 'services'> = {
    name: salonName,
    slug: salonSlug,
    email,
    contactNumber,
    address: address ?? '',
    description: description ?? '',
    adminUid,
    pixCity: '',
    abacatepayApiKey: ''
  };

  await setDoc(salonRef, newSalon);
  return salonSlug;
};

export const getSalonBySlug = async (slug: string): Promise<Salon | null> => {
  if (!slug) {
    console.warn('Slug is empty');
    return null;
  }

  const q = query(collection(db, 'salons'), where('slug', '==', slug), limit(1));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    console.log(`No salon found with slug: ${slug}`);
    return null;
  }

  const salonDoc = querySnapshot.docs[0];
  return { id: salonDoc.id, ...salonDoc.data() } as Salon;
};

export const getSalonByAdmin = async (adminUid: string): Promise<Salon | null> => {
  if (!adminUid) {
    console.warn('Admin UID is empty');
    return null;
  }

  const q = query(collection(db, 'salons'), where('adminUid', '==', adminUid), limit(1));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const salonDoc = querySnapshot.docs[0];
  return { id: salonDoc.id, ...salonDoc.data() } as Salon;
};

export const updateSalonSettings = async (
  adminUid: string,
  data: Partial<Omit<Salon, 'id' | 'adminUid'>>
): Promise<void> => {
  if (!adminUid) {
    throw new Error('Admin UID is required');
  }

  const salonRef = doc(db, 'salons', adminUid);
  const currentSalonSnap = await getDoc(salonRef);

  if (!currentSalonSnap.exists()) {
    throw new Error('Salon not found for update');
  }

  const updateData: Partial<Salon> = { ...data };
  if (data.name && data.name !== (currentSalonSnap.data() as Salon).name) {
    updateData.slug = generateSlug(data.name);
  }

  await updateDoc(salonRef, updateData);
};

export const getAllSalons = async (): Promise<Salon[]> => {
  const snapshot = await getDocs(collection(db, 'salons'));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as Salon));
};

// --- Service Functions (Subcollection) ---

export const getSalonServices = async (salonId: string): Promise<Service[]> => {
  const servicesCollectionRef = collection(db, 'salons', salonId, 'services');
  const snapshot = await getDocs(servicesCollectionRef);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name ?? '',
    price: doc.data().price ?? 0,
    duration: doc.data().duration ?? 0,
  } as Service));
};

export const createSalonService = async (salonId: string, serviceData: Omit<Service, 'id'>): Promise<string> => {
  if (!salonId) {
    throw new Error('Salon ID is required');
  }

  const servicesCollectionRef = collection(db, 'salons', salonId, 'services');
  const docRef = await addDoc(servicesCollectionRef, serviceData);
  return docRef.id;
};

export const updateSalonService = async (
  salonId: string,
  serviceId: string,
  serviceData: Partial<Omit<Service, 'id'>>
): Promise<void> => {
  if (!salonId || !serviceId) {
    throw new Error('Salon ID and Service ID are required');
  }

  const serviceDocRef = doc(db, 'salons', salonId, 'services', serviceId);
  await updateDoc(serviceDocRef, serviceData);
};

export const deleteSalonService = async (salonId: string, serviceId: string): Promise<void> => {
  if (!salonId || !serviceId) {
    throw new Error('Salon ID and Service ID are required');
  }

  const serviceDocRef = doc(db, 'salons', salonId, 'services', serviceId);
  await deleteDoc(serviceDocRef);
};

// --- Professional Functions ---

export const createProfessional = async (
  salonId: string,
  professionalData: Omit<Professional, 'id' | 'salonId'>
): Promise<string> => {
  if (!salonId) {
    throw new Error('Salon ID is required');
  }

  const docRef = await addDoc(collection(db, 'professionals'), {
    ...professionalData,
    salonId,
  });
  return docRef.id;
};

export const getProfessionalsBySalon = async (salonId: string): Promise<Professional[]> => {
  if (!salonId) {
    console.warn('Salon ID is empty');
    return [];
  }

  const q = query(collection(db, 'professionals'), where('salonId', '==', salonId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Professional));
};

export const saveRecurringAvailability = async (professionalId: string, availability: { [key: string]: WorkDay }): Promise<void> => {
  if (!professionalId) {
    throw new Error('Professional ID is required');
  }

  await updateDoc(doc(db, 'professionals', professionalId), {
    workHours: availability,
  });
};

export const saveDateOverrides = async (professionalId: string, overrides: any[]): Promise<void> => {
  if (!professionalId) {
    throw new Error('Professional ID is required');
  }

  await updateDoc(doc(db, 'professionals', professionalId), {
    dateOverrides: overrides,
  });
};

export const getProfessionalAvailability = async (
  professionalId: string
): Promise<{ recurringAvailability: { [key: string]: WorkDay }; dateOverrides: any[] } | null> => {
  if (!professionalId) {
    console.warn('Professional ID is empty');
    return null;
  }

  const snap = await getDoc(doc(db, 'professionals', professionalId));
  return snap.exists()
    ? {
        recurringAvailability: snap.data().workHours || {},
        dateOverrides: snap.data().dateOverrides || [],
      }
    : null;
};

// --- Appointment and Time Slot Functions ---

export const getAppointmentsForDay = async (professionalId: string, date: Date): Promise<Appointment[]> => {
  if (!professionalId) {
    console.warn('Professional ID is empty');
    return [];
  }

  const start = Timestamp.fromDate(startOfDay(date));
  const end = Timestamp.fromDate(endOfDay(date));

  const q = query(
    collection(db, 'appointments'),
    where('professionalId', '==', professionalId),
    where('startTime', '>=', start),
    where('startTime', '<=', end)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startTime: (data.startTime as Timestamp).toDate().toISOString(),
      endTime: (data.endTime as Timestamp).toDate().toISOString(),
    } as Appointment;
  });
};

export const getAvailableSlotsForProfessional = async (
  professionalId: string,
  date: Date,
  serviceDuration: number
): Promise<TimeSlot[]> => {
  if (!professionalId || !date || !serviceDuration) {
    throw new Error('Professional ID, date, and service duration are required');
  }

  const professionalDocRef = doc(db, 'professionals', professionalId);
  const professionalSnap = await getDoc(professionalDocRef);

  if (!professionalSnap.exists()) {
    throw new Error('Professional not found');
  }

  const professionalData = professionalSnap.data() as Professional;
  const workHours = professionalData.workHours as { [key: string]: WorkDay } | undefined;

  if (!workHours) {
    console.warn('No work hours defined for professional');
    return [];
  }

  const dayOfWeekStr = date.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
  const todayWorkHours = workHours[dayOfWeekStr];

  if (!todayWorkHours || !todayWorkHours.isWorkDay) {
    return [];
  }

  const appointments = await getAppointmentsForDay(professionalId, date);
  const availableSlots: TimeSlot[] = [];
  const dateStr = formatISO(date, { representation: 'date' });
  const startTime = parseISO(`${dateStr}T${todayWorkHours.startTime}`);
  const endTime = parseISO(`${dateStr}T${todayWorkHours.endTime}`);

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    throw new Error('Invalid work hours format');
  }

  let currentTime = startTime;

  while (addMinutes(currentTime, serviceDuration) <= endTime) {
    const slotEnd = addMinutes(currentTime, serviceDuration);
    const isBooked = appointments.some((app) => {
      const appStart = parseISO(app.startTime);
      const appEnd = parseISO(app.endTime);
      return currentTime < appEnd && slotEnd > appStart;
    });

    if (!isBooked) {
      availableSlots.push({
        startTime: currentTime.toISOString(),
        endTime: slotEnd.toISOString(),
      });
    }

    currentTime = addMinutes(currentTime, 15); // 15-minute increments for flexibility
  }

  return availableSlots;
};

export const createAppointment = async (appointmentData: Omit<Appointment, 'id'>): Promise<Appointment> => {
  if (!appointmentData.startTime || !appointmentData.endTime) {
    throw new Error('Start time and end time are required');
  }

  const dataToSave = {
    ...appointmentData,
    startTime: Timestamp.fromDate(parseISO(appointmentData.startTime)),
    endTime: Timestamp.fromDate(parseISO(appointmentData.endTime)),
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'appointments'), dataToSave);
  return { id: docRef.id, ...appointmentData };
};

export const getAppointmentsBySalon = async (salonId: string): Promise<Appointment[]> => {
  if (!salonId) {
    console.warn('Salon ID is empty');
    return [];
  }

  const q = query(collection(db, 'appointments'), where('salonId', '==', salonId), orderBy('startTime', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startTime: (data.startTime as Timestamp).toDate().toISOString(),
      endTime: (data.endTime as Timestamp).toDate().toISOString(),
    } as Appointment;
  });
};

export const getAppointmentsForReporting = async (
  salonId: string,
  period: 'daily' | 'weekly' | 'monthly'
): Promise<Appointment[]> => {
  if (!salonId) {
    console.warn('Salon ID is empty');
    return [];
  }

  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case 'daily':
      startDate = startOfDay(now);
      endDate = endOfDay(now);
      break;
    case 'weekly':
      startDate = startOfWeek(now, { weekStartsOn: 0 });
      endDate = endOfWeek(now, { weekStartsOn: 0 });
      break;
    case 'monthly':
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      break;
    default:
      throw new Error('Invalid period specified');
  }

  const q = query(
    collection(db, 'appointments'),
    where('salonId', '==', salonId),
    where('status', '==', 'completed'),
    where('startTime', '>=', Timestamp.fromDate(startDate)),
    where('startTime', '<=', Timestamp.fromDate(endDate)),
    orderBy('startTime', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startTime: (data.startTime as Timestamp).toDate().toISOString(),
      endTime: (data.endTime as Timestamp).toDate().toISOString(),
    } as Appointment;
  });
};

export const updateAppointmentStatus = async (appointmentId: string, status: string): Promise<void> => {
  if (!appointmentId || !status) {
    throw new Error('Appointment ID and status are required');
  }

  await updateDoc(doc(db, 'appointments', appointmentId), { status });
};

export const cancelAppointment = async (appointmentId: string): Promise<void> => {
  await updateAppointmentStatus(appointmentId, 'cancelled');
};

export const deleteAppointment = async (appointmentId: string): Promise<void> => {
  if (!appointmentId) {
    throw new Error('Appointment ID is required');
  }

  await deleteDoc(doc(db, 'appointments', appointmentId));
};

// --- Customer Functions ---

export const findCustomerByPhone = async (phone: string, salonId: string): Promise<Customer | null> => {
  if (!phone || !salonId) {
    console.warn('Phone or Salon ID is empty');
    return null;
  }

  const q = query(collection(db, 'customers'), where('phone', '==', phone), where('salonId', '==', salonId), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Customer;
};

export const createCustomer = async (phone: string, customerData: Omit<Customer, 'id'>): Promise<string> => {
  if (!phone || !customerData.salonId) {
    throw new Error('Phone and Salon ID are required');
  }

  const customerDocRef = doc(db, 'customers', `${customerData.salonId}_${phone}`);
  await setDoc(customerDocRef, {
    ...customerData,
    phone,
    createdAt: serverTimestamp(),
  });
  return customerDocRef.id;
};

export const updateCustomer = async (customerId: string, data: Partial<Customer>): Promise<void> => {
  if (!customerId) {
    throw new Error('Customer ID is required');
  }

  const customerRef = doc(db, 'customers', customerId);
  await updateDoc(customerRef, data);
};

export const deleteCustomer = async (customerId: string): Promise<void> => {
  if (!customerId) {
    throw new Error('Customer ID is required');
  }

  const customerRef = doc(db, 'customers', customerId);
  await deleteDoc(customerRef);
};

export const getCustomersBySalon = async (salonId: string): Promise<Customer[]> => {
  if (!salonId) {
    console.warn('Salon ID is empty');
    return [];
  }

  const q = query(collection(db, 'customers'), where('salonId', '==', salonId), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Customer));
};

// --- Payment Functions ---

export const generatePixForAppointment = async (
  salonId: string,
  amount: number,
  reference: string
): Promise<{ pixCode: string }> => {
  if (!salonId || !amount || !reference) {
    throw new Error('Salon ID, amount, and reference are required');
  }

const functions = getFunctions();
const generatePix = httpsCallable(functions, 'generatePix');

  try {
    const result = await generatePix({ salonId, amount, reference });
    return result.data as { pixCode: string };
  } catch (error) {
    console.error('Error calling Cloud Function "generatePix":', error);
    throw new Error('Failed to generate Pix QR Code');
  }
};