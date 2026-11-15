# Graph Report - home-ground  (2026-11-15)

## Corpus Check
- 276 files · ~808,762 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 466 nodes · 787 edges · 46 communities (33 shown, 13 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Site build and rendering
- Content plan and sections
- Package dependencies
- Charts and profiles
- Maps drawing
- Note intake script
- True size interaction
- True size data prep
- Editorial method and voices
- Connections explorer
- Geo data utilities
- Glottolog data prep
- Share form
- Story image downloader
- World Bank data prep
- Dish draft seeding
- Place image downloader
- Validation library
- Country data prep
- Photo downloader
- UNESCO data prep
- UNESCO card seeding
- Home map interactions
- Quiz engine
- People image downloader
- Method Q&A search
- Note review script
- Script helpers
- Factbook data prep
- Capital draft seeding
- Recipe widget
- Story widgets
- Country data docs
- Contribution handling
- Design critique findings
- MCP tool config
- Floating action button
- Language game
- Society games
- Publishing workflows
- Geo data docs
- Prototype page
- Roadmap

## God Nodes (most connected - your core abstractions)
1. `esc()` - 30 edges
2. `root` - 22 edges
3. `layout()` - 21 edges
4. `compactHero()` - 19 edges
5. `makeCiter()` - 14 edges
6. `renderPlace()` - 14 edges
7. `renderStory()` - 12 edges
8. `add()` - 11 edges
9. `scripts` - 11 edges
10. `renderRich()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Two layers: documented record and local voices` --semantically_similar_to--> `Layer 1: documented record (every claim has a source)`  [INFERRED] [semantically similar]
  README.md → docs/metodo-editoriale.md
- `Two layers: documented record and local voices` --semantically_similar_to--> `Layer 2: local voices, shown as one person's experience`  [INFERRED] [semantically similar]
  README.md → docs/metodo-editoriale.md
- `Static site: no database, no cookies, no tracking` --conceptually_related_to--> `"Add your voice" form: prepares a message the person sends themselves`  [INFERRED]
  README.md → docs/metodo-editoriale.md
- `Countries data: 54 states from World Bank and UN M49` --references--> `Countries page and World Bank data`  [INFERRED]
  content/data/LEGGIMI.txt → README.md
- `Workflow: Pubblica su GitHub Pages` --semantically_similar_to--> `Workflow: Controllo contenuti (PR check)`  [INFERRED] [semantically similar]
  .github/workflows/pages.yml → .github/workflows/check.yml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **CI check and Pages publishing pipeline** — github_workflows_check, github_workflows_pages [INFERRED 0.85]
- **The two-layer rule across README, method and plan** — readme_two_layers, docs_metodo_editoriale_documented_record, docs_metodo_editoriale_local_voices, docs_piano_contenuti_quality_rule [INFERRED 0.85]
- **Content growth phases: stories, places, dishes, paths** — docs_piano_contenuti_phase1_stories, docs_piano_contenuti_phase2_places, docs_piano_contenuti_phase3_dishes, docs_piano_contenuti_phase4_paths [EXTRACTED 1.00]
- **Sections sharing the interactive block family** — docs_piano_contenuti_phase1_stories, docs_piano_contenuti_places_cards, docs_piano_contenuti_capitals, docs_piano_contenuti_method_page, docs_piano_contenuti_peoples_section [EXTRACTED 0.95]

## Communities (46 total, 13 thin omitted)

### Community 0 - "Site build and rendering"
Cohesion: 0.07
Nodes (80): aliasOf(), art(), bad, checkHtmlWith(), citedIds(), cName, compactHero(), countrySlug() (+72 more)

### Community 1 - "Content plan and sections"
Cohesion: 0.08
Nodes (30): Piano dei contenuti: storie, luoghi, piatti, percorsi, Sezione Cosa succede in Africa oggi (conflitti, accertato vs accusato), Sezione arte (ricognizione), Profili delle 54 capitali, Avanzamento capitali per sottoregione (australe, settentrionale, centrale, occidentale, orientale), Pipeline di ricerca capitali (ricerca, assemble.py, bozze draft), UNESCO Ceebu Jen (Senegal), Pagine dei Paesi (54, generate dai dati) (+22 more)

### Community 2 - "Package dependencies"
Cohesion: 0.09
Nodes (21): motion, dependencies, motion, description, engines, node, name, private (+13 more)

### Community 3 - "Charts and profiles"
Cohesion: 0.16
Nodes (18): barList(), esc(), fmtInt(), fmtPop(), pairedBars(), pct(), scatter(), stackedShares() (+10 more)

### Community 4 - "Maps drawing"
Cohesion: 0.21
Nodes (19): africa, africaMap(), africaPlacesMap(), choroplethMap(), countryCodes, countryLocator(), countryName(), esc() (+11 more)

### Community 5 - "Note intake script"
Cohesion: 0.12
Nodes (17): answers, args, data, entry, fail(), { fields, text }, file, how (+9 more)

### Community 6 - "True size interaction"
Cohesion: 0.27
Nodes (16): add(), end(), clampTarget(), draw(), fmtArea(), invert(), mover(), nudge() (+8 more)

### Community 7 - "True size data prep"
Cohesion: 0.20
Nodes (13): africaF, densify(), dist(), EU27, ext(), measure(), out, ringCenter() (+5 more)

### Community 8 - "Editorial method and voices"
Cohesion: 0.15
Nodes (15): Consent, anonymity and removal of notes, When a note disagrees with the record: only a source changes the record, Layer 1: documented record (every claim has a source), "Add your voice" form: prepares a message the person sends themselves, Declared gaps on every card, Layer 2: local voices, shown as one person's experience, Source labels: tier and status (verified, to-verify, draft), Adding a note (npm run add-note) (+7 more)

### Community 9 - "Connections explorer"
Cohesion: 0.38
Nodes (13): bfs(), escapeHtml(), go(), h(), hideSuggestions(), newQuest(), questCheck(), renderActiveCard() (+5 more)

### Community 10 - "Geo data utilities"
Cohesion: 0.30
Nodes (8): round(), simplify(), africa, countries, pick(), rings(), river, shape()

### Community 11 - "Glottolog data prep"
Cohesion: 0.18
Nodes (10): af, africaCounts, by, core, famOf(), fams, [head, ...body], out (+2 more)

### Community 12 - "Share form"
Cohesion: 0.35
Nodes (10): build(), button(), copy(), curKind(), drawFields(), problem(), read(), say() (+2 more)

### Community 13 - "Story image downloader"
Cohesion: 0.27
Nodes (9): dir, get(), j(), LICENSE_URL, only, outFile, picks, polite() (+1 more)

### Community 14 - "World Bank data prep"
Cohesion: 0.20
Nodes (7): root, IND, iso, out, dir, dist, types

### Community 15 - "Dish draft seeding"
Cohesion: 0.22
Nodes (7): draft, existingCountries, existingFiles, notesDir, placesDir, proposed, read()

### Community 16 - "Place image downloader"
Cohesion: 0.31
Nodes (8): dir, get(), j(), LICENSE_URL, only, picks, polite(), sleep()

### Community 17 - "Validation library"
Cohesion: 0.33
Nodes (7): HOW, loadAll(), readJson(), report(), RICH, validate(), result

### Community 18 - "Country data prep"
Cohesion: 0.25
Nodes (8): CAPITALS, countries, indicator(), json(), meta, NAMES, out, SUBREGIONS

### Community 19 - "Photo downloader"
Cohesion: 0.25
Nodes (4): dir, LICENSE_URL, only, pick

### Community 20 - "UNESCO data prep"
Cohesion: 0.25
Nodes (5): all, iso2, keep, out, wanted

### Community 21 - "UNESCO card seeding"
Cohesion: 0.25
Nodes (4): ids, S, sourcesPath, U

### Community 23 - "Quiz engine"
Cohesion: 0.50
Nodes (7): ask(), begin(), finish(), round(), showStart(), shuffle(), sourceLine()

### Community 24 - "People image downloader"
Cohesion: 0.33
Nodes (6): dir, LIC, only, picks, polite(), sleep()

### Community 25 - "Method Q&A search"
Cohesion: 0.57
Nodes (6): escapeHtml(), findBestMatches(), handleQuery(), renderResult(), scoreItem(), tokenize()

### Community 26 - "Note review script"
Cohesion: 0.33
Nodes (4): args, by, date, dir

### Community 28 - "Factbook data prep"
Cohesion: 0.40
Nodes (3): file, FIPS, out

### Community 32 - "Country data docs"
Cohesion: 0.67
Nodes (3): Countries data: 54 states from World Bank and UN M49, True size page data: Equal Earth areas, not mixed with World Bank areas, Countries page and World Bank data

### Community 33 - "Contribution handling"
Cohesion: 0.67
Nodes (3): Gestione dei contributi, Review after publication (local reader), Sensitive places flag

### Community 34 - "Design critique findings"
Cohesion: 0.67
Nodes (3): Design critique 1 (home, 24/32), Design critique 2 (home and places, 24/32), Finding: voices layer invisible on home

## Knowledge Gaps
- **164 isolated node(s):** `af`, `africaCounts`, `by`, `fams`, `[head, ...body]` (+159 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `root` connect `World Bank data prep` to `Site build and rendering`, `Maps drawing`, `Note intake script`, `True size data prep`, `Geo data utilities`, `Glottolog data prep`, `Story image downloader`, `Dish draft seeding`, `Place image downloader`, `Validation library`, `Country data prep`, `Photo downloader`, `UNESCO data prep`, `UNESCO card seeding`, `People image downloader`, `Note review script`, `Factbook data prep`, `Capital draft seeding`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Why does `loadAll()` connect `Validation library` to `Site build and rendering`, `Note intake script`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `validate()` connect `Validation library` to `Site build and rendering`, `Note intake script`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `af`, `africaCounts`, `by` to the rest of the system?**
  _164 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Site build and rendering` be split into smaller, more focused modules?**
  _Cohesion score 0.06744956338452274 - nodes in this community are weakly interconnected._
- **Should `Content plan and sections` be split into smaller, more focused modules?**
  _Cohesion score 0.08045977011494253 - nodes in this community are weakly interconnected._
- **Should `Package dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._