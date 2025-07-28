
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Debug: Log environment variables
console.log('Environment variables:', {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY ? '***' : 'MISSING',
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID ? '***' : 'MISSING',
  VITE_SUPER_ADMIN_EMAIL: import.meta.env.VITE_SUPER_ADMIN_EMAIL ? '***' : 'MISSING',
  VITE_SUPER_ADMIN_PASSWORD: import.meta.env.VITE_SUPER_ADMIN_PASSWORD ? '***' : 'MISSING'
});

// Firebase configuration using ONLY environment variables - no hardcoded fallbacks
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

console.log('Firebase config:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? '***' : 'MISSING',
  appId: firebaseConfig.appId ? '***' : 'MISSING'
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
