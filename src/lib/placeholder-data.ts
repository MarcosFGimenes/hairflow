import type { Salon, Professional, Appointment, TimeSlot } from './types';

export const placeholderSalons: Salon[] = [
  {
    id: 'salon1',
    name: 'Cool Cuts Barbershop',
    slug: 'cool-cuts',
    contactNumber: '+15551234567', // Example format for WhatsApp
    address: '123 Main St, Anytown, USA',
    adminId: ''
  },
  {
    id: 'salon2',
    name: 'Glamour Hair Studio',
    slug: 'glamour-hair',
    contactNumber: '+15557654321',
    address: '456 Oak Ave, Anytown, USA',
    adminId: ''
  },
];

export const placeholderProfessionals: Professional[] = [
  {
    id: 'prof1',
    salonId: 'salon1',
    name: 'John Doe',
    specialty: 'Men\'s Cuts, Beard Trims',
    imageUrl: 'https://placehold.co/100x100.png',
  },
  {
    id: 'prof2',
    salonId: 'salon1',
    name: 'Jane Smith',
    specialty: 'Fades, Modern Styles',
    imageUrl: 'https://placehold.co/100x100.png',
  },
  {
    id: 'prof3',
    salonId: 'salon2',
    name: 'Alice Brown',
    specialty: 'Coloring, Styling',
    imageUrl: 'https://placehold.co/100x100.png',
  },
];

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

const createDate = (daysOffset: number, hour: number, minute: number = 0): Date => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
};

export const placeholderAppointments: Appointment[] = [
  {
    id: 'appt1',
    salonId: 'salon1',
    professionalId: 'prof1',
    clientName: 'Mike Ross',
    clientPhone: '+15550001111',
    serviceName: 'Men\'s Haircut',
    startTime: createDate(0, 10, 0), // Today at 10:00 AM
    endTime: createDate(0, 10, 45), // Today at 10:45 AM
    status: 'scheduled',
    paymentStatus: 'unpaid',
    price: 30,
    paymentMethod: ''
  },
  {
    id: 'appt2',
    salonId: 'salon1',
    professionalId: 'prof2',
    clientName: 'Rachel Zane',
    clientPhone: '+15552223333',
    serviceName: 'Fade Haircut',
    startTime: createDate(0, 14, 0), // Today at 2:00 PM
    endTime: createDate(0, 15, 0), // Today at 3:00 PM
    status: 'confirmed',
    paymentStatus: 'paid',
    price: 40,
    paymentMethod: ''
  },
  {
    id: 'appt3',
    salonId: 'salon2',
    professionalId: 'prof3',
    clientName: 'Donna Paulsen',
    clientPhone: '+15554445555',
    serviceName: 'Hair Coloring',
    startTime: createDate(1, 11, 0), // Tomorrow at 11:00 AM
    endTime: createDate(1, 13, 0), // Tomorrow at 1:00 PM
    status: 'scheduled',
    notes: 'Wants a vibrant red color.',
    price: 120,
    paymentMethod: ''
  },
];

export const placeholderTimeSlots: TimeSlot[] = [
  // Salon 1 - Prof 1 - Today
  { id: 'ts1', salonId: 'salon1', professionalId: 'prof1', startTime: createDate(0, 9, 0), endTime: createDate(0, 9, 45), isBooked: false },
  // 10:00 AM slot is booked by appt1
  { id: 'ts2', salonId: 'salon1', professionalId: 'prof1', startTime: createDate(0, 11, 0), endTime: createDate(0, 11, 45), isBooked: false },
  { id: 'ts3', salonId: 'salon1', professionalId: 'prof1', startTime: createDate(0, 12, 0), endTime: createDate(0, 12, 45), isBooked: false },

  // Salon 1 - Prof 2 - Today
  { id: 'ts4', salonId: 'salon1', professionalId: 'prof2', startTime: createDate(0, 13, 0), endTime: createDate(0, 14, 0), isBooked: false },
  // 2:00 PM slot is booked by appt2
  { id: 'ts5', salonId: 'salon1', professionalId: 'prof2', startTime: createDate(0, 15, 0), endTime: createDate(0, 16, 0), isBooked: true }, // Manually set as booked for demo
  { id: 'ts6', salonId: 'salon1', professionalId: 'prof2', startTime: createDate(0, 16, 0), endTime: createDate(0, 17, 0), isBooked: false },
  
  // Salon 2 - Prof 3 - Tomorrow
  { id: 'ts7', salonId: 'salon2', professionalId: 'prof3', startTime: createDate(1, 9, 0), endTime: createDate(1, 10, 0), isBooked: false },
  { id: 'ts8', salonId: 'salon2', professionalId: 'prof3', startTime: createDate(1, 10, 0), endTime: createDate(1, 11, 0), isBooked: false },
  // 11:00 AM slot is booked by appt3
];
