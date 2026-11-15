# Graph Report - home-ground  (2026-11-15)

## Corpus Check
- 765 files · ~808,600 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 649 nodes · 1012 edges · 60 communities (47 shown, 13 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `628db86f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- build.mjs
- Profili delle 54 capitali
- scripts
- profiles.mjs
- Creating the Cape Colony
- add-note.mjs
- truesize.js
- prepare-truesize.mjs
- Two layers: documented record and local voices
- explore.js
- prepare-geo.mjs
- prepare-glottolog.mjs
- share.js
- Understanding the creation and expansion of settler colonies
- root
- seed-dish-drafts.mjs
- Eurafrica
- lib.mjs
- prepare-countries.mjs
- The Eurafrican Relaunch : The Treaty of Rome Negotiations, 1955–1957
- add-story-images.mjs
- seed-unesco-cards.mjs
- app.js
- quiz.js
- Making Europe in Africa: The First Postwar Decade
- method-qa.js
- review-note.mjs
- _ctx.mjs
- Colonial Legacies- Economic and Social Development in East and Southeast Asia (University of Hawai'i Press).md
- seed-capital-drafts.mjs
- recipe.js
- story.js
- Countries data: 54 states from World Bank and UN M49
- Gestione dei contributi
- Design critique 2 (home and places, 24/32)
- .mcp.json
- fab.js
- languages.js
- round
- Workflow: Controllo contenuti (PR check)
- Geo data README (Natural Earth)
- Home Ground prototype (HTML)
- Roadmap (proposta)
- A Holy Alliance of Colonizing Powers: The Interwar Period
- **Agricultural Expansion, Population Growth, and Access to Land**
- **What Were Colonial Governments Doing?** The Myth of the Night Watchman State
- **International Trade, Balance of Payments, and Exchange Rate Policies: 1900 –1940**
- **Economic Growth and Structural Change: 1900 –1940**
- **Changing Living Standards and Human Development**
- **Growth and Diversifi cation of the Market Economy**
- Conclusion: Ending Colonialism by Securing its Continuation
- Bibliography
- C H A P T E R 9 **The Transition to Independent States**
- **The Greater Asian Co-Prosperity Sphere: 1942 –1945**
- **Introduction**
- Introduction: The Past that Europe Forgot
- prepare-wb2023.mjs

## God Nodes (most connected - your core abstractions)
1. `esc()` - 44 edges
2. `root` - 22 edges
3. `layout()` - 21 edges
4. `compactHero()` - 19 edges
5. `Eurafrica` - 17 edges
6. `renderSociety()` - 16 edges
7. `renderCountryPage()` - 16 edges
8. `Understanding the creation and expansion of settler colonies` - 16 edges
9. `renderPlace()` - 15 edges
10. `renderCountries()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Two layers: documented record and local voices` --semantically_similar_to--> `Layer 1: documented record (every claim has a source)`  [INFERRED] [semantically similar]
  README.md → docs/metodo-editoriale.md
- `Two layers: documented record and local voices` --semantically_similar_to--> `Layer 2: local voices, shown as one person's experience`  [INFERRED] [semantically similar]
  README.md → docs/metodo-editoriale.md
- `Countries data: 54 states from World Bank and UN M49` --references--> `Countries page and World Bank data`  [INFERRED]
  content/data/LEGGIMI.txt → README.md
- `Static site: no database, no cookies, no tracking` --conceptually_related_to--> `"Add your voice" form: prepares a message the person sends themselves`  [INFERRED]
  README.md → docs/metodo-editoriale.md
- `Workflow: Pubblica su GitHub Pages` --semantically_similar_to--> `Workflow: Controllo contenuti (PR check)`  [INFERRED] [semantically similar]
  .github/workflows/pages.yml → .github/workflows/check.yml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Sections sharing the interactive block family** — docs_piano_contenuti_phase1_stories, docs_piano_contenuti_places_cards, docs_piano_contenuti_capitals, docs_piano_contenuti_method_page, docs_piano_contenuti_peoples_section [EXTRACTED 0.95]
- **Content growth phases: stories, places, dishes, paths** — docs_piano_contenuti_phase1_stories, docs_piano_contenuti_phase2_places, docs_piano_contenuti_phase3_dishes, docs_piano_contenuti_phase4_paths [EXTRACTED 1.00]
- **CI check and Pages publishing pipeline** — github_workflows_check, github_workflows_pages [INFERRED 0.85]
- **The two-layer rule across README, method and plan** — readme_two_layers, docs_metodo_editoriale_documented_record, docs_metodo_editoriale_local_voices, docs_piano_contenuti_quality_rule [INFERRED 0.85]

## Communities (60 total, 13 thin omitted)

### Community 0 - "build.mjs"
Cohesion: 0.05
Nodes (106): aliasOf(), art(), bad, checkHtmlWith(), citedIds(), cName, compactHero(), countrySlug() (+98 more)

### Community 1 - "Profili delle 54 capitali"
Cohesion: 0.08
Nodes (30): Piano dei contenuti: storie, luoghi, piatti, percorsi, Sezione Cosa succede in Africa oggi (conflitti, accertato vs accusato), Sezione arte (ricognizione), Profili delle 54 capitali, Avanzamento capitali per sottoregione (australe, settentrionale, centrale, occidentale, orientale), Pipeline di ricerca capitali (ricerca, assemble.py, bozze draft), UNESCO Ceebu Jen (Senegal), Pagine dei Paesi (54, generate dai dati) (+22 more)

### Community 2 - "scripts"
Cohesion: 0.09
Nodes (21): motion, dependencies, motion, description, engines, node, name, private (+13 more)

### Community 3 - "profiles.mjs"
Cohesion: 0.33
Nodes (9): LANGS, T, decode(), flat(), governmentGroup(), items(), LANG_NAME, officialLanguages() (+1 more)

### Community 4 - "Creating the Cape Colony"
Cohesion: 0.04
Nodes (48): Acknowledgements, Clashes between the VOC and the settlers, Concluding remarks, Conclusion, Conclusion, Conclusion, Conclusion, Contents (+40 more)

### Community 5 - "add-note.mjs"
Cohesion: 0.12
Nodes (17): answers, args, data, entry, fail(), { fields, text }, file, how (+9 more)

### Community 6 - "truesize.js"
Cohesion: 0.27
Nodes (16): add(), end(), clampTarget(), draw(), fmtArea(), invert(), mover(), nudge() (+8 more)

### Community 7 - "prepare-truesize.mjs"
Cohesion: 0.20
Nodes (13): africaF, densify(), dist(), EU27, ext(), measure(), out, ringCenter() (+5 more)

### Community 8 - "Two layers: documented record and local voices"
Cohesion: 0.15
Nodes (15): Consent, anonymity and removal of notes, When a note disagrees with the record: only a source changes the record, Layer 1: documented record (every claim has a source), "Add your voice" form: prepares a message the person sends themselves, Declared gaps on every card, Layer 2: local voices, shown as one person's experience, Source labels: tier and status (verified, to-verify, draft), Adding a note (npm run add-note) (+7 more)

### Community 9 - "explore.js"
Cohesion: 0.38
Nodes (13): bfs(), escapeHtml(), go(), h(), hideSuggestions(), newQuest(), questCheck(), renderActiveCard() (+5 more)

### Community 10 - "prepare-geo.mjs"
Cohesion: 0.30
Nodes (8): round(), simplify(), africa, countries, pick(), rings(), river, shape()

### Community 11 - "prepare-glottolog.mjs"
Cohesion: 0.18
Nodes (10): af, africaCounts, by, core, famOf(), fams, [head, ...body], out (+2 more)

### Community 12 - "share.js"
Cohesion: 0.35
Nodes (10): build(), button(), copy(), curKind(), drawFields(), problem(), read(), say() (+2 more)

### Community 13 - "Understanding the creation and expansion of settler colonies"
Cohesion: 0.12
Nodes (16): A very brief history of the Cape Colony, 1652–1796, Coordination costs and the establishment of the refreshment station, Indigenous agency and increased cost of trade, Institutions, factor endowments and forces of expansion, Introduction, Introduction, Settler economies and rational-choice political economy, The closing of the frontier (+8 more)

### Community 14 - "root"
Cohesion: 0.18
Nodes (7): root, file, FIPS, out, dir, dist, types

### Community 15 - "seed-dish-drafts.mjs"
Cohesion: 0.22
Nodes (7): draft, existingCountries, existingFiles, notesDir, placesDir, proposed, read()

### Community 16 - "Eurafrica"
Cohesion: 0.15
Nodes (12): **Bloomsbury Academic**, **Bloomsbury is a registered trade mark of Bloomsbury Publishing Plc**, **British Library Cataloguing-in-Publication Data**, Contents, Eurafrica, Illustrations, Index, **Library of Congress Cataloging-in-Publication Data** (+4 more)

### Community 17 - "lib.mjs"
Cohesion: 0.33
Nodes (7): HOW, loadAll(), readJson(), report(), RICH, validate(), result

### Community 18 - "prepare-countries.mjs"
Cohesion: 0.25
Nodes (8): CAPITALS, countries, indicator(), json(), meta, NAMES, out, SUBREGIONS

### Community 19 - "The Eurafrican Relaunch : The Treaty of Rome Negotiations, 1955–1957"
Cohesion: 0.15
Nodes (13): A Eurafrican Common Market: Agreement reached, A statue to Nasser: Triumphant Eurafricanism, Associate the overseas: The French–Belgian argument, Countering Bandung: The United Nations, Europe as revenge: The Suez Crisis, For the equilibrium of the world: Stalled negotiations, German convictions: Brentano to Adenauer, ‘Great things’: The Venice Conference (+5 more)

### Community 20 - "add-story-images.mjs"
Cohesion: 0.08
Nodes (24): dir, only, picks, { polite }, dir, only, pick, dir (+16 more)

### Community 21 - "seed-unesco-cards.mjs"
Cohesion: 0.25
Nodes (4): ids, S, sourcesPath, U

### Community 23 - "quiz.js"
Cohesion: 0.50
Nodes (7): ask(), begin(), finish(), round(), showStart(), shuffle(), sourceLine()

### Community 24 - "Making Europe in Africa: The First Postwar Decade"
Cohesion: 0.18
Nodes (11): A third world power: The British response, Africa as an essential European task: The Schuman Declaration, Africa first! The French response, Africans in European Parliaments? The European Political Community, Anti-colonial momentum: Consolidating empires after the war, Cooperation overseas: The Council of Europe and the OEEC, Europe’s last chance: Concluding remarks, Internationalizing the colonies: The European movement (+3 more)

### Community 25 - "method-qa.js"
Cohesion: 0.57
Nodes (6): escapeHtml(), findBestMatches(), handleQuery(), renderResult(), scoreItem(), tokenize()

### Community 26 - "review-note.mjs"
Cohesion: 0.33
Nodes (4): args, by, date, dir

### Community 28 - "Colonial Legacies- Economic and Social Development in East and Southeast Asia (University of Hawai'i Press).md"
Cohesion: 0.22
Nodes (8): **A Note on Terminology**, **About the Author**, **Acknowledgments**, **Bibliography**, _cedula_ , 82, **Conclusions**, **Contents**, **Index**

### Community 32 - "Countries data: 54 states from World Bank and UN M49"
Cohesion: 0.67
Nodes (3): Countries data: 54 states from World Bank and UN M49, True size page data: Equal Earth areas, not mixed with World Bank areas, Countries page and World Bank data

### Community 33 - "Gestione dei contributi"
Cohesion: 0.67
Nodes (3): Gestione dei contributi, Review after publication (local reader), Sensitive places flag

### Community 34 - "Design critique 2 (home and places, 24/32)"
Cohesion: 0.67
Nodes (3): Design critique 1 (home, 24/32), Design critique 2 (home and places, 24/32), Finding: voices layer invisible on home

### Community 46 - "A Holy Alliance of Colonizing Powers: The Interwar Period"
Cohesion: 0.22
Nodes (9): A Holy Alliance of Colonizing Powers: The Interwar Period, Africa as a necessity: Geopolitical arguments, Damming the Mediterranean: Eurafrica as utopia, Emerging counter-movements: Concluding remarks, Empty space in the dark continent: Racial arguments, Eurafrican appeasement, Europe’s plantation: Pan-European beginnings, For greater moral and material profit: Eurafrica in foreign policy (+1 more)

### Community 47 - "**Agricultural Expansion, Population Growth, and Access to Land**"
Cohesion: 0.25
Nodes (8): **A More Nuanced View of  Vent for Surplus?**, **Agricultural Expansion, Population Growth, and Access to Land**, **Changing Agrarian Structures under Different Colonial Jurisdictions**, **Estates and Smallholders**, **Growth in Rice Production and Land Tenure**, **The Emergence of a Wage Labor Force**, **The Growth of Sugar as an Export Crop**, **Vent for Surplus in Theory and Practice**

### Community 48 - "**What Were Colonial Governments Doing?** The Myth of the Night Watchman State"
Cohesion: 0.29
Nodes (7): **Alternative Views of the Role of the Colonial State**, **Budgetary Surpluses and Colonial “ Drains”**, **Changing Expenditure Priorities**, **Determinants of Revenue and Expenditure Growth**, **Tax and Expenditure Policies: An Overview**, **The Incidence of  Taxation and Expenditures**, **What Were Colonial Governments Doing?** The Myth of the Night Watchman State

### Community 49 - "**International Trade, Balance of Payments, and Exchange Rate Policies: 1900 –1940**"
Cohesion: 0.29
Nodes (7): **Balance of Payments Surpluses, Investment Flows, and the Colonial “Drain”**, **Evolving Trade Regimes and Structures of Protection**, **Exchange Rate Policies**, **International Trade, Balance of Payments, and Exchange Rate Policies: 1900 –1940**, **Responses to Growing World Protectionism and the Japanese “ Threat ”**, **The Evolution of Commodity Trade Flows: 1900 –1940**, **The Open Dualistic Model and Its Implications**

### Community 50 - "**Economic Growth and Structural Change: 1900 –1940**"
Cohesion: 0.29
Nodes (7): C H A P T E R 3, **Economic Growth and Structural Change: 1900 –1940**, **Growth in National Output and Income: 1913 –1938**, **Growth of Agricultural Output**, **Growth of Nonagricultural Activities**, **Lessons**, **Population Growth**

### Community 51 - "**Changing Living Standards and Human Development**"
Cohesion: 0.33
Nodes (6): **Changing Living Standards and Human Development**, **Debates and Evidence about Trends in Living Standards in Colonial Asia**, **Demographic Indicators and Access to Education**, **Economic Growth and Living Standards**, **What Do Trends in Wages Tell Us about Living Standards?**, **Who Did Have the Highest Living Standards?**

### Community 52 - "**Growth and Diversifi cation of the Market Economy**"
Cohesion: 0.33
Nodes (6): **Growth and Diversifi cation of the Market Economy**, **Indigenous Entrepreneurship and Economic Opportunity in Colonial Korea and Taiwan**, **The Development of Markets for Land, Labor, and Capital: Indonesia and British Malaya Compared**, **The Emergence of the Plural Economy**, **The Precolonial Economy of Southeast Asia**, **The “Problem” of Indigenous Entrepreneurship**

### Community 53 - "Conclusion: Ending Colonialism by Securing its Continuation"
Cohesion: 0.33
Nodes (6): Anti-independence and yet non-colonial: Eurafrica institutionalized, Conclusion: Ending Colonialism by Securing its Continuation, Eurafrica’s disappearance from history, Eurafrica’s future: The new scramble for Africa, ‘European hunting ground’: Decolonization held in check, Vanishing mediator: The historical logic of Eurafrica

### Community 54 - "Bibliography"
Cohesion: 0.33
Nodes (6): Archives Consulted, Bibliography, Books, Articles and Chapters, Periodica, Printed Records of European Institutions and Organizations; State Governments and Parliaments; International Organizations, Treaties

### Community 55 - "C H A P T E R 9 **The Transition to Independent States**"
Cohesion: 0.40
Nodes (5): C H A P T E R 9 **The Transition to Independent States**, **Eradicating the Legacy of the Plural Economy**, **Growth and Structural Change after 1945**, **Inward- and Outward-Looking Economic Policies**, **Reforming Land Tenure and Promoting Agricultural Growth**

### Community 56 - "**The Greater Asian Co-Prosperity Sphere: 1942 –1945**"
Cohesion: 0.40
Nodes (5): **Emergence of the Greater Asian Co-Prosperity Sphere**, **The Economic Consequences of Japanese Control: Falling Production and Rising Prices**, **The Greater Asian Co-Prosperity Sphere: 1942 –1945**, **The Transition to Independence in Southeast Asia, Korea, and Taiwan**, **The Welfare Consequences of Japanese Control: Forced Labor, Starvation, and Premature Death**

### Community 57 - "**Introduction**"
Cohesion: 0.50
Nodes (4): **Assembling and Governing Empires in Southeast Asia**, **How Did Colonial Economies Function? Vent for Surplus Theory and the Open Dualistic Model of Colonial Development**, **Introduction**, **Questions  Addressed in This Study**

### Community 58 - "Introduction: The Past that Europe Forgot"
Cohesion: 0.50
Nodes (4): Eurafrica as method, Europe as a global power, European integration as a Eurafrican project, Introduction: The Past that Europe Forgot

### Community 59 - "prepare-wb2023.mjs"
Cohesion: 0.50
Nodes (3): IND, iso, out

## Knowledge Gaps
- **326 isolated node(s):** `motion`, `motion-plus`, `name`, `version`, `private` (+321 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `root` connect `root` to `build.mjs`, `add-note.mjs`, `prepare-truesize.mjs`, `prepare-geo.mjs`, `prepare-glottolog.mjs`, `seed-dish-drafts.mjs`, `lib.mjs`, `prepare-countries.mjs`, `add-story-images.mjs`, `seed-unesco-cards.mjs`, `review-note.mjs`, `prepare-wb2023.mjs`, `seed-capital-drafts.mjs`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `Creating the Cape Colony` connect `Creating the Cape Colony` to `Understanding the creation and expansion of settler colonies`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `Eurafrica` connect `Eurafrica` to `A Holy Alliance of Colonizing Powers: The Interwar Period`, `The Eurafrican Relaunch : The Treaty of Rome Negotiations, 1955–1957`, `Conclusion: Ending Colonialism by Securing its Continuation`, `Bibliography`, `Making Europe in Africa: The First Postwar Decade`, `Introduction: The Past that Europe Forgot`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `motion`, `motion-plus`, `name` to the rest of the system?**
  _326 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `build.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.051991150442477874 - nodes in this community are weakly interconnected._
- **Should `Profili delle 54 capitali` be split into smaller, more focused modules?**
  _Cohesion score 0.08045977011494253 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._