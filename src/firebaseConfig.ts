import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 1. Config Setup
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// 2. Validation Logic (To prevent crashes if env is missing)
const isPlaceholder = (v?: string) => !v || /(YOUR(_[A-Z_]+)?|your-project-id)/i.test(String(v));
const missing: string[] = [];
if (isPlaceholder(firebaseConfig.apiKey)) missing.push('VITE_FIREBASE_API_KEY');
if (isPlaceholder(firebaseConfig.authDomain)) missing.push('VITE_FIREBASE_AUTH_DOMAIN');
if (isPlaceholder(firebaseConfig.projectId)) missing.push('VITE_FIREBASE_PROJECT_ID');
if (isPlaceholder(firebaseConfig.appId)) missing.push('VITE_FIREBASE_APP_ID');

let app: ReturnType<typeof initializeApp> | null = null;

if (missing.length === 0) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (err) {
    console.warn('[Firebase] Initialization failed. Check env.', err);
  }
} else {
  console.warn('[Firebase] Missing/invalid env config. Skipping Firebase initialization. Missing:', missing.join(', '));
}

// 3. Exports
export const auth = app ? getAuth(app) : null as any;
export const db = app ? getFirestore(app) : null as any;

// Storage bucket fix (Preserved from your code)
const rawBucket = firebaseConfig.storageBucket || '';
const normalizedBucket = rawBucket.endsWith('.firebasestorage.app') ? `${firebaseConfig.projectId}.appspot.com` : rawBucket;
export const storage = app ? (normalizedBucket ? getStorage(app, `gs://${normalizedBucket}`) : getStorage(app)) : null as any;
export const isFirebaseReady = Boolean(app);
export default app;

// 4. App Check Initialization (Updated & Merged Section)
if (app) {
  // Key ကို .env ကနေယူပါမယ် (VITE_RECAPTCHA_SITE_KEY သုံးထားပါတယ်)
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  if (siteKey) {
    // Localhost (DEV mode) ဖြစ်ရင် Debug Token ဖွင့်ပါမယ်
    if (import.meta.env.DEV) {
      // @ts-ignore
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      console.log('App Check debug token enabled for localhost');
    }

    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (err) {
      console.warn('App Check initialization failed:', err);
    }
  } else {
    console.warn('VITE_RECAPTCHA_SITE_KEY is missing in .env. App Check not initialized.');
  }
}