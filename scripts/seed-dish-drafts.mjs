// Crea le bozze dei piatti ancora mancanti dal registro delle proposte.
// Non pubblica contenuti: ogni bozza dichiara esplicitamente che la ricerca manca.
import fs from "node:fs";
import path from "node:path";
import { root } from "./lib.mjs";

const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const write = (file, data) => fs.writeFileSync(path.join(root, file), JSON.stringify(data, null, 2) + "\n");
const slug = (value) => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const countries = read("content/data/africa-countries.json").countries;
const proposed = read("content/data/proposed-dishes.json");
const placesDir = path.join(root, "content", "places");
const notesDir = path.join(root, "content", "notes");
const existingFiles = fs.readdirSync(placesDir).filter((file) => file.endsWith(".json"));
const existingCountries = new Set(existingFiles.map((file) => read(`content/places/${file}`).country).filter(Boolean));
const draft = [];
let created = 0;

for (const country of countries) {
  const proposal = proposed.dishes[country.iso3];
  if (!proposal) continue;
  if (existingCountries.has(country.iso3)) {
    draft.push(country.iso3);
    continue;
  }
  const fileSlug = slug(`${proposal.dish}-${country.name}`);
  const file = `${fileSlug}.json`;
  write(`content/places/${file}`, {
    slug: fileSlug,
    status: "draft",
    type: "dish",
    country: country.iso3,
    name: proposal.dish,
    region: country.name,
    subtitle: "Draft card in preparation.",
    facts: [],
    sections: [],
    gaps: ["The dish has not been researched yet: ingredients, preparation, context, sources and local voices are still missing."]
  });
  created++;
  const noteFile = `${fileSlug}.json`;
  if (!fs.existsSync(path.join(notesDir, noteFile))) write(`content/notes/${noteFile}`, []);
  draft.push(country.iso3);
}

proposed.status = { ...(proposed.status || {}), draft: [...new Set(draft.filter((iso) => !(proposed.status?.done || []).includes(iso)))] };
write("content/data/proposed-dishes.json", proposed);
console.log(`Create ${created} bozze di piatti; registro draft aggiornato (${proposed.status.draft.length}).`);