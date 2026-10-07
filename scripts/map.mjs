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

const SHAPE_ISO = { SDS: "SSD", SOL: "SOM", SAH: null };

// Mappa grande dell'Africa con un pin per scheda che ha coordinate. Restituisce anche i riquadri per ingrandire una regione.
export function africaPlacesMap(places, types, { hrefFor, subOf = {}, subregions = [], countries = [], countryHref = null } = {}) {
  const p = projection({ lon0: -19.5, lon1: 52, lat0: -36, lat1: 38 }, 1000);
  const land = africa.countries.map((c) => `<path class="land" d="${shapePath(c.rings, p)}"><title>${esc(c.name)}</title></path>`).join("");
  const located = places.filter((x) => x.coords);
  const pins = located.map((x, i) => {
    x._href = hrefFor(x);
    const t = types[x.type] ? types[x.type].label : x.type;
    const img = x.image ? `img/places/${x.image.file}-800.jpg` : "";
    return pin(x, p, types, { labelSide: "right" })
      .replace("<a class=", `<a style="--i:${i}" data-name="${esc(x.name)}" data-meta="${esc(x.region + " · " + t)}" data-img="${esc(img)}" class=`)
      .replace('<circle class="hit" r="24"/>', '<circle class="hit" r="24"/><circle class="pulse" r="9"/>');
  }).join("");
  // reticolo di meridiani e paralleli, ogni 10 gradi: serve a far leggere la mappa come una carta
  let grat = "";
  for (let lon = -10; lon <= 50; lon += 10) grat += `M${p.x(lon)},0V${p.height}`;
  for (let lat = -30; lat <= 30; lat += 10) grat += `M0,${p.y(lat)}H${p.width}`;
  const views = {};
  for (const r of subregions) {
    const cs = africa.countries.filter((c) => subOf[c.a3] === r.id);
    if (!cs.length) continue;
    let a = 180, z = -180, lo = 90, hi = -90;
    for (const c of cs) for (const ring of c.rings) for (const [lon, lat] of ring) { if (lon < a) a = lon; if (lon > z) z = lon; if (lat < lo) lo = lat; if (lat > hi) hi = lat; }
    const padX = (p.x(z) - p.x(a)) * 0.08 + 12, padY = (p.y(lo) - p.y(hi)) * 0.08 + 12;
    const x0 = Math.max(0, p.x(a) - padX), y0 = Math.max(0, p.y(hi) - padY);
    // stesse proporzioni della mappa intera, così il riquadro non cambia altezza quando si ingrandisce
    let w = Math.min(p.width, p.x(z) + padX) - x0, h = Math.min(p.height, p.y(lo) + padY) - y0;
    const cx = x0 + w / 2, cy = y0 + h / 2;
    w = Math.min(p.width, Math.max(w, (h * p.width) / p.height)); h = (w * p.height) / p.width;
    views[r.id] = [Math.max(0, Math.min(p.width - w, cx - w / 2)), Math.max(0, Math.min(p.height - h, cy - h / 2)), w, h].map(r1);
  }
  // nomi dei paesi e capitali, ognuno collegato alla scheda del paese nella pagina Countries.
  // La dimensione in carattere segue lo zoom (--k) e app.js mostra più o meno etichette (data-lod).
  const byIso = Object.fromEntries(countries.map((c) => [c.iso3, c]));
  const anchor = {};
  for (const shape of africa.countries) {
    const iso = shape.a3 in SHAPE_ISO ? SHAPE_ISO[shape.a3] : shape.a3;
    if (!iso || !byIso[iso]) continue;
    for (const ring of shape.rings) {
      const lons = ring.map((q) => q[0]), lats = ring.map((q) => q[1]);
      const w = (Math.max(...lons) - Math.min(...lons)) * (Math.max(...lats) - Math.min(...lats));
      if (!anchor[iso] || w > anchor[iso].w) anchor[iso] = { w, x: p.x((Math.min(...lons) + Math.max(...lons)) / 2), y: p.y((Math.min(...lats) + Math.max(...lats)) / 2) };
    }
  }
  const inside = (x, y) => x > 4 && x < p.width - 4 && y > 4 && y < p.height - 4;
  const names = countries.filter((c) => anchor[c.iso3] && inside(anchor[c.iso3].x, anchor[c.iso3].y)).map((c) => {
    const a = anchor[c.iso3];
    const t = `<text class="cn${c.area > 250000 ? " big" : ""}" x="${r1(a.x)}" y="${r1(a.y)}" text-anchor="middle">${esc(c.name)}</text>`;
    return countryHref ? `<a href="${esc(countryHref(c.iso3))}" tabindex="-1" aria-hidden="true">${t}</a>` : t;
  }).join("");
  const capitals = countries.filter((c) => inside(p.x(c.capitalLon), p.y(c.capitalLat))).map((c) => {
    const x = r1(p.x(c.capitalLon)), y = r1(p.y(c.capitalLat));
    const t = `<g class="cp" transform="translate(${x} ${y})"><circle r="3"/><text x="6" y="3.5">${esc(c.capital)}</text></g>`;
    return countryHref ? `<a href="${esc(countryHref(c.iso3))}" tabindex="-1" aria-hidden="true">${t}</a>` : t;
  }).join("");
  const labels = `<g class="clabels">${names}</g><g class="cplabels">${capitals}</g>`;
  const full = [0, 0, p.width, p.height];
  const svg = `<svg class="map map-continent" data-lod="0" viewBox="${full.join(" ")}" data-full="${full.join(" ")}" role="group" aria-label="Map of Africa with a pin for each place card. Select a pin to open its card."><defs><radialGradient id="mcSea" cx="50%" cy="42%" r="75%"><stop offset="0" stop-color="#2b2380"/><stop offset="1" stop-color="#0d0a2b"/></radialGradient></defs><rect width="${p.width}" height="${p.height}" fill="url(#mcSea)"/><path class="grat" d="${grat}"/><g fill-rule="evenodd">${land}</g>${labels}<g class="pins">${pins}</g></svg>`;
  return { svg, views, full, count: located.length };
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
