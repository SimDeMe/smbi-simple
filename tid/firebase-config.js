// Firebase konfiguration
//
// Kræver i Firebase Console (console.firebase.google.com → smbi-tid):
//
// 1. Authentication → Sign-in method → Google: Aktivér
// 2. Authentication → Settings → Authorized domains: tilføj smbi.dk + localhost
// 3. Firestore Database → Opret database (production mode)
// 4. Firestore → Rules → indsæt:
//
//    rules_version = '2';
//    service cloud.firestore {
//      match /databases/{database}/documents {
//        match /users/{userId}/{document=**} {
//          allow read, write: if request.auth != null && request.auth.uid == userId;
//        }
//      }
//    }

export const firebaseConfig = {
  apiKey: "AIzaSyC10codP3ACNcZVhxI-NUhsMIMfsfgFKh8",
  authDomain: "smbi-tid.firebaseapp.com",
  projectId: "smbi-tid",
  storageBucket: "smbi-tid.firebasestorage.app",
  messagingSenderId: "700515277704",
  appId: "1:700515277704:web:ac4582a51e7204cb42383d"
};
