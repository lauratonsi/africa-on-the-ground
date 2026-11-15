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
  const methodJsonPath = path.join(root, "content", "pages", "method.json");
  const methodPage = fs.existsSync(methodJsonPath) ? readJson(methodJsonPath) : null;
  const storiesDir = path.join(root, "content", "stories");
  const stories = fs.existsSync(storiesDir)
    ? fs.readdirSync(storiesDir).filter((f) => f.endsWith(".json")).sort().map((f) => ({ file: f, data: readJson(path.join(storiesDir, f)) }))
    : [];
  const countriesPath = path.join(root, "content", "data", "africa-countries.json");
  const countries = fs.existsSync(countriesPath) ? readJson(countriesPath) : null;
  const trueSizePath = path.join(root, "content", "data", "true-size.json");
  const trueSize = fs.existsSync(trueSizePath) ? readJson(trueSizePath) : null;
  const blocsPath = path.join(root, "content", "data", "blocs.json");
  const blocs = fs.existsSync(blocsPath) ? readJson(blocsPath) : null;
  const quizPath = path.join(root, "content", "quiz.json");
  const quiz = fs.existsSync(quizPath) ? readJson(quizPath) : null;
  const phrasesPath = path.join(root, "content", "quiz-phrases.json");
  if (quiz && fs.existsSync(phrasesPath)) quiz.phrases = readJson(phrasesPath).phrases;
  const duoPath = path.join(root, "content", "data", "duolingo.json");
  const duolingo = fs.existsSync(duoPath) ? readJson(duoPath) : null;
  const proposedDishesPath = path.join(root, "content", "data", "proposed-dishes.json");
  const proposedDishes = fs.existsSync(proposedDishesPath) ? readJson(proposedDishesPath) : null;
  const artPath = path.join(root, "content", "data", "art.json");
  const artCatalog = fs.existsSync(artPath) ? readJson(artPath) : null;
  const capitalsDir = path.join(root, "content", "capitals");
  const capitals = fs.existsSync(capitalsDir)
    ? fs.readdirSync(capitalsDir).filter((f) => f.endsWith(".json")).sort().map((f) => ({ file: f, data: readJson(path.join(capitalsDir, f)) }))
    : [];
  const peoplesDir = path.join(root, "content", "peoples");
  const peoples = fs.existsSync(peoplesDir)
    ? fs.readdirSync(peoplesDir).filter((f) => f.endsWith(".json")).sort().map((f) => ({ file: f, data: readJson(path.join(peoplesDir, f)) }))
    : [];
  return { config, sourcesList, places, notes, methodHtml, methodPage, countries, stories, trueSize, blocs, quiz, duolingo, proposedDishes, artCatalog, capitals, peoples };
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE = /(?:\+?\d[\d\s().-]{7,}\d)/;
const HOW = ["in-person", "message", "other"];
const RICH = new Set(["chart", "stat", "callout", "reveal", "figure", "estimate", "check", "order", "table", "recipe"]);

export function validate({ config, sourcesList, places, notes, methodHtml, methodPage = null, capitals = [], peoples = [], countries, stories = [], trueSize = null, blocs = null, quiz = null, duolingo = null, proposedDishes = null }) {
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
  const SHAPES = ["circle", "square", "diamond", "triangle", "hexagon"];
  const typeIds = new Set();
  if (!Array.isArray(config.placeTypes) || !config.placeTypes.length) err('site.config.json: "placeTypes" è vuoto.');
  for (const t of config.placeTypes || []) {
    if (!t.id || !t.label || !SHAPES.includes(t.shape)) err(`site.config.json: placeTypes "${t.id}" richiede id, label e shape (${SHAPES.join(", ")}).`);
    typeIds.add(t.id);
  }
  if (!config.contact) warn('site.config.json: "contact" è vuoto. La pagina Method non dirà come chiedere la rimozione di una nota.');
  if (!methodHtml && !methodPage) warn("content/pages/method.json non trovato.");
  if (methodPage) {
    // pagina Method: stessa famiglia di blocchi delle storie; qui le fonti sono facoltative (si contano i dati del sito)
    const ok = new Set(["html", "stat", "callout", "reveal", "estimate", "check", "order", "table", "chart", "figure", "recipe"]);
    if (!methodPage.title || !methodPage.lede) err("method.json: servono title e lede.");
    (methodPage.sections || []).forEach((sec, si) => {
      if (!sec.id || !sec.title) err(`method.json: sections[${si}] senza id o title.`);
      (sec.blocks || []).forEach((b, bi) => { if (!ok.has(b.type)) err(`method.json: sections[${si}].blocks[${bi}]: tipo "${b.type}" non previsto.`); });
    });
  }

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

const checkRecipeBlock = (b, bw, checkCite) => {
    if (!b.title || !b.note) err(`${bw}: recipe richiede title e note (che cosa varia tra le versioni).`);
    if (typeof b.servings !== "number" || b.servings < 1) err(`${bw}: recipe richiede servings numerico.`);
    if (!Array.isArray(b.ingredients) || b.ingredients.length < 2) err(`${bw}: recipe richiede almeno 2 ingredienti.`);
    (b.ingredients || []).forEach((i, ii) => { if (!i.name) err(`${bw}.ingredients[${ii}]: manca name.`); if (i.amount != null && typeof i.amount !== "number") err(`${bw}.ingredients[${ii}]: amount deve essere un numero o assente.`); });
    if (!Array.isArray(b.steps) || b.steps.length < 2) err(`${bw}: recipe richiede almeno 2 passi.`);
    (b.steps || []).forEach((st, si) => { if (!st.text) err(`${bw}.steps[${si}]: manca text.`); });
    checkCite(b.cite, bw);
  };
  // "Go deeper": ogni link verso l'esterno rimanda a una fonte registrata in sources.json (quindi con tipo e stato), con il motivo per leggerla
  const DEEPER_KINDS = new Set(["book", "article", "museum", "archive", "data", "podcast", "document", "news"]);
  const checkDeeper = (list, w) => {
    if (list == null) return;
    if (!Array.isArray(list)) { err(`${w}: "deeper" deve essere una lista.`); return; }
    list.forEach((d, i) => {
      const dw = `${w}: deeper[${i}]`;
      if (!d.source || !sources.has(d.source)) err(`${dw}: la fonte "${d.source}" non esiste in sources.json.`);
      else used.add(d.source);
      if (!DEEPER_KINDS.has(d.kind)) err(`${dw}: kind deve essere uno tra ${[...DEEPER_KINDS].join(", ")}.`);
      if (!d.why || typeof d.why !== "string") err(`${dw}: manca "why" (perché vale la pena leggerla).`);
    });
  };
  const checkRichBlock = (b, bw, checkCite) => {
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
      } else if (b.type === "stat") {
        if (!Array.isArray(b.items) || !b.items.length) err(`${bw}: items vuoto.`);
        (b.items || []).forEach((it, ii) => { if (!it.value || !it.label) err(`${bw}.items[${ii}]: manca value o label.`); checkCite(it.cite, `${bw}.items[${ii}]`); });
      } else if (b.type === "recipe") {
        checkRecipeBlock(b, bw, checkCite);
      } else if (b.type === "estimate") {
        for (const k of ["min", "max", "answer"]) if (typeof b[k] !== "number") err(`${bw}: estimate richiede "${k}" numerico.`);
        if (typeof b.answer === "number" && (b.answer < b.min || b.answer > b.max)) err(`${bw}: la risposta è fuori dall'intervallo.`);
        if (!b.prompt) err(`${bw}: estimate senza prompt.`);
        if (!Array.isArray(b.parts) || !b.parts.length) err(`${bw}: parts vuoto.`);
        (b.parts || []).forEach((part, pi) => { if (!part.text) err(`${bw}.parts[${pi}]: testo vuoto.`); if (part.editorial === true) return; checkCite(part.cite, `${bw}.parts[${pi}]`); });
      } else if (b.type === "check") {
        if (!b.q || !Array.isArray(b.options) || b.options.length < 2 || !b.options.includes(b.answer) || !b.explain) err(`${bw}: check richiede q, options, answer tra le options e explain.`);
        checkCite(b.cite, bw);
      } else if (b.type === "order") {
        if (!b.prompt || !Array.isArray(b.items) || b.items.length < 3) err(`${bw}: order richiede prompt e almeno 3 items nell'ordine corretto.`);
        (b.items || []).forEach((it, ii) => { if (!it.label || !it.when || !it.text) err(`${bw}.items[${ii}]: manca label, when o text.`); checkCite(it.cite, `${bw}.items[${ii}]`); });
      } else if (b.type === "table") {
        if (!b.title || !b.note) err(`${bw}: table richiede title e note.`);
        if (!Array.isArray(b.columns) || b.columns.length < 2) err(`${bw}: columns richiede almeno 2 colonne.`);
        if (!Array.isArray(b.rows) || !b.rows.length) err(`${bw}: rows vuoto.`);
        checkCite(b.cite, bw);
      } else if (b.type === "callout" || b.type === "reveal") {
        if (b.type === "callout" && !b.title) err(`${bw}: callout senza title.`);
        if (b.type === "reveal" && !b.prompt) err(`${bw}: reveal senza prompt.`);
        if (!Array.isArray(b.parts) || !b.parts.length) err(`${bw}: parts vuoto.`);
        (b.parts || []).forEach((part, pi) => { if (!part.text) err(`${bw}.parts[${pi}]: testo vuoto.`); if (part.editorial === true) return; checkCite(part.cite, `${bw}.parts[${pi}]`); });
      } else if (b.type === "figure") {
        const im = b.image || {};
        for (const k of ["file", "alt", "caption", "credit", "license"]) if (!im[k] || typeof im[k] !== "string") err(`${bw}: image richiede "${k}".`);
        for (const k of ["licenseUrl", "source"]) if (!/^https:\/\//.test(im[k] || "")) err(`${bw}: image.${k} deve essere un indirizzo https.`);
        for (const size of [800]) if (im.file && !fs.existsSync(path.join(root, "src", "img", "stories", `${im.file}-${size}.jpg`))) err(`${bw}: manca src/img/stories/${im.file}-${size}.jpg.`);
      } else if (b.type === "chart") {
        if (!["stacked", "bars"].includes(b.kind)) err(`${bw}: chart.kind deve essere "stacked" o "bars".`);
        if (!b.title) err(`${bw}: chart senza title.`);
        if (!b.note) err(`${bw}: chart senza note (dichiara che cosa è calcolato qui e che cosa viene dalla fonte).`);
        checkCite(b.cite, bw);
        if (!Array.isArray(b.rows) || !b.rows.length) err(`${bw}: rows vuoto.`);
        if (b.kind === "stacked") {
          const keys = (b.series || []).map((x) => x.key);
          if (!keys.length) err(`${bw}: chart stacked senza series.`);
          (b.rows || []).forEach((r, ri) => {
            if (!r.label || !r.text) err(`${bw}.rows[${ri}]: manca label o text.`);
            const tot = keys.reduce((n, k) => n + (r.values?.[k] || 0), 0);
            if (Math.abs(tot - 100) > 0.6) err(`${bw}.rows[${ri}]: i valori sommano ${tot.toFixed(1)}, non 100.`);
          });
        } else (b.rows || []).forEach((r, ri) => { if (!r.label || typeof r.value !== "number" || !r.text) err(`${bw}.rows[${ri}]: serve label, value numerico e text.`); });
      } else err(`${bw}: tipo di blocco "${b.type}" non previsto (p, timeline, chart, stat, callout, reveal, figure, estimate, check, order, table, recipe).`);
  };
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
    checkDeeper(p.deeper, w);
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
        } else if (RICH.has(b.type)) {
          checkRichBlock(b, bw, checkCite);
        } else {
          err(`${bw}: tipo di blocco "${b.type}" non previsto (p, facts, timeline, ${[...RICH].join(", ")}).`);
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
      collect(b.cite);
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
    checkDeeper(st.deeper, w);
    if (!Array.isArray(st.sections) || !st.sections.length) err(`${w}: serve almeno una sezione.`);
    const seen = new Set();
    (st.sections || []).forEach((sec, si) => {
      const sw = `${w}: sections[${si}]`;
      if (!sec.id || !sec.title) err(`${sw}: manca id o title.`);
      if (seen.has(sec.id)) err(`${sw}: id "${sec.id}" duplicato.`);
      seen.add(sec.id);
      (sec.blocks || []).forEach((b, bi) => {
        const bw = `${sw}.blocks[${bi}]`;
        checkRichBlock(b, bw, checkCite);
      });
    });
    (st.keyPoints || []).forEach((x, ki) => { if (!x.text) err(`${w}: keyPoints[${ki}] senza testo.`); if (x.cite) checkCite(x.cite, `${w}: keyPoints[${ki}]`); else if (x.editorial !== true) err(`${w}: keyPoints[${ki}] senza fonte né "editorial".`); });
    (st.sections || []).forEach((sec) => (sec.blocks || []).forEach((b) => { if (b.type === "timeline" && b.tags) { const ids = new Set(b.tags.map((t) => t.id)); (b.items || []).forEach((it) => { if (it.tag && !ids.has(it.tag)) err(`${w}: timeline, tag "${it.tag}" non dichiarato in tags.`); }); } }));
    if (!Array.isArray(st.gaps) || !st.gaps.length) err(`${w}: "gaps" (ciò che non si sa) deve avere almeno una voce.`);
    const weak = new Set();
    const collect = (cite) => (cite || []).forEach((id) => { const s2 = sources.get(id); if (s2 && s2.status !== "verified") weak.add(id); });
    (st.sections || []).forEach((sec) => (sec.blocks || []).forEach((b) => { (b.parts || []).forEach((x) => collect(x.cite)); (b.items || []).forEach((x) => collect(x.cite)); collect(b.cite); }));
    (st.keyPoints || []).forEach((x) => collect(x.cite));
    if (weak.size) warn(`${w}: poggia su fonti non ancora verificate: ${[...weak].join(", ")}.`);
  }
  // --- profili delle capitali: stessa famiglia di blocchi delle storie; le bozze vuote sono ammesse, i profili pubblicati no
  const capSlugs = new Set();
  for (const { file, data: c } of capitals) {
    const w = `capitals/${file}`;
    if (!c.slug || !SLUG.test(c.slug)) err(`${w}: slug mancante o non valido.`);
    else if (`${c.slug}.json` !== file) err(`${w}: lo slug "${c.slug}" deve coincidere con il nome del file.`);
    if (capSlugs.has(c.slug)) err(`${w}: slug duplicato.`);
    capSlugs.add(c.slug);
    if (!["draft", "published"].includes(c.status)) err(`${w}: status deve essere "draft" o "published".`);
    if (!/^[A-Z]{3}$/.test(c.country || "") || (countries && !(countries.countries || []).some((x) => x.iso3 === c.country))) err(`${w}: country non valido.`);
    for (const k of ["name", "subtitle"]) if (!c[k]) err(`${w}: manca "${k}".`);
    for (const slug of c.places || []) if (!places.some((x) => x.data.slug === slug)) err(`${w}: il luogo "${slug}" non esiste.`);
    checkDeeper(c.deeper, w);
    (c.facts || []).forEach((f, i) => { if (!f.label || !f.value) err(`${w}: facts[${i}] senza label o value.`); checkCite(f.cite, `${w}: facts[${i}]`); });
    (c.keyPoints || []).forEach((x, ki) => { if (!x.text) err(`${w}: keyPoints[${ki}] senza testo.`); if (x.cite) checkCite(x.cite, `${w}: keyPoints[${ki}]`); else if (x.editorial !== true) err(`${w}: keyPoints[${ki}] senza fonte né "editorial".`); });
    const seenC = new Set();
    (c.sections || []).forEach((sec, si) => {
      const sw = `${w}: sections[${si}]`;
      if (!sec.id || !sec.title) err(`${sw}: manca id o title.`);
      if (seenC.has(sec.id)) err(`${sw}: id "${sec.id}" duplicato.`);
      seenC.add(sec.id);
      (sec.blocks || []).forEach((b, bi) => {
        const bw = `${sw}.blocks[${bi}]`;
        if (b.type === "facts") { if (!(c.facts || []).length) err(`${bw}: blocco "facts" ma il profilo non ha facts.`); }
        else checkRichBlock(b, bw, checkCite);
      });
    });
    if (c.status === "published") {
      if (!(c.keyPoints || []).length) err(`${w}: un profilo pubblicato richiede keyPoints.`);
      if ((c.sections || []).length < 2) err(`${w}: un profilo pubblicato richiede almeno 2 sezioni.`);
      if (!Array.isArray(c.gaps) || !c.gaps.length) err(`${w}: "gaps" deve avere almeno una voce.`);
    }
    const weakC = new Set();
    const collectC = (cite) => (cite || []).forEach((id) => { const s2 = sources.get(id); if (s2 && s2.status !== "verified") weakC.add(id); });
    (c.keyPoints || []).forEach((x) => collectC(x.cite));
    (c.facts || []).forEach((f) => collectC(f.cite));
    (c.sections || []).forEach((sec) => (sec.blocks || []).forEach((b) => { (b.parts || []).forEach((x) => collectC(x.cite)); (b.items || []).forEach((x) => collectC(x.cite)); collectC(b.cite); }));
    if (weakC.size) warn(`${w}: poggia su fonti non ancora verificate: ${[...weakC].join(", ")}.`);
  }
  // --- schede dei popoli: stessa famiglia di blocchi; mai chiamate "tribù"; le bozze sono ammesse, le schede pubblicate richiedono fonti verificate e una rilettura
  const peopleSlugs = new Set();
  for (const { file, data: c } of peoples) {
    const w = `peoples/${file}`;
    if (!c.slug || !SLUG.test(c.slug)) err(`${w}: slug mancante o non valido.`);
    else if (`${c.slug}.json` !== file) err(`${w}: lo slug "${c.slug}" deve coincidere con il nome del file.`);
    if (peopleSlugs.has(c.slug)) err(`${w}: slug duplicato.`);
    peopleSlugs.add(c.slug);
    if (!["draft", "published"].includes(c.status)) err(`${w}: status deve essere "draft" o "published".`);
    if (!Array.isArray(c.countries) || !c.countries.length) err(`${w}: countries deve elencare almeno un paese.`);
    (c.countries || []).forEach((iso) => { if (!/^[A-Z]{3}$/.test(iso) || (countries && !(countries.countries || []).some((x) => x.iso3 === iso))) err(`${w}: country "${iso}" non valido.`); });
    for (const k of ["name", "subtitle"]) if (!c[k]) err(`${w}: manca "${k}".`);
    if (/\btribe/i.test(`${c.name} ${c.subtitle}`)) err(`${w}: il titolo non usa la parola "tribe": vedi la storia "Does Africa really have tribes?".`);
    checkDeeper(c.deeper, w);
    (c.keyPoints || []).forEach((x, ki) => { if (!x.text) err(`${w}: keyPoints[${ki}] senza testo.`); if (x.cite) checkCite(x.cite, `${w}: keyPoints[${ki}]`); else if (x.editorial !== true) err(`${w}: keyPoints[${ki}] senza fonte né "editorial".`); });
    const seenP = new Set();
    (c.sections || []).forEach((sec, si) => {
      const sw = `${w}: sections[${si}]`;
      if (!sec.id || !sec.title) err(`${sw}: manca id o title.`);
      if (seenP.has(sec.id)) err(`${sw}: id "${sec.id}" duplicato.`);
      seenP.add(sec.id);
      (sec.blocks || []).forEach((b, bi) => checkRichBlock(b, `${sw}.blocks[${bi}]`, checkCite));
    });
    if (!Array.isArray(c.gaps) || !c.gaps.length) err(`${w}: "gaps" (ciò che non si sa) deve avere almeno una voce.`);
    if (c.status === "published") {
      if (!(c.keyPoints || []).length) err(`${w}: una scheda pubblicata richiede keyPoints.`);
      if ((c.sections || []).length < 2) err(`${w}: una scheda pubblicata richiede almeno 2 sezioni.`);
      if (!c.reviewedBy) err(`${w}: una scheda pubblicata richiede "reviewedBy" (chi del popolo, o chi lo studia, l'ha riletta).`);
    }
    const weakP = new Set();
    const collectP = (cite) => (cite || []).forEach((id) => { const s2 = sources.get(id); if (s2 && s2.status !== "verified") weakP.add(id); });
    (c.keyPoints || []).forEach((x) => collectP(x.cite));
    (c.sections || []).forEach((sec) => (sec.blocks || []).forEach((b) => { (b.parts || []).forEach((x) => collectP(x.cite)); (b.items || []).forEach((x) => collectP(x.cite)); collectP(b.cite); }));
    if (weakP.size) warn(`${w}: poggia su fonti non ancora verificate: ${[...weakP].join(", ")}.`);
  }
  // --- registro dei piatti: collega le proposte alle schede senza imporre che siano già tutte scritte
  if (proposedDishes && proposedDishes.dishes) {
    const dishPlaces = places.filter(({ data: p }) => p.type === "dish");
    const placesByCountry = new Map(dishPlaces.map(({ data: p }) => [p.country, p]));
    const done = new Set(proposedDishes.status?.done || []);
    for (const { file, data: p } of dishPlaces) {
      const proposal = proposedDishes.dishes[p.country];
      if (!proposal) warn(`places/${file}: il piatto non compare in proposed-dishes.json.`);
      if (proposal && done.has(p.country) && p.status !== "published") warn(`places/${file}: la proposta è segnata done ma la scheda non è published.`);
    }
    for (const country of done) {
      if (!placesByCountry.has(country)) warn(`proposed-dishes.json: ${country} è done ma non ha ancora una scheda dish.`);
    }
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
  // --- pagina True size: le fonti che cita, scritte in content/data/true-size.json
  if (trueSize) checkCite(trueSize.sources, "data/true-size.json");
  // --- blocchi regionali: ogni blocco ha fonte, data di verifica e membri che esistono nell'elenco dei 54 paesi
  if (blocs) {
    const known = new Set(((countries || {}).countries || []).map((c) => c.iso3));
    const ids = new Set();
    for (const b of blocs.blocs || []) {
      const w = `data/blocs.json (${b.id || "senza id"})`;
      if (!SLUG.test(b.id || "")) err(`${w}: id mancante o non valido.`);
      if (ids.has(b.id)) err(`${w}: id duplicato.`);
      ids.add(b.id);
      for (const k of ["name", "short", "founded"]) if (!b[k]) err(`${w}: manca "${k}".`);
      if (!DATE.test(b.verified || "")) err(`${w}: "verified" deve essere AAAA-MM-GG.`);
      checkCite(b.cite, w);
      if (b.foundedCite) checkCite(b.foundedCite, `${w} founded`);
      if (!Array.isArray(b.members) || !b.members.length) err(`${w}: manca l'elenco dei membri.`);
      for (const m of b.members || []) if (known.size && !known.has(m)) err(`${w}: il membro "${m}" non è tra i 54 paesi.`);
      if (new Set(b.members).size !== (b.members || []).length) err(`${w}: membri duplicati.`);
    }
  }
  // --- pagina Languages: fonti sulla disponibilità di Duolingo e su Glottolog
  if (duolingo) {
    checkCite(duolingo.sources, "data/duolingo.json");
    for (const [k, v] of Object.entries(duolingo.languages || {})) {
      if (!["yes", "no"].includes(v.status)) err(`data/duolingo.json (${k}): status deve essere "yes" o "no".`);
      checkCite(v.cite, `data/duolingo.json (${k})`);
    }
    if (!DATE.test(duolingo.checked || "")) err('data/duolingo.json: "checked" deve essere AAAA-MM-GG.');
  }
  // --- quiz: ogni domanda ha una risposta tra le opzioni, una spiegazione e almeno una fonte che esiste
  if (quiz) {
    const topics = new Set(["myths", "history", "food"]);
    const storySlugs = new Set(stories.map((x) => x.data.slug));
    const qids = new Set();
    for (const x of quiz.questions || []) {
      const w = `quiz.json (${x.id || "senza id"})`;
      if (!SLUG.test(x.id || "")) err(`${w}: id mancante o non valido.`);
      if (qids.has(x.id)) err(`${w}: id duplicato.`);
      qids.add(x.id);
      if (!topics.has(x.topic)) err(`${w}: topic "${x.topic}" non previsto.`);
      if (!x.q) err(`${w}: manca la domanda.`);
      if (!Array.isArray(x.options) || x.options.length < 3 || x.options.length > 4 || new Set(x.options).size !== x.options.length) err(`${w}: servono 3 o 4 opzioni diverse.`);
      else if (!x.options.includes(x.answer)) err(`${w}: la risposta non è tra le opzioni.`);
      if (!x.explain) err(`${w}: manca la spiegazione.`);
      checkCite(x.cite, w);
      if (x.story && !storySlugs.has(x.story)) err(`${w}: la storia "${x.story}" non esiste.`);
      if (x.place && !places.some((pl) => pl.data.slug === x.place)) err(`${w}: la scheda "${x.place}" non esiste.`);
      if (x.people && !peoples.some((pp) => pp.data.slug === x.people)) err(`${w}: il popolo "${x.people}" non esiste.`);
      if (x.capital && !capitals.some((cc) => cc.data.slug === x.capital)) err(`${w}: la capitale "${x.capital}" non esiste.`);
    }
  }
  if (quiz && quiz.phrases) {
    const seenP = new Set();
    for (const x of quiz.phrases) {
      const w = `quiz-phrases.json (${x.id || "senza id"})`;
      if (seenP.has(x.id)) err(`${w}: id duplicato.`);
      seenP.add(x.id);
      for (const k of ["label", "lang", "phrase", "meaning", "group"]) if (!x[k]) err(`${w}: manca "${k}".`);
      checkCite(x.cite, w);
    }
    if (quiz.phrases.length < 6) warn("quiz-phrases.json: servono almeno 6 frasi per avere opzioni di gruppi diversi.");
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
    else if (slug.startsWith("phrase-") && ((quiz || {}).phrases || []).some((x) => `phrase-${x.id}` === slug)) kindList = config.phraseNoteKinds || [];
    else if (slug.startsWith("capital-") && capitals.some((x) => `capital-${x.data.slug}` === slug)) kindList = config.noteKinds || [];
    else if (slug.startsWith("people-") && peoples.some((x) => `people-${x.data.slug}` === slug)) kindList = config.noteKinds || [];
    else err(`${w}: non corrisponde a un luogo, a una storia (story-<slug>), a un paese (country-<ISO3>), a una capitale (capital-<slug>), a un popolo (people-<slug>) o a una frase (phrase-<id>).`);
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
