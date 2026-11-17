import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { root } from "./lib.mjs";
import { sleep, LICENSE_URL, makeFetcher } from "./commons.mjs";

const UA = "AfricaOnTheGroundPlaceImages/0.1 (open-licence images for an educational site)";
const { j, get: getRaw } = makeFetcher(UA);
const get = (u, out) => getRaw(u, out, fs);

const artPicks = {
  "ife-heads-and-the-national-museum-of-ife": {
    file: "Arte yoruba, nigeria, testa da ife, 12-15mo secolo.JPG",
    alt: "Testa in lega di rame (bronzo) di Ife, arte yoruba del XII-XV secolo.",
    caption: "Testa in lega di rame di Ife (XII-XV secolo), espressione dell'arte metallurgica yoruba."
  },
  "kuba-cloth-and-kuba-royal-art": {
    file: "Man's status cloth, Shoowa people, early 20th century, raffia palm fiber, plain weave, cut-pile embroidery, HMA.jpg",
    alt: "Tessuto reale kuba (Shoowa) in fibra di palma rafia ricamata con motivi geometrici.",
    caption: "Tessuto cerimoniale kuba in fibra di rafia con decorazioni a rilievo, inizio XX secolo."
  },
  "nok-terracotta-sculptures-and-the-jos-museum": {
    file: "Erected Nok Terracotta.jpg",
    alt: "Scultura in terracotta della cultura Nok con caratteristici occhi triangolari traforati.",
    caption: "Figura in terracotta della cultura Nok (Nigeria centrale), databile al I millennio a.C."
  },
  "national-art-gallery-of-namibia": {
    file: "National Museum of Namibia.jpg",
    alt: "L'edificio storico e le collezioni d'arte e storia a Windhoek, Namibia.",
    caption: "Sede museale e culturale a Windhoek, custode del patrimonio storico e artistico namibiano."
  },
  "musee-des-civilisations-noires-dakar": {
    file: "Musée des civilisations noires 2022.jpg",
    alt: "L'imponente edificio circolare del Musée des Civilisations Noires a Dakar.",
    caption: "Il Musée des Civilisations Noires a Dakar, inaugurato nel 2018 per valorizzare le culture africane e della diaspora."
  },
  "musee-national-du-mali-bamako": {
    file: "Au Musée National du Mali - Bamako, MALI.jpg",
    alt: "Facciata in pietra arenaria locale del Musée National du Mali a Bamako.",
    caption: "Il Musée National du Mali a Bamako, costruito in pietra locale e immerso nel parco botanico."
  },
  "musee-ethnographique-adande-porto-novo": {
    file: "Gate of Porto Novo ethnographic museum Benin Dec 2017.jpg",
    alt: "Ingresso del Musée Ethnographique Alexandre Sènou Adandé a Porto-Novo, Benin.",
    caption: "Ingresso del museo etnografico di Porto-Novo, celebre per la collezione di maschere Gèlèdé."
  },
  "musee-honme-porto-novo": {
    file: "Honmé2.jpg",
    alt: "Corte interna e architettura tradizionale del palazzo reale di Hogbonou (Musée Honmè) a Porto-Novo.",
    caption: "Corte interna del Musée Honmè, antico palazzo dei sovrani del regno di Hogbonou a Porto-Novo."
  },
  "musee-national-des-beaux-arts-algiers": {
    file: "The National Museum of Fine Arts in Algiers.jpg",
    alt: "L'edificio monumentale del Musée National des Beaux-Arts d'Alger nel quartiere di Hamma.",
    caption: "Il Musée National des Beaux-Arts d'Alger, inaugurato nel 1930 di fronte al Giardino d'Essai di Hamma."
  },
  "musee-mohammed-vi-rabat": {
    file: "MMVI.JPG",
    alt: "Facciata moderna arabeggiante del Musée Mohammed VI d'Art Moderne et Contemporain a Rabat.",
    caption: "Il Musée Mohammed VI d'Art Moderne et Contemporain a Rabat, aperto nel 2014."
  },
  "bardo-national-museum-tunis": {
    file: "Virgil Mosaic Bardo Museum Tunis.jpg",
    alt: "Il celebre mosaico romano del poeta Virgilio seduto tra le muse Clio e Melpomene, conservato al Museo del Bardo.",
    caption: "Il celebre mosaico di Virgilio (III secolo d.C.), fiore all'occhiello della collezione di mosaici romani del Museo del Bardo a Tunisi."
  },
  "egyptian-museum-tahrir-cairo": {
    file: "Facade of the Egyptian Museum, Tahrir Square, Cairo, Egypt1.jpg",
    alt: "La storica facciata neoclassica rosa del Museo Egizio in piazza Tahrir al Cairo.",
    caption: "La storica facciata neoclassica del Museo Egizio in piazza Tahrir al Cairo, inaugurato nel 1902."
  },
  "musee-national-de-sandervalia-conakry": {
    file: "Musée National de Guinée 27042022 005.jpg",
    alt: "Padiglione e cortile alberato del Musée National de Sandervalia a Conakry.",
    caption: "Il Musée National de Sandervalia a Conakry, sede del patrimonio etnografico della Guinea."
  },
  "musee-national-de-la-rdc-kinshasa": {
    file: "Lokolé au Musée National de la République démocratique du Congo.jpg",
    alt: "Tamburo a fessura tradizionale lokolé esposto nelle gallerie del Musée National de la RDC a Kinshasa.",
    caption: "Tamburo a fessura lokolé esposto nelle moderne gallerie del MNRDC a Kinshasa."
  },
  "musee-national-du-tchad-ndjamena": {
    file: "Musée national 2.jpg",
    alt: "Galleria espositiva del Musée National du Tchad a N'Djamena.",
    caption: "Sale espositive del Musée National du Tchad a N'Djamena, custode delle tradizioni Sao e paleontologiche."
  },
  "sierra-leone-national-museum-freetown": {
    file: "National Museum of Sierra Leone at Cotton tree in Freetown - Mapillary (Yp2BPDsT7TyNtrN6lZ4z9Q).jpg",
    alt: "L'edificio storico della vecchia stazione ferroviaria che ospita il National Museum of Sierra Leone a Freetown.",
    caption: "Il National Museum of Sierra Leone, allestito nella storica ex stazione ferroviaria accanto al Cotton Tree a Freetown."
  },
  "national-museum-of-the-gambia-banjul": {
    file: "A life-sized model of the Kankurang, outside the National Museum, Banjul, The Gambia.jpg",
    alt: "Figura a grandezza naturale del Kankurang mascherato all'esterno del National Museum di Banjul.",
    caption: "Modello del Kankurang (spirito mascherato mandinka) davanti al National Museum di Banjul."
  },
  "musee-national-boubou-hama-niamey": {
    file: "Zoo du Musée national de Niamey.jpg",
    alt: "Padiglioni e parco del Musée National Boubou Hama a Niamey.",
    caption: "Il complesso museale all'aperto Boubou Hama a Niamey, tra artigianato, habitat tradizionali e fauna saheliana."
  },
  "musee-national-des-arts-rites-et-traditions-libreville": {
    file: "Vue sur l'entrée du musée national des arts et traditions du Gabon.jpg",
    alt: "Ingresso del Musée National des Arts, Rites et Traditions du Gabon a Libreville.",
    caption: "Ingresso del museo nazionale a Libreville, custode di reliquiari Kota e sculture rituali Bwiti."
  },
  "somali-national-museum": {
    file: "Old fort Mogadishu.jpg",
    alt: "L'antico forte ottomano e storico palazzo museale a Mogadiscio.",
    caption: "Il forte storico di Mogadiscio, sede originaria delle collezioni museali e numismatiche somale."
  },
  "national-museum-of-sudan-khartoum": {
    file: "Sudan National Museum (8625532907).jpg",
    alt: "L'ingresso del National Museum of Sudan lungo Nile Avenue a Khartoum.",
    caption: "L'ingresso del Museo Nazionale del Sudan a Khartoum, custode dei templi nubiani salvati dalle acque e degli affreschi di Faras."
  },
  "dak-art-the-dakar-biennale-of-contemporary-afric": {
    file: "Dak'Art 2018 51.jpg",
    alt: "Installazione d'arte contemporanea durante l'edizione della Biennale Dak'Art a Dakar.",
    caption: "Installazione artistica durante la Biennale Dak'Art a Dakar, principale piattaforma panafricana di arti visive contemporanee."
  },
  "royal-palace-and-museum-of-foumban-bamum-kingdom": {
    file: "Palais royal de FOUMBAN.jpg",
    alt: "La facciata del palazzo reale dei sovrani Bamum a Foumban, Camerun.",
    caption: "Il palazzo reale e museo di Foumban, edificato sotto il regno del celebre re Njoya."
  },
  "zeitz-museum-of-contemporary-art-africa-zeitz-mo": {
    file: "Zeitz Museum of Contemporary Art Africa, Cape Town ( 1050775).jpg",
    alt: "L'edificio riconvertito del silos del grano che ospita lo Zeitz MOCAA al V&A Waterfront di Città del Capo.",
    caption: "Lo Zeitz MOCAA a Città del Capo, ricavato nell'imponente struttura di un ex silos granario degli anni '20."
  },
  "academie-des-beaux-arts-kinshasa": {
    file: "Académie des Beaux-Arts, Kinshasa.jpg",
    alt: "Giardino delle sculture e padiglioni dell'Académie des Beaux-Arts a Kinshasa.",
    caption: "Il campus e parco di sculture dell'Académie des Beaux-Arts di Kinshasa, polo storico dell'arte congolese."
  },
  "inema-arts-center": {
    file: "Inema Art Center.jpg",
    alt: "Opere pittoriche e sculture colorate all'Inema Arts Center di Kigali.",
    caption: "Spazio espositivo dell'Inema Arts Center a Kigali, fondato per promuovere l'arte contemporanea ruandese."
  },
  "chapungu-sculpture-park": {
    file: "Never Been Kissed by Bernard Sakarombe.jpg",
    alt: "Scultura monumentale in serpentina dello scultore zimbabwese Bernard Sakarombe al Chapungu Sculpture Park.",
    caption: "Scultura in pietra ('Never Been Kissed' di Bernard Sakarombe) esposta al Chapungu Sculpture Park di Harare."
  },
  "namibia-craft-centre-old-breweries-building": {
    file: "Crafts and Arts Namibia - Windhoek.jpg",
    alt: "Artigianato, tessuti e intagli in esposizione a Windhoek, Namibia.",
    caption: "Artigianato tradizionale ed etnico in esposizione a Windhoek, nel complesso delle Old Breweries."
  },
  "bogolanfini-mud-cloth-mali": {
    file: "BogolanMali4.JPG",
    alt: "Tessuto bogolan con motivi geometrici tradizionali dipinti con fango fluviale fermentato in Mali.",
    caption: "Tessuto bogolan tradizionale del Mali, realizzato tingendo cotone con pigmenti vegetali e fango fermentato."
  },
  "dogon-masks-and-the-dama-ceremony": {
    file: "Dogon Mask.jpg",
    alt: "Maschera rituale lignea dogon intagliata con figure stilizzate.",
    caption: "Maschera tradizionale dogon, utilizzata nelle danze della società Awa durante il rito funebre del Dama."
  },
  "igun-street-bronze-casters-igun-eronmwon-benin-c": {
    file: "Commemorative Head of a King (Oba) Edo, Benin City, southern Nigeria, 18-19 century CE, MAA.jpg",
    alt: "Testa commemorativa in bronzo di un Oba del Regno del Benin, realizzata dalla gilda dei fonditori di Igun Street.",
    caption: "Testa commemorativa reale in bronzo di un Oba (Regno del Benin), capolavoro della metallurgia di Igun Street."
  },
  "kente-weaving-at-bonwire-and-among-the-ewe": {
    file: "Different Kente cloth, Tafi, Volta region.jpg",
    alt: "Strisce di tessuto kente con brillanti motivi geometrici intrecciati su telaio tradizionale in Ghana.",
    caption: "Panni kente con intricati disegni geometrici simbolici, tessuti a mano in Ghana."
  },
  "makonde-carving": {
    file: "Makonde carving 2.jpg",
    alt: "Scultura 'albero della vita' (ujamaa) in legno d'ebano africano intagliata da artigiani Makonde.",
    caption: "Scultura makonde in ebano in stile Ujamaa (albero della vita), raffigurante figure umane intrecciate."
  },
  "ndebele-painted-houses": {
    file: "Ndebele Architecture.jpg",
    alt: "Casa tradizionale ndebele con vivaci decorazioni murali geometriche dipinte a mano in Sudafrica.",
    caption: "Architettura e pittura murale geometrica ndebele, espressione dell'identità visiva femminile nel Gauteng e Mpumalanga."
  }
};

const dir = path.join(root, "src", "img", "places");
fs.mkdirSync(dir, { recursive: true });

const picksFile = path.join(root, "content", "data", "place-image-picks.json");
const existingPicks = fs.existsSync(picksFile) ? JSON.parse(fs.readFileSync(picksFile, "utf8")) : {};

// Aggiorna place-image-picks.json
for (const [slug, item] of Object.entries(artPicks)) {
  existingPicks[slug] = {
    file: item.file,
    alt: item.alt,
    caption: item.caption
  };
}
fs.writeFileSync(picksFile, JSON.stringify(existingPicks, null, 2) + "\n");
console.log("place-image-picks.json aggiornato.");

const only = process.argv.slice(2);

for (const [slug, p] of Object.entries(artPicks)) {
  if (only.length && !only.includes(slug)) continue;
  const cardFile = path.join(root, "content", "places", `${slug}.json`);
  if (!fs.existsSync(cardFile)) {
    console.log(`[SALTA] Scheda non trovata: ${slug}`);
    continue;
  }
  const card = JSON.parse(fs.readFileSync(cardFile, "utf8"));
  if (card.image && fs.existsSync(path.join(dir, `${slug}-800.jpg`))) {
    console.log(`[GIA FATTO] ${slug}`);
    continue;
  }

  const title = "File:" + p.file;
  console.log(`Elaborazione ${slug} -> ${title}...`);
  try {
    const m = await j(`https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=extmetadata|size&iiextmetadatafilter=LicenseShortName|Artist`);
    const page = Object.values(m.query?.pages || {})[0];
    const ii = page?.imageinfo?.[0];
    if (!ii) {
      console.log(`[ERRORE] File non trovato su Commons: ${title}`);
      continue;
    }
    const lic = ii.extmetadata?.LicenseShortName?.value || "Public domain";
    const artist = String(ii.extmetadata?.Artist ? ii.extmetadata.Artist.value : "")
      .replace(/<[^>]+>/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^(.{3,}?)\1$/, "$1");
    const artistFinal = artist || (lic.toLowerCase().includes("public domain") || lic === "CC0" ? "Unknown author (public domain)" : "Unknown");

    const enc = encodeURIComponent(p.file.replace(/ /g, "_"));
    const w = Math.min(1600, ii.width);
    const tmp = path.join(dir, `${slug}.src`);
    const big = path.join(dir, `${slug}-1600.jpg`);
    const small = path.join(dir, `${slug}-800.jpg`);

    console.log(`  Scaricamento ${w}px...`);
    await get(`https://commons.wikimedia.org/wiki/Special:FilePath/${enc}?width=${w}`, tmp);

    execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "85", tmp, "--out", big], { stdio: "ignore" });
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);

    fs.copyFileSync(big, small);
    if (w > 800) {
      execFileSync("sips", ["--resampleWidth", "800", small], { stdio: "ignore" });
    }

    card.image = {
      file: slug,
      alt: p.alt,
      caption: p.caption,
      credit: artistFinal,
      license: lic,
      licenseUrl: LICENSE_URL[lic] || "https://creativecommons.org/publicdomain/mark/1.0/",
      source: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.file.replace(/ /g, "_"))}`
    };
    card.gaps = (card.gaps || []).filter((g) => !/^A photograph under an open licence/.test(g));
    fs.writeFileSync(cardFile, JSON.stringify(card, null, 2) + "\n");
    console.log(`[OK] ${slug}: ${lic}, ${artistFinal}, file salvato.`);
    await sleep(3500);
  } catch (err) {
    console.error(`[ERRORE] ${slug}:`, err.message);
  }
}
