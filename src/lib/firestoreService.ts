
import { db } from '@/lib/firebase';
import type { Salon } from '@/lib/types';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';

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
  contactNumber: string = "" // Default to empty string if not provided
): Promise<string> => {
  const salonSlug = generateSlug(salonName);
  const salonRef = doc(db, 'salons', adminUserId); // Use adminUserId as salon document ID
  const newSalon: Salon = {
    id: adminUserId, // The document ID is the salon's ID
    adminUserId,
    name: salonName,
    slug: salonSlug,
    email: email,
    contactNumber: contactNumber, // Make sure this is provided or handled
    address: "", // Initialize with empty address
    description: "", // Initialize with empty description
  };
  await setDoc(salonRef, newSalon);
  console.log(`Salon created for user ${adminUserId} with slug ${salonSlug}`);
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
  // Ensure slug is regenerated if salonName changes
  const updateData = { ...data };
  if (data.name && data.name !== (await getDoc(salonRef)).data()?.name) {
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
