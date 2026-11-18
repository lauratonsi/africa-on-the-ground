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
import { esc } from "./html.mjs";

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

const { config, sourcesList, places, notes, methodHtml, methodPage = null, artCatalog = null, capitals = [], peoples = [] } = data;
const blocsList = data.blocs ? data.blocs.blocs : [];
const sources = new Map(sourcesList.map((s) => [s.id, s]));
const includeDrafts = process.argv.includes("--drafts");
const dist = path.join(root, "dist");
// Versione degli asset: cambia quando cambiano stile, script o build, così il browser non usa file vecchi.
const VER = crypto.createHash("sha1")
  .update(["src/styles.css", "src/app.js", "src/theme.js", "src/share.js", "src/motion.js", "src/fab.js", "src/places.js", "src/truesize.js", "src/quiz.js", "src/story.js", "src/storygame.js", "src/recipe.js", "src/society.js", "src/explore.js", "src/method-qa.js", "scripts/build.mjs"].map((f) => fs.readFileSync(path.join(root, f))).join("\n"))
  .digest("hex").slice(0, 8);
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
const prefix = (depth) => (depth === 0 ? "./" : "../".repeat(depth));
const pageCountrySlug = (name) => String(name).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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


// Primi piani diversi per sezione: stesso cielo, sole e colline; cambiano le sagome davanti.
// Sono forme generiche (alberi, case, rocce, città), non motivi presi da una tradizione precisa.
const G = (id, x, y, sc, extra = "") => `<use href="#${id}" transform="translate(${x} ${y}) scale(${sc})"${extra}/>`;
const SCENES = {
  baobab: { defs: "", mid: G("baobab", 470, 668, .5, ' opacity=".75"') + G("baobab", 700, 676, .36, ' opacity=".7"'), fg: (l, r) => G("baobab", 150, 880, l) + G("baobab", 560, 892, .95) + `<g class="bR">${G("baobab", 1290, 892, r)}</g>` },
  acacia: {
    defs: '<g id="acacia" class="bao" stroke-linecap="round"><path d="M-9 0 C-7 -60 -5 -110 -2 -150 L4 -150 C7 -110 9 -60 12 0 Z" stroke="none"/><path d="M0 -140 L-62 -192 M2 -140 L72 -196 M1 -150 L-6 -204" fill="none" stroke-width="7"/><path d="M-160 -200 C-130 -238 -40 -252 20 -247 C92 -252 166 -234 176 -206 C120 -190 -104 -188 -160 -200 Z" stroke="none"/></g>',
    mid: G("acacia", 460, 670, .42, ' opacity=".75"') + G("acacia", 720, 678, .3, ' opacity=".7"'),
    fg: (l, r) => G("acacia", 170, 880, l * .9) + G("acacia", 600, 892, .7) + `<g class="bR">${G("acacia", 1280, 892, r * .85)}</g>`,
  },
  giraffes: {
    defs: '<g id="acacia" class="bao" stroke-linecap="round"><path d="M-9 0 C-7 -60 -5 -110 -2 -150 L4 -150 C7 -110 9 -60 12 0 Z" stroke="none"/><path d="M0 -140 L-62 -192 M2 -140 L72 -196 M1 -150 L-6 -204" fill="none" stroke-width="7"/><path d="M-160 -200 C-130 -238 -40 -252 20 -247 C92 -252 166 -234 176 -206 C120 -190 -104 -188 -160 -200 Z" stroke="none"/></g><g id="giraffe" class="bao" stroke-linecap="round" stroke-linejoin="round"><path d="M-62 -150 C-60 -176 40 -182 56 -160 C63 -150 61 -136 50 -130 L-50 -128 C-63 -132 -64 -142 -62 -150 Z" stroke="none"/><path d="M40 -158 L92 -296" fill="none" stroke-width="22"/><path d="M84 -306 L128 -290 L124 -279 L88 -288 Z" stroke="none"/><path d="M90 -304 L86 -322 M100 -302 L98 -320" fill="none" stroke-width="4"/><path d="M-46 -132 L-52 0 M-26 -130 L-22 0 M30 -132 L34 0 M48 -134 L56 0" fill="none" stroke-width="9"/><path d="M-60 -146 L-74 -96" fill="none" stroke-width="3"/></g>',
    mid: G("acacia", 470, 670, .4, ' opacity=".75"') + G("giraffe", 700, 678, .24, ' opacity=".7"'),
    fg: (l, r) => G("acacia", 160, 880, l * .9) + G("giraffe", 560, 892, .9) + `<g class="bR">${G("giraffe", 1250, 892, r * .7)}${G("acacia", 1380, 896, r * .6)}</g>`,
  },
  huts: {
    defs: '<g id="hut" class="bao"><path d="M-72 0 C-74 -30 -73 -55 -70 -72 L70 -72 C73 -55 74 -30 72 0 Z" stroke="none"/><path d="M-98 -62 C-60 -110 -20 -140 0 -152 C20 -140 60 -110 98 -62 C60 -70 -60 -70 -98 -62 Z" stroke="none"/><path d="M0 -152 L2 -170" stroke-width="6" stroke-linecap="round"/></g><g id="acacia" class="bao" stroke-linecap="round"><path d="M-9 0 C-7 -60 -5 -110 -2 -150 L4 -150 C7 -110 9 -60 12 0 Z" stroke="none"/><path d="M0 -140 L-62 -192 M2 -140 L72 -196" fill="none" stroke-width="7"/><path d="M-160 -200 C-130 -238 -40 -252 20 -247 C92 -252 166 -234 176 -206 C120 -190 -104 -188 -160 -200 Z" stroke="none"/></g>',
    mid: G("hut", 450, 672, .32, ' opacity=".75"') + G("hut", 520, 676, .26, ' opacity=".75"') + G("acacia", 730, 678, .3, ' opacity=".7"'),
    fg: (l, r) => G("hut", 110, 884, l * .95) + G("hut", 330, 890, l * .6) + G("acacia", 600, 892, .65) + `<g class="bR">${G("hut", 1200, 892, r * .7)}${G("hut", 1370, 896, r * .95)}</g>`,
  },
  city: {
    defs: '<g id="sky1" class="bao"><path d="M-260 0 V-120 H-220 V-180 H-170 V-90 H-140 V-240 H-90 V-150 H-60 V-200 H-20 V-110 H10 V-300 H60 V-160 H100 V-220 H150 V-120 H190 V-170 H240 V0 Z" stroke="none"/><path d="M28 -300 V-330 M42 -300 V-318" stroke-width="4"/></g><g id="sky2" class="bao"><path d="M-230 0 V-110 H-190 V-150 H-150 V-100 H-120 V-180 C-120 -240 -40 -240 -40 -180 V-100 H-20 V-140 H20 V-90 H60 V-250 H90 V-90 H120 V-200 H180 V-130 H220 V0 Z" stroke="none"/><path d="M67 -250 L75 -290 L83 -250 Z" stroke="none"/><path d="M-80 -232 V-252" stroke-width="5" stroke-linecap="round"/></g><g id="crane" class="bao" fill="none" stroke-width="6" stroke-linecap="round"><path d="M0 0 V-260 M-40 -250 H170 M0 -260 L30 -250 M150 -250 V-200"/></g>',
    mid: G("sky2", 520, 676, .35, ' opacity=".7"'),
    fg: (l, r) => G("sky1", 200, 892, l * .6) + G("crane", 470, 892, .5) + `<g class="bR">${G("sky2", 1280, 896, r * .5)}</g>`,
  },
  ruins: {
    defs: '<g id="pyr" class="bao"><path d="M-70 0 L-8 -200 L8 -200 L70 0 Z" stroke="none"/><path d="M-26 -84 H26 V-120 H-15 Z" class="pyr-door" stroke="none" opacity="0"/></g><g id="stela" class="bao"><path d="M-16 0 V-250 C-16 -268 16 -268 16 -250 V0 Z" stroke="none"/><path d="M-22 0 V-20 H22 V0 Z" stroke="none"/></g>',
    mid: G("pyr", 470, 674, .3, ' opacity=".75"') + G("pyr", 510, 676, .22, ' opacity=".75"') + G("stela", 740, 678, .3, ' opacity=".7"'),
    fg: (l, r) => G("pyr", 120, 884, l * .95) + G("pyr", 300, 890, l * .65) + G("stela", 560, 892, .9) + `<g class="bR">${G("stela", 1180, 894, r * .8)}${G("stela", 1250, 896, r * .55)}${G("pyr", 1370, 896, r * .8)}</g>`,
  },
  fields: {
    defs: '<g id="stalk" class="bao" stroke-linecap="round"><path d="M0 0 C2 -60 -2 -120 4 -170" fill="none" stroke-width="4"/><path d="M4 -168 C-7 -184 -5 -206 4 -218 C13 -206 15 -184 4 -168 Z" stroke="none"/><path d="M2 -80 C-20 -96 -40 -92 -56 -84 M3 -120 C25 -136 45 -132 58 -122" fill="none" stroke-width="3"/></g><g id="gran" class="bao"><path d="M-46 0 C-50 -40 -50 -90 -44 -120 L44 -120 C50 -90 50 -40 46 0 Z" stroke="none"/><path d="M-64 -112 L0 -200 L64 -112 Z" stroke="none"/></g><g id="pot" class="bao" stroke-linecap="round"><path d="M-60 -10 C-70 -60 -40 -96 0 -96 C40 -96 70 -60 60 -10 Z" stroke="none"/><path d="M-80 0 H80" stroke-width="10"/><path d="M-20 -110 C-34 -130 -6 -146 -20 -170 M14 -112 C0 -134 28 -150 14 -176" fill="none" stroke-width="5" opacity=".7"/></g>',
    mid: G("gran", 470, 672, .34, ' opacity=".75"') + G("gran", 530, 676, .26, ' opacity=".75"'),
    fg: (l, r) => [40, 90, 140, 190, 240].map((x, i) => G("stalk", x, 888 + (i % 2) * 6, l * (0.9 + (i % 3) * .12))).join("") + G("pot", 560, 892, .85) + `<g class="bR">${G("gran", 1230, 894, r * .8)}${[1340, 1390, 1430].map((x, i) => G("stalk", x, 896, r * (0.75 + i * .08))).join("")}</g>`,
  },
  kopje: {
    defs: '<g id="rocks" class="bao"><path d="M-170 0 C-168 -40 -150 -70 -110 -78 C-80 -84 -50 -76 -36 -60 C-30 -96 -6 -126 34 -130 C70 -134 96 -112 104 -82 C130 -88 160 -70 168 -40 C172 -22 172 -10 170 0 Z" stroke="none"/><path d="M-30 -126 C-34 -150 -18 -172 8 -176 C34 -180 56 -164 58 -140 C40 -132 0 -128 -30 -126 Z" stroke="none"/></g><g id="acacia" class="bao" stroke-linecap="round"><path d="M-9 0 C-7 -60 -5 -110 -2 -150 L4 -150 C7 -110 9 -60 12 0 Z" stroke="none"/><path d="M0 -140 L-62 -192 M2 -140 L72 -196" fill="none" stroke-width="7"/><path d="M-160 -200 C-130 -238 -40 -252 20 -247 C92 -252 166 -234 176 -206 C120 -190 -104 -188 -160 -200 Z" stroke="none"/></g>',
    mid: G("rocks", 480, 674, .4, ' opacity=".75"') + G("rocks", 720, 678, .28, ' opacity=".7"'),
    fg: (l, r) => G("rocks", 170, 890, l * 1.05) + G("acacia", 590, 892, .6) + `<g class="bR">${G("rocks", 1290, 896, r * .95)}</g>`,
  },
  sea: {
    defs: '<g id="lighthouse" class="bao"><path d="M-22 0 L-14 -190 L14 -190 L22 0 Z" stroke="none"/><path d="M-26 -190 H26 V-204 H-26 Z M-16 -204 H16 V-236 H-16 Z M-20 -236 L0 -256 L20 -236 Z" stroke="none"/><path d="M-120 0 C-110 -40 -70 -60 -30 -50 C10 -70 60 -60 90 -30 C110 -20 120 -8 124 0 Z" stroke="none"/></g><g id="boat" class="bao"><path d="M-90 -18 L90 -18 L70 0 L-70 0 Z" stroke="none"/><path d="M-6 -18 V-110 M-6 -104 L48 -26 H-6" stroke-width="5" fill="none"/></g><g id="waves" class="bao" fill="none" stroke-width="5" stroke-linecap="round"><path d="M-200 0 q25 -14 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0"/></g>',
    mid: G("boat", 640, 690, .28, ' opacity=".7"'),
    fg: (l, r) => G("lighthouse", 150, 884, l * .95) + G("waves", 520, 880, .9, ' opacity=".55"') + G("boat", 760, 878, .55) + `<g class="bR">${G("waves", 1240, 886, r * .7, ' opacity=".55"')}</g>`,
  },
  palms: {
    defs: '<g id="palm" class="bao" fill="none" stroke-linecap="round"><path d="M-6 0 C-2 -80 10 -160 30 -232" stroke-width="15"/><path d="M30 -232 C0 -250 -40 -246 -70 -222 M30 -232 C60 -256 100 -256 130 -230 M30 -232 C20 -270 -10 -290 -40 -296 M30 -232 C50 -272 82 -290 110 -292 M30 -232 C-10 -230 -36 -206 -50 -180 M30 -232 C70 -226 96 -206 108 -180" stroke-width="9"/></g>',
    mid: G("palm", 470, 670, .4, ' opacity=".75"') + G("palm", 720, 678, .3, ' opacity=".7"'),
    fg: (l, r) => G("palm", 150, 884, l * .95) + G("palm", 560, 892, .8) + `<g class="bR">${G("palm", 1290, 894, r * .85)}</g>`,
  },
};
// Il paesaggio della home: cielo, sole, colline, fiume e baobab, disegnato a strati.
// I colori sono variabili CSS (--sky-*, --far, --mid...), quindi cambiano da soli nel tema scuro.
// compact: versione per le pagine interne (sole più basso, baobab più piccoli, niente uccelli sotto la barra)
function landscape(compact = false, scene = "baobab") {
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
${(SCENES[scene] || SCENES.baobab).defs}
</defs>
<rect width="1440" height="900" fill="url(#scSky)"/>
<g class="px" data-px="26"><g class="star">${stars}</g></g>
<g class="px" data-px="80"><g class="sunrise"><circle class="sun-m" cx="1030" cy="${sunY}" r="300" fill="url(#scGlow)"/>
<circle class="sunfill sun-m" cx="1030" cy="${sunY}" r="${sunR}"/></g></g>
<g class="px" data-px="52"><path class="far" d="M0 640 C150 600 300 625 470 605 S790 585 930 622 S1230 600 1440 630 L1440 900 L0 900 Z"/></g>
<g class="px" data-px="34"><path class="mid" d="M0 690 C200 655 380 690 560 668 S900 650 1090 685 S1330 668 1440 690 L1440 900 L0 900 Z"/>
<path d="M0 720 C260 700 520 730 800 712 S1240 700 1440 722 L1440 790 C1180 778 900 800 640 786 S180 790 0 782 Z" fill="url(#scRiver)" opacity=".92"/>
${compact ? "" : '<g class="refl sun-m" fill="none" stroke-width="3" stroke-linecap="round" opacity=".8"><path d="M970 726 h120 M990 740 h84 M1005 754 h58 M1018 768 h34"/></g>'}
${(SCENES[scene] || SCENES.baobab).mid}</g>
<path class="near" d="M0 792 C240 770 520 800 820 786 S1260 776 1440 790 L1440 900 L0 900 Z"/>
<path class="ground" d="M0 850 C300 830 620 864 920 846 S1300 838 1440 850 L1440 900 L0 900 Z"/>
${(SCENES[scene] || SCENES.baobab).fg(bigL, bigR)}
${compact ? "" : `<g class="px" data-px="18"><g class="bird" fill="none" stroke-width="2.2" stroke-linecap="round" opacity=".85"><path d="M1180 300 q9 -9 18 0 q9 -9 18 0"/><path d="M1232 276 q7 -7 14 0 q7 -7 14 0"/><path d="M1148 262 q6 -6 12 0 q6 -6 12 0"/></g></g>`}
</svg>`;
}

// Onda che chiude un'apertura e porta alla carta chiara della pagina.
const heroWave = '<svg class="hero-wave" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 80 L0 44 C240 4 480 70 720 36 S1200 4 1440 40 L1440 80 Z"/></svg>';

// Apertura ridotta con il paesaggio, per le pagine che non sono la home.
function compactHero({ kicker, title, sub, scene = "baobab" }) {
  return `<section class="scape-hero compact scene-${scene}">
  ${landscape(true, scene)}
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
    ${navHtml(p, current)}
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
    <nav class="foot-nav" aria-label="All sections">${NAV.flatMap((g) => g.items || [g]).map((it) => `<a href="${p}${it.href}">${esc(it.label)}</a>`).join("")}</nav>
    <p>This site sets no cookies, runs no analytics and loads nothing from other sites. Photographs are openly licensed and credited on each card. <a href="${p}method/index.html">How it works</a> · <a href="${p}education/index.html">Education &amp; Mission</a></p>
  </div>
</footer>
${fab(jump)}
${script ? `<div id="tip" role="tooltip" hidden></div>\n<script src="${p}app.js?v=${VER}" defer></script>\n` : ""}<script src="${p}vendor/motion.js?v=${VER}" defer></script>
<script src="${p}motion.js?v=${VER}" defer></script>
${["fab.js", ...extraScripts].map((f) => `<script src="${p}${f}?v=${VER}" defer></script>\n`).join("")}</body>
</html>
`;
}

// Menu principale: sei voci, quattro con un elenco che si apre (details/summary: funziona anche senza JavaScript).
const NAV = [
  { href: "index.html#map", label: "Map" },
  { label: "Places", items: [{ href: "places/index.html", label: "All places", id: "places" }, { href: "places/art/index.html", label: "Art", id: "art" }, { href: "capitals/index.html", label: "Capitals", id: "capitals" }, { href: "countries/index.html", label: "Countries", id: "countries" }] },
  { label: "Stories", items: [{ href: "stories/index.html", label: "History & Myths", id: "stories" }, { href: "food/index.html", label: "Food", id: "food" }, { href: "migration/index.html", label: "Migration", id: "migration" }] },
  { href: "peoples/index.html", label: "Peoples", id: "peoples" },
  { label: "Play", items: [{ href: "quiz/index.html", label: "Quiz", id: "quiz" }, { href: "explore/index.html", label: "Connections", id: "explore" }, { href: "true-size/index.html", label: "True size", id: "true-size" }, { href: "society/index.html", label: "Society", id: "society" }] },
  { label: "About", items: [{ href: "method/index.html", label: "Method", id: "method" }, { href: "education/index.html", label: "Education", id: "education" }] },
];
function navHtml(p, current) {
  const a = (it) => `<a href="${p}${it.href}"${it.id && it.id === current ? ' aria-current="page"' : ""}>${esc(it.label)}</a>`;
  return `<nav aria-label="Main" class="mainnav">${NAV.map((g) => {
    if (!g.items) return a(g);
    const on = g.items.some((it) => it.id === current);
    return `<details class="nav-g${on ? " is-current" : ""}"><summary>${esc(g.label)}<svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true" focusable="false"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></summary><div class="nav-pop">${g.items.map(a).join("")}</div></details>`;
  }).join("")}</nav>`;
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
// "Go deeper": link verso l'esterno, sempre a una fonte registrata (con tipo e stato), con il motivo per leggerla.
const DEEPER_LABEL = { book: "Book", article: "Article", museum: "Museum or collection", archive: "Archive", data: "Data", podcast: "Podcast", document: "Primary document", news: "News report" };
function deeperHtml(list) {
  if (!list || !list.length) return "";
  const items = list.map((d) => {
    const src = sources.get(d.source);
    return `<li><span class="deeper-kind">${esc(DEEPER_LABEL[d.kind] || d.kind)}</span><a href="${esc(src.url)}" rel="noopener">${esc(src.title)}</a><span class="deeper-meta">${esc(src.publisher)}${src.status !== "verified" ? " · not yet verified" : ""}</span><p>${esc(d.why)}</p></li>`;
  }).join("");
  return `<section id="sec-deeper" class="deeper"><span class="layer-tag rec">Go deeper</span><h2>Keep learning beyond this site</h2><ul class="deeper-list">${items}</ul><p class="note-small">These pages are outside this site and have their own terms. We read them first, and this site sets nothing on your device when you follow a link.</p></section>`;
}

function makeCiter() {
  const order = [];
  const cite = (ids) => (ids || []).map((id) => {
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

// Ricetta interattiva: senza JavaScript mostra le quantità di base; con JavaScript scala le porzioni, spunta i passi e avvia i timer.
const fmtAmt = (n) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100));
function recipeHtml(b, cite) {
  const ing = b.ingredients.map((i) => `<li${i.amount != null ? ` data-amount="${i.amount}"` : ""} data-unit="${esc(i.unit || "")}"><span class="rc-amt">${i.amount != null ? esc(fmtAmt(i.amount)) + (i.unit ? " " + esc(i.unit) : "") : esc(i.unit || "")}</span> <span class="rc-name">${esc(i.name)}</span>${i.note ? ` <em class="rc-note">${esc(i.note)}</em>` : ""}</li>`).join("");
  const steps = b.steps.map((st) => `<li${st.minutes ? ` data-min="${st.minutes}"` : ""}>${esc(st.text)}${st.minutes ? ` <span class="rc-time">(${st.minutes} min)</span>` : ""}</li>`).join("");
  const total = b.steps.reduce((n, st) => n + (st.minutes || 0), 0);
  const totalTxt = total >= 60 ? `${Math.floor(total / 60)} h${total % 60 ? ` ${total % 60} min` : ""}` : `${total} min`;
  return `<div class="recipe" data-base="${b.servings}"><div class="rc-head"><p class="chart-title">${esc(b.title)}</p><p class="chart-sub">${esc(b.sub || "One version of the dish, as given by the source. Recipes differ from cook to cook.")}${cite(b.cite)}</p><ul class="rc-meta">${total ? `<li><strong>${totalTxt}</strong><span>timed steps</span></li>` : ""}<li><strong>${b.steps.length}</strong><span>steps</span></li><li><strong>${b.ingredients.length}</strong><span>ingredients</span></li></ul><p class="rc-serv-k">Makes <strong class="rc-serv-n">${b.servings}</strong> servings</p></div><div class="rc-cols"><div class="rc-col-ing"><h3 class="rc-h">Ingredients</h3><ul class="rc-ing">${ing}</ul></div><div class="rc-col-steps"><h3 class="rc-h">Steps</h3><ol class="rc-steps">${steps}</ol></div></div><p class="note-small">${esc(b.note)}</p></div>`;
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
    if (b.type === "recipe") return recipeHtml(b, cite);
    return renderRich(b, cite, { up: "../../" });
  };

  const sections = p.sections.map((s, i) =>
    `<section id="sec-${esc(s.id)}">${i === 0 ? '<div class="sec-head"><span class="layer-tag rec">In the record</span></div>' : ""}<h2>${esc(s.title)}</h2>${s.blocks.map(block).join("")}</section>`
  ).join("\n");

  const keyHtml = p.keyPoints ? `<aside class="keypoints" aria-labelledby="kp-h"><h2 id="kp-h">In short</h2><ul>${p.keyPoints.map((x) => `<li>${esc(x.text)}${x.cite ? cite(x.cite) : ""}</li>`).join("")}</ul></aside>` : "";
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
    <p class="phero-top crumb"><a href="../../index.html#places">&larr; All places</a>${p.country && data.countries ? ` <span aria-hidden="true">·</span> <a href="../../countries/${esc(pageCountrySlug((data.countries.countries.find((c) => c.iso3 === p.country) || {}).name || p.country))}/index.html">${esc((data.countries.countries.find((c) => c.iso3 === p.country) || {}).name || p.country)}</a>` : ""}</p>
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
<div class="read-progress" aria-hidden="true"><span></span></div>${keyHtml}
${sections}
${deeperHtml(p.deeper)}
${pageChecks("place", p.slug, cite)}
${placeLinksHtml(p)}
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

  return layout({ title: `${p.name} · ${config.name}`, description: p.subtitle, depth: 2, body, extraScripts: ["story.js", "recipe.js", "share.js"], jump: [{ id: "voices", label: "Voices" }, ...(p.sources || p.sections ? [{ id: "sec-sources", label: "Sources" }] : [])] });
}

// ---------- pagine ----------
const published = places.map((x) => x.data).filter((p) => includeDrafts || p.status === "published");


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
  <div class="maphead"><h2 class="listh" id="map-h">Start from the map</h2>${filterChips}</div>
  <p class="lede map-lede">${bigMap.count} places are pinned, from every region. Choose a pin to open its card, or filter by kind and region.</p>
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
const countrySlug = (name) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const cSlug = Object.fromEntries((data.countries ? data.countries.countries : []).map((c) => [c.iso3, countrySlug(c.name)]));
const cName = Object.fromEntries((data.countries ? data.countries.countries : []).map((c) => [c.iso3, c.name]));
// Collegamenti interni derivati dai dati: relazioni scritte a mano (stories.places, capitals.places, peoples.places)
// più le menzioni esatte del nome di un luogo nel testo di una storia (nomi di almeno 7 caratteri, piatti esclusi).
const capAvail = () => capitals.map(({ data: cp }) => cp).filter((cp) => (cp.sections || []).length && (cp.status === "published" || includeDrafts));
const peopleAvail = () => peoples.map(({ data: pp }) => pp).filter((pp) => pp.status === "published" || includeDrafts);
const storyText = (st) => [st.title, st.dek || "", ...(st.keyPoints || []).map((k) => k.text), ...st.sections.flatMap((sec) => sec.blocks.flatMap((b) => [...(b.parts || []), ...(b.items || [])].map((x) => String(x.text || ""))))].join(" \n ");
const reEsc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
let _mentions = null;
function placeMentions() {
  if (_mentions) return _mentions;
  _mentions = new Map(); // slug luogo -> Set slug storie
  const cands = published.filter((pl) => pl.type !== "dish" && pl.name && pl.name.length >= 7);
  for (const st of stories) {
    const txt = storyText(st);
    for (const pl of cands) {
      const names = [pl.name, pl.name.replace(/\s*\(.*?\)\s*/g, " ").trim()].filter((n, i, a) => n.length >= 7 && a.indexOf(n) === i);
      if (names.some((n) => new RegExp(`(^|[^\\p{L}])${reEsc(n)}([^\\p{L}]|$)`, "u").test(txt))) {
        if (!_mentions.has(pl.slug)) _mentions.set(pl.slug, new Set());
        _mentions.get(pl.slug).add(st.slug);
      }
    }
  }
  return _mentions;
}
// Nomi con cui una storia nomina un popolo (scelti a mano: "San" da solo è troppo ambiguo, serve "San people").
const PEOPLE_ALIASES = { fula: ["Fula", "Fulani", "Fulbe", "Peul"], maasai: ["Maasai", "Masai"], amazigh: ["Amazigh", "Imazighen", "Berber"], oromo: ["Oromo"], san: ["San people", "San peoples", "San communities"], yoruba: ["Yoruba"] };
let _pmentions = null;
function peopleMentions() {
  if (_pmentions) return _pmentions;
  _pmentions = new Map();
  for (const st of stories) {
    const txt = storyText(st);
    for (const [slug, names] of Object.entries(PEOPLE_ALIASES)) {
      if (names.some((n) => new RegExp(`(^|[^\\p{L}])${reEsc(n)}([^\\p{L}]|$)`, "u").test(txt))) {
        if (!_pmentions.has(slug)) _pmentions.set(slug, new Set());
        _pmentions.get(slug).add(st.slug);
      }
    }
  }
  return _pmentions;
}
const storyPeoples = (st) => [...new Set([...(st.peoples || []), ...[...peopleMentions().entries()].filter(([, v]) => v.has(st.slug)).map(([k]) => k)])];
const storyPlaces = (st) => [...new Set([...(st.places || []), ...[...placeMentions().entries()].filter(([, v]) => v.has(st.slug)).map(([k]) => k)])];
function placeLinksHtml(pl) {
  const up = "../../";
  const caps = capAvail().filter((cp) => (cp.places || []).includes(pl.slug));
  const pps = peopleAvail().filter((pp) => (pp.places || []).includes(pl.slug));
  const ment = placeMentions().get(pl.slug) || new Set();
  const sts = stories.filter((st) => (st.places || []).includes(pl.slug) || ment.has(st.slug));
  const li = [
    ...caps.map((cp) => `<li>Capital: <a href="${up}capitals/${esc(cp.slug)}/index.html">${esc(cp.name)}</a></li>`),
    ...pps.map((pp) => `<li>People: <a href="${up}peoples/${esc(pp.slug)}/index.html">${esc(pp.name)}</a></li>`),
    ...sts.map((st) => `<li>Story: <a href="${up}stories/${esc(st.slug)}/index.html">${esc(st.title)}</a></li>`),
  ];
  const sameC = published.filter((x) => x.slug !== pl.slug && x.country === pl.country && x.type !== "dish");
  const pick = sameC.filter((x) => x.type === pl.type).concat(sameC.filter((x) => x.type !== pl.type)).slice(0, 4);
  if (pick.length) li.push(`<li>More in ${esc(cName[pl.country] || pl.country)}: ${pick.map((x) => `<a href="${up}places/${esc(x.slug)}/index.html">${esc(x.name)}</a>`).join(" · ")}</li>`);
  return li.length ? `<aside class="related linked-by" aria-label="Linked pages"><h2>Keep exploring</h2><p class="note-small">Capital, people and story links are pages that name this place or list it among their own.</p><ul>${li.join("")}</ul></aside>` : "";
}
const storyHref = (x, p = "") => `${p}stories/${x.slug}/index.html`;
const wordsOf = (st) => st.sections.reduce((n, sec) => n + sec.blocks.reduce((m, b) => m + (b.parts || b.items || []).reduce((k, x) => k + String(x.text).split(/\s+/).length, 0), 0), 0);
const readMin = (st) => Math.max(1, Math.round(wordsOf(st) / 200));
// Pagine dei luoghi: generate qui perché i collegamenti hanno bisogno di storie, capitali e popoli.
for (const p of published) write(`places/${p.slug}/index.html`, renderPlace(p));

function storyCard(st, p = "") {
  const k = kindOf[st.kind];
  const kickerLabel = st.kind === "myth" ? "Myth vs Record" : st.kind === "food" ? "Food & Culture" : esc(k.label);
  return `<li><a class="scard" href="${esc(storyHref(st, p))}" data-kind="${esc(st.kind)}"><span class="kicker">${kickerLabel} · ${readMin(st)} min read</span><span class="scard-t">${esc(st.title)}</span><span class="scard-s">${esc(st.subtitle)}</span><span class="scard-c">${(st.countries || []).map((c) => esc(cName[c] || c)).join(" · ")}</span>${((data.quiz && data.quiz.questions) || []).filter((q) => q.story === st.slug).length ? `<span class="scard-q">${((data.quiz && data.quiz.questions) || []).filter((q) => q.story === st.slug).length} quiz questions inside</span>` : ""}</a></li>`;
}

// Rendering condiviso dei blocchi ricchi (storie, schede dei luoghi, pagine come Method).
// `cite` riceve una lista di id di fonte e restituisce il richiamo numerato (vuoto se non ci sono fonti).
// Domande del quiz legate a una scheda (campo place, capital o people nel quiz): compaiono in fondo alla scheda.
function pageChecks(field, slug, cite) {
  const qs = ((data.quiz && data.quiz.questions) || []).filter((q) => q[field] === slug);
  if (!qs.length) return "";
  return `<section id="sec-check" class="checks"><span class="layer-tag rec">Try it</span><h2>Check what you took in</h2>${qs.map((q) => checkHtmlWith(q, cite)).join("")}<p class="check-score" role="status" aria-live="polite" hidden></p><p class="note-small">Nothing is saved. These questions are also in the <a href="../../quiz/index.html">quiz</a>.</p></section>`;
}
function checkHtmlWith(q, cite) {
  return `<div class="check" data-answer="${esc(q.answer)}"><p class="check-q">${esc(q.q)}</p><ul class="check-opts">${q.options.map((o) => `<li>${esc(o)}</li>`).join("")}</ul><details class="check-nojs"><summary>Show the answer</summary><p class="check-fb"><strong>${esc(q.answer)}.</strong> ${esc(q.explain)}${cite(q.cite)}</p></details></div>`;
}
function renderRich(b, cite, ctx) {
  const checkHtmlOf = (q) => checkHtmlWith(q, cite);
    if (b.type === "p") return `<p>${b.parts.map((x) => esc(x.text) + (x.cite ? cite(x.cite) : "")).join("")}</p>`;
    if (b.type === "timeline") return `<ol class="timeline"${b.tags ? ` data-tags="${esc(JSON.stringify(b.tags))}"` : ""}>${b.items.map((it) => `<li${it.tag ? ` data-tag="${esc(it.tag)}"` : ""}><span class="yr">${esc(it.when)}</span><span>${esc(it.text)}${cite(it.cite)}</span></li>`).join("")}</ol>`;
    const parts = (arr) => arr.map((x) => esc(x.text) + (x.cite ? cite(x.cite) : "")).join("");
    if (b.type === "stat") return `<ul class="stats">${b.items.map((it) => `<li><span class="stat-v">${esc(it.value)}</span><span class="stat-l">${esc(it.label)}${it.cite ? cite(it.cite) : ""}</span></li>`).join("")}</ul>`;
    if (b.type === "rawhtml") return b.html;
    if (b.type === "callout") return `<aside class="callout"><p class="callout-t">${esc(b.title)}</p><p>${parts(b.parts)}</p></aside>`;
    if (b.type === "reveal") return `<details class="reveal"><summary><span class="reveal-k">Think first</span><span>${esc(b.prompt)}</span></summary><p>${parts(b.parts)}</p></details>`;
    if (b.type === "figure") {
      const f = b.image;
      return `<figure class="story-fig${f.narrow ? " narrow" : ""}"><img src="${ctx.up}img/stories/${esc(f.file)}-800.jpg" width="${esc(f.width || 800)}" height="${esc(f.height || 533)}" alt="${esc(f.alt)}" loading="lazy"><figcaption>${esc(f.caption)} <span class="credit">${esc(f.credit)}, <a href="${esc(f.licenseUrl)}" rel="noopener">${esc(f.license)}</a>, <a href="${esc(f.source)}" rel="noopener">source</a>.</span></figcaption></figure>`;
    }
    if (b.type === "estimate") {
      const dec = b.decimals || 0;
      const shown = Number(b.answer).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
      return `<div class="estimate" data-min="${b.min}" data-max="${b.max}" data-step="${b.step || 1}" data-answer="${b.answer}" data-unit="${esc(b.unit || "")}" data-dec="${dec}"><p class="est-k">Make a guess</p><p class="est-q">${esc(b.prompt)}</p><details class="est-nojs"><summary>Show the answer</summary><p class="est-fb"><strong>${shown}${esc(b.unit || "")}.</strong> ${parts(b.parts)}</p></details></div>`;
    }
    if (b.type === "check") return checkHtmlOf(b);
    if (b.type === "recipe") return recipeHtml(b, cite);
    if (b.type === "order") {
      const items = b.items.map((it) => ({ label: it.label, html: `${it.href ? `<a href="${esc(it.href)}">${esc(it.label)}</a>` : esc(it.label)}: <strong>${esc(it.when)}.</strong> ${esc(it.text)}${cite(it.cite)}` }));
      return `<div class="order" data-items="${esc(JSON.stringify(items))}"><p class="est-k">Put in order</p><p class="est-q">${esc(b.prompt)}</p><details class="est-nojs"><summary>Show the correct order</summary><ol>${items.map((it) => `<li>${it.html}</li>`).join("")}</ol></details></div>`;
    }
    if (b.type === "table") {
      const fmt = (v, f) => (v == null ? "n/a" : f === "int" ? Math.round(v).toLocaleString("en-US") : f === "usd" ? "$" + Math.round(v).toLocaleString("en-US") : f === "pct" ? Number(v).toFixed(1) + "%" : esc(v));
      const head = b.columns.map((c) => `<th scope="col" data-type="${c.type || "text"}">${esc(c.label)}</th>`).join("");
      const rows = b.rows.map((r) => `<tr>${b.columns.map((c, i) => { const v = r[c.key]; const cell = c.format ? fmt(v, c.format) : esc(v); return i === 0 ? `<th scope="row">${cell}</th>` : `<td data-v="${v == null ? "" : esc(v)}"${c.type === "number" ? ' class="num"' : ""}>${cell}</td>`; }).join("")}</tr>`).join("");
      return `<div class="dt" data-filterable="${b.filter === false ? "no" : "yes"}"><p class="chart-title">${esc(b.title)}</p>${b.sub ? `<p class="chart-sub">${esc(b.sub)}${cite(b.cite)}</p>` : ""}<div class="dt-wrap" role="region" aria-label="${esc(b.title)}" tabindex="0"><table><caption class="sr-only">${esc(b.title)}</caption><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div><p class="note-small">${esc(b.note)}</p></div>`;
    }
    if (b.type === "chart") {
      const g = b.kind === "stacked"
        ? stackedShares(b.rows.map((r) => ({ ...r, tip: r.tip || r.text })), b.series)
        : barList(b.rows.map((r) => ({ ...r, tip: r.tip || r.text })), { accent: b.rows.length });
      return `<figure class="chart story-chart"><p class="chart-title">${esc(b.title)}</p>${b.sub ? `<p class="chart-sub">${esc(b.sub)}${cite(b.cite)}</p>` : ""}${g}<figcaption>${esc(b.note)}</figcaption></figure>`;
    }
  if (b.type === "html") return String(b.html).replace("<!--contact-->", ctx.contactLine || "");
  return "";
}

function renderStory(st) {
  const { cite, list: sourcesList } = makeCiter();
  const k = kindOf[st.kind];
  const checkHtmlOf = (q) => checkHtmlWith(q, cite);
  const block = (b) => renderRich(b, cite, { up: "../../" });
  const secs = st.sections.map((sec, i) => `<section id="sec-${esc(sec.id)}">${i === 0 ? '<div class="sec-head"><span class="layer-tag rec">In the record</span></div>' : ""}<h2>${esc(sec.title)}</h2>${sec.blocks.map(block).join("")}</section>`).join("\n");
  const kindsHere = (config.storyNoteKinds || {})[st.kind] || [];
  const sNotes = (notes[`story-${st.slug}`] || []).slice().sort((a, b) => b.added.localeCompare(a.added));
  const voices = `<section class="story-voices" id="voices" aria-labelledby="voices-h"><span class="layer-tag voi">From people who know this</span><h2 id="voices-h">What readers add</h2>
${sNotes.length ? `<div class="notes">${sNotes.map((n) => noteCard(n, kindsHere)).join("")}</div>` : `<div class="empty"><strong>No local voice on this story yet.</strong><span>Notes are added once the author has agreed to publication, and are read by people who know the subject afterwards.</span></div>`}
${shareSection({ type: "story", id: st.slug, name: st.title, kinds: kindsHere, heading: "Add what you know", intro: st.kind === "food" ? "Do you cook this, or call it something else? Tell us." : st.kind === "myth" ? "Where did you meet this idea, and what do you see where you live?" : "Does your family or community know this differently, or know where to read more?", depth: 2 })}
</section>`;
  const checkQs = ((data.quiz && data.quiz.questions) || []).filter((q) => q.story === st.slug);
  const checkHtml = checkHtmlOf;
  const checks = checkQs.length ? `<section id="sec-check" class="checks"><span class="layer-tag rec">Try it</span><h2>Check what you took in</h2>${checkQs.map(checkHtml).join("")}<p class="check-score" role="status" aria-live="polite" hidden></p><p class="note-small">These questions are also in the <a href="../../quiz/index.html">quiz</a>. Nothing you answer is saved.</p></section>` : "";
  const keyHtml = st.keyPoints ? `<aside class="keypoints" aria-labelledby="kp-h"><h2 id="kp-h">In short</h2><ul>${st.keyPoints.map((x) => `<li>${esc(x.text)}${x.cite ? cite(x.cite) : ""}</li>`).join("")}</ul></aside>` : "";
  const gaps = `<section id="sec-gaps" class="gaps"><span class="layer-tag gap">What we do not know</span><ul>${st.gaps.map((g) => `<li>${esc(g)}</li>`).join("")}</ul></section>`;
  const relCountries = (st.countries || []).map((c) => `<a href="../../countries/${esc(cSlug[c] || "")}/index.html">${esc(cName[c] || c)}</a>`).join(", ");
  const relPlaces = storyPlaces(st).map((slug) => published.find((x) => x.slug === slug)).filter(Boolean).map((x) => `<a href="../../places/${esc(x.slug)}/index.html">${esc(x.name)}</a>`).join(", ");
  const relPeoples = storyPeoples(st).map((sl) => peoples.find(({ data: pp }) => pp.slug === sl && (pp.status === "published" || includeDrafts))).filter(Boolean).map(({ data: pp }) => `<a href="../../peoples/${esc(pp.slug)}/index.html">${esc(pp.name)}</a>`).join(", ");
  const toolLi = st.tool ? `<li><a href="../../${esc(st.tool.href)}/index.html">${esc(st.tool.label)}</a></li>` : "";
  const relStories = (() => { const near = stories.filter((x) => x.slug !== st.slug && ((x.countries || []).some((c) => (st.countries || []).includes(c)) || (x.places || []).some((pl) => (st.places || []).includes(pl)) || storyPeoples(x).some((pp) => storyPeoples(st).includes(pp)))); const same = stories.filter((x) => x.slug !== st.slug && x.kind === st.kind && !near.includes(x)); return [...near.slice(0, 4), ...same].slice(0, Math.max(4, Math.min(near.length, 4))); })().map((x) => `<a href="../${esc(x.slug)}/index.html">${esc(x.title)}</a>`).join(" · ");
  const relCaps = (st.countries || []).map((iso) => capitals.find(({ data: cp }) => cp.country === iso && (cp.sections || []).length && (cp.status === "published" || includeDrafts))).filter(Boolean).map(({ data: cp }) => `<a href="../../capitals/${esc(cp.slug)}/index.html">${esc(cp.name)}</a>`).join(", ");
  const relCountriesLi = relCountries ? `<li>Country figures: ${relCountries}</li>` : `<li>Countries: <a href="../../countries/index.html">All 54 African states</a></li>`;
  const related = relCountries || relPlaces || toolLi || relStories || relCaps || relPeoples ? `<aside class="related" aria-label="Related"><h2>Keep exploring</h2><ul>${toolLi}${relCountriesLi}${relPlaces ? `<li>Place cards: ${relPlaces}</li>` : ""}${relCaps ? `<li>Capital: ${relCaps}</li>` : ""}${relPeoples ? `<li>People: ${relPeoples}</li>` : ""}${relStories ? `<li>Related stories: ${relStories}</li>` : ""}<li><a href="../../explore/index.html#s:${esc(st.slug)}">Connections graph →</a></li><li><a href="../index.html">All stories</a></li></ul></aside>` : "";
  const more = stories.filter((x) => x.slug !== st.slug && x.kind === st.kind).slice(0, 2);
  const moreHtml = more.length ? `<section class="more"><h2>More ${esc(k.label.toLowerCase())}</h2><ul class="scards">${more.map((x) => storyCard(x, "../../")).join("")}</ul></section>` : "";
  const trailsHere = (((data.trails && data.trails.trails) || [])).map((t) => ({ ...t, steps: t.steps.filter((x) => stories.some((y) => y.slug === x.story)) })).filter((t) => t.steps.length >= 4 && t.steps.some((x) => x.story === st.slug)).map((t) => ({ id: t.id, title: t.title, steps: t.steps.map((x) => ({ slug: x.story, title: (stories.find((y) => y.slug === x.story) || {}).title, why: x.why })) }));
  const trailData = trailsHere.length ? `<script type="application/json" id="trail-data">${JSON.stringify(trailsHere).replace(/</g, "\\u003c")}</script>` : "";
  const body = `${compactHero({ kicker: k.label, title: st.title, sub: st.subtitle, scene: st.kind === "food" ? "fields" : "ruins" })}
<div class="wrap prose-hero"><p class="story-meta">${readMin(st)} minute read · every sentence below carries its source number</p>
<div class="read-progress" aria-hidden="true"><span></span></div><div id="trail-bar" class="trail-bar" hidden></div>${trailData}${keyHtml}<article class="story">${secs}
${checks}
${gaps}
${voices}
${deeperHtml(st.deeper)}
${related}
${sourcesList()}
${moreHtml}</article></div>`;
  return layout({ title: `${st.title} · ${config.name}`, description: st.subtitle, depth: 2, current: "stories", body, extraScripts: ["story.js", "recipe.js", "share.js"], jump: [...st.sections.map((x) => ({ id: "sec-" + x.id, label: x.title })).slice(0, 5), { id: "sec-gaps", label: "Unknown" }, { id: "voices", label: "Add yours" }, { id: "sec-sources", label: "Sources" }] });
}

function renderStories() {
  const storyBySlug = Object.fromEntries(stories.map((x) => [x.slug, x]));
  const mythStories = stories.filter((x) => x.kind === "myth");
  const historyStories = stories.filter((x) => x.kind === "history");
  const histMythStories = stories.filter((x) => x.kind === "myth" || x.kind === "history");

  // Giro di riscaldamento: domande solo su miti e storia
  const seen = new Set();
  const warmQs = [];
  for (const q of (data.quiz && data.quiz.questions) || []) {
    if (!q.story || seen.has(q.story) || !histMythStories.some((x) => x.slug === q.story)) continue;
    seen.add(q.story);
    warmQs.push(q);
    if (warmQs.length === 5) break;
  }
  const warm = warmQs.length ? `<section id="sec-warmup" class="checks warmup"><span class="layer-tag rec">Warm-up round</span><h2>Five questions before you read</h2><p class="note-small">Guess first. Each answer points to the story that explains it.</p>${warmQs.map((q) => checkHtmlWith({ ...q, explain: q.explain + " Read more: " + stories.find((x) => x.slug === q.story).title + "." }, () => "")).join("")}<p class="check-score" role="status" aria-live="polite" hidden></p><p class="note-small">Nothing is saved: the score disappears when you leave the page. <a href="../quiz/index.html">Full quiz</a></p></section>` : "";

  // Percorsi di lettura: escludiamo on-the-plate (che va nella pagina Food)
  const trailList = ((data.trails && data.trails.trails) || [])
    .filter((t) => t.id !== "on-the-plate")
    .map((t) => ({ ...t, steps: t.steps.filter((x) => storyBySlug[x.story]) }))
    .filter((t) => t.steps.length >= 4);

  const trailsHtml = trailList.length ? `<section id="sec-trails" class="trails"><span class="layer-tag rec">Reading trails</span><h2>Pick a trail</h2><p class="note-small">Each trail is a curated sequence of stories that builds context step by step. Open the first stop: the next one is waiting at the end of each story. Nothing is saved; where you are is carried in the page address.</p><ol class="trail-list">${trailList.map((t) => `<li class="trail"><h3>${esc(t.title)}</h3><p>${esc(t.intro)}</p><ol class="trail-steps">${t.steps.map((stp, i) => `<li><a href="${esc(storyHref(storyBySlug[stp.story], "../"))}?trail=${esc(t.id)}&amp;step=${i + 1}"><span class="trail-n" aria-hidden="true">${i + 1}</span><span>${esc(storyBySlug[stp.story].title)}</span></a></li>`).join("")}</ol><p><a class="btn" href="${esc(storyHref(storyBySlug[t.steps[0].story], "../"))}?trail=${esc(t.id)}&amp;step=1">Start this trail</a></p></li>`).join("")}</ol></section>` : "";

  // Gioco "Di quale storia è?": frasi prese dai punti chiave di miti e storia
  const gameItems = histMythStories.flatMap((x) => (x.keyPoints || []).filter((k) => k.text.length >= 50 && k.text.length <= 230).map((k) => ({ t: k.text, s: x.slug, n: x.title, k: x.kind })));
  const gameHtml = gameItems.length >= 20 ? `<section id="sec-game" class="sgame" aria-labelledby="sg-h"><span class="layer-tag rec">Game</span><h2 id="sg-h">Which story is this from?</h2><p class="note-small">A fact from the stories, four possible stories. Six rounds; streaks count. Nothing is saved.</p><noscript><p class="note-small">This game needs JavaScript.</p></noscript><div id="sgame" hidden></div><script type="application/json" id="sgame-data">${JSON.stringify({ items: gameItems, base: "" }).replace(/</g, "\\u003c")}</script></section>` : "";

  const body = `${compactHero({ scene: "ruins", kicker: "Learn", title: "History & Myths", sub: "Real history told with its sources, and common ideas about Africa checked against the record." })}
<div class="wrap">
<section class="hero-lede">
  <p class="lede">The place cards say where. These pages say what happened and what people get wrong. They follow the same rule: every claim has a source, and each story ends with what is still not known.</p>
  <nav class="story-nav-jump" aria-label="Jump to section">
    <a href="#sec-myths">Myths (${mythStories.length})</a>
    <a href="#sec-history">History &amp; Kingdoms (${historyStories.length})</a>
    <a href="#sec-trails">Reading trails (${trailList.length})</a>
    <a href="#sec-test">Test yourself</a>
  </nav>
</section>

<section id="sec-myths" class="story-group">
  <span class="layer-tag rec">Debunking</span>
  <h2>Myths checked against the record</h2>
  <p class="blurb">Ideas about Africa that seem familiar — from borders and languages to religion, scale and everyday life — tested against census data, cartography, linguistics and the historical record.</p>
  <ul class="scards">${mythStories.map((x) => storyCard(x, "../")).join("")}</ul>
</section>

<section id="sec-history" class="story-group">
  <span class="layer-tag rec">Documented Record</span>
  <h2>History, kingdoms and power</h2>
  <p class="blurb">Polities, trade networks, indigenous constitutions and colonial encounters, told through what primary texts and excavations document — and where historians disagree.</p>
  <ul class="scards">${historyStories.map((x) => storyCard(x, "../")).join("")}</ul>
</section>

${trailsHtml}

<section id="sec-test" class="story-test-hub">
  <div class="story-test-head">
    <span class="layer-tag rec">Interactive</span>
    <h2>Put yourself to the test</h2>
    <p class="blurb">Test what you took in, or make an educated guess before you read.</p>
  </div>
  ${warm}
  ${gameHtml}
</section>

<aside class="story-food-link">
  <h3>Looking for culinary history and recipes?</h3>
  <p>Crops like cassava and teff, fermentation methods, culinary histories and recipes from 54 countries now have their own dedicated space.</p>
  <a class="btn" href="../food/index.html">Explore Food &amp; Foodways</a>
</aside>
</div>`;

  return layout({
    title: `History & Myths · ${config.name}`,
    description: "Real history and common myths checked against the record: short stories about Africa, each with sources.",
    depth: 1,
    current: "stories",
    body,
    extraScripts: ["story.js", "storygame.js"],
    jump: [
      { id: "sec-myths", label: "Myths" },
      { id: "sec-history", label: "History" },
      { id: "sec-trails", label: "Trails" },
      { id: "sec-warmup", label: "Warm-up" },
      { id: "sec-game", label: "Game" }
    ]
  });
}

const FOOD_STORY_IMG = { "coffee-the-ethiopian-bean-that-woke-the-world": "food-coffee", "couscous-the-dish-that-united-the-maghreb": "food-couscous", "fufu-and-ugali-the-staple-that-feeds-a-continent": "food-fufu" };
let _storyImgs = null;
function foodStoryImage(st) {
  for (const sec of st.sections) for (const b of sec.blocks) if (b.type === "figure" && b.image) return b.image;
  if (!_storyImgs) { const f = path.join(root, "content", "data", "story-images.json"); _storyImgs = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {}; }
  return _storyImgs[FOOD_STORY_IMG[st.slug]] || null;
}
function foodStoryCard(st, p = "") {
  const im = foodStoryImage(st);
  const img = im ? `${p}img/stories/${im.file}-800.jpg` : "";
  const imgHtml = img
    ? `<img src="${esc(img)}" alt="${esc(im.alt || "")}" width="800" height="533" loading="lazy">`
    : `<div class="food-card-art">${art(st.slug, 3, 2)}</div>`;

  return `<li>
    <a class="food-card" href="${esc(storyHref(st, p))}">
      <div class="food-card-media">
        ${imgHtml}
        <span class="food-card-tag">${readMin(st)} min read</span>
      </div>
      <div class="food-card-body">
        <span class="food-card-kicker">Story</span>
        <h3 class="food-card-title">${esc(st.title)}</h3>
        <p class="food-card-desc">${esc(st.subtitle)}</p>
        <div class="food-card-footer">
          <span>${(st.countries || []).map((c) => esc(cName[c] || c)).join(" · ")}</span>
          <span class="food-card-more">Read story →</span>
        </div>
      </div>
    </a>
  </li>`;
}

function foodDishCard(d, p = "") {
  const hasRecipe = (d.sections || []).some((sec) => (sec.blocks || []).some((b) => b.type === "recipe"));
  const img = d.image ? `${p}img/places/${esc(d.image.file)}-800.jpg` : "";
  const imgHtml = img
    ? `<img src="${esc(img)}" alt="${esc(d.image.alt || d.name)}" width="800" height="533" loading="lazy">`
    : `<div class="food-card-art">${art(d.slug, 3, 2)}</div>`;

  return `<li>
    <a class="food-card" href="${p}places/${esc(d.slug)}/index.html">
      <div class="food-card-media">
        ${imgHtml}
        ${hasRecipe ? '<span class="food-card-tag has-recipe">Interactive recipe</span>' : '<span class="food-card-tag">Documented dish</span>'}
      </div>
      <div class="food-card-body">
        <span class="food-card-kicker">Dish · ${esc(cName[d.country] || d.region)}</span>
        <h3 class="food-card-title">${esc(d.name)}</h3>
        <p class="food-card-desc">${esc(d.subtitle || "")}</p>
        <div class="food-card-footer">
          <span>${esc(d.region || "")}</span>
          <span class="food-card-more">${hasRecipe ? "View recipe →" : "View dish →"}</span>
        </div>
      </div>
    </a>
  </li>`;
}

function renderFood() {
  const foodStories = stories.filter((x) => x.kind === "food");
  const storyBySlug = Object.fromEntries(stories.map((x) => [x.slug, x]));
  const foodTrails = ((data.trails && data.trails.trails) || [])
    .filter((t) => t.id === "on-the-plate")
    .map((t) => ({ ...t, steps: t.steps.filter((x) => storyBySlug[x.story]) }))
    .filter((t) => t.steps.length >= 4);

  const dishes = published.filter((p) => p.type === "dish").sort((a, b) => a.name.localeCompare(b.name));

  const hasRec = (d) => (d.sections || []).some((sec) => (sec.blocks || []).some((x) => x.type === "recipe"));
  const fullDishes = dishes.filter((d) => (d.sections || []).length);
  const emptyDishes = dishes.filter((d) => !(d.sections || []).length);
  const regionOf = (iso) => subOf[iso] || "other";
  const regions = config.subregions.map((r) => {
    const sts = foodStories.filter((x) => regionOf((x.countries || [])[0]) === r.id);
    const ds = fullDishes.filter((d) => regionOf(d.country) === r.id).sort((a, b) => (hasRec(b) - hasRec(a)) || a.name.localeCompare(b.name));
    return { r, sts, ds };
  }).filter((g) => g.sts.length || g.ds.length);
  const recipeCount = fullDishes.filter(hasRec).length;
  const trail = foodTrails[0];
  const trailHtml = trail ? `<aside class="food-trail-line"><p><strong>Six stories in order.</strong> ${esc(trail.intro)}</p><a class="btn" href="${esc(storyHref(storyBySlug[trail.steps[0].story], "../"))}?trail=${esc(trail.id)}&amp;step=1">Start the food trail</a></aside>` : "";
  const regionHtml = regions.map(({ r, sts, ds }) => `<section id="fr-${esc(r.id)}" class="food-region"><h2>${esc(r.label)}</h2><p class="blurb">${[sts.length ? `${sts.length} ${sts.length === 1 ? "story" : "stories"} about a staple or a crop` : "", ds.length ? `${ds.length} ${ds.length === 1 ? "dish" : "dishes"}${ds.some(hasRec) ? `, ${ds.filter(hasRec).length} with a recipe you can cook` : ""}` : ""].filter(Boolean).join(" · ")}</p><ul class="food-grid">${sts.map((x) => foodStoryCard(x, "../")).join("")}${ds.map((d) => foodDishCard(d, "../")).join("")}</ul></section>`).join("\n");
  const credits = (() => { const cr = foodStories.map((x) => [x, foodStoryImage(x)]).filter(([, im]) => im && im.credit); return cr.length ? `<p class="note-small food-credits">Story photos: ${cr.map(([x, im]) => `${esc(x.title.split(":")[0])} by ${esc(im.credit)}, <a href="${esc(im.licenseUrl)}">${esc(im.license)}</a>, <a href="${esc(im.source)}">Wikimedia Commons</a>`).join("; ")}. Dish photos are credited on each dish card.</p>` : ""; })();
  const todoHtml = emptyDishes.length ? `<details class="fold food-todo"><summary><span>${emptyDishes.length} more dishes in preparation</span></summary><p class="note-small">One dish per country is planned. These cards have no sourced content yet; each link opens an empty draft.</p><ul class="food-todo-list">${emptyDishes.map((d) => `<li><a href="../places/${esc(d.slug)}/index.html">${esc(d.name)}</a> <span>${esc(cName[d.country] || d.country)}</span></li>`).join("")}</ul></details>` : "";

  const body = `${compactHero({ scene: "fields", kicker: "Heritage & Living Culture", title: "Food & Foodways", sub: "Dishes, staple crops, culinary techniques and the arguments behind them." })}
<div class="wrap food-page-wrap">
<section class="hero-lede">
  <p class="lede">Food in Africa is not a static tourist menu of "national dishes". It is living agricultural heritage: indigenous grains like teff and fonio, American crops like cassava, ancient fermentation methods, and shared community rituals.</p>
  <p>The page goes region by region. <strong>Stories</strong> follow a staple or a crop through history; <strong>dishes</strong> are what ends up on the plate, ${recipeCount} of them with a recipe that scales servings and times each step. Facts come from sources; what cooks tell us is kept apart.</p>
  <nav class="story-nav-jump" aria-label="Jump to a region">${regions.map(({ r }) => `<a href="#fr-${esc(r.id)}">${esc(r.label.replace(/ Africa$/, ""))}</a>`).join("")}</nav>
</section>
${trailHtml}
${regionHtml}
<section id="sec-more" class="food-more">${credits}${todoHtml}</section>
</div>`;

  return layout({
    title: `Food & Foodways · ${config.name}`,
    description: "Dishes, staple crops, culinary techniques and the food history of Africa, each with sources.",
    depth: 1,
    current: "food",
    body,
    extraScripts: ["story.js", "recipe.js"],
    jump: regions.map(({ r }) => ({ id: "fr-" + r.id, label: r.label.replace(/ Africa$/, "") }))
  });
}

const storiesBand = stories.length
  ? `<section id="stories" class="band-sand section">
  <div class="wrap">
    <div class="night-head"><h2 class="listh">History &amp; Myths</h2><p class="lede">History told with its sources, and common myths checked against the record.</p></div>
    <ul class="scards">${stories.filter((x) => x.kind !== "food").slice(0, 6).map((x) => storyCard(x)).join("")}</ul>
    <p class="actions"><a class="btn" href="stories/index.html">All history &amp; myths</a> <a class="btn btn-alt" href="food/index.html">Explore food</a></p>
  </div>
</section>`
  : "";
if (stories.length) {
  write("stories/index.html", renderStories());
  write("food/index.html", renderFood());
  for (const st of stories) write(`stories/${st.slug}/index.html`, renderStory(st));
}

write("places/index.html", renderPlaces());
if (artCatalog) write("places/art/index.html", renderArt());
// ---------- landing: anteprime dal contenuto vero (mai un elenco di tutto) ----------
const homeStoryList = (() => {
  const out = [], seen = new Set();
  for (const x of stories) if (!seen.has(x.kind) && out.length < 3) { seen.add(x.kind); out.push(x); }
  for (const x of stories) if (out.length < 3 && !out.includes(x)) out.push(x);
  return out;
})();
const homeStoryBySlug = Object.fromEntries(stories.map((x) => [x.slug, x]));
const homeTrails = ((data.trails && data.trails.trails) || []).map((t) => ({ ...t, steps: t.steps.filter((x) => homeStoryBySlug[x.story]) })).filter((t) => t.steps.length >= 4);
const homePlaceCards = (() => {
  const pool = published.filter((x) => x.image && x.status === "published");
  const pick = [], seenType = new Set();
  for (const x of pool) if (!seenType.has(x.type) && pick.length < 4) { seenType.add(x.type); pick.push(x); }
  return pick;
})();
const homeArtCards = (() => {
  const cats = (artCatalog && artCatalog.categories) || [];
  const bySlug = new Map(published.map((x) => [x.slug, x]));
  const out = [];
  for (const c of cats) { const x = c.places.map((sl) => bySlug.get(sl)).find((y) => y && y.image && y.status === "published"); if (x && out.length < 4) out.push({ place: x, label: c.label }); }
  return out;
})();
const miniCard = (x, label) => `<li><a class="mini" href="places/${esc(x.slug)}/index.html"><img src="img/places/${esc(x.image.file)}-800.jpg" alt="${esc(x.image.alt || x.name)}" width="800" height="533" loading="lazy"><span class="mini-t">${esc(x.name)}</span><span class="mini-s">${esc(label)}</span></a></li>`;
const capsAvail = capitals.filter(({ data: cp }) => cp.status === "published" || includeDrafts).length;
const peoplesAvail = peoples.filter(({ data: pp }) => pp.status === "published" || includeDrafts).length;
const draftPlaces = published.filter((x) => x.status === "draft").length;
const livePlaces = published.filter((x) => x.status === "published").length;
const homeQ = ((data.quiz && data.quiz.questions) || []).find((q) => q.id === "map-greenland") || ((data.quiz && data.quiz.questions) || [])[0];
const homeQuestion = homeQ ? `<div class="checks live-q"><p class="live-q-t">Try one now</p>${checkHtmlWith({ ...homeQ, explain: homeQ.explain + (homeQ.story ? " Read more: " + ((stories.find((x) => x.slug === homeQ.story) || {}).title || "") + "." : "") }, () => "")}<p class="check-score" role="status" aria-live="polite" hidden></p></div>` : "";
const homeTypeLabel = Object.fromEntries((config.placeTypes || []).map((t) => [t.id, t.label]));
const quizCount = ((data.quiz && data.quiz.questions) || []).length;
const homePeoples = peoples.map(({ data: pp }) => pp).filter((pp) => pp.status === "published" || includeDrafts).map((pp) => { let im = null; for (const sec of pp.sections || []) for (const b of sec.blocks) if (!im && b.type === "figure" && b.image) im = b.image; return { pp, im }; }).filter((x) => x.im).slice(0, 6);
const homeCapitals = (() => {
  const bySlug = new Map(published.map((x) => [x.slug, x]));
  const out = [];
  for (const { data: cp } of capitals) {
    if (!((cp.sections || []).length && (cp.status === "published" || includeDrafts))) continue;
    const pl = (cp.places || []).map((sl) => bySlug.get(sl)).find((y) => y && y.image);
    if (pl && out.length < 4) out.push({ cp, pl });
  }
  return out;
})();
const homeLookRows = `${homePeoples.length ? `<h3 class="way-sub">Peoples</h3><ul class="minis">${homePeoples.map(({ pp, im }) => `<li><a class="mini" href="peoples/${esc(pp.slug)}/index.html"><img src="img/stories/${esc(im.file)}-800.jpg" alt="" width="800" height="533" loading="lazy"><span class="mini-t">${esc(pp.name.replace(/\s*\(.*\)$/, ""))}</span><span class="mini-s">${esc((pp.countries || []).slice(0, 2).map((i) => cName[i] || i).join(", "))}${(pp.countries || []).length > 2 ? " and more" : ""}</span></a></li>`).join("")}</ul>` : ""}${homeCapitals.length ? `<h3 class="way-sub">Capitals</h3><ul class="minis">${homeCapitals.map(({ cp, pl }) => `<li><a class="mini" href="capitals/${esc(cp.slug)}/index.html"><img src="img/places/${esc(pl.image.file)}-800.jpg" alt="" width="800" height="533" loading="lazy"><span class="mini-t">${esc(cp.name)}</span><span class="mini-s">Capital of ${esc(cName[cp.country] || cp.country)}</span></a></li>`).join("")}</ul>` : ""}`;

write("index.html", layout({
  title: config.name,
  description: config.tagline,
  depth: 0,
  script: true,
  extraScripts: ["story.js"],
  bodyClass: "home",
  jump: [{ id: "discover", label: "Pathways" }, ...(mapSection ? [{ id: "map", label: "Map" }] : []), { id: "featured", label: "Featured" }, { id: "play", label: "Play" }],
  body: `
<section class="scape-hero compact">
  ${landscape()}
  <div class="scape-text">
    <h1>${esc(config.name)}</h1>
    <p class="scape-sub">${esc(config.tagline)}</p>
    <p class="actions"><a class="btn btn-cream" href="#map">Explore the map ↓</a> <a class="btn btn-cream btn-ghost" href="#discover">Discover pathways →</a></p>
  </div>
</section>

<section id="discover" class="wrap home-discover" aria-labelledby="discover-h">
  <div class="discover-head">
    <p class="layer-tag rec">The Living Atlas</p>
    <h2 id="discover-h">54 African countries, explored through four pathways</h2>
    <p class="lede">Every card asks you to guess before it reveals. Every claim carries a verified source, every gap is acknowledged, and local accounts remain separate from the historical record.</p>
  </div>

  <ul class="home-pathways">
    <li class="pathway-card">
      <div class="pathway-img-wrap">
        <img src="img/places/rock-hewn-churches-of-lalibela-800.jpg" alt="Rock-Hewn Churches of Lalibela" width="800" height="450" loading="lazy">
        <span class="pathway-badge">${livePlaces} places</span>
      </div>
      <div class="pathway-content">
        <h3 class="pathway-title">Places &amp; Art</h3>
        <p class="pathway-desc">UNESCO World Heritage sites, architectural monuments and historic African artworks understood through their original ceremonial and social functions.</p>
        <a class="pathway-cta" href="places/index.html">Browse places &amp; art &rarr;</a>
      </div>
    </li>

    <li class="pathway-card">
      <div class="pathway-img-wrap">
        <img src="img/stories/adwa-painting-800.jpg" alt="The Battle of Adwa painting" width="800" height="450" loading="lazy">
        <span class="pathway-badge">${stories.length} investigations</span>
      </div>
      <div class="pathway-content">
        <h3 class="pathway-title">History &amp; Myths</h3>
        <p class="pathway-desc">Short investigations testing common assumptions against the historical record: the myth of 'tribes', the partition of Africa, ancient empires and culinary crossroads.</p>
        <a class="pathway-cta" href="stories/index.html">Read history &amp; myths &rarr;</a>
      </div>
    </li>

    <li class="pathway-card">
      <div class="pathway-img-wrap">
        <img src="img/capitals/capital-algiers-algeria-800.jpg" alt="Algiers capital city" width="800" height="450" loading="lazy">
        <span class="pathway-badge">54 sovereign states</span>
      </div>
      <div class="pathway-content">
        <h3 class="pathway-title">Countries &amp; Capitals</h3>
        <p class="pathway-desc">Complete national profiles for all 54 states, comparative demographics, regional journeys across subregions, and dedicated guides to each capital city.</p>
        <a class="pathway-cta" href="countries/index.html">Explore countries &amp; capitals &rarr;</a>
      </div>
    </li>

    <li class="pathway-card">
      <div class="pathway-img-wrap">
        <img src="img/stories/people-fula-800.jpg" alt="Fula cultural traditions" width="800" height="450" loading="lazy">
        <span class="pathway-badge">Peoples &amp; Culture</span>
      </div>
      <div class="pathway-content">
        <h3 class="pathway-title">Peoples &amp; Societies</h3>
        <p class="pathway-desc">Moving beyond colonial categories: documented ethnic and linguistic groups as sources name them, their cross-border heritage, institutions and living traditions.</p>
        <a class="pathway-cta" href="peoples/index.html">Meet the peoples &rarr;</a>
      </div>
    </li>
  </ul>

  <div class="home-method-strip">
    <div class="hms-item">
      <span class="hms-tag">Sourced Record</span>
      <p>Every factual claim carries a numbered citation back to verified archives, statistics or research.</p>
    </div>
    <div class="hms-item">
      <span class="hms-tag">Two Voices</span>
      <p>Documented historical facts and lived local accounts are never mixed together.</p>
    </div>
    <div class="hms-item">
      <span class="hms-tag">Private &amp; Offline</span>
      <p>No cookies, no analytics, no external tracking. The entire project runs locally in your browser.</p>
    </div>
    <div class="hms-item">
      <span class="hms-tag">Open to Correction</span>
      <p>Every page has an integrated note form for readers from that community to correct or enrich the record.</p>
    </div>
  </div>
  <p class="home-method-link"><a href="method/index.html">Read how this project is built and audited &rarr;</a></p>
</section>

${mapSection}

<section id="featured" class="band-sand section way" aria-labelledby="featured-h">
  <div class="wrap way-grid">
    <div class="way-text">
      <h2 id="featured-h">Start somewhere</h2>
      <p class="lede">Short stories that begin from a question: myths tested against the record, history rarely taught in schools, and the foodways that bridge nations.</p>
      <p class="actions"><a class="btn" href="stories/index.html">All stories</a> <a class="btn btn-alt" href="food/index.html">Food &amp; Foodways</a></p>
    </div>
    <div class="way-body">
      <ul class="scards">${homeStoryList.map((x) => storyCard(x, "")).join("")}</ul>
      ${homePlaceCards.length ? `<h3 class="way-sub">Curated landmarks</h3><ul class="minis">${homePlaceCards.map((x) => miniCard(x, homeTypeLabel[x.type] || x.type)).join("")}</ul>` : ""}
      ${homeTrails.length ? `<div class="home-featured-extra"><h3 class="home-featured-sub">Or follow an editorial trail across borders</h3><ul class="home-trails-grid">${homeTrails.map((t) => `<li><a class="trail-card" href="${esc(storyHref(homeStoryBySlug[t.steps[0].story], ""))}?trail=${esc(t.id)}&amp;step=1"><span class="trail-card-tag">${t.steps.length} stops</span><strong>${esc(t.title)}</strong><span>${esc(t.intro)}</span></a></li>`).join("")}</ul></div>` : ""}
    </div>
  </div>
</section>

<section id="play" class="band-saffron section way" aria-labelledby="play-h">
  <div class="wrap way-grid">
    <div class="way-text">
      <h2 id="play-h">Play</h2>
      <p class="lede">You learn faster when you commit to an answer first. Interactive challenges that test what you know and reveal the data behind it.</p>
      ${homeQuestion}
    </div>
    <div class="way-body">
      <ul class="play-grid">
        <li><a class="play-card" href="quiz/index.html"><strong>Interactive Quiz</strong><span>${quizCount} curated questions on history, geography and languages, each with its citation.</span><span class="pc-arrow">Take the quiz &rarr;</span></a></li>
        <li><a class="play-card" href="explore/index.html"><strong>Connections Graph</strong><span>Follow the editorial links between countries, places, peoples and stories, or race the Thread Quest.</span><span class="pc-arrow">Explore network &rarr;</span></a></li>
        <li><a class="play-card" href="true-size/index.html"><strong>True Size Comparison</strong><span>Drag countries over Africa on an equal-area projection map to see real continental scales.</span><span class="pc-arrow">Compare sizes &rarr;</span></a></li>
        <li><a class="play-card" href="society/index.html"><strong>Society &amp; Demographics</strong><span>Faith, forms of government and linguistic families: guess the shares, then see the data.</span><span class="pc-arrow">Explore society &rarr;</span></a></li>
        <li><a class="play-card" href="stories/index.html#sec-game"><strong>Which Story Is This?</strong><span>A single documented fact, four story options, and a streak counter to challenge yourself.</span><span class="pc-arrow">Play trivia &rarr;</span></a></li>
        <li><a class="play-card" href="languages/index.html"><strong>Language Recognition</strong><span>Read a real phrase, choose between four African languages, and learn where it is spoken.</span><span class="pc-arrow">Guess language &rarr;</span></a></li>
      </ul>
    </div>
  </div>
</section>`
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
  const capOf = (iso) => capitals.find(({ data: cp }) => cp.country === iso)?.data || null;
  const peoplesOf = (iso) => peoples.filter(({ data: pe }) => (pe.countries || []).includes(iso) && (pe.status === "published" || includeDrafts)).map(({ data: pe }) => pe);
  const storiesOf = (iso) => stories.filter((s) => (s.countries || []).includes(iso));

  const countryCard = (c) => {
    const cp = capOf(c.iso3);
    const pl = cardsOf(c.iso3);
    const pe = peoplesOf(c.iso3);
    const st = storiesOf(c.iso3);
    const subName = subLabel[c.subregion] || c.subregion;
    const url = `${cSlug[c.iso3]}/index.html`;

    return `<li id="country-${esc(c.iso3)}" class="country-grid-card" data-sub="${esc(c.subregion)}" data-name="${esc((c.name + " " + c.capital).toLowerCase())}">
      <article class="cgc-inner">
        <header class="cgc-header">
          <div class="cgc-top">
            <span class="cgc-subregion">${esc(subName)}</span>
            <span class="cgc-iso">${esc(c.iso3)}</span>
          </div>
          <h3 class="cgc-title"><a href="${esc(url)}">${esc(c.name)}</a></h3>
          <p class="cgc-capital">Capital: ${cp ? `<a href="../capitals/${esc(cp.slug)}/index.html">${esc(c.capital)}</a>` : esc(c.capital)}</p>
        </header>

        <div class="cgc-kpis">
          <div class="cgc-kpi"><span class="cgc-kpi-k">Population</span><span class="cgc-kpi-v">${fmtPop(c.population)}</span></div>
          <div class="cgc-kpi"><span class="cgc-kpi-k">Area</span><span class="cgc-kpi-v">${fmtInt(c.area)} km²</span></div>
          <div class="cgc-kpi"><span class="cgc-kpi-k">Density</span><span class="cgc-kpi-v">${den(c) < 10 ? den(c).toFixed(1) : fmtInt(den(c))}/km²</span></div>
        </div>

        <div class="cgc-badges" aria-label="Connected content in the site">
          ${cp ? `<a class="cgc-badge cgc-b-cap" href="../capitals/${esc(cp.slug)}/index.html" title="Capital city guide: ${esc(c.capital)}">Capital guide</a>` : ""}
          ${pl.length ? `<a class="cgc-badge cgc-b-place" href="${esc(url)}#places" title="${pl.length} place cards">${pl.length} ${pl.length === 1 ? "place" : "places"}</a>` : ""}
          ${pe.length ? `<a class="cgc-badge cgc-b-people" href="${esc(url)}#peoples" title="${pe.length} documented peoples">${pe.length} ${pe.length === 1 ? "people" : "peoples"}</a>` : ""}
          ${st.length ? `<a class="cgc-badge cgc-b-story" href="${esc(url)}#stories" title="${st.length} stories">${st.length} ${st.length === 1 ? "story" : "stories"}</a>` : ""}
        </div>

        <div class="cgc-actions">
          <a class="cgc-cta" href="${esc(url)}">Explore country profile &rarr;</a>
        </div>
      </article>
    </li>`;
  };

  const groups = config.subregions.map((r) => ({
    ...r,
    items: list.filter((c) => c.subregion === r.id).sort((a, b) => a.name.localeCompare(b.name, "en"))
  })).filter((g) => g.items.length);

  const groupRows = groups.map((g) => `
    <section class="country-group" id="group-${esc(g.id)}">
      <div class="cg-head">
        <h2>${esc(g.label)}</h2>
        <span class="cg-count">${g.items.length} countries</span>
      </div>
      <ul class="country-grid">
        ${g.items.map(countryCard).join("")}
      </ul>
    </section>
  `).join("");

  const jump = groups.map((g) => `<a href="#group-${esc(g.id)}">${esc(g.label)} (${g.items.length})</a>`).join("");

  // tabella
  const rows = [...list].sort((a, b) => a.name.localeCompare(b.name, "en")).map((c) => {
    const cards = cardsOf(c.iso3);
    const cardLink = cards.length ? ` <a class="cardlink" href="../places/${esc(cards[0].slug)}/index.html">${cards.length === 1 ? "1 place card" : `${cards.length} place cards`}</a>` : "";
    return `<tr id="c-${c.iso3}" data-iso="${c.iso3}" tabindex="0" data-sub="${c.subregion}" data-name="${esc((c.name + " " + c.capital).toLowerCase())}"><th scope="row" data-v="${esc(c.name)}"><a class="tbl-country-link" href="${cSlug[c.iso3]}/index.html">${esc(c.name)}</a>${cardLink}</th><td data-v="${esc(c.capital)}">${esc(c.capital)}</td><td data-v="${esc(subLabel[c.subregion])}">${esc(subLabel[c.subregion])}</td><td class="num" data-v="${c.area}">${fmtInt(c.area)}</td><td class="num" data-v="${c.population}">${fmtInt(c.population)}</td><td class="num" data-v="${den(c).toFixed(3)}">${den(c) < 10 ? den(c).toFixed(1) : fmtInt(den(c))}</td><td data-v="${esc(blocShorts(c.iso3).join(" "))}" class="blocs-cell">${esc(blocShorts(c.iso3).join(" · ") || "none of these")}</td></tr>`;
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
${compactHero({ scene: "acacia", kicker: "The Living Atlas", title: "54 African countries", sub: "Explore each sovereign nation through its capital, heritage places, cultural communities, history and facts." })}
<div class="wrap">
<section class="hero-lede">
  <p class="lede">Africa is made of 54 sovereign nations. Every country on this site has its own dedicated profile connecting its capital city, places of art and nature, living peoples, stories, and verified geographic figures. Follow the threads through a single country or compare the continent as a whole.</p>
</section>

<section class="kpis" aria-label="Africa in four numbers">${kpis}</section>

</div>
<div class="wrap section" data-tabs>
<section id="profiles" class="panel" data-tab data-tab-label="Country profiles (54)" aria-labelledby="cprof-h">
  <div class="phead">
    <div>
      <h2 id="cprof-h">All 54 Country Profiles</h2>
      <p class="fine" style="margin-top:4px">Select any country to open its dedicated guide with capital city, heritage places, cultural peoples, history and facts.</p>
    </div>
    <div class="tools" id="ptools" hidden>
      <label class="sr" for="pq">Search country or capital</label>
      <input id="pq" type="search" placeholder="Search country or capital" autocomplete="off">
    </div>
  </div>
  <nav class="pi-jump country-jump" aria-label="Subregions">${jump}</nav>
  ${groupRows}
</section>
<section id="map" class="panel" data-tab data-tab-label="Interactive map" aria-labelledby="cmap-h">
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
<section id="charts" class="charts" data-tab data-tab-label="Comparative charts">
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
<section id="table" class="panel" data-tab data-tab-label="Data table" aria-labelledby="tab-h">
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

  return layout({ title: `54 Countries · Living Atlas · ${config.name}`, description: "The 54 African countries: dedicated country profiles, capitals, places, peoples, stories, interactive maps and comparative figures.", depth: 1, current: "countries", bodyClass: "still", script: true, extraScripts: ["share.js"], body, jump: [{ id: "profiles", label: "Profiles" }, { id: "map", label: "Map" }, { id: "charts", label: "Charts" }, { id: "table", label: "Table" }, { id: "share", label: "Add yours" }] });
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
  const spokenList = spokenSorted.map(([n, v], i) => `<li class="lang-item"><button type="button" class="lang-choice" data-language-choice="${esc(n)}" aria-expanded="false"><span><strong>${esc(n)}</strong><small>${v.length} ${v.length === 1 ? "country" : "countries"} named</small></span><span class="lang-arrow" aria-hidden="true">+</span></button><div class="lang-detail" hidden><p>${v.length === 1 ? "Named in the Factbook for" : "Named in the Factbook for"}:</p><ul>${v.map((x) => `<li>${esc(x.c.name)}${x.official ? " <span class=\"lang-official\">official</span>" : ""}</li>`).join("")}</ul></div></li>`).join("");
  const spokenMulti = spokenSorted.filter(([, v]) => v.length > 1).length;

  // 4. due paesi a confronto
  const cmpData = Object.fromEntries(rows.map((r) => [r.c.iso3, { name: r.c.name, capital: r.c.capital, sub: subLabel[r.c.subregion], population: fmtInt(r.c.population), area: fmtInt(r.c.area), density: den(r.c) < 10 ? den(r.c).toFixed(1) : fmtInt(den(r.c)), government: r.govText || "Not given", languages: r.langText || "Not given", religions: r.relText || "Not given" }]));
  const opts = [...list].sort((a, b) => a.name.localeCompare(b.name, "en")).map((c) => `<option value="${c.iso3}">${esc(c.name)}</option>`).join("");
  const subOpts = config.subregions.map((r) => `<option value="${r.id}">${esc(r.label)}</option>`).join("");

  // Gioco: dati incorporati per i due giochi (nessun dato esce dal browser)
  const clueLangs = (r) => { const n = r.langs.filter((l) => l.national).map((l) => l.name); return n.length ? n.join(", ") : "none marked official at national level"; };
  const gameData = {
    hl: withRel.map((r) => ({ n: r.c.name, sub: subLabel[r.c.subregion], christian: Math.round(r.rel.christian), muslim: Math.round(r.rel.muslim) })),
    gc: rows.map((r) => ({ n: r.c.name, sub: r.c.subregion, clues: [`Subregion: ${subLabel[r.c.subregion]}`, `Population: about ${fmtPop(r.c.population)}`, `Government: ${r.gov.toLowerCase()}`, `Languages marked official: ${clueLangs(r)}`, ...(r.rel ? [`Largest religion group: ${SHORT[biggest(r)]}, about ${pct0(r.rel[biggest(r)])}`] : [])] }))
  };
  const estS = (prompt, mn, mx, ans, parts, unit = "") => renderRich({ type: "estimate", prompt, min: mn, max: mx, step: 1, unit, answer: ans, decimals: 0, parts }, cite, { up: "../" });
  const CIA = ["cia-factbook"];
  const estRel = estS("In how many of the 54 countries do you think Muslims are the largest religious group?", 0, 54, lead.muslim, [{ text: `${lead.muslim} of the ${withRel.length} countries with shares, counted here from the Factbook's labels.`, cite: CIA }]);
  const estGov = estS("How many of the 54 countries do you think are presidential republics?", 0, 54, govCount[0].items.length, [{ text: `${govCount[0].items.length}, counted here from the Factbook's government labels.`, cite: CIA }]);
  const estLang = estS("In how many countries is French marked as an official language?", 0, 54, (langN["French"] || []).length, [{ text: `${(langN["French"] || []).length}, counted here from the Factbook's labels.`, cite: CIA }]);
  const body = `
${compactHero({ scene: "acacia", kicker: "Reference", title: "Society", sub: "Faith, government and language labels in the 54 countries, with a view of two countries side by side." })}
<div class="wrap">
<section class="hero-lede">
  <p class="lede">Every label here comes from the World Factbook's entry for each country${cite(["cia-factbook"])}. The language section keeps three things apart: languages marked official at national level, African language names mentioned in the entry, and Glottolog families for the fourteen quiz languages. None of these is a census of speakers. Nothing on this page comes from local voices, and the Factbook's estimates come from different years.</p>
</section>
</div>
<div class="wrap section" data-tabs>
<section id="play" class="panel" data-tab data-tab-label="Play" aria-labelledby="play-h">
  <h2 id="play-h">Play with the data</h2>
  <p class="lede">Two quick games built from the same Factbook labels as the rest of this page. Your score stays in your browser and disappears when you leave.</p>
  <noscript><p class="fine">The games need JavaScript. The data they use is in the other tabs.</p></noscript>
  <div class="game" id="game-hl" hidden aria-labelledby="hl-h"><span class="layer-tag rec">Higher or lower</span><h3 id="hl-h">Which has the larger share?</h3><div id="hl-q"></div><p class="game-score" id="hl-score" role="status" aria-live="polite"></p></div>
  <div class="game" id="game-gc" hidden aria-labelledby="gc-h"><span class="layer-tag rec">Guess the country</span><h3 id="gc-h">Which country is it?</h3><div id="gc-q"></div><p class="game-score" id="gc-score" role="status" aria-live="polite"></p></div>
  <p class="fine">Shares and labels are the Factbook's, with estimate years that differ by country; a few countries have no religion shares and are left out of the first game.</p>
</section>
<section id="religion" class="panel" data-tab data-tab-label="Religion" aria-labelledby="rel-h">
  <div class="phead"><h2 id="rel-h">Religion</h2>
    <div class="tools" id="cmp-tools" hidden><label class="sr" for="cmp-sub">Show subregion</label><select id="cmp-sub"><option value="all">All subregions</option>${subOpts}</select></div></div>
  ${estRel}
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
  ${estGov}
  <p class="cmp-find">${govCount[0].items.length} of ${list.length} countries are presidential republics.</p>
  ${govBars}
  <p class="fine">The Factbook gives one phrase per country; here they are sorted into six groups. "Federal" is dropped from the label. The entries can lag events: where the Factbook says a country is in transition or was formerly one type, it is placed in the last group. Hover a country for the Factbook's exact words.</p>
  <div class="fold" data-fold="2" data-fold-what="groups" data-fold-item=".gov-row"><div class="cmp-grid">${govChips}</div></div>
  <h3>By subregion</h3>
  <div class="tablewrap">${govTab}</div>
</section>
<section id="languages" class="panel" data-tab data-tab-label="Languages" aria-labelledby="lang-h">
  <h2 id="lang-h">Languages marked official</h2>
  ${estLang}
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
  <div class="lang-explorer" id="lang-explorer"><div><strong>Explore the languages</strong><span id="lang-progress">0 explored</span></div><p>Choose a language to reveal where the Factbook mentions it. This is a way to explore the list, not a count of speakers.</p></div>
  <section class="lang-game" id="language-game" aria-labelledby="language-game-title"><div class="lang-game-head"><div><span class="layer-tag rec">Language game</span><h3 id="language-game-title">Where is this language mentioned?</h3></div><span id="lang-score" class="lang-score">0 / 5</span></div><p id="lang-question" class="lang-question">Loading a round…</p><div id="lang-options" class="lang-options" role="group" aria-labelledby="language-game-title"></div><p id="lang-feedback" class="lang-feedback" aria-live="polite"></p><button id="lang-next" class="btn lang-next" type="button" hidden>Next round</button><script type="application/json" id="lang-game-data">${JSON.stringify(spokenSorted.filter(([, v]) => v.length > 1).map(([name, entries]) => ({ name, countries: entries.map((x) => x.c.name), source: { title: sources.get("cia-factbook").title, publisher: sources.get("cia-factbook").publisher, url: sources.get("cia-factbook").url } }))).replace(/</g, "\\u003c")}</script></section>
  <ul class="lang-list fold" data-fold="10" data-fold-what="languages" data-fold-item=".lang-item">${spokenList}</ul>
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
<script type="application/json" id="cmpdata">${JSON.stringify(cmpData).replace(/</g, "\\u003c")}</script>
<script type="application/json" id="gamedata">${JSON.stringify(gameData).replace(/</g, "\\u003c")}</script>`;
  return layout({ title: `Society: faith, government, language · ${config.name}`, description: "Religion, government and language labels of the 54 African countries, with two countries side by side.", depth: 1, current: "society", bodyClass: "still", script: true, extraScripts: ["story.js", "society.js", "share.js", "languages.js"], body, jump: [{ id: "play", label: "Play" }, { id: "religion", label: "Religion" }, { id: "government", label: "Government" }, { id: "languages", label: "Languages" }, { id: "pair", label: "Side by side" }] });
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
  const body = `${compactHero({ scene: "acacia", kicker: "Tool", title: "True size", sub: "Lay other countries over Africa and see how big it really is." })}
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
  const payload = { questions: all.map((x) => ({ id: x.id, t: x.topic, q: x.q, o: x.options, a: x.answer, e: x.explain, c: x.cite, s: x.story ? `../stories/${x.story}/index.html` : x.place ? `../places/${x.place}/index.html` : x.people ? `../peoples/${x.people}/index.html` : x.capital ? `../capitals/${x.capital}/index.html` : "" })), sources: srcOut, rounds: 8 };
  const leadTopic = topics[0];
  const subTopics = topics.slice(1);
  const body = `${compactHero({ scene: "giraffes", kicker: "Learn", title: "Quiz", sub: "Questions drawn from the stories and figures on this site. Each answer comes with its source." })}
<div class="wrap section">
<section class="panel quiz" id="quiz" aria-labelledby="quiz-h">
  <h2 id="quiz-h">Test what you know</h2>
  <p class="quiz-intro">A free round that mixes the whole site: questions from the stories, plus others built from the country, language and regional-bloc data. Each story also ends with its own questions, which you can try after reading. Every answer comes with its source, and the "Read the story" link after a question takes you to the full account. Nothing you answer is saved or sent anywhere: the site sets no cookies and keeps no score once you leave the page.</p>
  <noscript><p class="fine">The quiz needs JavaScript. The facts it uses are in the <a href="../stories/index.html">stories</a> and on the <a href="../countries/index.html">Countries</a> page.</p></noscript>
  <div id="quiz-start" hidden>
    <div class="quiz-featured">
      <button type="button" class="quiz-topic quiz-topic-lead" data-topic="${leadTopic.id}">
        <div class="qt-lead-info">
          <span class="rag-badge">Featured · All Topics</span>
          <span class="qt-name">${esc(leadTopic.label)}</span>
          <span class="qt-blurb">${esc(leadTopic.blurb)}</span>
        </div>
        <span class="qt-n qt-lead-n">${counts[leadTopic.id]} questions</span>
      </button>
    </div>
    <h3 class="qt-subhead">Or select a specific topic</h3>
    <ul class="quiz-topics">${subTopics.map((t) => `<li><button type="button" class="quiz-topic" data-topic="${t.id}"><span class="qt-name">${esc(t.label)}</span><span class="qt-blurb">${esc(t.blurb)}</span><span class="qt-n">${counts[t.id]} questions</span></button></li>`).join("")}</ul>
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
  const body = `${compactHero({ scene: "huts", kicker: "Learn", title: "Languages", sub: "Fourteen African languages: where they come from, where they are mentioned, and which you can learn on Duolingo." })}
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
  const cap = capitals.find(({ data: cp }) => cp.country === c.iso3 && (cp.status === "published" || includeDrafts))?.data || null;
  const myPeoples = peoples.filter(({ data: pe }) => (pe.countries || []).includes(c.iso3) && (pe.status === "published" || includeDrafts)).map(({ data: pe }) => pe);
  const peopleImg = (x) => {
    if (x.image) return x.image;
    for (const sec of x.sections || []) for (const b of sec.blocks || []) if (b.type === "figure" && b.image) return b.image;
    return null;
  };
  const capSpotlight = cap ? `
<section id="capital" class="cp-sec cp-capital-spotlight" aria-labelledby="cap-spot-h">
  <div class="sec-head"><span class="layer-tag rec">Capital city</span></div>
  <h2 id="cap-spot-h">${esc(c.capital)} · Capital of ${esc(c.name)}</h2>
  <div class="capital-spot-card">
    ${cap.image ? `<div class="csc-img"><img src="../../img/capitals/${esc(cap.image.file)}-800.jpg" alt="${esc(cap.image.alt || c.capital)}" width="360" height="240" loading="lazy"></div>` : ""}
    <div class="csc-content">
      <p class="csc-sub">${esc(cap.subtitle)}</p>
      ${(cap.keyPoints || []).slice(0, 2).map((kp) => `<p class="csc-kp">${esc(kp.text)}</p>`).join("")}
      <a class="csc-btn" href="../../capitals/${esc(cap.slug)}/index.html">Open ${esc(c.capital)} city profile &rarr;</a>
    </div>
  </div>
</section>` : "";
  const peoplesSec = myPeoples.length ? `
<section id="peoples" class="cp-sec cp-peoples" aria-labelledby="cpp-h">
  <div class="sec-head"><span class="layer-tag rec">Cultural heritage</span></div>
  <h2 id="cpp-h">Peoples connected to ${esc(c.name)}</h2>
  <p class="note-small">Living communities and ethnic cultures with deep historical roots in ${esc(c.name)}. The site describes them through language, traditions and documented sources, strictly avoiding colonial terms like 'tribes'.</p>
  <ul class="country-peoples-list">
    ${myPeoples.map((pe) => {
      const im = peopleImg(pe);
      return `<li><a class="cpl-card" href="../../peoples/${esc(pe.slug)}/index.html">
        ${im ? `<img src="../../img/stories/${esc(im.file)}-800.jpg" alt="" width="96" height="72" loading="lazy">` : `<span class="cap-ph" aria-hidden="true">${esc(pe.name.charAt(0))}</span>`}
        <div class="cpl-text"><strong>${esc(pe.name)}</strong><em>${esc(pe.subtitle)}</em></div>
      </a></li>`;
    }).join("")}
  </ul>
</section>` : "";
  const regionCountries = list.filter((x) => x.subregion === c.subregion).sort((a, b) => a.name.localeCompare(b.name, "en"));
  const myIdx = regionCountries.findIndex((x) => x.iso3 === c.iso3);
  const prevC = myIdx > 0 ? regionCountries[myIdx - 1] : regionCountries[regionCountries.length - 1];
  const nextC = myIdx < regionCountries.length - 1 ? regionCountries[myIdx + 1] : regionCountries[0];
  const journeyNav = `
<nav class="country-journey" aria-label="Travel through ${esc(sub)}">
  <div class="cj-inner">
    <div class="cj-title">
      <span class="cj-sub">Regional pathway</span>
      <strong>Explore ${esc(sub)}</strong>
      <span class="cj-meta">${regionCountries.length} countries in this region</span>
    </div>
    <div class="cj-links">
      <a class="cj-btn cj-prev" href="../${esc(cSlug[prevC.iso3])}/index.html" rel="prev">
        <span class="cj-dir">&larr; Previous country</span>
        <span class="cj-dest">${esc(prevC.name)}</span>
      </a>
      <a class="cj-btn cj-hub" href="../index.html#country-${esc(c.iso3)}">
        <span class="cj-dir">All 54</span>
        <span class="cj-dest">Countries Atlas</span>
      </a>
      <a class="cj-btn cj-next" href="../${esc(cSlug[nextC.iso3])}/index.html" rel="next">
        <span class="cj-dir">Next country &rarr;</span>
        <span class="cj-dest">${esc(nextC.name)}</span>
      </a>
    </div>
  </div>
</nav>`;
  const lede = `${esc(c.name)} is in ${esc(sub)}. Its capital is ${esc(c.capital)}${cite(["wb-countries"])}. About ${esc(fmtPop(c.population))} people live there${cite(["wb-population"])}, on ${esc(fmtInt(c.area))} km²${cite(["wb-area"])}: ${rPop === 1 ? "the most populous" : `number ${rPop} by population`} and number ${rArea} by area of the ${list.length} countries on this site. The sentences and figures on this page are calculated from those sources; the writing about places and people is on the cards and stories below.`;
  const body = `${compactHero({ scene: "acacia", kicker: sub, title: c.name, sub: `Capital ${c.capital} · ${fmtPop(c.population)} people` })}
<div class="wrap section">
<section class="kpis" aria-label="${esc(c.name)} in four numbers">${kp.map(([k, v]) => `<div class="kpi"><span class="kl">${esc(k)}</span><span class="kv">${esc(v)}</span></div>`).join("")}</section>
<section class="panel cp" id="facts" aria-labelledby="cp-h" style="margin-top:24px">
  <h2 id="cp-h">${esc(c.name)} at a glance</h2>
  <div class="cp-grid">
    <div><p class="ts-intro">${lede}</p><dl class="facts">${facts}</dl></div>
    <div class="cp-map">${countryLocator(c.iso3, `Map of Africa with ${c.name} highlighted.`)}</div>
  </div>
</section>
${capSpotlight}
${cards.length ? `<section id="places" class="cp-sec" aria-labelledby="cpl-h"><h2 id="cpl-h">Places in ${esc(c.name)}</h2><ul class="arches cp-cards">${cards.map(card).join("")}</ul></section>` : ""}
${peoplesSec}
${myStories.length ? `<section id="stories" class="cp-sec" aria-labelledby="cps-h"><h2 id="cps-h">Stories that touch ${esc(c.name)}</h2><ul class="scards">${myStories.map((x) => storyCard(x, "../../")).join("")}</ul></section>` : ""}
${journeyNav}
<section id="more" class="cp-sec" aria-labelledby="cpm-h"><h2 id="cpm-h">Keep exploring</h2>
  <ul class="duo-list">
    ${cap ? `<li><a href="../../capitals/${esc(cap.slug)}/index.html">${esc(c.capital)}</a>, capital city of ${esc(c.name)}: its history and places.</li>` : ""}
    <li><a href="../../explore/index.html#c:${esc(c.iso3)}">Trace ${esc(c.name)} in Connections</a>: follow all editorial links to places, peoples and stories.</li>
    <li><a href="../index.html#country-${esc(c.iso3)}">Compare ${esc(c.name)} with all 54 countries</a> in the Living Atlas.</li>
    <li><a href="../../society/index.html">Society</a>: faith, government and languages side by side.</li>
    <li><a href="../../quiz/index.html">The quiz</a>, with questions on countries, history and food.</li>
  </ul>
</section>
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
  const countryJump = [
    { id: "facts", label: "At a glance" },
    ...(cap ? [{ id: "capital", label: "Capital" }] : []),
    ...(cards.length ? [{ id: "places", label: "Places" }] : []),
    ...(myPeoples.length ? [{ id: "peoples", label: "Peoples" }] : []),
    ...(myStories.length ? [{ id: "stories", label: "Stories" }] : []),
    { id: "voices", label: "Add yours" }
  ];
  return layout({ title: `${c.name} · ${config.name}`, description: `${c.name}: capital, population, area, languages, religion, regional blocs, places and stories.`, depth: 2, current: "countries", bodyClass: "still", script: false, extraScripts: ["share.js"], body, jump: countryJump });
}
if (data.countries) for (const c of data.countries.countries) write(`countries/${cSlug[c.iso3]}/index.html`, renderCountryPage(c, data.countries.countries));

const contactLine = config.contact ? ` Write to ${esc(config.contact)}.` : "";
const methodJump = [
  { id: "method-rag", label: "Ask Method" },
  { id: "sec-purpose", label: "Purpose & Fit" },
  { id: "sec-the-record", label: "The Record" },
  { id: "sec-local-voices", label: "Local Voices" },
  { id: "sec-when-a-note-disagrees-with-the-record", label: "Disputes" },
  { id: "sec-what-this-site-collects", label: "Privacy" },
  { id: "sec-sustainability-and-social-mission", label: "Fair Knowledge" },
  { id: "sec-who-makes-this", label: "Governance" }
];
write("method/index.html", layout({
  title: `Method · ${config.name}`,
  description: "What the site is for, how to use it, how the record is sourced and how local notes are collected.",
  depth: 1,
  current: "method",
  extraScripts: ["story.js", "method-qa.js"],
  jump: methodJump,
  body: (() => {
    if (!methodPage) {
      const mm = methodHtml.match(/^\s*<h1>(.*?)<\/h1>\s*<p class="lede">(.*?)<\/p>/s);
      const rest = mm ? methodHtml.slice(mm[0].length) : methodHtml;
      return `${compactHero({ scene: "palms", kicker: "How it works", title: mm ? mm[1] : "Method", sub: mm ? mm[2] : "" })}
<div class="wrap prose-hero"><div class="prose">${rest.replace("<!--contact-->", contactLine)}</div></div>`;
    }
    // Numeri contati dal contenuto del sito ogni volta che si costruisce la pagina.
    const reg = sourcesList;
    const nVer = reg.filter((x) => x.status === "verified").length;
    const tiers = ["institutional", "academic", "primary", "press", "encyclopedia"];
    const tierRows = tiers.map((t) => {
      const all = reg.filter((x) => x.tier === t); const ok = all.filter((x) => x.status === "verified").length;
      const pct = all.length ? Math.round(ok / all.length * 1000) / 10 : 0;
      return { label: (config.tiers[t] || t), values: { ok: pct, todo: Math.round((100 - pct) * 10) / 10 }, text: `${pct}% of ${all.length}` };
    });
    const tokens = { stories: stories.length, places: published.length, countries: data.countries ? data.countries.countries.length : 54, quiz: data.quiz ? data.quiz.questions.length : 0, sources: reg.length, verified: nVer, toverify: reg.length - nVer };
    const fill = (v) => {
      if (typeof v === "string") { if (v === "{{tierRows}}") return tierRows; const r = v.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in tokens ? tokens[k].toLocaleString("en-US") : _)); return r; }
      if (Array.isArray(v)) return v.map(fill);
      if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, ["min", "max", "answer", "step", "decimals"].includes(k) && typeof x === "string" && /^\{\{\w+\}\}$/.test(x) ? Number(String(x).replace(/\{\{(\w+)\}\}/g, (_, kk) => tokens[kk])) : fill(x)]));
      return v;
    };
    const pg = fill(methodPage);
    const nocite = () => "";
    const secs = pg.sections.map((sec, i) => `<section id="sec-${esc(sec.id)}"><h2>${esc(sec.title)}</h2>${sec.blocks.map((b) => renderRich(b, nocite, { up: "../", contactLine })).join("")}</section>`).join("\n");
    
    const principlesList = (pg.keyPoints || []).map((x, i) => {
      const parts = x.text.split(":");
      const title = parts[0].trim();
      const desc = parts.slice(1).join(":").trim();
      const num = String(i + 1).padStart(2, "0");
      return `<li class="exec-item">
        <span class="exec-num" aria-hidden="true">${num}</span>
        <div class="exec-content">
          <h3 class="exec-title">${esc(title)}</h3>
          <p class="exec-desc">${esc(desc)}</p>
        </div>
      </li>`;
    }).join("");
    const kp = pg.keyPoints ? `<section class="method-exec-panel" aria-labelledby="kp-h">
      <div class="exec-header">
        <span class="rag-badge">Executive Summary</span>
        <h2 id="kp-h">Five Foundational Epistemic Commitments</h2>
        <p class="fine">Core architecture governing data integrity, source criticism, and community consent across the platform.</p>
      </div>
      <ol class="exec-list">${principlesList}</ol>
    </section>` : "";

    const ragWidget = `<section class="method-rag" id="method-rag" aria-labelledby="rag-title">
  <div class="method-rag-card">
    <div class="rag-badge"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> <span>Interactive Epistemic Navigator · Local RAG</span></div>
    <h2 id="rag-title" class="rag-heading">Is Africa on the Ground for you? Ask the methodology</h2>
    <p class="rag-sub">Query our research protocol, privacy framework, educational pilot, or verification rules. Runs 100% locally in your browser with zero network calls and zero tracking.</p>
    <div class="rag-form" role="search">
      <div class="rag-input-wrap">
        <svg class="rag-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input type="search" id="rag-input" class="rag-input" placeholder="Type a question (e.g. 'Can I use this for my university syllabus?', 'How are local notes paid?')..." aria-label="Ask a question about the methodology">
        <button type="button" id="rag-clear" class="rag-clear" aria-label="Clear question" hidden>&times;</button>
      </div>
      <div class="rag-chips" aria-label="Common questions">
        <span class="rag-chips-label">Quick queries:</span>
        <button type="button" class="rag-chip" data-q="Is AOTG suitable for my university syllabus?">🎓 For university courses</button>
        <button type="button" class="rag-chip" data-q="How does Fair Knowledge pay local contributors?">⚖️ Fair Knowledge compensation</button>
        <button type="button" class="rag-chip" data-q="Do you track students or collect cookies?">🔒 Privacy &amp; zero tracking</button>
        <button type="button" class="rag-chip" data-q="How is this different from Wikipedia or a textbook?">📚 Sourcing vs Wikipedia</button>
        <button type="button" class="rag-chip" data-q="What happens when a local voice contradicts history?">🌍 When voices disagree</button>
        <button type="button" class="rag-chip" data-q="Can I use this as a travel guide?">✈️ Is it a travel guide?</button>
        <button type="button" class="rag-chip" data-q="How can our institution join the 60-day pilot?">🚀 60-Day university pilot</button>
      </div>
    </div>
    <div id="rag-result" class="rag-result" hidden aria-live="polite"></div>
  </div>
</section>`;
    return `${compactHero({ scene: "palms", kicker: "How it works", title: pg.title, sub: pg.lede })}
<div class="wrap"><nav class="pi-jump lang-jump" aria-label="On this page"><a href="#method-rag">Ask Method</a><a href="#sec-purpose">Purpose &amp; Fit</a><a href="#sec-the-record">The Record</a><a href="#sec-local-voices">Voices</a><a href="#sec-what-this-site-collects">Privacy</a><a href="#sec-sustainability-and-social-mission">Fair Knowledge</a><a href="#sec-who-makes-this">Governance</a></nav></div>
<div class="wrap prose-hero"><div class="read-progress" aria-hidden="true"><span></span></div>${kp}${ragWidget}<article class="story method">${secs}</article></div>`;
  })()
}));

// ---------- pagina Education: strumenti didattici, pilota e impatto benefit ----------
function renderEducation() {
  const jump = [
    { id: "universities", label: "For Universities" },
    { id: "pilot", label: "60-Day Pilot" },
    { id: "fair-knowledge", label: "Fair Knowledge" },
    { id: "inquiries", label: "Inquiries" }
  ];

  const body = `${compactHero({
    scene: "palms",
    kicker: "Higher Education & Impact",
    title: "Education & Social Mission",
    sub: "Interactive tools for universities and schools, grounded in verifiable sources, strict privacy and ethical local knowledge."
  })}
<div class="wrap"><nav class="pi-jump lang-jump" aria-label="On this page"><a href="#universities">For Universities</a><a href="#pilot">60-Day Pilot</a><a href="#fair-knowledge">Fair Knowledge</a><a href="#inquiries">Inquiries</a></nav></div>
<div class="wrap section">

<section class="panel" id="universities" aria-labelledby="uni-h">
  <h2 id="uni-h">De-centering African studies in the classroom</h2>
  <p class="ts-intro">Traditional textbooks often present the African continent through single narratives, generalized abstractions, or outdated colonial frameworks. Africa on the Ground provides higher education educators with an interactive digital companion that connects documented historiography with authentic lived perspectives.</p>
  <ol class="exec-list" style="margin-top:24px;">
    <li class="exec-item">
      <span class="exec-num" aria-hidden="true">01</span>
      <div class="exec-content">
        <h3 class="exec-title">The Dual-Layer Rigor</h3>
        <p class="exec-desc">Every claim on the platform is tied to verified academic, primary, or institutional sources with explicit historiographical gaps. Subjective lived experiences of local communities are preserved and presented separately as personal testimony, never confused with fact.</p>
      </div>
    </li>
    <li class="exec-item">
      <span class="exec-num" aria-hidden="true">02</span>
      <div class="exec-content">
        <h3 class="exec-title">Active, Hands-on Learning</h3>
        <p class="exec-desc">Students engage through sorting data, testing their assumptions in quizzes, exploring spatial and trade connections, and investigating rock art and living material heritage across all 54 African nations.</p>
      </div>
    </li>
    <li class="exec-item">
      <span class="exec-num" aria-hidden="true">03</span>
      <div class="exec-content">
        <h3 class="exec-title">Absolute Student Privacy</h3>
        <p class="exec-desc">Zero tracking, zero cookies, and no student personal data collected or stored. Fully compliant with GDPR and international educational privacy standards.</p>
      </div>
    </li>
  </ol>
</section>

<section class="panel" id="pilot" aria-labelledby="pilot-h" style="margin-top:28px">
  <h2 id="pilot-h">The 60-Day Complimentary University Pilot</h2>
  <p class="ts-intro">For the upcoming academic semester, we are partnering with selected university departments, courses, and educational institutions for an all-inclusive 60-day trial.</p>
  <div class="tablewrap" style="margin-top:20px;">
    <table class="xtab">
      <thead>
        <tr>
          <th scope="col">Curriculum Track</th>
          <th scope="col">Focus &amp; Topics</th>
          <th scope="col">Pedagogical Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Track 1: Beyond the Map</strong></td>
          <td>True size, geography, urbanization, demographic data, and language families across 54 countries.</td>
          <td>Dismantles pervasive geographic and cartographic misconceptions (Mercator distortions, village-only stereotypes).</td>
        </tr>
        <tr>
          <td><strong>Track 2: Pre-colonial Polities &amp; Trade</strong></td>
          <td>Archaeological and documentary records of Aksum, Kush, Kilwa, Mali Empire, Great Zimbabwe, and Swahili coastlines.</td>
          <td>Teaches rigorous source criticism and distinguishes primary archaeological records from later colonial interpretations.</td>
        </tr>
        <tr>
          <td><strong>Track 3: Heritage &amp; Living Art</strong></td>
          <td>Rock art, archaeological artifacts, living practices, and contemporary scenes linked to place cards.</td>
          <td>Engages students with questions of cultural preservation, restitution, material culture, and contemporary African art.</td>
        </tr>
      </tbody>
    </table>
  </div>
  <p class="fine">The pilot includes complete access for professors, teaching assistants, and up to 150 students per cohort, accompanied by seminar discussion prompts and formative assessment quizzes.</p>
</section>

<section class="panel" id="fair-knowledge" aria-labelledby="fk-h" style="margin-top:28px">
  <h2 id="fk-h">Our Benefit Model: The Fair Knowledge Principle</h2>
  <p class="ts-intro">Africa on the Ground operates as a Benefit Social Enterprise. We reject advertising, data monetization, and the historical pattern of extracting uncompensated knowledge from African communities.</p>
  <ol class="exec-list" style="margin-top:24px;">
    <li class="exec-item">
      <span class="exec-num" aria-hidden="true">01</span>
      <div class="exec-content">
        <h3 class="exec-title">Fair Local Compensation</h3>
        <p class="exec-desc">A dedicated portion of all institutional subscription revenue is directed into a compensation fund that remunerates local African researchers, writers, and community fact-checkers who contribute or verify place notes.</p>
      </div>
    </li>
    <li class="exec-item">
      <span class="exec-num" aria-hidden="true">02</span>
      <div class="exec-content">
        <h3 class="exec-title">The 1-for-1 Educational Pledge</h3>
        <p class="exec-desc">Every commercial university partnership in the Global North directly funds free access, offline learning packages, and low-bandwidth kits for educational institutions, libraries, and schools across African countries.</p>
      </div>
    </li>
    <li class="exec-item">
      <span class="exec-num" aria-hidden="true">03</span>
      <div class="exec-content">
        <h3 class="exec-title">Independent &amp; Ethical Governance</h3>
        <p class="exec-desc">Content integrity and source verification are overseen under strict public methodology, preventing commercial or political capture of educational content.</p>
      </div>
    </li>
  </ol>
</section>

<section class="panel" id="inquiries" aria-labelledby="inq-h" style="margin-top:28px">
  <h2 id="inq-h">Institutional Inquiries &amp; Pilot Applications</h2>
  <p class="ts-intro">If you are a university professor, lecturer, department chair, or representative of a cultural/educational organization, we invite you to evaluate Africa on the Ground for your curriculum.</p>
  <p>To request a 60-day pilot onboarding session or explore an institutional partnership, get in touch with our editorial team:${contactLine ? contactLine : " write to our project contact directly."}</p>
  <p class="fine">We review pilot applications on a rolling basis prior to each academic semester.</p>
</section>

</div>`;

  return layout({
    title: `Education & Social Mission · ${config.name}`,
    description: "Interactive educational tools for universities and schools, grounded in verifiable sources, strict privacy, and ethical Fair Knowledge compensation.",
    depth: 1,
    current: "education",
    bodyClass: "still",
    body,
    jump
  });
}
write("education/index.html", renderEducation());

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
    <label class="pi-search"><span class="sr">Search places and countries</span><svg class="pi-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input type="search" id="pi-q" placeholder="Search a place or a country" autocomplete="off"></label>
    ${usedT.length > 1 ? `<div class="filters" role="group" aria-label="Filter by type" data-group="type">${chip("type", "all", "All types", true)}${usedT.map((t) => chip("type", t.id, `${typeIcon(t.id)}${esc(t.label)}`, false)).join("")}</div>` : ""}
    ${hasDraft ? `<div class="filters" role="group" aria-label="Filter by state" data-group="status">${chip("status", "all", "All cards", true)}${chip("status", "documented", "Documented", false)}${chip("status", "draft", "In preparation", false)}</div>` : ""}
  </div>`;
  const body = `${compactHero({ kicker: "Places", title: "All places", sub: "One page per place, grouped by region. Each card keeps the documented record and the local voice apart." })}
<div class="wrap places-index">
  <p class="places-subnav"><a class="btn btn-alt" href="art/index.html">Explore art in the places</a></p>
  <p class="pi-count" id="pi-count" aria-live="polite">${published.length} ${published.length === 1 ? "card" : "cards"} in ${groups.length} ${groups.length === 1 ? "region" : "regions"}${includeDrafts ? " (drafts included)" : ""}.</p>
  ${tools}
  <nav class="pi-jump" id="pi-jump" aria-label="Regions">${jumpBar}</nav>
  <p class="pi-empty" id="pi-empty" role="status" hidden>No place matches these filters. <button type="button" class="linkbtn" id="pi-reset">Clear the filters</button></p>
  ${groups.map((g) => `<section class="pgroup" id="r-${esc(g.id)}"><h2>${esc(g.label)}</h2><ul class="prows">${g.items.map(row).join("")}</ul></section>`).join("")}
</div>`;
  return layout({ title: `Places · ${config.name}`, description: "Every place card, grouped by region.", depth: 1, current: "places", body, extraScripts: ["places.js"], jump: groups.map((g) => ({ id: "r-" + g.id, label: g.label })) });
}

function renderArt() {
  const categories = (artCatalog && artCatalog.categories) || [];
  const artMeta = (artCatalog && artCatalog.meta) || {};
  const bySlug = new Map(published.map((p) => [p.slug, p]));
  const groups = categories.map((g) => ({ ...g, items: g.places.map((slug) => bySlug.get(slug)).filter(Boolean) })).filter((g) => g.items.length);
  const outline = (p) => { const ids = [...citedIds(p)].map((id) => sources.get(id)).filter(Boolean); return ids.length && !ids.some((x) => !/UNESCO/i.test(x.publisher || "") && x.tier !== "encyclopedia"); };
  const row = (p) => {
    const n = (notes[p.slug] || []).length;
    const m = artMeta[p.slug] || {};
    const image = p.image
      ? `<img src="../../img/places/${esc(p.image.file)}-800.jpg" alt="${esc(p.image.alt || p.name)}" width="800" height="533" loading="lazy">`
      : art(p.slug, 3, 2).replace('class="art"', 'class="art art-card-art"');
    const state = p.status === "draft" ? '<span class="draft">In preparation</span>' : outline(p) ? '<span class="tag-outline">Outline</span>' : "";
    return `<li class="art-card-item" data-type="${esc(p.type)}" data-status="${p.status === "draft" ? "draft" : "documented"}" data-category="${esc(m.category || "unknown")}" data-country="${esc(p.country || "unknown")}" data-period="${esc(m.period || "unknown")}" data-q="${esc((p.name + " " + p.region + " " + (cName[p.country] || "") + " " + (m.period || "") + " " + (m.materials || "") + " " + (m.function || "")).toLowerCase())}"><a class="art-card" href="../${esc(p.slug)}/index.html"><span class="art-card-image">${image}${state}</span><span class="art-card-body"><span class="art-card-kicker">${esc(m.period || "Art place")} · ${esc(p.region)}</span><span class="art-card-name">${esc(p.name)}</span><span class="art-card-description">${esc(m.materials || m.function || types[p.type].label)}</span><span class="art-card-meta">${typeIcon(p.type)}${esc(types[p.type].label)} · ${citedIds(p).size} ${citedIds(p).size === 1 ? "source" : "sources"}${n ? ` · ${n} local ${n === 1 ? "note" : "notes"}` : ""}</span></span></a></li>`;
  };
  const jumpBar = groups.map((g) => `<a href="#r-${esc(g.id)}" data-region="${esc(g.id)}">${esc(g.label)} <span class="n">${g.items.length}</span></a>`).join("");
  const allArtItems = groups.flatMap((g) => g.items);
  const totalCards = allArtItems.length;
  const tools = `<div class="pi-tools" id="pi-tools" hidden>
    <label class="pi-search"><span class="sr">Search art and places</span><svg class="pi-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input type="search" id="pi-q" placeholder="Search by name, country (e.g. Namibia) or period..." autocomplete="off"></label>
  </div>`;
  const countText = `${totalCards} ${totalCards === 1 ? "card" : "cards"} in ${groups.length} ${groups.length === 1 ? "category" : "categories"}${includeDrafts ? " (drafts included)" : ""}.`;
  const path = artCatalog.path;
  const pathSection = path ? `<section class="band-saffron art-path" aria-labelledby="art-path-h"><div class="wrap"><p class="kicker">A guided thread</p><h2 id="art-path-h">${esc(path.title)}</h2><p class="lede">${esc(path.intro)}</p>${renderRich({ type: "order", prompt: path.prompt, items: path.items.map((it) => ({ ...it, label: bySlug.get(it.slug)?.name || it.slug, href: `../${it.slug}/index.html` })) }, () => "", { up: "../../" })}</div></section>` : "";
  const body = `${compactHero({ scene: "kopje", kicker: "Places · Art", title: artCatalog.title, sub: artCatalog.lede })}
<div class="wrap places-index art-index">
  <p class="places-subnav"><a class="btn btn-alt" href="../index.html">← All places</a></p>
  <p class="art-note">This is a growing index, not a gallery. Open a place card to see its sources, image credit and the local voice the project is still waiting for.</p>
  <p class="pi-count" id="pi-count" aria-live="polite">${countText}</p>
  ${tools}
  <nav class="pi-jump" id="pi-jump" aria-label="Art categories">${jumpBar}</nav>
  <p class="pi-empty" id="pi-empty" role="status" hidden>No art place matches these filters. <button type="button" class="linkbtn" id="pi-reset">Clear the search</button></p>
  ${groups.map((g) => `<section class="pgroup art-group" id="r-${esc(g.id)}"><div class="art-group-head"><h2>${esc(g.label)}</h2><p class="art-intro">${esc(g.intro)}</p></div><ul class="prows">${g.items.map(row).join("")}</ul></section>`).join("")}
</div>
${pathSection}`;
  return layout({ title: `Art · Places · ${config.name}`, description: artCatalog.lede, depth: 2, current: "art", bodyClass: "art-page", body, extraScripts: ["places.js", "story.js"], jump: groups.map((g) => ({ id: "r-" + g.id, label: g.label })) });
}

// ---------- pagina Capitals: il dato della capitale e lo stato della scheda urbana ----------
// Profilo di una capitale: stessa famiglia di blocchi delle storie, più i luoghi da vedere collegati.
function renderCapital(c) {
  const { cite, list: sourcesList } = makeCiter();
  const country = cName[c.country] || c.country;
  const typeLabel = Object.fromEntries((config.placeTypes || []).map((t) => [t.id, t.label]));
  const block = (b) => {
    if (b.type === "facts") return `<dl class="facts">${c.facts.map((f) => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}${cite(f.cite)}</dd></div>`).join("")}</dl>`;
    return renderRich(b, cite, { up: "../../" });
  };
  const keyHtml = c.keyPoints ? `<aside class="keypoints" aria-labelledby="kp-h"><h2 id="kp-h">In short</h2><ul>${c.keyPoints.map((x) => `<li>${esc(x.text)}${x.cite ? cite(x.cite) : ""}</li>`).join("")}</ul></aside>` : "";
  const secs = (c.sections || []).map((sec, i) => `<section id="sec-${esc(sec.id)}">${i === 0 ? '<div class="sec-head"><span class="layer-tag rec">In the record</span></div>' : ""}<h2>${esc(sec.title)}</h2>${sec.blocks.map(block).join("")}</section>`).join("\n");
  const seeing = (c.places || []).map((slug) => published.find((x) => x.slug === slug)).filter(Boolean);
  const seeHtml = seeing.length ? `<section id="sec-places" class="cap-places"><h2>Places to see in ${esc(c.name)}</h2><ul class="cap-list">${seeing.map((x) => `<li><a href="../../places/${esc(x.slug)}/index.html">${x.image ? `<img src="../../img/places/${esc(x.image.file)}-800.jpg" alt="" width="96" height="72" loading="lazy">` : `<span class="cap-ph" aria-hidden="true">${esc(x.name.charAt(0))}</span>`}<span><strong>${esc(x.name)}</strong><small>${esc(typeLabel[x.type] || x.type)}</small><em>${esc(x.subtitle)}</em></span></a></li>`).join("")}</ul></section>` : "";
  const gaps = `<section id="sec-gaps" class="gaps"><span class="layer-tag gap">What we do not know</span><ul>${(c.gaps || []).map((g) => `<li>${esc(g)}</li>`).join("")}</ul></section>`;
  const nList = (notes[`capital-${c.slug}`] || []).slice().sort((a, b) => b.added.localeCompare(a.added));
  const voices = `<section class="story-voices" id="voices" aria-labelledby="voices-h"><span class="layer-tag voi">From people who know ${esc(c.name)}</span><h2 id="voices-h">What readers add</h2>
${nList.length ? `<div class="notes">${nList.map((n) => noteCard(n, config.noteKinds || [])).join("")}</div>` : `<div class="empty"><strong>No local voice on this city yet.</strong><span>Notes are added once the author has agreed to publication, and are read by people from the place afterwards.</span></div>`}
${shareSection({ type: "capital", id: c.slug, name: c.name, kinds: config.noteKinds || [], heading: `Do you know ${c.name}?`, intro: "Tell us what a visitor should know, or what looks wrong here.", depth: 2 })}
</section>`;
  const capStories = stories.filter((x) => (x.countries || []).includes(c.country)).slice(0, 4).map((x) => `<a href="../../stories/${esc(x.slug)}/index.html">${esc(x.title)}</a>`).join(" · ");
  const cSlugC = cSlug[c.country] ? `<li>Country page: <a href="../../countries/${esc(cSlug[c.country])}/index.html">${esc(country)}</a></li>` : "";
  const heroImg = c.image
    ? `<figure class="cap-hero-fig"><img src="../../img/capitals/${esc(c.image.file)}-1600.jpg" srcset="../../img/capitals/${esc(c.image.file)}-800.jpg 800w, ../../img/capitals/${esc(c.image.file)}-1600.jpg 1600w" sizes="(max-width: 900px) 100vw, 900px" alt="${esc(c.image.alt || c.name)}" loading="lazy"><figcaption class="photo-note">${esc(c.image.caption)} Photo: ${esc(c.image.credit)}, <a href="${esc(c.image.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(c.image.license)}</a>, via <a href="${esc(c.image.source)}" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a>.</figcaption></figure>`
    : "";
  const body = `${compactHero({ scene: "city", kicker: `Capital · ${country}`, title: c.name, sub: c.subtitle })}
<div class="wrap prose-hero"><div class="read-progress" aria-hidden="true"><span></span></div>${keyHtml}${heroImg}<article class="story">${secs}
${seeHtml}
${pageChecks("capital", c.slug, cite)}
${gaps}
${voices}
${deeperHtml(c.deeper)}
<aside class="related" aria-label="Related"><h2>Keep exploring</h2><ul>${cSlugC}${capStories ? `<li>Stories: ${capStories}</li>` : ""}<li><a href="../index.html">All capitals</a></li></ul></aside>
${sourcesList()}</article></div>`;
  return layout({ title: `${c.name} · ${country} · ${config.name}`, description: c.subtitle, depth: 2, current: "capitals", body, extraScripts: ["story.js", "recipe.js", "share.js"], jump: [...(c.sections || []).map((x) => ({ id: "sec-" + x.id, label: x.title })).slice(0, 4), ...(seeing.length ? [{ id: "sec-places", label: "To see" }] : []), { id: "voices", label: "Add yours" }, { id: "sec-sources", label: "Sources" }] });
}


// ---------- Peoples: un indice guidato dai dati del Factbook e le schede dei popoli ----------
// Parole: il sito non usa "tribù" come categoria (vedi la storia "Does Africa really have tribes?"). I numeri vengono dal Factbook, per paese e con il suo anno; non sono un censimento dei popoli.
const ETHNIC_ALIASES = [
  ["Fula", /^(fulani|fula|peul|peuhl|fulbe|pulaar|fulfulde|fulani? \(.*\))$/i],
  ["Mandinka / Maninka", /^(mandinka|mandinke|malinke|maninka|mandingo|manding|mandinka?\/.*|malinke\/.*)$/i],
  ["Amazigh (Berber)", /^(amazigh|berber|arab-amazigh|berber\/.*|amazigh \(.*\))$/i],
  ["Somali", /^somali$/i], ["Hausa", /^hausa$/i], ["Yoruba", /^yoruba$/i], ["Oromo", /^oromo$/i], ["Tuareg", /^(tuareg|tamasheq|touareg)$/i],
  ["Kanuri", /^(kanuri|kanuri\/beriberi|beriberi)$/i], ["Ewe", /^(ewe|éwé)$/i], ["Akan", /^akan$/i], ["Arab", /^arab$/i],
  ["Tutsi", /^tutsi$/i], ["Hutu", /^hutu$/i], ["Bantu groups", /^bantu$/i], ["Wolof", /^wolof$/i], ["Sereer", /^(sereer|serer)$/i], ["Soninke", /^(soninke|sarakole)$/i],
];
function parseEthnic(txt) {
  const s = String(txt || "").replace(/\([^()]*\best\.?\)/gi, " ").replace(/\s+/g, " ");
  const out = [];
  const re = /(?:^|,|;)\s*([A-Za-zÀ-ÿ'’\-\/\. ]+?(?:\s\([^()%]*\))?)\s+(\d+(?:\.\d+)?)%/g;
  let m;
  while ((m = re.exec(s))) {
    const name = m[1].trim().replace(/^(and|of which)\s+/i, "");
    if (!name || /of which|includes|mainland|zanzibar|\d/i.test(name)) continue;
    out.push({ name, pct: parseFloat(m[2]) });
  }
  return out;
}
const aliasOf = (name) => { for (const [g, re] of ETHNIC_ALIASES) if (re.test(name.trim())) return g; return null; };

function renderPeoples() {
  const { cite, list: sourcesList } = makeCiter();
  const prof = JSON.parse(fs.readFileSync(path.join(root, "content", "data", "africa-profiles.json"), "utf8")).countries;
  const rows = (data.countries ? data.countries.countries : []).map((c) => {
    const txt = (prof[c.iso3] || {}).ethnicGroups || "";
    const groups = parseEthnic(txt);
    const named = groups.filter((g) => !/^(other|others|unspecified|african|non-african|mixed.*)$/i.test(g.name));
    named.sort((a, b) => b.pct - a.pct);
    return { c, txt, groups, top: named[0] && named[0].pct >= 5 ? named[0] : null, named };
  });
  const parsed = rows.filter((r) => r.top);
  const unparsed = rows.filter((r) => !r.top);
  const topRows = parsed.slice().sort((a, b) => b.top.pct - a.top.pct);
  const majority = parsed.filter((r) => r.top.pct >= 50).length;
  const under25 = parsed.filter((r) => r.top.pct < 25).length;
  const shared = new Map();
  for (const r of rows) for (const g of r.groups) { const a = aliasOf(g.name); if (a) { if (!shared.has(a)) shared.set(a, []); shared.get(a).push({ c: r.c, pct: g.pct }); } }
  const sharedList = [...shared.entries()].filter(([, v]) => v.length >= 3).sort((a, b) => b[1].length - a[1].length);
  const eth = rows.find((r) => r.c.iso3 === "ETH");
  const ethTop = eth && eth.top;
  const tzaTxt = (rows.find((r) => r.c.iso3 === "TZA") || {}).txt || "";
  const blocks1 = [
    { type: "p", parts: [{ text: "Africa is described in news and in travel brochures through the word 'tribes'. The word came with colonial administrators, and historians now prefer 'peoples' or 'ethnic groups'. The story \"Does Africa really have tribes?\" explains why, with sources, and the page below shows what the numbers say.", editorial: true }] },
    { type: "callout", title: "Even the reference books use the word", parts: [{ text: tzaTxt ? `The World Factbook, an official reference used across this site, still describes Tanzania like this: "${tzaTxt}"` : "", cite: ["cia-factbook"] }, { text: " The wording is the Factbook's own, kept as it is. It shows how much of the old vocabulary survives, and why every figure below is a label from one source, not a count of 'peoples'.", editorial: true }].filter((x) => x.text) },
  ];
  const sections = [];
  const bandDefs = [{ min: 90, label: "Nine in ten or more" }, { min: 70, label: "70 to 90%" }, { min: 50, label: "50 to 70%" }, { min: 25, label: "25 to 50%" }, { min: 0, label: "Under 25%" }];
  const bandsHtml = `<figure class="bands"><figcaption><strong>How big is the largest named group?</strong> <span class="note-small">Each country sits in the band of its largest group's share${cite(["cia-factbook"])}. ${parsed.length} countries where the Factbook gives percentages.</span></figcaption>${bandDefs.map((d, bi) => { const hi = bi ? bandDefs[bi - 1].min : 101; const items = topRows.filter((r) => r.top.pct >= d.min && r.top.pct < hi); return `<div class="band"><div class="band-h"><span>${d.label}</span><b>${items.length}</b></div><ul>${items.map((r) => `<li><span title="${esc(r.top.name)} ${r.top.pct}%" tabindex="0">${esc(r.c.name)}<small>${esc(r.top.name.replace(/\s*\(.*$/, ""))} ${r.top.pct}%</small></span></li>`).join("")}</ul></div>`; }).join("")}</figure>`;
  const bigBars = topRows.map((r) => ({ label: r.c.name, value: r.top.pct, text: `${r.top.name} ${r.top.pct}%` }));
  sections.push({ id: "numbers", title: "What the largest group looks like, country by country", blocks: [
    ...(ethTop ? [{ type: "estimate", prompt: `In Ethiopia, what share of the population does the largest named group, the ${ethTop.name}, make up?`, min: 0, max: 100, step: 1, unit: "%", answer: ethTop.pct, decimals: 1, parts: [{ text: `The Factbook gives ${ethTop.name} ${ethTop.pct}% (its estimate year is in the table below). Ethiopia's next groups are smaller still, so no group is a majority.`, cite: ["cia-factbook"] }] }] : []),
    { type: "rawhtml", html: bandsHtml },
    { type: "check", q: "Myth or fact: in most African countries, one group makes up more than half of the population.", options: ["Myth", "Fact"], answer: majority > parsed.length / 2 ? "Fact" : "Myth", explain: `Among the ${parsed.length} countries where the Factbook gives shares, the largest named group is above 50% in ${majority} and below 25% in ${under25}. The counts are made here from the Factbook's text and depend on how each country's entry is written.`, cite: ["cia-factbook"] },
  ] });
  sections.push({ id: "table", title: "All the countries, side by side", blocks: [{ type: "table", filter: true, title: "Ethnic groups as the Factbook lists them", sub: "Largest named group first; the full entry in the last column", columns: [{ key: "c", label: "Country" }, { key: "g", label: "Largest named group" }, { key: "p", label: "Share" }, { key: "t", label: "The Factbook's text" }], rows: rows.map((r) => ({ c: r.c.name, g: r.top ? r.top.name : "No percentages", p: r.top ? `${r.top.pct}%` : "", t: r.txt || "Not given" })), cite: ["cia-factbook"], note: "Texts are the Factbook's own, unedited; each carries its own estimate year when the Factbook gives one." }] });
  if (sharedList.length) {
    sections.push({ id: "borders", title: "One name, many countries", blocks: [
      { type: "p", parts: [{ text: `Borders drawn in the colonial period did not follow where peoples lived, and the Factbook names the same group in several states. In its entries, ${sharedList.slice(0, 3).map(([g, v]) => `${g} appears in ${v.length}`).join(", ")} countries.`, cite: ["cia-factbook"] }, { text: " (For how the borders were made, see the story on the Berlin Conference.)", editorial: true }] },
      { type: "table", filter: false, title: "Groups named in three or more countries", sub: "Name variants merged by hand: Fula includes Fulani, Peul and Pulaar; Mandinka includes Maninka and Malinke; Amazigh includes Berber", columns: [{ key: "g", label: "Group" }, { key: "n", label: "Countries" }, { key: "l", label: "Where the Factbook names it" }], rows: sharedList.map(([g, v]) => ({ g, n: String(v.length), l: v.map((x) => `${x.c.name} ${x.pct}%`).join(" · ") })), cite: ["cia-factbook"], note: "Only groups whose name matches a list written for this page are counted, so the table misses others that the Factbook spells differently. The list says where a group is named, not how many people live where." },
    ] });
  }
  const profList = peoples.filter(({ data: x }) => (x.sections || []).length && (x.status === "published" || includeDrafts));
  const peopleImg = (x) => { for (const sec of x.sections || []) for (const b of sec.blocks) if (b.type === "figure" && b.image) return b.image; return null; };
  const profHtml = profList.length ? `<section id="sec-profiles" class="peoples-grid-sec"><h2>Meet the peoples</h2><p class="note-small">Each page keeps the documented record apart from what readers add. Drafts are shown only in the preview.</p><ul class="pgrid">${profList.map(({ data: x }) => { const im = peopleImg(x); return `<li><a href="${esc(x.slug)}/index.html">${im ? `<img src="../img/stories/${esc(im.file)}-800.jpg" width="${esc(im.width || 800)}" height="${esc(im.height || 533)}" alt="" loading="lazy">` : `<span class="pg-ph" aria-hidden="true">${esc(x.name.charAt(0))}</span>`}<span class="pg-t"><strong>${esc(x.name)}</strong><small>${esc((x.countries || []).slice(0, 4).map((i) => cName[i] || i).join(", ") + ((x.countries || []).length > 4 ? ` and ${(x.countries || []).length - 4} more` : ""))}</small><em>${esc(((x.keyPoints || [])[1] || (x.keyPoints || [])[0] || { text: x.subtitle }).text.replace(/\s*\(.*?\)/g, "").split(/(?<=\.)\s/)[0].replace(/^(.{1,130})(\s.*)?$/s, (m, h, r) => (r && m.length > 130 ? h.replace(/[,;:\s]+\S*$/, "") + "…" : m)))}</em></span></a></li>`; }).join("")}</ul></section>` : "";
  const pgItems = profList.flatMap(({ data: x }) => (x.keyPoints || []).filter((k) => k.text.length >= 40 && k.text.length <= 260).map((k) => ({ t: k.text, s: x.slug, n: x.name })));
  const pgameHtml = new Set(pgItems.map((i) => i.s)).size >= 4 ? `<section id="sec-game" class="sgame" aria-labelledby="sg-h"><span class="layer-tag rec">Game</span><h2 id="sg-h">Which people is this about?</h2><p class="note-small">A fact from the sources, four peoples to choose from. Each answer links to the page that explains it. Nothing is saved.</p><noscript><p class="note-small">This game needs JavaScript.</p></noscript><div id="sgame" hidden></div><script type="application/json" id="sgame-data">${JSON.stringify({ items: pgItems, base: "", dir: "", rounds: 5, noun: "page" }).replace(/</g, "\\u003c")}</script></section>` : "";
  const secsHtml = sections.map((sec, i) => `<section id="sec-${esc(sec.id)}">${i === 0 ? '<div class="sec-head"><span class="layer-tag rec">In the record</span></div>' : ""}${["table", "borders"].includes(sec.id) ? `<details class="fold"><summary><span>${esc(sec.title)}</span></summary>${sec.blocks.map((b) => renderRich(b, cite, { up: "../" })).join("")}</details>` : `<h2>${esc(sec.title)}</h2>${sec.blocks.map((b) => renderRich(b, cite, { up: "../" })).join("")}`}</section>`).join("\n");
  const gaps = `<section id="sec-gaps" class="gaps"><span class="layer-tag gap">What we do not know</span><ul><li>These shares come from one reference work, with different years and spellings per country, and a country that counts by language or by region is not comparable to one that counts by group.</li><li>Many people belong to more than one group, or to none that a form can name; a table of labels cannot show that.</li><li>No person from the groups named here has read this page yet.</li></ul></section>`;
  const body = `${compactHero({ scene: "huts", kicker: "Peoples", title: "Peoples, not 'tribes'", sub: "Who the sources name, country by country, and how little the old labels explain." })}
<div class="wrap prose-hero"><div class="read-progress" aria-hidden="true"><span></span></div><article class="story">
<aside class="keypoints"><h2>In short</h2><ul><li>The word 'tribe' belongs to the colonial period; this site writes about peoples, languages and the labels a source uses. <a href="../stories/does-africa-have-tribes/index.html">Read why</a>.</li><li>In ${parsed.length} countries with percentages, the largest named group is above 50% in ${majority} and below 25% in ${under25}${cite(["cia-factbook"])}.</li></ul></aside>
${blocks1.map((b) => renderRich(b, cite, { up: "../" })).join("")}
${profHtml}
${pgameHtml}
${secsHtml}
${gaps}
<aside class="related" aria-label="Related"><h2>Keep exploring</h2><ul><li><a href="../stories/does-africa-have-tribes/index.html">Does Africa really have 'tribes'?</a></li><li><a href="../stories/did-one-conference-carve-up-africa/index.html">Did one conference carve up Africa?</a></li><li><a href="../languages/index.html">Languages</a></li><li><a href="../society/index.html">Society</a></li></ul></aside>
${sourcesList()}</article></div>`;
  return layout({ title: `Peoples · ${config.name}`, description: "Ethnic groups by country as the sources name them, why the word 'tribe' is avoided, and profiles of peoples with their sources.", depth: 1, current: "peoples", body, extraScripts: ["story.js", "storygame.js", "share.js"], jump: [{ id: "sec-profiles", label: "Peoples" }, { id: "sec-game", label: "Game" }, { id: "sec-numbers", label: "Numbers" }, { id: "sec-table", label: "Table" }, ...(sharedList.length ? [{ id: "sec-borders", label: "Borders" }] : []), ...(profList.length ? [{ id: "sec-profiles", label: "Profiles" }] : []), { id: "sec-sources", label: "Sources" }] });
}

// ---------- pagina Migration: dati in content/data/migration.json (ogni fatto citato; i dibattiti restano separati) ----------
function renderMigration(M) {
  const { cite, list: sourcesList } = makeCiter();
  const order = ["who-moves", "why-they-leave", "routes", "jobs", "europe", "history"];
  const secs = order.map((id) => M.sections.find((x) => x.id === id)).filter(Boolean);
  const chartOf = (sec, id) => (sec.charts || []).find((c) => c.id === id);
  const v = (sec, cid, label) => { const c = chartOf(sec, cid); const r = c && c.rows.find((x) => x.label.startsWith(label)); return r ? { value: r.value, cite: c.cite } : null; };
  const S = Object.fromEntries(secs.map((x) => [x.id, x]));
  const inAfrica = S["who-moves"] && v(S["who-moves"], "african-migrant-destinations", "Within Africa");
  const inEurope = S["who-moves"] && v(S["who-moves"], "african-migrant-destinations", "Europe");
  const eri = S["why-they-leave"] && v(S["why-they-leave"], "eu-recognition-rate-2025", "Eritrea");
  const permits = S.europe && v(S.europe, "regular_vs_irregular", "First residence permits");
  const irregular = S.europe && v(S.europe, "regular_vs_irregular", "Irregular border crossings");
  const agri = S.jobs && v(S.jobs, "italy_foreign_share_value_added_by_sector", "Agriculture");

  const mythFactQuestions = [
    {
      q: "1. Myth or fact: Most people born in Africa who emigrate live in Europe.",
      options: ["Myth", "Fact"],
      answer: "Myth",
      explain: `About ${inAfrica ? inAfrica.value : "25.1"} million African international migrants live in another African country (~82%), while ${inEurope ? inEurope.value : "10.6"} million live in geographic Europe. Movement within Africa is the dominant norm.`,
      cite: inAfrica ? inAfrica.cite : ["cap-swp-berlin-org-9204f2"]
    },
    {
      q: "2. Myth or fact: Most foreign citizens who enter the EU each year arrive irregularly across a sea or land border.",
      options: ["Myth", "Fact"],
      answer: "Myth",
      explain: `In 2025 the EU issued about ${permits ? (Math.round(permits.value / 100000) / 10) : "3.9"} million regular first residence permits (for work, study, and family), while Frontex recorded ~${irregular ? Math.round(irregular.value / 1000) : "180"},000 irregular border crossing detections across all borders. Regular channels dwarf irregular arrivals by more than 20 to 1.`,
      cite: permits ? permits.cite : ["cap-ec-europa-eu-bd3ef8"]
    },
    {
      q: "3. Myth or fact: Empirical economic studies show foreign workers displace native workers and reduce average native wages.",
      options: ["Myth", "Fact"],
      answer: "Myth",
      explain: "Economists across Italy, Germany, Denmark and the US (Card, Peri, Foged, D'Amuri) find foreign workers predominantly fill structural shortages in complementary manual or service roles, enabling native workers to specialize in communication and supervision with zero or slightly positive overall wage effects.",
      cite: ["cap-nber-org-727e87", "cap-docs-iza-org-33bca6"]
    },
    {
      q: "4. Myth or fact: In Italian agriculture, foreign workers produce more than one-fifth of the sector's total value added.",
      options: ["Myth", "Fact"],
      answer: "Fact",
      explain: `According to Fondazione Leone Moressa on ISTAT data, foreign-born workers generate about ${agri ? agri.value : "21.3"}% of total agricultural value added in Italy, the highest share of any economic sector in the country.`,
      cite: agri ? agri.cite : ["cap-fondazioneleonemoressa-org-22a5d4"]
    }
  ];

  const factList = (fs) => `<ul class="mig-facts">${fs.map((f) => `<li>${esc(f.text)}${cite(f.cite)}${f.page ? ` <span class="note-small">(${/–/.test(f.page) ? "pp." : "p."} ${esc(f.page)})</span>` : ""}</li>`).join("")}</ul>`;

  const renderSec = (sec, isFirstInCluster) => {
    const plain = sec.facts.filter((f) => !f.debate), deb = sec.facts.filter((f) => f.debate);
    const shown = plain.slice(0, 8), more = plain.slice(8);
    const charts = (sec.charts || []).map((c) => renderRich({ type: "chart", kind: "bars", title: c.title, sub: c.sub, rows: c.rows, cite: c.cite, note: "" }, cite, { up: "../" })).join("");

    const extra = [];
    if (sec.id === "who-moves") {
      extra.push({ type: "estimate", prompt: "What share of all African migrants living outside their birth country live in another African country (rather than in Europe or elsewhere)?", min: 0, max: 100, step: 1, unit: "%", answer: 82, parts: [{ text: "About 82% (~25.1 million people) live in another African country, while about 10.6 million live in geographic Europe, according to UN DESA data.", cite: inAfrica ? inAfrica.cite : ["cap-swp-berlin-org-9204f2"] }] });
    } else if (sec.id === "why-they-leave") {
      if (eri) extra.push({ type: "estimate", prompt: "In 2025, what share of first-instance asylum decisions for Eritreans in the EU granted international protection?", min: 0, max: 100, step: 1, unit: "%", answer: eri.value, parts: [{ text: `EU asylum offices granted protection in ${eri.value}% of first-instance decisions for Eritreans in 2025. People flee indefinite military conscription and political persecution.`, cite: eri.cite }] });
    } else if (sec.id === "routes") {
      extra.push({ type: "rawhtml", html: `<div class="mig-comparator"><h4 class="mig-comparator-title">Reality Check: Regular Permits vs Irregular Crossings</h4><p class="mig-comparator-sub">Media coverage focuses almost exclusively on boat crossings, but official statistics reveal the true scale of regular vs irregular movements:</p><div class="mig-compare-bars"><div class="mig-compare-item"><div class="mig-compare-label"><span>First residence permits issued by EU (regular)</span><span>3,900,000 (~95.6%)</span></div><div class="mig-compare-track"><div class="mig-compare-fill permits"></div></div></div><div class="mig-compare-item"><div class="mig-compare-label"><span>Frontex irregular border crossing detections</span><span>~180,000 (~4.4%)</span></div><div class="mig-compare-track"><div class="mig-compare-fill crossings"></div></div></div></div></div>` });
    } else if (sec.id === "jobs") {
      if (agri) extra.push({ type: "estimate", prompt: "What share of total value added in Italian agriculture was produced by foreign workers in 2025?", min: 0, max: 60, step: 0.5, unit: "%", answer: agri.value, decimals: 1, parts: [{ text: `About ${agri.value}%, the highest of any economic sector, according to Fondazione Leone Moressa on ISTAT data. Italian food production relies structurally on migrant labour.`, cite: agri.cite }] });
    } else if (sec.id === "europe") {
      extra.push({ type: "rawhtml", html: `<div class="mig-comparator"><h4 class="mig-comparator-title">Remittances vs Official Development Assistance (ODA)</h4><p class="mig-comparator-sub">Money sent home by African diaspora workers dwarfs total European foreign aid to the entire continent:</p><div class="mig-compare-bars"><div class="mig-compare-item"><div class="mig-compare-label"><span>Remittances sent by African migrants to Africa</span><span>$54 Billion / year</span></div><div class="mig-compare-track"><div class="mig-compare-fill remittances"></div></div></div><div class="mig-compare-item"><div class="mig-compare-label"><span>Total EU bilateral development aid (ODA)</span><span>~$15 Billion / year</span></div><div class="mig-compare-track"><div class="mig-compare-fill aid"></div></div></div></div></div>` });
    } else if (sec.id === "history") {
      extra.push({ type: "estimate", prompt: "In what year did European intellectuals and diplomats form the first official 'Eurafrica' doctrine, planning large-scale European settlement into Africa?", min: 1900, max: 1960, step: 1, unit: "", answer: 1929, parts: [{ text: "In 1929, with Richard Coudenhove-Kalergi and French and German colonial advocates, European powers envisioned Africa as an empty space to absorb millions of European emigrants.", cite: ["hansen-jonsson-2014-eurafrica"] }] });
    }

    return `<section id="sec-${esc(sec.id)}" class="mig-sec">${isFirstInCluster ? '<div class="sec-head"><span class="layer-tag rec">In the record</span></div>' : ""}<h3>${esc(sec.title)}</h3><p class="mig-intro">${esc(sec.intro)}</p>${charts}${factList(shown)}${more.length ? `<details class="fold"><summary><span>${more.length} more facts</span></summary>${factList(more)}</details>` : ""}${deb.length ? `<aside class="callout mig-debate"><p class="callout-t">Where research disagrees</p><ul class="mig-facts">${deb.map((f) => `<li>${esc(f.text)}${cite(f.cite)}</li>`).join("")}</ul></aside>` : ""}${extra.length ? `<div class="checks">${extra.map((b) => renderRich(b, cite, { up: "../" })).join("")}</div>` : ""}</section>`;
  };

  const clusters = [
    {
      id: "cluster-movements",
      label: "1. Who moves & Why",
      kicker: "Flows & Root Causes",
      title: "Who moves, where to, and why people leave",
      desc: "Where African migrants actually live (most stay in Africa), what people flee, and why international movement is an exception.",
      secIds: ["who-moves", "why-they-leave"],
      stat: "82%",
      statLabel: "Internal African Flows",
      statSub: "of African migrants living abroad reside in another African country (~25.1M vs 10.6M in Europe).",
      next: { id: "cluster-routes", label: "2. Routes & Policies →" }
    },
    {
      id: "cluster-routes",
      label: "2. Routes & Policies",
      kicker: "Crossings & Enforcement",
      title: "Crossings, human cost and European agreements",
      desc: "The Sahara and sea crossings, deaths along the way, Frontex detections vs millions of regular EU residence permits, and deals with transit regimes.",
      secIds: ["routes", "europe"],
      stat: "3.9M vs 180k",
      statLabel: "Permits vs Irregular Crossings",
      statSub: "regular EU residence permits issued annually vs irregular crossings detected across all borders.",
      next: { id: "cluster-jobs", label: "3. Jobs & Economics →" }
    },
    {
      id: "cluster-jobs",
      label: "3. Jobs & Economics",
      kicker: "Labour & Wages",
      title: "Testing the claim: 'They take our jobs'",
      desc: "What decades of empirical labour economics show: complementary work, essential sectors, and wage effects across the workforce.",
      secIds: ["jobs"],
      stat: "21.3%",
      statLabel: "Agricultural Value Added",
      statSub: "produced by foreign-born workers in Italy; systemic labour complementarity in essential sectors.",
      next: { id: "cluster-history", label: "4. Historical Perspective →" }
    },
    {
      id: "cluster-history",
      label: "4. Historical Perspective",
      kicker: "Reverse Migration",
      title: "When migration went the other way",
      desc: "From the Eurafrica doctrine of the 1920s to demographic imperialism: European projects that cast Africa as land for Europe's emigrants.",
      secIds: ["history"],
      stat: "1929",
      statLabel: "Eurafrica Doctrine",
      statSub: "European demographic projects aimed to direct millions of European settlers to Africa.",
      next: { id: "cluster-movements", label: "Back to 1. Who moves & Why →" }
    }
  ];

  const overviewHtml = `<div class="mig-overview-grid" aria-label="Executive summary of key findings">
    ${clusters.map((cl) => `
      <div class="mig-overview-card">
        <div class="moc-top">
          <p class="moc-label">${esc(cl.statLabel)}</p>
          <p class="moc-num">${esc(cl.stat)}</p>
          <p class="moc-sub">${esc(cl.statSub)}</p>
        </div>
        <a href="#${esc(cl.id)}" class="moc-link">Explore ${esc(cl.label)} →</a>
      </div>
    `).join("")}
  </div>`;

  const challengeHtml = `<section class="checks mig-challenge" aria-labelledby="mc-h">
    <div class="mig-challenge-head">
      <span class="layer-tag rec">Interactive Challenge</span>
      <h2 id="mc-h">Myth or Fact? Test your assumptions first</h2>
      <p class="lede">Before examining the 143 documented facts below, guess whether these four pervasive claims hold up against official census records, Eurostat data, and empirical research. Commit to an answer to see the sourced reality.</p>
    </div>
    ${mythFactQuestions.map((q) => checkHtmlWith(q, cite)).join("")}
    <p class="check-score" role="status" aria-live="polite" hidden></p>
  </section>`;

  const interactiveBarHtml = `<div class="mig-interactive-bar" aria-label="Interactive fact search and filter">
    <div class="mig-search-input-wrap">
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><line x1="12.5" y1="12.5" x2="17.5" y2="17.5"/></svg>
      <input type="search" id="mig-search" placeholder="Search 143 facts by keyword, country, or source (e.g. Italy, Frontex, wages, Libya, asylum, remittances)..." aria-label="Filter all 143 migration facts by keyword">
    </div>
    <div class="mig-chips" role="group" aria-label="Filter facts by cluster topic">
      <button type="button" class="mig-chip is-active" data-tag="all" aria-pressed="true">All facts (143)</button>
      <button type="button" class="mig-chip" data-tag="who-moves" data-cluster="cluster-movements" aria-pressed="false">Destinations</button>
      <button type="button" class="mig-chip" data-tag="why-they-leave" data-cluster="cluster-movements" aria-pressed="false">Asylum &amp; War</button>
      <button type="button" class="mig-chip" data-tag="routes" data-cluster="cluster-routes" aria-pressed="false">Sea &amp; Sahara Routes</button>
      <button type="button" class="mig-chip" data-tag="europe" data-cluster="cluster-routes" aria-pressed="false">EU Deals &amp; Permits</button>
      <button type="button" class="mig-chip" data-tag="jobs" data-cluster="cluster-jobs" aria-pressed="false">Jobs &amp; Wages</button>
      <button type="button" class="mig-chip" data-tag="debates" aria-pressed="false">Contested Debates</button>
    </div>
    <p class="mig-filter-count" id="mig-filter-count" role="status" aria-live="polite">Showing all 143 documented facts</p>
  </div>`;

  const clusterPanels = clusters.map((cl) => {
    const secList = cl.secIds.map((id) => S[id]).filter(Boolean);
    const secsInCluster = secList.map((sec, idx) => renderSec(sec, idx === 0)).join("\n");
    return `<div id="${esc(cl.id)}" data-tab data-tab-label="${esc(cl.label)}" class="mig-cluster-panel">
      <div class="mig-cluster-header">
        <p class="mig-cluster-kicker">${esc(cl.kicker)}</p>
        <h2 class="mig-cluster-title">${esc(cl.title)}</h2>
        <p class="mig-cluster-desc">${esc(cl.desc)}</p>
      </div>
      ${secsInCluster}
      <div class="mig-cluster-foot">
        <p>Finished this cluster?</p>
        <a href="#${esc(cl.next.id)}" class="btn btn-s">${esc(cl.next.label)}</a>
      </div>
    </div>`;
  }).join("\n");

  const gaps = `<section id="sec-gaps" class="gaps"><span class="layer-tag gap">What we do not know</span><ul><li>Several UN agency sites (IOM, UNHCR) block automated reading, so some of their figures are quoted as reported by Frontex, Eurostat, the UN news service or the press. Each citation says where the number was read.</li><li>Deaths on the routes are counted from known cases: IOM calls its own figures a lower bound, and other counts are higher.</li><li>No readable official source gives the number of people born in Africa who live in the EU as a whole.</li>${(M.gaps || []).slice(0, 8).map((g) => `<li>${esc(g)}</li>`).join("")}<li>Voices: none yet. This page was written from published sources; people who made these journeys are not quoted here unless a source quotes them.</li></ul></section>`;
  const body = `${compactHero({ scene: "sea", kicker: "Society", title: "Migration, without the myths", sub: "Who moves and where, what people flee, how they cross, and what research says about jobs." })}
<div class="wrap prose-hero"><div class="read-progress" aria-hidden="true"><span></span></div><article class="story">
<aside class="callout mig-claim"><p class="callout-t">The claim this page tests</p><p>"They come to take our jobs." It is often said about migrants from Africa. The clusters below explore who actually moves, why, how, and what the research on jobs and wages finds, including the studies that find costs for some workers. Every number has a source, and where researchers disagree the page says so.</p></aside>
${overviewHtml}
${challengeHtml}
${interactiveBarHtml}
<div data-tabs>
${clusterPanels}
</div>
${gaps}
<aside class="related" aria-label="Related"><h2>Keep exploring</h2><ul><li><a href="../stories/europes-plan-for-africa-eurafrica/index.html">Europe's plan for Africa, in its own words</a></li><li><a href="../stories/did-one-conference-carve-up-africa/index.html">Did one conference carve up Africa?</a></li><li><a href="../society/index.html">Society: faith, government and language</a></li><li><a href="../peoples/index.html">Peoples, not 'tribes'</a></li></ul></aside>
${sourcesList()}</article></div>`;
  return layout({ title: `Migration · ${config.name}`, description: "African migration with sources: who moves and where, what people flee, routes and smuggling, what research says about jobs, and Europe's deals.", depth: 1, current: "migration", body, script: true, extraScripts: ["story.js", "share.js"], jump: [{ id: "mc-h", label: "Challenge" }, ...clusters.map((cl) => ({ id: cl.id, label: cl.label })), { id: "sec-gaps", label: "Gaps" }, { id: "sec-sources", label: "Sources" }] });
}

// Scheda di un popolo: stessi blocchi delle storie, più i paesi collegati; le voci di chi appartiene al popolo restano separate dal quadro documentato.
function renderPeople(c) {
  const { cite, list: sourcesList } = makeCiter();
  const keyHtml = c.keyPoints ? `<aside class="keypoints" aria-labelledby="kp-h"><h2 id="kp-h">In short</h2><ul>${c.keyPoints.map((x) => `<li>${esc(x.text)}${x.cite ? cite(x.cite) : ""}</li>`).join("")}</ul></aside>` : "";
  const secs = (c.sections || []).map((sec, i) => `<section id="sec-${esc(sec.id)}">${i === 0 ? '<div class="sec-head"><span class="layer-tag rec">In the record</span></div>' : ""}<h2>${esc(sec.title)}</h2>${sec.blocks.map((b) => renderRich(b, cite, { up: "../../" })).join("")}</section>`).join("\n");
  const gaps = `<section id="sec-gaps" class="gaps"><span class="layer-tag gap">What we do not know</span><ul>${(c.gaps || []).map((g) => `<li>${esc(g)}</li>`).join("")}</ul></section>`;
  const linkedStories = stories.filter((x) => storyPeoples(x).includes(c.slug)).map((x) => `<li>Story: <a href="../../stories/${esc(x.slug)}/index.html">${esc(x.title)}</a></li>`);
  const linkedPlaces = (c.places || []).map((sl) => published.find((x) => x.slug === sl)).filter(Boolean).map((x) => `<li>Place: <a href="../../places/${esc(x.slug)}/index.html">${esc(x.name)}</a></li>`);
  const linkedCaps = (c.capitals || []).map((sl) => capitals.find(({ data: cp }) => cp.slug === sl && (cp.status === "published" || includeDrafts))).filter(Boolean).map(({ data: cp }) => `<li>Capital: <a href="../../capitals/${esc(cp.slug)}/index.html">${esc(cp.name)}</a></li>`);
  const peopleRelated = linkedStories.length || linkedPlaces.length || linkedCaps.length ? `<aside class="related" aria-label="Related"><h2>Linked by name</h2><p class="note-small">These links are chosen by hand: each page named below mentions this people in its own sources.</p><ul>${[...linkedStories, ...linkedPlaces, ...linkedCaps].join("")}<li><a href="../index.html">All peoples</a></li></ul></aside>` : "";
  const nList = (notes[`people-${c.slug}`] || []).slice().sort((a, b) => b.added.localeCompare(a.added));
  const voices = `<section class="story-voices" id="voices" aria-labelledby="voices-h"><span class="layer-tag voi">From people who belong to this group</span><h2 id="voices-h">What readers add</h2>
${nList.length ? `<div class="notes">${nList.map((n) => noteCard(n, config.noteKinds || [])).join("")}</div>` : `<div class="empty"><strong>No voice from the group yet.</strong><span>This page was written from published sources by outsiders. It should be read by people from the group before it is published, and what they add stays apart from the record.</span></div>`}
${shareSection({ type: "people", id: c.slug, name: c.name, kinds: config.noteKinds || [], heading: `Do you belong to this group, or know it well?`, intro: "Tell us what is wrong, missing or said badly here.", depth: 2 })}
</section>`;
  const cl = (c.countries || []).map((iso) => cSlug[iso] ? `<a href="../../countries/${esc(cSlug[iso])}/index.html">${esc(cName[iso] || iso)}</a>` : esc(cName[iso] || iso)).join(" · ");
  const sts = stories.filter((x) => (x.countries || []).some((i) => (c.countries || []).includes(i))).slice(0, 4).map((x) => `<a href="../../stories/${esc(x.slug)}/index.html">${esc(x.title)}</a>`).join(" · ");
  const body = `${compactHero({ scene: "huts", kicker: `People · ${(c.countries || []).map((i) => cName[i] || i).join(", ")}`, title: c.name, sub: c.subtitle })}
<div class="wrap prose-hero"><div class="read-progress" aria-hidden="true"><span></span></div>${keyHtml}<article class="story">${secs}
${peopleRelated}
${pageChecks("people", c.slug, cite)}
${gaps}
${voices}
${deeperHtml(c.deeper)}
<aside class="related" aria-label="Related"><h2>Keep exploring</h2><ul><li>Countries: ${cl}</li>${sts ? `<li>Stories: ${sts}</li>` : ""}<li><a href="../../stories/does-africa-have-tribes/index.html">Does Africa really have 'tribes'?</a></li><li><a href="../index.html">All peoples</a></li></ul></aside>
${sourcesList()}</article></div>`;
  return layout({ title: `${c.name} · ${config.name}`, description: c.subtitle, depth: 2, current: "peoples", body, extraScripts: ["story.js", "share.js"], jump: [...(c.sections || []).map((x) => ({ id: "sec-" + x.id, label: x.title })).slice(0, 4), { id: "voices", label: "Add yours" }, { id: "sec-sources", label: "Sources" }] });
}

// Pagina "Connections": il grafo dei collegamenti tra Paesi, capitali, luoghi, storie e blocchi regionali, da esplorare e da giocare.
function renderExplore() {
  const countries = data.countries ? data.countries.countries : [];
  const nodes = [], edges = [], ids = new Set();
  const add = (id, t, l, h, s = "") => { if (!ids.has(id)) { ids.add(id); nodes.push({ id, t, l, h, s }); } };
  for (const c of countries) add(`c:${c.iso3}`, "country", c.name, `../countries/${cSlug[c.iso3]}/index.html`, c.capital ? `Capital: ${c.capital}` : "");
  for (const b of blocsList) { add(`b:${b.id}`, "bloc", b.name, "../countries/index.html", `${b.members.length} member states`); for (const iso of b.members) if (ids.has(`c:${iso}`)) edges.push([`c:${iso}`, `b:${b.id}`]); }
  const capsHere = capitals.filter(({ data: cp }) => (cp.sections || []).length && (cp.status === "published" || includeDrafts));
  for (const { data: cp } of capsHere) { add(`k:${cp.slug}`, "capital", cp.name, `../capitals/${cp.slug}/index.html`, cp.subtitle || ""); edges.push([`k:${cp.slug}`, `c:${cp.country}`]); }
  for (const pl of published) { if (!pl.country || pl.type === "dish" && !pl.country) continue; add(`p:${pl.slug}`, "place", pl.name, `../places/${pl.slug}/index.html`, pl.subtitle || ""); if (ids.has(`c:${pl.country}`)) edges.push([`p:${pl.slug}`, `c:${pl.country}`]); }
  for (const { data: cp } of capsHere) for (const slug of cp.places || []) if (ids.has(`p:${slug}`)) edges.push([`k:${cp.slug}`, `p:${slug}`]);
  for (const st of stories) {
    add(`s:${st.slug}`, "story", st.title, `../stories/${st.slug}/index.html`, st.subtitle || "");
    for (const iso of st.countries || []) if (ids.has(`c:${iso}`)) edges.push([`s:${st.slug}`, `c:${iso}`]);
    for (const slug of st.places || []) if (ids.has(`p:${slug}`)) edges.push([`s:${st.slug}`, `p:${slug}`]);
    // Storie continentali / pan-africane: collegate all'Unione Africana come snodo comune dei 54 paesi
    if ((!st.countries || st.countries.length === 0) && (!st.places || st.places.length === 0)) {
      if (ids.has("b:au")) edges.push([`s:${st.slug}`, "b:au"]);
    }
  }
  // Popoli: legati ai loro paesi, ai luoghi e alle capitali che le schede nominano e alle storie che li citano (collegamenti scelti a mano, mai dedotti).
  for (const { data: pp } of peoples.filter(({ data: x }) => x.status === "published" || includeDrafts)) {
    add(`e:${pp.slug}`, "people", pp.name, `../peoples/${pp.slug}/index.html`, pp.subtitle || "");
    for (const iso of pp.countries || []) if (ids.has(`c:${iso}`)) edges.push([`e:${pp.slug}`, `c:${iso}`]);
    for (const slug of pp.places || []) if (ids.has(`p:${slug}`)) edges.push([`e:${pp.slug}`, `p:${slug}`]);
    for (const slug of pp.capitals || []) if (ids.has(`k:${slug}`)) edges.push([`e:${pp.slug}`, `k:${slug}`]);
    for (const st of stories) if ((st.peoples || []).includes(pp.slug)) edges.push([`e:${pp.slug}`, `s:${st.slug}`]);
  }
  const graph = { nodes, edges };
  const body = `${compactHero({ scene: "giraffes", kicker: "Explore", title: "Connections", sub: "Everything on this site is linked to something else. Pick a starting point and follow the threads." })}
<div class="wrap prose-hero">
<section class="explore" id="explore" aria-labelledby="ex-h">
  <div class="explore-intro">
    <div>
      <p class="layer-tag rec">Interactive Network</p>
      <h2 id="ex-h">Follow one thread at a time</h2>
    </div>
    <p>Connections are the editorial links between countries, places, capitals, peoples, stories and regional blocs. Choose a starting point to explore freely, or challenge yourself to find the shortest route between two distant topics.</p>
  </div>
  <noscript><p class="fine">This explorer needs JavaScript. Without it, every page links to the countries, places and stories connected to it under "Keep exploring".</p></noscript>
  <div class="ex-ui" id="ex-ui" hidden>
    <!-- Mode Switcher -->
    <div class="ex-mode-bar" role="tablist" aria-label="Explorer mode">
      <button type="button" class="ex-mode-btn is-active" id="ex-mode-explore" role="tab" aria-selected="true">
        <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2"/><polygon points="13.5,6.5 11,12 6.5,13.5 9,8"/></svg>
        <span>Explore freely</span>
      </button>
      <button type="button" class="ex-mode-btn" id="ex-mode-quest" role="tab" aria-selected="false">
        <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="10" cy="10" r="4"/><circle cx="10" cy="10" r="1.5"/></svg>
        <span>Thread Quest</span>
      </button>
    </div>

    <!-- Quest Challenge HUD (shown when quest mode is active) -->
    <div class="ex-quest-hud" id="ex-quest-hud" hidden>
      <div class="ex-quest-header">
        <div class="ex-quest-title-wrap">
          <span class="ex-quest-tag">🎯 Thread Quest</span>
          <h3 class="ex-quest-heading" id="ex-quest-heading">Connect the dots</h3>
        </div>
        <div class="ex-quest-actions">
          <button type="button" class="rc-btn" id="ex-quest-new">New quest</button>
          <button type="button" class="rc-btn" id="ex-quest-hint">Show route</button>
        </div>
      </div>
      <div class="ex-quest-targets" id="ex-quest-targets"></div>
      <div class="ex-quest-status" id="ex-quest-status" role="status" aria-live="polite"></div>
    </div>

    <!-- Search & Quick Navigation Bar -->
    <div class="ex-bar">
      <div class="ex-search-wrap">
        <label for="ex-search" class="ex-search-label">Choose a starting point</label>
        <div class="ex-search-input-box">
          <svg class="ex-search-icon" viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="9" cy="9" r="6"/><path d="M14 14l4.5 4.5"/></svg>
          <input id="ex-search" type="search" placeholder="Search countries, places, stories, capitals..." autocomplete="off" aria-describedby="ex-search-help" aria-controls="ex-suggestions" aria-expanded="false">
          <button type="button" class="ex-search-clear" id="ex-search-clear" aria-label="Clear search" hidden>×</button>
        </div>
        <div class="ex-suggestions" id="ex-suggestions" role="listbox" hidden></div>
        <p class="ex-search-help" id="ex-search-help">Click to browse suggestions, or type to filter starting points.</p>
      </div>
      <div class="ex-actions">
        <button type="button" class="rc-btn" id="ex-random" title="Jump to a random starting point">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"/></svg>
          <span>Surprise me</span>
        </button>
        <button type="button" class="rc-btn" id="ex-back" disabled title="Go back to the previous item">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M12 15l-5-5 5-5"/></svg>
          <span>Back</span>
        </button>
      </div>
    </div>

    <!-- Thread Trail (Journey breadcrumbs) -->
    <div class="ex-trail-wrap" id="ex-trail-wrap" hidden>
      <div class="ex-trail-header">
        <span class="ex-trail-label">Your Thread:</span>
        <button type="button" class="ex-trail-reset" id="ex-trail-reset">Clear trail</button>
      </div>
      <nav class="ex-trail" id="ex-trail" aria-label="Current exploration thread"></nav>
    </div>

    <!-- Active Card (Hero of current node) -->
    <div class="ex-main">
      <article class="ex-card" id="ex-card" aria-live="polite"></article>
    </div>

    <!-- Category Filter Tabs for Connected Items -->
    <div class="ex-filter-wrap" id="ex-filter-wrap">
      <div class="ex-filter-label">Filter by type:</div>
      <div class="ex-filter-tabs" id="ex-filter-tabs" role="group" aria-label="Filter connections by category"></div>
    </div>

    <!-- Connected Items Grid -->
    <div class="ex-lists" id="ex-lists"></div>
  </div>
  <p class="fine">Links come from the content itself: a place card belongs to a country, a story lists its countries and places, a capital lists its places to see, and countries belong to regional blocs. Nothing you do here is saved or sent.</p>
</section></div>
<script type="application/json" id="graphdata">${JSON.stringify(graph).replace(/</g, "\\u003c")}</script>`;
  return layout({ title: `Connections · ${config.name}`, description: "Follow the editorial links between countries, places, capitals and stories.", depth: 1, current: "explore", body, extraScripts: ["explore.js"], bodyClass: "still connections-page" });
}

function renderCapitals() {
  const countries = data.countries ? data.countries.countries : [];
  const norm = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const profileFor = (c) => capitals.find(({ data: p }) => p.country === c.iso3)?.data || null;
  const relatedFor = (c) => published.filter((p) => {
    if (p.country !== c.iso3 || p.type === "dish" || p.capital === true) return false;
    return norm(p.region).split(" · ").some((part) => part === norm(c.capital));
  });
  const row = (c) => {
    const profile = profileFor(c);
    const related = relatedFor(c);
    const relatedText = related.length ? related.map((p) => `<a href="../places/${esc(p.slug)}/index.html">${esc(p.name)}</a>`).join(", ") : "";
    const isPub = profile && (profile.status === "published" || includeDrafts);
    const imgHtml = profile && profile.image
      ? (isPub
        ? `<a class="capital-thumb-link" href="../capitals/${esc(profile.slug)}/index.html" aria-label="${esc(c.capital)} city profile"><img src="../img/capitals/${esc(profile.image.file)}-800.jpg" alt="${esc(profile.image.alt || c.capital)}" width="120" height="90" loading="lazy"></a>`
        : `<span class="capital-thumb-link"><img src="../img/capitals/${esc(profile.image.file)}-800.jpg" alt="${esc(profile.image.alt || c.capital)}" width="120" height="90" loading="lazy"></span>`)
      : `<span class="capital-thumb-link capital-ph" aria-hidden="true">${esc(c.capital.charAt(0))}</span>`;
    return `<li id="cap-${esc(c.iso3)}" class="capital-row"><div class="capital-link">${imgHtml}<div class="capital-body"><span class="capital-city">${isPub ? `<a href="../capitals/${esc(profile.slug)}/index.html">${esc(c.capital)}</a>` : esc(c.capital)}</span><span class="capital-country">${esc(c.name)}</span>${isPub ? `<a class="capital-status linked" href="../capitals/${esc(profile.slug)}/index.html">Open city profile &rarr;</a>` : `<span class="capital-status">City profile in preparation</span>`}${relatedText ? `<span class="capital-related"><b>Related place cards:</b> ${relatedText}</span>` : ""}</div></div></li>`;
  };
  const groups = config.subregions.map((r) => ({ ...r, items: countries.filter((c) => c.subregion === r.id).sort((a, b) => a.name.localeCompare(b.name, "en")) })).filter((g) => g.items.length);
  const rows = groups.map((g) => `<section class="capital-group" id="cap-region-${esc(g.id)}"><h2>${esc(g.label)}</h2><ul class="capital-list">${g.items.map(row).join("")}</ul></section>`).join("");
  const jump = groups.map((g) => `<a href="#cap-region-${esc(g.id)}">${esc(g.label)}</a>`).join("");
  const withCards = countries.filter((c) => profileFor(c)?.status === "published").length;
  const withRelated = countries.filter((c) => relatedFor(c).length).length;
  const body = `${compactHero({ scene: "city", kicker: "Places", title: "African capitals", sub: "The capital named in the country record, and the place card when one exists." })}
<div class="wrap places-index">
  <p class="pi-count">${countries.length} capitals · ${withCards} city cards · ${withRelated} capitals with related place cards · ${countries.length - withCards} city cards still to write.</p>
  <section class="hero-lede"><p class="lede">This index keeps two things apart: a card about the capital city itself, and place cards located in or linked to that city. Both are useful, but they are not the same kind of guide.</p></section>
  <nav class="pi-jump capital-jump" aria-label="Regions">${jump}</nav>
  ${rows}
</div>`;
  return layout({ title: `Capitals · ${config.name}`, description: "The 54 African capitals and the place cards currently linked to them.", depth: 1, current: "capitals", body });
}

write("capitals/index.html", renderCapitals());
write("explore/index.html", renderExplore());
write("peoples/index.html", renderPeoples());
{ const mf = path.join(root, "content", "data", "migration.json"); if (fs.existsSync(mf)) write("migration/index.html", renderMigration(JSON.parse(fs.readFileSync(mf, "utf8")))); }
for (const { data: c } of peoples) {
  if (c.status !== "published" && !includeDrafts) continue;
  if (!(c.sections || []).length) continue;
  write(`peoples/${c.slug}/index.html`, renderPeople(c));
}

for (const { data: c } of capitals) {
  if (c.status !== "published" && !includeDrafts) continue;
  if (!(c.sections || []).length) continue; // bozza vuota: nessuna pagina
  write(`capitals/${c.slug}/index.html`, renderCapital(c));
}

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
fs.copyFileSync(path.join(root, "src", "story.js"), path.join(dist, "story.js"));
fs.copyFileSync(path.join(root, "src", "recipe.js"), path.join(dist, "recipe.js"));
fs.copyFileSync(path.join(root, "src", "society.js"), path.join(dist, "society.js"));
fs.copyFileSync(path.join(root, "src", "explore.js"), path.join(dist, "explore.js"));
fs.copyFileSync(path.join(root, "src", "storygame.js"), path.join(dist, "storygame.js"));
fs.copyFileSync(path.join(root, "src", "languages.js"), path.join(dist, "languages.js"));
fs.copyFileSync(path.join(root, "src", "method-qa.js"), path.join(dist, "method-qa.js"));
// Motion (MIT) è una dipendenza npm: si copia in dist come file locale, con la sua licenza.
fs.mkdirSync(path.join(dist, "vendor"), { recursive: true });
fs.copyFileSync(path.join(root, "node_modules", "motion", "dist", "motion.js"), path.join(dist, "vendor", "motion.js"));
fs.copyFileSync(path.join(root, "node_modules", "motion", "LICENSE.md"), path.join(dist, "vendor", "motion-LICENSE.md"));
// Foto delle schede pubblicate (o bozze se includeDrafts), più le immagini usate come anteprime nelle pagine:
const placesToCopy = new Set(published.filter((pl) => pl.image).map((pl) => pl.image.file));
for (const extra of ["merkato", "nakasero-market", "medina-of-fez"]) {
  placesToCopy.add(extra);
}
for (const file of placesToCopy) {
  for (const size of [800, 1600]) {
    const name = `${file}-${size}.jpg`;
    const srcPath = path.join(root, "src", "img", "places", name);
    if (fs.existsSync(srcPath)) {
      fs.mkdirSync(path.join(dist, "img", "places"), { recursive: true });
      fs.copyFileSync(srcPath, path.join(dist, "img", "places", name));
    }
  }
}
// Immagini delle schede Food che non vengono da una figura della storia.
for (const id of Object.values(FOOD_STORY_IMG)) {
  const name = `${id}-800.jpg`, from = path.join(root, "src", "img", "stories", name);
  if (!fs.existsSync(from)) continue;
  fs.mkdirSync(path.join(dist, "img", "stories"), { recursive: true });
  fs.copyFileSync(from, path.join(dist, "img", "stories", name));
}
// Immagini usate come copertina nella landing page (pathway cards)
for (const name of ["people-fula-800.jpg", "people-fula-1600.jpg"]) {
  const from = path.join(root, "src", "img", "stories", name);
  if (fs.existsSync(from)) {
    fs.mkdirSync(path.join(dist, "img", "stories"), { recursive: true });
    fs.copyFileSync(from, path.join(dist, "img", "stories", name));
  }
}
// Immagini dei popoli (figure nelle schede): stessa cartella delle immagini delle storie.
for (const { data: pe } of peoples) {
  if (!(pe.status === "published" || includeDrafts)) continue;
  for (const sec of pe.sections || []) for (const b of sec.blocks) {
    if (b.type !== "figure") continue;
    const name = `${b.image.file}-800.jpg`;
    fs.mkdirSync(path.join(dist, "img", "stories"), { recursive: true });
    fs.copyFileSync(path.join(root, "src", "img", "stories", name), path.join(dist, "img", "stories", name));
  }
}
// Immagini delle storie: si copiano solo quelle usate da storie pubblicate (o da bozze, se si costruisce con --drafts).
for (const st of stories) {
  for (const sec of st.sections) for (const b of sec.blocks) {
    if (b.type !== "figure") continue;
    for (const size of [800]) { // la pagina usa solo la versione da 800 px; la 1600 resta nei sorgenti
      const name = `${b.image.file}-${size}.jpg`;
      fs.mkdirSync(path.join(dist, "img", "stories"), { recursive: true });
      fs.copyFileSync(path.join(root, "src", "img", "stories", name), path.join(dist, "img", "stories", name));
    }
  }
}
// Immagini delle capitali:
for (const { data: c } of capitals) {
  if (!(c.status === "published" || includeDrafts) || !c.image) continue;
  for (const size of [800, 1600]) {
    const name = `${c.image.file}-${size}.jpg`;
    const srcPath = path.join(root, "src", "img", "capitals", name);
    if (fs.existsSync(srcPath)) {
      fs.mkdirSync(path.join(dist, "img", "capitals"), { recursive: true });
      fs.copyFileSync(srcPath, path.join(dist, "img", "capitals", name));
    }
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
