// frontend/src/firebase.js
// Firebase config değerlerini console.firebase.google.com'dan al:
// Project Settings → Your apps → Web app → firebaseConfig

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBSQlqjcc7YOHsA38mYT09aFIs-DHf_mBA",
  authDomain: "greenlens-17ff7.firebaseapp.com",
  projectId: "greenlens-17ff7",
  storageBucket: "greenlens-17ff7.firebasestorage.app",
  messagingSenderId: "1064197848961",
  appId: "1:1064197848961:web:bd380b1bd5348a67cff280",
  measurementId: "G-S7PSZM921V"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
