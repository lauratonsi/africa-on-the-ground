// Riempie le bozze dei luoghi UNESCO con i dati ufficiali del Patrimonio mondiale (content/data/unesco-whc-africa.json).
// Tocca solo schede "draft" con sezioni vuote, e (per Gorée) aggiunge i dati UNESCO a una scheda già scritta.
// Non inventa nulla: fatti e coordinate vengono dal record UNESCO, che la scheda cita. Si lancia di rado.
import fs from "node:fs";
import path from "node:path";
import { root } from "./lib.mjs";

const rd = (f) => JSON.parse(fs.readFileSync(path.join(root, f), "utf8"));
const U = rd("content/data/unesco-whc-africa.json");
const P = rd("content/data/proposed-sites.json").sites;
const ids = { DZA: 565, AGO: 1511, BEN: 323, BWA: 1021, BFA: 1225, CPV: 1310, CMR: 1745, CAF: 475, TCD: 1400, COM: 1768, COG: 692, CIV: 1322, COD: 63, EGY: 86, ERI: 1550, ETH: 18, GAB: 1147, GHA: 34, GIN: 155, GNB: 1431, KEN: 1055, LSO: 985, LBY: 183, MDG: 950, MWI: 476, MLI: 116, MRT: 750, MUS: 1227, MAR: 170, MOZ: 599, NAM: 1255, NER: 1268, NGA: 1118, RWA: 1586, STP: 1750, SEN: 26, SYC: 185, SLE: 1746, ZAF: 916, SSD: 1808, SDN: 1336, TZA: 173, TGO: 1140, TUN: 36, UGA: 1022, ZMB: 509, ZWE: 364 };
const clean = (s) => String(s).replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/''/g, '"').replace(/\s+/g, " ").trim();
const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const sourcesPath = path.join(root, "content/sources.json");
const S = rd("content/sources.json");
const arr = Array.isArray(S) ? S : S.sources;

for (const [iso, name] of Object.entries(P)) {
  const u = U.sites.find((x) => String(x.id) === String(ids[iso]));
  if (!u) { console.log("manca", iso); continue; }
  const file = path.join(root, "content/places", `${slug(name)}.json`);
  const card = JSON.parse(fs.readFileSync(file, "utf8"));
  const sid = `unesco-whc-${u.id}`;
  const uname = clean(u.name);
  if (!arr.some((x) => x.id === sid)) {
    arr.push({
      id: sid, title: uname, publisher: "UNESCO World Heritage Centre, World Heritage List (open data, CC BY-SA 4.0)",
      url: `https://whc.unesco.org/en/list/${u.id}/`, tier: "institutional", status: "verified",
      note: "Read from UNESCO's open-data record (data.unesco.org, dataset whc001); the web page itself could not be opened from this project's tools. Texts are UNESCO's own.",
      retrieved: U.retrieved
    });
  }
  const hasBody = card.sections && card.sections.length > 0;
  if (hasBody && card.slug !== "island-of-goree") continue;
  const kind = { Cultural: "cultural", Natural: "natural", Mixed: "mixed" }[u.category] || "";
  const facts = [{ label: "Inscribed", value: String(u.inscribed), cite: [sid] }];
  if (u.category) facts.push({ label: "Category", value: u.category, cite: [sid] });
  if (u.criteria) facts.push({ label: "Criteria", value: String(u.criteria).replace(/\)\(/g, ", ").replace(/[()]/g, ""), cite: [sid] });
  if (u.areaHa > 0) facts.push({ label: "Area", value: `${u.areaHa.toLocaleString("en-US")} hectares`, cite: [sid] });
  if (String(u.danger) === "True" && u.dangerList) facts.push({ label: "In Danger", value: `on UNESCO's List of World Heritage in Danger (${String(u.dangerList).replace(/^Y\s*/, "since ")})`, cite: [sid] });
  const nStates = (Array.isArray(u.states) ? u.states : String(u.states).split(",")).length;
  if (u.transboundary === true || String(u.transboundary) === "True") facts.push({ label: "Shared", value: `with ${nStates - 1} other ${nStates - 1 === 1 ? "country" : "countries"}`, cite: [sid] });
  const when = u.inscribed;
  card.name = card.slug === "island-of-goree" ? card.name : uname;
  card.subtitle = `${kind ? `A ${kind} property` : "A property"} on the UNESCO World Heritage List since ${when}.`;
  if (card.slug !== "island-of-goree") card.facts = facts;
  else card.facts = [...facts, ...card.facts.filter((f) => !["Inscribed"].includes(f.label))];
  if (u.coordinates) card.coords = { lat: Number(u.coordinates.lat), lon: Number(u.coordinates.lon), cite: [sid] };
  const unescoSection = { id: "unesco", title: "What UNESCO says", blocks: [{ type: "p", parts: [{ text: `UNESCO describes the property in these words: “${clean(u.short)}”`, cite: [sid] }] }, { type: "facts" }] };
  if (card.slug === "island-of-goree") card.sections = [unescoSection, ...card.sections.filter((s) => s.id !== "what" || true)];
  else card.sections = [unescoSection];
  card.gaps = [
    "Independent sources. UNESCO's text is the institution's own account, so it is one voice. Add scholarly work and reporting before this card is published.",
    ...(u.coordinates ? [] : ["Coordinates: the UNESCO record has none for this property."]),
    "A photograph under an open licence.",
    "Local voices: none yet."
  ];
  fs.writeFileSync(file, JSON.stringify(card, null, 2) + "\n");
}
fs.writeFileSync(sourcesPath, JSON.stringify(S, null, 2) + "\n");
console.log("fatto");
