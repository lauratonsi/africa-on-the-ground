// Si lancia a mano, di rado: node scripts/prepare-truesize.mjs <cartella-con-ne_50m_admin_0_countries.geojson>
// Legge i contorni Natural Earth 1:50m, ne ricava le forme per lo strumento "True size" e scrive src/geo/truesize.json.
// Le aree sono calcolate qui, dagli stessi contorni semplificati che il sito disegna, con la proiezione Equal Earth
// (a superficie uguale): così Africa e forme confrontate si misurano con lo stesso metodo.
import fs from "node:fs";
import path from "node:path";
import { root } from "./lib.mjs";
import { simplify, round } from "./geo-util.mjs";
import { equalEarth, equalEarthInverse } from "./truesize-math.mjs";

const dir = process.argv[2];
if (!dir) { console.error("Uso: node scripts/prepare-truesize.mjs <cartella>"); process.exit(1); }
const features = JSON.parse(fs.readFileSync(path.join(dir, "ne_50m_admin_0_countries.geojson"), "utf8")).features;

const R = 6371.0088; // raggio medio della Terra, km
const EU27 = ["AUT", "BEL", "BGR", "HRV", "CYP", "CZE", "DNK", "EST", "FIN", "FRA", "DEU", "GRC", "HUN", "IRL", "ITA", "LVA", "LTU", "LUX", "MLT", "NLD", "POL", "PRT", "ROU", "SVK", "SVN", "ESP", "SWE"];

// near: [lon, lat, raggio in gradi]. Si tengono solo gli anelli il cui centro è entro quel raggio, per lasciare fuori
// i territori d'oltremare (Guyana francese, Canarie, Hawaii...). cm: meridiano centrale usato per misurare la forma.
const SHAPES = [
  { id: "greenland", label: "Greenland", a3: ["GRL"], cm: -42, note: "" },
  { id: "usa", label: "United States (48 states)", a3: ["USA"], cm: -98, near: [-98, 39, 30], note: "Contiguous states only: Alaska and Hawaii are left out." },
  { id: "china", label: "China", a3: ["CHN"], cm: 104, note: "Taiwan is not included." },
  { id: "india", label: "India", a3: ["IND"], cm: 79, note: "Outline as Natural Earth draws it, with the boundaries it holds de facto." },
  { id: "eu", label: "European Union (27)", a3: EU27, cm: 10, near: [10, 50, 26], note: "The 27 member states, mainland and nearby islands; overseas territories are left out." },
  { id: "russia", label: "Russia", a3: ["RUS"], cm: 100, note: "" },
  { id: "brazil", label: "Brazil", a3: ["BRA"], cm: -52, note: "" },
  { id: "canada", label: "Canada", a3: ["CAN"], cm: -100, note: "" },
  { id: "australia", label: "Australia", a3: ["AUS"], cm: 134, near: [134, -25, 30], note: "" }
];

// Un lato lungo (il 49° parallelo degli Stati Uniti, per esempio) è una linea retta solo sulla mappa piatta: dopo la rotazione
// sulla sfera deve seguire la curva. Si aggiungono punti intermedi, così la forma resta fedele ovunque venga spostata.
function densify(r, max = 0.75) {
  const out = [r[0]];
  for (let i = 1; i < r.length; i++) {
    const [x0, y0] = r[i - 1], [x1, y1] = r[i];
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) / max);
    for (let k = 1; k < n; k++) out.push([Math.round((x0 + (x1 - x0) * k / n) * 1000) / 1000, Math.round((y0 + (y1 - y0) * k / n) * 1000) / 1000]);
    out.push(r[i]);
  }
  return out;
}

const ext = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates).map((poly) => poly[0]);
const holes = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates).flatMap((poly) => poly.slice(1));
const rad = Math.PI / 180;
const dist = (lo1, la1, lo2, la2) => {
  const a = Math.sin((la2 - la1) * rad / 2) ** 2 + Math.cos(la1 * rad) * Math.cos(la2 * rad) * Math.sin((lo2 - lo1) * rad / 2) ** 2;
  return 2 * Math.asin(Math.sqrt(a)) / rad;
};
const ringCenter = (r) => [r.reduce((s, p) => s + p[0], 0) / r.length, r.reduce((s, p) => s + p[1], 0) / r.length];

// Area di un anello (km²) e baricentro nel piano Equal Earth, attorno a un meridiano centrale.
function measure(ring, cm) {
  const pts = ring.map(([lo, la]) => equalEarth(lo, la, cm));
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], k = x0 * y1 - x1 * y0;
    a += k; cx += (x0 + x1) * k; cy += (y0 + y1) * k;
  }
  a /= 2;
  return { area: a, cx: cx / (6 * a), cy: cy / (6 * a) };
}

const shapes = SHAPES.map((s) => {
  let rings = features.filter((f) => s.a3.includes(f.properties.ADM0_A3)).flatMap((f) => ext(f.geometry));
  if (!rings.length) throw new Error(`Nessun contorno per ${s.id}`);
  if (s.near) rings = rings.filter((r) => { const c = ringCenter(r); return dist(c[0], c[1], s.near[0], s.near[1]) <= s.near[2]; });
  rings = rings.map((r) => densify(round(simplify(r, 0.06)))).filter((r) => r.length >= 4);
  // fuori gli isolotti sotto i 2.000 km²: non si vedono e appesantiscono la pagina
  const parts = rings.map((r) => ({ r, m: measure(r, s.cm) })).filter((x) => Math.abs(x.m.area) * R * R >= 2000);
  const total = parts.reduce((t, x) => t + Math.abs(x.m.area), 0);
  const cx = parts.reduce((t, x) => t + x.m.cx * Math.abs(x.m.area), 0) / total;
  const cy = parts.reduce((t, x) => t + x.m.cy * Math.abs(x.m.area), 0) / total;
  const [lon, lat] = equalEarthInverse(cx, cy, s.cm);
  return {
    id: s.id, label: s.label, note: s.note,
    anchor: [Math.round(lon * 10) / 10, Math.round(lat * 10) / 10],
    area: Math.round(total * R * R),
    rings: parts.map((x) => x.r)
  };
});

// Africa: tutti i paesi del continente, area dagli anelli esterni meno i buchi (il Lesotho è un buco del Sudafrica).
const africaF = features.filter((f) => f.properties.CONTINENT === "Africa");
let africa = 0;
for (const f of africaF) {
  for (const r of ext(f.geometry)) africa += Math.abs(measure(round(simplify(r, 0.04)), 20).area);
  for (const r of holes(f.geometry)) africa -= Math.abs(measure(round(simplify(r, 0.04)), 20).area);
}

const out = { source: "Natural Earth, admin 0 countries, 1:50m", africaArea: Math.round(africa * R * R), shapes };
fs.writeFileSync(path.join(root, "src", "geo", "truesize.json"), JSON.stringify(out));
console.log("truesize.json", fs.statSync(path.join(root, "src", "geo", "truesize.json")).size, "byte");
console.log("Africa", out.africaArea.toLocaleString("en"), "km²");
for (const s of shapes) console.log(s.id.padEnd(10), String(s.area).padStart(10), "km²", s.rings.length, "anelli", s.rings.reduce((t, r) => t + r.length, 0), "punti", "ancora", s.anchor.join(","));
