// Elevernes viste navne.
//
// Læreren skal lære fornavne, så det er fornavnet, appen viser. Efternavnet
// kommer kun med, når to elever i samme sæt deler fornavn — og kun så meget
// af det, som der skal til for at skelne dem: Oliver B og Oliver S, men
// Oliver Ba og Oliver Be, hvis begge hedder noget med B.
//
// Sættet er den gruppe elever, der vises sammen — som regel klassen. Derfor
// er navnet stabilt: en elev hedder det samme i listen, i quizzen og i
// Mix & Match, så længe det er den samme klasse.

export function fornavn(navn) {
  return (navn || '').trim().split(/\s+/)[0] || '';
}

export function efternavn(navn) {
  const dele = (navn || '').trim().split(/\s+/).filter(Boolean);
  return dele.length > 1 ? dele[dele.length - 1] : '';
}

function medBegyndelse(fornavn, efternavn, antal) {
  if (!efternavn || antal < 1) return fornavn;
  const stump = efternavn.slice(0, antal);
  return `${fornavn} ${stump.charAt(0).toUpperCase()}${stump.slice(1)}`;
}

// Returnerer et opslag fra elev-id til det navn, eleven skal vises med.
export function visningsnavne(elever) {
  const kort = new Map();
  const efterFornavn = new Map();

  for (const elev of elever) {
    const nøgle = fornavn(elev.name).toLowerCase();
    if (!efterFornavn.has(nøgle)) efterFornavn.set(nøgle, []);
    efterFornavn.get(nøgle).push(elev);
  }

  for (const gruppe of efterFornavn.values()) {
    if (gruppe.length === 1) {
      kort.set(gruppe[0].id, fornavn(gruppe[0].name) || gruppe[0].name);
      continue;
    }

    // Alle i gruppen får lige mange bogstaver med, så navnene ser systematiske
    // ud. Vi tager det mindste antal, der gør dem forskellige.
    const længste = Math.max(...gruppe.map(e => efternavn(e.name).length));
    let løst = false;
    for (let antal = 1; antal <= længste && !løst; antal++) {
      const forslag = gruppe.map(e => medBegyndelse(fornavn(e.name), efternavn(e.name), antal));
      if (new Set(forslag.map(n => n.toLowerCase())).size === gruppe.length) {
        gruppe.forEach((e, i) => kort.set(e.id, forslag[i]));
        løst = true;
      }
    }
    // Ens fulde navne — der er ikke noget at skelne med.
    if (!løst) gruppe.forEach(e => kort.set(e.id, e.name));
  }

  return kort;
}

export function visningsnavn(elev, kort) {
  return kort?.get(elev.id) || fornavn(elev.name) || elev.name || '';
}
