// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCtUZiOilNlx9jmHVNkXPJIXehr7xlA9lc",
  authDomain: "esc1-11586.firebaseapp.com",
  databaseURL: "https://esc1-11586-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "esc1-11586",
  storageBucket: "esc1-11586.firebasestorage.app",
  messagingSenderId: "228938913020",
  appId: "1:228938913020:web:36c7462d87e9dd81197379",
  measurementId: "G-9G97MK45Y2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

export { db };