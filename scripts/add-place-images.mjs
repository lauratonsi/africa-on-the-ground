// Scarica da Wikimedia Commons la foto scelta per le schede dei luoghi nuove (solo licenze aperte) e la collega alla scheda.
// Le scelte sono in content/data/place-image-picks.json: { "<slug-scheda>": { file, alt, caption } }.
// Autore e licenza vengono dall'API di Commons. Intestazione generica: nessun dato personale nelle richieste. Serve rete.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { root } from "./lib.mjs";

const UA = "AfricaOnTheGroundPlaceImages/0.1 (open-licence images for an educational site)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const picks = JSON.parse(fs.readFileSync(path.join(root, "content", "data", "place-image-picks.json"), "utf8"));
const LICENSE_URL = { "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/", "Public domain": "https://creativecommons.org/publicdomain/mark/1.0/", "CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/", "CC BY-SA 2.0": "https://creativecommons.org/licenses/by-sa/2.0/", "CC BY 2.0": "https://creativecommons.org/licenses/by/2.0/", "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/", "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/", "CC0": "https://creativecommons.org/publicdomain/zero/1.0/" };
const dir = path.join(root, "src", "img", "places");
fs.mkdirSync(dir, { recursive: true });
const polite = async (u, opts) => {
  for (let i = 0; i < 6; i++) {
    const r = await fetch(u, { ...opts, headers: { "User-Agent": UA } });
    if (r.status !== 429 && r.status !== 503) { if (!r.ok) throw new Error(`${r.status} ${u}`); return r; }
    const wait = (Number(r.headers.get("retry-after")) || 20 * (i + 1)) * 1000;
    console.log(`  ${r.status}: attendo ${Math.round(wait / 1000)} s`);
    await sleep(wait);
  }
  throw new Error(`troppi tentativi: ${u}`);
};
const j = async (u) => (await polite(u, {})).json();
const get = async (u, out) => { const r = await polite(u, { redirect: "follow" }); fs.writeFileSync(out, Buffer.from(await r.arrayBuffer())); };
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
