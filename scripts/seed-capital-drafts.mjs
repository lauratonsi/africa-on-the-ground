// Crea i profili separati delle 54 capitali dal dataset dei paesi.
// Non usa le place card: ogni profilo urbano deve essere ricercato a parte.
import fs from "node:fs";
import path from "node:path";
import { root } from "./lib.mjs";

const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const write = (file, data) => fs.writeFileSync(path.join(root, file), JSON.stringify(data, null, 2) + "\n");
const slug = (value) => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const countries = read("content/data/africa-countries.json").countries;
const dir = path.join(root, "content", "capitals");
fs.mkdirSync(dir, { recursive: true });
let created = 0;
for (const country of countries) {
  const fileSlug = slug(`${country.capital}-${country.name}`);
  const file = path.join(dir, `${fileSlug}.json`);
  if (fs.existsSync(file)) continue;
  write(`content/capitals/${fileSlug}.json`, {
    slug: fileSlug,
    status: "draft",
    country: country.iso3,
    name: country.capital,
    subtitle: "Capital profile in preparation.",
    facts: [],
    sections: [],
    gaps: ["This city profile has not been researched yet: history, urban life, sources and local voices are still missing."]
  });
  created++;
}
console.log(`Create ${created} capital profiles; existing profiles left unchanged.`);