// npm run build: valida i contenuti e genera il sito statico in dist/.
// Opzione --drafts per includere anche le schede con status "draft" (solo per anteprima).
import fs from "node:fs";
import path from "node:path";
import { root, loadAll, validate, report } from "./lib.mjs";
import { africaMap, gambiaMap, countryCodes, countryName } from "./map.mjs";

const data = loadAll();
const result = validate(data);
report(result);
if (result.errors.length) {
  console.error("\nBuild interrotto: correggi gli errori sopra.");
  process.exit(1);
}

for (const { file, data: pl } of data.places) {
  if (pl.country && !countryCodes.has(pl.country)) {
    console.error(`  errore: places/${file}: country "${pl.country}" non esiste in src/geo/africa.json.`);
    process.exit(1);
  }
}

const { config, sourcesList, places, notes, methodHtml } = data;
const sources = new Map(sourcesList.map((s) => [s.id, s]));
const includeDrafts = process.argv.includes("--drafts");
const dist = path.join(root, "dist");
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fmtDate = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
const prefix = (depth) => (depth === 0 ? "./" : "../".repeat(depth));
const kindLabel = Object.fromEntries(config.noteKinds.map((k) => [k.id, k.label]));
const relLabel = Object.fromEntries(config.relations.map((r) => [r.id, r.label]));
const types = Object.fromEntries(config.placeTypes.map((t) => [t.id, t]));
const SHAPE_SVG = {
  circle: '<circle cx="7" cy="7" r="5.5"/>',
  square: '<rect x="1.5" y="1.5" width="11" height="11"/>',
  diamond: '<rect x="2.5" y="2.5" width="9" height="9" transform="rotate(45 7 7)"/>'
};
const typeIcon = (id) => `<svg class="ticon" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">${SHAPE_SVG[types[id].shape]}</svg>`;

function write(rel, content) {
  const file = path.join(dist, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

const brandSvg = '<svg width="26" height="22" viewBox="0 0 26 22" aria-hidden="true"><rect class="r" x="0" y="0" width="26" height="10"/><rect class="v" x="0" y="12" width="17" height="10"/></svg>';

function layout({ title, description, depth, body, current, script = false }) {
  const p = prefix(depth);
  return `<!doctype html>
<html lang="${esc(config.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="stylesheet" href="${p}styles.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="wrap">
<header class="top">
  <a class="brand" href="${p}index.html">${brandSvg}${esc(config.name)}</a>
  <nav><a href="${p}index.html#map">Map</a><a href="${p}index.html#places">Places</a><a href="${p}method/index.html"${current === "method" ? ' aria-current="page"' : ""}>Method</a></nav>
</header>
<main id="main">
${body}
</main>
<footer class="foot">
  <p>This site sets no cookies, runs no analytics and loads nothing from other sites. <a href="${p}method/index.html">How it works</a></p>
</footer>
</div>
${script ? `<script src="${p}app.js" defer></script>\n` : ""}</body>
</html>
`;
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

function renderPlace(p) {
  const order = [];
  const cite = (ids) => ids.map((id) => {
    let i = order.indexOf(id);
    if (i < 0) { order.push(id); i = order.length - 1; }
    const n = i + 1;
    return `<a class="cite" href="#src-${n}" aria-label="Source ${n}">[${n}]</a>`;
  }).join("");

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
  const srcItems = order.map((id, i) => {
    const s = sources.get(id);
    const n = i + 1;
    const weak = s.status !== "verified";
    const tag = esc(config.tiers[s.tier]) + (config.sourceStatus[s.status] ? ` · ${esc(config.sourceStatus[s.status])}` : "");
    const who = s.author ? `${esc(s.author)}, ` : "";
    const when = s.published ? `, ${esc(fmtDate(s.published))}` : "";
    const host = new URL(s.url).host;
    return `<li id="src-${n}"><span class="tier${weak ? " chk" : ""}">${tag}</span><span>[${n}] ${who}${esc(s.title)}. ${esc(s.publisher)}${when}. <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(host)}</a> <span class="retr">retrieved ${esc(fmtDate(s.retrieved))}</span>${s.note ? `<br><span class="retr">${esc(s.note)}</span>` : ""}</span></li>`;
  }).join("");
  const sourcesHtml = `<section class="sources" id="sec-sources"><h2>Sources</h2><ol>${srcItems}</ol></section>`;

  const list = (notes[p.slug] || []).slice().sort((a, b) => b.added.localeCompare(a.added));
  const noteCards = list.map((n) => {
    const by = [];
    by.push(`<b>${esc(n.name || "Anonymous")}</b>`);
    if (n.relation) by.push(esc(relLabel[n.relation]));
    if (n.lang) by.push(`written in ${esc(n.lang)}`);
    by.push(esc(fmtDate(n.added)));
    return `<article class="nt"><span class="chip">${esc(kindLabel[n.kind])}</span><p class="txt">${esc(n.text)}</p><p class="by">${by.join(" · ")}</p></article>`;
  }).join("");
  const asks = config.noteKinds.map((k) => `<li><span class="chip">${esc(k.label)}</span> ${esc(k.question)}</li>`).join("");
  const contact = config.contact ? ` To offer a note or ask for one to be removed: ${esc(config.contact)}.` : "";

  const body = `
<p class="crumb"><a href="../../index.html#places">&larr; All places</a></p>
<section class="hero hero-place">
  <div class="hero-text">
    <p class="kicker">${esc(p.region)}</p>
    <h1>${esc(p.name)}</h1>
    <p class="sub">${esc(p.subtitle)}</p>
    <p class="ptype"><span class="chip-type">${typeIcon(p.type)}${esc(types[p.type].label)}</span>${p.status === "draft" ? '<span class="draft">Draft, not yet public</span>' : ""}</p>
    <p class="lede">This card keeps two kinds of knowledge apart: what the documented record says, and what the people who know the place say. Each is labelled, so a reader always knows which one they are reading.</p>
    <ul class="legend">
      <li><span class="layer-tag rec">In the record</span> cited to a source</li>
      <li><span class="layer-tag voi">From people who know this place</span> one person's experience, shown as theirs</li>
    </ul>
    <p class="jump"><a href="#voices">Jump to what people who know this place say</a></p>
  </div>
  ${loc}
</section>
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
      ${list.length ? `<div class="notes">${noteCards}</div>` : `<div class="empty"><strong>No local voice on this card yet.</strong><span>Notes are added by the project once the author has agreed to publication.</span></div>`}
    </div>
    <div class="asks">
      <h2>Questions we ask</h2>
      <ul>${asks}</ul>
    </div>
    <p class="fine">Notes are collected in person or by direct message, never through this site. <a href="../../method/index.html">How notes are collected</a>.${contact}</p>
  </aside>
</div>`;

  return layout({ title: `${p.name} · ${config.name}`, description: p.subtitle, depth: 2, body });
}

// ---------- pagine ----------
const published = places.map((x) => x.data).filter((p) => includeDrafts || p.status === "published");

for (const p of published) write(`places/${p.slug}/index.html`, renderPlace(p));

const placeItems = published.map((p) => {
  const n = (notes[p.slug] || []).length;
  const where = p.coords ? "" : " · not on the map";
  return `<li data-slug="${esc(p.slug)}" data-type="${esc(p.type)}"><a class="place" href="places/${esc(p.slug)}/index.html"><span class="kicker">${esc(p.region)}</span><span class="pname">${esc(p.name)}</span><span class="psub">${esc(p.subtitle)}</span><span class="pmeta">${typeIcon(p.type)}${esc(types[p.type].label)} · ${citedIds(p).size} sources · ${n} local ${n === 1 ? "note" : "notes"}${where}${p.status === "draft" ? " · draft" : ""}</span></a></li>`;
}).join("");

const usedTypes = config.placeTypes.filter((t) => published.some((p) => p.type === t.id));
const onMap = [...new Set(published.filter((p) => p.coords && p.country).map((p) => p.country))];
const typeLegend = usedTypes.map((t) => `<li>${typeIcon(t.id)}${esc(t.label)}</li>`).join("");
const filterChips = usedTypes.length > 1
  ? `<div class="filters" id="filters" role="group" aria-label="Filter places by type" hidden><button type="button" class="fbtn" data-filter="all" aria-pressed="true">All</button>${usedTypes.map((t) => `<button type="button" class="fbtn" data-filter="${esc(t.id)}" aria-pressed="false">${typeIcon(t.id)}${esc(t.label)}</button>`).join("")}</div>`
  : "";

const mapSection = published.some((p) => p.coords)
  ? `<section id="map" class="mapsec" aria-labelledby="map-h">
  <div class="maphead"><h2 class="listh" id="map-h">Map</h2>${filterChips}</div>
  <div class="maps">
    <figure class="fig-africa">${africaMap(published, types)}<figcaption>Highlighted: ${onMap.map((c) => esc(countryName(c))).join(", ")}.</figcaption></figure>
    <figure class="fig-gambia">${gambiaMap(published, types, { hrefFor: (x) => `places/${x.slug}/index.html` })}<figcaption>Point at a marker to see its name, or choose a card below.</figcaption></figure>
  </div>
  <ul class="legend legend-types">${typeLegend}</ul>
  <p class="fine">Positions are approximate unless the card cites a source for them. Country outlines: Natural Earth, public domain.</p>
</section>`
  : "";

write("index.html", layout({
  title: config.name,
  description: config.tagline,
  depth: 0,
  script: true,
  body: `
<section class="hero">
  <p class="kicker">Place guides</p>
  <h1>${esc(config.name)}</h1>
  <p class="sub">${esc(config.tagline)}</p>
  <p class="lede">Each card keeps two kinds of knowledge apart: what the documented record says, and what the people who know the place say. Each is labelled, so a reader always knows which one they are reading.</p>
  <ul class="legend">
    <li><span class="layer-tag rec">In the record</span> cited to a source</li>
    <li><span class="layer-tag voi">From people who know this place</span> one person's experience, shown as theirs</li>
  </ul>
</section>
${mapSection}
<section id="places">
  <h2 class="listh">Place cards <span class="count" id="pcount" aria-live="polite"></span></h2>
  ${published.length ? `<ul class="places" id="placelist">${placeItems}</ul>` : "<p>No place card is published yet.</p>"}
</section>`
}));

const contactLine = config.contact ? ` Write to ${esc(config.contact)}.` : "";
write("method/index.html", layout({
  title: `Method · ${config.name}`,
  description: "How the record is sourced and how local notes are collected.",
  depth: 1,
  current: "method",
  body: `<div class="prose">${methodHtml.replace("<!--contact-->", contactLine)}</div>`
}));

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
