// Inizializzazione Firebase, "opzionale": se le variabili d'ambiente non ci
// sono, l'app resta in modalità locale (localStorage) senza errori. Con la
// config, si attivano le sessioni condivise in tempo reale via Firestore.

import { getApp, getApps, initializeApp } from "firebase/app";
import { Firestore, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Config valida = almeno apiKey, projectId e appId.
export const cloudConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

let _db: Firestore | null = null;

export function getDb(): Firestore | null {
  if (!cloudConfigured) return null;
  if (_db) return _db;
  try {
    const app = getApps().length
      ? getApp()
      : initializeApp(firebaseConfig as Record<string, string>);
    _db = getFirestore(app);
    return _db;
  } catch {
    return null;
  }
}
