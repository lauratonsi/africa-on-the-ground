// npm run build: valida i contenuti e genera il sito statico in dist/.
// Opzione --drafts per includere anche le schede con status "draft" (solo per anteprima).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { root, loadAll, validate, report } from "./lib.mjs";
import { africaMap, gambiaMap, choroplethMap, countryCodes, countryName } from "./map.mjs";
import { barList, pairedBars, scatter, fmtInt, fmtPop } from "./charts.mjs";

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
// Versione degli asset: cambia quando cambiano stile, script o build, così il browser non usa file vecchi.
const VER = crypto.createHash("sha1")
  .update(["src/styles.css", "src/app.js", "src/theme.js", "scripts/build.mjs"].map((f) => fs.readFileSync(path.join(root, f))).join("\n"))
  .digest("hex").slice(0, 8);
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
function landscape() {
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
<g class="star">${stars}</g>
<circle cx="1030" cy="665" r="300" fill="url(#scGlow)"/>
<circle class="sunfill" cx="1030" cy="665" r="132"/>
<path class="far" d="M0 640 C150 600 300 625 470 605 S790 585 930 622 S1230 600 1440 630 L1440 900 L0 900 Z"/>
<path class="mid" d="M0 690 C200 655 380 690 560 668 S900 650 1090 685 S1330 668 1440 690 L1440 900 L0 900 Z"/>
<path d="M0 720 C260 700 520 730 800 712 S1240 700 1440 722 L1440 790 C1180 778 900 800 640 786 S180 790 0 782 Z" fill="url(#scRiver)" opacity=".92"/>
<g class="refl" fill="none" stroke-width="3" stroke-linecap="round" opacity=".8"><path d="M970 726 h120 M990 740 h84 M1005 754 h58 M1018 768 h34"/></g>
<use href="#baobab" transform="translate(470 668) scale(.5)" opacity=".75"/>
<use href="#baobab" transform="translate(700 676) scale(.36)" opacity=".7"/>
<path class="near" d="M0 792 C240 770 520 800 820 786 S1260 776 1440 790 L1440 900 L0 900 Z"/>
<path class="ground" d="M0 850 C300 830 620 864 920 846 S1300 838 1440 850 L1440 900 L0 900 Z"/>
<use href="#baobab" transform="translate(150 880) scale(1.55)"/>
<use href="#baobab" transform="translate(560 892) scale(.95)"/>
<use href="#baobab" transform="translate(1290 892) scale(1.95)"/>
<g class="bird" fill="none" stroke-width="2.2" stroke-linecap="round" opacity=".85"><path d="M1180 300 q9 -9 18 0 q9 -9 18 0"/><path d="M1232 276 q7 -7 14 0 q7 -7 14 0"/><path d="M1148 262 q6 -6 12 0 q6 -6 12 0"/></g>
</svg>`;
}

// Onda che chiude un'apertura e porta alla carta chiara della pagina.
const heroWave = '<svg class="hero-wave" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 80 L0 44 C240 4 480 70 720 36 S1200 4 1440 40 L1440 80 Z"/></svg>';

// Apertura ridotta con il paesaggio, per le pagine che non sono la home.
function compactHero({ kicker, title, sub }) {
  return `<section class="scape-hero compact">
  ${landscape()}
  <div class="scape-text">
    <p class="scape-kicker">${esc(kicker)}</p>
    <h1>${esc(title)}</h1>
    ${sub ? `<p class="scape-sub">${esc(sub)}</p>` : ""}
  </div>
  ${heroWave}
</section>`;
}

function layout({ title, description, depth, body, current, script = false, bodyClass = "" }) {
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
    <nav aria-label="Main"><a href="${p}index.html#places">Places</a><a href="${p}index.html#map">Map</a><a href="${p}countries/index.html"${current === "countries" ? ' aria-current="page"' : ""}>Countries</a><a href="${p}method/index.html"${current === "method" ? ' aria-current="page"' : ""}>Method</a></nav>
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
${script ? `<div id="tip" role="tooltip" hidden></div>\n<script src="${p}app.js?v=${VER}" defer></script>\n` : ""}</body>
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
      ${list.length ? `<div class="notes">${noteCards}</div>` : `<div class="empty"><strong>No local voice on this card yet.</strong><span>Notes are added by the project once the author has agreed to publication.</span></div>`}
    </div>
    <div class="asks">
      <h2>Questions we ask</h2>
      <ul>${asks}</ul>
    </div>
    <p class="fine">Notes are collected in person or by direct message, never through this site. <a href="../../method/index.html">How notes are collected</a>.${contact}</p>
  </aside>
</div>
</div>`;

  return layout({ title: `${p.name} · ${config.name}`, description: p.subtitle, depth: 2, body });
}

// ---------- pagine ----------
const published = places.map((x) => x.data).filter((p) => includeDrafts || p.status === "published");

for (const p of published) write(`places/${p.slug}/index.html`, renderPlace(p));

const placeItems = published.map((p) => {
  const n = (notes[p.slug] || []).length;
  const where = p.coords ? "" : " · not on the map";
  const media = p.image
    ? `<img src="img/places/${esc(p.image.file)}-800.jpg" srcset="img/places/${esc(p.image.file)}-800.jpg 800w, img/places/${esc(p.image.file)}-1600.jpg 1600w" sizes="(max-width: 700px) 100vw, 33vw" width="800" height="533" alt="${esc(p.image.alt)}" loading="lazy">`
    : art(p.slug, 3, 2).replace('class="art"', 'class="art pimg-art"');
  return `<li data-slug="${esc(p.slug)}" data-type="${esc(p.type)}"><a class="place" href="places/${esc(p.slug)}/index.html"><span class="pimg">${media}${p.status === "draft" ? '<span class="draft pbadge">Draft</span>' : ""}</span><span class="pbody"><span class="kicker">${esc(p.region)}</span><span class="pname">${esc(p.name)}</span><span class="psub">${esc(p.subtitle)}</span><span class="pmeta">${typeIcon(p.type)}${esc(types[p.type].label)} · ${citedIds(p).size} sources · ${n} local ${n === 1 ? "note" : "notes"}${where}</span></span></a></li>`;
}).join("");

const usedTypes = config.placeTypes.filter((t) => published.some((p) => p.type === t.id));
const onMap = [...new Set(published.filter((p) => p.coords && p.country).map((p) => p.country))];
const typeLegend = usedTypes.map((t) => `<li>${typeIcon(t.id)}${esc(t.label)}</li>`).join("");
const filterChips = usedTypes.length > 1
  ? `<div class="filters" id="filters" role="group" aria-label="Filter places by type" hidden><button type="button" class="fbtn" data-filter="all" aria-pressed="true">All</button>${usedTypes.map((t) => `<button type="button" class="fbtn" data-filter="${esc(t.id)}" aria-pressed="false">${typeIcon(t.id)}${esc(t.label)}</button>`).join("")}</div>`
  : "";

const mapSection = published.some((p) => p.coords)
  ? `<section id="map" class="band-indigo section" aria-labelledby="map-h">
  <div class="wrap">
  <div class="maphead"><h2 class="listh" id="map-h">Where the cards are</h2>${filterChips}</div>
  <div class="maps">
    <figure class="fig-africa">${africaMap(published, types, { hrefFor: (iso) => `countries/index.html#c-${iso}` })}<figcaption>Highlighted: ${onMap.map((c) => esc(countryName(c))).join(", ")}. Select it for the country's figures.</figcaption></figure>
    <figure class="fig-gambia">${gambiaMap(published, types, { hrefFor: (x) => `places/${x.slug}/index.html` })}<figcaption>Point at a marker to see its name, or choose a card above.</figcaption></figure>
  </div>
  <ul class="legend legend-types">${typeLegend}</ul>
  <p class="fine">Positions are approximate unless the card cites a source for them. Country outlines: Natural Earth, public domain.</p>
  </div>
</section>`
  : "";

const cList = data.countries ? data.countries.countries : [];
const cPop = cList.reduce((a, c) => a + c.population, 0);
const countriesBand = cList.length
  ? `<section class="band-saffron section">
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

write("index.html", layout({
  title: config.name,
  description: config.tagline,
  depth: 0,
  script: true,
  bodyClass: "home",
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
    ${published.length ? `<ul class="places arches" id="placelist">${placeItems}</ul>` : "<p>No place card is published yet.</p>"}
  </div>
</section>
<div class="wave" aria-hidden="true"><svg viewBox="0 0 1440 120" preserveAspectRatio="none" focusable="false"><path d="M0 120 L0 70 C240 10 480 110 720 60 S1200 0 1440 60 L1440 120 Z"/></svg></div>
<section class="wrap suns-sec" aria-label="The two layers of every card">
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
    </article>
  </div>
</section>
${mapSection}
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

  const tipOf = (c) => `${c.name}. Capital ${c.capital}. Population ${fmtInt(c.population)}, area ${fmtInt(c.area)} km²`;
  const ISLES = ["CPV", "COM", "MUS", "STP", "SYC"];
  const isles = ISLES.map((iso) => list.find((c) => c.iso3 === iso)).filter(Boolean).map((c) => {
    const b = bins(c);
    return `<span class="isle c" data-sub="${c.subregion}" data-pop="${b.pop}" data-area="${b.area}" data-den="${b.den}" data-iso="${c.iso3}" data-tip="${esc(tipOf(c))}" tabindex="0" role="button" aria-pressed="false">${esc(c.name)}</span>`;
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
  const detailData = Object.fromEntries(list.map((c) => [c.iso3, {
    name: c.name, capital: c.capital, sub: subLabel[c.subregion], population: fmtInt(c.population), area: fmtInt(c.area),
    density: den(c) < 10 ? den(c).toFixed(1) : fmtInt(den(c)), popShare: share(c.population),
    rankPop: rPop[c.iso3], rankArea: rArea[c.iso3], rankDen: rDen[c.iso3], n: list.length,
    cards: cardsOf(c.iso3).map((p) => ({ name: p.name, href: `../places/${p.slug}/index.html` }))
  }]));
  // tabella
  const rows = [...list].sort((a, b) => a.name.localeCompare(b.name, "en")).map((c) => {
    const cards = cardsOf(c.iso3);
    const cardLink = cards.length ? ` <a class="cardlink" href="../places/${esc(cards[0].slug)}/index.html">${cards.length === 1 ? "1 place card" : `${cards.length} place cards`}</a>` : "";
    return `<tr id="c-${c.iso3}" data-iso="${c.iso3}" tabindex="0" data-sub="${c.subregion}" data-name="${esc((c.name + " " + c.capital).toLowerCase())}"><th scope="row" data-v="${esc(c.name)}">${esc(c.name)}${cardLink}</th><td data-v="${esc(c.capital)}">${esc(c.capital)}</td><td data-v="${esc(subLabel[c.subregion])}">${esc(subLabel[c.subregion])}</td><td class="num" data-v="${c.area}">${fmtInt(c.area)}</td><td class="num" data-v="${c.population}">${fmtInt(c.population)}</td><td class="num" data-v="${den(c).toFixed(3)}">${den(c) < 10 ? den(c).toFixed(1) : fmtInt(den(c))}</td></tr>`;
  }).join("");
  const subOptions = config.subregions.map((r) => `<option value="${r.id}">${esc(r.label)}</option>`).join("");

  const body = `
${compactHero({ kicker: "Reference", title: "Africa by the numbers", sub: "Where each of the 54 countries sits, its capital, its area and its population." })}
<div class="wrap">
<section class="hero-lede">
  <p class="lede">The figures are the World Bank's${cite(["wb-population", "wb-area", "wb-countries"])}. The shading, the charts and the percentages are calculated here from those figures. Nothing on this page comes from local voices: it is all in the record, and the sources are listed at the bottom.</p>
</section>

<section class="kpis" aria-label="Africa in four numbers">${kpis}</section>

</div>
<div class="band-sand section"><div class="wrap">
<section id="map" class="panel" aria-labelledby="cmap-h">
  <div class="phead">
    <h2 id="cmap-h">Map</h2>
    <div class="seg" id="metric" role="group" aria-label="Shade the map by" hidden>
      <button type="button" data-metric="pop" aria-pressed="true">Population</button>
      <button type="button" data-metric="area" aria-pressed="false">Area</button>
      <button type="button" data-metric="den" aria-pressed="false">People per km²</button>
    </div>
  </div>
  <div class="mapwrap" data-m="pop">
    <div class="mapcol">
      ${choroplethMap(list, bins)}
      <p class="isles-t">Island states too small to see on the map</p>
      <div class="isles">${isles}</div>
    </div>
    <div class="legends">
      <div class="detail" id="detail" aria-live="polite" hidden><p class="detail-hint">Select a country on the map, or a row in the table, to see its figures.</p></div>
      ${legends}
      <p class="fine"><span class="capkey"></span> Capital city. Shaded by the metric chosen above. Western Sahara has no figures and is left unshaded. Somaliland is shaded as part of Somalia.</p>
    </div>
  </div>
  <p class="fine">Country outlines${cite(["natural-earth"])} show de facto boundaries and are not a statement about disputed ones. Subregions follow the United Nations statistical groups${cite(["un-m49"])}.</p>
</section>

</div></div>
<div class="wrap section">
<section id="charts" class="charts">
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

</div>
<div class="band-sand section"><div class="wrap">
<section id="table" class="panel" aria-labelledby="tab-h">
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
      <thead><tr><th scope="col" data-sort="text">Country</th><th scope="col" data-sort="text">Capital</th><th scope="col" data-sort="text">Subregion</th><th scope="col" class="num" data-sort="num">Area, km²</th><th scope="col" class="num" data-sort="num">Population</th><th scope="col" class="num" data-sort="num">People per km²</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  <p class="fine">Population is the 2025 value and area the 2023 value, the most recent the World Bank gave for each country${cite(["wb-population", "wb-area"])}. Capitals as listed by the World Bank${cite(["wb-countries"])}.</p>
</section>

</div></div>
<div class="wrap section">
<section id="sec-gaps" class="gaps panel-gaps">
  <span class="layer-tag gap">Not yet sourced</span>
  <ul>
    <li>Population figures are estimates for 2025, not census counts, and countries differ in how recently they counted. This page does not show the uncertainty.</li>
    <li>Some countries have more than one capital or seat of government. The table shows one name per country, as the World Bank lists it, and does not explain the exceptions.</li>
    <li>Territories the United Nations lists under Africa, such as Western Sahara, are not included, because the World Bank gives no country figures for them.</li>
    <li>Nothing yet on languages, economy, history or daily life. Those belong on the place cards, with their own sources and local voices.</li>
  </ul>
</section>
${sourcesList()}
</div>
<script type="application/json" id="cdata">${JSON.stringify(detailData).replace(/</g, "\\u003c")}</script>`;

  return layout({ title: `Africa by the numbers · ${config.name}`, description: "Map, capitals, area and population of the 54 African countries.", depth: 1, current: "countries", script: true, body });
}

if (data.countries) write("countries/index.html", renderCountries(data.countries.countries));

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
