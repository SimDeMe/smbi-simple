// Firebase-konfiguration for Studiekort
//
// Bruger samme Firebase-projekt som navneApp (navne-app-83f90), hvor
// Google-login allerede er aktiveret for smbi.dk.
//
// Kræver i Firebase Console (console.firebase.google.com → navne-app-83f90):
// Firestore → Rules → tilføj denne match-blok ved siden af de eksisterende:
//
//    match /quizSets/{setId} {
//      allow read: if true;
//      allow create: if request.auth != null
//                    && request.resource.data.ownerUid == request.auth.uid;
//      allow update, delete: if request.auth != null
//                    && resource.data.ownerUid == request.auth.uid;
//    }

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB7xTPuxTTzcJKg-rovOp8sS-h9Xm-mLpc",
  authDomain: "navne-app-83f90.firebaseapp.com",
  projectId: "navne-app-83f90",
  storageBucket: "navne-app-83f90.firebasestorage.app",
  messagingSenderId: "635887011430",
  appId: "1:635887011430:web:1bff8a94876b714a57cfa7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
