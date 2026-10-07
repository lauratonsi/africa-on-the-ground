# Graph Report - home-ground  (2026-10-08)

## Corpus Check
- 196 files · ~279,050 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 338 nodes · 597 edges · 21 communities (17 shown, 4 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Site builder (build.mjs)
- Notes pipeline (add-note)
- Docs, data and editorial method
- Geo data preparation
- SVG maps (map.mjs)
- Motion dependency
- True size tool
- Photo import
- Language parsing
- Glottolog preparation
- Share form
- Country data preparation
- UNESCO data preparation
- Page scripts (app.js)
- Quiz
- Source-card seeding
- MCP config
- Jump button

## God Nodes (most connected - your core abstractions)
1. `esc()` - 21 edges
2. `root` - 17 edges
3. `renderCountryPage()` - 16 edges
4. `renderCountries()` - 15 edges
5. `layout()` - 14 edges
6. `renderSociety()` - 14 edges
7. `compactHero()` - 12 edges
8. `Africa on the Ground README` - 12 edges
9. `add()` - 11 edges
10. `makeCiter()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Home Ground prototype (HTML)` --conceptually_related_to--> `Africa on the Ground README`  [INFERRED]
  docs/prototipo.html → README.md
- `Add-note workflow (message to note)` --conceptually_related_to--> `Gestione dei contributi`  [INFERRED]
  README.md → docs/contributi.md
- `Method page` --conceptually_related_to--> `Metodo editoriale`  [INFERRED]
  content/pages/method.html → docs/metodo-editoriale.md
- `Africa on the Ground README` --references--> `Method page`  [EXTRACTED]
  README.md → content/pages/method.html
- `Africa on the Ground README` --references--> `Roadmap (proposta)`  [EXTRACTED]
  README.md → docs/roadmap.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **CI check and Pages publishing pipeline** — github_workflows_check, github_workflows_pages, readme_validation_rules [INFERRED 0.85]
- **Content plan phases** — docs_piano_contenuti_fase_1_storie, docs_piano_contenuti_fase_2_luoghi, docs_piano_contenuti_fase_3_piatti, docs_piano_contenuti_fase_4_percorsi [EXTRACTED 1.00]

## Communities (21 total, 4 thin omitted)

### Community 0 - "Site builder (build.mjs)"
Cohesion: 0.07
Nodes (68): art(), bad, citedIds(), cName, compactHero(), countrySlug(), cPop, cSlug (+60 more)

### Community 1 - "Notes pipeline (add-note)"
Cohesion: 0.05
Nodes (35): answers, args, data, entry, fail(), { fields, text }, file, how (+27 more)

### Community 2 - "Docs, data and editorial method"
Cohesion: 0.08
Nodes (31): Content data README (provenance), africa-countries.json dataset (World Bank, UN M49), Regional blocs and quiz data, wb-2023.json dataset, Method page, Gestione dei contributi, Review after publication (local reader), Sensitive places flag (+23 more)

### Community 3 - "Geo data preparation"
Cohesion: 0.11
Nodes (23): round(), simplify(), root, africa, countries, pick(), rings(), river (+15 more)

### Community 4 - "SVG maps (map.mjs)"
Cohesion: 0.21
Nodes (19): africa, africaMap(), africaPlacesMap(), choroplethMap(), countryCodes, countryLocator(), countryName(), esc() (+11 more)

### Community 5 - "Motion dependency"
Cohesion: 0.11
Nodes (18): motion, dependencies, motion, description, engines, node, name, private (+10 more)

### Community 6 - "True size tool"
Cohesion: 0.27
Nodes (16): add(), end(), clampTarget(), draw(), fmtArea(), invert(), mover(), nudge() (+8 more)

### Community 7 - "Photo import"
Cohesion: 0.12
Nodes (9): dir, LICENSE_URL, only, pick, ids, S, slug(), sourcesPath (+1 more)

### Community 8 - "Language parsing"
Cohesion: 0.33
Nodes (11): renderSociety(), LANGS, spokenLanguages(), T, decode(), flat(), governmentGroup(), items() (+3 more)

### Community 9 - "Glottolog preparation"
Cohesion: 0.18
Nodes (10): af, africaCounts, by, core, famOf(), fams, [head, ...body], out (+2 more)

### Community 10 - "Share form"
Cohesion: 0.35
Nodes (10): build(), button(), copy(), curKind(), drawFields(), problem(), read(), say() (+2 more)

### Community 11 - "Country data preparation"
Cohesion: 0.25
Nodes (8): CAPITALS, countries, indicator(), json(), meta, NAMES, out, SUBREGIONS

### Community 12 - "UNESCO data preparation"
Cohesion: 0.25
Nodes (5): all, iso2, keep, out, wanted

### Community 14 - "Quiz"
Cohesion: 0.50
Nodes (7): ask(), begin(), finish(), round(), showStart(), shuffle(), sourceLine()

## Knowledge Gaps
- **123 isolated node(s):** `motion`, `motion-plus`, `name`, `version`, `private` (+118 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `root` connect `Geo data preparation` to `Site builder (build.mjs)`, `Notes pipeline (add-note)`, `SVG maps (map.mjs)`, `Photo import`, `Glottolog preparation`, `Country data preparation`, `UNESCO data preparation`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **Why does `loadAll()` connect `Notes pipeline (add-note)` to `Site builder (build.mjs)`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `validate()` connect `Notes pipeline (add-note)` to `Site builder (build.mjs)`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `motion`, `motion-plus`, `name` to the rest of the system?**
  _123 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Site builder (build.mjs)` be split into smaller, more focused modules?**
  _Cohesion score 0.06729264475743349 - nodes in this community are weakly interconnected._
- **Should `Notes pipeline (add-note)` be split into smaller, more focused modules?**
  _Cohesion score 0.052525252525252523 - nodes in this community are weakly interconnected._
- **Should `Docs, data and editorial method` be split into smaller, more focused modules?**
  _Cohesion score 0.07741935483870968 - nodes in this community are weakly interconnected._