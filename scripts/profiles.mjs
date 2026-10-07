// Legge i testi del Factbook (content/data/africa-profiles.json) e ne ricava numeri per i confronti.
// Il lavoro è prudente: se un testo non si lascia leggere con certezza, il paese resta fuori dal grafico e lo diciamo.
const decode = (s) => String(s).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

// toglie tutto ciò che sta tra parentesi tonde o quadre (sottogruppi, note, anni), anche annidato
function flat(s) {
  let out = "", depth = 0;
  for (const ch of decode(s)) {
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth = Math.max(0, depth - 1);
    else if (!depth) out += ch;
  }
  return out.replace(/\s+/g, " ").trim();
}
// divide a virgole e punti e virgola fuori dalle parentesi
function items(s) {
  const parts = []; let cur = "", depth = 0;
  for (const ch of decode(s)) {
    if (ch === "(" || ch === "[") depth++;
    if (ch === ")" || ch === "]") depth = Math.max(0, depth - 1);
    if ((ch === "," || ch === ";") && !depth) { parts.push(cur); cur = ""; } else cur += ch;
  }
  parts.push(cur);
  return parts.map((x) => x.trim()).filter(Boolean);
}

const MUSLIM = /muslim|islam|sunni/i;
const NONE = /^(none|no religion|nothing in particular|unaffiliated|atheist|agnostic)|none$|unaffiliated/i;
const TRAD = /animis|traditional|folk|ethnic religionist|ancestral|vodoun|badimo/i;
const OTHERNAME = /^(other|unspecified|unknown|not specified|don't know|agnostics and other)/i;
const CHRISTIAN = /christian|catholic|protestant|orthodox|pentecostal|anglican|adventist|evangelical|methodist|revival|awakening|kimbanguist|salutiste|apostolic|lutheran|jehovah|assembly of god|church|zionist|mana$|universal kingdom|celestial/i;

// Quote per gruppo, in percento. Ritorna null se non ci sono percentuali leggibili.
export function religionShares(text) {
  const g = { muslim: 0, christian: 0, traditional: 0, none: 0, asian: 0, other: 0 };
  let found = 0;
  for (const it of items(text)) {
    if (/^less than/i.test(it)) continue; // elenco di gruppi sotto l'1%
    const f = flat(it);
    // più quote nella stessa voce (es. "Protestant 27.1% other Christian 6.1%")
    for (const m of f.matchAll(/([A-Za-z][^%\d<]*?)\s*(<)?\s*(\d*\.?\d+)\s*%/g)) {
      const head = m[1].replace(/^[\s:;-]+|[\s:;-]+$/g, "");
      if (!head) continue;
      const v = m[2] ? 0 : parseFloat(m[3]); // "<1%" conta come 0: la differenza finisce in "altro"
      found++;
      let k = "other";
      if (/christian|catholic|protestant|orthodox|pentecostal|anglican|adventist|evangelical|methodist|revival|awakening|kimbanguist|salutiste|apostolic|lutheran|jehovah|assembly of god|church|zionist|universal kingdom|celestial/i.test(head) && !/non-christian/i.test(head)) k = "christian";
      else if (MUSLIM.test(head)) k = "muslim";
      else if (/hindu|buddhis|sikh|jain/i.test(head)) k = "asian";
      else if (TRAD.test(head)) k = "traditional";
      else if (/none|no religion|nothing in particular|unaffiliated|atheist|agnostic/i.test(head) && !/other/i.test(head.replace(/agnostics and other/i, ""))) k = "none";
      g[k] += v;
    }
  }
  if (!found) return null;
  const sum = g.muslim + g.christian + g.traditional + g.none + g.asian + g.other;
  if (sum > 102) return null;
  g.other = Math.max(0, g.other + (100 - sum)); // quota non indicata o sotto l'1%
  const year = /\((\d{4})(?:-\d{2,4})? est\.\)/.exec(decode(text));
  return { ...g, year: year ? year[1] : null, listed: sum };
}

export function governmentGroup(text) {
  const t = text.toLowerCase();
  if (/^formerly|in transition|authoritarian|military|transition/.test(t)) return "Other or in transition";
  if (/monarchy/.test(t)) return t.includes("absolute") ? "Absolute monarchy" : "Constitutional monarchy";
  if (/semi-presidential/.test(t)) return "Semi-presidential republic";
  if (/parliamentary/.test(t)) return "Parliamentary republic";
  if (/presidential/.test(t)) return "Presidential republic";
  return "Other or in transition";
}

// Lingue segnate "(official...)" nel testo, anche dentro "other (includes ...)". Il nome è ciò che precede la parentesi.
const LANG_NAME = [[/swahili/i, "Swahili"], [/tamazight/i, "Tamazight"], [/tigri/i, "Tigrinya"], [/zulu/i, "Zulu"], [/xhosa/i, "Xhosa"], [/sotho/i, "Sotho"], [/tswana/i, "Tswana"], [/ndebele/i, "Ndebele"], [/swati|siswati/i, "Swati"], [/venda/i, "Venda"], [/tsonga/i, "Tsonga"], [/pedi/i, "Pedi"]];
export function officialLanguages(text) {
  const t = decode(text).replace(/<br>/g, " ");
  const out = [];
  for (const m of t.matchAll(/\((official[^()]*)\)/gi)) {
    let i = m.index;
    // risale oltre eventuali parentesi già chiuse (es. "Tigrigna (Tigrinya) (official ...)")
    let j = i; while (j > 0 && t[j - 1] === " ") j--;
    let depth = 0, k = j;
    while (k > 0) {
      const ch = t[k - 1];
      if (ch === ")") depth++;
      else if (ch === "(") { if (depth === 0) break; depth--; }
      else if (!depth && (ch === "," || ch === ";")) break;
      k--;
    }
    let seg = t.slice(k, j).replace(/\([^()]*\)/g, "").replace(/^\s*includes\s+/i, "").replace(/\s*<?\s*\d*\.?\d+\s*%.*$/, "").replace(/^\s*and\s+/i, "").trim();
    if (!seg || /^other$/i.test(seg) || /^\d+\s/.test(seg)) continue;
    let name = seg;
    for (const [re, n] of LANG_NAME) if (re.test(seg)) { name = n; break; }
    out.push({ name, national: !/regional|working|local/i.test(m[1]) || /national/i.test(m[1]) });
  }
  const seen = new Set();
  return out.filter((x) => (seen.has(x.name) ? false : seen.add(x.name)));
}
