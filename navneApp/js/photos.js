// Elevbilleder: komprimering og lagring.
//
// Billederne ligger i Firebase Storage. Cloud Storage kræver Blaze-planen — på
// Spark-planen afviser spanden alle kald (402/403), og SDK'et melder det som
// "storage/quota-exceeded". Sker netop det, falder appen tilbage på at lægge
// det komprimerede billede ind i elevens Firestore-dokument som data-URL.
// Begge dele er strenge, der kan sættes direkte som <img src>, så resten af
// appen mærker ingen forskel — og Firestore er med på begge planer.
//
// Reserven dækker kun kvotefejlen, altså planen. Enhver anden Storage-fejl er
// en opsætningsfejl og skal fejle synligt, ikke skjules bag en omvej.

import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";
import { storage } from "./firebase-config.js";
import { getStudent, updateStudent } from "./students.js";
import { showToast } from "./ui.js";

// Et Firestore-dokument må højst fylde 1 MiB. Resten af elevens felter
// (navn, hints, srs-tal) fylder småt, så billederne får 700 kB at løbe på.
const PLADS_TIL_BILLEDER = 700_000;
// Base64 fylder 4/3 af selve filen, så ~66 kB JPEG bliver til ~88 kB tekst.
const MAX_BLOB = 66_000;

// Slås fra første gang spanden melder kvotefejl, så vi kun spilder ét kald.
let brugStorage = true;

// ── Komprimering ─────────────────────────────────────────────────────────────

function tegn(img, maxSize, kvalitet) {
  const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise(res => canvas.toBlob(res, 'image/jpeg', kvalitet));
}

// Skalerer til maxSize px og skruer ned for kvaliteten, indtil filen er under
// maxBytes — et billede skal kunne ligge i et Firestore-dokument.
export function compressImage(file, maxSize = 400, maxBytes = MAX_BLOB) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Kunne ikke læse billedet "${file.name}". Gem det som JPEG eller PNG og prøv igen.`));
    };
    img.onload = async () => {
      URL.revokeObjectURL(url);
      try {
        for (const kvalitet of [0.85, 0.7, 0.6, 0.5]) {
          const blob = await tegn(img, maxSize, kvalitet);
          if (blob && blob.size <= maxBytes) return resolve(blob);
        }
        // Stadig for stort — så må opløsningen ned.
        const blob = await tegn(img, Math.round(maxSize * 0.65), 0.5);
        if (!blob) throw new Error('tom canvas');
        resolve(blob);
      } catch (e) {
        reject(new Error(`Kunne ikke behandle billedet "${file.name}": ${e.message}`));
      }
    };
    img.src = url;
  });
}

function blobTilDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const læser = new FileReader();
    læser.onload = () => resolve(læser.result);
    læser.onerror = () => reject(new Error('Kunne ikke omdanne billedet til data-URL.'));
    læser.readAsDataURL(blob);
  });
}

// ── Lagring ──────────────────────────────────────────────────────────────────

// Alt andet end kvotefejlen betyder, at Storage er sat forkert op — og så skal
// det larme. Ville reserven også dække de fejl, ville appen se ud til at virke,
// mens Storage aldrig blev brugt, og det er ikke til at gennemskue bagefter.
function forklarStorageFejl(e) {
  switch (e?.code) {
    case 'storage/unauthorized':
      return 'Storage afviste billedet: reglerne giver ikke adgang. Tjek Firebase Console → Storage → Rules.';
    case 'storage/bucket-not-found':
    case 'storage/project-not-found':
      return 'Storage-spanden findes ikke endnu. Opret den i Firebase Console → Storage.';
    case 'storage/unauthenticated':
      return 'Du er ikke logget ind længere. Log ind igen, og prøv forfra.';
    case 'storage/retry-limit-exceeded':
      return 'Uploaden gav op undervejs. Tjek forbindelsen, og prøv igen.';
    default:
      return `Billedet kunne ikke uploades (${e?.code || 'ukendt fejl'}): ${e?.message || ''}`.trim();
  }
}

async function gemBillede(uid, studentId, blob) {
  if (brugStorage) {
    try {
      const storageRef = ref(storage, `teachers/${uid}/students/${studentId}/${Date.now()}.jpg`);
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (e) {
      // Kun kvotefejlen — dvs. projektet er på Spark-planen, hvor spanden er
      // lukket uanset hvad — udløser reserven.
      if (e?.code !== 'storage/quota-exceeded') throw new Error(forklarStorageFejl(e));
      brugStorage = false;
      console.info('Firebase Storage er lukket (%s) — billederne gemmes i Firestore i stedet.', e.code);
      showToast('Firebase Storage er lukket for projektet. Billederne gemmes i databasen i stedet.');
    }
  }
  return await blobTilDataUrl(blob);
}

function fylde(urls) {
  return urls.reduce((n, u) => n + (u.startsWith('data:') ? u.length : 0), 0);
}

// Lægger et billede til eleven og returnerer den opdaterede liste.
// `student` skal have mindst { id, name, photoUrls }.
export async function addPhoto(uid, student, blob) {
  const url = await gemBillede(uid, student.id, blob);
  const photoUrls = [...(student.photoUrls || []), url];
  if (fylde(photoUrls) > PLADS_TIL_BILLEDER) {
    throw new Error(`Der er ikke plads til flere billeder af ${student.name || 'eleven'}. Slet et af de gamle først.`);
  }
  await updateStudent(uid, student.id, { photoUrls });
  return photoUrls;
}

// Fjerner ét billede fra eleven og returnerer den opdaterede liste.
// To ens billeder giver den samme data-URL, så der fjernes kun den første
// forekomst — ellers ville et klik slette dem begge.
export async function removePhoto(uid, studentId, url) {
  if (!url.startsWith('data:')) {
    try { await deleteObject(ref(storage, url)); } catch {}
  }
  const student = await getStudent(uid, studentId);
  if (!student) return [];
  const photoUrls = [...(student.photoUrls || [])];
  const plads = photoUrls.indexOf(url);
  if (plads === -1) return photoUrls;
  photoUrls.splice(plads, 1);
  await updateStudent(uid, studentId, { photoUrls });
  return photoUrls;
}
