export function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export function updateSRS(student, quality) {
  if (quality >= 3) {
    if (student.repetitions === 0) student.interval = 1;
    else if (student.repetitions === 1) student.interval = 6;
    else student.interval = Math.round(student.interval * student.easeFactor);
    student.repetitions += 1;
  } else {
    student.repetitions = 0;
    student.interval = 1;
  }

  student.easeFactor = Math.max(
    1.3,
    student.easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );

  student.nextReview = daysFromNow(student.interval);
  return student;
}

export function qualityFromResult({ correct, usedHint, responseTime }) {
  if (!correct) return 1;
  if (usedHint) return 3;
  if (responseTime < 3000) return 5;
  return 4;
}
