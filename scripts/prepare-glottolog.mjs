// Si lancia a mano, di rado: node scripts/prepare-glottolog.mjs <languages.csv di glottolog-cldf>
// (https://github.com/glottolog/glottolog-cldf, cartella cldf). Ne estrae le righe delle lingue del quiz in content/data/glottolog-langs.json.
import fs from "node:fs";
import path from "node:path";
import { root } from "./lib.mjs";

const file = process.argv[2];
if (!file) { console.error("Uso: node scripts/prepare-glottolog.mjs <languages.csv>"); process.exit(1); }

// lettura CSV con virgolette
function parse(text) {
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cur); cur = ""; }
    else if (ch === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
    else if (ch !== "\r") cur += ch;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}
const [head, ...body] = parse(fs.readFileSync(file, "utf8"));
const rec = body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
const by = Object.fromEntries(rec.map((r) => [r.ID, r]));

// id della frase del quiz -> codice Glottolog. Twi è un dialetto di Akan in Glottolog; il malgascio ufficiale poggia sul dialetto dell'altopiano.
const WANT = {
  swahili: "swah1253", zulu: "zulu1248", xhosa: "xhos1239", yoruba: "yoru1245", hausa: "haus1257", wolof: "nucl1347", amharic: "amha1245",
  malagasy: "plat1254", kinyarwanda: "kiny1244", tswana: "tswa1253", sesotho: "sout2807", somali: "soma1255", twi: "akan1250", igbo: "nucl1417"
};
const out = {};
for (const [id, code] of Object.entries(WANT)) {
  const r = by[code];
  if (!r) throw new Error(`Codice ${code} non trovato per ${id}`);
  out[id] = { glottocode: code, name: r.Name, level: r.Level, iso: r.ISO639P3code || null, family: (by[r.Family_ID] || {}).Name || null, macroarea: r.Macroarea };
}
// Quante lingue ha l'Africa secondo Glottolog: livello "language", con l'Africa come unica macroarea, senza le voci
// "Bookkeeping" (segnaposto) e le lingue dei segni, che Glottolog classifica a parte. Include alcune lingue non più parlate.
const af = rec.filter((r) => r.Level === "language" && r.Macroarea === "Africa");
const famOf = (r) => (by[r.Family_ID] || {}).Name || null;
const core = af.filter((r) => !["Bookkeeping", "Sign Language"].includes(famOf(r)));
const fams = {};
for (const r of core) { const f = famOf(r) || "(isolate)"; fams[f] = (fams[f] || 0) + 1; }
const africaCounts = {
  asListed: af.length, afterLeavingOut: core.length,
  families: Object.keys(fams).filter((f) => f !== "(isolate)").length, isolates: fams["(isolate)"] || 0,
  atlanticCongo: fams["Atlantic-Congo"], afroAsiatic: fams["Afro-Asiatic"],
  note: "Languages (not dialects) with Africa as their only macroarea, leaving out Glottolog's bookkeeping entries and sign languages. Some are no longer spoken."
};
fs.writeFileSync(path.join(root, "content", "data", "glottolog-langs.json"), JSON.stringify({
  source: "Glottolog (CLDF export, languages.csv)", license: "CC BY 4.0", retrieved: new Date().toISOString().slice(0, 10), africaCounts, languages: out
}, null, 1) + "\n");
console.log(africaCounts);
console.log(JSON.stringify(out, null, 1));
