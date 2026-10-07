// Carica la matematica di src/truesize.js (proiezione e rotazione) per usarla negli script, così non esiste una copia da tenere allineata.
import fs from "node:fs";
import path from "node:path";
import { root } from "./lib.mjs";

const mod = { exports: {} };
new Function("module", fs.readFileSync(path.join(root, "src", "truesize.js"), "utf8"))(mod);
export const { project, invert, mover } = mod.exports;
export const CM = 20; // meridiano centrale della mappa, lo stesso di src/truesize.js

// Equal Earth attorno a un meridiano centrale qualsiasi (serve a misurare forme lontane dall'Africa).
export const equalEarth = (lon, lat, cm) => project(lon - cm + CM, lat);
export const equalEarthInverse = (x, y, cm) => { const [lo, la] = invert(x, y); return [lo + cm - CM, la]; };
