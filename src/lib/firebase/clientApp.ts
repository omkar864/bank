// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAVcuMW_gFBt11ArYStki2Wk_znLCSZW50",
  authDomain: "shagunam-c0d63.firebaseapp.com",
  projectId: "shagunam-c0d63",
  storageBucket: "shagunam-c0d63.firebasestorage.app",
  messagingSenderId: "396365816571",
  appId: "1:396365816571:web:45fcb61e1b0aba38fd865e"
};

// Initialize Firebase for SSR
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
