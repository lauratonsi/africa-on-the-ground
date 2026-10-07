// Lingue africane nominate nel testo del Factbook per ogni paese, ufficiali o no.
// Il Factbook scrive le lingue in modo diverso da paese a paese (gruppi, varianti, nomi di popoli): qui le voci vengono
// riconosciute con un elenco scritto a mano di nomi e varianti. Ciò che non si riconosce non viene contato, e lo diciamo.
// Restano fuori: arabo, afrikaans, lingue europee e asiatiche (sono già nel conteggio delle lingue ufficiali) e i creoli.
import { items, decode } from "./profiles.mjs";

// [nome, varianti (regex senza distinzione tra maiuscole), gruppo per il quiz]
const T = [
  ["Fula", "fula|fulani|pular|pulaar|fulfulde|fufulde|peuhl|foulfoulbe", "west"],
  ["Swahili", "swahili|kiswahili|kingwana|kiunguja", "east"],
  ["Tamazight (Berber)", "tamazight|tachelhit|tarifit|kabyle|taqbaylit|shawiya|tacawit|mzab|tuareg|tamahaq|tamasheq|tamashek|tamacheq|tagdal|nafusi|ghadamis|suknah|awjilah", "north"],
  ["Hausa", "hausa", "west"], ["Yoruba", "yoruba", "west"], ["Igbo", "igbo|ibo", "west"], ["Kanuri", "kanuri", "west"],
  ["Zarma-Songhay", "zarma|djerma|sonrhai|songhai|songhay", "west"],
  ["Wolof", "wolof", "west"], ["Mandinka", "mandinka|mandingo|malinke|maninka", "west"], ["Bambara", "bambara", "west"],
  ["Dyula", "dyula|dioula|jula", "west"], ["Soninke", "soninke|maraka", "west"], ["Serer", "serer", "west"], ["Jola", "jola", "west"],
  ["Susu", "susu", "west"], ["Mende", "mende", "west"], ["Temne", "temne", "west"], ["Ewe", "\\bewe\\b", "west"],
  ["Akan (Twi, Fante, Asante)", "asante|fante|akyem|akan|\\btwi\\b|brong|boron", "west"], ["Ga-Dangme", "\\bga\\b|dangme", "west"],
  ["Dagomba", "dagomba", "west"], ["Mossi", "mossi", "west"], ["Kabye", "kabye|kabiye", "west"], ["Fon", "\\bfon\\b", "west"],
  ["Senufo", "senufo|senoufo", "west"], ["Dogon", "dogon", "west"], ["Bariba", "bariba", "west"],
  ["Amharic", "amharic", "horn"], ["Oromo", "oromo", "horn"], ["Tigrinya", "tigrinya|tigrigna", "horn"], ["Tigre", "\\btigre\\b", "horn"],
  ["Somali", "somali", "horn"], ["Afar", "\\bafar\\b", "horn"], ["Sidamo", "sidamo", "horn"], ["Wolaytta", "wolaytta", "horn"],
  ["Gurage", "gurage", "horn"], ["Hadiyya", "hadiyya", "horn"], ["Gamo", "\\bgamo\\b", "horn"], ["Gedeo", "gedeo", "horn"], ["Kafa", "\\bkafa\\b", "horn"],
  ["Beja", "ta bedawie|\\bbeja\\b", "horn"],
  ["Dinka", "(?<![a-z])dinka", "nilotic"], ["Nuer", "\\bnuer\\b", "nilotic"], ["Bari", "\\bbari\\b", "nilotic"], ["Zande", "zande", "nilotic"],
  ["Shilluk", "shilluk", "nilotic"], ["Nubian", "nubian", "nilotic"], ["Fur", "\\bfur\\b", "nilotic"],
  ["Luganda", "luganda|\\bganda\\b", "east"], ["Kinyarwanda", "kinyarwanda", "east"], ["Kirundi", "kirundi", "east"],
  ["Lingala", "lingala|monokutuba", "central"], ["Kikongo", "kikongo|\\bkongo\\b|fiote", "central"], ["Tshiluba", "tshiluba", "central"],
  ["Sango", "sangho|sango", "central"], ["Fang", "\\bfang\\b", "central"], ["Sara", "\\bsara\\b", "central"],
  ["Chewa (Nyanja)", "chewa|chichewa|nyanja", "south"], ["Bemba", "bemba", "south"], ["Lozi", "lozi", "south"], ["Tumbuka", "tumbuka", "south"],
  ["Yao", "\\byao\\b", "south"], ["Lomwe", "lomwe", "south"], ["Makhuwa", "makhuwa", "south"], ["Tsonga", "tsonga|xitsonga|\\btswa\\b", "south"],
  ["Shona", "shona|zezuru", "south"], ["Ndebele", "ndebele", "south"], ["Zulu", "zulu", "south"], ["Xhosa", "xhosa", "south"],
  ["Swati", "swati|siswati", "south"], ["Venda", "venda|tshivenda", "south"], ["Pedi (Northern Sotho)", "sepedi|\\bpedi\\b", "south"],
  ["Tswana", "tswana|setswana", "south"], ["Sotho", "sesotho|\\bsotho\\b", "south"], ["Herero", "herero", "south"],
  ["Oshiwambo", "oshiwambo", "south"], ["Nama-Damara", "nama/damara", "south"], ["Luvale", "luvale", "south"], ["Chokwe", "chokwe", "south"],
  ["Umbundu", "umbundu", "south"], ["Kimbundu", "kimbundu", "south"], ["Lunda", "lunda", "south"], ["Kaonde", "kaonde", "south"],
  ["Bobo", "\\bbobo\\b", "west"], ["Lobi", "\\blobi\\b", "west"], ["Bissa", "\\bbissa\\b", "west"], ["Dagara", "dagara|dagarte|dagaba", "west"],
  ["Gurunsi", "gurunsi", "west"], ["Konkomba", "kokomba|konkomba", "west"], ["Kunama", "kunama", "horn"],
  ["Tonga", "\\btonga\\b", "south"], ["Sena", "\\bsena\\b", "south"], ["Ndau", "\\bndau\\b", "south"], ["Nsenga", "nsenga", "south"],
  ["Lala", "\\blala\\b", "south"], ["Lamba", "\\blamba\\b", "south"], ["Bisa", "\\bbisa\\b", "south"], ["Mambwe", "mambwe", "south"],
  ["Namwanga", "namwanga", "south"], ["Lenje", "lenje", "south"], ["Myene", "myene", "central"], ["Nzebi", "nzebi", "central"],
  ["Malagasy", "malagasy", "indian"], ["Comorian", "comorian|shikomoro", "indian"]
];
export const LANGS = T.map(([name, re, group]) => ({ name, re: new RegExp(re, "i"), group }));

// Per un paese: le lingue riconosciute (con l'indicazione se il Factbook le dà come ufficiali) e le voci non riconosciute.
export function spokenLanguages(text) {
  const found = new Map(), unmatched = [];
  for (const raw of items(decode(text).replace(/<br>/g, " "))) {
    // "similar to Swahili" descrive un'altra lingua, non la nomina come parlata
    const it = raw.replace(/similar to \w+/gi, "");
    const hits = LANGS.map((l) => ({ l, at: it.search(l.re) })).filter((x) => x.at >= 0).sort((a, b) => a.at - b.at);
    if (!hits.length) { if (!/^(other|unspecified|french|english|arabic|portuguese|spanish|italian|german)\b/i.test(it)) unmatched.push(it.replace(/\s*<?\s*\d*\.?\d+\s*%.*$/, "").slice(0, 80)); continue; }
    // se la voce dice "official", vale per la lingua nominata per prima
    hits.forEach((h, k) => found.set(h.l.name, (found.get(h.l.name) || false) || (k === 0 && /official/i.test(it))));
  }
  return { langs: [...found].map(([name, official]) => ({ name, official })), unmatched };
}
