// Caricamento dei contenuti e regole di validazione. Nessuna dipendenza esterna.
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
  return { config, sourcesList, places, notes, methodHtml };
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE = /(?:\+?\d[\d\s().-]{7,}\d)/;
const HOW = ["in-person", "message", "other"];

export function validate({ config, sourcesList, places, notes, methodHtml }) {
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
  for (const id of sources.keys()) {
    if (!used.has(id)) warn(`sources.json: la fonte "${id}" non è citata da nessuna scheda.`);
  }

  // --- note dei locali
  for (const [slug, list] of Object.entries(notes)) {
    const w = `notes/${slug}.json`;
    if (!placeSlugs.has(slug)) err(`${w}: non esiste un luogo con slug "${slug}".`);
    if (!Array.isArray(list)) { err(`${w}: deve contenere una lista.`); continue; }
    const ids = new Set();
    list.forEach((n, i) => {
      const nw = `${w} (nota ${n.id || i + 1})`;
      if (!n.id || !SLUG.test(n.id)) err(`${nw}: id mancante o non valido.`);
      if (ids.has(n.id)) err(`${nw}: id duplicato.`);
      ids.add(n.id);
      if (!kindIds.has(n.kind)) err(`${nw}: kind "${n.kind}" non previsto.`);
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
