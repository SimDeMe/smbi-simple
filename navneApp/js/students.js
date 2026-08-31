import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db } from "./firebase-config.js";

export async function getStudentsByClass(uid, classId) {
  const q = query(collection(db, `teachers/${uid}/students`), where("classId", "==", classId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllStudents(uid) {
  const snap = await getDocs(collection(db, `teachers/${uid}/students`));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getStudent(uid, studentId) {
  const snap = await getDoc(doc(db, `teachers/${uid}/students/${studentId}`));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createStudent(uid, data) {
  const ref = await addDoc(collection(db, `teachers/${uid}/students`), {
    name: data.name,
    gender: data.gender || "other",
    classId: data.classId,
    hints: "",
    nameAnchor: "",
    photoUrls: data.photoUrls || [],
    level: 1,
    nextReview: new Date(),
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    confusedWith: [],
    createdAt: serverTimestamp(),
    lastSeen: null
  });
  return ref.id;
}

export async function updateStudent(uid, studentId, data) {
  await updateDoc(doc(db, `teachers/${uid}/students/${studentId}`), data);
}

export async function deleteStudent(uid, studentId) {
  await deleteDoc(doc(db, `teachers/${uid}/students/${studentId}`));
}
