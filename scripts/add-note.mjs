// npm run add-note: trasforma un messaggio ricevuto dal modulo del sito in una nota di content/notes/<luogo>.json.
//
//   pbpaste | npm run add-note                      mostra la nota che verrebbe aggiunta (nessuna modifica)
//   pbpaste | npm run add-note -- --write           la aggiunge al file del luogo
//   npm run add-note -- --file messaggio.txt --write
//
// Opzioni: --how message|in-person|other (come è stato dato il consenso, default message)
//          --date AAAA-MM-GG (data del consenso, default oggi)   --anonymous (toglie il nome)
//          --reviewed "Nome" (chi ha letto la nota: obbligatorio per i luoghi "sensitive", vedi docs/contributi.md)
//
// Il messaggio deve contenere il blocco "[AOTG-NOTE v1]" che scrive il modulo. Le regole sono quelle di `npm run check`:
// nessuna email o telefono, tipo e legame previsti da site.config.json, consenso presente.
import fs from "node:fs";
import path from "node:path";
import { root, loadAll, validate } from "./lib.mjs";

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : d; };

function fail(msg) { console.error(`\nErrore: ${msg}\n`); process.exit(1); }

async function readInput() {
  const file = opt("file");
  if (file) return fs.readFileSync(file, "utf8");
  if (process.stdin.isTTY) {
    console.log(`Incolla qui il messaggio con "pbpaste | npm run add-note" oppure usa --file <percorso>.\nVedi l'intestazione di scripts/add-note.mjs per le opzioni.`);
    process.exit(0);
  }
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data;
}

// "[AOTG-NOTE v1]", poi righe "chiave: valore", poi "---", il testo, "---".
function parse(raw) {
  const lines = raw.replace(/\r\n?/g, "\n").split("\n");
  const start = lines.findIndex((l) => l.trim() === "[AOTG-NOTE v1]");
  if (start < 0) fail('non trovo il blocco "[AOTG-NOTE v1]". Incolla il messaggio intero, così come è arrivato.');
  const fields = {};
  let i = start + 1;
  for (; i < lines.length && lines[i].trim() !== "---"; i++) {
    const m = lines[i].match(/^([a-z]+):\s*(.*)$/);
    if (m) fields[m[1]] = m[2].trim();
  }
  if (i >= lines.length) fail('manca la riga "---" prima del testo.');
  const textLines = [];
  for (i += 1; i < lines.length && lines[i].trim() !== "---"; i++) textLines.push(lines[i]);
  if (i >= lines.length) fail('manca la riga "---" dopo il testo.');
  return { fields, text: textLines.join("\n").trim() };
}

const today = new Date().toISOString().slice(0, 10);
const { fields, text } = parse(await readInput());

const data = loadAll();
const slug = fields.place;
if (!slug || !data.places.some((p) => p.data.slug === slug)) fail(`il luogo "${slug}" non esiste in content/places.`);
if (fields.consent !== "yes") fail('il messaggio non dice "consent: yes". Senza consenso la nota non si pubblica.');

if (fields.kind === "fix") {
  console.log(`\nQuesta è una correzione al racconto documentato, non una voce: non si pubblica come nota.\nControlla la segnalazione, cerca una fonte e, se regge, correggi la scheda content/places/${slug}.json citandola.\nTesto ricevuto:\n\n${text}\n`);
  process.exit(0);
}
const how = opt("how", "message");
const placeData = data.places.find((p) => p.data.slug === slug).data;
const reviewer = opt("reviewed");
if (placeData.sensitive && !reviewer && flag("write")) fail(`"${placeData.name}" è un luogo delicato: la nota si pubblica solo dopo la lettura di una persona del posto. Aggiungi --reviewed "Nome" quando l'ha letta.`);
const entry = {
  id: "",
  kind: fields.kind,
  text,
  ...(fields.name && !flag("anonymous") ? { name: fields.name } : {}),
  ...(fields.relation ? { relation: fields.relation } : {}),
  ...(fields.lang ? { lang: fields.lang } : {}),
  consent: { given: true, date: opt("date", today), how },
  added: today,
  ...(reviewer ? { review: { by: reviewer, date: today } } : {})
};

const file = path.join(root, "content", "notes", `${slug}.json`);
const list = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];
const nums = list.map((n) => Number((String(n.id).match(/-(\d+)$/) || [])[1] || 0));
entry.id = `${slug}-${String(Math.max(0, ...nums) + 1).padStart(3, "0")}`;

// stesse regole di `npm run check`, applicate alla lista con la nota in più
// In anteprima un luogo delicato si mostra anche senza revisione, con un avviso; per salvare la revisione è obbligatoria.
const checkEntry = placeData.sensitive && !reviewer ? { ...entry, review: { by: "(in attesa)", date: today } } : entry;
const result = validate({ ...data, notes: { ...data.notes, [slug]: [...list, checkEntry] } });
const mine = result.errors.filter((e) => e.includes(`notes/${slug}.json`) && e.includes(entry.id));
if (mine.length) fail(`la nota non passa i controlli:\n  - ${mine.join("\n  - ")}`);

if (placeData.sensitive && !reviewer) console.log(`\nAttenzione: "${placeData.name}" è un luogo delicato. Prima di pubblicare, fai leggere la nota a una persona del posto.`);
console.log("\nNota pronta per", slug, ":\n");
console.log(JSON.stringify(entry, null, 2));
if (!flag("write")) {
  console.log("\nNon ho modificato nulla. Aggiungi --write per salvarla in", path.relative(root, file));
  process.exit(0);
}
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, JSON.stringify([...list, entry], null, 2) + "\n");
console.log(`\nSalvata in ${path.relative(root, file)}.`);
console.log("Ora: conserva il messaggio originale, fuori dal repository, come prova del consenso. Poi lancia npm run check.");
