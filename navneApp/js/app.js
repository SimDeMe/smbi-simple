import { initAuth, login, logout } from "./auth.js";
import { getClasses, createClass, deleteClass } from "./classes.js";
import {
  getStudentsByClass, getAllStudents, getStudent, updateStudent, deleteStudent, uploadPhoto, deletePhoto
} from "./students.js";
import { importFiles } from "./import.js";
import { buildSession, getDistractors, pickStimulus, checkAnswer, processResult, saveSession } from "./quiz.js";
import { el, showToast, renderProgressBar, spinner, renderStudentCard } from "./ui.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db } from "./firebase-config.js";

let state = { uid: null, view: null, classId: null, studentId: null };

// ── Router ──────────────────────────────────────────────────────────────────

function navigate(hash) {
  location.hash = hash;
}

window.addEventListener('hashchange', () => route());

function route() {
  const hash = location.hash || '#/classes';
  const app = document.getElementById('app');

  if (!state.uid) {
    renderLogin(app);
    return;
  }

  const parts = hash.replace('#/', '').split('/');
  const view = parts[0];

  if (view === 'classes' && parts.length === 1) renderClasses(app);
  else if (view === 'classes' && parts[1] === 'new') renderNewClass(app);
  else if (view === 'classes' && parts[1]) renderClassDetail(app, parts[1]);
  else if (view === 'import') renderImport(app, parts[1]);
  else if (view === 'quiz') renderQuiz(app, parts[1]);
  else if (view === 'match') renderMatch(app, parts[1]);
  else if (view === 'students') renderStudentEdit(app, parts[1]);
  else renderClasses(app);
}

// ── Auth ────────────────────────────────────────────────────────────────────

initAuth(
  user => {
    state.uid = user.uid;
    route();
  },
  () => {
    state.uid = null;
    route();
  }
);

// ── Login ───────────────────────────────────────────────────────────────────

function renderLogin(app) {
  app.innerHTML = '';
  app.appendChild(
    el('div', { class: 'view-login' },
      el('div', { class: 'login-card' },
        el('div', { class: 'login-icon' }, '👤'),
        el('h1', {}, 'Navne-app'),
        el('p', {}, 'Lær dine elevers navne med spaced repetition.'),
        el('button', { class: 'btn btn-primary', onclick: () => login().catch(e => showToast(e.message, 'error')) },
          'Log ind med Google'
        )
      )
    )
  );
}

// ── Classes ─────────────────────────────────────────────────────────────────

async function renderClasses(app) {
  app.innerHTML = '';
  app.appendChild(spinner());

  const classes = await getClasses(state.uid);
  app.innerHTML = '';

  app.appendChild(
    el('div', { class: 'view' },
      el('div', { class: 'view-header' },
        el('h1', {}, 'Mine klasser'),
        el('div', { class: 'header-actions' },
          el('button', { class: 'btn btn-ghost-sm', onclick: doLogout }, 'Log ud'),
          el('button', { class: 'btn btn-primary', onclick: () => navigate('#/classes/new') }, '+ Ny klasse')
        )
      ),
      classes.length === 0
        ? el('p', { class: 'muted' }, 'Ingen klasser endnu. Opret din første klasse.')
        : el('div', { class: 'class-grid' },
            ...classes.map(c => renderClassCard(c))
          )
    )
  );
}

function renderClassCard(c) {
  return el('div', { class: 'class-card' },
    el('div', { class: 'class-card-name' }, c.name),
    el('div', { class: 'class-card-actions' },
      el('button', { class: 'btn btn-sm', onclick: () => navigate(`#/classes/${c.id}`) }, 'Åbn'),
      el('button', { class: 'btn btn-danger-sm', onclick: () => confirmDeleteClass(c) }, 'Slet')
    )
  );
}

async function confirmDeleteClass(c) {
  if (!confirm(`Slet klassen "${c.name}"? Dette sletter ikke eleverne.`)) return;
  await deleteClass(state.uid, c.id);
  renderClasses(document.getElementById('app'));
}

// ── New class ────────────────────────────────────────────────────────────────

function renderNewClass(app) {
  app.innerHTML = '';
  let nameVal = '';
  const input = el('input', {
    type: 'text', placeholder: 'fx "2.b Naturgeografi"', class: 'input',
    oninput: e => { nameVal = e.target.value; }
  });

  app.appendChild(
    el('div', { class: 'view view-narrow' },
      el('a', { class: 'back-link', onclick: () => navigate('#/classes') }, '← Tilbage'),
      el('h1', {}, 'Ny klasse'),
      input,
      el('button', {
        class: 'btn btn-primary',
        onclick: async () => {
          if (!nameVal.trim()) return showToast('Indtast et klassenavn', 'error');
          const id = await createClass(state.uid, nameVal.trim());
          navigate(`#/classes/${id}`);
        }
      }, 'Opret klasse')
    )
  );
  input.focus();
}

// ── Class detail ─────────────────────────────────────────────────────────────

async function renderClassDetail(app, classId) {
  app.innerHTML = '';
  app.appendChild(spinner());

  const [classes, students] = await Promise.all([
    getClasses(state.uid),
    getStudentsByClass(state.uid, classId)
  ]);
  const cls = classes.find(c => c.id === classId);
  if (!cls) { navigate('#/classes'); return; }

  const now = new Date();
  const lvl1 = students.filter(s => (s.level || 1) === 1).length;
  const lvl2 = students.filter(s => s.level === 2).length;
  const mastered = students.filter(s => (s.interval || 1) > 21).length;
  const due = students.filter(s => s.nextReview && s.nextReview.toDate && s.nextReview.toDate() <= now).length;
  const withPhotosCount = students.filter(s => s.photoUrls?.length > 0).length;

  app.innerHTML = '';
  app.appendChild(
    el('div', { class: 'view' },
      el('a', { class: 'back-link', onclick: () => navigate('#/classes') }, '← Klasser'),
      el('div', { class: 'view-header' },
        el('h1', {}, cls.name),
        el('div', { class: 'header-actions' },
          el('button', { class: 'btn btn-sm', onclick: () => navigate(`#/import/${classId}`) }, '+ Importer elever'),
          withPhotosCount >= 2
            ? el('button', { class: 'btn btn-sm', onclick: () => navigate(`#/match/${classId}`) }, 'Mix & Match')
            : null,
          students.length > 0
            ? el('button', { class: 'btn btn-primary', onclick: () => navigate(`#/quiz/${classId}`) }, 'Start quiz')
            : null
        )
      ),
      el('div', { class: 'stats-row' },
        statBox('Elever', students.length),
        statBox('Niveau 1', lvl1),
        statBox('Niveau 2', lvl2),
        statBox('Mestret', mastered),
        statBox('Forfaldet', due, due > 0 ? 'stat-warn' : '')
      ),
      el('div', { class: 'student-grid' },
        ...students.map(s => renderStudentCard(s, st => navigate(`#/students/${st.id}`)))
      )
    )
  );
}

function statBox(label, value, cls = '') {
  return el('div', { class: `stat-box ${cls}` },
    el('div', { class: 'stat-value' }, String(value)),
    el('div', { class: 'stat-label' }, label)
  );
}

// ── Import ───────────────────────────────────────────────────────────────────

function renderImport(app, classId) {
  app.innerHTML = '';
  let filesToImport = [];
  const statusEl = el('p', { class: 'muted' }, 'Vælg eller træk billeder herind.');
  const fileInput = el('input', { type: 'file', accept: 'image/*', multiple: true, style: 'display:none' });

  fileInput.addEventListener('change', e => handleFiles(e.target.files));

  const dropZone = el('div', { class: 'drop-zone',
    onclick: () => fileInput.click(),
    ondragover: e => { e.preventDefault(); dropZone.classList.add('drag-over'); },
    ondragleave: () => dropZone.classList.remove('drag-over'),
    ondrop: e => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      handleFiles(e.dataTransfer.files);
    }
  },
    el('div', { class: 'drop-zone-icon' }, '🖼'),
    el('p', {}, 'Træk billeder hertil eller klik for at vælge'),
    el('p', { class: 'muted small' }, 'Filnavn bruges som elevnavn (fx "Rasmus Kjær.jpg")')
  );

  const fileList = el('ul', { class: 'file-list' });
  const importBtn = el('button', { class: 'btn btn-primary', style: 'display:none',
    onclick: () => doImport(classId, filesToImport, statusEl, importBtn, fileList)
  }, 'Importer');

  function handleFiles(files) {
    filesToImport = Array.from(files);
    fileList.innerHTML = '';
    filesToImport.forEach(f => {
      const name = f.name.replace(/\.[^.]+$/, '').replace(/_/g, ' ');
      fileList.appendChild(el('li', {}, name));
    });
    importBtn.style.display = filesToImport.length ? '' : 'none';
    statusEl.textContent = `${filesToImport.length} billede(r) valgt`;
  }

  app.appendChild(
    el('div', { class: 'view view-narrow' },
      el('a', { class: 'back-link', onclick: () => navigate(`#/classes/${classId}`) }, '← Tilbage'),
      el('h1', {}, 'Importer elever'),
      dropZone,
      fileInput,
      fileList,
      statusEl,
      importBtn
    )
  );
}

async function doImport(classId, files, statusEl, importBtn, fileList) {
  importBtn.disabled = true;
  statusEl.textContent = 'Uploader...';
  try {
    const results = await importFiles(state.uid, classId, files, (i, total, name) => {
      statusEl.textContent = `${i}/${total}: ${name}`;
    });
    const newOnes = results.filter(r => r.isNew);
    if (newOnes.length) {
      navigate(`#/gender-tag/${classId}/${newOnes.map(r => r.id).join(',')}`);
    } else {
      navigate(`#/classes/${classId}`);
    }
  } catch (e) {
    showToast(e.message, 'error');
    importBtn.disabled = false;
  }
}

// ── Gender tagging ───────────────────────────────────────────────────────────

window.addEventListener('hashchange', () => {
  const hash = location.hash;
  if (hash.startsWith('#/gender-tag/')) {
    const parts = hash.replace('#/gender-tag/', '').split('/');
    const classId = parts[0];
    const ids = parts[1] ? parts[1].split(',') : [];
    renderGenderTag(document.getElementById('app'), classId, ids);
  }
});

async function renderGenderTag(app, classId, ids) {
  if (!ids.length) { navigate(`#/classes/${classId}`); return; }
  app.innerHTML = '';
  app.appendChild(spinner());
  const student = await getStudent(state.uid, ids[0]);
  if (!student) { navigate(`#/gender-tag/${classId}/${ids.slice(1).join(',')}`); return; }

  app.innerHTML = '';
  const remaining = ids.length;

  const tag = async gender => {
    await updateStudent(state.uid, student.id, { gender });
    const next = ids.slice(1);
    navigate(`#/gender-tag/${classId}/${next.join(',')}`);
  };

  app.appendChild(
    el('div', { class: 'view view-narrow view-center' },
      el('p', { class: 'muted' }, `Mærk køn — ${remaining} tilbage`),
      student.photoUrls?.length
        ? el('img', { src: student.photoUrls[0], class: 'tag-photo', alt: student.name })
        : el('div', { class: 'tag-no-photo' }, '?'),
      el('h2', { class: 'tag-name' }, student.name),
      el('div', { class: 'gender-btns' },
        el('button', { class: 'btn btn-gender', onclick: () => tag('male') }, '♂ Dreng'),
        el('button', { class: 'btn btn-gender', onclick: () => tag('female') }, '♀ Pige'),
        el('button', { class: 'btn btn-gender', onclick: () => tag('other') }, '⚧ Andet')
      ),
      el('button', { class: 'btn btn-ghost-sm', onclick: () => navigate(`#/classes/${classId}`) }, 'Spring over')
    )
  );
}

// ── Quiz ─────────────────────────────────────────────────────────────────────

async function renderQuiz(app, classId) {
  app.innerHTML = '';
  app.appendChild(spinner());

  const [sessionStudents, allClassStudents] = await Promise.all([
    buildSession(state.uid, classId),
    getStudentsByClass(state.uid, classId)
  ]);

  if (!sessionStudents.length) {
    renderPracticeGroups(app, classId, allClassStudents);
    return;
  }

  let idx = 0;
  const sessionResults = [];

  async function showCard() {
    if (idx >= sessionStudents.length) {
      try {
        await saveSession(state.uid, classId, sessionResults);
      } catch (e) {
        console.error('saveSession fejlede:', e);
      }
      renderQuizDone(app, classId, sessionResults);
      return;
    }

    const student = sessionStudents[idx];
    const stimulus = pickStimulus(student);

    if (!stimulus) {
      idx++;
      showCard();
      return;
    }

    app.innerHTML = '';
    const startTime = Date.now();
    const total = sessionStudents.length;

    const hintBtn = el('button', { class: 'hint-btn' }, 'Hjælp');
    let hintUsed = false;
    let hintRevealed = false;

    hintBtn.addEventListener('click', () => {
      if (!hintRevealed) {
        hintRevealed = true;
        hintUsed = true;
        hintBtn.textContent = student.name[0] + '...';
        hintBtn.classList.add('hint-revealed');
      }
    });

    const stimulusEl = stimulus === 'photo'
      ? el('img', { src: student.photoUrls[Math.floor(Math.random() * student.photoUrls.length)], class: 'quiz-photo', alt: '' })
      : el('div', { class: 'quiz-hint-card' }, student.hints);

    const quit = () => navigate(`#/classes/${classId}`);
    if (student.level === 1) {
      await showLevel1(app, student, stimulus, stimulusEl, allClassStudents, hintBtn, startTime, hintUsed, idx, total, result => {
        sessionResults.push(result);
        idx++;
        showCard();
      }, quit);
    } else {
      await showLevel2(app, student, stimulus, stimulusEl, hintBtn, startTime, hintUsed, idx, total, result => {
        sessionResults.push(result);
        idx++;
        showCard();
      }, quit);
    }
  }

  showCard();
}

async function showLevel1(app, student, stimulus, stimulusEl, allClassStudents, hintBtn, startTime, hintUsed, idx, total, onDone, onQuit) {
  const distractors = await getDistractors(state.uid, student, allClassStudents);
  const options = shuffle([student, ...distractors]);

  const answerBtns = options.map(opt =>
    el('button', { class: 'answer-btn',
      onclick: () => handleLevel1Answer(opt.id === student.id)
    }, opt.name)
  );

  let answered = false;
  function handleLevel1Answer(correct) {
    if (answered) return;
    answered = true;
    const responseTime = Date.now() - startTime;

    answerBtns.forEach(btn => {
      btn.disabled = true;
      if (btn.textContent === student.name) btn.classList.add('correct');
    });

    const result = {
      studentId: student.id,
      stimulus,
      correct,
      usedHint: hintUsed,
      responseTime,
      answeredWith: correct ? student.id : options.find(o => o.name === event?.target?.textContent)?.id || ''
    };

    processResult(state.uid, student, result);

    if (!correct) {
      const wrongBtn = document.querySelector('.answer-btn:disabled:not(.correct)');
      wrongBtn && wrongBtn.classList.add('wrong');
      setTimeout(() => onDone(result), 2000);
    } else {
      setTimeout(() => onDone(result), 600);
    }
  }

  const quitBtn = onQuit ? el('button', { class: 'btn btn-ghost-sm quiz-quit', onclick: onQuit }, 'Afslut') : null;

  app.appendChild(
    el('div', { class: 'quiz-view' },
      renderProgressBar(idx, total),
      el('div', { class: 'quiz-stimulus' }, stimulusEl),
      el('div', { class: 'quiz-answers' }, ...answerBtns),
      hintBtn,
      quitBtn
    )
  );
}

async function showLevel2(app, student, stimulus, stimulusEl, hintBtn, startTime, hintUsed, idx, total, onDone, onQuit) {
  let answered = false;
  const input = el('input', { type: 'text', class: 'quiz-input', placeholder: 'Skriv elevens navn...',
    autocomplete: 'off', autocorrect: 'off', spellcheck: 'false'
  });
  const feedback = el('div', { class: 'quiz-feedback' });
  const submitBtn = el('button', { class: 'btn btn-primary quiz-submit' }, 'Svar');

  function submit() {
    if (answered) return;
    answered = true;
    const responseTime = Date.now() - startTime;
    const correct = checkAnswer(student, input.value);
    const result = {
      studentId: student.id,
      stimulus,
      correct,
      usedHint: hintUsed,
      responseTime,
      answeredWith: input.value.trim()
    };

    processResult(state.uid, student, result);
    input.disabled = true;
    submitBtn.disabled = true;

    if (correct) {
      feedback.className = 'quiz-feedback correct';
      feedback.textContent = 'Korrekt!';
      setTimeout(() => onDone(result), 700);
    } else {
      feedback.className = 'quiz-feedback wrong';
      feedback.innerHTML = `Forkert. Du svarede <em>${input.value}</em> — det rigtige svar er <strong>${student.name}</strong>`;
      setTimeout(() => onDone(result), 2000);
    }
  }

  input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  submitBtn.addEventListener('click', submit);

  const quitBtn = onQuit ? el('button', { class: 'btn btn-ghost-sm quiz-quit', onclick: onQuit }, 'Afslut') : null;

  app.appendChild(
    el('div', { class: 'quiz-view' },
      renderProgressBar(idx, total),
      el('div', { class: 'quiz-stimulus' }, stimulusEl),
      el('div', { class: 'quiz-input-wrap' }, input, submitBtn),
      feedback,
      hintBtn,
      quitBtn
    )
  );
  input.focus();
}

function renderQuizDone(app, classId, results) {
  const correct = results.filter(r => r.correct).length;
  app.innerHTML = '';
  app.appendChild(
    el('div', { class: 'view view-narrow view-center' },
      el('h2', {}, 'Session færdig!'),
      el('p', {}, `${correct} af ${results.length} korrekte svar.`),
      el('button', { class: 'btn btn-primary', onclick: () => navigate(`#/classes/${classId}`) }, 'Tilbage til klassen')
    )
  );
}

// ── Group practice ────────────────────────────────────────────────────────────

function makeGroups(students) {
  const male = [], female = [], other = [];
  for (const s of students) {
    if (s.gender === 'male') male.push(s);
    else if (s.gender === 'female') female.push(s);
    else other.push(s);
  }
  const result = [];
  for (const bucket of [male, female, other]) {
    const shuffled = shuffle([...bucket]);
    for (let i = 0; i < shuffled.length; i += 5) result.push(shuffled.slice(i, i + 5));
  }
  return result;
}

async function loadPracticeData(uid, classId, withPhotos) {
  try {
    const snap = await getDoc(doc(db, `teachers/${uid}/practiceProgress/${classId}`));
    if (snap.exists()) {
      const data = snap.data();
      const studentMap = Object.fromEntries(withPhotos.map(s => [s.id, s]));
      const groups = (data.groupIds || [])
        .map(ids => ids.map(id => studentMap[id]).filter(Boolean))
        .filter(g => g.length > 0);
      if (groups.length > 0) {
        return { groups, phases: data.phases || groups.map((_, i) => i === 0 ? 1 : 0) };
      }
    }
  } catch {}
  const groups = makeGroups(withPhotos);
  const phases = Array(groups.length).fill(0);
  if (phases.length > 0) phases[0] = 1;
  return { groups, phases };
}

async function savePracticeData(uid, classId, groups, phases) {
  await setDoc(doc(db, `teachers/${uid}/practiceProgress/${classId}`), {
    groupIds: groups.map(g => g.map(s => s.id)),
    phases
  });
}

async function renderPracticeGroups(app, classId, allStudents) {
  const withPhotos = allStudents.filter(s => s.photoUrls?.length > 0);

  if (withPhotos.length < 2) {
    app.innerHTML = '';
    app.appendChild(
      el('div', { class: 'view view-narrow view-center' },
        el('h2', {}, 'Ingen elever til review'),
        el('p', { class: 'muted' }, 'Alle elever er opdaterede. Kom tilbage senere.'),
        el('button', { class: 'btn btn-ghost-sm', onclick: () => navigate(`#/classes/${classId}`) }, 'Tilbage')
      )
    );
    return;
  }

  app.innerHTML = '';
  app.appendChild(spinner());

  const { groups, phases } = await loadPracticeData(state.uid, classId, withPhotos);

  const phaseLabel = p => ['Låst', 'Vælg navn', 'Skriv navn', 'Gennemført'][p] || 'Låst';
  const phaseClass = p => p === 0 ? 'phase-locked' : p === 3 ? 'phase-done' : 'phase-active';

  const groupCards = groups.map((group, i) => {
    const phase = phases[i];
    return el('div', { class: `group-card${phase === 0 ? ' group-card--locked' : ''}${phase === 3 ? ' group-card--done' : ''}` },
      el('div', { class: 'group-card-info' },
        el('div', { class: 'group-card-top' },
          el('span', { class: 'group-number' }, `Gruppe ${i + 1}`),
          el('span', { class: `phase-badge ${phaseClass(phase)}` }, phaseLabel(phase))
        ),
        el('div', { class: 'group-names' }, group.map(s => s.name.split(' ')[0]).join(', '))
      ),
      phase >= 1 && phase <= 2
        ? el('button', { class: 'btn btn-sm', onclick: () => renderGroupPractice(app, classId, i, groups, phases, withPhotos) }, 'Øv')
        : null
    );
  });

  app.innerHTML = '';
  app.appendChild(
    el('div', { class: 'view view-narrow' },
      el('a', { class: 'back-link', onclick: () => navigate(`#/classes/${classId}`) }, '← Tilbage'),
      el('h1', {}, 'Øv navne'),
      el('p', { class: 'muted' }, 'Klarer du en gruppe, låses den næste op.'),
      el('div', { class: 'group-list' }, ...groupCards)
    )
  );
}

async function renderGroupPractice(app, classId, groupIdx, groups, phases, allStudents) {
  const group = groups[groupIdx];
  const phase = phases[groupIdx];
  const students = shuffle([...group]);

  let idx = 0;
  const results = [];
  const quit = () => renderPracticeGroups(app, classId, allStudents);

  async function showNext() {
    if (idx >= students.length) { await showRoundResult(); return; }
    const student = students[idx];
    const startTime = Date.now();

    const hintBtn = el('button', { class: 'hint-btn' }, 'Hjælp');
    let hintUsed = false;
    let hintRevealed = false;
    hintBtn.addEventListener('click', () => {
      if (!hintRevealed) {
        hintRevealed = true;
        hintUsed = true;
        hintBtn.textContent = student.name[0] + '...';
        hintBtn.classList.add('hint-revealed');
      }
    });

    const stimulusEl = el('img', { src: student.photoUrls[0], class: 'quiz-photo', alt: '' });

    if (phase === 1) {
      await showLevel1(app, student, 'photo', stimulusEl, allStudents, hintBtn, startTime, hintUsed, idx, students.length, result => {
        results.push(result); idx++; showNext();
      }, quit);
    } else {
      await showLevel2(app, student, 'photo', stimulusEl, hintBtn, startTime, hintUsed, idx, students.length, result => {
        results.push(result); idx++; showNext();
      }, quit);
    }
  }

  async function showRoundResult() {
    const allCorrect = results.every(r => r.correct);
    const correct = results.filter(r => r.correct).length;
    app.innerHTML = '';

    if (allCorrect) {
      const newPhases = [...phases];
      if (phase === 1) {
        newPhases[groupIdx] = 2;
        await savePracticeData(state.uid, classId, groups, newPhases);
        app.appendChild(
          el('div', { class: 'view view-narrow view-center' },
            el('h2', {}, `${correct} af ${students.length} — perfekt!`),
            el('p', {}, 'Nu skal du skrive navnene selv.'),
            el('button', { class: 'btn btn-primary', onclick: () => renderGroupPractice(app, classId, groupIdx, groups, newPhases, allStudents) }, 'Fortsæt til skriv-fase'),
            el('button', { class: 'btn btn-ghost-sm', onclick: quit }, 'Afslut')
          )
        );
      } else {
        newPhases[groupIdx] = 3;
        if (groupIdx + 1 < groups.length && newPhases[groupIdx + 1] === 0) {
          newPhases[groupIdx + 1] = 1;
        }
        await savePracticeData(state.uid, classId, groups, newPhases);
        app.appendChild(
          el('div', { class: 'view view-narrow view-center' },
            el('h2', {}, `Gruppe ${groupIdx + 1} klaret!`),
            groupIdx + 1 < groups.length
              ? el('p', {}, 'Næste gruppe er nu låst op.')
              : el('p', {}, 'Du har øvet alle grupper — godt gået!'),
            el('button', { class: 'btn btn-primary', onclick: quit }, 'Se grupper')
          )
        );
      }
    } else {
      app.appendChild(
        el('div', { class: 'view view-narrow view-center' },
          el('h2', {}, `${correct} af ${students.length} korrekte`),
          el('p', { class: 'muted' }, 'Du skal have alle rigtige for at komme videre. Prøv igen!'),
          el('button', { class: 'btn btn-primary', onclick: () => renderGroupPractice(app, classId, groupIdx, groups, phases, allStudents) }, 'Prøv igen'),
          el('button', { class: 'btn btn-ghost-sm', onclick: quit }, 'Tilbage til grupper')
        )
      );
    }
  }

  showNext();
}

// ── Mix & Match ───────────────────────────────────────────────────────────────

async function renderMatch(app, classId) {
  app.innerHTML = '';
  app.appendChild(spinner());

  const students = await getStudentsByClass(state.uid, classId);
  const withPhotos = students.filter(s => s.photoUrls?.length > 0);

  app.innerHTML = '';

  if (withPhotos.length < 2) {
    app.appendChild(
      el('div', { class: 'view view-narrow view-center' },
        el('h2', {}, 'Ikke nok billeder'),
        el('p', { class: 'muted' }, 'Tilføj billeder til mindst 2 elever for at spille Mix & Match.'),
        el('button', { class: 'btn btn-primary', onclick: () => navigate(`#/classes/${classId}`) }, 'Tilbage')
      )
    );
    return;
  }

  const pool = shuffle([...withPhotos]).slice(0, 9);
  const shuffledNames = shuffle(pool.map(s => s.name));

  let selected = null;
  const assignments = new Map();

  function render() {
    app.innerHTML = '';
    const placed = assignments.size;
    const total = pool.length;
    const assignedSet = new Set(assignments.values());
    const remaining = shuffledNames.filter(n => !assignedSet.has(n));

    const slots = pool.map(s => {
      const assigned = assignments.get(s.id);
      return el('div', {
        class: 'match-slot' + (selected && !assigned ? ' match-slot--droppable' : ''),
        onclick: () => {
          if (selected) {
            assignments.set(s.id, selected);
            selected = null;
          } else if (assigned) {
            assignments.delete(s.id);
          }
          render();
        }
      },
        el('img', { src: s.photoUrls[0], class: 'match-photo', alt: '' }),
        el('div', { class: 'match-label' + (assigned ? '' : ' match-label--empty') }, assigned || '?')
      );
    });

    const chips = remaining.map(name =>
      el('button', {
        class: 'match-chip' + (name === selected ? ' match-chip--selected' : ''),
        onclick: () => { selected = selected === name ? null : name; render(); }
      }, name)
    );

    const checkBtn = el('button', { class: 'btn btn-primary', onclick: showResults }, 'Tjek svar');
    if (placed < total) checkBtn.disabled = true;

    app.appendChild(
      el('div', { class: 'view view-match' },
        el('a', { class: 'back-link', onclick: () => navigate(`#/classes/${classId}`) }, '← Tilbage'),
        el('div', { class: 'match-header' },
          el('h1', {}, 'Mix & Match'),
          el('span', { class: 'match-count muted' }, `${placed} / ${total}`)
        ),
        el('div', { class: 'match-banner' + (selected ? '' : ' match-banner--empty') },
          selected ? `Valgt: ${selected} — klik på et foto` : 'Vælg et navn herunder, klik derefter på et foto'
        ),
        el('div', { class: 'match-grid' }, ...slots),
        el('div', { class: 'match-pool' }, ...chips),
        el('div', { class: 'match-actions' },
          checkBtn,
          el('button', {
            class: 'btn btn-ghost-sm',
            onclick: () => { assignments.clear(); selected = null; render(); }
          }, 'Nulstil')
        )
      )
    );
  }

  function showResults() {
    app.innerHTML = '';
    let correct = 0;
    const resultSlots = pool.map(s => {
      const assigned = assignments.get(s.id);
      const ok = assigned === s.name;
      if (ok) correct++;
      return el('div', { class: 'match-slot match-slot--' + (ok ? 'correct' : 'wrong') },
        el('img', { src: s.photoUrls[0], class: 'match-photo', alt: '' }),
        el('div', { class: 'match-label' }, assigned || '?'),
        ok ? null : el('div', { class: 'match-correct-label' }, s.name)
      );
    });

    app.appendChild(
      el('div', { class: 'view view-match' },
        el('h1', {}, 'Resultat'),
        el('p', { class: 'match-score' }, `${correct} af ${pool.length} korrekte`),
        el('div', { class: 'match-grid' }, ...resultSlots),
        el('div', { class: 'match-actions' },
          el('button', { class: 'btn btn-primary', onclick: () => renderMatch(app, classId) }, 'Prøv igen'),
          el('button', { class: 'btn btn-ghost-sm', onclick: () => navigate(`#/classes/${classId}`) }, 'Tilbage')
        )
      )
    );
  }

  render();
}

// ── Student edit ─────────────────────────────────────────────────────────────

async function renderStudentEdit(app, studentId) {
  app.innerHTML = '';
  app.appendChild(spinner());

  const student = await getStudent(state.uid, studentId);
  if (!student) { navigate('#/classes'); return; }

  app.innerHTML = '';

  const fields = {
    name: student.name,
    gender: student.gender || 'other',
    hints: student.hints || '',
    nameAnchor: student.nameAnchor || ''
  };

  const photoRow = el('div', { class: 'photo-row' });
  function renderPhotos() {
    photoRow.innerHTML = '';
    (student.photoUrls || []).forEach(url => {
      photoRow.appendChild(
        el('div', { class: 'photo-thumb' },
          el('img', { src: url, alt: '' }),
          el('button', { class: 'photo-delete-btn', onclick: async () => {
            await deletePhoto(state.uid, studentId, url);
            student.photoUrls = student.photoUrls.filter(u => u !== url);
            renderPhotos();
          }}, '×')
        )
      );
    });
  }
  renderPhotos();

  const fileInput = el('input', { type: 'file', accept: 'image/*', style: 'display:none' });
  fileInput.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    showToast('Uploader billede...', 'info');
    const { compressImage } = await import('./import.js');
    const blob = await compressImage(file);
    const url = await uploadPhoto(state.uid, studentId, blob);
    student.photoUrls = [...(student.photoUrls || []), url];
    await updateStudent(state.uid, studentId, { photoUrls: student.photoUrls });
    renderPhotos();
    showToast('Billede tilføjet', 'info');
  });

  const nextReviewDate = student.nextReview?.toDate
    ? student.nextReview.toDate().toLocaleDateString('da-DK')
    : '–';

  const makeField = (label, key, multiline = false) => {
    const tag = multiline ? 'textarea' : 'input';
    const inp = el(tag, { class: 'input', value: multiline ? undefined : fields[key] });
    if (multiline) inp.value = fields[key];
    inp.addEventListener('input', e => { fields[key] = e.target.value; });
    return el('label', { class: 'field-label' }, label, inp);
  };

  const genderSelect = el('select', { class: 'input' });
  [['male', 'Dreng'], ['female', 'Pige'], ['other', 'Andet']].forEach(([v, l]) => {
    const opt = el('option', { value: v }, l);
    if (v === fields.gender) opt.selected = true;
    genderSelect.appendChild(opt);
  });
  genderSelect.addEventListener('change', e => { fields.gender = e.target.value; });

  app.appendChild(
    el('div', { class: 'view view-narrow' },
      el('a', { class: 'back-link', onclick: () => history.back() }, '← Tilbage'),
      el('h1', {}, 'Rediger elev'),
      photoRow,
      el('button', { class: 'btn btn-sm', onclick: () => fileInput.click() }, '+ Tilføj foto'),
      fileInput,
      makeField('Navn', 'name'),
      el('label', { class: 'field-label' }, 'Køn', genderSelect),
      makeField('Hints om eleven', 'hints', true),
      el('label', { class: 'field-label' },
        'Navne-anker (mnemonic)',
        el('textarea', { class: 'input', onchange: e => { fields.nameAnchor = e.target.value; } })
      ),
      el('div', { class: 'meta-row' },
        el('span', { class: 'muted small' }, `Niveau ${student.level || 1} · Næste review: ${nextReviewDate}`)
      ),
      el('div', { class: 'action-row' },
        el('button', { class: 'btn btn-primary', onclick: async () => {
          await updateStudent(state.uid, studentId, {
            name: fields.name,
            gender: fields.gender,
            hints: fields.hints,
            nameAnchor: fields.nameAnchor
          });
          showToast('Gemt');
          history.back();
        }}, 'Gem'),
        el('button', { class: 'btn btn-ghost-sm', onclick: async () => {
          if (!confirm('Nulstil progression?')) return;
          await updateStudent(state.uid, studentId, { level: 1, easeFactor: 2.5, interval: 1, repetitions: 0 });
          showToast('Progression nulstillet');
        }}, 'Nulstil progression'),
        el('button', { class: 'btn btn-danger-sm', onclick: async () => {
          if (!confirm('Slet elev permanent?')) return;
          await deleteStudent(state.uid, studentId);
          navigate(`#/classes/${student.classId}`);
        }}, 'Slet elev')
      )
    )
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

async function doLogout() {
  await logout();
  navigate('#/login');
}

// ── Register SW ───────────────────────────────────────────────────────────────

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/navneApp/service-worker.js').catch(() => {});
}
