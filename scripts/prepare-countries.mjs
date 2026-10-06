// Si lancia a mano, di rado: node scripts/prepare-countries.mjs
// Scarica dalla Banca Mondiale popolazione, superficie e capitale dei 54 stati africani
// e scrive content/data/africa-countries.json. Il build non fa chiamate di rete: usa solo quel file.
import fs from "node:fs";
import path from "node:path";
import { root } from "./lib.mjs";

// Suddivisione in subregioni: ONU, Statistics Division, standard M49 (pagina letta il 6 ottobre 2026).
const SUBREGIONS = {
  northern: "DZA EGY LBY MAR SDN TUN",
  western: "BEN BFA CPV CIV GMB GHA GIN GNB LBR MLI MRT NER NGA SEN SLE TGO",
  middle: "AGO CMR CAF TCD COG COD GNQ GAB STP",
  eastern: "BDI COM DJI ERI ETH KEN MDG MWI MUS MOZ RWA SYC SOM SSD TZA UGA ZMB ZWE",
  southern: "BWA SWZ LSO NAM ZAF"
};
// Nomi nella forma abituale e capitali con gli accenti (la Banca Mondiale li scrive senza).
const NAMES = {
  EGY: "Egypt", CIV: "Côte d'Ivoire", GMB: "Gambia", COG: "Congo", COD: "DR Congo",
  SOM: "Somalia", STP: "São Tomé and Príncipe"
};
const CAPITALS = { TGO: "Lomé", CMR: "Yaoundé", STP: "São Tomé" };

const API = "https://api.worldbank.org/v2";
async function json(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r.json();
}
// mrnev=1: l'ultimo valore disponibile per ogni paese.
const indicator = async (id) => Object.fromEntries(
  (await json(`${API}/country/all/indicator/${id}?format=json&per_page=20000&mrnev=1`))[1]
    .filter((x) => x.value != null)
    .map((x) => [x.countryiso3code, { value: x.value, year: Number(x.date) }])
);

const meta = Object.fromEntries((await json(`${API}/country?format=json&per_page=400`))[1].map((c) => [c.id, c]));
const pop = await indicator("SP.POP.TOTL");
const area = await indicator("AG.SRF.TOTL.K2");

const countries = [];
for (const [subregion, list] of Object.entries(SUBREGIONS)) {
  for (const iso3 of list.split(" ")) {
    const m = meta[iso3];
    if (!m || !pop[iso3] || !area[iso3]) throw new Error(`Dati mancanti per ${iso3}`);
    countries.push({
      iso3,
      name: NAMES[iso3] || m.name,
      capital: CAPITALS[iso3] || m.capitalCity,
      capitalLat: Math.round(Number(m.latitude) * 1000) / 1000,
      capitalLon: Math.round(Number(m.longitude) * 1000) / 1000,
      subregion,
      population: pop[iso3].value,
      populationYear: pop[iso3].year,
      area: Math.round(area[iso3].value),
      areaYear: area[iso3].year
    });
  }
}
countries.sort((a, b) => a.name.localeCompare(b.name, "en"));

const out = {
  retrieved: new Date().toISOString().slice(0, 10),
  sources: ["wb-population", "wb-area", "wb-countries", "un-m49", "natural-earth"],
  countries
};
fs.mkdirSync(path.join(root, "content", "data"), { recursive: true });
fs.writeFileSync(path.join(root, "content", "data", "africa-countries.json"), JSON.stringify(out, null, 1) + "\n");
console.log(`${countries.length} paesi scritti in content/data/africa-countries.json`);
