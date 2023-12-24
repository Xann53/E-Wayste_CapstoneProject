import { getDocs, collection, query, where } from 'firebase/firestore';
import { db, auth} from '../firebase_config';

export const fetchUserId = async () => {
  try {
    const userQuerySnapshot = await getDocs(
      query(collection(db, 'users'), where('email', '==', auth.currentUser.email))
    );

    if (userQuerySnapshot.docs.length > 0) {
      const userDoc = userQuerySnapshot.docs[0];
      return userDoc.id;
    } else {
      console.error('User not found in the "users" collection.');
      return null;
    }
  } catch (error) {
    console.error('Error fetching user ID', error);
    return null;
  }
};
