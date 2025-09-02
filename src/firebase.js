import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  databaseURL: 'https://esc1-11586-default-rtdb.europe-west1.firebasedatabase.app/',
  // Add other config fields if needed (apiKey, authDomain, etc.)
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
