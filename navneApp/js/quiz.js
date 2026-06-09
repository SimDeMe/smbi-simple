import { getStudentsByClass, getAllStudents, updateStudent } from "./students.js";
import { updateSRS, qualityFromResult, daysFromNow } from "./srs.js";
import { analyzeConfusion } from "./confusion.js";
import {
  collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db } from "./firebase-config.js";

export async function buildSession(uid, classId) {
  const students = await getStudentsByClass(uid, classId);
  const now = new Date();
  const session = [];

  const due = students.filter(s =>
    s.nextReview && s.nextReview.toDate && s.nextReview.toDate() <= now
  );
  const newStudents = students
    .filter(s => s.repetitions === 0 && !due.find(d => d.id === s.id))
    .slice(0, 5);

  const confusedIds = new Set();
  for (const s of [...due, ...newStudents]) {
    (s.confusedWith || []).forEach(id => confusedIds.add(id));
  }
  const confused = students.filter(s =>
    confusedIds.has(s.id) && !due.find(d => d.id === s.id) && !newStudents.find(n => n.id === s.id)
  );

  session.push(...due, ...newStudents, ...confused);

  // Insert confused pairs adjacent
  return interleaveConfused(session);
}

function interleaveConfused(students) {
  const result = [];
  const used = new Set();
  for (const s of students) {
    if (used.has(s.id)) continue;
    result.push(s);
    used.add(s.id);
    const confused = students.find(o => !used.has(o.id) && (s.confusedWith || []).includes(o.id));
    if (confused) {
      result.push(confused);
      used.add(confused.id);
    }
  }
  return result;
}

export async function getDistractors(uid, correct, allClassStudents) {
  const gender = correct.gender;
  const sameGender = allClassStudents.filter(s => s.id !== correct.id && s.gender === gender);
  let pool = sameGender;

  if (pool.length < 3) {
    const all = await getAllStudents(uid);
    const extra = all.filter(
      s => s.id !== correct.id && s.gender === gender && !pool.find(p => p.id === s.id)
    );
    pool = [...pool, ...extra];
  }

  const shuffled = pool.sort(() => Math.random() - 0.5);
  const count = Math.min(3, shuffled.length);
  return shuffled.slice(0, count);
}

export function pickStimulus(student) {
  const hasPhoto = student.photoUrls && student.photoUrls.length > 0;
  const hasHint = student.hints && student.hints.trim().length > 0;
  if (hasPhoto && hasHint) return Math.random() < 0.5 ? "photo" : "hint";
  if (hasPhoto) return "photo";
  if (hasHint) return "hint";
  return null;
}

export function checkAnswer(student, input) {
  const first = student.name.split(' ')[0].toLowerCase();
  const full = student.name.toLowerCase();
  const answer = input.trim().toLowerCase();
  return answer === first || answer === full;
}

export async function processResult(uid, student, result) {
  const quality = qualityFromResult(result);
  const updated = updateSRS({ ...student }, quality);

  const patch = {
    easeFactor: updated.easeFactor,
    interval: updated.interval,
    repetitions: updated.repetitions,
    nextReview: updated.nextReview,
    lastSeen: new Date()
  };

  if (result.correct && !result.usedHint && student.level === 1) {
    patch.level = 2;
  } else if (!result.correct && student.level === 2) {
    patch.level = 1;
    patch.interval = 1;
    patch.repetitions = 0;
  }

  if (result.usedHint || !result.correct) {
    patch.interval = 1;
  }

  await updateStudent(uid, student.id, patch);
  return patch;
}

export async function saveSession(uid, classId, results) {
  await addDoc(collection(db, `teachers/${uid}/sessions`), {
    classId,
    startedAt: serverTimestamp(),
    completedAt: serverTimestamp(),
    results
  });
  await analyzeConfusion(uid, results);
}
