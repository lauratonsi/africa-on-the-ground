# Graph Report - home-ground  (2026-11-14)

## Corpus Check
- 417 files · ~683,967 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 430 nodes · 745 edges · 44 communities (31 shown, 13 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Site build and rendering
- Editorial method and voices
- Package and motion dependencies
- Maps and locator drawing
- Note intake script
- True size interaction
- True size data prep
- Connections explorer
- Geo data utilities
- Language labels and profiles
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
- Method Q&A search
- Note review script
- Script helpers
- Factbook data prep
- Capital draft seeding
- Recipe widget
- Story widgets
- Country data and true size
- Contribution handling
- Design critique findings
- MCP tool config
- Floating action button
- Language game
- Society games
- Publishing workflows
- Natural Earth data
- Prototype page
- Roadmap

## God Nodes (most connected - your core abstractions)
1. `esc()` - 28 edges
2. `root` - 21 edges
3. `layout()` - 19 edges
4. `compactHero()` - 17 edges
5. `renderPlace()` - 14 edges
6. `renderCountries()` - 14 edges
7. `renderCountryPage()` - 13 edges
8. `renderStory()` - 12 edges
9. `add()` - 11 edges
10. `scripts` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Two layers: documented record and local voices` --semantically_similar_to--> `Layer 1: documented record (every claim has a source)`  [INFERRED] [semantically similar]
  README.md → docs/metodo-editoriale.md
- `Two layers: documented record and local voices` --semantically_similar_to--> `Layer 2: local voices, shown as one person's experience`  [INFERRED] [semantically similar]
  README.md → docs/metodo-editoriale.md
- `Static site: no database, no cookies, no tracking` --conceptually_related_to--> `"Add your voice" form: prepares a message the person sends themselves`  [INFERRED]
  README.md → docs/metodo-editoriale.md
- `Art as a new side: rock art, collections, living practices, contemporary scenes` --references--> `Art section (places/art, art.json)`  [INFERRED]
  docs/piano-contenuti.md → README.md
- `Rule: interactivity and gamification are the base of every section` --conceptually_related_to--> `Connections page: guided index of editorial relations, with a thread game`  [INFERRED]
  docs/piano-contenuti.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **CI check and Pages publishing pipeline** — github_workflows_check, github_workflows_pages [INFERRED 0.85]
- **The two-layer rule across README, method and plan** — readme_two_layers, docs_metodo_editoriale_documented_record, docs_metodo_editoriale_local_voices, docs_piano_contenuti_quality_rule [INFERRED 0.85]

## Communities (44 total, 13 thin omitted)

### Community 0 - "Site build and rendering"
Cohesion: 0.06
Nodes (82): art(), bad, checkHtmlWith(), citedIds(), cName, compactHero(), countrySlug(), cPop (+74 more)

### Community 1 - "Editorial method and voices"
Cohesion: 0.11
Nodes (22): Consent, anonymity and removal of notes, When a note disagrees with the record: only a source changes the record, Layer 1: documented record (every claim has a source), "Add your voice" form: prepares a message the person sends themselves, Declared gaps on every card, Layer 2: local voices, shown as one person's experience, Source labels: tier and status (verified, to-verify, draft), Art as a new side: rock art, collections, living practices, contemporary scenes (+14 more)

### Community 2 - "Package and motion dependencies"
Cohesion: 0.09
Nodes (21): motion, dependencies, motion, description, engines, node, name, private (+13 more)

### Community 3 - "Maps and locator drawing"
Cohesion: 0.21
Nodes (19): africa, africaMap(), africaPlacesMap(), choroplethMap(), countryCodes, countryLocator(), countryName(), esc() (+11 more)

### Community 4 - "Note intake script"
Cohesion: 0.12
Nodes (17): answers, args, data, entry, fail(), { fields, text }, file, how (+9 more)

### Community 5 - "True size interaction"
Cohesion: 0.27
Nodes (16): add(), end(), clampTarget(), draw(), fmtArea(), invert(), mover(), nudge() (+8 more)

### Community 6 - "True size data prep"
Cohesion: 0.20
Nodes (13): africaF, densify(), dist(), EU27, ext(), measure(), out, ringCenter() (+5 more)

### Community 7 - "Connections explorer"
Cohesion: 0.38
Nodes (13): bfs(), escapeHtml(), go(), h(), hideSuggestions(), newQuest(), questCheck(), renderActiveCard() (+5 more)

### Community 8 - "Geo data utilities"
Cohesion: 0.30
Nodes (8): round(), simplify(), africa, countries, pick(), rings(), river, shape()

### Community 9 - "Language labels and profiles"
Cohesion: 0.32
Nodes (10): LANGS, spokenLanguages(), T, decode(), flat(), governmentGroup(), items(), LANG_NAME (+2 more)

### Community 10 - "Glottolog data prep"
Cohesion: 0.18
Nodes (10): af, africaCounts, by, core, famOf(), fams, [head, ...body], out (+2 more)

### Community 11 - "Share form"
Cohesion: 0.35
Nodes (10): build(), button(), copy(), curKind(), drawFields(), problem(), read(), say() (+2 more)

### Community 12 - "Story image downloader"
Cohesion: 0.27
Nodes (9): dir, get(), j(), LICENSE_URL, only, outFile, picks, polite() (+1 more)

### Community 13 - "World Bank data prep"
Cohesion: 0.20
Nodes (7): root, IND, iso, out, dir, dist, types

### Community 14 - "Dish draft seeding"
Cohesion: 0.22
Nodes (7): draft, existingCountries, existingFiles, notesDir, placesDir, proposed, read()

### Community 15 - "Place image downloader"
Cohesion: 0.31
Nodes (8): dir, get(), j(), LICENSE_URL, only, picks, polite(), sleep()

### Community 16 - "Validation library"
Cohesion: 0.33
Nodes (7): HOW, loadAll(), readJson(), report(), RICH, validate(), result

### Community 17 - "Country data prep"
Cohesion: 0.25
Nodes (8): CAPITALS, countries, indicator(), json(), meta, NAMES, out, SUBREGIONS

### Community 18 - "Photo downloader"
Cohesion: 0.25
Nodes (4): dir, LICENSE_URL, only, pick

### Community 19 - "UNESCO data prep"
Cohesion: 0.25
Nodes (5): all, iso2, keep, out, wanted

### Community 20 - "UNESCO card seeding"
Cohesion: 0.25
Nodes (4): ids, S, sourcesPath, U

### Community 22 - "Quiz engine"
Cohesion: 0.50
Nodes (7): ask(), begin(), finish(), round(), showStart(), shuffle(), sourceLine()

### Community 23 - "Method Q&A search"
Cohesion: 0.57
Nodes (6): escapeHtml(), findBestMatches(), handleQuery(), renderResult(), scoreItem(), tokenize()

### Community 24 - "Note review script"
Cohesion: 0.33
Nodes (4): args, by, date, dir

### Community 26 - "Factbook data prep"
Cohesion: 0.40
Nodes (3): file, FIPS, out

### Community 30 - "Country data and true size"
Cohesion: 0.67
Nodes (3): Countries data: 54 states from World Bank and UN M49, True size page data: Equal Earth areas, not mixed with World Bank areas, Countries page and World Bank data

### Community 31 - "Contribution handling"
Cohesion: 0.67
Nodes (3): Gestione dei contributi, Review after publication (local reader), Sensitive places flag

### Community 32 - "Design critique findings"
Cohesion: 0.67
Nodes (3): Design critique 1 (home, 24/32), Design critique 2 (home and places, 24/32), Finding: voices layer invisible on home

## Knowledge Gaps
- **152 isolated node(s):** `file`, `FIPS`, `out`, `IND`, `iso` (+147 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `root` connect `World Bank data prep` to `Site build and rendering`, `Maps and locator drawing`, `Note intake script`, `True size data prep`, `Geo data utilities`, `Glottolog data prep`, `Story image downloader`, `Dish draft seeding`, `Place image downloader`, `Validation library`, `Country data prep`, `Photo downloader`, `UNESCO data prep`, `UNESCO card seeding`, `Note review script`, `Factbook data prep`, `Capital draft seeding`?**
  _High betweenness centrality (0.141) - this node is a cross-community bridge._
- **Why does `loadAll()` connect `Validation library` to `Site build and rendering`, `Note intake script`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Why does `validate()` connect `Validation library` to `Site build and rendering`, `Note intake script`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `file`, `FIPS`, `out` to the rest of the system?**
  _152 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Site build and rendering` be split into smaller, more focused modules?**
  _Cohesion score 0.0640218878248974 - nodes in this community are weakly interconnected._
- **Should `Editorial method and voices` be split into smaller, more focused modules?**
  _Cohesion score 0.11255411255411256 - nodes in this community are weakly interconnected._
- **Should `Package and motion dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._