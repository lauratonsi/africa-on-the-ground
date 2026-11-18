# Graph Report - home-ground  (2026-11-18)

## Corpus Check
- 303 files · ~938,649 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 710 nodes · 1130 edges · 71 communities (59 shown, 12 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Site build core
- Content plan and editorial method
- Image download scripts
- Package and dependencies
- Page renderers
- Local voice notes CLI
- Africa maps
- True size tool
- True size data prep
- Two-layer editorial model
- Settler colonies (Cape) frontier
- Place and capital pages
- Connections explorer
- Eurafrica book
- Eurafrica: postwar integration
- Layout and navigation
- Geo utilities
- Languages data
- Glottolog prep
- Interactive recipes
- Cape Colony book
- Eurafrica: decolonisation era
- World Bank data prep
- Share and notes form
- Dish draft seeding
- Colonial Legacies (Asia) book
- Cape: endowments and property
- Eurafrica: interwar origins
- Places and art index
- Stories and food cards
- Content loader and validation
- Countries data prep
- Asia: agrarian change
- Cape: VOC and settlers
- Cape: inequality
- UNESCO card seeding
- Map page interactions
- Quiz engine
- Asia: colonial fiscal policy
- Asia: trade regimes
- Asia: growth
- Cape: slave labour
- Method Q&A search
- Asia: living standards
- Asia: indigenous enterprise
- Group 45: Anti-independence an, Conclusion: Ending C
- Group 46: Archives Consulted, Bibliography
- Group 47: review-note.mjs, args
- Group 48: C H A P T E R 9 **Th, **Eradicating the Le
- Group 49: **Emergence of the G, **The Economic Conse
- Group 50: _ctx.mjs, addSrc()
- Group 51: prepare-factbook.mjs, file
- Group 52: seed-capital-drafts., dir
- Group 53: story.js, el()
- Group 54: storygame.js, ask()
- Group 55: **Assembling and Gov, **How Did Colonial E
- Group 56: Eurafrica as method, Europe as a global p
- Group 57: Countries data: 54 s, True size page data:
- Group 58: Gestione dei contrib, Review after publica
- Group 59: Design critique 1 (h, Design critique 2 (h
- Group 60: .mcp.json, motion
- Group 61: fab.js, onScroll()
- Group 62: languages.js, startRound()
- Group 63: society.js, round()
- Group 65: Workflow: Controllo , Workflow: Pubblica s
- Group 66: Geo data README (Nat, Natural Earth bounda
- Group 68: Home Ground prototyp
- Group 69: Roadmap (proposta)

## God Nodes (most connected - your core abstractions)
1. `esc()` - 50 edges
2. `layout()` - 23 edges
3. `root` - 23 edges
4. `compactHero()` - 20 edges
5. `Eurafrica` - 17 edges
6. `renderPlace()` - 16 edges
7. `Understanding the creation and expansion of settler colonies` - 15 edges
8. `Creating the Cape Colony` - 14 edges
9. `renderStory()` - 14 edges
10. `renderCountries()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Two layers: documented record and local voices` --semantically_similar_to--> `Layer 1: documented record (every claim has a source)`  [INFERRED] [semantically similar]
  README.md → docs/metodo-editoriale.md
- `Two layers: documented record and local voices` --semantically_similar_to--> `Layer 2: local voices, shown as one person's experience`  [INFERRED] [semantically similar]
  README.md → docs/metodo-editoriale.md
- `Two layers: documented record vs local voices` --semantically_similar_to--> `Quality rule (sources, gaps, verification)`  [INFERRED] [semantically similar]
  PRODUCT.md → docs/piano-contenuti.md
- `Honest content status (drafts)` --semantically_similar_to--> `gaps field`  [INFERRED] [semantically similar]
  PRODUCT.md → docs/piano-contenuti.md
- `Avoid 'tribe' as a category` --rationale_for--> `Peoples section`  [INFERRED]
  PRODUCT.md → docs/piano-contenuti.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **CI check and Pages publishing pipeline** — github_workflows_check, github_workflows_pages [INFERRED 0.85]
- **The two-layer rule across README, method and plan** — readme_two_layers, docs_metodo_editoriale_documented_record, docs_metodo_editoriale_local_voices, docs_piano_contenuti_quality_rule [INFERRED 0.85]
- **Phased content pipeline: stories, places, dishes, paths** — docs_piano_contenuti_phase1_stories, docs_piano_contenuti_phase2_places, docs_piano_contenuti_phase3_dishes, docs_piano_contenuti_phase4_paths [EXTRACTED 1.00]
- **Capital research and quote verification flow** — docs_piano_contenuti_research_capitals, docs_piano_contenuti_assemble_py, docs_piano_contenuti_vq_py, docs_piano_contenuti_quote_verification, docs_piano_contenuti_sources_json, docs_piano_contenuti_capital_profiles [EXTRACTED 1.00]
- **Peoples index built from Factbook data** — docs_piano_contenuti_cia_factbook, docs_piano_contenuti_prepare_factbook, docs_piano_contenuti_africa_profiles_json, docs_piano_contenuti_peoples_index [EXTRACTED 1.00]

## Communities (71 total, 12 thin omitted)

### Community 0 - "Site build core"
Cohesion: 0.04
Nodes (54): bad, capAvail(), cName, countrySlug(), cPop, cSlug, css, data (+46 more)

### Community 1 - "Content plan and editorial method"
Cohesion: 0.05
Nodes (50): add-note (local voice notes), content/data/africa-profiles.json, 'What is happening in Africa today' section, African Foodways Data, Art catalogue, assemble.py, Short batches with human reread, British Museum African Rock Art (+42 more)

### Community 2 - "Image download scripts"
Cohesion: 0.07
Nodes (28): dir, only, picks, { polite }, dir, only, pick, dir (+20 more)

### Community 3 - "Package and dependencies"
Cohesion: 0.09
Nodes (21): motion, dependencies, motion, description, engines, node, name, private (+13 more)

### Community 4 - "Page renderers"
Cohesion: 0.21
Nodes (18): fmtAmt(), miniCard(), recipeHtml(), renderCountries(), blocLegend(), renderQuiz(), renderRich(), renderSociety() (+10 more)

### Community 5 - "Local voice notes CLI"
Cohesion: 0.12
Nodes (17): answers, args, data, entry, fail(), { fields, text }, file, how (+9 more)

### Community 6 - "Africa maps"
Cohesion: 0.20
Nodes (17): africa, africaMap(), africaPlacesMap(), choroplethMap(), countryCodes, countryLocator(), countryName(), gambia (+9 more)

### Community 7 - "True size tool"
Cohesion: 0.27
Nodes (16): add(), end(), clampTarget(), draw(), fmtArea(), invert(), mover(), nudge() (+8 more)

### Community 8 - "True size data prep"
Cohesion: 0.20
Nodes (13): africaF, densify(), dist(), EU27, ext(), measure(), out, ringCenter() (+5 more)

### Community 9 - "Two-layer editorial model"
Cohesion: 0.15
Nodes (15): Consent, anonymity and removal of notes, When a note disagrees with the record: only a source changes the record, Layer 1: documented record (every claim has a source), "Add your voice" form: prepares a message the person sends themselves, Declared gaps on every card, Layer 2: local voices, shown as one person's experience, Source labels: tier and status (verified, to-verify, draft), Adding a note (npm run add-note) (+7 more)

### Community 10 - "Settler colonies (Cape) frontier"
Cohesion: 0.14
Nodes (14): A very brief history of the Cape Colony, 1652–1796, Coordination costs and the establishment of the refreshment station, Indigenous agency and increased cost of trade, Institutions, factor endowments and forces of expansion, Settler economies and rational-choice political economy, The closing of the frontier, The early frontier literature and the people without history, The failure of intensive farming (+6 more)

### Community 11 - "Place and capital pages"
Cohesion: 0.34
Nodes (14): deeperHtml(), fmtDate(), makeCiter(), noteCard(), pageChecks(), pageCountrySlug(), renderCapital(), renderCountryPage() (+6 more)

### Community 12 - "Connections explorer"
Cohesion: 0.38
Nodes (13): bfs(), escapeHtml(), go(), h(), hideSuggestions(), newQuest(), questCheck(), renderActiveCard() (+5 more)

### Community 13 - "Eurafrica book"
Cohesion: 0.15
Nodes (12): **Bloomsbury Academic**, **Bloomsbury is a registered trade mark of Bloomsbury Publishing Plc**, **British Library Cataloguing-in-Publication Data**, Contents, Eurafrica, Illustrations, Index, **Library of Congress Cataloging-in-Publication Data** (+4 more)

### Community 14 - "Eurafrica: postwar integration"
Cohesion: 0.15
Nodes (13): A Eurafrican Common Market: Agreement reached, A statue to Nasser: Triumphant Eurafricanism, Associate the overseas: The French–Belgian argument, Countering Bandung: The United Nations, Europe as revenge: The Suez Crisis, For the equilibrium of the world: Stalled negotiations, German convictions: Brentano to Adenauer, ‘Great things’: The Venice Conference (+5 more)

### Community 15 - "Layout and navigation"
Cohesion: 0.21
Nodes (12): aliasOf(), compactHero(), fab(), landscape(), layout(), navHtml(), parseEthnic(), prefix() (+4 more)

### Community 16 - "Geo utilities"
Cohesion: 0.30
Nodes (8): round(), simplify(), africa, countries, pick(), rings(), river, shape()

### Community 17 - "Languages data"
Cohesion: 0.32
Nodes (10): LANGS, spokenLanguages(), T, decode(), flat(), governmentGroup(), items(), LANG_NAME (+2 more)

### Community 18 - "Glottolog prep"
Cohesion: 0.18
Nodes (10): af, africaCounts, by, core, famOf(), fams, [head, ...body], out (+2 more)

### Community 19 - "Interactive recipes"
Cohesion: 0.32
Nodes (9): build(), close(), el(), fmt(), open(), progress(), render(), show() (+1 more)

### Community 20 - "Cape Colony book"
Cohesion: 0.18
Nodes (10): Acknowledgements, Concluding remarks, Contents, Creating the Cape Colony, Index, List of figures, List of maps, List of tables (+2 more)

### Community 21 - "Eurafrica: decolonisation era"
Cohesion: 0.18
Nodes (11): A third world power: The British response, Africa as an essential European task: The Schuman Declaration, Africa first! The French response, Africans in European Parliaments? The European Political Community, Anti-colonial momentum: Consolidating empires after the war, Cooperation overseas: The Council of Europe and the OEEC, Europe’s last chance: Concluding remarks, Internationalizing the colonies: The European movement (+3 more)

### Community 22 - "World Bank data prep"
Cohesion: 0.18
Nodes (7): root, IND, iso, out, dir, dist, types

### Community 23 - "Share and notes form"
Cohesion: 0.35
Nodes (10): build(), button(), copy(), curKind(), drawFields(), problem(), read(), say() (+2 more)

### Community 24 - "Dish draft seeding"
Cohesion: 0.22
Nodes (7): draft, existingCountries, existingFiles, notesDir, placesDir, proposed, read()

### Community 25 - "Colonial Legacies (Asia) book"
Cohesion: 0.22
Nodes (8): **A Note on Terminology**, **About the Author**, **Acknowledgments**, **Bibliography**, _cedula_ , 82, **Conclusions**, **Contents**, **Index**

### Community 26 - "Cape: endowments and property"
Cohesion: 0.22
Nodes (9): Economic growth in the Dutch Cape Colony, Expansion and inheritance, Factor endowments, institutions and the closing of the south-western frontier, Factor endowments, institutions and the expansion of the frontier, Population growth at the Cape, Property rights and agricultural investments, Property rights and landed conflicts, Property rights and the expansion of the frontier (+1 more)

### Community 27 - "Eurafrica: interwar origins"
Cohesion: 0.22
Nodes (9): A Holy Alliance of Colonizing Powers: The Interwar Period, Africa as a necessity: Geopolitical arguments, Damming the Mediterranean: Eurafrica as utopia, Emerging counter-movements: Concluding remarks, Empty space in the dark continent: Racial arguments, Eurafrican appeasement, Europe’s plantation: Pan-European beginnings, For greater moral and material profit: Eurafrica in foreign policy (+1 more)

### Community 28 - "Places and art index"
Cohesion: 0.31
Nodes (9): art(), citedIds(), foodDishCard(), placeItems, renderArt(), renderPlaces(), sourcingNote(), typeIcon() (+1 more)

### Community 29 - "Stories and food cards"
Cohesion: 0.33
Nodes (9): checkHtmlWith(), foodStoryCard(), foodStoryImage(), readMin(), renderFood(), renderStories(), storyCard(), storyHref() (+1 more)

### Community 30 - "Content loader and validation"
Cohesion: 0.33
Nodes (7): HOW, loadAll(), readJson(), report(), RICH, validate(), result

### Community 31 - "Countries data prep"
Cohesion: 0.25
Nodes (8): CAPITALS, countries, indicator(), json(), meta, NAMES, out, SUBREGIONS

### Community 32 - "Asia: agrarian change"
Cohesion: 0.25
Nodes (8): **A More Nuanced View of  Vent for Surplus?**, **Agricultural Expansion, Population Growth, and Access to Land**, **Changing Agrarian Structures under Different Colonial Jurisdictions**, **Estates and Smallholders**, **Growth in Rice Production and Land Tenure**, **The Emergence of a Wage Labor Force**, **The Growth of Sugar as an Export Crop**, **Vent for Surplus in Theory and Practice**

### Community 33 - "Cape: VOC and settlers"
Cohesion: 0.25
Nodes (8): Clashes between the VOC and the settlers, Elites, coalitions and settler resistance, Introduction, Landlords and labour: Productive or permissive contracts?, The fiscal capacity of the VOC, The limited political influence of the gentry, Trade, profits and the settler elites, Typologies of settler colonialism

### Community 34 - "Cape: inequality"
Cohesion: 0.25
Nodes (8): Conclusion, Explaining inequality in pre-industrial colonial societies, Explaining inequality trends among the settler farming population, Gender, inheritance and wealth accumulation, Inequality and initial sources of capital, Inequality trends in the eighteenth-century Cape Colony, Labour and accumulation in the seventeenth-century Cape Colony, Unequal we stand

### Community 35 - "UNESCO card seeding"
Cohesion: 0.25
Nodes (4): ids, S, sourcesPath, U

### Community 37 - "Quiz engine"
Cohesion: 0.50
Nodes (7): ask(), begin(), finish(), round(), showStart(), shuffle(), sourceLine()

### Community 38 - "Asia: colonial fiscal policy"
Cohesion: 0.29
Nodes (7): **Alternative Views of the Role of the Colonial State**, **Budgetary Surpluses and Colonial “ Drains”**, **Changing Expenditure Priorities**, **Determinants of Revenue and Expenditure Growth**, **Tax and Expenditure Policies: An Overview**, **The Incidence of  Taxation and Expenditures**, **What Were Colonial Governments Doing?** The Myth of the Night Watchman State

### Community 39 - "Asia: trade regimes"
Cohesion: 0.29
Nodes (7): **Balance of Payments Surpluses, Investment Flows, and the Colonial “Drain”**, **Evolving Trade Regimes and Structures of Protection**, **Exchange Rate Policies**, **International Trade, Balance of Payments, and Exchange Rate Policies: 1900 –1940**, **Responses to Growing World Protectionism and the Japanese “ Threat ”**, **The Evolution of Commodity Trade Flows: 1900 –1940**, **The Open Dualistic Model and Its Implications**

### Community 40 - "Asia: growth"
Cohesion: 0.29
Nodes (7): C H A P T E R 3, **Economic Growth and Structural Change: 1900 –1940**, **Growth in National Output and Income: 1913 –1938**, **Growth of Agricultural Output**, **Growth of Nonagricultural Activities**, **Lessons**, **Population Growth**

### Community 41 - "Cape: slave labour"
Cohesion: 0.29
Nodes (7): Khoesan labour, Slaves as capital at the Cape, The Cape as a slave economy, The economics of slave labour, The productivity of slave labour revisited, The rise of slavery at the Cape, Was the Cape Colony a slave economy?

### Community 42 - "Method Q&A search"
Cohesion: 0.57
Nodes (6): escapeHtml(), findBestMatches(), handleQuery(), renderResult(), scoreItem(), tokenize()

### Community 43 - "Asia: living standards"
Cohesion: 0.33
Nodes (6): **Changing Living Standards and Human Development**, **Debates and Evidence about Trends in Living Standards in Colonial Asia**, **Demographic Indicators and Access to Education**, **Economic Growth and Living Standards**, **What Do Trends in Wages Tell Us about Living Standards?**, **Who Did Have the Highest Living Standards?**

### Community 44 - "Asia: indigenous enterprise"
Cohesion: 0.33
Nodes (6): **Growth and Diversifi cation of the Market Economy**, **Indigenous Entrepreneurship and Economic Opportunity in Colonial Korea and Taiwan**, **The Development of Markets for Land, Labor, and Capital: Indonesia and British Malaya Compared**, **The Emergence of the Plural Economy**, **The Precolonial Economy of Southeast Asia**, **The “Problem” of Indigenous Entrepreneurship**

### Community 45 - "Group 45: Anti-independence an, Conclusion: Ending C"
Cohesion: 0.33
Nodes (6): Anti-independence and yet non-colonial: Eurafrica institutionalized, Conclusion: Ending Colonialism by Securing its Continuation, Eurafrica’s disappearance from history, Eurafrica’s future: The new scramble for Africa, ‘European hunting ground’: Decolonization held in check, Vanishing mediator: The historical logic of Eurafrica

### Community 46 - "Group 46: Archives Consulted, Bibliography"
Cohesion: 0.33
Nodes (6): Archives Consulted, Bibliography, Books, Articles and Chapters, Periodica, Printed Records of European Institutions and Organizations; State Governments and Parliaments; International Organizations, Treaties

### Community 47 - "Group 47: review-note.mjs, args"
Cohesion: 0.33
Nodes (4): args, by, date, dir

### Community 48 - "Group 48: C H A P T E R 9 **Th, **Eradicating the Le"
Cohesion: 0.40
Nodes (5): C H A P T E R 9 **The Transition to Independent States**, **Eradicating the Legacy of the Plural Economy**, **Growth and Structural Change after 1945**, **Inward- and Outward-Looking Economic Policies**, **Reforming Land Tenure and Promoting Agricultural Growth**

### Community 49 - "Group 49: **Emergence of the G, **The Economic Conse"
Cohesion: 0.40
Nodes (5): **Emergence of the Greater Asian Co-Prosperity Sphere**, **The Economic Consequences of Japanese Control: Falling Production and Rising Prices**, **The Greater Asian Co-Prosperity Sphere: 1942 –1945**, **The Transition to Independence in Southeast Asia, Korea, and Taiwan**, **The Welfare Consequences of Japanese Control: Forced Labor, Starvation, and Premature Death**

### Community 51 - "Group 51: prepare-factbook.mjs, file"
Cohesion: 0.40
Nodes (3): file, FIPS, out

### Community 54 - "Group 54: storygame.js, ask()"
Cohesion: 0.90
Nodes (4): ask(), finish(), shuffle(), start()

### Community 55 - "Group 55: **Assembling and Gov, **How Did Colonial E"
Cohesion: 0.50
Nodes (4): **Assembling and Governing Empires in Southeast Asia**, **How Did Colonial Economies Function? Vent for Surplus Theory and the Open Dualistic Model of Colonial Development**, **Introduction**, **Questions  Addressed in This Study**

### Community 56 - "Group 56: Eurafrica as method, Europe as a global p"
Cohesion: 0.50
Nodes (4): Eurafrica as method, Europe as a global power, European integration as a Eurafrican project, Introduction: The Past that Europe Forgot

### Community 57 - "Group 57: Countries data: 54 s, True size page data:"
Cohesion: 0.67
Nodes (3): Countries data: 54 states from World Bank and UN M49, True size page data: Equal Earth areas, not mixed with World Bank areas, Countries page and World Bank data

### Community 58 - "Group 58: Gestione dei contrib, Review after publica"
Cohesion: 0.67
Nodes (3): Gestione dei contributi, Review after publication (local reader), Sensitive places flag

### Community 59 - "Group 59: Design critique 1 (h, Design critique 2 (h"
Cohesion: 0.67
Nodes (3): Design critique 1 (home, 24/32), Design critique 2 (home and places, 24/32), Finding: voices layer invisible on home

## Knowledge Gaps
- **337 isolated node(s):** `river`, `af`, `africaCounts`, `by`, `fams` (+332 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `root` connect `World Bank data prep` to `Site build core`, `Image download scripts`, `UNESCO card seeding`, `Local voice notes CLI`, `Africa maps`, `True size data prep`, `Group 47: review-note.mjs, args`, `Geo utilities`, `Glottolog prep`, `Group 51: prepare-factbook.mjs, file`, `Group 52: seed-capital-drafts., dir`, `Dish draft seeding`, `Content loader and validation`, `Countries data prep`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `Eurafrica` connect `Eurafrica book` to `Group 45: Anti-independence an, Conclusion: Ending C`, `Group 46: Archives Consulted, Bibliography`, `Eurafrica: postwar integration`, `Eurafrica: decolonisation era`, `Group 56: Eurafrica as method, Europe as a global p`, `Eurafrica: interwar origins`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `esc()` connect `Page renderers` to `Site build core`, `Africa maps`, `Place and capital pages`, `Layout and navigation`, `Places and art index`, `Stories and food cards`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `river`, `af`, `africaCounts` to the rest of the system?**
  _337 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Site build core` be split into smaller, more focused modules?**
  _Cohesion score 0.040726817042606514 - nodes in this community are weakly interconnected._
- **Should `Content plan and editorial method` be split into smaller, more focused modules?**
  _Cohesion score 0.054693877551020405 - nodes in this community are weakly interconnected._
- **Should `Image download scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.07051282051282051 - nodes in this community are weakly interconnected._