import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { root } from "./lib.mjs";
import { sleep, LICENSE_URL, makeFetcher } from "./commons.mjs";

const UA = "AfricaOnTheGroundPlaceImages/0.1 (educational site image update; mailto:ltonsi13@gmail.com)";
const { polite } = makeFetcher(UA);
const picks = JSON.parse(fs.readFileSync(path.join(root, "content", "data", "people-image-picks.json"), "utf8"));
const dir = path.join(root, "src", "img", "stories");
const only = process.argv.slice(2);

for (const [slug, p] of Object.entries(picks)) {
  if (only.length && !only.includes(slug)) continue;
  const f = path.join(root, "content", "peoples", `${slug}.json`);
  if (!fs.existsSync(f)) {
    console.log("file non trovato", f);
    continue;
  }
  const prof = JSON.parse(fs.readFileSync(f, "utf8"));

  console.log(`\nElaborazione popolo: ${slug} con file ${p.file}...`);
  const m = await (await polite(`https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent("File:" + p.file)}&prop=imageinfo&iiprop=extmetadata|size&iiextmetadatafilter=LicenseShortName|Artist`)).json();
  const page = Object.values(m.query.pages)[0];
  const ii = page?.imageinfo?.[0];
  if (!ii) {
    console.log("Dati immagine non trovati per", p.file);
    continue;
  }

  const lic = ii.extmetadata.LicenseShortName.value;
  const artist = String(ii.extmetadata.Artist?.value || "").replace(/<[^>]+>/g, "").replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
  if (!LICENSE_URL[lic] || !artist) {
    console.log("Licenza o autore mancanti:", slug, lic, artist);
    continue;
  }

  const name = `people-${slug}`;
  const enc = encodeURIComponent(p.file.replace(/ /g, "_"));
  const w = Math.min(1600, ii.width);
  const tmp = path.join(dir, `${name}.src`);
  const big = path.join(dir, `${name}-1600.jpg`);
  const small = path.join(dir, `${name}-800.jpg`);

  console.log(`Download ${p.file} (${w}px)...`);
  const buf = Buffer.from(await (await polite(`https://commons.wikimedia.org/wiki/Special:FilePath/${enc}?width=${w}`)).arrayBuffer());
  fs.writeFileSync(tmp, buf);

  execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "85", tmp, "--out", big], { stdio: "ignore" });
  fs.unlinkSync(tmp);

  fs.copyFileSync(big, small);
  if (w > 800) {
    execFileSync("sips", ["--resampleWidth", "800", small], { stdio: "ignore" });
  }

  const dims = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", small]).toString();
  const W = +dims.match(/pixelWidth: (\d+)/)[1];
  const H = +dims.match(/pixelHeight: (\d+)/)[1];

  const fig = {
    type: "figure",
    image: {
      file: name,
      alt: p.alt,
      caption: p.caption,
      credit: artist,
      license: lic,
      licenseUrl: LICENSE_URL[lic],
      source: `https://commons.wikimedia.org/wiki/File:${enc}`,
      width: W,
      height: H
    }
  };

  // Aggiorna se già presente in qualche blocco, altrimenti inserisci
  let replaced = false;
  for (const s of prof.sections) {
    for (let i = 0; i < s.blocks.length; i++) {
      if (s.blocks[i].type === "figure") {
        s.blocks[i] = fig;
        replaced = true;
        break;
      }
    }
    if (replaced) break;
  }

  if (!replaced) {
    const sec = prof.sections[0];
    const at = sec.blocks.findIndex((b) => b.type === "p");
    sec.blocks.splice(at + 1, 0, fig);
  }

  fs.writeFileSync(f, JSON.stringify(prof, null, 2) + "\n");
  console.log(`[AGGIORNATO] ${slug}: ${W}x${H}, licenza: ${lic}, autore: ${artist.slice(0, 40)}`);
  await sleep(4000);
}
