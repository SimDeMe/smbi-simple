import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";
import { db, storage } from "./firebase-config.js";

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

export async function uploadPhoto(uid, studentId, blob) {
  const path = `teachers/${uid}/students/${studentId}/${Date.now()}.jpg`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
}

export async function deletePhoto(uid, studentId, url) {
  // Extract path from URL and delete from storage
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch {}
  const student = await getStudent(uid, studentId);
  if (student) {
    await updateStudent(uid, studentId, {
      photoUrls: student.photoUrls.filter(u => u !== url)
    });
  }
}
