// Caricamento dei contenuti e regole di validazione. Solo moduli di Node.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    throw new Error(`Impossibile leggere ${path.relative(root, file)}: ${e.message}`);
  }
}

export function loadAll() {
  const config = readJson(path.join(root, "site.config.json"));
  const sourcesList = readJson(path.join(root, "content", "sources.json"));
  const placesDir = path.join(root, "content", "places");
  const notesDir = path.join(root, "content", "notes");
  const places = fs.readdirSync(placesDir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => ({ file: f, data: readJson(path.join(placesDir, f)) }));
  const notes = {};
  if (fs.existsSync(notesDir)) {
    for (const f of fs.readdirSync(notesDir).filter((f) => f.endsWith(".json"))) {
      notes[f.replace(/\.json$/, "")] = readJson(path.join(notesDir, f));
    }
  }
  const methodPath = path.join(root, "content", "pages", "method.html");
  const methodHtml = fs.existsSync(methodPath) ? fs.readFileSync(methodPath, "utf8") : "";
  const storiesDir = path.join(root, "content", "stories");
  const stories = fs.existsSync(storiesDir)
    ? fs.readdirSync(storiesDir).filter((f) => f.endsWith(".json")).sort().map((f) => ({ file: f, data: readJson(path.join(storiesDir, f)) }))
    : [];
  const countriesPath = path.join(root, "content", "data", "africa-countries.json");
  const countries = fs.existsSync(countriesPath) ? readJson(countriesPath) : null;
  return { config, sourcesList, places, notes, methodHtml, countries, stories };
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE = /(?:\+?\d[\d\s().-]{7,}\d)/;
const HOW = ["in-person", "message", "other"];

export function validate({ config, sourcesList, places, notes, methodHtml, countries, stories = [] }) {
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);

  // --- configurazione
  for (const k of ["name", "tagline", "lang"]) {
    if (!config[k] || typeof config[k] !== "string") err(`site.config.json: manca "${k}".`);
  }
  const kindIds = new Set((config.noteKinds || []).map((k) => k.id));
  const relIds = new Set((config.relations || []).map((r) => r.id));
  const tierIds = new Set(Object.keys(config.tiers || {}));
  const statusIds = new Set(Object.keys(config.sourceStatus || {}));
  if (!kindIds.size) err('site.config.json: "noteKinds" è vuoto.');
  const subIds = new Set();
  for (const r of config.subregions || []) {
    if (!r.id || !r.label) err(`site.config.json: subregions "${r.id}" richiede id e label.`);
    subIds.add(r.id);
  }
  // canali con cui chi scrive può inviare una nota: il modulo prepara il messaggio, non lo spedisce
  const CHANNEL_TYPES = ["whatsapp", "email", "link", "github"];
  let channelsFilled = 0;
  for (const ch of config.channels || []) {
    const w = `site.config.json: channels "${ch.id}"`;
    if (!ch.id || !ch.label || !CHANNEL_TYPES.includes(ch.type)) { err(`${w} richiede id, label e type (${CHANNEL_TYPES.join(", ")}).`); continue; }
    if (!ch.value) continue;
    channelsFilled++;
    if (ch.type === "whatsapp" && !/^\d{7,15}$/.test(ch.value)) err(`${w}: il numero va scritto solo con cifre, con il prefisso internazionale e senza + (per esempio 2207001234).`);
    if (ch.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ch.value)) err(`${w}: indirizzo email non valido.`);
    if (ch.type === "github" && !/^[\w.-]+\/[\w.-]+$/.test(ch.value)) err(`${w}: il valore deve essere "proprietario/repository", per esempio lauratonsi/africa-on-the-ground.`);
    if (ch.type === "link" && !/^https:\/\//.test(ch.value)) err(`${w}: il link deve iniziare con https://.`);
  }
  if (!channelsFilled) warn('site.config.json: nessun canale in "channels" ha un valore. Il modulo per le note potrà solo copiare il messaggio.');
  const langIds = new Set((config.languages || []).map((l) => l.id));
  const SHAPES = ["circle", "square", "diamond"];
  const typeIds = new Set();
  if (!Array.isArray(config.placeTypes) || !config.placeTypes.length) err('site.config.json: "placeTypes" è vuoto.');
  for (const t of config.placeTypes || []) {
    if (!t.id || !t.label || !SHAPES.includes(t.shape)) err(`site.config.json: placeTypes "${t.id}" richiede id, label e shape (${SHAPES.join(", ")}).`);
    typeIds.add(t.id);
  }
  if (!config.contact) warn('site.config.json: "contact" è vuoto. La pagina Method non dirà come chiedere la rimozione di una nota.');
  if (!methodHtml) warn("content/pages/method.html non trovato.");

  // --- fonti
  const sources = new Map();
  for (const s of sourcesList) {
    const where = `sources.json (${s.id || "senza id"})`;
    if (!s.id || !SLUG.test(s.id)) err(`${where}: id mancante o non valido.`);
    if (sources.has(s.id)) err(`${where}: id duplicato.`);
    sources.set(s.id, s);
    for (const k of ["title", "publisher", "url", "tier", "status", "retrieved"]) {
      if (!s[k]) err(`${where}: manca "${k}".`);
    }
    if (s.url && !/^https:\/\//.test(s.url)) err(`${where}: l'url deve iniziare con https://.`);
    if (s.tier && !tierIds.has(s.tier)) err(`${where}: tier "${s.tier}" non previsto in site.config.json.`);
    if (s.status && !statusIds.has(s.status)) err(`${where}: status "${s.status}" non previsto in site.config.json.`);
    if (s.retrieved && !DATE.test(s.retrieved)) err(`${where}: "retrieved" deve essere AAAA-MM-GG.`);
  }

  // --- luoghi
  const used = new Set();
  const placeSlugs = new Set();
  const checkCite = (cite, where) => {
    if (!Array.isArray(cite) || !cite.length) { err(`${where}: manca la citazione.`); return; }
    for (const id of cite) {
      if (!sources.has(id)) err(`${where}: la fonte "${id}" non esiste in sources.json.`);
      else used.add(id);
    }
  };
  for (const { file, data: p } of places) {
    const w = `places/${file}`;
    if (!p.slug || !SLUG.test(p.slug)) err(`${w}: slug mancante o non valido.`);
    else if (`${p.slug}.json` !== file) err(`${w}: lo slug "${p.slug}" deve coincidere con il nome del file.`);
    placeSlugs.add(p.slug);
    if (!["draft", "published"].includes(p.status)) err(`${w}: status deve essere "draft" o "published".`);
    for (const k of ["name", "region", "subtitle"]) if (!p[k]) err(`${w}: manca "${k}".`);
    if (!typeIds.has(p.type)) err(`${w}: type "${p.type}" non previsto in site.config.json (placeTypes).`);
    if (p.country != null && !/^[A-Z]{3}$/.test(p.country)) err(`${w}: country deve essere un codice ISO a tre lettere maiuscole, per esempio GMB.`);
    if (p.image != null) {
      const im = p.image;
      for (const k of ["file", "alt", "caption", "credit", "license"]) if (!im[k] || typeof im[k] !== "string") err(`${w}: image richiede "${k}".`);
      for (const k of ["licenseUrl", "source"]) if (!/^https:\/\//.test(im[k] || "")) err(`${w}: image.${k} deve essere un indirizzo https.`);
      for (const size of [800, 1600]) {
        if (im.file && !fs.existsSync(path.join(root, "src", "img", "places", `${im.file}-${size}.jpg`))) err(`${w}: manca src/img/places/${im.file}-${size}.jpg.`);
      }
    }
    if (p.coords != null) {
      const c = p.coords;
      if (typeof c.lat !== "number" || c.lat < -90 || c.lat > 90 || typeof c.lon !== "number" || c.lon < -180 || c.lon > 180) {
        err(`${w}: coords richiede lat e lon numerici validi.`);
      }
      if (!p.country) err(`${w}: coords richiede anche country.`);
      if (c.cite != null) checkCite(c.cite, `${w}: coords`);
      else if (p.status === "published") warn(`${w}: le coordinate non hanno una fonte (coords.cite).`);
    }
    (p.facts || []).forEach((f, i) => {
      if (!f.label || !f.value) err(`${w}: facts[${i}] senza label o value.`);
      checkCite(f.cite, `${w}: facts[${i}]`);
    });
    const seenSections = new Set();
    (p.sections || []).forEach((s, si) => {
      const sw = `${w}: sections[${si}]`;
      if (!s.id || !s.title) err(`${sw}: manca id o title.`);
      if (seenSections.has(s.id)) err(`${sw}: id "${s.id}" duplicato.`);
      seenSections.add(s.id);
      (s.blocks || []).forEach((b, bi) => {
        const bw = `${sw}.blocks[${bi}]`;
        if (b.type === "facts") {
          if (!(p.facts || []).length) err(`${bw}: blocco "facts" ma il luogo non ha facts.`);
        } else if (b.type === "p") {
          if (!Array.isArray(b.parts) || !b.parts.length) err(`${bw}: parts vuoto.`);
          (b.parts || []).forEach((part, pi) => {
            const pw = `${bw}.parts[${pi}]`;
            if (!part.text) err(`${pw}: testo vuoto.`);
            if (part.editorial === true) return;
            checkCite(part.cite, pw);
          });
        } else if (b.type === "timeline") {
          if (!Array.isArray(b.items) || !b.items.length) err(`${bw}: items vuoto.`);
          (b.items || []).forEach((it, ii) => {
            const iw = `${bw}.items[${ii}]`;
            if (!it.when || !it.text) err(`${iw}: manca when o text.`);
            checkCite(it.cite, iw);
          });
        } else {
          err(`${bw}: tipo di blocco "${b.type}" non previsto (p, facts, timeline).`);
        }
      });
    });
    if (!Array.isArray(p.gaps)) err(`${w}: "gaps" deve essere una lista, anche vuota.`);
    else if (!p.gaps.length) warn(`${w}: nessuna lacuna dichiarata. Ogni scheda ne ha almeno una, controlla.`);

    // fonti da verificare
    const weak = new Set();
    const collect = (cite) => (cite || []).forEach((id) => {
      const s = sources.get(id);
      if (s && s.status !== "verified") weak.add(id);
    });
    collect(p.coords && p.coords.cite);
    (p.facts || []).forEach((f) => collect(f.cite));
    (p.sections || []).forEach((s) => (s.blocks || []).forEach((b) => {
      (b.parts || []).forEach((x) => collect(x.cite));
      (b.items || []).forEach((x) => collect(x.cite));
    }));
    if (weak.size) warn(`${w}: poggia su fonti non ancora verificate: ${[...weak].join(", ")}.`);
  }
  // --- storie (storia, miti, cucina): stessa regola delle schede, ogni frase con la sua fonte
  const storyKinds = new Set((config.storyKinds || []).map((k) => k.id));
  const storySlugs = new Set();
  for (const { file, data: st } of stories) {
    const w = `stories/${file}`;
    if (!st.slug || !SLUG.test(st.slug)) err(`${w}: slug mancante o non valido.`);
    else if (`${st.slug}.json` !== file) err(`${w}: lo slug "${st.slug}" deve coincidere con il nome del file.`);
    if (storySlugs.has(st.slug)) err(`${w}: slug duplicato.`);
    storySlugs.add(st.slug);
    if (!["draft", "published"].includes(st.status)) err(`${w}: status deve essere "draft" o "published".`);
    if (!storyKinds.has(st.kind)) err(`${w}: kind "${st.kind}" non previsto in site.config.json (storyKinds).`);
    for (const k of ["title", "subtitle"]) if (!st[k]) err(`${w}: manca "${k}".`);
    for (const code of st.countries || []) if (!/^[A-Z]{3}$/.test(code) || (countries && !(countries.countries || []).some((c) => c.iso3 === code))) err(`${w}: country "${code}" non è tra i 54 stati.`);
    for (const slug of st.places || []) if (!places.some((x) => x.data.slug === slug)) err(`${w}: il luogo "${slug}" non esiste.`);
    if (!Array.isArray(st.sections) || !st.sections.length) err(`${w}: serve almeno una sezione.`);
    const seen = new Set();
    (st.sections || []).forEach((sec, si) => {
      const sw = `${w}: sections[${si}]`;
      if (!sec.id || !sec.title) err(`${sw}: manca id o title.`);
      if (seen.has(sec.id)) err(`${sw}: id "${sec.id}" duplicato.`);
      seen.add(sec.id);
      (sec.blocks || []).forEach((b, bi) => {
        const bw = `${sw}.blocks[${bi}]`;
        if (b.type === "p") {
          if (!Array.isArray(b.parts) || !b.parts.length) err(`${bw}: parts vuoto.`);
          (b.parts || []).forEach((part, pi) => {
            if (!part.text) err(`${bw}.parts[${pi}]: testo vuoto.`);
            if (part.editorial === true) return;
            checkCite(part.cite, `${bw}.parts[${pi}]`);
          });
        } else if (b.type === "timeline") {
          if (!Array.isArray(b.items) || !b.items.length) err(`${bw}: items vuoto.`);
          (b.items || []).forEach((it, ii) => { if (!it.when || !it.text) err(`${bw}.items[${ii}]: manca when o text.`); checkCite(it.cite, `${bw}.items[${ii}]`); });
        } else err(`${bw}: tipo di blocco "${b.type}" non previsto (p, timeline).`);
      });
    });
    if (!Array.isArray(st.gaps) || !st.gaps.length) err(`${w}: "gaps" (ciò che non si sa) deve avere almeno una voce.`);
    const weak = new Set();
    const collect = (cite) => (cite || []).forEach((id) => { const s2 = sources.get(id); if (s2 && s2.status !== "verified") weak.add(id); });
    (st.sections || []).forEach((sec) => (sec.blocks || []).forEach((b) => { (b.parts || []).forEach((x) => collect(x.cite)); (b.items || []).forEach((x) => collect(x.cite)); }));
    if (weak.size) warn(`${w}: poggia su fonti non ancora verificate: ${[...weak].join(", ")}.`);
  }
  // --- dati dei paesi
  if (countries) {
    const w = "data/africa-countries.json";
    if (!DATE.test(countries.retrieved || "")) err(`${w}: "retrieved" deve essere AAAA-MM-GG.`);
    checkCite(countries.sources, w);
    const seen = new Set();
    for (const c of countries.countries || []) {
      const cw = `${w} (${c.iso3 || "senza codice"})`;
      if (!/^[A-Z]{3}$/.test(c.iso3 || "")) err(`${cw}: iso3 mancante o non valido.`);
      if (seen.has(c.iso3)) err(`${cw}: codice duplicato.`);
      seen.add(c.iso3);
      for (const k of ["name", "capital"]) if (!c[k]) err(`${cw}: manca "${k}".`);
      if (!subIds.has(c.subregion)) err(`${cw}: subregion "${c.subregion}" non prevista in site.config.json.`);
      for (const k of ["population", "area"]) if (!(typeof c[k] === "number" && c[k] > 0)) err(`${cw}: "${k}" deve essere un numero positivo.`);
      if (!(Math.abs(c.capitalLat) <= 90 && Math.abs(c.capitalLon) <= 180)) err(`${cw}: coordinate della capitale non valide.`);
    }
    if (seen.size !== 54) warn(`${w}: ${seen.size} paesi invece di 54.`);
  }
  for (const id of sources.keys()) {
    if (!used.has(id)) warn(`sources.json: la fonte "${id}" non è citata da nessuna scheda.`);
  }

  // --- note dei locali
  for (const [slug, list] of Object.entries(notes)) {
    const w = `notes/${slug}.json`;
    // il nome del file dice a cosa si riferisce: <luogo>, story-<storia> o country-<ISO3>
    let kindList = null;
    if (placeSlugs.has(slug)) kindList = config.noteKinds || [];
    else if (slug.startsWith("story-") && stories.some((x) => `story-${x.data.slug}` === slug)) kindList = (config.storyNoteKinds || {})[stories.find((x) => `story-${x.data.slug}` === slug).data.kind] || [];
    else if (/^country-[A-Z]{3}$/.test(slug) && countries && (countries.countries || []).some((c) => `country-${c.iso3}` === slug)) kindList = config.countryNoteKinds || [];
    else err(`${w}: non corrisponde a un luogo, a una storia (story-<slug>) o a un paese (country-<ISO3>).`);
    const kindsHere = new Map((kindList || []).map((k) => [k.id, k]));
    if (!Array.isArray(list)) { err(`${w}: deve contenere una lista.`); continue; }
    const ids = new Set();
    list.forEach((n, i) => {
      const nw = `${w} (nota ${n.id || i + 1})`;
      if (!n.id || !SLUG.test(n.id)) err(`${nw}: id mancante o non valido.`);
      if (ids.has(n.id)) err(`${nw}: id duplicato.`);
      ids.add(n.id);
      if (!kindsHere.has(n.kind)) err(`${nw}: kind "${n.kind}" non previsto per questo contenuto.`);
      if (n.fields != null) {
        const defs = new Map(((kindsHere.get(n.kind) || {}).fields || []).map((f) => [f.id, f]));
        if (typeof n.fields !== "object" || Array.isArray(n.fields)) err(`${nw}: fields deve essere un oggetto.`);
        else for (const [fk, fv] of Object.entries(n.fields)) {
          const def = defs.get(fk);
          if (!def) { err(`${nw}: il campo "${fk}" non è previsto per il tipo "${n.kind}".`); continue; }
          if (typeof fv !== "string" || fv.length > (def.max || 300)) { err(`${nw}: il campo "${fk}" deve essere un testo di al massimo ${def.max || 300} caratteri.`); continue; }
          if (def.type === "select" && !def.options.some((o) => o.id === fv)) err(`${nw}: il campo "${fk}" ha un valore non previsto: "${fv}".`);
          if (EMAIL.test(fv) || PHONE.test(fv)) err(`${nw}: il campo "${fk}" sembra contenere un indirizzo email o un numero di telefono.`);
        }
      }
      if (n.kind === "fix") err(`${nw}: le correzioni al racconto documentato non si pubblicano come voci. Usale per correggere la scheda, con una fonte.`);
      // La revisione di una persona del posto avviene dopo la pubblicazione e si registra quando c'è (review.by, review.date).
      if (n.review != null && (typeof n.review.by !== "string" || !n.review.by.trim() || !DATE.test(n.review.date || ""))) err(`${nw}: review, se presente, ha bisogno di by e date (AAAA-MM-GG).`);
      if (typeof n.text !== "string" || n.text.trim().length < 10) err(`${nw}: testo troppo corto.`);
      else if (n.text.length > 1200) err(`${nw}: testo oltre i 1200 caratteri.`);
      if (n.name != null && (typeof n.name !== "string" || n.name.length > 60)) err(`${nw}: name non valido (max 60 caratteri, facoltativo).`);
      if (n.relation != null && !relIds.has(n.relation)) err(`${nw}: relation "${n.relation}" non prevista.`);
      if (!n.consent || n.consent.given !== true) err(`${nw}: manca il consenso alla pubblicazione (consent.given deve essere true).`);
      else {
        if (!DATE.test(n.consent.date || "")) err(`${nw}: consent.date deve essere AAAA-MM-GG.`);
        if (!HOW.includes(n.consent.how)) err(`${nw}: consent.how deve essere uno di ${HOW.join(", ")}.`);
      }
      if (!DATE.test(n.added || "")) err(`${nw}: "added" deve essere AAAA-MM-GG.`);
      if (n.lang != null && langIds.size && !langIds.has(n.lang)) warn(`${nw}: lang "${n.lang}" non è tra le "languages" di site.config.json.`);
      for (const field of ["text", "name"]) {
        const v = n[field];
        if (typeof v === "string" && (EMAIL.test(v) || PHONE.test(v))) {
          err(`${nw}: "${field}" sembra contenere un indirizzo email o un numero di telefono. Rimuovilo prima di pubblicare.`);
        }
      }
    });
  }
  return { errors, warnings };
}

export function report({ errors, warnings }) {
  for (const w of warnings) console.warn(`  attenzione: ${w}`);
  for (const e of errors) console.error(`  errore: ${e}`);
  console.log(`\nControlli: ${errors.length} errori, ${warnings.length} avvisi.`);
}
