import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const isPlaceholder = (v?: string) => !v || /(YOUR(_[A-Z_]+)?|your-project-id)/i.test(String(v))
const missing: string[] = []
if (isPlaceholder(firebaseConfig.apiKey)) missing.push('VITE_FIREBASE_API_KEY')
if (isPlaceholder(firebaseConfig.authDomain)) missing.push('VITE_FIREBASE_AUTH_DOMAIN')
if (isPlaceholder(firebaseConfig.projectId)) missing.push('VITE_FIREBASE_PROJECT_ID')
if (isPlaceholder(firebaseConfig.appId)) missing.push('VITE_FIREBASE_APP_ID')

let app: ReturnType<typeof initializeApp> | null = null
if (missing.length === 0) {
  try {
    app = initializeApp(firebaseConfig)
  } catch (err) {
    console.warn('[Firebase] Initialization failed. Check env.', err)
  }
} else {
  console.warn('[Firebase] Missing/invalid env config. Skipping Firebase initialization. Missing:', missing.join(', '))
}

export const auth = app ? getAuth(app) : null as any
export const db = app ? getFirestore(app) : null as any
const rawBucket = firebaseConfig.storageBucket || ''
const normalizedBucket = rawBucket.endsWith('.firebasestorage.app') ? `${firebaseConfig.projectId}.appspot.com` : rawBucket
export const storage = app ? (normalizedBucket ? getStorage(app, `gs://${normalizedBucket}`) : getStorage(app)) : null as any
export const isFirebaseReady = Boolean(app)
export default app

if (app) {
  const siteKey = (import.meta as any).env?.VITE_FIREBASE_APPCHECK_KEY || ''
  const debugToken = (import.meta as any).env?.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN || ''
  try {
    if (import.meta.env.DEV && !(import.meta as any).env?.VITE_FIREBASE_APPCHECK_DISABLE) {
      if (debugToken) {
        ;(self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken
        try { window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'info', title: 'App Check (Debug)', message: 'Using provided debug token from env.' } })) } catch {}
      } else if (!siteKey) {
        ;(self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true
        try { window.dispatchEvent(new CustomEvent('app:notify', { detail: { type: 'info', title: 'App Check (Debug)', message: 'A new debug token was generated. Allowlist it in Firebase Console.' } })) } catch {}
      }
      initializeAppCheck(app, { provider: new ReCaptchaV3Provider(siteKey || 'unused'), isTokenAutoRefreshEnabled: true })
    } else if (siteKey) {
      initializeAppCheck(app, { provider: new ReCaptchaV3Provider(siteKey), isTokenAutoRefreshEnabled: true })
    }
  } catch {}
}