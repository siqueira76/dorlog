import { initializeApp } from "firebase/app";
import { 
  initializeAuth, 
  indexedDBLocalPersistence, 
  browserLocalPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported as isMessagingSupported, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || import.meta.env.FIREBASE_STORAGE_BUCKET || `${import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.FIREBASE_PROJECT_ID || 'dorlog-fibro-diario'}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || import.meta.env.FIREBASE_APP_ID,
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with robust persistence for mobile redirects
// indexedDBLocalPersistence is more reliable than localStorage on iOS Safari and Android PWA
// This prevents auth state loss during cross-origin redirects (Google OAuth)
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  popupRedirectResolver: browserPopupRedirectResolver,
});

export const db = getFirestore(app);
export const storage = getStorage(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Initialize Firebase Cloud Messaging (FCM)
// Only initialize if messaging is supported (requires HTTPS or localhost)
let messaging: Messaging | null = null;

// Async initialization function for FCM
export async function initializeMessaging(): Promise<Messaging | null> {
  if (messaging) {
    return messaging;
  }
  
  try {
    const supported = await isMessagingSupported();
    if (supported) {
      messaging = getMessaging(app);
      console.log('✅ Firebase Cloud Messaging inicializado');
      return messaging;
    } else {
      console.log('⚠️ Firebase Cloud Messaging não suportado neste navegador');
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase Cloud Messaging:', error);
    return null;
  }
}

// Getter for messaging instance
export function getMessagingInstance(): Messaging | null {
  return messaging;
}

export default app;
