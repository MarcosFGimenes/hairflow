
// SERVER-SIDE CHECK: Log environment variables when this module is loaded on the server.
// This will appear in your Next.js server terminal, not the browser console.
if (typeof window === 'undefined') {
  console.log("--- SERVER-SIDE Firebase Env Check (Module Load) ---");
  console.log("SERVER: process.env.NEXT_PUBLIC_FIREBASE_API_KEY:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  console.log("SERVER: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
  console.log("SERVER: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  console.log("----------------------------------------------------");
}

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth"; // Import Auth type
import { getFirestore, type FirebaseFirestore } from "firebase/firestore"; // Import Firestore and its type

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

let app: FirebaseApp;
let authInstance: Auth; // Use a different name to avoid conflict before export
let dbInstance: FirebaseFirestore; // Use a different name

// Pre-check before initializing to give clearer errors if config is bad
if (!firebaseConfig.apiKey || typeof firebaseConfig.apiKey !== 'string' || firebaseConfig.apiKey.trim() === '') {
  const problemSource = typeof window === 'undefined' ? "SERVER-SIDE" : "CLIENT-SIDE";
  const message = `${problemSource} PRE-CHECK FAILED: Firebase API key is problematic. Value: "${firebaseConfig.apiKey}", Type: ${typeof firebaseConfig.apiKey}. Ensure NEXT_PUBLIC_FIREBASE_API_KEY is correctly set in .env.local and the server was restarted.`;
  console.error(message);

  if (firebaseConfig.apiKey === undefined || firebaseConfig.apiKey === null) {
    if (typeof window === 'undefined') { // Server-side
      throw new Error("FATAL: Firebase API Key is completely missing. Cannot initialize Firebase on server.");
    } else { // Client-side
      console.error("FATAL CLIENT ERROR: Firebase API Key is completely missing. Firebase will not work.");
      // For client-side, don't throw, allow app to attempt to render something.
      // Services will be undefined.
    }
  }
}


if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);
    if (typeof window !== 'undefined') {
      console.log("CLIENT: Firebase app and services initialized successfully.");
    } else {
      console.log("SERVER: Firebase app and services initialized successfully.");
    }
  } catch (error) {
    const problemSource = typeof window === 'undefined' ? "SERVER-SIDE" : "CLIENT-SIDE";
    console.error(`${problemSource} Firebase initializeApp() FAILED. Error:`, error);
    console.error(`${problemSource} This usually means the firebaseConfig object was invalid (often API key). Review env vars and server restart.`);
    if (typeof window === 'undefined') {
        throw error; // Re-throw on server to make it obvious
    }
    // On client, app, authInstance, dbInstance will remain undefined if an error occurs here
  }
} else {
  app = getApp();
  authInstance = getAuth(app); // Ensure services are initialized with the existing app
  dbInstance = getFirestore(app);
  if (typeof window !== 'undefined') {
    console.log("CLIENT: Firebase app already initialized, getting existing instance and services.");
  } else {
    console.log("SERVER: Firebase app already initialized, getting existing instance and services.");
  }
}

// CLIENT-SIDE CHECK: Log environment variables when this code runs in the browser.
if (typeof window !== 'undefined') {
  console.log("--- CLIENT-SIDE Firebase Config Check (After Init Attempt) ---");
  const clientApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  console.log("CLIENT: process.env.NEXT_PUBLIC_FIREBASE_API_KEY raw:", `"${clientApiKey}"`);
  if (!clientApiKey || typeof clientApiKey !== 'string' || clientApiKey.trim() === '') {
    console.error("CLIENT-SIDE ERROR: NEXT_PUBLIC_FIREBASE_API_KEY is still problematic after init attempt. Value:", `"${clientApiKey}"`);
  }
  console.log("CLIENT: Full firebaseConfig object being used (API key masked for log):", {
    apiKey: firebaseConfig.apiKey ? '********' : firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
  });
  console.log("CLIENT: `app` instance initialized:", !!app);
  console.log("CLIENT: `authInstance` initialized:", !!authInstance);
  console.log("CLIENT: `dbInstance` initialized:", !!dbInstance);
  console.log("------------------------------------------------------------");
}

// Assign to final exported variables. These might be undefined if initialization failed.
const auth = authInstance;
const db = dbInstance;

export { app, auth, db };
