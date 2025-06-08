import { db } from '@/lib/firebase';
import type { Salon, Professional } from '@/lib/types';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, limit, addDoc } from 'firebase/firestore';

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


