import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';

// Environment variables from Vite (.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// Check if Firebase credentials are fully configured
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey !== "your-api-key"
);

// Initialize Firebase App
const app = !getApps().length 
  ? initializeApp(
      isFirebaseConfigured 
        ? firebaseConfig 
        : {
            apiKey: "demo-dummy-key",
            authDomain: "udhaar-book-demo.firebaseapp.com",
            projectId: "udhaar-book-demo",
            storageBucket: "udhaar-book-demo.appspot.com",
            messagingSenderId: "123456789",
            appId: "1:123456789:web:demo",
          }
    )
  : getApp();

// Auth with local persistence so users stay logged in on laptop & phone
export const auth = getAuth(app);
try {
  setPersistence(auth, browserLocalPersistence);
} catch (e) {
  console.warn("Could not set auth persistence:", e);
}

// Firestore with offline IndexedDB caching for PWA offline support
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export default app;
