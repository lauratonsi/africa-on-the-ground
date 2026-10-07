// npm run remove-note -- <id-nota>: toglie una nota dal sito (richiesta di ritiro dell'autore).
//   npm run remove-note -- kunta-kinteh-island-001          mostra cosa verrebbe tolto
//   npm run remove-note -- kunta-kinteh-island-001 --write  la toglie dal file del luogo
// Il testo resta nella cronologia pubblica del repository finché non la si riscrive: vedi docs/contributi.md.
import fs from "node:fs";
import path from "node:path";
import { root } from "./lib.mjs";

const id = process.argv[2];
if (!id || id.startsWith("--")) { console.log("Uso: npm run remove-note -- <id-nota> [--write]"); process.exit(0); }
const dir = path.join(root, "content", "notes");
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
  const file = path.join(dir, f);
  const list = JSON.parse(fs.readFileSync(file, "utf8"));
  const note = list.find((n) => n.id === id);
  if (!note) continue;
  console.log(`\nNota ${id} in ${path.relative(root, file)}:\n${JSON.stringify(note, null, 2)}\n`);
  if (!process.argv.includes("--write")) { console.log("Non ho modificato nulla. Aggiungi --write per toglierla."); process.exit(0); }
  fs.writeFileSync(file, JSON.stringify(list.filter((n) => n.id !== id), null, 2) + "\n");
  console.log("Tolta dal sito. Ora: npm run check, commit e push; annota la richiesta nel registro privato.");
  console.log("Se l'autore chiede anche di cancellare la cronologia, serve riscrivere la storia del repository (docs/contributi.md).");
  process.exit(0);
}
console.error(`Nessuna nota con id "${id}".`);
process.exit(1);
