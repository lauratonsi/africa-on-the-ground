// Si lancia a mano, di rado: node scripts/prepare-wb2023.mjs
// Scarica dalla Banca Mondiale tre serie del 2023 per i 54 paesi (popolazione urbana, popolazione, PIL pro capite a prezzi correnti)
// e le scrive in content/data/wb-2023.json. Le storie "Do most Africans live in villages?" e "How rich is Africa?" calcolano da qui.
import fs from "node:fs";
import path from "node:path";
import { root } from "./lib.mjs";

const iso = JSON.parse(fs.readFileSync(path.join(root, "content", "data", "africa-countries.json"), "utf8")).countries.map((c) => c.iso3);
const IND = { urban: "SP.URB.TOTL", pop: "SP.POP.TOTL", gdppc: "NY.GDP.PCAP.CD" };
const out = { retrieved: new Date().toISOString().slice(0, 10), year: 2023, indicators: {} };
for (const [k, code] of Object.entries(IND)) {
  const res = await fetch(`https://api.worldbank.org/v2/country/${iso.join(";")}/indicator/${code}?format=json&per_page=1000&date=2023`);
  const [meta, rows] = await res.json();
  const values = {};
  for (const r of rows) if (r.value != null) values[r.countryiso3code] = r.value;
  out.indicators[k] = { code, lastUpdated: meta.lastupdated, values };
  console.log(k, code, Object.keys(values).length, "paesi");
}
fs.writeFileSync(path.join(root, "content", "data", "wb-2023.json"), JSON.stringify(out) + "\n");
