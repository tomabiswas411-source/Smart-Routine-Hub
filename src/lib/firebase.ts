import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAkTx0rReakHvvCvzl6Z3F00FhGw0WYV5I",
  authDomain: "ice-ru-management.firebaseapp.com",
  projectId: "ice-ru-management",
  storageBucket: "ice-ru-management.firebasestorage.app",
  messagingSenderId: "110405692289",
  appId: "1:110405692289:web:8101e33373ea6f1e901680",
  measurementId: "G-2VYJRK93E4"
};

// Initialize Firebase only if it hasn't been initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
