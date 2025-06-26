
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC7a43eeu9vH4fGeQfUuBpphpW7zuE8dBA",
  authDomain: "test-mindleap.firebaseapp.com",
  projectId: "test-mindleap",
  storageBucket: "test-mindleap.firebasestorage.app",
  messagingSenderId: "402749246470",
  appId: "1:402749246470:web:c3411e9ccde8a419fbc787"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
