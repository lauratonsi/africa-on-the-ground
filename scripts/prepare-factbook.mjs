// Scarica da CIA World Factbook (pubblico dominio, copia JSON del repository factbook/factbook.json)
// governo, lingue e religioni dei 54 paesi e li salva in content/data/africa-profiles.json.
// I testi restano quelli originali: non li riassumiamo a mano. Si lancia di rado. Serve rete.
import fs from "node:fs";
import path from "node:path";
import { root } from "./lib.mjs";

const UA = "AfricaOnTheGround/0.1 (educational research; ltonsi13@gmail.com)";
const FIPS = { ag: "DZA", ao: "AGO", bn: "BEN", bc: "BWA", uv: "BFA", by: "BDI", cv: "CPV", cm: "CMR", ct: "CAF", cd: "TCD", cn: "COM", cf: "COG", cg: "COD", iv: "CIV", dj: "DJI", eg: "EGY", ek: "GNQ", er: "ERI", wz: "SWZ", et: "ETH", gb: "GAB", ga: "GMB", gh: "GHA", gv: "GIN", pu: "GNB", ke: "KEN", lt: "LSO", li: "LBR", ly: "LBY", ma: "MDG", mi: "MWI", ml: "MLI", mr: "MRT", mp: "MUS", mo: "MAR", mz: "MOZ", wa: "NAM", ng: "NER", ni: "NGA", rw: "RWA", tp: "STP", sg: "SEN", se: "SYC", sl: "SLE", so: "SOM", sf: "ZAF", od: "SSD", su: "SDN", tz: "TZA", to: "TGO", ts: "TUN", ug: "UGA", za: "ZMB", zi: "ZWE" };
const t = (x) => (x && x.text ? String(x.text).replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim() : "");
const out = {};
for (const [fips, iso3] of Object.entries(FIPS)) {
  let d;
  for (let i = 0; i < 3 && !d; i++) {
    try {
      const r = await fetch(`https://raw.githubusercontent.com/factbook/factbook.json/master/africa/${fips}.json`, { headers: { "User-Agent": UA } });
      if (!r.ok) throw new Error(r.status);
      d = await r.json();
    } catch (e) { await new Promise((r) => setTimeout(r, 1500)); }
  }
  if (!d) { console.log("manca", fips, iso3); continue; }
  const g = d.Government || {}, p = d["People and Society"] || {};
  out[iso3] = {
    fips,
    factbookName: t(g["Country name"] && g["Country name"]["conventional short form"]),
    government: t(g["Government type"]),
    languages: t(p.Languages && (p.Languages.text ? p.Languages : p.Languages.Languages)),
    religions: t(p.Religions),
  };
  await new Promise((r) => setTimeout(r, 300));
}
const file = path.join(root, "content", "data", "africa-profiles.json");
fs.writeFileSync(file, JSON.stringify({ retrieved: new Date().toISOString().slice(0, 10), source: "https://github.com/factbook/factbook.json", license: "Public domain (CIA World Factbook)", countries: out }, null, 1) + "\n");
console.log(Object.keys(out).length, "paesi");
for (const [k, v] of Object.entries(out)) if (!v.government || !v.languages || !v.religions) console.log("incompleto", k, !!v.government, !!v.languages, !!v.religions);
