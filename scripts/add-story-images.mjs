// Scarica da Wikimedia Commons le immagini scelte per le storie (solo licenze aperte).
// Autore e licenza vengono dall'API di Commons, non scritti a mano. Le scelte stanno in content/data/story-image-picks.json;
// i risultati in content/data/story-images.json. Usa un'intestazione generica: nessun dato personale nelle richieste. Serve rete.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { root } from "./lib.mjs";

const UA = "AfricaOnTheGroundStoryImages/0.1 (open-licence images for an educational site)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const picks = JSON.parse(fs.readFileSync(path.join(root, "content", "data", "story-image-picks.json"), "utf8"));
const outFile = path.join(root, "content", "data", "story-images.json");
const done = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, "utf8")) : {};
const LICENSE_URL = { "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/", "Public domain": "https://creativecommons.org/publicdomain/mark/1.0/", "CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/", "CC BY-SA 2.0": "https://creativecommons.org/licenses/by-sa/2.0/", "CC BY 2.0": "https://creativecommons.org/licenses/by/2.0/", "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/", "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/", "CC0": "https://creativecommons.org/publicdomain/zero/1.0/" };
const dir = path.join(root, "src", "img", "stories");
fs.mkdirSync(dir, { recursive: true });
const j = async (u) => { const r = await fetch(u, { headers: { "User-Agent": UA } }); if (!r.ok) throw new Error(`${r.status} ${u}`); return r.json(); };
const get = async (u, out) => { const r = await fetch(u, { headers: { "User-Agent": UA }, redirect: "follow" }); if (!r.ok) throw new Error(`${r.status} ${u}`); fs.writeFileSync(out, Buffer.from(await r.arrayBuffer())); };
const only = process.argv.slice(2);

for (const [id, p] of Object.entries(picks)) {
  if (only.length && !only.includes(id)) continue;
  if (!only.length && done[id]) continue;
  const title = "File:" + p.file;
  const m = await j(`https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=extmetadata|size&iiextmetadatafilter=LicenseShortName|Artist`);
  const ii = Object.values(m.query.pages)[0].imageinfo?.[0];
  if (!ii) { console.log("manca", id); continue; }
  const lic = ii.extmetadata.LicenseShortName.value;
  const artist = String(ii.extmetadata.Artist ? ii.extmetadata.Artist.value : "").replace(/<[^>]+>/g, "").replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
  const artistFinal = artist || (lic === "Public domain" ? "Unknown author (public domain)" : "");
  if (!LICENSE_URL[lic] || !artistFinal) { console.log(`SALTATA ${id}: licenza "${lic}" o autore "${artist}"`); continue; }
  const enc = encodeURIComponent(p.file.replace(/ /g, "_"));
  const w = Math.min(1600, ii.width);
  const tmp = path.join(dir, `${id}.src`), big = path.join(dir, `${id}-1600.jpg`), small = path.join(dir, `${id}-800.jpg`);
  await get(`https://commons.wikimedia.org/wiki/Special:FilePath/${enc}?width=${w}`, tmp);
  execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "85", tmp, "--out", big], { stdio: "ignore" });
  fs.unlinkSync(tmp);
  fs.copyFileSync(big, small);
  if (w > 800) execFileSync("sips", ["--resampleWidth", "800", small], { stdio: "ignore" });
  const dims = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", small]).toString();
  const pw = +/pixelWidth: (\d+)/.exec(dims)[1], ph = +/pixelHeight: (\d+)/.exec(dims)[1];
  done[id] = { file: id, alt: p.alt, caption: p.caption, credit: artistFinal, license: lic, licenseUrl: LICENSE_URL[lic], source: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.file.replace(/ /g, "_"))}`, width: pw, height: ph, ...(p.narrow ? { narrow: true } : {}) };
  fs.writeFileSync(outFile, JSON.stringify(done, null, 2) + "\n");
  console.log(`ok ${id}: ${lic}, ${artist.slice(0, 40)}, ${ii.width}x${ii.height} -> ${pw}x${ph}`);
  await sleep(2500);
}
