import { initializeApp } from 'firebase/app';
import { getFunctions } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate that all required environment variables are present
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error(
        'Missing required Firebase configuration. Please check your .env file and ensure all VITE_FIREBASE_* variables are set.'
    );
}

const app = initializeApp(firebaseConfig);
export const functions = getFunctions(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence for Firestore
// This allows the app to work offline and sync when connection is restored
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn('Firestore persistence: Multiple tabs open, persistence enabled in another tab');
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all features required for persistence
      console.warn('Firestore persistence: Not available in this browser');
    } else {
      console.warn('Firestore persistence: Failed to enable', err);
    }
    // App will still work, just without offline persistence
  });
}

// Uncomment the following line to use the local emulator during development
// connectFunctionsEmulator(functions, "localhost", 5001);
