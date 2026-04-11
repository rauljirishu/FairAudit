import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromCache, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

let app: any;
let auth: any;
let db: any;
let storage: any;
let googleProvider: any;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  storage = getStorage(app);
  googleProvider = new GoogleAuthProvider();
  
  // Connection test as per instructions
  const testConnection = async () => {
    try {
      await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    } catch (error: any) {
      if (error.message?.includes('the client is offline')) {
        console.error("Firebase connection failed: Client is offline or config is invalid.");
      }
    }
  };
  testConnection();
} catch (error) {
  console.error("Firebase initialization failed:", error);
  auth = { 
    onAuthStateChanged: (cb: any) => cb(null), 
    currentUser: null,
    isFallback: true 
  };
  db = { isFallback: true };
  storage = { isFallback: true };
}

export { auth, db, storage, googleProvider };

export const signInWithGoogle = async () => {
  if (auth.isFallback) {
    throw new Error("The cloud backend is currently unavailable. Please use Guest Mode.");
  }
  return signInWithPopup(auth, googleProvider);
};

export const logout = () => {
  if (auth.signOut) return signOut(auth);
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map((provider: any) => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
