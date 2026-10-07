// Scarica da Wikimedia Commons le foto scelte (solo licenze aperte) e le collega alle schede.
// Le scelte sono nella tabella qui sotto; i dati di autore e licenza vengono dall'API di Commons, non scritti a mano.
// Si lancia di rado. Serve rete.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { root } from "./lib.mjs";

const UA = "AfricaOnTheGround/0.1 (educational research; ltonsi13@gmail.com)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pick = {
  "royal-palaces-of-abomey": { file: "Abomey-Königspalast3.jpg", alt: "A long, low palace building in Abomey with earthen walls and a roof, seen from across a sandy courtyard.", caption: "A royal palace at Abomey, Benin." },
  "ruins-of-loropeni": { file: "2016.05-441-131ap wall Loropéni Ruins nr.Loropéni(Poni Prv.),BF sun15may2016-1106h.jpg", alt: "A weathered stone wall of the Loropéni ruins, with trees growing behind it.", caption: "Remains of the defensive walls at the Ruins of Loropéni, May 2016." },
  "cidade-velha": { file: "Cidade Velha Pelourinho square b 2011.jpg", alt: "A small square in Cidade Velha with the stone pillory, low colonial houses and hills behind.", caption: "The square with the historic pillory, Cidade Velha, Santiago island." },
  "historic-town-of-grand-bassam": { file: "800px-Grand-Bassam.jpg", alt: "A colonial-era house in Grand-Bassam with a veranda and wooden shutters.", caption: "A house from the French colonial period in Grand-Bassam." },
  "forts-and-castles-of-ghana": { file: "Cape Coast Castle, Cape Coast, Ghana.JPG", alt: "The white walls and cannon of Cape Coast Castle above the shore.", caption: "Cape Coast Castle, one of the forts in the listed group." },
  "old-towns-of-djenne": { file: "Moschee von Djenné.jpg", alt: "The mud-brick Great Mosque of Djenné with its towers, in front of the Monday market.", caption: "The Great Mosque of Djenné and the Monday market." },
  "historic-centre-of-agadez": { file: "1997 277-9A Agadez mosque cropped.jpg", alt: "The tall mud-brick minaret of the mosque in Agadez.", caption: "The mosque in Agadez, photographed in 1997." },
  "osun-osogbo-sacred-grove": { file: "Osun groove Osogbo.jpg", alt: "Sculptures among dense trees in the Osun-Osogbo sacred grove.", caption: "The Osun-Osogbo sacred grove." },
  "island-of-goree": { file: "Ile-de-goree.jpg", alt: "Gorée seen from the water, with low coloured houses along the shore.", caption: "Île de Gorée seen from the sea." },
  "koutammakou": { file: "Togo Taberma house 02.jpg", alt: "A Tammari earthen house with granaries and forked poles, in open countryside.", caption: "A Tammari house with granaries, Koutammakou." }
};
const LICENSE_URL = { "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/", "CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/", "CC BY-SA 3.0 igo": "https://creativecommons.org/licenses/by-sa/3.0/igo/", "CC BY-SA 2.0": "https://creativecommons.org/licenses/by-sa/2.0/", "CC BY 2.0": "https://creativecommons.org/licenses/by/2.0/", "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/" };
const dir = path.join(root, "src", "img", "places");
fs.mkdirSync(dir, { recursive: true });
const j = async (u) => { const r = await fetch(u, { headers: { "User-Agent": UA } }); if (!r.ok) throw new Error(`${r.status} ${u}`); return r.json(); };
const get = async (u, out) => { const r = await fetch(u, { headers: { "User-Agent": UA }, redirect: "follow" }); if (!r.ok) throw new Error(`${r.status} ${u}`); fs.writeFileSync(out, Buffer.from(await r.arrayBuffer())); };

const only = process.argv.slice(2);
for (const [slug, p] of Object.entries(pick)) {
  if (only.length && !only.includes(slug)) continue;
  const title = "File:" + p.file;
  const m = await j(`https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=extmetadata|size&iiextmetadatafilter=LicenseShortName|Artist`);
  const page = Object.values(m.query.pages)[0];
  const ii = page.imageinfo && page.imageinfo[0];
  if (!ii) { console.log("manca", slug); continue; }
  const lic = ii.extmetadata.LicenseShortName.value;
  const artist = String(ii.extmetadata.Artist ? ii.extmetadata.Artist.value : "").replace(/<[^>]+>/g, "").replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
  if (!LICENSE_URL[lic] || !artist) { console.log(`SALTATA ${slug}: licenza "${lic}" o autore "${artist}"`); continue; }
  const enc = encodeURIComponent(p.file.replace(/ /g, "_"));
  const big = path.join(dir, `${slug}-1600.jpg`), small = path.join(dir, `${slug}-800.jpg`);
  await get(`https://commons.wikimedia.org/wiki/Special:FilePath/${enc}?width=1600`, big);
  fs.copyFileSync(big, small);
  try { execFileSync("sips", ["--resampleWidth", "800", small], { stdio: "ignore" }); } catch {}
  const file = path.join(root, "content", "places", `${slug}.json`);
  const card = JSON.parse(fs.readFileSync(file, "utf8"));
  card.image = { file: slug, alt: p.alt, caption: p.caption, credit: artist, license: lic, licenseUrl: LICENSE_URL[lic], source: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}` };
  card.gaps = (card.gaps || []).filter((g) => !/^A photograph under an open licence/.test(g));
  fs.writeFileSync(file, JSON.stringify(card, null, 2) + "\n");
  console.log(`ok ${slug}: ${lic}, ${artist.slice(0, 40)}, ${ii.width}x${ii.height}`);
  await sleep(2500);
}
