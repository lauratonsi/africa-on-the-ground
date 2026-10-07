// Scarica dal portale di dati aperti dell'UNESCO (dataset whc001, licenza CC BY-SA 4.0) i siti del Patrimonio mondiale
// dei 54 stati africani e scrive content/data/unesco-whc-africa.json. Serve rete, ma solo per questo comando.
// Usa l'API pubblica data.unesco.org, con pause tra le richieste e un User-Agent che dichiara chi siamo.
import fs from "node:fs";
import path from "node:path";
import { root } from "./lib.mjs";

const UA = "AfricaOnTheGround/0.1 (educational research; ltonsi13@gmail.com)";
const base = "https://data.unesco.org/api/explore/v2.1/catalog/datasets/whc001/records";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const countries = JSON.parse(fs.readFileSync(path.join(root, "content/data/africa-countries.json"), "utf8")).countries;
const iso2 = JSON.parse(fs.readFileSync(path.join(root, "content/data/iso2.json"), "utf8"));
const wanted = new Set(countries.map((c) => iso2[c.iso3]));

const all = [];
for (let offset = 0; ; offset += 100) {
  const res = await fetch(`${base}?limit=100&offset=${offset}&order_by=id_no`, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`UNESCO open data: HTTP ${res.status} (offset ${offset})`);
  const j = await res.json();
  all.push(...j.results);
  console.log(`offset ${offset}: ${j.results.length} (totale ${j.total_count})`);
  if (offset + 100 >= j.total_count) break;
  await sleep(2500);
}
const keep = all.filter((r) => String(r.iso_codes || "").split(",").map((x) => x.trim()).some((c) => wanted.has(c)));
const pick = (r) => ({
  id: r.id_no, name: r.name_en, states: r.states_names, iso: r.iso_codes, inscribed: r.date_inscribed, category: r.category,
  criteria: r.criteria_txt, areaHa: r.area_hectares, danger: r.danger, dangerList: r.danger_list, transboundary: r.transboundary,
  coordinates: r.coordinates ? { lat: r.coordinates.lat, lon: r.coordinates.lon } : null,
  short: r.short_description_en, justification: r.justification_en
});
const out = {
  retrieved: new Date().toISOString().slice(0, 10),
  source: "https://data.unesco.org/explore/dataset/whc001/",
  license: "CC BY-SA 4.0",
  note: "UNESCO World Heritage Centre, World Heritage List (dataset whc001). Testi e dati dell'UNESCO, riprodotti con attribuzione; la licenza CC BY-SA 4.0 chiede la stessa licenza per le opere derivate.",
  sites: keep.map(pick)
};
fs.writeFileSync(path.join(root, "content/data/unesco-whc-africa.json"), JSON.stringify(out, null, 1) + "\n");
console.log(`Scritti ${out.sites.length} siti africani.`);
