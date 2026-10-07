// Si lancia a mano, di rado: node scripts/prepare-geo.mjs <cartella-con-i-geojson-Natural-Earth>
// Legge i file grezzi, li semplifica e scrive src/geo/africa.json e src/geo/gambia.json.
// Il build usa solo questi due file piccoli, non i grezzi.
import fs from "node:fs";
import path from "node:path";
import { root } from "./lib.mjs";
import { simplify, round } from "./geo-util.mjs";

const dir = process.argv[2];
if (!dir) { console.error("Uso: node scripts/prepare-geo.mjs <cartella>"); process.exit(1); }
const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));

const rings = (geom) => (geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates).flat();
const lines = (geom) => (geom.type === "LineString" ? [geom.coordinates] : geom.coordinates);
const shape = (list, tol, min) => list
  .map((r) => round(simplify(r, tol)))
  .filter((r) => r.length >= min);

// Africa a 50m: una forma per paese.
const africa = read("ne_50m_admin_0_countries.geojson").features
  .filter((f) => f.properties.CONTINENT === "Africa")
  .map((f) => ({ a3: f.properties.ADM0_A3, name: f.properties.NAME, rings: shape(rings(f.geometry), 0.04, 4) }));
fs.mkdirSync(path.join(root, "src", "geo"), { recursive: true });
fs.writeFileSync(path.join(root, "src", "geo", "africa.json"), JSON.stringify({ countries: africa }));

// Gambia e Senegal a 10m, più il fiume Gambia.
const c10 = read("ne_10m_admin_0_countries.geojson").features;
const pick = (a3) => c10.find((f) => f.properties.ADM0_A3 === a3);
const countries = ["GMB", "SEN"].map((a3) => {
  const f = pick(a3);
  return { a3, name: f.properties.NAME, rings: shape(rings(f.geometry), 0.002, 4) };
});
const river = read("ne_10m_rivers_lake_centerlines.geojson").features.find((f) => f.properties.name === "Gambia");
fs.writeFileSync(path.join(root, "src", "geo", "gambia.json"), JSON.stringify({
  countries,
  rivers: [{ name: "Gambia", lines: shape(lines(river.geometry), 0.002, 2) }]
}));

for (const f of ["africa.json", "gambia.json"]) {
  console.log(f, fs.statSync(path.join(root, "src", "geo", f)).size, "byte");
}
