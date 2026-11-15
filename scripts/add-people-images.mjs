// Scarica da Wikimedia Commons la foto scelta per ogni scheda di popolo (solo licenze aperte) e la inserisce come blocco "figure".
// Scelte in content/data/people-image-picks.json: { "<slug-popolo>": { file, alt, caption } }. Solo paesaggi, oggetti, architetture, scrittura: mai ritratti.
// Autore e licenza vengono dall'API di Commons. Intestazione generica. Serve rete.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { root } from "./lib.mjs";

const UA = "AfricaOnTheGroundPlaceImages/0.1 (open-licence images for an educational site)";
const LIC = { "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/", "CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/", "CC BY-SA 2.0": "https://creativecommons.org/licenses/by-sa/2.0/", "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/", "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/", "CC BY 2.0": "https://creativecommons.org/licenses/by/2.0/", "Public domain": "https://creativecommons.org/publicdomain/mark/1.0/", "CC0": "https://creativecommons.org/publicdomain/zero/1.0/" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const polite = async (u) => { for (let i = 0; i < 6; i++) { const r = await fetch(u, { headers: { "User-Agent": UA }, redirect: "follow" }); if (r.status !== 429 && r.status !== 503) { if (!r.ok) throw new Error(`${r.status} ${u}`); return r; } await sleep(20000 * (i + 1)); } throw new Error("troppi tentativi"); };
const picks = JSON.parse(fs.readFileSync(path.join(root, "content", "data", "people-image-picks.json"), "utf8"));
const dir = path.join(root, "src", "img", "stories");
const only = process.argv.slice(2);
for (const [slug, p] of Object.entries(picks)) {
  if (only.length && !only.includes(slug)) continue;
  const f = path.join(root, "content", "peoples", `${slug}.json`);
  const prof = JSON.parse(fs.readFileSync(f, "utf8"));
  if (prof.sections.some((s) => s.blocks.some((b) => b.type === "figure"))) { console.log("già presente", slug); continue; }
  const m = await (await polite(`https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent("File:" + p.file)}&prop=imageinfo&iiprop=extmetadata|size&iiextmetadatafilter=LicenseShortName|Artist`)).json();
  const ii = Object.values(m.query.pages)[0].imageinfo?.[0];
  const lic = ii.extmetadata.LicenseShortName.value;
  const artist = String(ii.extmetadata.Artist?.value || "").replace(/<[^>]+>/g, "").replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
  if (!LIC[lic] || !artist) { console.log("SALTATA", slug, lic, artist); continue; }
  const name = `people-${slug}`, enc = encodeURIComponent(p.file.replace(/ /g, "_")), w = Math.min(1600, ii.width);
  const tmp = path.join(dir, `${name}.src`), big = path.join(dir, `${name}-1600.jpg`), small = path.join(dir, `${name}-800.jpg`);
  fs.writeFileSync(tmp, Buffer.from(await (await polite(`https://commons.wikimedia.org/wiki/Special:FilePath/${enc}?width=${w}`)).arrayBuffer()));
  execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "85", tmp, "--out", big], { stdio: "ignore" });
  fs.unlinkSync(tmp); fs.copyFileSync(big, small); if (w > 800) execFileSync("sips", ["--resampleWidth", "800", small], { stdio: "ignore" });
  const dims = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", small]).toString();
  const W = +dims.match(/pixelWidth: (\d+)/)[1], H = +dims.match(/pixelHeight: (\d+)/)[1];
  const fig = { type: "figure", image: { file: name, alt: p.alt, caption: p.caption, credit: artist, license: lic, licenseUrl: LIC[lic], source: `https://commons.wikimedia.org/wiki/File:${enc}`, width: W, height: H } };
  const sec = prof.sections[0]; const at = sec.blocks.findIndex((b) => b.type === "p");
  sec.blocks.splice(at + 1, 0, fig);
  fs.writeFileSync(f, JSON.stringify(prof, null, 2) + "\n");
  console.log("ok", slug, lic, artist.slice(0, 40), `${W}x${H}`);
  await sleep(6000);
}
