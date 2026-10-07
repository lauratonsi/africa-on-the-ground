// npm run review-note -- <id-nota> --by "Nome" [--date AAAA-MM-GG] [--write]
// Registra che una persona del posto ha letto una nota già pubblicata (revisione successiva alla pubblicazione).
// Senza --write mostra cosa verrebbe aggiunto. La nota resta com'è: si aggiunge solo review.by e review.date.
import fs from "node:fs";
import path from "node:path";
import { root } from "./lib.mjs";

const args = process.argv.slice(2);
const id = args[0];
const opt = (n, d) => { const k = args.indexOf(`--${n}`); return k >= 0 && args[k + 1] && !args[k + 1].startsWith("--") ? args[k + 1] : d; };
const by = opt("by"), date = opt("date", new Date().toISOString().slice(0, 10));
if (!id || id.startsWith("--") || !by) { console.log('Uso: npm run review-note -- <id-nota> --by "Nome" [--date AAAA-MM-GG] [--write]'); process.exit(0); }
const dir = path.join(root, "content", "notes");
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
  const file = path.join(dir, f);
  const list = JSON.parse(fs.readFileSync(file, "utf8"));
  const note = list.find((n) => n.id === id);
  if (!note) continue;
  console.log(`\nNota ${id} in ${path.relative(root, file)}: letta da "${by}" il ${date}.`);
  if (!args.includes("--write")) { console.log("Non ho modificato nulla. Aggiungi --write per registrarla."); process.exit(0); }
  note.review = { by, date };
  fs.writeFileSync(file, JSON.stringify(list, null, 2) + "\n");
  console.log("Registrata. Poi: npm run check, commit e push.");
  process.exit(0);
}
console.error(`Nessuna nota con id "${id}".`);
process.exit(1);
