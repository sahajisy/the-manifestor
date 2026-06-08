import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    console.log("Fetching users...");
    const usersRef = collection(db, 'users');
    const qUsers = query(usersRef, where('weeklyReport', '==', true));
    const usersSnap = await getDocs(qUsers);

    if (usersSnap.empty) {
      console.log('No users opted in for weekly reports');
      return;
    }
    
    console.log(`Found ${usersSnap.docs.length} users.`);
    for (const doc of usersSnap.docs) {
      console.log(doc.id, doc.data());
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
