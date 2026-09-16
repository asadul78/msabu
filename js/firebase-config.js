// ============================================================
// EDIT THIS FILE — it is the only file you must customize.
// ============================================================

// 1. Go to https://console.firebase.google.com → your project
//    → ⚙️ Project settings → General → "Your apps" → Web app
//    → copy the firebaseConfig object it gives you and paste it below.
export const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};

// 2. The web address where this site will live once published on
//    GitHub Pages, with NO trailing slash. Examples:
//      "https://yourusername.github.io/cert-verify"   (project site)
//      "https://yourusername.github.io"               (user site)
// This is used to build the QR code link, e.g.
//    SITE_BASE_URL + "/verify/" + serialNumber
export const SITE_BASE_URL = "https://yourusername.github.io/cert-verify";
