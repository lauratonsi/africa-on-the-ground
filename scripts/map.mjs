// Mappe SVG generate al build. Nessuna libreria, nessuna tessera da server esterni:
// i contorni vengono da src/geo/*.json (Natural Earth, pubblico dominio, vedi src/geo/LEGGIMI.txt).
import fs from "node:fs";
import path from "node:path";
import { root } from "./lib.mjs";

const geo = (f) => JSON.parse(fs.readFileSync(path.join(root, "src", "geo", f), "utf8"));
const africa = geo("africa.json");
const gambia = geo("gambia.json");

export const countryCodes = new Set(africa.countries.map((c) => c.a3));
export const countryName = (a3) => (africa.countries.find((c) => c.a3 === a3) || {}).name || a3;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const r1 = (n) => Math.round(n * 10) / 10;

// Proiezione piana con correzione del coseno alla latitudine centrale.
function projection({ lon0, lon1, lat0, lat1 }, width) {
  const kx = Math.cos(((lat0 + lat1) / 2) * Math.PI / 180);
  const s = width / ((lon1 - lon0) * kx);
  return {
    width,
    height: r1((lat1 - lat0) * s),
    x: (lon) => r1((lon - lon0) * kx * s),
    y: (lat) => r1((lat1 - lat) * s),
    box: { lon0, lon1, lat0, lat1 }
  };
}

const touches = (pts, b) => {
  let a = 180, z = -180, c = 90, d = -90;
  for (const [lo, la] of pts) { if (lo < a) a = lo; if (lo > z) z = lo; if (la < c) c = la; if (la > d) d = la; }
  return !(z < b.lon0 || a > b.lon1 || d < b.lat0 || c > b.lat1);
};
const ringPath = (pts, p, close) => "M" + pts.map(([lo, la]) => `${p.x(lo)},${p.y(la)}`).join("L") + (close ? "Z" : "");
const shapePath = (rings, p, close = true) => rings.filter((r) => touches(r, p.box)).map((r) => ringPath(r, p, close)).join("");

// Nomi di contesto, mostrati solo se cadono dentro la vista.
const GAMBIA_LABELS = [
  { text: "Atlantic Ocean", lon: -17.0, lat: 13.2 },
  { text: "Senegal", lon: -15.2, lat: 13.8 },
  { text: "Senegal", lon: -15.2, lat: 13.1 }
];

function pin(place, p, types, { cur, dim, labelSide }) {
  const x = p.x(place.coords.lon), y = p.y(place.coords.lat);
  const t = types[place.type] || { shape: "circle", label: place.type };
  const shape = t.shape === "square" ? '<rect x="-8" y="-8" width="16" height="16"/>'
    : t.shape === "diamond" ? '<rect x="-8" y="-8" width="16" height="16" transform="rotate(45)"/>'
    : '<circle r="9"/>';
  const cls = ["pin", place.status === "draft" ? "draft" : "", cur ? "cur" : "", dim ? "dim" : ""].filter(Boolean).join(" ");
  const label = place.name + (place.coords.approx ? " (approximate position)" : "");
  const left = labelSide === "left";
  return `<a class="${cls}" href="${esc(place._href)}" data-slug="${esc(place.slug)}" data-type="${esc(place.type)}" aria-label="${esc(label)}"${cur ? ' aria-current="page"' : ""} transform="translate(${x} ${y})"><circle class="hit" r="24"/>${cur ? '<circle class="ring" r="17"/>' : ""}${shape}<text class="plabel" x="${left ? -16 : 16}" y="5" text-anchor="${left ? "end" : "start"}">${esc(place.name)}</text></a>`;
}

// Panoramica dell'Africa: i paesi con almeno una scheda sono evidenziati.
export function africaMap(places, types, { hrefFor } = {}) {
  const p = projection({ lon0: -19, lon1: 52, lat0: -36, lat1: 38 }, 600);
  const have = new Set(places.map((x) => x.country).filter(Boolean));
  const land = africa.countries.map((c) => {
    const path = `<path class="land${have.has(c.a3) ? " has" : ""}" d="${shapePath(c.rings, p)}"><title>${esc(c.name)}${have.has(c.a3) && hrefFor ? ": see its figures" : ""}</title></path>`;
    return have.has(c.a3) && hrefFor ? `<a href="${esc(hrefFor(c.a3))}" aria-label="${esc(c.name)}: figures and place cards">${path}</a>` : path;
  }).join("");
  const locators = africa.countries.filter((c) => have.has(c.a3)).map((c) => {
    const pts = c.rings.flat();
    const lons = pts.map((q) => q[0]), lats = pts.map((q) => q[1]);
    const cx = p.x((Math.min(...lons) + Math.max(...lons)) / 2), cy = p.y((Math.min(...lats) + Math.max(...lats)) / 2);
    return `<circle class="locator" cx="${cx}" cy="${cy}" r="17"/>`;
  }).join("");
  return `<svg class="map map-africa" viewBox="0 0 ${p.width} ${p.height}" role="img" aria-label="Map of Africa. Countries with place cards are highlighted."><g fill-rule="evenodd">${land}</g>${locators}</svg>`;
}

// Dettaglio della Gambia con il fiume e i pin. Se `focus` è dato, la vista si stringe attorno a quel luogo.
export function gambiaMap(places, types, { focus = null, hrefFor } = {}) {
  let box = { lon0: -16.95, lon1: -13.7, lat0: 13.0, lat1: 13.9 };
  if (focus) {
    const { lon, lat } = focus.coords;
    box = { lon0: lon - 0.9, lon1: lon + 0.9, lat0: lat - 0.42, lat1: lat + 0.42 };
  }
  const p = projection(box, 1000);
  const land = gambia.countries.map((c) =>
    `<path class="land${c.a3 === "GMB" ? " has" : ""}" d="${shapePath(c.rings, p)}"/>`).join("");
  const labels = GAMBIA_LABELS.filter((l) => l.lon > box.lon0 && l.lon < box.lon1 && l.lat > box.lat0 && l.lat < box.lat1)
    .map((l) => `<text class="mlabel" x="${p.x(l.lon)}" y="${p.y(l.lat)}" text-anchor="middle">${esc(l.text)}</text>`).join("");
  const rivers = gambia.rivers.map((r) => `<path class="river" d="${shapePath(r.lines, p, false)}"/>`).join("");
  const located = places.filter((x) => x.coords && x.country === "GMB" && (!focus || x.slug === focus.slug || (
    x.coords.lon > box.lon0 && x.coords.lon < box.lon1 && x.coords.lat > box.lat0 && x.coords.lat < box.lat1)));
  const pins = located.map((x) => {
    x._href = hrefFor(x);
    const px = p.x(x.coords.lon);
    return pin(x, p, types, { cur: focus && x.slug === focus.slug, dim: focus && x.slug !== focus.slug, labelSide: px > p.width * 0.7 ? "left" : "right" });
  }).join("");
  const label = focus ? `Map showing where ${focus.name} is on the River Gambia` : "Map of The Gambia with place cards";
  return `<svg class="map map-gambia${focus ? " map-local" : ""}" viewBox="0 0 ${p.width} ${p.height}" role="group" aria-label="${esc(label)}"><g fill-rule="evenodd">${land}</g>${rivers}${labels}<g class="pins">${pins}</g></svg>`;
}

// ---------- mappa a colori per paese (pagina Countries) ----------
// I contorni di Natural Earth usano alcune sigle proprie: le riportiamo ai codici ISO.
// Somaliland è disegnata come parte della Somalia, come nell'elenco dei paesi della Banca Mondiale.
// Il Sahara Occidentale non ha dati e resta senza colore.
const SHAPE_ISO = { SDS: "SSD", SOL: "SOM", SAH: null };

export function choroplethMap(countries, bins) {
  const p = projection({ lon0: -19, lon1: 52, lat0: -36, lat1: 38 }, 700);
  const by = Object.fromEntries(countries.map((c) => [c.iso3, c]));
  const tip = (c) => `${c.name}. Capital ${c.capital}. Population ${c.population.toLocaleString("en-US")}, area ${c.area.toLocaleString("en-US")} km²`;
  const land = africa.countries.map((shape) => {
    const iso = shape.a3 in SHAPE_ISO ? SHAPE_ISO[shape.a3] : shape.a3;
    const c = iso && by[iso];
    const d = shapePath(shape.rings, p);
    if (!c) return `<path class="c nodata" d="${d}"><title>${esc(shape.name)}: no figures</title></path>`;
    const b = bins(c);
    return `<path class="c" d="${d}" data-iso="${c.iso3}" data-sub="${c.subregion}" data-pop="${b.pop}" data-area="${b.area}" data-den="${b.den}" data-tip="${esc(tip(c))}" tabindex="0" role="button" aria-pressed="false" aria-label="${esc(c.name)}"><title>${esc(tip(c))}</title></path>`;
  }).join("");
  // capitali: un punto con anello del colore della superficie, così si legge anche sui colori scuri
  const caps = countries.filter((c) => c.capitalLon > -19 && c.capitalLon < 52 && c.capitalLat > -36 && c.capitalLat < 38).map((c) =>
    `<circle class="cap" cx="${p.x(c.capitalLon)}" cy="${p.y(c.capitalLat)}" r="3.4" data-sub="${c.subregion}"><title>${esc(c.capital)}, capital of ${esc(c.name)}</title></circle>`).join("");
  return `<svg class="map cmap" viewBox="0 0 ${p.width} ${p.height}" role="group" aria-label="Map of Africa shaded by country. The table below has the same figures." data-m="pop"><g fill-rule="evenodd">${land}</g><g class="caps">${caps}</g></svg>`;
}
