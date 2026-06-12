import { auth, db } from "./firebase-config.js";
import {
  signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  collection, addDoc, getDocs, query, orderBy,
  doc, updateDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const SETS = "quizSets";

const RULES_HINT = `match /quizSets/{setId} {
  allow read: if true;
  allow create: if request.auth != null
                && request.resource.data.ownerUid == request.auth.uid;
  allow update, delete: if request.auth != null
                && resource.data.ownerUid == request.auth.uid;
}`;

// ── Tilstand ──────────────────────────────────────────────────────────

let currentUser = null;
let sets = [];
let currentSet = null;   // { id, title, description, ownerUid, ownerName, cards }
let editingSetId = null;
let reversed = false;

// ── DOM-hjælpere ──────────────────────────────────────────────────────

const $ = id => document.getElementById(id);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function showView(name) {
  stopMatchTimer();
  document.querySelectorAll(".sk-view").forEach(v => v.classList.remove("active"));
  $("view-" + name).classList.add("active");
  window.scrollTo(0, 0);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function showAlert(containerId, message, withRules = false) {
  const box = $(containerId);
  box.replaceChildren();
  if (!message) return;
  const alert = el("div", "sk-alert");
  alert.append(el("div", null, message));
  if (withRules) {
    alert.append(el("div", null, "Tilføj denne blok under Firestore → Rules i Firebase Console (projekt navne-app-83f90):"));
    alert.append(el("pre", null, RULES_HINT));
  }
  box.append(alert);
}

// front/bagside afhængigt af "byt om"-valget
const front = card => reversed ? card.definition : card.term;
const back  = card => reversed ? card.term : card.definition;

// ── Login ─────────────────────────────────────────────────────────────

onAuthStateChanged(auth, user => {
  currentUser = user;
  const info = $("user-info");
  if (user) {
    info.textContent = user.displayName || user.email;
    info.hidden = false;
    $("btn-auth").textContent = "Log ud";
  } else {
    info.hidden = true;
    $("btn-auth").textContent = "Log ind";
  }
  renderSetList();
});

$("btn-auth").addEventListener("click", () => {
  if (currentUser) signOut(auth);
  else signInWithPopup(auth, new GoogleAuthProvider()).catch(err => {
    if (err.code !== "auth/popup-closed-by-user") {
      showAlert("list-alert", "Login mislykkedes: " + err.message);
    }
  });
});

// ── Oversigt ──────────────────────────────────────────────────────────

async function loadSets() {
  try {
    const snap = await getDocs(query(collection(db, SETS), orderBy("updatedAt", "desc")));
    sets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    showAlert("list-alert", "");
  } catch (err) {
    sets = [];
    showAlert("list-alert",
      "Kunne ikke hente sæt fra Firestore (" + err.code + "). " +
      "Sandsynligvis mangler sikkerhedsreglerne for samlingen quizSets.", true);
  }
  renderSetList();
}

function renderSetList() {
  const grid = $("set-grid");
  grid.replaceChildren();
  if (sets.length === 0) {
    const empty = el("div", "sk-empty", "Ingen sæt endnu. Log ind og opret det første!");
    empty.style.gridColumn = "1 / -1";
    grid.append(empty);
    return;
  }
  for (const set of sets) {
    const card = el("div", "sk-set-card");
    card.append(el("div", "sk-set-meta",
      `${set.cards.length} kort · ${set.ownerName || "ukendt"}`));
    card.append(el("h3", null, set.title));
    if (set.description) card.append(el("p", null, set.description));
    card.addEventListener("click", () => openSet(set));
    grid.append(card);
  }
}

$("btn-new-set").addEventListener("click", () => {
  if (!currentUser) {
    showAlert("list-alert", "Log ind for at oprette et sæt.");
    return;
  }
  openEditor(null);
});

// ── Sæt-visning ───────────────────────────────────────────────────────

function openSet(set) {
  currentSet = set;
  $("set-heading").textContent = set.title;
  $("set-sub").textContent =
    `${set.cards.length} kort · ${set.ownerName || "ukendt"}` +
    (set.description ? " · " + set.description : "");
  $("btn-edit-set").hidden = !(currentUser && currentUser.uid === set.ownerUid);

  const list = $("term-list");
  list.replaceChildren();
  for (const c of set.cards) {
    const item = el("div", "sk-term-item");
    item.append(el("div", "term", c.term));
    item.append(el("div", "def", c.definition));
    list.append(item);
  }
  showView("set");
}

$("btn-set-back").addEventListener("click", () => showView("list"));
$("btn-edit-set").addEventListener("click", () => openEditor(currentSet));
$("chk-reverse").addEventListener("change", e => { reversed = e.target.checked; });

document.querySelectorAll(".sk-mode-btn").forEach(btn => {
  btn.addEventListener("click", () => startMode(btn.dataset.mode));
});

function startMode(mode) {
  const n = currentSet.cards.length;
  if (mode === "quiz" && n < 2 || mode === "match" && n < 2) {
    alert("Denne tilstand kræver mindst 2 kort i sættet.");
    return;
  }
  if (mode === "flashcards") startFlashcards();
  if (mode === "quiz") startQuiz();
  if (mode === "write") startWrite();
  if (mode === "match") startMatch();
}

// ── Editor ────────────────────────────────────────────────────────────

function openEditor(set) {
  editingSetId = set ? set.id : null;
  $("editor-heading").textContent = set ? "Redigér sæt" : "Nyt sæt";
  $("set-title").value = set ? set.title : "";
  $("set-desc").value = set ? (set.description || "") : "";
  $("import-text").value = "";
  $("btn-delete-set").hidden = !set;
  showAlert("editor-alert", "");

  const rows = $("card-rows");
  rows.replaceChildren();
  const cards = set ? set.cards : [{ term: "", definition: "" }, { term: "", definition: "" }];
  for (const c of cards) addCardRow(c.term, c.definition);
  showView("editor");
}

function addCardRow(term = "", definition = "") {
  const row = el("div", "sk-card-row");
  const termInput = el("input", "sk-input");
  termInput.placeholder = "Begreb";
  termInput.value = term;
  const defInput = el("input", "sk-input");
  defInput.placeholder = "Definition";
  defInput.value = definition;
  const del = el("button", "sk-row-del");
  del.innerHTML = '<i class="ph ph-x"></i>';
  del.title = "Fjern kort";
  del.addEventListener("click", () => row.remove());
  row.append(termInput, defInput, del);
  $("card-rows").append(row);
  return row;
}

function readCardRows() {
  return [...$("card-rows").querySelectorAll(".sk-card-row")]
    .map(row => {
      const [t, d] = row.querySelectorAll("input");
      return { term: t.value.trim(), definition: d.value.trim() };
    })
    .filter(c => c.term && c.definition);
}

$("btn-add-row").addEventListener("click", () => {
  const row = addCardRow();
  row.querySelector("input").focus();
});

$("btn-import").addEventListener("click", () => {
  const lines = $("import-text").value.split("\n");
  let added = 0;
  for (const line of lines) {
    const parts = line.includes("\t") ? line.split("\t") : line.split(";");
    if (parts.length < 2) continue;
    const term = parts[0].trim();
    const definition = parts.slice(1).join(";").trim();
    if (term && definition) { addCardRow(term, definition); added++; }
  }
  if (added > 0) $("import-text").value = "";
  showAlert("editor-alert", added > 0 ? "" : "Ingen gyldige linjer fundet — brug 'begreb; definition' pr. linje.");
});

$("btn-save-set").addEventListener("click", async () => {
  if (!currentUser) {
    showAlert("editor-alert", "Log ind for at gemme.");
    return;
  }
  const title = $("set-title").value.trim();
  const cards = readCardRows();
  if (!title) { showAlert("editor-alert", "Giv sættet en titel."); return; }
  if (cards.length === 0) { showAlert("editor-alert", "Tilføj mindst ét kort med både begreb og definition."); return; }

  const data = {
    title,
    description: $("set-desc").value.trim(),
    cards,
    ownerUid: currentUser.uid,
    ownerName: currentUser.displayName || currentUser.email,
    updatedAt: serverTimestamp()
  };

  try {
    if (editingSetId) {
      await updateDoc(doc(db, SETS, editingSetId), data);
    } else {
      data.createdAt = serverTimestamp();
      const ref = await addDoc(collection(db, SETS), data);
      editingSetId = ref.id;
    }
    await loadSets();
    const saved = sets.find(s => s.id === editingSetId);
    if (saved) openSet(saved); else showView("list");
  } catch (err) {
    showAlert("editor-alert",
      "Kunne ikke gemme (" + err.code + "). Tjek Firestore-reglerne for quizSets.", true);
  }
});

$("btn-delete-set").addEventListener("click", async () => {
  if (!editingSetId) return;
  if (!confirm("Slet dette sæt permanent?")) return;
  try {
    await deleteDoc(doc(db, SETS, editingSetId));
    editingSetId = null;
    await loadSets();
    showView("list");
  } catch (err) {
    showAlert("editor-alert", "Kunne ikke slette (" + err.code + ").");
  }
});

$("btn-editor-back").addEventListener("click", () => {
  if (currentSet && editingSetId === currentSet.id) showView("set");
  else showView("list");
});

// ── Flashcards ────────────────────────────────────────────────────────

let fcCards = [];
let fcIndex = 0;

function startFlashcards() {
  fcCards = [...currentSet.cards];
  fcIndex = 0;
  renderFlashcard();
  showView("flashcards");
}

function renderFlashcard() {
  const card = fcCards[fcIndex];
  $("fc-card").classList.remove("flipped");
  $("fc-front").textContent = front(card);
  $("fc-back").textContent = back(card);
  $("fc-progress").textContent = `${fcIndex + 1} / ${fcCards.length}`;
}

$("fc-card").addEventListener("click", () => $("fc-card").classList.toggle("flipped"));
$("btn-fc-prev").addEventListener("click", () => {
  fcIndex = (fcIndex - 1 + fcCards.length) % fcCards.length;
  renderFlashcard();
});
$("btn-fc-next").addEventListener("click", () => {
  fcIndex = (fcIndex + 1) % fcCards.length;
  renderFlashcard();
});
$("btn-fc-shuffle").addEventListener("click", () => {
  fcCards = shuffle(fcCards);
  fcIndex = 0;
  renderFlashcard();
});
$("btn-fc-back").addEventListener("click", () => showView("set"));

document.addEventListener("keydown", e => {
  if (!$("view-flashcards").classList.contains("active")) return;
  if (e.key === " ") { e.preventDefault(); $("fc-card").classList.toggle("flipped"); }
  if (e.key === "ArrowRight") $("btn-fc-next").click();
  if (e.key === "ArrowLeft") $("btn-fc-prev").click();
});

// ── Quiz (multiple choice) ────────────────────────────────────────────

let quizCards = [];
let quizIndex = 0;
let quizScore = 0;
let quizWrong = [];

function startQuiz() {
  quizCards = shuffle(currentSet.cards);
  quizIndex = 0;
  quizScore = 0;
  quizWrong = [];
  $("quiz-card").hidden = false;
  $("quiz-result").replaceChildren();
  renderQuizQuestion();
  showView("quiz");
}

function renderQuizQuestion() {
  const card = quizCards[quizIndex];
  $("quiz-progress").textContent = `Spørgsmål ${quizIndex + 1} / ${quizCards.length}`;
  $("quiz-question").textContent = front(card);
  const feedback = $("quiz-feedback");
  feedback.textContent = "";
  feedback.className = "sk-feedback";

  const correct = back(card);
  const others = shuffle(currentSet.cards.filter(c => back(c) !== correct))
    .slice(0, 3).map(back);
  const options = shuffle([correct, ...others]);

  const box = $("quiz-options");
  box.replaceChildren();
  for (const opt of options) {
    const btn = el("button", "sk-option", opt);
    btn.addEventListener("click", () => answerQuiz(btn, opt, correct));
    box.append(btn);
  }
}

function answerQuiz(clicked, chosen, correct) {
  const buttons = [...$("quiz-options").querySelectorAll("button")];
  buttons.forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add("correct");
  });
  const feedback = $("quiz-feedback");
  const right = chosen === correct;
  if (right) {
    quizScore++;
    feedback.textContent = "Rigtigt!";
    feedback.className = "sk-feedback ok";
  } else {
    clicked.classList.add("wrong");
    quizWrong.push(quizCards[quizIndex]);
    feedback.textContent = "Forkert — det rigtige svar er markeret.";
    feedback.className = "sk-feedback fejl";
  }
  setTimeout(() => {
    quizIndex++;
    if (quizIndex < quizCards.length) renderQuizQuestion();
    else showResult("quiz-result", "quiz-card", quizScore, quizCards.length, quizWrong, startQuiz);
  }, right ? 900 : 2200);
}

$("btn-quiz-back").addEventListener("click", () => showView("set"));

// ── Skriv ─────────────────────────────────────────────────────────────

let writeCards = [];
let writeIndex = 0;
let writeScore = 0;
let writeWrong = [];
let writeAnswered = false;

function startWrite() {
  writeCards = shuffle(currentSet.cards);
  writeIndex = 0;
  writeScore = 0;
  writeWrong = [];
  $("write-card").hidden = false;
  $("write-result").replaceChildren();
  renderWriteQuestion();
  showView("write");
  $("write-input").focus();
}

function renderWriteQuestion() {
  writeAnswered = false;
  const card = writeCards[writeIndex];
  $("write-progress").textContent = `Spørgsmål ${writeIndex + 1} / ${writeCards.length}`;
  $("write-question").textContent = front(card);
  const input = $("write-input");
  input.value = "";
  input.disabled = false;
  input.focus();
  const feedback = $("write-feedback");
  feedback.textContent = "";
  feedback.className = "sk-feedback";
  $("btn-write-check").hidden = false;
  $("btn-write-next").hidden = true;
}

const normalize = s => s.trim().toLowerCase().replace(/\s+/g, " ");

function checkWrite() {
  if (writeAnswered) return;
  writeAnswered = true;
  const card = writeCards[writeIndex];
  const correct = back(card);
  const right = normalize($("write-input").value) === normalize(correct);
  $("write-input").disabled = true;
  const feedback = $("write-feedback");
  if (right) {
    writeScore++;
    feedback.textContent = "Rigtigt!";
    feedback.className = "sk-feedback ok";
    setTimeout(nextWrite, 900);
  } else {
    writeWrong.push(card);
    feedback.textContent = "Forkert — det rigtige svar er: " + correct;
    feedback.className = "sk-feedback fejl";
    $("btn-write-check").hidden = true;
    $("btn-write-next").hidden = false;
    $("btn-write-next").focus();
  }
}

function nextWrite() {
  writeIndex++;
  if (writeIndex < writeCards.length) renderWriteQuestion();
  else showResult("write-result", "write-card", writeScore, writeCards.length, writeWrong, startWrite);
}

$("btn-write-check").addEventListener("click", checkWrite);
$("btn-write-next").addEventListener("click", nextWrite);
$("write-input").addEventListener("keydown", e => {
  if (e.key === "Enter") checkWrite();
});
$("btn-write-back").addEventListener("click", () => showView("set"));

// ── Match ─────────────────────────────────────────────────────────────

let matchSelected = null;
let matchRemaining = 0;
let matchTimerId = null;
let matchStart = 0;
let matchLocked = false;

function startMatch() {
  const pairs = shuffle(currentSet.cards).slice(0, 6);
  matchRemaining = pairs.length;
  matchSelected = null;
  matchLocked = false;
  $("match-result").replaceChildren();

  const tiles = [];
  pairs.forEach((card, i) => {
    tiles.push({ pairId: i, text: card.term });
    tiles.push({ pairId: i, text: card.definition });
  });

  const grid = $("match-grid");
  grid.replaceChildren();
  for (const tile of shuffle(tiles)) {
    const node = el("button", "sk-match-tile", tile.text);
    node.dataset.pairId = tile.pairId;
    node.addEventListener("click", () => clickMatchTile(node));
    grid.append(node);
  }

  stopMatchTimer();
  matchStart = performance.now();
  matchTimerId = setInterval(() => {
    const sec = (performance.now() - matchStart) / 1000;
    $("match-timer").textContent = sec.toFixed(1).replace(".", ",") + " s";
  }, 100);

  showView("match");
}

function stopMatchTimer() {
  if (matchTimerId) { clearInterval(matchTimerId); matchTimerId = null; }
}

function clickMatchTile(tile) {
  if (matchLocked || tile.classList.contains("done")) return;
  if (matchSelected === tile) {
    tile.classList.remove("selected");
    matchSelected = null;
    return;
  }
  if (!matchSelected) {
    tile.classList.add("selected");
    matchSelected = tile;
    return;
  }
  const first = matchSelected;
  matchSelected = null;
  first.classList.remove("selected");

  if (first.dataset.pairId === tile.dataset.pairId) {
    first.classList.add("done");
    tile.classList.add("done");
    matchRemaining--;
    if (matchRemaining === 0) finishMatch();
  } else {
    matchLocked = true;
    first.classList.add("error");
    tile.classList.add("error");
    setTimeout(() => {
      first.classList.remove("error");
      tile.classList.remove("error");
      matchLocked = false;
    }, 500);
  }
}

function finishMatch() {
  stopMatchTimer();
  const sec = ((performance.now() - matchStart) / 1000).toFixed(1).replace(".", ",");
  const result = el("div", "sk-result");
  result.append(el("div", "score", sec + " s"));
  result.append(el("p", null, "Alle par fundet!"));
  const again = el("button", "btn btn-bronze", "Spil igen");
  again.style.marginTop = "1rem";
  again.addEventListener("click", startMatch);
  result.append(again);
  $("match-result").replaceChildren(result);
}

$("btn-match-restart").addEventListener("click", startMatch);
$("btn-match-back").addEventListener("click", () => showView("set"));

// ── Fælles resultatskærm (quiz & skriv) ───────────────────────────────

function showResult(containerId, cardId, score, total, wrongCards, retry) {
  $(cardId).hidden = true;
  const result = el("div", "sk-result");
  result.append(el("div", "score", `${score} / ${total}`));
  result.append(el("p", null, score === total
    ? "Perfekt — alle rigtige!"
    : "Godt gået! Gennemgå de forkerte herunder."));

  if (wrongCards.length > 0) {
    const list = el("div", "sk-wrong-list");
    for (const c of wrongCards) {
      const item = el("div", "sk-term-item");
      item.append(el("div", "term", c.term));
      item.append(el("div", "def", c.definition));
      list.append(item);
    }
    result.append(list);
  }

  const row = el("div", "btn-row");
  row.style.justifyContent = "center";
  row.style.marginTop = "1.5rem";
  const again = el("button", "btn btn-bronze", "Prøv igen");
  again.addEventListener("click", retry);
  const backBtn = el("button", "btn btn-ghost", "Tilbage til sættet");
  backBtn.addEventListener("click", () => showView("set"));
  row.append(again, backBtn);
  result.append(row);

  $(containerId).replaceChildren(result);
}

// ── Start ─────────────────────────────────────────────────────────────

loadSets();
