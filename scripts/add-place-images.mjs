// Scarica da Wikimedia Commons la foto scelta per le schede dei luoghi nuove (solo licenze aperte) e la collega alla scheda.
// Le scelte sono in content/data/place-image-picks.json: { "<slug-scheda>": { file, alt, caption } }.
// Autore e licenza vengono dall'API di Commons. Intestazione generica: nessun dato personale nelle richieste. Serve rete.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { root } from "./lib.mjs";
import { sleep, LICENSE_URL, makeFetcher } from "./commons.mjs";

const UA = "AfricaOnTheGroundPlaceImages/0.1 (open-licence images for an educational site)";
const picks = JSON.parse(fs.readFileSync(path.join(root, "content", "data", "place-image-picks.json"), "utf8"));
const dir = path.join(root, "src", "img", "places");
fs.mkdirSync(dir, { recursive: true });
const { j, get: getRaw } = makeFetcher(UA);
const get = (u, out) => getRaw(u, out, fs);
const only = process.argv.slice(2);

for (const [slug, p] of Object.entries(picks)) {
  if (only.length && !only.includes(slug)) continue;
  const cardFile = path.join(root, "content", "places", `${slug}.json`);
  if (!fs.existsSync(cardFile)) { console.log("scheda mancante", slug); continue; }
  const card = JSON.parse(fs.readFileSync(cardFile, "utf8"));
  if (!only.length && card.image) continue; // già collegata
  const title = "File:" + p.file;
  const m = await j(`https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=extmetadata|size&iiextmetadatafilter=LicenseShortName|Artist`);
  const ii = Object.values(m.query.pages)[0].imageinfo?.[0];
  if (!ii) { console.log("manca su Commons", slug); continue; }
  const lic = ii.extmetadata.LicenseShortName.value;
  const artist = String(ii.extmetadata.Artist ? ii.extmetadata.Artist.value : "").replace(/<[^>]+>/g, "").replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim().replace(/^(.{3,}?)\1$/, "$1");
  const artistFinal = artist || (lic === "Public domain" ? "Unknown author (public domain)" : "");
  if (!LICENSE_URL[lic] || !artistFinal) { console.log(`SALTATA ${slug}: licenza "${lic}" o autore "${artist}"`); continue; }
  const enc = encodeURIComponent(p.file.replace(/ /g, "_"));
  const w = Math.min(1600, ii.width);
  const tmp = path.join(dir, `${slug}.src`), big = path.join(dir, `${slug}-1600.jpg`), small = path.join(dir, `${slug}-800.jpg`);
  await get(`https://commons.wikimedia.org/wiki/Special:FilePath/${enc}?width=${w}`, tmp);
  execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "85", tmp, "--out", big], { stdio: "ignore" });
  fs.unlinkSync(tmp);
  fs.copyFileSync(big, small);
  if (w > 800) execFileSync("sips", ["--resampleWidth", "800", small], { stdio: "ignore" });
  card.image = { file: slug, alt: p.alt, caption: p.caption, credit: artistFinal, license: lic, licenseUrl: LICENSE_URL[lic], source: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.file.replace(/ /g, "_"))}` };
  fs.writeFileSync(cardFile, JSON.stringify(card, null, 2) + "\n");
  console.log(`ok ${slug}: ${lic}, ${artist.slice(0, 40)}, ${ii.width}x${ii.height}`);
  await sleep(6000);
}
