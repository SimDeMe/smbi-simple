import {
  collection, doc, addDoc, getDocs, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db } from "./firebase-config.js";

export async function getClasses(uid) {
  const snap = await getDocs(collection(db, `teachers/${uid}/classes`));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createClass(uid, name) {
  const ref = await addDoc(collection(db, `teachers/${uid}/classes`), {
    name,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function deleteClass(uid, classId) {
  await deleteDoc(doc(db, `teachers/${uid}/classes/${classId}`));
}
