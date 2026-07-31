import type { FirebaseOptions } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

const config: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const hasFirebaseConfig = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
export const isEmulatorMode = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';
export const runtimeMode = hasFirebaseConfig ? (isEmulatorMode ? 'emulator' : 'firebase') : 'sample';

export interface FirebaseRuntime {
  auth: Auth | null;
  db: Firestore | null;
  authApi: typeof import('firebase/auth') | null;
  firestoreApi: typeof import('firebase/firestore') | null;
}

let runtimePromise: Promise<FirebaseRuntime> | null = null;

export const getFirebaseServices = (): Promise<FirebaseRuntime> => {
  if (!hasFirebaseConfig) {
    return Promise.resolve({ auth: null, db: null, authApi: null, firestoreApi: null });
  }
  if (runtimePromise) return runtimePromise;

  runtimePromise = Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore'),
  ]).then(([appApi, authApi, firestoreApi]) => {
    const app = appApi.getApps().length ? appApi.getApp() : appApi.initializeApp(config);
    const auth = authApi.getAuth(app);
    const db = firestoreApi.getFirestore(app);

    if (isEmulatorMode) {
      authApi.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      firestoreApi.connectFirestoreEmulator(db, '127.0.0.1', 8080);
    }
    return { auth, db, authApi, firestoreApi };
  });

  return runtimePromise;
};
