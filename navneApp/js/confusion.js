import { doc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db } from "./firebase-config.js";

export async function analyzeConfusion(uid, results) {
  const knownIds = new Set(results.map(r => r.studentId));
  const confusionMap = {};
  for (const r of results) {
    if (!r.correct && r.answeredWith && r.answeredWith !== r.studentId && knownIds.has(r.answeredWith)) {
      if (!confusionMap[r.studentId]) confusionMap[r.studentId] = [];
      confusionMap[r.studentId].push(r.answeredWith);
    }
  }

  // Count cross-confusions: if A->B appears more than once across all sessions we add them
  // Here we just add any confusion pair from this session and let Firestore track history
  const updates = [];
  for (const [studentId, confusedWithList] of Object.entries(confusionMap)) {
    for (const otherId of confusedWithList) {
      updates.push(
        updateDoc(doc(db, `teachers/${uid}/students/${studentId}`), {
          confusedWith: arrayUnion(otherId)
        }),
        updateDoc(doc(db, `teachers/${uid}/students/${otherId}`), {
          confusedWith: arrayUnion(studentId)
        })
      );
    }
  }
  await Promise.all(updates);
}
