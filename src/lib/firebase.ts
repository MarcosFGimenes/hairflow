
// SERVER-SIDE CHECK: Log environment variables when this module is loaded on the server.
// This will appear in your Next.js server terminal, not the browser console.
if (typeof window === 'undefined') {
  console.log("--- SERVER-SIDE Firebase Env Check (Module Load) ---");
  console.log("SERVER: process.env.NEXT_PUBLIC_FIREBASE_API_KEY:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  console.log("SERVER: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
  console.log("SERVER: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  console.log("----------------------------------------------------");
}

// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration, now read from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// CLIENT-SIDE CHECK: Log environment variables when this code runs in the browser.
// This will appear in the browser's developer console.
if (typeof window !== 'undefined') {
  console.log("--- CLIENT-SIDE Firebase Env Check (Runtime) ---");
  const clientApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const clientAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const clientProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  console.log("CLIENT: process.env.NEXT_PUBLIC_FIREBASE_API_KEY:", clientApiKey);
  console.log("CLIENT: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", clientAuthDomain);
  console.log("CLIENT: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID:", clientProjectId);

  if (!clientApiKey) {
    console.error("CLIENT-SIDE ERROR: NEXT_PUBLIC_FIREBASE_API_KEY is missing or undefined in the browser. Check .env.local and server restart.");
  } else if (typeof clientApiKey !== 'string' || clientApiKey.trim() === '') {
    console.error("CLIENT-SIDE ERROR: NEXT_PUBLIC_FIREBASE_API_KEY is not a valid string or is empty in the browser. Value:", `"${clientApiKey}"`);
  }
  console.log("--------------------------------------------------");
  console.log("CLIENT: Full firebaseConfig object being used:", {
    apiKey: firebaseConfig.apiKey ? '********' : firebaseConfig.apiKey, // Mask API key in log
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    // Add other properties if needed for debugging, but be careful with sensitive info
  });
}

// Initialize Firebase
let app: FirebaseApp;

// Pre-check before initializing to give clearer errors if config is bad
if (!firebaseConfig.apiKey || typeof firebaseConfig.apiKey !== 'string' || firebaseConfig.apiKey.trim() === '') {
  const problemSource = typeof window === 'undefined' ? "SERVER-SIDE" : "CLIENT-SIDE";
  const message = `${problemSource} PRE-CHECK FAILED: Firebase API key is problematic. Value: "${firebaseConfig.apiKey}", Type: ${typeof firebaseConfig.apiKey}. Ensure NEXT_PUBLIC_FIREBASE_API_KEY is correctly set in .env.local and the server was restarted.`;
  console.error(message);

  if (firebaseConfig.apiKey === undefined || firebaseConfig.apiKey === null) {
    if (typeof window === 'undefined') { // Server-side
      throw new Error("FATAL: Firebase API Key is completely missing. Cannot initialize Firebase on server.");
    } else { // Client-side
      // Display a user-friendly message or throw an error to stop execution if desired
      // For now, just logging extensively. The initializeApp below will also fail.
      console.error("FATAL CLIENT ERROR: Firebase API Key is completely missing. Firebase will not work.");
    }
  }
}


if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    if (typeof window !== 'undefined') {
      console.log("CLIENT: Firebase app initialized successfully.");
    } else {
      console.log("SERVER: Firebase app initialized successfully.");
    }
  } catch (error) {
    const problemSource = typeof window === 'undefined' ? "SERVER-SIDE" : "CLIENT-SIDE";
    console.error(`${problemSource} Firebase initializeApp() FAILED. Error:`, error);
    console.error(`${problemSource} This usually means the firebaseConfig object was invalid (often API key). Review env vars and server restart.`);
    throw error; // Re-throw to surface the error
  }
} else {
  app = getApp();
  if (typeof window !== 'undefined') {
    console.log("CLIENT: Firebase app already initialized, getting existing instance.");
  } else {
    console.log("SERVER: Firebase app already initialized, getting existing instance.");
  }
}

const auth = getAuth(app);

export { app, auth };
