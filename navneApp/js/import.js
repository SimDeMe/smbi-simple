import { createStudent, getStudentsByClass } from "./students.js";
import { compressImage, addPhoto } from "./photos.js";

export function parseFileName(filename) {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/_/g, ' ')
    .trim();
}

export async function importFiles(uid, classId, files, onProgress) {
  const existingStudents = await getStudentsByClass(uid, classId);
  const results = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const name = parseFileName(file.name);
    onProgress && onProgress(i + 1, files.length, name);

    const blob = await compressImage(file);

    // Findes eleven i forvejen, lægges billedet til som ekstra foto
    const existing = existingStudents.find(
      s => s.name.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      existing.photoUrls = await addPhoto(uid, existing, blob);
      results.push({ id: existing.id, name, isNew: false });
    } else {
      const studentId = await createStudent(uid, { name, classId, photoUrls: [] });
      const student = { id: studentId, name, photoUrls: [] };
      student.photoUrls = await addPhoto(uid, student, blob);
      existingStudents.push({ ...student, classId });
      results.push({ id: studentId, name, isNew: true });
    }
  }

  return results;
}
