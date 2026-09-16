// Shared Firebase bootstrap. Imported by admin.js and validate.js.
// Uses the Firebase v10 modular SDK straight from Google's CDN —
// no npm install, no build step needed.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { firebaseConfig, SITE_BASE_URL } from "./firebase-config.js";

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, writeBatch,
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
  SITE_BASE_URL
};

export const CERT_COLLECTION = "certificates";

// Builds the QR / verification URL for a given serial number.
export function buildValidationUrl(serialNumber){
  return `${SITE_BASE_URL}/verify/${encodeURIComponent(serialNumber)}`;
}
