// Scarica da Wikimedia Commons le foto scelte (solo licenze aperte) e le collega alle schede.
// Le scelte sono nella tabella qui sotto; i dati di autore e licenza vengono dall'API di Commons, non scritti a mano.
// Si lancia di rado. Serve rete.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { root } from "./lib.mjs";

const UA = "AfricaOnTheGround/0.1 (educational research; ltonsi13@gmail.com)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pick = JSON.parse(fs.readFileSync(path.join(root, "content", "data", "photo-picks.json"), "utf8"));
const LICENSE_URL = { "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/", "Public domain": "https://creativecommons.org/publicdomain/mark/1.0/", "CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/", "CC BY-SA 3.0 igo": "https://creativecommons.org/licenses/by-sa/3.0/igo/", "CC BY-SA 2.0": "https://creativecommons.org/licenses/by-sa/2.0/", "CC BY 2.0": "https://creativecommons.org/licenses/by/2.0/", "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/", "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/" };
const dir = path.join(root, "src", "img", "places");
fs.mkdirSync(dir, { recursive: true });
const j = async (u) => { const r = await fetch(u, { headers: { "User-Agent": UA } }); if (!r.ok) throw new Error(`${r.status} ${u}`); return r.json(); };
const get = async (u, out) => { const r = await fetch(u, { headers: { "User-Agent": UA }, redirect: "follow" }); if (!r.ok) throw new Error(`${r.status} ${u}`); fs.writeFileSync(out, Buffer.from(await r.arrayBuffer())); };

const only = process.argv.slice(2);
for (const [slug, p] of Object.entries(pick)) {
  if (only.length && !only.includes(slug)) continue;
  if (!only.length && fs.existsSync(path.join(dir, `${slug}-800.jpg`))) continue; // già scaricata
  const title = "File:" + p.file;
  const m = await j(`https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=extmetadata|size&iiextmetadatafilter=LicenseShortName|Artist`);
  const page = Object.values(m.query.pages)[0];
  const ii = page.imageinfo && page.imageinfo[0];
  if (!ii) { console.log("manca", slug); continue; }
  const lic = ii.extmetadata.LicenseShortName.value;
  const artist = String(ii.extmetadata.Artist ? ii.extmetadata.Artist.value : "").replace(/<[^>]+>/g, "").replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
  const artistFinal = artist || (lic === "Public domain" ? "Unknown author (public domain)" : "");
  if (!LICENSE_URL[lic] || !artistFinal) { console.log(`SALTATA ${slug}: licenza "${lic}" o autore "${artist}"`); continue; }
  const enc = encodeURIComponent(p.file.replace(/ /g, "_"));
  const big = path.join(dir, `${slug}-1600.jpg`), small = path.join(dir, `${slug}-800.jpg`);
  await get(`https://commons.wikimedia.org/wiki/Special:FilePath/${enc}?width=1600`, big);
  fs.copyFileSync(big, small);
  try { execFileSync("sips", ["--resampleWidth", "800", small], { stdio: "ignore" }); } catch {}
  const file = path.join(root, "content", "places", `${slug}.json`);
  const card = JSON.parse(fs.readFileSync(file, "utf8"));
  card.image = { file: slug, alt: p.alt, caption: p.caption, credit: artistFinal, license: lic, licenseUrl: LICENSE_URL[lic], source: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}` };
  card.gaps = (card.gaps || []).filter((g) => !/^A photograph under an open licence/.test(g));
  fs.writeFileSync(file, JSON.stringify(card, null, 2) + "\n");
  console.log(`ok ${slug}: ${lic}, ${artist.slice(0, 40)}, ${ii.width}x${ii.height}`);
  await sleep(2500);
}
