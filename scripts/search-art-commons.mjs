import fs from "node:fs";
import path from "node:path";
import { root } from "./lib.mjs";
import { LICENSE_URL, makeFetcher } from "./commons.mjs";

const UA = "AfricaOnTheGroundArtSearch/0.1 (finding open-licence images for an educational site)";
const { j } = makeFetcher(UA);

const searchTargets = [
  { slug: "ife-heads-and-the-national-museum-of-ife", query: "Ife bronze head" },
  { slug: "kuba-cloth-and-kuba-royal-art", query: "Kuba cloth" },
  { slug: "nok-terracotta-sculptures-and-the-jos-museum", query: "Nok terracotta" },
  { slug: "national-art-gallery-of-namibia", query: "National Art Gallery of Namibia" },
  { slug: "musee-des-civilisations-noires-dakar", query: "Musée des civilisations noires Dakar" },
  { slug: "musee-national-du-mali-bamako", query: "Musée national du Mali" },
  { slug: "musee-ethnographique-adande-porto-novo", query: "Musée ethnographique Porto-Novo" },
  { slug: "musee-honme-porto-novo", query: "Musée Honmè" },
  { slug: "musee-national-des-beaux-arts-algiers", query: "Musée national des beaux-arts d'Alger" },
  { slug: "musee-mohammed-vi-rabat", query: "Musée Mohammed VI d'art moderne et contemporain" },
  { slug: "bardo-national-museum-tunis", query: "Musée national du Bardo" },
  { slug: "egyptian-museum-tahrir-cairo", query: "Egyptian Museum Cairo exterior" },
  { slug: "musee-national-de-sandervalia-conakry", query: "Musée national de Sandervalia" },
  { slug: "musee-national-de-la-rdc-kinshasa", query: "Musée national de la République démocratique du Congo" },
  { slug: "musee-national-du-tchad-ndjamena", query: "Musée national du Tchad" },
  { slug: "sierra-leone-national-museum-freetown", query: "Sierra Leone National Museum" },
  { slug: "national-museum-of-the-gambia-banjul", query: "National Museum Banjul" },
  { slug: "musee-national-boubou-hama-niamey", query: "Musée national Boubou Hama" },
  { slug: "musee-national-des-arts-rites-et-traditions-libreville", query: "Musée national des arts et traditions Gabon" },
  { slug: "somali-national-museum", query: "Somali National Museum" },
  { slug: "national-museum-of-sudan-khartoum", query: "National Museum of Sudan" },
  { slug: "dak-art-the-dakar-biennale-of-contemporary-afric", query: "Dak'Art Biennale" },
  { slug: "royal-palace-and-museum-of-foumban-bamum-kingdom", query: "Palais royal de Foumban" },
  { slug: "zeitz-museum-of-contemporary-art-africa-zeitz-mo", query: "Zeitz MOCAA" },
  { slug: "academie-des-beaux-arts-kinshasa", query: "Académie des Beaux-Arts Kinshasa" },
  { slug: "inema-arts-center", query: "Inema Arts Center" },
  { slug: "chapungu-sculpture-park", query: "Chapungu Sculpture Park" },
  { slug: "namibia-craft-centre-old-breweries-building", query: "Old Breweries Windhoek craft" },
  { slug: "bogolanfini-mud-cloth-mali", query: "Bògòlanfini" },
  { slug: "dogon-masks-and-the-dama-ceremony", query: "Dogon mask" },
  { slug: "igun-street-bronze-casters-igun-eronmwon-benin-c", query: "Benin bronze" },
  { slug: "kente-weaving-at-bonwire-and-among-the-ewe", query: "Kente cloth" },
  { slug: "makonde-carving", query: "Makonde carving" },
  { slug: "ndebele-painted-houses", query: "Ndebele house" }
];

const results = {};

for (const t of searchTargets) {
  try {
    const sUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(t.query)}&srnamespace=6&srlimit=6`;
    const sRes = await j(sUrl);
    const hits = sRes.query?.search || [];
    let chosen = null;
    for (const hit of hits) {
      const title = hit.title;
      const iUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=extmetadata|size&iiextmetadatafilter=LicenseShortName|Artist`;
      const iRes = await j(iUrl);
      const page = Object.values(iRes.query?.pages || {})[0];
      const ii = page?.imageinfo?.[0];
      if (!ii || ii.width < 400) continue;
      const lic = ii.extmetadata?.LicenseShortName?.value;
      const artist = String(ii.extmetadata?.Artist ? ii.extmetadata.Artist.value : "").replace(/<[^>]+>/g, "").replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
      const artistFinal = artist || (lic === "Public domain" ? "Unknown author (public domain)" : "");
      if (LICENSE_URL[lic] && artistFinal) {
        chosen = {
          file: title.replace(/^File:/, ""),
          lic,
          artist: artistFinal.slice(0, 50),
          width: ii.width,
          height: ii.height
        };
        break;
      }
    }
    results[t.slug] = chosen;
    console.log(`${t.slug}: ${chosen ? chosen.file + " (" + chosen.lic + ")" : "NO HIT"}`);
  } catch (err) {
    console.error(`Error for ${t.slug}:`, err.message);
  }
}

fs.writeFileSync(path.join(root, "content", "data", "found-art-images.json"), JSON.stringify(results, null, 2));
