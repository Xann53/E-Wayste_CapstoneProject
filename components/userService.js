//Get userId of user ( reusable )
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase_config';

export const fetchUserId = async () => {
  try {
    const userQuerySnapshot = await getDocs(collection(db, "users"));
    const userDoc = userQuerySnapshot.docs[0]; // Assuming there is only one user for simplicity
    return userDoc.id;
  } catch (error) {
    console.error("Error fetching user ID", error);
    return null;
  }
};
