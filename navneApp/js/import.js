import { createStudent, uploadPhoto, updateStudent, getStudentsByClass, getStudent } from "./students.js";

export function parseFileName(filename) {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/_/g, ' ')
    .trim();
}

export function compressImage(file, maxSize = 400) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url);
        resolve(blob);
      }, 'image/jpeg', 0.85);
    };
    img.src = url;
  });
}

export async function importFiles(uid, classId, files, onProgress) {
  const existingStudents = await getStudentsByClass(uid, classId);
  const results = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const name = parseFileName(file.name);
    onProgress && onProgress(i + 1, files.length, name);

    const blob = await compressImage(file);

    // Check for duplicate name
    const existing = existingStudents.find(
      s => s.name.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      // Add extra photo to existing student
      const url = await uploadPhoto(uid, existing.id, blob);
      await updateStudent(uid, existing.id, {
        photoUrls: [...(existing.photoUrls || []), url]
      });
      results.push({ id: existing.id, name, isNew: false });
    } else {
      const studentId = await createStudent(uid, { name, classId, photoUrls: [] });
      const url = await uploadPhoto(uid, studentId, blob);
      await updateStudent(uid, studentId, { photoUrls: [url] });
      results.push({ id: studentId, name, isNew: true });
    }
  }

  return results;
}
