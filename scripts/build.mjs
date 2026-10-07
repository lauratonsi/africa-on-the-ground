// npm run build: valida i contenuti e genera il sito statico in dist/.
// Opzione --drafts per includere anche le schede con status "draft" (solo per anteprima).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { root, loadAll, validate, report } from "./lib.mjs";
import { africaMap, africaPlacesMap, gambiaMap, choroplethMap, trueSizeBase, countryLocator, countryCodes, countryName } from "./map.mjs";
import { barList, pairedBars, scatter, stackedShares, fmtInt, fmtPop } from "./charts.mjs";
import { religionShares, governmentGroup, officialLanguages } from "./profiles.mjs";
import { spokenLanguages } from "./languages.mjs";

const data = loadAll();
const result = validate(data);
report(result);
if (result.errors.length) {
  console.error("\nBuild interrotto: correggi gli errori sopra.");
  process.exit(1);
}

// Il paese di una scheda deve esistere nell'elenco dei 54 stati (alcune isole piccole non hanno un contorno nella mappa).
const knownCountries = new Set(data.countries.countries.map((c) => c.iso3));
for (const { file, data: pl } of data.places) {
  if (pl.country && !countryCodes.has(pl.country) && !knownCountries.has(pl.country)) {
    console.error(`  errore: places/${file}: country "${pl.country}" non è tra i 54 stati di content/data/africa-countries.json.`);
    process.exit(1);
  }
}

const { config, sourcesList, places, notes, methodHtml } = data;
const blocsList = data.blocs ? data.blocs.blocs : [];
const sources = new Map(sourcesList.map((s) => [s.id, s]));
const includeDrafts = process.argv.includes("--drafts");
const dist = path.join(root, "dist");
// Versione degli asset: cambia quando cambiano stile, script o build, così il browser non usa file vecchi.
const VER = crypto.createHash("sha1")
  .update(["src/styles.css", "src/app.js", "src/theme.js", "src/share.js", "src/motion.js", "src/fab.js", "src/places.js", "src/truesize.js", "src/quiz.js", "scripts/build.mjs"].map((f) => fs.readFileSync(path.join(root, f))).join("\n"))
  .digest("hex").slice(0, 8);
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fmtDate = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
const prefix = (depth) => (depth === 0 ? "./" : "../".repeat(depth));
const kindLabel = Object.fromEntries(config.noteKinds.map((k) => [k.id, k.label]));
const relLabel = Object.fromEntries(config.relations.map((r) => [r.id, r.label]));
const langLabel = Object.fromEntries((config.languages || []).map((l) => [l.id, l.label]));
const types = Object.fromEntries(config.placeTypes.map((t) => [t.id, t]));
const SHAPE_SVG = {
  circle: '<circle cx="7" cy="7" r="5.5"/>',
  square: '<rect x="1.5" y="1.5" width="11" height="11"/>',
  diamond: '<rect x="2.5" y="2.5" width="9" height="9" transform="rotate(45 7 7)"/>',
  triangle: '<path d="M7 1.5 L12.6 12 L1.4 12 Z"/>',
  hexagon: '<path d="M7 1.2 L12.2 4.1 L12.2 9.9 L7 12.8 L1.8 9.9 L1.8 4.1 Z"/>'
};
const typeIcon = (id) => `<svg class="ticon" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">${SHAPE_SVG[types[id].shape]}</svg>`;

function write(rel, content) {
  const file = path.join(dist, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

const brandSvg = '<svg width="30" height="26" viewBox="0 0 30 26" aria-hidden="true"><rect class="r" x="0" y="0" width="30" height="11" rx="5.5"/><rect class="v" x="0" y="14" width="22" height="11" rx="5.5"/><circle class="s" cx="26" cy="19.5" r="4"/></svg>';

// Grafica geometrica generata: forme astratte nei colori del sito, sempre uguale per lo stesso seme.
// Non riproduce disegni di nessuna tradizione: sono quarti di cerchio, cerchi, strisce.
function art(seed, cols, rows) {
  let h = 2166136261;
  for (const ch of seed) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
  const COLORS = ["a1", "a2", "a3", "a4", "a5", "a7"];
  const pick = (arr, not) => { const ok = arr.filter((c) => !not.includes(c)); return ok[Math.floor(rnd() * ok.length)]; };
  const grid = [];
  const out = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const left = x ? grid[y][x - 1] : null, up = y ? grid[y - 1][x] : null;
      const bg = pick(COLORS, [left, up].filter(Boolean));
      (grid[y] = grid[y] || [])[x] = bg;
      const fg = pick(COLORS, [bg]);
      const shape = Math.floor(rnd() * 7), rot = Math.floor(rnd() * 4) * 90;
      const t = `translate(${x * 100} ${y * 100})`;
      let g = "";
      if (shape === 0) g = `<path class="${fg}" d="M0 100A100 100 0 0 1 100 0L100 100Z" transform="rotate(${rot} 50 50)"/>`;
      else if (shape === 1) g = `<circle class="${fg}" cx="50" cy="50" r="36"/>`;
      else if (shape === 2) g = `<path class="${fg}" d="M0 100A50 50 0 0 1 100 100Z" transform="rotate(${rot} 50 50)"/>`;
      else if (shape === 3) g = `<path class="${fg}" d="M0 0L100 100L0 100Z" transform="rotate(${rot} 50 50)"/>`;
      else if (shape === 4) g = `<rect class="${fg}" x="0" y="16" width="100" height="16"/><rect class="${fg}" x="0" y="42" width="100" height="16"/><rect class="${fg}" x="0" y="68" width="100" height="16"/>`;
      else if (shape === 5) g = `<circle class="${fg}" cx="50" cy="50" r="38"/><circle class="${bg}" cx="50" cy="50" r="18"/>`;
      else g = `<circle class="${fg}" cx="28" cy="50" r="20"/><circle class="${fg}" cx="72" cy="50" r="20"/>`;
      out.push(`<g transform="${t}"><rect class="${bg}" width="100" height="100"/>${g}</g>`);
    }
  }
  return `<svg class="art" viewBox="0 0 ${cols * 100} ${rows * 100}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${out.join("")}</svg>`;
}

const themeButton = `<button class="theme-btn" id="theme" type="button" hidden aria-label="Colour theme"><svg class="i-auto" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 2.5a7.5 7.5 0 0 1 0 15z" fill="currentColor"/></svg><svg class="i-light" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="4" fill="currentColor"/><path d="M10 1.5v2.5M10 16v2.5M1.5 10H4M16 10h2.5M4 4l1.8 1.8M14.2 14.2L16 16M16 4l-1.8 1.8M5.8 14.2L4 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><svg class="i-dark" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M16.5 12.2A7 7 0 0 1 7.8 3.5a7 7 0 1 0 8.7 8.7z" fill="currentColor"/></svg></button>`;


// Il paesaggio della home: cielo, sole, colline, fiume e baobab, disegnato a strati.
// I colori sono variabili CSS (--sky-*, --far, --mid...), quindi cambiano da soli nel tema scuro.
// compact: versione per le pagine interne (sole più basso, baobab più piccoli, niente uccelli sotto la barra)
function landscape(compact = false) {
  const sunY = compact ? 706 : 665, sunR = compact ? 120 : 132, bigL = compact ? 1.3 : 1.55, bigR = compact ? 1.5 : 1.95;
  const bao = '<g id="baobab" class="bao" stroke-linecap="round" stroke-linejoin="round"><path d="M-34 0 C-40 -50 -30 -110 -18 -160 C-16 -168 16 -168 18 -160 C30 -110 40 -50 34 0 Z" stroke="none"/><path d="M0 -160 L-62 -214 M0 -160 L-24 -230 M0 -160 L30 -232 M0 -160 L68 -210 M0 -160 L96 -176" fill="none" stroke-width="9"/><path d="M-62 -214 L-96 -222 M-62 -214 L-78 -250 M-24 -230 L-44 -266 M-24 -230 L-8 -268 M30 -232 L22 -270 M30 -232 L58 -262 M68 -210 L100 -232 M68 -210 L84 -250 M96 -176 L128 -190" fill="none" stroke-width="5"/><path d="M-96 -222 L-118 -228 M-78 -250 L-86 -280 M-44 -266 L-56 -292 M-8 -268 L2 -298 M22 -270 L18 -300 M58 -262 L78 -286 M100 -232 L126 -248 M84 -250 L96 -278" fill="none" stroke-width="3"/></g>';
  const stars = [[140, 90, 2], [300, 150, 1.6], [470, 60, 2.2], [640, 130, 1.5], [820, 70, 2], [1010, 140, 1.6], [1180, 80, 2.2], [1330, 170, 1.6], [240, 230, 1.4], [1090, 250, 1.4]]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("");
  return `<svg class="scape" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
<defs>
<linearGradient id="scSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="sk1"/><stop offset=".3" class="sk2"/><stop offset=".55" class="sk3"/><stop offset=".78" class="sk4"/><stop offset="1" class="sk5"/></linearGradient>
<radialGradient id="scGlow" cx="50%" cy="50%" r="50%"><stop offset="0" class="glow" stop-opacity=".85"/><stop offset="1" class="glow" stop-opacity="0"/></radialGradient>
<linearGradient id="scRiver" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="riv1"/><stop offset="1" class="riv2"/></linearGradient>
${bao}
</defs>
<rect width="1440" height="900" fill="url(#scSky)"/>
<g class="px" data-px="26"><g class="star">${stars}</g></g>
<g class="px" data-px="80"><g class="sunrise"><circle class="sun-m" cx="1030" cy="${sunY}" r="300" fill="url(#scGlow)"/>
<circle class="sunfill sun-m" cx="1030" cy="${sunY}" r="${sunR}"/></g></g>
<g class="px" data-px="52"><path class="far" d="M0 640 C150 600 300 625 470 605 S790 585 930 622 S1230 600 1440 630 L1440 900 L0 900 Z"/></g>
<g class="px" data-px="34"><path class="mid" d="M0 690 C200 655 380 690 560 668 S900 650 1090 685 S1330 668 1440 690 L1440 900 L0 900 Z"/>
<path d="M0 720 C260 700 520 730 800 712 S1240 700 1440 722 L1440 790 C1180 778 900 800 640 786 S180 790 0 782 Z" fill="url(#scRiver)" opacity=".92"/>
${compact ? "" : '<g class="refl sun-m" fill="none" stroke-width="3" stroke-linecap="round" opacity=".8"><path d="M970 726 h120 M990 740 h84 M1005 754 h58 M1018 768 h34"/></g>'}
<use href="#baobab" transform="translate(470 668) scale(.5)" opacity=".75"/>
<use href="#baobab" transform="translate(700 676) scale(.36)" opacity=".7"/></g>
<path class="near" d="M0 792 C240 770 520 800 820 786 S1260 776 1440 790 L1440 900 L0 900 Z"/>
<path class="ground" d="M0 850 C300 830 620 864 920 846 S1300 838 1440 850 L1440 900 L0 900 Z"/>
<use href="#baobab" transform="translate(150 880) scale(${bigL})"/>
<use href="#baobab" transform="translate(560 892) scale(.95)"/>
<g class="bR"><use href="#baobab" transform="translate(1290 892) scale(${bigR})"/></g>
${compact ? "" : `<g class="px" data-px="18"><g class="bird" fill="none" stroke-width="2.2" stroke-linecap="round" opacity=".85"><path d="M1180 300 q9 -9 18 0 q9 -9 18 0"/><path d="M1232 276 q7 -7 14 0 q7 -7 14 0"/><path d="M1148 262 q6 -6 12 0 q6 -6 12 0"/></g></g>`}
</svg>`;
}

// Onda che chiude un'apertura e porta alla carta chiara della pagina.
const heroWave = '<svg class="hero-wave" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 80 L0 44 C240 4 480 70 720 36 S1200 4 1440 40 L1440 80 Z"/></svg>';

// Apertura ridotta con il paesaggio, per le pagine che non sono la home.
function compactHero({ kicker, title, sub }) {
  return `<section class="scape-hero compact">
  ${landscape(true)}
  <div class="scape-text">
    <p class="scape-kicker">${esc(kicker)}</p>
    <h1>${esc(title)}</h1>
    ${sub ? `<p class="scape-sub">${esc(sub)}</p>` : ""}
  </div>
  ${heroWave}
</section>`;
}

function layout({ title, description, depth, body, current, script = false, extraScripts = [], bodyClass = "", jump = [] }) {
  const p = prefix(depth);
  return `<!doctype html>
<html lang="${esc(config.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="stylesheet" href="${p}styles.css?v=${VER}">
<script src="${p}theme.js?v=${VER}"></script>
</head>
<body class="has-hero${bodyClass ? ` ${bodyClass}` : ""}">
<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <div class="wrap top-in">
    <a class="brand" href="${p}index.html">${brandSvg}${esc(config.name)}</a>
    <div class="top-r">
    <nav aria-label="Main"><a href="${p}places/index.html"${current === "places" ? ' aria-current="page"' : ""}>Places</a><a href="${p}capitals/index.html"${current === "capitals" ? ' aria-current="page"' : ""}>Capitals</a><a href="${p}index.html#map">Map</a><a href="${p}countries/index.html"${current === "countries" ? ' aria-current="page"' : ""}>Countries</a><a href="${p}stories/index.html"${current === "stories" ? ' aria-current="page"' : ""}>Stories</a><a href="${p}society/index.html"${current === "society" ? ' aria-current="page"' : ""}>Society</a><a href="${p}true-size/index.html"${current === "true-size" ? ' aria-current="page"' : ""}>True size</a><a href="${p}quiz/index.html"${current === "quiz" ? ' aria-current="page"' : ""}>Quiz</a><a href="${p}method/index.html"${current === "method" ? ' aria-current="page"' : ""}>Method</a></nav>
    ${themeButton}
    </div>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="foot">
  <div class="wrap foot-in">
    <p class="foot-brand">${esc(config.name)}</p>
    <p>${esc(config.tagline)}</p>
    <p>This site sets no cookies, runs no analytics and loads nothing from other sites. Photographs are openly licensed and credited on each card. <a href="${p}method/index.html">How it works</a></p>
  </div>
</footer>
${fab(jump)}
${script ? `<div id="tip" role="tooltip" hidden></div>\n<script src="${p}app.js?v=${VER}" defer></script>\n` : ""}<script src="${p}vendor/motion.js?v=${VER}" defer></script>
<script src="${p}motion.js?v=${VER}" defer></script>
${["fab.js", ...extraScripts].map((f) => `<script src="${p}${f}?v=${VER}" defer></script>\n`).join("")}</body>
</html>
`;
}

// Pulsante flottante: salta alle sezioni della pagina o torna in cima. Senza JavaScript resta nascosto.
function fab(jump) {
  const items = [{ id: "", label: "Back to top" }, ...jump].map((j) => `<li><a href="${j.id ? "#" + esc(j.id) : "#"}"${j.id ? "" : " data-top"}>${esc(j.label)}</a></li>`).join("");
  return `<div class="fab" id="fab" hidden>
  <ul class="fab-menu" id="fab-menu" hidden>${items}</ul>
  <button type="button" class="fab-btn" id="fab-btn" aria-expanded="false" aria-controls="fab-menu" aria-label="Jump to a section"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 15l6-6 6 6"/></svg></button>
</div>`;
}

// Dichiarazione sulle fonti, calcolata: una scheda che poggia solo su UNESCO e su Wikipedia lo dice apertamente.
const REVIEW = 'It was published without a prior review by people from the place. <a href="../../method/index.html#corrections">If something is wrong or missing, tell the project</a>.';
function sourcingNote(p) {
  const ids = [...citedIds(p)].map((id) => sources.get(id)).filter(Boolean);
  if (!ids.length) return "";
  const isUnesco = (x) => /UNESCO/i.test(x.publisher || "");
  const others = ids.filter((x) => !isUnesco(x) && x.tier !== "encyclopedia");
  const hasUnesco = ids.some(isUnesco), hasWiki = ids.some((x) => x.tier === "encyclopedia");
  if (others.length) {
    const by = {}; others.forEach((x) => { by[x.tier] = (by[x.tier] || 0) + 1; });
    const list = Object.entries(by).map(([t, k]) => `${k} ${t}`).join(", ");
    return `<p class="sourcing">Sources beyond UNESCO and Wikipedia: ${others.length} (${list}). Check each source's status in the list at the end of the card. ${REVIEW}</p>`;
  }
  const base = [hasUnesco ? "UNESCO's own text" : "", hasWiki ? "Wikipedia" : ""].filter(Boolean).join(" and ");
  return `<p class="sourcing"><strong>Sourcing note.</strong> This card rests on ${base}. No independent source has been added yet, so read it as an outline, not as a finished account. ${REVIEW}</p>`;
}

function citedIds(place) {
  const ids = new Set();
  const add = (c) => (c || []).forEach((id) => ids.add(id));
  (place.facts || []).forEach((f) => add(f.cite));
  (place.sections || []).forEach((s) => (s.blocks || []).forEach((b) => {
    (b.parts || []).forEach((x) => add(x.cite));
    (b.items || []).forEach((x) => add(x.cite));
  }));
  return ids;
}

// Citazioni numerate in ordine di comparsa, con l'elenco delle fonti costruito alla fine.
function makeCiter() {
  const order = [];
  const cite = (ids) => ids.map((id) => {
    let i = order.indexOf(id);
    if (i < 0) { order.push(id); i = order.length - 1; }
    const n = i + 1;
    return `<a class="cite" href="#src-${n}" aria-label="Source ${n}">[${n}]</a>`;
  }).join("");
  const list = () => {
    const items = order.map((id, i) => {
      const s = sources.get(id);
      const n = i + 1;
      const weak = s.status !== "verified";
      const tag = esc(config.tiers[s.tier]) + (config.sourceStatus[s.status] ? ` · ${esc(config.sourceStatus[s.status])}` : "");
      const who = s.author ? `${esc(s.author)}, ` : "";
      const when = s.published ? `, ${esc(fmtDate(s.published))}` : "";
      const host = new URL(s.url).host;
      return `<li id="src-${n}"><span class="tier${weak ? " chk" : ""}">${tag}</span><span>[${n}] ${who}${esc(s.title)}. ${esc(s.publisher)}${when}. <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(host)}</a> <span class="retr">retrieved ${esc(fmtDate(s.retrieved))}</span>${s.note ? `<br><span class="retr">${esc(s.note)}</span>` : ""}</span></li>`;
    }).join("");
    return `<section class="sources" id="sec-sources"><h2>Sources</h2><ol>${items}</ol></section>`;
  };
  return { cite, list };
}


// ---------- note e modulo di collaborazione, comuni a schede, storie e paesi ----------
function noteCard(n, kinds) {
  const k = kinds.find((x) => x.id === n.kind);
  const by = [];
  by.push(`<b>${esc(n.name || "Anonymous")}</b>`);
  if (n.relation) by.push(esc(relLabel[n.relation]));
  if (n.lang) by.push(`written in ${esc(langLabel[n.lang] || n.lang)}`);
  by.push(esc(fmtDate(n.added)));
  if (n.review) by.push(`read by ${esc(n.review.by)}, ${esc(fmtDate(n.review.date))}`);
  const defs = new Map(((k || {}).fields || []).map((f) => [f.id, f]));
  const extra = Object.entries(n.fields || {}).map(([fk, fv]) => {
    const d = defs.get(fk);
    const val = d && d.type === "select" ? (d.options.find((o) => o.id === fv) || { label: fv }).label : fv;
    return `<div><dt>${esc(d ? d.label.replace(/\?$/, "") : fk)}</dt><dd>${esc(val)}</dd></div>`;
  }).join("");
  return `<article class="nt"><span class="chip">${esc(k ? k.label : n.kind)}</span><p class="txt">${esc(n.text)}</p>${extra ? `<dl class="nt-fields">${extra}</dl>` : ""}<p class="by">${by.join(" · ")}</p></article>`;
}

// Il modulo prepara un messaggio nel browser: non invia nulla dal sito. `target` dice a cosa si riferisce il messaggio.
// Per i paesi `choices` offre un menu con i paesi.
function shareSection({ type, id, name, kinds, heading, intro, depth, choices = null, choiceLabel = "Which country is this about?" }) {
  const channels = (config.channels || []).filter((c) => c.value);
  const cfg = {
    target: { type, id, name },
    choices: choices || undefined,
    kinds: kinds.map((k) => ({ id: k.id, label: k.label, question: k.question, fields: k.fields || [] })),
    channels: channels.map((c) => ({ id: c.id, label: c.label, type: c.type, value: c.value })),
    repoNote: "Sending through GitHub makes your message public at once, under your GitHub name. Use another channel if you would rather it stayed private until it is read."
  };
  const plainChannels = channels.filter((c) => c.type !== "github").map((c) => {
    const href = c.type === "whatsapp" ? `https://wa.me/${c.value}` : c.type === "email" ? `mailto:${c.value}` : c.value;
    return `<a href="${esc(href)}">${esc(c.label)}</a>`;
  }).join(", ");
  const up = "../".repeat(depth);
  const what = type === "place" ? "this card" : type === "story" ? "this story" : type === "phrase" ? "a phrase" : "a country";
  const noChannel = !channels.length;
  return `
    <section class="share" id="share" aria-labelledby="share-h">
      <h2 id="share-h">${esc(heading)}</h2>
      <p class="share-intro">${esc(intro)} Nothing is sent from this page: it prepares a message that you send yourself.</p>
      <p class="share-nojs" id="share-nojs">${plainChannels ? `Without JavaScript you can still write to the project by ${plainChannels}, and say ${esc(what)} your note is for.` : "Writing a note needs JavaScript here."}</p>
      ${noChannel ? `<p class="share-warn">The project has not published a way to receive notes yet. You can write one and copy it: it stays on your device until you send it to the person who asked you for it.</p>` : ""}
      <button type="button" class="btn-voice" id="share-open" aria-expanded="false" aria-controls="share-form" hidden>Write a note</button>
      <form class="share-form" id="share-form" hidden novalidate>
        ${choices ? `<label for="sh-target">${esc(choiceLabel)}<select id="sh-target">${choices.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("")}</select></label>` : ""}
        <label for="sh-kind">Your note is
          <select id="sh-kind">${kinds.map((k) => `<option value="${esc(k.id)}">${esc(k.label)}</option>`).join("")}</select>
        </label>
        <p class="share-q" id="sh-q"></p>
        <div class="share-fields" id="sh-fields"></div>
        <label for="sh-text">Your note
          <textarea id="sh-text" rows="6" maxlength="1200" placeholder="Write it the way you would tell a friend."></textarea>
        </label>
        <p class="share-count"><span id="sh-count">0</span> / 1200</p>
        <div class="share-row">
          <label for="sh-name"><span>Your name or nickname <span class="opt">(optional)</span></span>
            <input id="sh-name" type="text" maxlength="60" autocomplete="off">
          </label>
          <label for="sh-rel"><span>Your connection <span class="opt">(optional)</span></span>
            <select id="sh-rel"><option value="">Prefer not to say</option>${config.relations.map((r) => `<option value="${esc(r.id)}">${esc(r.label)}</option>`).join("")}</select>
          </label>
        </div>
        <label for="sh-lang">Language you wrote in
          <select id="sh-lang">${(config.languages || []).map((l) => `<option value="${esc(l.id)}">${esc(l.label)}</option>`).join("")}</select>
        </label>
        <label class="share-consent" for="sh-consent">
          <input id="sh-consent" type="checkbox">
          <span>I agree that this note may be published on this site, with the name and connection I gave. I know the repository is public and that the text stays in its history even if it is later removed from the site. My note has no email address or phone number in it. A correction is read by the project but is not published as a voice.</span>
        </label>
        <details class="share-priv">
          <summary>What happens to your note</summary>
          <p>This page sends nothing. When you press a button, your phone or computer opens WhatsApp, your email app, Signal or GitHub with the message already written, and you choose whether to send it.</p>
          <p>If you do, the message reaches the project through that service, which has its own privacy rules. The project publishes a note only if you agreed and it passes a check, and people who know the subject read it after it is published. The proof of your agreement is kept outside the public repository.</p>
          <p>You can ask for a note to be removed at any time by writing again. Removing it from the site does not erase the repository's history.</p>
        </details>
        <div class="share-actions" id="sh-actions"></div>
        <p class="share-status" id="sh-status" role="status" aria-live="polite"></p>
      </form>
      <script type="application/json" id="share-cfg">${JSON.stringify(cfg).replace(/</g, "\\u003c")}</script>
    </section>`;
}

function renderPlace(p) {
  const { cite, list: sourcesList } = makeCiter();

  const block = (b) => {
    if (b.type === "p") {
      return `<p>${b.parts.map((x) => esc(x.text) + (x.cite ? cite(x.cite) : "")).join("")}</p>`;
    }
    if (b.type === "facts") {
      return `<dl class="facts">${p.facts.map((f) => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}${cite(f.cite)}</dd></div>`).join("")}</dl>`;
    }
    if (b.type === "timeline") {
      return `<ol class="timeline">${b.items.map((it) => `<li><span class="yr">${esc(it.when)}</span><span>${esc(it.text)}${cite(it.cite)}</span></li>`).join("")}</ol>` +
        (b.note ? `<p class="note-small">${esc(b.note)}</p>` : "");
    }
    return "";
  };

  const sections = p.sections.map((s, i) =>
    `<section id="sec-${esc(s.id)}">${i === 0 ? '<div class="sec-head"><span class="layer-tag rec">In the record</span></div>' : ""}<h2>${esc(s.title)}</h2>${s.blocks.map(block).join("")}</section>`
  ).join("\n");

  const hrefSibling = (x) => `../${x.slug}/index.html`;
  let loc = "";
  if (p.coords && p.country === "GMB") {
    const c = p.coords;
    const how = c.approx ? "Approximate position" : "Position";
    const src = c.cite ? `, coordinates from ${cite(c.cite)}` : ", not yet sourced";
    loc = `<figure class="loc">${gambiaMap(published, types, { focus: p, hrefFor: hrefSibling })}<figcaption>${how} on the River Gambia${src}. Outlines: Natural Earth.</figcaption></figure>`;
  }

  const gaps = p.gaps.length
    ? `<section id="sec-gaps" class="gaps"><span class="layer-tag gap">Not yet sourced</span><ul>${p.gaps.map((g) => `<li>${esc(g)}</li>`).join("")}</ul></section>`
    : "";

  // La lista delle fonti si costruisce per ultima, quando l'ordine delle citazioni è completo.
  const sourcesHtml = sourcesList();

  const list = (notes[p.slug] || []).slice().sort((a, b) => b.added.localeCompare(a.added));
  const noteCards = list.map((n) => noteCard(n, config.noteKinds)).join("");
  const hasChannel = config.channels.some((c) => c.value);
  const share = shareSection({ type: "place", id: p.slug, name: p.name, kinds: config.noteKinds, heading: "Add your voice", intro: "If you know this place, you can write a note.", depth: 2 });
  const asks = config.noteKinds.map((k) => `<li><span class="chip">${esc(k.label)}</span> ${esc(k.question)}</li>`).join("");
  const contact = config.contact ? ` To offer a note or ask for one to be removed: ${esc(config.contact)}.` : "";

  const im = p.image;
  const imgBase = `../../img/places/${im ? esc(im.file) : ""}`;
  const heroBg = im
    ? `<picture class="phero-img"><img src="${imgBase}-1600.jpg" srcset="${imgBase}-800.jpg 800w, ${imgBase}-1600.jpg 1600w" sizes="100vw" alt="${esc(im.alt)}" fetchpriority="high"></picture><div class="phero-shade"></div>`
    : landscape();
  const credit = im
    ? `<p class="wrap photo-note">${esc(im.caption)} Photo: ${esc(im.credit)}, <a href="${esc(im.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(im.license)}</a>, via <a href="${esc(im.source)}" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a>.</p>`
    : "";

  const body = `
<section class="phero${im ? "" : " noimg"}">
  ${heroBg}
  <div class="wrap phero-in">
    <p class="phero-top crumb"><a href="../../index.html#places">&larr; All places</a></p>
    <div class="phero-text">
      <p class="kicker">${esc(p.region)}</p>
      <h1>${esc(p.name)}</h1>
      <p class="sub">${esc(p.subtitle)}</p>
      <p class="ptype"><span class="chip-type">${typeIcon(p.type)}${esc(types[p.type].label)}</span>${p.status === "draft" ? '<span class="draft">Draft, not yet public</span>' : ""}</p>
    </div>
    ${loc}
  </div>
  ${heroWave}
</section>
${credit}
<section class="wrap page-intro">
  ${sourcingNote(p)}
  <p class="lede">This card keeps two kinds of knowledge apart: what the documented record says, and what the people who know the place say. Each is labelled, so a reader always knows which one they are reading.</p>
  <ul class="legend">
    <li><span class="layer-tag rec">In the record</span> cited to a source</li>
    <li><span class="layer-tag voi">From people who know this place</span> one person's experience, shown as theirs</li>
  </ul>
  <p class="jump"><a href="#voices">Jump to what people who know this place say</a></p>
</section>
<div class="wrap">
<div class="cols">
  <article class="record" id="record">
${sections}
${gaps}
${sourcesHtml}
  </article>
  <aside class="voices" id="voices" aria-label="Notes from people who know this place">
    <div class="vhead">
      <span class="layer-tag voi">From people who know this place</span>
      <h2>What it looks like from the ground</h2>
      <p class="intro">A local's view is a different kind of source from the record. It is one person's experience, shown with the name and connection the author chose to give.</p>
    </div>
    <div class="notes">
      <div class="notes-head"><h2>Notes on this card</h2><span class="count">${list.length || ""}</span></div>
      ${list.length ? `<div class="notes">${noteCards}</div>` : `<div class="empty"><strong>No local voice on this card yet.</strong><span>Notes are added by the project once the author has agreed to publication, and are read by people from the place afterwards.</span></div>`}
    </div>
    ${share}
    <div class="asks">
      <h2>Questions we ask</h2>
      <ul>${asks}</ul>
    </div>
    <p class="fine">${hasChannel ? "Notes are never stored by this site: they reach the project by message, in person or through the form above, which only prepares the message." : "Notes are never stored by this site: for now they reach the project in person."} <a href="../../method/index.html">How notes are collected</a>.${contact}</p>
  </aside>
</div>
</div>`;

  return layout({ title: `${p.name} · ${config.name}`, description: p.subtitle, depth: 2, body, extraScripts: ["share.js"], jump: [{ id: "voices", label: "Voices" }, ...(p.sources || p.sections ? [{ id: "sec-sources", label: "Sources" }] : [])] });
}

// ---------- pagine ----------
const published = places.map((x) => x.data).filter((p) => includeDrafts || p.status === "published");

for (const p of published) write(`places/${p.slug}/index.html`, renderPlace(p));

// In vetrina: schede pubblicate di paesi diversi prima, poi le altre (non le prime tre in ordine alfabetico)
const featured = (() => {
  const chosen = (config.featured || []).map((slug) => published.find((x) => x.slug === slug && x.status === "published")).filter(Boolean);
  if (chosen.length) return chosen;
  const seen = new Set(), out = [];
  for (const p of published.filter((x) => x.status === "published")) if (!seen.has(p.country) && out.length < 3) { seen.add(p.country); out.push(p); }
  for (const p of published.filter((x) => x.status === "published")) if (out.length < 3 && !out.includes(p)) out.push(p);
  for (const p of published) if (out.length < 3 && !out.includes(p)) out.push(p);
  return out;
})();
const placeItems = featured.map((p) => {
  const n = (notes[p.slug] || []).length;
  const where = p.coords ? "" : " · not on the map";
  const media = p.image
    ? `<img src="img/places/${esc(p.image.file)}-800.jpg" srcset="img/places/${esc(p.image.file)}-800.jpg 800w, img/places/${esc(p.image.file)}-1600.jpg 1600w" sizes="(max-width: 700px) 100vw, 33vw" width="800" height="533" alt="${esc(p.image.alt)}" loading="lazy">`
    : art(p.slug, 3, 2).replace('class="art"', 'class="art pimg-art"');
  return `<li data-slug="${esc(p.slug)}" data-type="${esc(p.type)}"><a class="place" href="places/${esc(p.slug)}/index.html"><span class="pimg">${media}${p.status === "draft" ? '<span class="draft pbadge">Draft</span>' : ""}</span><span class="pbody"><span class="kicker">${esc(p.region)}</span><span class="pname">${esc(p.name)}</span><span class="psub">${esc(p.subtitle)}</span><span class="pmeta">${typeIcon(p.type)}${esc(types[p.type].label)} · ${citedIds(p).size}\u00a0${citedIds(p).size === 1 ? "source" : "sources"} · ${n ? `${n} local ${n === 1 ? "note" : "notes"}` : "no local notes yet"}${where}</span></span></a></li>`;
}).join("");

const usedTypes = config.placeTypes.filter((t) => published.some((p) => p.type === t.id));
const onMap = [...new Set(published.filter((p) => p.coords && p.country).map((p) => p.country))];
const typeLegend = usedTypes.map((t) => `<li>${typeIcon(t.id)}${esc(t.label)}</li>`).join("");
const filterChips = usedTypes.length > 1
  ? `<div class="filters" id="filters" role="group" aria-label="Filter places by type" hidden><button type="button" class="fbtn" data-filter="all" aria-pressed="true">All</button>${usedTypes.map((t) => `<button type="button" class="fbtn" data-filter="${esc(t.id)}" aria-pressed="false">${typeIcon(t.id)}${esc(t.label)}</button>`).join("")}</div>`
  : "";

const subOf = Object.fromEntries((data.countries ? data.countries.countries : []).map((c) => [c.iso3, c.subregion]));
const bigMap = published.some((p) => p.coords)
  ? africaPlacesMap(published, types, { hrefFor: (x) => `places/${x.slug}/index.html`, subOf, subregions: config.subregions, countries: data.countries ? data.countries.countries : [], countryHref: (iso) => `countries/index.html#c-${iso}` })
  : null;
const regionChips = bigMap
  ? `<div class="filters" id="regions" role="group" aria-label="Zoom the map to a region" hidden><button type="button" class="fbtn" data-vb="${bigMap.full.join(" ")}" aria-pressed="true">All Africa</button>${config.subregions.filter((r) => bigMap.views[r.id]).map((r) => `<button type="button" class="fbtn" data-vb="${bigMap.views[r.id].join(" ")}" aria-pressed="false">${esc(r.label.replace(/ Africa$/, ""))}</button>`).join("")}</div>`
  : "";
const mapSection = bigMap
  ? `<section id="map" class="band-indigo section" aria-labelledby="map-h">
  <div class="wrap">
  <div class="maphead"><h2 class="listh" id="map-h">${bigMap.count} places on the map</h2>${filterChips}</div>
  ${regionChips}
  <figure class="mapbox">${bigMap.svg}<div class="mapcard" id="mapcard" hidden><img alt="" width="800" height="533"><div class="mapcard-t"><b></b><span></span><a class="mapcard-go" href="#">Open the card</a></div></div><figcaption>Select a pin to open its card, or a region to zoom in. Positions come from the UNESCO record where the card cites it, and are otherwise approximate. Country outlines: Natural Earth, public domain.</figcaption></figure>
  <ul class="legend legend-types">${typeLegend}</ul>
  </div>
</section>`
  : "";

const cList = data.countries ? data.countries.countries : [];
const cPop = cList.reduce((a, c) => a + c.population, 0);
const countriesBand = cList.length
  ? `<section id="countries" class="band-saffron section">
  <div class="wrap teaser">
    <div class="teaser-text">
      <p class="kicker">Reference</p>
      <h2 class="listh">${cList.length} countries, ${fmtPop(cPop)} people</h2>
      <p class="lede">The map, capital, area and population of every African country, with charts and a table you can sort. The figures are the World Bank's and are cited.</p>
    </div>
    <p class="actions"><a class="btn" href="countries/index.html">Explore the country data</a></p>
  </div>
</section>`
  : "";


// ---------- Stories: storia, miti da sfatare, cucina ----------
const storyKinds = config.storyKinds || [];
const kindOf = Object.fromEntries(storyKinds.map((k) => [k.id, k]));
const stories = (data.stories || []).map((x) => x.data).filter((x) => includeDrafts || x.status === "published");
const storyHref = (x, p = "") => `${p}stories/${x.slug}/index.html`;
const wordsOf = (st) => st.sections.reduce((n, sec) => n + sec.blocks.reduce((m, b) => m + (b.parts || b.items || []).reduce((k, x) => k + String(x.text).split(/\s+/).length, 0), 0), 0);
const readMin = (st) => Math.max(1, Math.round(wordsOf(st) / 200));
const countrySlug = (name) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const cSlug = Object.fromEntries((data.countries ? data.countries.countries : []).map((c) => [c.iso3, countrySlug(c.name)]));
const cName = Object.fromEntries((data.countries ? data.countries.countries : []).map((c) => [c.iso3, c.name]));

function storyCard(st, p = "") {
  const k = kindOf[st.kind];
  return `<li><a class="scard" href="${esc(storyHref(st, p))}" data-kind="${esc(st.kind)}"><span class="kicker">${esc(k.label)} · ${readMin(st)} min read</span><span class="scard-t">${esc(st.title)}</span><span class="scard-s">${esc(st.subtitle)}</span><span class="scard-c">${(st.countries || []).map((c) => esc(cName[c] || c)).join(" · ")}</span></a></li>`;
}

function renderStory(st) {
  const { cite, list: sourcesList } = makeCiter();
  const k = kindOf[st.kind];
  const block = (b) => {
    if (b.type === "p") return `<p>${b.parts.map((x) => esc(x.text) + (x.cite ? cite(x.cite) : "")).join("")}</p>`;
    if (b.type === "timeline") return `<ol class="timeline">${b.items.map((it) => `<li><span class="yr">${esc(it.when)}</span><span>${esc(it.text)}${cite(it.cite)}</span></li>`).join("")}</ol>`;
    return "";
  };
  const secs = st.sections.map((sec, i) => `<section id="sec-${esc(sec.id)}">${i === 0 ? '<div class="sec-head"><span class="layer-tag rec">In the record</span></div>' : ""}<h2>${esc(sec.title)}</h2>${sec.blocks.map(block).join("")}</section>`).join("\n");
  const kindsHere = (config.storyNoteKinds || {})[st.kind] || [];
  const sNotes = (notes[`story-${st.slug}`] || []).slice().sort((a, b) => b.added.localeCompare(a.added));
  const voices = `<section class="story-voices" id="voices" aria-labelledby="voices-h"><span class="layer-tag voi">From people who know this</span><h2 id="voices-h">What readers add</h2>
${sNotes.length ? `<div class="notes">${sNotes.map((n) => noteCard(n, kindsHere)).join("")}</div>` : `<div class="empty"><strong>No local voice on this story yet.</strong><span>Notes are added once the author has agreed to publication, and are read by people who know the subject afterwards.</span></div>`}
${shareSection({ type: "story", id: st.slug, name: st.title, kinds: kindsHere, heading: "Add what you know", intro: st.kind === "food" ? "Do you cook this, or call it something else? Tell us." : st.kind === "myth" ? "Where did you meet this idea, and what do you see where you live?" : "Does your family or community know this differently, or know where to read more?", depth: 2 })}
</section>`;
  const gaps = `<section id="sec-gaps" class="gaps"><span class="layer-tag gap">What we do not know</span><ul>${st.gaps.map((g) => `<li>${esc(g)}</li>`).join("")}</ul></section>`;
  const relCountries = (st.countries || []).map((c) => `<a href="../../countries/${esc(cSlug[c] || "")}/index.html">${esc(cName[c] || c)}</a>`).join(", ");
  const relPlaces = (st.places || []).map((slug) => published.find((x) => x.slug === slug)).filter(Boolean).map((x) => `<a href="../../places/${esc(x.slug)}/index.html">${esc(x.name)}</a>`).join(", ");
  const toolLi = st.tool ? `<li><a href="../../${esc(st.tool.href)}/index.html">${esc(st.tool.label)}</a></li>` : "";
  const related = relCountries || relPlaces || toolLi ? `<aside class="related" aria-label="Related"><h2>Keep exploring</h2><ul>${toolLi}${relCountries ? `<li>Country figures: ${relCountries}</li>` : ""}${relPlaces ? `<li>Place cards: ${relPlaces}</li>` : ""}<li><a href="../index.html">All stories</a></li></ul></aside>` : "";
  const more = stories.filter((x) => x.slug !== st.slug && x.kind === st.kind).slice(0, 2);
  const moreHtml = more.length ? `<section class="more"><h2>More ${esc(k.label.toLowerCase())}</h2><ul class="scards">${more.map((x) => storyCard(x, "../../")).join("")}</ul></section>` : "";
  const body = `${compactHero({ kicker: k.label, title: st.title, sub: st.subtitle })}
<div class="wrap prose-hero"><p class="story-meta">${readMin(st)} minute read · every sentence below carries its source number</p>
<article class="story">${secs}
${gaps}
${voices}
${related}
${sourcesList()}
${moreHtml}</article></div>`;
  return layout({ title: `${st.title} · ${config.name}`, description: st.subtitle, depth: 2, current: "stories", body, extraScripts: ["share.js"], jump: [...st.sections.map((x) => ({ id: "sec-" + x.id, label: x.title })).slice(0, 5), { id: "sec-gaps", label: "Unknown" }, { id: "voices", label: "Add yours" }, { id: "sec-sources", label: "Sources" }] });
}

function renderStories() {
  const groups = storyKinds.map((k) => ({ k, items: stories.filter((x) => x.kind === k.id) })).filter((g) => g.items.length);
  const body = `${compactHero({ kicker: "Learn", title: "Stories", sub: "Real history, myths checked against the record, and the food behind the places." })}
<div class="wrap">
<section class="hero-lede"><p class="lede">The place cards say where. These pages say what happened, what people get wrong, and what is on the table. They follow the same rule: every claim has a source, and each story ends with what is still not known.</p></section>
${groups.map((g) => `<section id="k-${esc(g.k.id)}" class="story-group"><h2>${esc(g.k.label)}</h2><p class="blurb">${esc(g.k.blurb)}</p><ul class="scards">${g.items.map((x) => storyCard(x, "../")).join("")}</ul></section>`).join("\n")}
</div>`;
  return layout({ title: `Stories · ${config.name}`, description: "History, myths and food: short stories about Africa, each with sources.", depth: 1, current: "stories", body, jump: groups.map((g) => ({ id: "k-" + g.k.id, label: g.k.label })) });
}

const storiesBand = stories.length
  ? `<section id="stories" class="band-sand section">
  <div class="wrap">
    <div class="night-head"><h2 class="listh">Stories</h2><p class="lede">History told with its sources, myths checked against the record, and the food behind the places.</p></div>
    <ul class="scards">${stories.slice(0, 6).map((x) => storyCard(x)).join("")}</ul>
    <p class="actions"><a class="btn" href="stories/index.html">All stories</a></p>
  </div>
</section>`
  : "";
if (stories.length) {
  write("stories/index.html", renderStories());
  for (const st of stories) write(`stories/${st.slug}/index.html`, renderStory(st));
}

write("places/index.html", renderPlaces());
write("index.html", layout({
  title: config.name,
  description: config.tagline,
  depth: 0,
  script: true,
  bodyClass: "home",
  jump: [{ id: "places", label: "Places" }, { id: "layers", label: "Two layers" }, ...(mapSection ? [{ id: "map", label: "Map" }] : []), ...(storiesBand ? [{ id: "stories", label: "Stories" }] : []), ...(countriesBand ? [{ id: "countries", label: "Countries" }] : [])],
  body: `
<section class="scape-hero">
  ${landscape()}
  <div class="scape-text">
    <p class="scape-kicker">Place guides</p>
    <h1>${esc(config.name)}</h1>
    <p class="scape-sub">${esc(config.tagline)}</p>
    <p class="actions"><a class="btn btn-cream" href="#places">See the places</a></p>
  </div>
</section>
<section id="places" class="night">
  <div class="wrap">
    <div class="night-head">
      <h2 class="listh">The place cards <span class="count" id="pcount" aria-live="polite"></span></h2>
      <p class="night-note">Every card keeps two kinds of knowledge apart: what the record says and what people who know the place say.</p>
    </div>
    ${published.length ? `<ul class="places arches" id="placelist">${placeItems}</ul>
    <p class="actions night-more"><a class="btn btn-cream" href="places/index.html">Browse all ${published.length} ${published.length === 1 ? "place" : "places"}</a></p>` : "<p>No place card is published yet.</p>"}
  </div>
</section>
<div class="wave" aria-hidden="true"><svg viewBox="0 0 1440 120" preserveAspectRatio="none" focusable="false"><path d="M0 120 L0 70 C240 10 480 110 720 60 S1200 0 1440 60 L1440 120 Z"/></svg></div>
<section id="layers" class="wrap suns-sec" aria-label="The two layers of every card">
  <h2 class="suns-title">Two kinds of knowledge. Never mixed.</h2>
  <div class="suns">
    <article class="sun sun-rec">
      <span class="layer-tag">In the record</span>
      <h3>What the documents say</h3>
      <p>Every statement has a numbered citation, and every source is labelled by its kind and by how far it has been checked.</p>
    </article>
    <article class="sun sun-voi">
      <span class="layer-tag">From people who know this place</span>
      <h3>What they tell us</h3>
      <p>One person's experience, shown as theirs, with the name and connection they chose to give. Collected in person or by direct message, with consent.</p>
      <p class="sun-more">${config.channels.some((c) => c.value) ? '<a href="places/index.html">Know a place? Open its card and write a note</a>' : '<a href="method/index.html">How notes are collected</a>'}</p>
    </article>
  </div>
</section>
${mapSection}
${storiesBand}
${countriesBand}`
}));

// ---------- pagina Countries ----------
function renderCountries(list) {
  const { cite, list: sourcesList } = makeCiter();
  const subLabel = Object.fromEntries(config.subregions.map((r) => [r.id, r.label]));
  const tot = list.reduce((a, c) => ({ pop: a.pop + c.population, area: a.area + c.area }), { pop: 0, area: 0 });
  const den = (c) => c.population / c.area;
  const byPop = [...list].sort((a, b) => b.population - a.population);
  const share = (n) => `${(n / tot.pop * 100).toFixed(1)}%`;

  // classi della mappa: sei fasce per misura, una sola tinta (blu) dal chiaro allo scuro
  const TH = { pop: [2e6, 5e6, 15e6, 40e6, 100e6], area: [3e4, 1e5, 3e5, 7e5, 1.5e6], den: [10, 25, 50, 100, 200] };
  const cls = (v, th) => { const i = th.findIndex((t) => v < t); return i < 0 ? th.length + 1 : i + 1; };
  const bins = (c) => ({ pop: cls(c.population, TH.pop), area: cls(c.area, TH.area), den: cls(den(c), TH.den) });
  const LABELS = {
    pop: ["under 2 million", "2–5 million", "5–15 million", "15–40 million", "40–100 million", "100 million or more"],
    area: ["under 30,000 km²", "30,000–100,000", "100,000–300,000", "300,000–700,000", "700,000–1.5 million", "1.5 million or more"],
    den: ["under 10 per km²", "10–25", "25–50", "50–100", "100–200", "200 or more"]
  };
  const NAMES = { pop: "Population", area: "Area", den: "People per km²" };
  const count = (m, b) => list.filter((c) => bins(c)[m] === b).length;
  const legends = Object.keys(TH).map((m) => `<div class="scale" data-for="${m}"><p class="scale-t">${NAMES[m]}</p><ol>${LABELS[m].map((t, i) => `<li><span class="sw" data-b="${i + 1}"></span>${esc(t)} <span class="n">${count(m, i + 1)}</span></li>`).join("")}</ol></div>`).join("");

  const blocIds = (iso) => blocsList.filter((b) => b.members.includes(iso)).map((b) => b.id);
  const blocShorts = (iso) => blocsList.filter((b) => b.members.includes(iso)).map((b) => b.short);
  const tipOf = (c) => `${c.name}. Capital ${c.capital}. Population ${fmtInt(c.population)}, area ${fmtInt(c.area)} km²`;
  const ISLES = ["CPV", "COM", "MUS", "STP", "SYC"];
  const isles = ISLES.map((iso) => list.find((c) => c.iso3 === iso)).filter(Boolean).map((c) => {
    const b = bins(c);
    return `<span class="isle c" data-sub="${c.subregion}" data-pop="${b.pop}" data-area="${b.area}" data-den="${b.den}" data-blocs="${esc(blocIds(c.iso3).join(" "))}" data-iso="${c.iso3}" data-tip="${esc(tipOf(c))}" tabindex="0" role="button" aria-pressed="false">${esc(c.name)}</span>`;
  }).join("");

  // numeri di testa
  const kpis = [
    ["Countries", String(list.length)],
    ["People", fmtPop(tot.pop)],
    ["Total area", `${(tot.area / 1e6).toFixed(1)} million km²`],
    ["Average density", `${Math.round(tot.pop / tot.area)} per km²`]
  ].map(([k, v]) => `<div class="kpi"><span class="kl">${k}</span><span class="kv">${v}</span></div>`).join("");

  // grafico 1: dove vive la gente
  const top5 = byPop.slice(0, 5).reduce((a, c) => a + c.population, 0);
  const rest = byPop.slice(15).reduce((a, c) => a + c.population, 0);
  const chart1 = barList(byPop.slice(0, 15).map((c) => ({
    label: c.name, value: c.population, text: fmtPop(c.population).replace(" million", " M"), sub: c.subregion,
    tip: `${c.name}: ${fmtInt(c.population)} people, ${share(c.population)} of Africa`
  })), { accent: 5 });

  // grafico 2: punti, area contro popolazione
  const pts = list.map((c) => ({ name: c.name, area: c.area, population: c.population, sub: c.subregion, tip: `${c.name}: ${fmtInt(c.population)} people on ${fmtInt(c.area)} km², ${den(c) < 10 ? den(c).toFixed(1) : Math.round(den(c))} per km²` }));
  const dSorted = [...list].sort((a, b) => den(b) - den(a));
  const densest = dSorted[0], sparsest = dSorted[dSorted.length - 1];
  const bigArea = [...list].sort((a, b) => b.area - a.area)[0];
  const fmtDen = (c) => (den(c) < 10 ? den(c).toFixed(1) : String(Math.round(den(c))));
  const chart2 = scatter(pts, { labels: {
    Nigeria: [-9, 4, "end"], Algeria: [9, 4, "start"], Egypt: [-9, 4, "end"], Mauritius: [9, 4, "start"],
    Rwanda: [9, 4, "start"], Namibia: [9, 4, "start"], Gambia: [-9, 4, "end"]
  } });

  // grafico 3: quota di superficie e di popolazione per subregione
  const subs = config.subregions.map((r) => {
    const m = list.filter((c) => c.subregion === r.id);
    const p = m.reduce((a, c) => a + c.population, 0), a = m.reduce((x, c) => x + c.area, 0);
    return { id: r.id, label: r.label, popShare: p / tot.pop, areaShare: a / tot.area, p, a };
  }).sort((a, b) => b.popShare - a.popShare);
  const crowded = [...subs].sort((a, b) => b.popShare / b.areaShare - a.popShare / a.areaShare)[0];
  const chart3 = pairedBars(subs.map((r) => ({
    label: r.label, sub: r.id, values: [r.popShare, r.areaShare],
    tips: [`${r.label}: ${fmtPop(r.p)}, ${(r.popShare * 100).toFixed(1)}% of Africa's people`, `${r.label}: ${fmtInt(r.a)} km², ${(r.areaShare * 100).toFixed(1)}% of Africa's area`]
  })), ["Share of Africa's population", "Share of Africa's area"]);

  // classifiche e dati per la scheda del paese che si apre al clic
  const rank = (fn) => { const o = [...list].sort((a, b) => fn(b) - fn(a)); return Object.fromEntries(o.map((c, i) => [c.iso3, i + 1])); };
  const rPop = rank((c) => c.population), rArea = rank((c) => c.area), rDen = rank(den);
  const cardsOf = (iso) => published.filter((p) => p.country === iso);
  const profiles = JSON.parse(fs.readFileSync(path.join(root, "content", "data", "africa-profiles.json"), "utf8")).countries;
  const detailData = Object.fromEntries(list.map((c) => [c.iso3, {
    government: (profiles[c.iso3] || {}).government || "", languages: (profiles[c.iso3] || {}).languages || "", religions: (profiles[c.iso3] || {}).religions || "",
    blocs: blocShorts(c.iso3).join(", "),
    tongues: spokenLanguages(((profiles[c.iso3] || {}).languages || "")).langs.map((l) => l.name).join(", "),
    name: c.name, capital: c.capital, sub: subLabel[c.subregion], population: fmtInt(c.population), area: fmtInt(c.area),
    density: den(c) < 10 ? den(c).toFixed(1) : fmtInt(den(c)), popShare: share(c.population),
    rankPop: rPop[c.iso3], rankArea: rArea[c.iso3], rankDen: rDen[c.iso3], n: list.length,
    page: `${cSlug[c.iso3]}/index.html`,
    cards: cardsOf(c.iso3).map((p) => ({ name: p.name, href: `../places/${p.slug}/index.html` })),
    voices: (notes[`country-${c.iso3}`] || []).map((n) => noteCard(n, config.countryNoteKinds || [])).join("")
  }]));
  // tabella
  const rows = [...list].sort((a, b) => a.name.localeCompare(b.name, "en")).map((c) => {
    const cards = cardsOf(c.iso3);
    const cardLink = cards.length ? ` <a class="cardlink" href="../places/${esc(cards[0].slug)}/index.html">${cards.length === 1 ? "1 place card" : `${cards.length} place cards`}</a>` : "";
    return `<tr id="c-${c.iso3}" data-iso="${c.iso3}" tabindex="0" data-sub="${c.subregion}" data-name="${esc((c.name + " " + c.capital).toLowerCase())}"><th scope="row" data-v="${esc(c.name)}">${esc(c.name)}${cardLink}</th><td data-v="${esc(c.capital)}">${esc(c.capital)}</td><td data-v="${esc(subLabel[c.subregion])}">${esc(subLabel[c.subregion])}</td><td class="num" data-v="${c.area}">${fmtInt(c.area)}</td><td class="num" data-v="${c.population}">${fmtInt(c.population)}</td><td class="num" data-v="${den(c).toFixed(3)}">${den(c) < 10 ? den(c).toFixed(1) : fmtInt(den(c))}</td><td data-v="${esc(blocShorts(c.iso3).join(" "))}" class="blocs-cell">${esc(blocShorts(c.iso3).join(" · ") || "none of these")}</td></tr>`;
  }).join("");
  const subOptions = config.subregions.map((r) => `<option value="${r.id}">${esc(r.label)}</option>`).join("");

  function blocLegend() {
    const pick = blocsList.map((b, i) => `<button type="button" class="fbtn" data-bloc-pick="${esc(b.id)}" aria-pressed="${i === 1 ? "true" : "false"}">${esc(b.short)}</button>`).join("");
    const card = (b) => {
      const names = b.members.map((iso) => list.find((c) => c.iso3 === iso)).filter(Boolean).map((c) => c.name).sort((x, y) => x.localeCompare(y, "en"));
      return `<div class="bloc-card" data-bloc-card="${esc(b.id)}" hidden>
        <h3>${esc(b.name)} <span class="count">${b.members.length} of ${list.length} countries</span></h3>
        <p>${esc(b.founded)}${cite(b.foundedCite || b.cite)}</p>
        ${b.membersNote ? `<p>${esc(b.membersNote)}${cite(b.cite)}</p>` : ""}
        <details class="bloc-members"><summary>Member countries</summary><p>${names.map(esc).join(", ")}.</p></details>
        <p class="fine">Membership as listed by the organisation, checked ${esc(fmtDate(b.verified))}.</p>
      </div>`;
    };
    return `<div class="scale bloc-legend" data-for="bloc"><p class="scale-t">Regional bloc</p>
      <div class="filters" role="group" aria-label="Choose a regional bloc">${pick}</div>
      <p class="fine"><span class="sw" data-b="6"></span> In the bloc <span class="sw sw-out"></span> Not in it</p>
      ${blocsList.map(card).join("")}
    </div>`;
  }

  const body = `
${compactHero({ kicker: "Reference", title: "Africa by the numbers", sub: "Where each of the 54 countries sits, its capital, its area and its population." })}
<div class="wrap">
<section class="hero-lede">
  <p class="lede">The figures are the World Bank's${cite(["wb-population", "wb-area", "wb-countries"])}. The shading, the charts and the percentages are calculated here from those figures. Nothing on this page comes from local voices: it is all in the record, and the sources are listed at the bottom.</p>
</section>

<section class="kpis" aria-label="Africa in four numbers">${kpis}</section>

</div>
<div class="wrap section" data-tabs>
<section id="map" class="panel" data-tab data-tab-label="Map" aria-labelledby="cmap-h">
  <div class="phead">
    <h2 id="cmap-h">Map</h2>
    <div class="seg" id="metric" role="group" aria-label="Shade the map by" hidden>
      <button type="button" data-metric="pop" aria-pressed="true">Population</button>
      <button type="button" data-metric="area" aria-pressed="false">Area</button>
      <button type="button" data-metric="den" aria-pressed="false">People per km²</button>
      ${blocsList.length ? '<button type="button" data-metric="bloc" aria-pressed="false">Regional blocs</button>' : ""}
    </div>
  </div>
  <div class="mapwrap" data-m="pop">
    <div class="mapcol">
      ${choroplethMap(list, bins, (iso) => blocIds(iso).join(" "))}
      <p class="isles-t">Island states too small to see on the map</p>
      <div class="isles">${isles}</div>
    </div>
    <div class="legends">
      <div class="detail" id="detail" aria-live="polite" hidden><p class="detail-hint">Select a country on the map, or a row in the table, to see its figures.</p></div>
      ${legends}
      ${blocsList.length ? blocLegend() : ""}
      <p class="fine"><span class="capkey"></span> Capital city. Shaded by the metric chosen above. Western Sahara has no figures and is left unshaded. Somaliland is shaded as part of Somalia.</p>
    </div>
  </div>
  <p class="fine">Country outlines${cite(["natural-earth"])} show de facto boundaries and are not a statement about disputed ones. Subregions follow the United Nations statistical groups${cite(["un-m49"])}.</p>
</section>
<section id="charts" class="charts" data-tab data-tab-label="Charts">
  <figure class="chart">
    <h2>The five most populous countries hold ${share(top5)} of Africa's people</h2>
    <p class="chart-sub">Fifteen most populous countries, people${cite(["wb-population"])}</p>
    ${chart1}
    <figcaption>The other ${list.length - 15} countries together have ${fmtPop(rest)} people, ${share(rest)} of the total. Percentages are calculated here.</figcaption>
  </figure>
  <figure class="chart">
    <h2>${esc(crowded.label)} has the largest share of people compared with its share of land</h2>
    <p class="chart-sub">Share of the continent's population and area, by subregion${cite(["wb-population", "wb-area", "un-m49"])}</p>
    ${chart3}
    <figcaption>${esc(crowded.label)} holds ${(crowded.popShare * 100).toFixed(0)}% of the population on ${(crowded.areaShare * 100).toFixed(0)}% of the area. Shares are calculated here.</figcaption>
  </figure>
  <figure class="chart wide">
    <h2>Size says little about crowding</h2>
    <p class="chart-sub">Area against population for each country, both on logarithmic scales${cite(["wb-population", "wb-area"])}</p>
    <div class="subfilter" id="subfilter" hidden><label for="sub">Highlight</label><select id="sub"><option value="all">All subregions</option>${subOptions}</select></div>
    ${chart2}
    <figcaption>The diagonal lines mark equal density, labelled in people per km²: countries on the same line are equally crowded. Densities run from ${fmtDen(sparsest)} in ${esc(sparsest.name)} to ${fmtDen(densest)} in ${esc(densest.name)}. ${esc(bigArea.name)} is the largest by area. Density is calculated here and counts empty land, such as desert, in the area.</figcaption>
  </figure>
</section>
<section id="table" class="panel" data-tab data-tab-label="All 54 countries" aria-labelledby="tab-h">
  <div class="phead">
    <h2 id="tab-h">All ${list.length} countries <span class="count" id="tcount" aria-live="polite"></span></h2>
    <div class="tools" id="tools" hidden>
      <label class="sr" for="q">Search by country or capital</label>
      <input id="q" type="search" placeholder="Search country or capital" autocomplete="off">
      <label class="sr" for="tsub">Subregion</label>
      <select id="tsub"><option value="all">All subregions</option>${subOptions}</select>
    </div>
  </div>
  <div class="tablewrap">
    <table class="data" id="ctable">
      <thead><tr><th scope="col" data-sort="text">Country</th><th scope="col" data-sort="text">Capital</th><th scope="col" data-sort="text">Subregion</th><th scope="col" class="num" data-sort="num">Area, km²</th><th scope="col" class="num" data-sort="num">Population</th><th scope="col" class="num" data-sort="num">People per km²</th><th scope="col" data-sort="text">Regional blocs</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  <p class="fine">Population is the 2025 value and area the 2023 value, the most recent the World Bank gave for each country${cite(["wb-population", "wb-area"])}. Capitals as listed by the World Bank${cite(["wb-countries"])}. Government, languages and religions are the World Factbook's own words${cite(["cia-factbook"])}: each carries its own estimate year, and the shares come from censuses and surveys of different dates. Select a country to read them.</p>
</section>
</div>
<div class="wrap section">
${shareSection({ type: "country", id: list[0].iso3, name: list[0].name, kinds: config.countryNoteKinds || [], heading: "Know a country well?", intro: "Add what the numbers miss, or tell us what looks wrong.", depth: 1, choices: [...list].sort((a, b) => a.name.localeCompare(b.name, "en")).map((c) => ({ id: c.iso3, name: c.name })) })}
</div>
<div class="wrap section">
<section id="sec-gaps" class="gaps panel-gaps">
  <span class="layer-tag gap">Not yet sourced</span>
  <ul>
    <li>Population figures are estimates for 2025, not census counts, and countries differ in how recently they counted. This page does not show the uncertainty.</li>
    <li>Some countries have more than one capital or seat of government. The table shows one name per country, as the World Bank lists it, and does not explain the exceptions.</li>
    <li>Territories the United Nations lists under Africa, such as Western Sahara, are not included, because the World Bank gives no country figures for them.</li>
    <li>Regional blocs show membership as each organisation lists it on the date given in the Regional blocs panel. They do not show suspensions or states that have announced a withdrawal.</li>
    <li>Nothing yet on languages, economy, history or daily life. Those belong on the place cards, with their own sources and local voices.</li>
  </ul>
</section>
${sourcesList()}
</div>
<script type="application/json" id="cdata">${JSON.stringify(detailData).replace(/</g, "\\u003c")}</script>`;

  return layout({ title: `Africa by the numbers · ${config.name}`, description: "Map, capitals, area and population of the 54 African countries.", depth: 1, current: "countries", bodyClass: "still", script: true, extraScripts: ["share.js"], body, jump: [{ id: "map", label: "Map" }, { id: "charts", label: "Charts" }, { id: "table", label: "Table" }, { id: "share", label: "Add yours" }] });
}


// ---------- pagina Society: religioni, governi e lingue a confronto ----------
function renderSociety(list) {
  const { cite, list: sourcesList } = makeCiter();
  const profiles = JSON.parse(fs.readFileSync(path.join(root, "content", "data", "africa-profiles.json"), "utf8")).countries;
  const subLabel = Object.fromEntries(config.subregions.map((r) => [r.id, r.label]));
  const den = (c) => c.population / c.area;
  const decode = (t) => String(t || "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  const rows = list.map((c) => {
    const pr = profiles[c.iso3] || {};
    return { c, gov: governmentGroup(pr.government || ""), govText: pr.government || "", rel: religionShares(pr.religions || ""), langs: officialLanguages(pr.languages || ""), relText: decode(pr.religions), langText: decode(pr.languages) };
  });
  const SERIES = [{ key: "christian", label: "Christian" }, { key: "muslim", label: "Muslim" }, { key: "traditional", label: "Traditional or folk religions" }, { key: "none", label: "No religion or unaffiliated" }, { key: "asian", label: "Hindu, Buddhist and other Asian religions" }, { key: "other", label: "Other, unspecified or not counted" }];
  const withRel = rows.filter((r) => r.rel);
  const noRel = rows.filter((r) => !r.rel);
  const pct0 = (v) => `${v < 1 && v > 0 ? "<1" : Math.round(v)}%`;
  const biggest = (r) => ["christian", "muslim", "traditional", "none", "asian"].reduce((a, k) => (r.rel[k] > r.rel[a] ? k : a), "christian");
  const lead = { christian: 0, muslim: 0, traditional: 0, none: 0, asian: 0 };
  withRel.forEach((r) => lead[biggest(r)]++);
  const SHORT = { christian: "Christian", muslim: "Muslim", traditional: "traditional", none: "no religion", asian: "Hindu or Buddhist", other: "other" };

  // 1. religione: una barra per paese
  const relRows = [...withRel].sort((a, b) => b.rel.christian - a.rel.christian || b.rel.muslim - a.rel.muslim).map((r) => {
    const k = biggest(r);
    return { label: r.c.name, sub: r.c.subregion, values: r.rel, text: `${pct0(r.rel[k])} ${SHORT[k]}`, tip: `${r.c.name}: ${SERIES.map((x) => `${SHORT[x.key]} ${pct0(r.rel[x.key])}`).join(", ")}${r.rel.year ? ` (${r.rel.year} estimate)` : " (estimate year not given)"}` };
  });
  // quota per subregione: media pesata con la popolazione 2025 (stima calcolata qui, mescola anni diversi)
  const weighted = (subset) => {
    const w = subset.reduce((a, r) => a + r.c.population, 0);
    return Object.fromEntries(SERIES.map((x) => [x.key, subset.reduce((a, r) => a + r.rel[x.key] * r.c.population, 0) / w]));
  };
  const subRows = config.subregions.map((sr) => {
    const set = withRel.filter((r) => r.c.subregion === sr.id), all = rows.filter((r) => r.c.subregion === sr.id);
    if (!set.length) return null;
    const v = weighted(set);
    const missing = all.length - set.length;
    return { label: sr.label, sub: sr.id, values: v, text: `${pct0(v.christian)} Christian · ${pct0(v.muslim)} Muslim`, tip: `${sr.label}: ${SERIES.map((x) => `${SHORT[x.key]} ${pct0(v[x.key])}`).join(", ")}. Weighted by population over ${set.length} of ${all.length} countries${missing ? ` (no shares for ${all.filter((r) => !r.rel).map((r) => r.c.name).join(", ")})` : ""}.` };
  }).filter(Boolean);
  const cont = weighted(withRel);
  const covered = withRel.reduce((a, r) => a + r.c.population, 0) / list.reduce((a, c) => a + c.population, 0);

  // 2. governo
  const GOVS = ["Presidential republic", "Semi-presidential republic", "Parliamentary republic", "Constitutional monarchy", "Absolute monarchy", "Other or in transition"];
  const govCount = GOVS.map((g) => ({ g, items: rows.filter((r) => r.gov === g) })).filter((x) => x.items.length);
  const govBars = barList(govCount.map((x) => ({ label: x.g, value: x.items.length, text: String(x.items.length), tip: `${x.g}: ${x.items.map((r) => r.c.name).join(", ")}`, sub: "" })), { accent: 1 });
  const govChips = govCount.map((x) => `<div class="gov-row"><h3>${esc(x.g)} <span class="count">${x.items.length}</span></h3><ul class="chips">${x.items.map((r) => `<li title="${esc(r.govText)}">${esc(r.c.name)}</li>`).join("")}</ul></div>`).join("");
  const govTab = `<table class="xtab"><thead><tr><th scope="col">Subregion</th>${govCount.map((x) => `<th scope="col" class="n">${esc(x.g.replace(" republic", ""))}</th>`).join("")}</tr></thead><tbody>${config.subregions.map((sr) => `<tr><th scope="row">${esc(sr.label)}</th>${govCount.map((x) => `<td class="n">${x.items.filter((r) => r.c.subregion === sr.id).length || "–"}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

  // 3. lingue segnate "official" a livello nazionale
  const langN = {};
  rows.forEach((r) => r.langs.filter((l) => l.national).forEach((l) => { (langN[l.name] ||= []).push(r.c.name); }));
  const langSorted = Object.entries(langN).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  const topLang = langSorted.filter(([, v]) => v.length >= 2);
  const oneOff = langSorted.length - topLang.length;
  const langBars = barList(topLang.map(([n, v]) => ({ label: n, value: v.length, text: `${v.length} ${v.length === 1 ? "country" : "countries"}`, tip: `${n}: ${v.join(", ")}`, sub: "" })), { accent: 4 });
  const nat = (r) => r.langs.filter((l) => l.national).length;
  const noLang = rows.filter((r) => nat(r) === 0);
  const hist = [["None marked", noLang.length], ["One", rows.filter((r) => nat(r) === 1).length], ["Two", rows.filter((r) => nat(r) === 2).length], ["Three or more", rows.filter((r) => nat(r) >= 3).length]];
  const histBars = barList(hist.map(([l, n]) => ({ label: l, value: n || 0.0001, text: String(n), tip: `${l}: ${rows.filter((r) => (l === "None marked" ? nat(r) === 0 : l === "One" ? nat(r) === 1 : l === "Two" ? nat(r) === 2 : nat(r) >= 3)).map((r) => r.c.name).join(", ") || "none"}`, sub: "" })), { accent: 4 });
  const KEY_LANG = ["French", "English", "Arabic", "Portuguese"];
  const langTab = `<table class="xtab"><thead><tr><th scope="col">Subregion</th>${KEY_LANG.map((l) => `<th scope="col" class="n">${l}</th>`).join("")}</tr></thead><tbody>${config.subregions.map((sr) => {
    const set = rows.filter((r) => r.c.subregion === sr.id);
    return `<tr><th scope="row">${esc(sr.label)} <span class="count">${set.length}</span></th>${KEY_LANG.map((l) => `<td class="n">${set.filter((r) => (langN[l] || []).includes(r.c.name)).length || "–"}</td>`).join("")}</tr>`;
  }).join("")}</tbody></table>`;

  // 3b. lingue africane nominate dal Factbook, ufficiali o no
  const spokenBy = {}, unmatchedAll = [];
  rows.forEach((r) => {
    const sp = spokenLanguages(r.langText);
    sp.langs.forEach((l) => { (spokenBy[l.name] ||= []).push({ c: r.c, official: l.official }); });
    unmatchedAll.push(...sp.unmatched);
  });
  const spokenSorted = Object.entries(spokenBy).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  const spokenTop = spokenSorted.slice(0, 12);
  const spokenBars = barList(spokenTop.map(([n, v]) => ({ label: n, value: v.length, text: String(v.length), tip: `${n}: ${v.map((x) => x.c.name).join(", ")}`, sub: "" })), { accent: 4 });
  const spokenList = spokenSorted.map(([n, v]) => `<li><strong>${esc(n)}</strong> <span class="lang-c">${v.map((x) => esc(x.c.name) + (x.official ? " (official)" : "")).join(", ")}</span></li>`).join("");
  const spokenMulti = spokenSorted.filter(([, v]) => v.length > 1).length;

  // 4. due paesi a confronto
  const cmpData = Object.fromEntries(rows.map((r) => [r.c.iso3, { name: r.c.name, capital: r.c.capital, sub: subLabel[r.c.subregion], population: fmtInt(r.c.population), area: fmtInt(r.c.area), density: den(r.c) < 10 ? den(r.c).toFixed(1) : fmtInt(den(r.c)), government: r.govText || "Not given", languages: r.langText || "Not given", religions: r.relText || "Not given" }]));
  const opts = [...list].sort((a, b) => a.name.localeCompare(b.name, "en")).map((c) => `<option value="${c.iso3}">${esc(c.name)}</option>`).join("");
  const subOpts = config.subregions.map((r) => `<option value="${r.id}">${esc(r.label)}</option>`).join("");

  const body = `
${compactHero({ kicker: "Reference", title: "Society", sub: "Faith, government and language labels in the 54 countries, with a view of two countries side by side." })}
<div class="wrap">
<section class="hero-lede">
  <p class="lede">Every label here comes from the World Factbook's entry for each country${cite(["cia-factbook"])}. The language section keeps three things apart: languages marked official at national level, African language names mentioned in the entry, and Glottolog families for the fourteen quiz languages. None of these is a census of speakers. Nothing on this page comes from local voices, and the Factbook's estimates come from different years.</p>
</section>
</div>
<div class="wrap section" data-tabs>
<section id="religion" class="panel" data-tab data-tab-label="Religion" aria-labelledby="rel-h">
  <div class="phead"><h2 id="rel-h">Religion</h2>
    <div class="tools" id="cmp-tools" hidden><label class="sr" for="cmp-sub">Show subregion</label><select id="cmp-sub"><option value="all">All subregions</option>${subOpts}</select></div></div>
  <p class="cmp-find">${lead.christian} countries have a Christian plurality, ${lead.muslim} a Muslim one${lead.traditional + lead.none + lead.asian ? `, and ${lead.traditional + lead.none + lead.asian} neither` : ""}.</p>
  <p>Across the ${withRel.length} countries with shares, weighting each by its 2025 population, about ${pct0(cont.christian)} of people are counted as Christian and ${pct0(cont.muslim)} as Muslim. Those countries hold ${(covered * 100).toFixed(0)}% of Africa's people.</p>
  <div class="fold" data-fold="8" data-fold-what="countries">${stackedShares(relRows, SERIES)}</div>
  <p class="fine">Sorted by Christian share. Hover or focus a bar for every group. Countries are grouped here from the Factbook's own labels: "Roman Catholic", "Protestant" and the like count as Christian; "animist" and "folk religion" as traditional. Sub-groups inside brackets are ignored, and a share given as "less than 1%" counts as zero, so the remainder falls under "other". ${noRel.length ? `${noRel.map((r) => esc(r.c.name)).join(" and ")} ${noRel.length === 1 ? "has" : "have"} no percentages in the Factbook, so ${noRel.length === 1 ? "it is" : "they are"} left out.` : ""} Hindu, Buddhist, Sikh and Jain shares are grouped together as Asian religions; Mauritius is the only country where they are the largest group.</p>
  <h3>By subregion</h3>
  ${stackedShares(subRows, SERIES)}
  <p class="fine">Population-weighted averages of the country shares, which mix estimate years from ${Math.min(...withRel.map((r) => +r.rel.year || 9999).filter((y) => y < 9999))} to ${Math.max(...withRel.map((r) => +r.rel.year || 0))}.</p>
</section>
<section id="government" class="panel" data-tab data-tab-label="Government" aria-labelledby="gov-h">
  <h2 id="gov-h">Government</h2>
  <p class="cmp-find">${govCount[0].items.length} of ${list.length} countries are presidential republics.</p>
  ${govBars}
  <p class="fine">The Factbook gives one phrase per country; here they are sorted into six groups. "Federal" is dropped from the label. The entries can lag events: where the Factbook says a country is in transition or was formerly one type, it is placed in the last group. Hover a country for the Factbook's exact words.</p>
  <div class="fold" data-fold="2" data-fold-what="groups" data-fold-item=".gov-row"><div class="cmp-grid">${govChips}</div></div>
  <h3>By subregion</h3>
  <div class="tablewrap">${govTab}</div>
</section>
<section id="languages" class="panel" data-tab data-tab-label="Languages" aria-labelledby="lang-h">
  <h2 id="lang-h">Languages marked official</h2>
  <p class="cmp-find">${topLang[0][0]} is marked official in ${topLang[0][1].length} countries${topLang[1] ? `, ${topLang[1][0]} in ${topLang[1][1].length}` : ""}.</p>
  ${langBars}
  <p class="fine">These are only the languages the Factbook marks "official" at national level, counted by country. This is a label in the source, not a ranking by number of speakers. Regional or working languages, such as most of Ethiopia's, are not counted. ${oneOff} more languages are official in one country each. Variant names are merged (Kiswahili and Swahili). The Factbook does not mark every case: ${noLang.length ? `${noLang.map((r) => esc(r.c.name)).join(" and ")} ${noLang.length === 1 ? "has" : "have"} none marked, so ${noLang.length === 1 ? "it shows" : "they show"} as "none marked", which does not mean ${noLang.length === 1 ? "it has" : "they have"} no official language.` : "every country has one marked."}</p>
  <h3>How many official languages</h3>
  ${histBars}
  <h3>The four most shared, by subregion</h3>
  <div class="tablewrap">${langTab}</div>
  <p class="fine">Number of countries in each subregion that mark the language official; the grey number is the subregion's total.</p>
  <h3>African language names mentioned in the Factbook</h3>
  <p class="cmp-find">The Factbook entries name ${spokenSorted.length} African languages or language groups. ${esc(spokenTop[0][0])} is named for ${spokenTop[0][1].length} countries, ${esc(spokenTop[1][0])} for ${spokenTop[1][1].length}; ${spokenSorted.length - spokenMulti} are named for one country only.</p>
  <p class="chart-sub">Twelve languages named for the most countries; ties in alphabetical order</p>
  ${spokenBars}
  <p class="fine">This counts mentions in the Factbook, not speakers and not all languages spoken in a country. The Factbook writes languages differently from one country to the next: some entries list a dozen, others say "numerous indigenous languages" and name none, so a language missing here may well be spoken there. Names are matched from a list written for this page and some variants are merged: Fula includes Fulani, Pulaar and Fulfulde; Mandinka includes Maninka and Malinke; Swahili includes Kiswahili. Arabic, Afrikaans, creoles and European languages are left out, and ${unmatchedAll.length} entries that did not match a language on the list are not counted${cite(["cia-factbook"])}.</p>
  <h3>Every language matched, with its countries</h3>
  <p class="fine">For where fourteen of them come from and which can be learned on Duolingo, see <a href="../languages/index.html">Languages</a>.</p>
  <ul class="lang-list fold" data-fold="10" data-fold-what="languages" data-fold-item="li">${spokenList}</ul>
</section>
<section id="pair" class="panel" data-tab data-tab-label="Two countries" aria-labelledby="pair-h">
  <h2 id="pair-h">Two countries side by side</h2>
  <div class="pair" id="pair-pick" hidden>
    <label>First country<select id="pair-a">${opts}</select></label>
    <label>Second country<select id="pair-b">${opts}</select></label>
  </div>
  <noscript><p class="fine">Choosing two countries needs JavaScript. The figures for each country are on the <a href="../countries/index.html">Countries</a> page.</p></noscript>
  <div id="pair-out" aria-live="polite"></div>
</section>
</div>
<div class="wrap section">
${shareSection({ type: "country", id: list[0].iso3, name: list[0].name, kinds: config.countryNoteKinds || [], heading: "Know a country well?", intro: "Tell us what the figures miss, or what looks wrong.", depth: 1, choices: [...list].sort((a, b) => a.name.localeCompare(b.name, "en")).map((c) => ({ id: c.iso3, name: c.name })) })}
<section id="sec-gaps" class="gaps panel-gaps">
  <span class="layer-tag gap">Not yet sourced</span>
  <ul>
    <li>Religion and language shares come from a single source, in estimate years that range widely. Where a national census exists it should replace the Factbook figure, and has not yet been checked.</li>
    <li>The groupings are ours and flatten real differences: "Christian" joins Catholic, Protestant, Orthodox and independent churches; "Muslim" does not separate Sunni, Shia or Sufi orders.</li>
    <li>Spoken languages are only partly shown: the Factbook names some of them, and only where its entry for a country lists them. A country whose entry says "numerous indigenous languages" shows none. Numbers of speakers are not given at all.</li>
    <li>Government types are labels, not an assessment of how a country is governed in practice, and may lag recent changes.</li>
  </ul>
</section>
${sourcesList()}
</div>
<script type="application/json" id="cmpdata">${JSON.stringify(cmpData).replace(/</g, "\\u003c")}</script>`;
  return layout({ title: `Society: faith, government, language · ${config.name}`, description: "Religion, government and language labels of the 54 African countries, with two countries side by side.", depth: 1, current: "society", bodyClass: "still", script: true, extraScripts: ["share.js"], body, jump: [{ id: "religion", label: "Religion" }, { id: "government", label: "Government" }, { id: "languages", label: "Languages" }, { id: "pair", label: "Side by side" }] });
}

if (data.countries) write("countries/index.html", renderCountries(data.countries.countries));
if (data.countries) write("society/index.html", renderSociety(data.countries.countries));
// Il vecchio indirizzo /compare/ è già stato condiviso: resta una pagina che porta a quello nuovo.
write("compare/index.html", `<!doctype html>
<html lang="${esc(config.lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Moved · ${esc(config.name)}</title>
<meta http-equiv="refresh" content="0; url=../society/index.html"><link rel="canonical" href="../society/index.html"></head>
<body><p>This page is now <a href="../society/index.html">Society</a>.</p></body></html>
`);

// ---------- pagina True size: forme trascinabili sopra l'Africa, in proiezione a superficie uguale ----------
function renderTrueSize() {
  const { cite, list: sourcesList } = makeCiter();
  const ts = JSON.parse(fs.readFileSync(path.join(root, "src", "geo", "truesize.json"), "utf8"));
  const base = trueSizeBase();
  const mm = (km2) => `${(km2 / 1e6).toFixed(1)} million km²`;
  const ratio = (a) => { const r = ts.africaArea / a; return r >= 10 ? String(Math.round(r)) : r.toFixed(1); };
  const MAX = 5;
  const four = ["usa", "china", "india", "eu"].map((id) => ts.shapes.find((s) => s.id === id));
  const fourSum = four.reduce((t, s) => t + s.area, 0);
  const clientData = {
    scale: base.scale, lim: base.lim, home: [18, 2], start: "greenland", max: MAX,
    africa: ts.africaArea,
    shapes: ts.shapes.map((s) => ({ id: s.id, label: s.label, note: s.note, anchor: s.anchor, area: s.area, rings: s.rings }))
  };
  const rows = [...ts.shapes].sort((a, b) => b.area - a.area).map((s) => `<tr><th scope="row">${esc(s.label)}</th><td class="n">${esc(mm(s.area))}</td><td class="n">${ratio(s.area)}</td></tr>`).join("");
  const body = `${compactHero({ kicker: "Tool", title: "True size", sub: "Lay other countries over Africa and see how big it really is." })}
<div class="wrap section">
<section class="panel ts" aria-labelledby="ts-h">
  <h2 id="ts-h">Drag a country onto Africa</h2>
  <p class="ts-intro">The world map most of us grew up with makes land look bigger the farther it lies from the equator${cite(["wikipedia-mercator-projection"])}. This map uses another projection, Equal Earth, made to keep areas in proportion${cite(["equal-earth-paper"])}. Move a country here and its area stays true: only the shape bends a little, as on any flat map.</p>
  <div class="ts-grid">
    <div class="mapcol ts-card">
      <svg id="ts-svg" class="ts-svg" viewBox="${base.viewBox}" role="group" aria-label="Map of Africa in the Equal Earth projection. Shapes of other countries can be dragged over it; the table below gives the areas.">
        <defs><radialGradient id="tsSea" cx="50%" cy="46%" r="75%"><stop offset="0" stop-color="#2b2380"/><stop offset="1" stop-color="#0d0a2b"/></radialGradient></defs>
        <rect x="${base.box.x}" y="${base.box.y}" width="${base.box.w}" height="${base.box.h}" fill="url(#tsSea)"/>
        ${base.grat}
        <g class="ts-africa">${base.countries}</g>
        <g id="ts-layer"></g>
      </svg>
    </div>
    <div class="ts-side">
      <p id="ts-nojs" class="fine">Moving the shapes needs JavaScript. The table below gives every area.</p>
      <div id="ts-chips" class="ts-chips" role="group" aria-label="Shapes to lay over Africa" hidden>${ts.shapes.map((s) => `<button type="button" class="fbtn" data-id="${esc(s.id)}" aria-pressed="false">${esc(s.label)}</button>`).join("")}</div>
      <p class="fine ts-max">Up to ${MAX} at a time. Drag a shape, or focus it and use the arrow keys (Shift for bigger steps).</p>
      <ul id="ts-keys" class="ts-keys" aria-label="Shapes on the map"></ul>
      <p id="ts-out" class="ts-out" aria-live="polite"></p>
      <p id="ts-note" class="fine" hidden></p>
      <div class="ts-btns"><button type="button" class="fbtn" id="ts-reset">Put them back on Africa</button><button type="button" class="fbtn" id="ts-clear">Remove all</button></div>
    </div>
  </div>
  <p class="fine">Africa covers about ${esc(mm(ts.africaArea))} on this page, counting every territory Natural Earth draws on the continent${cite(["natural-earth"])}. Areas are calculated here from simplified outlines, so they are close to official figures but not the same.</p>
</section>

<section class="panel" id="numbers" aria-labelledby="num-h" style="margin-top:24px">
  <h2 id="num-h">The numbers</h2>
  <div class="tablewrap"><table class="xtab"><thead><tr><th scope="col">Shape</th><th scope="col">Area</th><th scope="col">Times in Africa</th></tr></thead><tbody>${rows}</tbody></table></div>
  <p class="fine">Calculated here from the Natural Earth outlines${cite(["natural-earth"])}, using the Equal Earth projection${cite(["equal-earth-paper"])}. Added up, the ${four.map((s) => esc(s.label.replace(/ \(.*\)$/, ""))).join(", ")} cover ${Math.round(fourSum / ts.africaArea * 100)}% of Africa's area. That is a sum of areas, not a claim that the shapes fit without gaps.</p>
</section>

<section id="sec-gaps" class="gaps panel-gaps" style="margin-top:24px">
  <span class="layer-tag gap">What this does not show</span>
  <ul>
    <li>The outlines are simplified and show de facto boundaries, so the areas are approximate and the map is illustrative, not for navigation.</li>
    <li>A shape moved here is rotated on the globe and redrawn, so near the edges of the map it can look a little different from the way it appears on a familiar map.</li>
    <li>Only nine shapes are offered. The 48 contiguous United States leave out Alaska and Hawaii, and the European Union shape is the 27 current member states, checked against the EU's official list${cite(["eu-countries"])} (membership can change; the check is dated in the source note).</li>
    <li>Size is the only thing compared. It says nothing about population, wealth or importance.</li>
  </ul>
</section>
${sourcesList()}
</div>
<script type="application/json" id="ts-data">${JSON.stringify(clientData).replace(/</g, "\\u003c")}</script>`;
  return layout({ title: `True size · ${config.name}`, description: "Drag countries over Africa on an equal-area map and compare their true size.", depth: 1, current: "true-size", bodyClass: "still", extraScripts: ["truesize.js"], body, jump: [{ id: "ts-h", label: "The map" }, { id: "numbers", label: "The numbers" }, { id: "sec-gaps", label: "Limits" }] });
}
write("true-size/index.html", renderTrueSize());

// ---------- pagina Quiz: domande tratte dalle storie e dai dati del sito, senza salvare nulla ----------
function renderQuiz(list) {
  // Generatore con seme fisso: lo stesso build produce sempre le stesse domande.
  let seed = 20261007;
  const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const pick = (a, n) => shuffle(a).slice(0, n);
  const subLabel = Object.fromEntries(config.subregions.map((r) => [r.id, r.label]));
  const gen = [];
  // capitali (si escludono i paesi con più di una capitale riconosciuta)
  const MULTI = new Set(["ZAF", "SWZ", "BEN", "CIV", "TZA"]);
  for (const c of pick(list.filter((x) => !MULTI.has(x.iso3)), 14)) {
    const others = pick(list.filter((x) => x.iso3 !== c.iso3 && !MULTI.has(x.iso3) && x.capital !== c.capital), 3).map((x) => x.capital);
    gen.push({ id: `gen-cap-${c.iso3.toLowerCase()}`, topic: "countries", q: `Which city does the World Bank list as the capital of ${c.name}?`, options: shuffle([c.capital, ...others]), answer: c.capital, explain: `The World Bank lists ${c.capital} as the capital of ${c.name}. Some countries have more than one seat of government, so questions skip those.`, cite: ["wb-countries"] });
  }
  // popolazione e area: coppie con un divario netto, così la risposta non dipende dall'arrotondamento
  const pair = (key, label, unit, fmt, src, n) => {
    let made = 0, guard = 0;
    while (made < n && guard++ < 400) {
      const [a, b] = pick(list, 2);
      const hi = a[key] >= b[key] ? a : b, lo = hi === a ? b : a;
      if (hi[key] / lo[key] < 1.5) continue;
      const id = `gen-${key}-${hi.iso3.toLowerCase()}-${lo.iso3.toLowerCase()}`;
      if (gen.some((g) => g.id === id)) continue;
      gen.push({ id, topic: "countries", q: `Which has ${label}: ${a.name} or ${b.name}?`, options: shuffle([a.name, b.name]), answer: hi.name, explain: `${hi.name}: ${fmt(hi[key])}${unit}. ${lo.name}: ${fmt(lo[key])}${unit}. World Bank figures, ${key === "population" ? "2025 estimates" : "2023 values, total area including inland water"}.`, cite: [src] });
      made++;
    }
  };
  pair("population", "more people", "", (n) => fmtPop(n), "wb-population", 10);
  pair("area", "the larger area", " km²", (n) => fmtInt(n), "wb-area", 10);
  // sottoregioni ONU
  for (const c of pick(list, 10)) {
    const ids = config.subregions.map((r) => r.id);
    const options = shuffle(pick(ids.filter((i) => i !== c.subregion), 3).concat(c.subregion)).map((i) => subLabel[i]);
    gen.push({ id: `gen-sub-${c.iso3.toLowerCase()}`, topic: "countries", q: `In which United Nations statistical subregion is ${c.name}?`, options, answer: subLabel[c.subregion], explain: `The UN statistical division places ${c.name} in ${subLabel[c.subregion]}. The groups are for statistical convenience and imply no political affiliation.`, cite: ["un-m49"] });
  }
  // blocchi regionali: i paesi con uno stato incerto o contestato non vengono mai usati
  const SKIP = new Set(["BFA", "MLI", "NER", "SDN", "GIN", "ESH"]);
  for (const b of blocsList.filter((x) => x.id !== "au")) {
    const inB = list.filter((c) => b.members.includes(c.iso3) && !SKIP.has(c.iso3)), outB = list.filter((c) => !b.members.includes(c.iso3) && !SKIP.has(c.iso3));
    const yesList = pick(inB, 2);
    for (let k = 0; k < yesList.length; k++) {
      const yes = yesList[k], no = pick(outB, 3);
      gen.push({ id: `gen-bloc-${b.id}-${k}`, topic: "blocs", q: `Which of these countries is on the member list of the ${b.name} (${b.short})?`, options: shuffle([yes.name, ...no.map((c) => c.name)]), answer: yes.name, explain: `${yes.name} is on the ${b.short} member list as checked on ${fmtDate(b.verified)}. Membership changes, so the date matters.`, cite: b.cite });
    }
  }
  // "Che lingua è questa?": una frase, quattro lingue. I distrattori vengono preferibilmente da gruppi diversi (due lingue sotho-tswana
  // vicine sarebbero un trabocchetto, non una domanda), e la risposta dice in quali paesi il Factbook nomina la lingua.
  const profilesQ = JSON.parse(fs.readFileSync(path.join(root, "content", "data", "africa-profiles.json"), "utf8")).countries;
  const spokenBy = {};
  list.forEach((c) => spokenLanguages(String((profilesQ[c.iso3] || {}).languages || "")).langs.forEach((l) => { (spokenBy[l.name] ||= []).push({ c }); }));
  const phrases = (data.quiz && data.quiz.phrases) || [];
  for (const ph of phrases) {
    const far = phrases.filter((x) => x.id !== ph.id && x.group !== ph.group), near = phrases.filter((x) => x.id !== ph.id && x.group === ph.group);
    const others = [...pick(far, 3), ...pick(near, 3)].slice(0, 3);
    const where = (spokenBy[ph.lang] || []).map((x) => x.c.name);
    gen.push({ id: `gen-lang-${ph.id}`, topic: "languages", q: `Which language is this?  “${ph.phrase}”`, options: shuffle([ph.label, ...others.map((x) => x.label)]), answer: ph.label, explain: `“${ph.phrase}” means “${ph.meaning}” in ${ph.label}.${where.length ? ` The World Factbook names it for ${where.length === 1 ? where[0] : `${where.slice(0, -1).join(", ")} and ${where[where.length - 1]}`}.` : ""} The phrase comes from a travellers' phrasebook and has not been checked by a speaker. If you speak this language and see a mistake, tell us.`, cite: [...ph.cite, "cia-factbook"] });
  }
  const curated = data.quiz ? data.quiz.questions : [];
  const all = [...curated, ...gen];
  const ids = [...new Set(all.flatMap((x) => x.cite))];
  const srcOut = Object.fromEntries(ids.map((id) => { const x = sources.get(id); return [id, { title: x.title, publisher: x.publisher, url: x.url, tier: config.tiers[x.tier], status: config.sourceStatus[x.status] || "", weak: x.status !== "verified" }]; }));
  const topics = [
    { id: "mixed", label: "A bit of everything", blurb: "Eight questions from every topic." },
    { id: "myths", label: "Myths and maps", blurb: "Ideas about Africa that the record does not support." },
    { id: "history", label: "History", blurb: "Aksum, Mali and the written record." },
    { id: "food", label: "Food", blurb: "Injera and jollof rice." },
    { id: "countries", label: "Countries", blurb: "Capitals, population, area and regions." },
    { id: "languages", label: "Which language is this?", blurb: "A phrase, four languages: guess it, then see where it is spoken." },
    { id: "blocs", label: "Regional blocs", blurb: "Who belongs to which organisation." }
  ];
  const counts = Object.fromEntries(topics.map((t) => [t.id, t.id === "mixed" ? all.length : all.filter((x) => x.topic === t.id).length]));
  const payload = { questions: all.map((x) => ({ id: x.id, t: x.topic, q: x.q, o: x.options, a: x.answer, e: x.explain, c: x.cite, s: x.story ? `../stories/${x.story}/index.html` : "" })), sources: srcOut, rounds: 8 };
  const body = `${compactHero({ kicker: "Learn", title: "Quiz", sub: "Questions drawn from the stories and figures on this site. Each answer comes with its source." })}
<div class="wrap section">
<section class="panel quiz" id="quiz" aria-labelledby="quiz-h">
  <h2 id="quiz-h">Test what you know</h2>
  <p class="quiz-intro">Every answer is a fact from this site, with its source beside it. Nothing you answer is saved or sent anywhere: the site sets no cookies and keeps no score once you leave the page.</p>
  <noscript><p class="fine">The quiz needs JavaScript. The facts it uses are in the <a href="../stories/index.html">stories</a> and on the <a href="../countries/index.html">Countries</a> page.</p></noscript>
  <div id="quiz-start" hidden>
    <ul class="quiz-topics">${topics.map((t) => `<li><button type="button" class="quiz-topic" data-topic="${t.id}"><span class="qt-name">${esc(t.label)}</span><span class="qt-blurb">${esc(t.blurb)}</span><span class="qt-n">${counts[t.id]} questions</span></button></li>`).join("")}</ul>
  </div>
  <div id="quiz-play" hidden aria-live="polite"></div>
</section>
<section id="sec-gaps" class="gaps panel-gaps" style="margin-top:24px">
  <span class="layer-tag gap">What the quiz is, and is not</span>
  <ul>
    <li>The questions about stories rest on the same sources as the stories, and most of those are still Wikipedia articles that have not been checked against stronger sources. The quiz shows each source's status next to the answer.</li>
    <li>The language questions use phrases from travellers' phrasebooks that no speaker has checked yet. The <a href="../languages/index.html">Languages</a> page says more about each language, and has a form for people who speak them.</li>
    <li>Questions about countries use the World Bank's figures and the UN's statistical groups, as on the Countries page. Capitals, population and area are the World Bank's, and countries with more than one capital are left out.</li>
    <li>Bloc questions follow each organisation's own member list on the date shown with the answer. Countries whose status is disputed or recently changed are never used in them.</li>
    <li>It is a way to remember facts, not a measure of knowledge. Where the record is uncertain, the answer says so.</li>
  </ul>
</section>
</div>
<script type="application/json" id="quiz-data">${JSON.stringify(payload).replace(/</g, "\\u003c")}</script>`;
  return layout({ title: `Quiz · ${config.name}`, description: "A quiz built from the stories, countries and regional blocs on this site, with a source for every answer.", depth: 1, current: "quiz", bodyClass: "still", extraScripts: ["quiz.js"], body, jump: [{ id: "quiz-h", label: "The quiz" }, { id: "sec-gaps", label: "Limits" }] });
}
write("quiz/index.html", renderQuiz(data.countries.countries));

// ---------- pagina Languages: famiglia, dove sono nominate, Duolingo, e il modulo per chi le parla ----------
function renderLanguages(list) {
  const { cite, list: sourcesList } = makeCiter();
  const phrases = (data.quiz && data.quiz.phrases) || [];
  const glot = JSON.parse(fs.readFileSync(path.join(root, "content", "data", "glottolog-langs.json"), "utf8")).languages;
  const duo = data.duolingo, duoL = duo.languages;
  const profilesL = JSON.parse(fs.readFileSync(path.join(root, "content", "data", "africa-profiles.json"), "utf8")).countries;
  const spokenBy = {};
  list.forEach((c) => spokenLanguages(String((profilesL[c.iso3] || {}).languages || "")).langs.forEach((l) => { (spokenBy[l.name] ||= []).push(c.name); }));
  const yes = phrases.filter((p) => (duoL[p.id] || {}).status === "yes"), no = phrases.filter((p) => (duoL[p.id] || {}).status !== "yes");
  const names = (a) => a.length < 2 ? a.map((x) => x.label).join("") : `${a.slice(0, -1).map((x) => x.label).join(", ")} and ${a[a.length - 1].label}`;
  const rows = phrases.map((p) => {
    const g = glot[p.id], where = spokenBy[p.lang] || [], d = duoL[p.id] || {};
    return `<tr><th scope="row">${esc(p.label)}</th><td>${g ? `<a href="https://glottolog.org/resource/languoid/id/${esc(g.glottocode)}" target="_blank" rel="noopener noreferrer">${esc(g.family || "Unclassified")}</a>${g.name !== p.label.replace(/ \(.*\)$/, "") ? ` <span class="fine">(Glottolog: ${esc(g.name)})</span>` : ""}` : "–"}</td><td>${where.length ? esc(where.join(", ")) : "<span class=\"fine\">not named</span>"}</td><td><span class="duo ${d.status === "yes" ? "yes" : "no"}">${d.status === "yes" ? "Yes" : "No"}</span></td></tr>`;
  }).join("");
  const duoItems = phrases.map((p) => { const d = duoL[p.id] || {}; return (d.status === "yes" || p.id === "xhosa") ? `<li><strong>${esc(p.label)}.</strong> ${esc(d.note)}${cite(d.cite)}</li>` : ""; }).join("");
  const noteKinds = config.phraseNoteKinds || [];
  const phraseCards = phrases.map((p) => {
    const ns = (notes[`phrase-${p.id}`] || []).slice().sort((a, b) => b.added.localeCompare(a.added));
    return `<article class="ph" id="ph-${esc(p.id)}"><h3>${esc(p.label)} <span class="ph-t">${esc(p.phrase)}</span></h3><p class="ph-m">“${esc(p.phrase)}” means “${esc(p.meaning)}”.${cite(p.cite)}</p>${ns.length ? `<div class="notes">${ns.map((n) => noteCard(n, noteKinds)).join("")}</div>` : `<p class="fine">No speaker has looked at this phrase yet.</p>`}</article>`;
  }).join("");
  const body = `${compactHero({ kicker: "Learn", title: "Languages", sub: "Fourteen African languages: where they come from, where they are mentioned, and which you can learn on Duolingo." })}
<div class="wrap"><nav class="pi-jump lang-jump" aria-label="On this page"><a href="#table">The languages</a><a href="#duolingo">Duolingo</a><a href="#phrases">Phrases</a><a href="#share">Add yours</a></nav></div>
<div class="wrap section">
<section class="panel" id="table" aria-labelledby="lg-h">
  <h2 id="lg-h">Fourteen languages</h2>
  <p class="ts-intro">These are the languages of the phrases in the <a href="../quiz/index.html">language quiz</a>. The family is Glottolog's${cite(["glottolog"])}; the countries are those whose World Factbook entry names the language${cite(["cia-factbook"])}, so a country missing from a row may well speak it.</p>
  <div class="tablewrap"><table class="xtab"><thead><tr><th scope="col">Language</th><th scope="col">Family</th><th scope="col">Factbook mentions</th><th scope="col">On Duolingo</th></tr></thead><tbody>${rows}</tbody></table></div>
  <p class="fine">Glottolog groups languages into families; here only the top-level family is shown. Atlantic-Congo is the large family that holds most languages of West, Central, East and Southern Africa, including Swahili, Zulu and Yoruba. Language names follow Glottolog where they differ: it lists the Malagasy of the highlands as Plateau Malagasy, and Twi as a variety of Akan.</p>
</section>

<section class="panel" id="duolingo" aria-labelledby="duo-h" style="margin-top:24px">
  <h2 id="duo-h">Learning them on Duolingo</h2>
  <p class="ts-intro">Of these fourteen languages, ${yes.length} can be learned on Duolingo from English: ${esc(names(yes))}. For the other ${no.length}, there is no course: Duolingo's own list of every course, for every interface language, has none${cite(["duolingo-all-courses"])}.</p>
  <ul class="duo-list">${duoItems}</ul>
  <p class="fine">Checked on ${esc(fmtDate(duo.checked))}. ${esc(duo.scope)} Courses come and go: look at Duolingo itself before relying on this. The list also has Arabic, which is spoken in North Africa but came from elsewhere, and is not counted here. Duolingo is named because many people ask; the site has no link with it and gets nothing from it.</p>
</section>

<section class="panel" id="phrases" aria-labelledby="ph-h" style="margin-top:24px">
  <h2 id="ph-h">The phrases, and the people who speak them</h2>
  <p class="ts-intro">Each phrase comes from a travellers' phrasebook, cited under it, and none has been checked by a speaker. If you speak one of these languages, you can say whether the phrase is right, how it is said where you live, or what a learner should know.</p>
  <div class="ph-list">${phraseCards}</div>
</section>
${shareSection({ type: "phrase", id: phrases[0].id, name: `${phrases[0].label}: ${phrases[0].phrase}`, kinds: noteKinds, heading: "Do you speak one of these languages?", intro: "Tell us if a phrase is right, and what you know about the language.", depth: 1, choiceLabel: "Which phrase is this about?", choices: phrases.map((p) => ({ id: p.id, name: `${p.label}: ${p.phrase}` })) })}
<section id="sec-gaps" class="gaps panel-gaps">
  <span class="layer-tag gap">What we do not know</span>
  <ul>
    <li>The phrases were read in volunteer-written phrasebooks and have not been checked by speakers. Several languages have more than one standard spelling, and the quiz uses the form the phrasebook gives.</li>
    <li>Fourteen languages are a small share of the languages of Africa. They were picked because a phrase could be read on a page, not because they matter more.</li>
    <li>The Duolingo check reads Duolingo's own list of courses; it is not a statement from the company, and it covers only the fourteen languages here, not other apps.</li>
    <li>The form to send a note is in English only. A short consent text in French and Italian, and an option to stay anonymous, still have to be written with people who use them.</li>
  </ul>
</section>
${sourcesList()}
</div>`;
  return layout({ title: `Languages · ${config.name}`, description: "Fourteen African languages: Glottolog family, countries whose Factbook entry names them, and Duolingo courses.", depth: 1, current: "quiz", bodyClass: "still", extraScripts: ["share.js"], body, jump: [{ id: "table", label: "The languages" }, { id: "duolingo", label: "Duolingo" }, { id: "phrases", label: "Phrases" }, { id: "share", label: "Add yours" }] });
}
write("languages/index.html", renderLanguages(data.countries.countries));

// ---------- una pagina per ogni paese: i dati già nel sito, messi insieme, con le schede e le storie che lo riguardano ----------
function renderCountryPage(c, list) {
  const { cite, list: sourcesList } = makeCiter();
  const profiles = JSON.parse(fs.readFileSync(path.join(root, "content", "data", "africa-profiles.json"), "utf8")).countries;
  const pr = profiles[c.iso3] || {};
  const dec = (t) => String(t || "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  const sub = (config.subregions.find((r) => r.id === c.subregion) || {}).label || "";
  const den = c.population / c.area;
  const rankOf = (fn) => [...list].sort((a, b) => fn(b) - fn(a)).findIndex((x) => x.iso3 === c.iso3) + 1;
  const rPop = rankOf((x) => x.population), rArea = rankOf((x) => x.area), rDen = rankOf((x) => x.population / x.area);
  const fmtDen = (n) => (n < 10 ? n.toFixed(1) : fmtInt(n));
  const rel = religionShares(pr.religions || "");
  const SERIES = [["christian", "Christian"], ["muslim", "Muslim"], ["traditional", "traditional religions"], ["none", "no religion"], ["asian", "Hindu, Buddhist and other Asian religions"]];
  const relText = rel ? SERIES.filter(([k]) => rel[k] >= 1).sort((a, b) => rel[b[0]] - rel[a[0]]).map(([k, l]) => `${l} ${rel[k] < 1 ? "under 1" : Math.round(rel[k])}%`).join(", ") : "";
  const gov = dec(pr.government), langs = dec(pr.languages);
  const official = officialLanguages(pr.languages || "").filter((l) => l.national).map((l) => l.name);
  const named = spokenLanguages(pr.languages || "").langs.filter((l) => !l.official).map((l) => l.name);
  const blocs = blocsList.filter((b) => b.members.includes(c.iso3));
  const cards = published.filter((p) => p.country === c.iso3);
  const myStories = stories.filter((x) => (x.countries || []).includes(c.iso3));
  const cNotes = (notes[`country-${c.iso3}`] || []).slice().sort((a, b) => b.added.localeCompare(a.added));
  const kinds = config.countryNoteKinds || [];

  const card = (pl) => {
    const media = pl.image
      ? `<img src="../../img/places/${esc(pl.image.file)}-800.jpg" alt="${esc(pl.image.alt || "")}" width="800" height="600" loading="lazy">`
      : art(pl.slug, 3, 2).replace('class="art"', 'class="art pimg-art"');
    const n = (notes[pl.slug] || []).length;
    return `<li><a class="place" href="../../places/${esc(pl.slug)}/index.html"><span class="pimg">${media}</span><span class="pbody"><span class="kicker">${esc(pl.region)}</span><span class="pname">${esc(pl.name)}</span><span class="psub">${esc(pl.subtitle)}</span><span class="pmeta">${typeIcon(pl.type)}${esc(types[pl.type].label)} · ${n ? `${n} local ${n === 1 ? "note" : "notes"}` : "no local notes yet"}</span></span></a></li>`;
  };
  const storyHrefHere = (x) => `../../stories/${x.slug}/index.html`;
  const kp = [["Population", fmtPop(c.population)], ["Area", `${fmtInt(c.area)} km²`], ["People per km²", fmtDen(den)], ["Rank by population", `${rPop} of ${list.length}`]];
  const blocCites = blocs.flatMap((b) => b.cite).filter((v, i, a) => a.indexOf(v) === i);
  const facts = [
    ["Capital", c.capital, ["wb-countries"]],
    ["Region", sub, ["un-m49"]],
    ["Population", `${fmtInt(c.population)}, 2025 estimate`, ["wb-population"]],
    ["Area", `${fmtInt(c.area)} km², including inland water`, ["wb-area"]],
    gov ? ["Government", gov, ["cia-factbook"]] : null,
    official.length ? ["Languages marked official by the Factbook", official.join(", "), ["cia-factbook"]] : null,
    named.length ? ["African languages mentioned by the Factbook", named.join(", "), ["cia-factbook"]] : null,
    relText ? ["Religion, share of people", `${relText}${rel.year ? ` (${rel.year} estimate)` : ""}`, ["cia-factbook"]] : (pr.religions ? ["Religion", dec(pr.religions), ["cia-factbook"]] : null),
    blocs.length ? ["Regional blocs", blocs.map((b) => b.short).join(", "), blocCites] : null
  ].filter(Boolean).map(([k, v, ids]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}${cite(ids)}</dd></div>`).join("");
  const lede = `${esc(c.name)} is in ${esc(sub)}. Its capital is ${esc(c.capital)}${cite(["wb-countries"])}. About ${esc(fmtPop(c.population))} people live there${cite(["wb-population"])}, on ${esc(fmtInt(c.area))} km²${cite(["wb-area"])}: ${rPop === 1 ? "the most populous" : `number ${rPop} by population`} and number ${rArea} by area of the ${list.length} countries on this site. The sentences and figures on this page are calculated from those sources; the writing about places and people is on the cards and stories below.`;
  const body = `${compactHero({ kicker: sub, title: c.name, sub: `Capital ${c.capital} · ${fmtPop(c.population)} people` })}
<div class="wrap section">
<section class="kpis" aria-label="${esc(c.name)} in four numbers">${kp.map(([k, v]) => `<div class="kpi"><span class="kl">${esc(k)}</span><span class="kv">${esc(v)}</span></div>`).join("")}</section>
<section class="panel cp" id="facts" aria-labelledby="cp-h" style="margin-top:24px">
  <h2 id="cp-h">${esc(c.name)} at a glance</h2>
  <div class="cp-grid">
    <div><p class="ts-intro">${lede}</p><dl class="facts">${facts}</dl></div>
    <div class="cp-map">${countryLocator(c.iso3, `Map of Africa with ${c.name} highlighted.`)}</div>
  </div>
</section>
${cards.length ? `<section id="places" class="cp-sec" aria-labelledby="cpl-h"><h2 id="cpl-h">Places in ${esc(c.name)}</h2><ul class="arches cp-cards">${cards.map(card).join("")}</ul></section>` : ""}
${myStories.length ? `<section id="stories" class="cp-sec" aria-labelledby="cps-h"><h2 id="cps-h">Stories that touch ${esc(c.name)}</h2><ul class="scards">${myStories.map((x) => storyCard(x, "../../")).join("")}</ul></section>` : ""}
<section id="more" class="cp-sec" aria-labelledby="cpm-h"><h2 id="cpm-h">Keep exploring</h2>
  <ul class="duo-list"><li><a href="../index.html#c-${esc(c.iso3)}">${esc(c.name)} in the table of all 54 countries</a>, to compare its figures.</li><li><a href="../../society/index.html">Society</a>: faith, government and languages side by side.</li><li><a href="../../quiz/index.html">The quiz</a>, with questions on countries, history and food.</li></ul></section>
<section class="story-voices" id="voices" aria-labelledby="cpv-h"><span class="layer-tag voi">From people who know ${esc(c.name)}</span><h2 id="cpv-h">What readers add</h2>
${cNotes.length ? `<div class="notes">${cNotes.map((n) => noteCard(n, kinds)).join("")}</div>` : `<div class="empty"><strong>No local voice on ${esc(c.name)} yet.</strong><span>Notes are added once the author has agreed to publication, and are read by people who know the subject afterwards.</span></div>`}
${shareSection({ type: "country", id: c.iso3, name: c.name, kinds, heading: `Do you know ${c.name} well?`, intro: "Add what the figures miss, or tell us what looks wrong.", depth: 2 })}
</section>
<section id="sec-gaps" class="gaps panel-gaps" style="margin-top:24px">
  <span class="layer-tag gap">Not yet sourced</span>
  <ul>
    <li>Population is an estimate for 2025 and area a 2023 value; neither is a census figure.</li>
    <li>Government, languages and religions are the World Factbook's words and carry its own estimate years. Language and religion groupings are ours and flatten real differences.</li>
    <li>This page has no history, daily life or economy of its own yet. Those belong to the place cards and stories, with their own sources and local voices.</li>
  </ul>
</section>
${sourcesList()}
</div>`;
  return layout({ title: `${c.name} · ${config.name}`, description: `${c.name}: capital, population, area, languages, religion, regional blocs, places and stories.`, depth: 2, current: "countries", bodyClass: "still", script: false, extraScripts: ["share.js"], body, jump: [{ id: "facts", label: "At a glance" }, ...(cards.length ? [{ id: "places", label: "Places" }] : []), ...(myStories.length ? [{ id: "stories", label: "Stories" }] : []), { id: "voices", label: "Add yours" }] });
}
if (data.countries) for (const c of data.countries.countries) write(`countries/${cSlug[c.iso3]}/index.html`, renderCountryPage(c, data.countries.countries));

const contactLine = config.contact ? ` Write to ${esc(config.contact)}.` : "";
write("method/index.html", layout({
  title: `Method · ${config.name}`,
  description: "How the record is sourced and how local notes are collected.",
  depth: 1,
  current: "method",
  body: (() => {
    const mm = methodHtml.match(/^\s*<h1>(.*?)<\/h1>\s*<p class="lede">(.*?)<\/p>/s);
    const rest = mm ? methodHtml.slice(mm[0].length) : methodHtml;
    return `${compactHero({ kicker: "How it works", title: mm ? mm[1] : "Method", sub: mm ? mm[2] : "" })}
<div class="wrap prose-hero"><div class="prose">${rest.replace("<!--contact-->", contactLine)}</div></div>`;
  })()
}));

// ---------- pagina Places: tutte le schede, per regione ----------
function renderPlaces() {
  const cmap = Object.fromEntries((data.countries ? data.countries.countries : []).map((c) => [c.iso3, c]));
  const groups = config.subregions.map((r) => ({ ...r, items: published.filter((p) => (cmap[p.country] || {}).subregion === r.id).sort((a, b) => a.region.localeCompare(b.region) || a.name.localeCompare(b.name)) })).filter((g) => g.items.length);
  const thumb = (p) => `<span class="prow-thumb" aria-hidden="true">${p.image ? `<img src="../img/places/${esc(p.image.file)}-800.jpg" alt="" width="56" height="72" loading="lazy">` : esc(p.name.replace(/^(The|Ancient|Old|Royal)\s+/i, "").charAt(0))}</span>`;
  const outline = (p) => { const ids = [...citedIds(p)].map((id) => sources.get(id)).filter(Boolean); return ids.length && !ids.some((x) => !/UNESCO/i.test(x.publisher || "") && x.tier !== "encyclopedia"); };
  const row = (p) => {
    const n = (notes[p.slug] || []).length;
    return `<li data-type="${esc(p.type)}" data-status="${p.status === "draft" ? "draft" : "documented"}" data-q="${esc((p.name + " " + p.region).toLowerCase())}"><a class="prow" href="${esc(p.slug)}/index.html">${thumb(p)}<span class="prow-name">${esc(p.name)}</span><span class="prow-meta">${esc(p.region)} · ${typeIcon(p.type)}${esc(types[p.type].label)} · ${citedIds(p).size}\u00a0${citedIds(p).size === 1 ? "source" : "sources"} · ${n ? `${n} local ${n === 1 ? "note" : "notes"}` : "no local notes yet"}</span>${p.status === "draft" ? '<span class="draft">Draft</span>' : outline(p) ? '<span class="tag-outline" title="This card rests on UNESCO and Wikipedia only">Outline</span>' : ""}</a></li>`;
  };
  const jumpBar = groups.map((g) => `<a href="#r-${esc(g.id)}" data-region="${esc(g.id)}">${esc(g.label)} <span class="n">${g.items.length}</span></a>`).join("");
  const usedT = config.placeTypes.filter((t) => published.some((p) => p.type === t.id));
  const hasDraft = published.some((p) => p.status === "draft");
  const chip = (attr, val, label, on) => `<button type="button" class="fbtn" data-${attr}="${esc(val)}" aria-pressed="${on ? "true" : "false"}">${label}</button>`;
  const tools = `<div class="pi-tools" id="pi-tools" hidden>
    <label class="pi-search"><span class="sr">Search places and countries</span><input type="search" id="pi-q" placeholder="Search a place or a country" autocomplete="off"></label>
    ${usedT.length > 1 ? `<div class="filters" role="group" aria-label="Filter by type" data-group="type">${chip("type", "all", "All types", true)}${usedT.map((t) => chip("type", t.id, `${typeIcon(t.id)}${esc(t.label)}`, false)).join("")}</div>` : ""}
    ${hasDraft ? `<div class="filters" role="group" aria-label="Filter by state" data-group="status">${chip("status", "all", "All cards", true)}${chip("status", "documented", "Documented", false)}${chip("status", "draft", "In preparation", false)}</div>` : ""}
  </div>`;
  const body = `${compactHero({ kicker: "Places", title: "All places", sub: "One page per place, grouped by region. Each card keeps the documented record and the local voice apart." })}
<div class="wrap places-index">
  <p class="pi-count" id="pi-count" aria-live="polite">${published.length} ${published.length === 1 ? "card" : "cards"} in ${groups.length} ${groups.length === 1 ? "region" : "regions"}${includeDrafts ? " (drafts included)" : ""}.</p>
  ${tools}
  <nav class="pi-jump" id="pi-jump" aria-label="Regions">${jumpBar}</nav>
  <p class="pi-empty" id="pi-empty" role="status" hidden>No place matches these filters. <button type="button" class="linkbtn" id="pi-reset">Clear the filters</button></p>
  ${groups.map((g) => `<section class="pgroup" id="r-${esc(g.id)}"><h2>${esc(g.label)}</h2><ul class="prows">${g.items.map(row).join("")}</ul></section>`).join("")}
</div>`;
  return layout({ title: `Places · ${config.name}`, description: "Every place card, grouped by region.", depth: 1, current: "places", body, extraScripts: ["places.js"], jump: groups.map((g) => ({ id: "r-" + g.id, label: g.label })) });
}

// ---------- pagina Capitals: il dato della capitale e lo stato della scheda urbana ----------
function renderCapitals() {
  const countries = data.countries ? data.countries.countries : [];
  const norm = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const cardFor = (c) => published.find((p) => {
    if (p.country !== c.iso3 || p.type === "dish") return false;
    const capital = norm(c.capital);
    return norm(p.name) === capital || norm(p.region).includes(capital) || norm(p.name).includes(capital);
  });
  const rows = countries.slice().sort((a, b) => a.name.localeCompare(b.name, "en")).map((c) => {
    const card = cardFor(c);
    const content = `<span class="prow-name">${esc(c.capital)}</span><span class="prow-meta">${esc(c.name)} · ${card ? esc(card.name) : "Capital card not yet written"}</span>`;
    return `<li>${card ? `<a class="prow" href="../places/${esc(card.slug)}/index.html">${content}</a>` : `<div class="prow">${content}</div>`}</li>`;
  }).join("");
  const withCards = countries.filter((c) => cardFor(c)).length;
  const body = `${compactHero({ kicker: "Places", title: "African capitals", sub: "The capital named in the country record, and the place card when one exists." })}
<div class="wrap places-index">
  <p class="pi-count">${countries.length} capitals · ${withCards} linked place cards · ${countries.length - withCards} still to write.</p>
  <section class="hero-lede"><p class="lede">A capital in the country dataset is not automatically a city guide. This index keeps the official country record visible while making the missing urban cards easy to find and complete.</p></section>
  <ul class="prows">${rows}</ul>
</div>`;
  return layout({ title: `Capitals · ${config.name}`, description: "The 54 African capitals and the place cards currently linked to them.", depth: 1, current: "capitals", body });
}

write("capitals/index.html", renderCapitals());

write("404.html", `<!doctype html>
<html lang="${esc(config.lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><title>Page not found · ${esc(config.name)}</title>
<style>body{font-family:system-ui,sans-serif;margin:0;padding:12vh 24px;max-width:36rem;margin-inline:auto;line-height:1.5}</style></head>
<body><h1>Page not found</h1><p>This page does not exist. Go back to the previous page or to the home page of ${esc(config.name)}.</p></body></html>
`);
write(".nojekyll", "");

// ---------- css e font ----------
let css = fs.readFileSync(path.join(root, "src", "styles.css"), "utf8");
const LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const LATIN_EXT = "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";
// Ogni famiglia ha due file: latin e latin-ext (serve a ŋ, ñ e altre lettere di wolof e mandinka).
// Il browser scarica il secondo solo se la pagina contiene quelle lettere.
const FONTS = [
  { file: "bricolage-grotesque-latin-opsz-normal.woff2", family: "Bricolage Grotesque", weight: "200 800", style: "normal", range: LATIN },
  { file: "bricolage-grotesque-latin-ext-opsz-normal.woff2", family: "Bricolage Grotesque", weight: "200 800", style: "normal", range: LATIN_EXT },
  { file: "source-serif-4-latin-opsz-normal.woff2", family: "Source Serif 4", weight: "200 900", style: "normal", range: LATIN },
  { file: "source-serif-4-latin-ext-opsz-normal.woff2", family: "Source Serif 4", weight: "200 900", style: "normal", range: LATIN_EXT },
  { file: "source-serif-4-latin-opsz-italic.woff2", family: "Source Serif 4", weight: "200 900", style: "italic", range: LATIN },
  { file: "source-serif-4-latin-ext-opsz-italic.woff2", family: "Source Serif 4", weight: "200 900", style: "italic", range: LATIN_EXT },
  { file: "ibm-plex-mono-latin-400-normal.woff2", family: "IBM Plex Mono", weight: "400", style: "normal", range: LATIN },
  { file: "ibm-plex-mono-latin-ext-400-normal.woff2", family: "IBM Plex Mono", weight: "400", style: "normal", range: LATIN_EXT },
  { file: "ibm-plex-mono-latin-500-normal.woff2", family: "IBM Plex Mono", weight: "500", style: "normal", range: LATIN },
  { file: "ibm-plex-mono-latin-ext-500-normal.woff2", family: "IBM Plex Mono", weight: "500", style: "normal", range: LATIN_EXT }
];
const fontDir = path.join(root, "src", "fonts");
const faces = [];
for (const f of FONTS) {
  if (fs.existsSync(path.join(fontDir, f.file))) {
    fs.mkdirSync(path.join(dist, "fonts"), { recursive: true });
    fs.copyFileSync(path.join(fontDir, f.file), path.join(dist, "fonts", f.file));
    faces.push(`@font-face{font-family:"${f.family}";src:url("fonts/${f.file}") format("woff2");font-weight:${f.weight};font-style:${f.style};font-display:swap;unicode-range:${f.range}}`);
  }
}
// La licenza OFL deve accompagnare i font distribuiti.
const licDir = path.join(fontDir, "licenses");
if (faces.length && fs.existsSync(licDir)) fs.cpSync(licDir, path.join(dist, "fonts", "licenses"), { recursive: true });
fs.copyFileSync(path.join(root, "src", "app.js"), path.join(dist, "app.js"));
fs.copyFileSync(path.join(root, "src", "theme.js"), path.join(dist, "theme.js"));
fs.copyFileSync(path.join(root, "src", "share.js"), path.join(dist, "share.js"));
fs.copyFileSync(path.join(root, "src", "motion.js"), path.join(dist, "motion.js"));
fs.copyFileSync(path.join(root, "src", "fab.js"), path.join(dist, "fab.js"));
fs.copyFileSync(path.join(root, "src", "places.js"), path.join(dist, "places.js"));
fs.copyFileSync(path.join(root, "src", "truesize.js"), path.join(dist, "truesize.js"));
fs.copyFileSync(path.join(root, "src", "quiz.js"), path.join(dist, "quiz.js"));
// Motion (MIT) è una dipendenza npm: si copia in dist come file locale, con la sua licenza.
fs.mkdirSync(path.join(dist, "vendor"), { recursive: true });
fs.copyFileSync(path.join(root, "node_modules", "motion", "dist", "motion.js"), path.join(dist, "vendor", "motion.js"));
fs.copyFileSync(path.join(root, "node_modules", "motion", "LICENSE.md"), path.join(dist, "vendor", "motion-LICENSE.md"));
// Solo le foto delle schede pubblicate: quelle delle bozze non vanno online.
for (const pl of published) {
  if (!pl.image) continue;
  for (const size of [800, 1600]) {
    const name = `${pl.image.file}-${size}.jpg`;
    fs.mkdirSync(path.join(dist, "img", "places"), { recursive: true });
    fs.copyFileSync(path.join(root, "src", "img", "places", name), path.join(dist, "img", "places", name));
  }
}
write("styles.css", (faces.length ? faces.join("\n") + "\n" : "") + css);
console.log(faces.length ? `Font locali inclusi: ${faces.length} file.` : "Nessun font locale trovato in src/fonts: uso i font di sistema.");

// ---------- controllo finale: nessuna risorsa esterna ----------
const bad = [];
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name);
    if (fs.statSync(file).isDirectory()) { walk(file); continue; }
    const text = fs.readFileSync(file, "utf8");
    if (file.endsWith(".html")) {
      const re = /<(link|script|img|iframe|source|video|audio|embed|object)\b[^>]*\b(?:src|href|data)=["']?(?:https?:)?\/\//gi;
      if (re.test(text)) bad.push(path.relative(dist, file));
    }
    if (file.endsWith(".css") && /url\(\s*["']?(?:https?:)?\/\/|@import/i.test(text)) bad.push(path.relative(dist, file));
  }
})(dist);
if (bad.length) {
  console.error(`\nErrore: risorse caricate da altri siti in: ${bad.join(", ")}. Il sito deve restare senza chiamate esterne.`);
  process.exit(1);
}
console.log(`Sito generato in dist/ (${published.length} ${published.length === 1 ? "scheda" : "schede"}).`);
