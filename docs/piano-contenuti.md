# Piano dei contenuti: storie, luoghi, piatti, percorsi

Aggiornato l'8 ottobre 2026. Si lavora per fasi, in quest'ordine, e ogni fase procede a lotti brevi che una persona rilegge prima del lotto successivo.

## Dove siamo

| | Oggi | Obiettivo della fase |
|---|---|---|
| Pagine dei Paesi | 54 (generate dai dati) | fatto; si arricchiscono con le fasi successive |
| Storie | 15 (5 storia, 7 miti, 3 cibo; vedi `content/stories`) | circa 30 |
| Luoghi | 57 schede, quasi tutte siti UNESCO | altri 2 per Paese, di tipo diverso (città vive, mercati, musei, parchi) |
| Piatti | 4 schede pubblicate (koshari, cachupa, seswaa, thieboudienne), 50 bozze tracciate (inclusa domoda), più 3 storie di cibo | una scheda per Paese (54), da `proposed-dishes.json` |
| Percorsi | 0 | 5 o 6 percorsi che collegano luoghi, storie e dati |

## Regola di qualità, uguale per tutte le fasi

- Ogni frase ha una fonte, o è dichiarata come commento. Nessuna cifra senza anno e senza fonte.
- Ogni nuova scheda o storia ha almeno una fonte che non sia UNESCO né Wikipedia. Dove non si trova, lo si dice nei "gaps" e la scheda resta "outline".
- Ogni contenuto ha il suo campo `gaps`: che cosa non sappiamo, che cosa manca, che cosa va controllato.
- I numeri calcolati qui si dichiarano come calcolati, con la fonte dei dati.
- Le fonti bloccate (UNESCO, Britannica, alcuni quotidiani) si sostituiscono, mai si inventano.
- Dopo ogni lotto: `npm run check`, controllo a occhio su telefono, e una rilettura umana prima di pubblicare.

## Fase 1: storie (in corso)

Lotti di 5 o 6 storie, tre tipi in equilibrio: **storia**, **miti da smontare**, **cibo**. Ogni storia dà anche 1 o 2 domande al quiz.

- Lotto 1 (fatto): continente e non Paese, lingue, conferenza di Berlino.
- Lotto 2 (fatto): villaggi e città, ricchezza, Adwa ed Etiopia, Kush, Kilwa, manioca.
- Lotto 3 (da fare), proposte da confermare: Ghana, Mali e Songhai come sistema commerciale; il Sahara non è tutta l'Africa; Lalibela e il cristianesimo etiope; lo swahili come lingua di scambio; la Carta di Kouroukan Fouga; il caffè dall'Etiopia; la musica come memoria; le università più antiche (Fez, Timbuktu).
- Lotto 4 (da fare): miti sul clima, sulla fauna e sulla salute; storie di cibo (couscous, thieboudienne, ugali); storia della decolonizzazione.

Fonti: istituzionali o accademiche quando esistono (Banca Mondiale, ONU, UA, Glottolog, Factbook); World History Encyclopedia e Wikipedia solo come appoggio, sempre segnate "to verify".

## Fase 2: luoghi

Per Paese, due luoghi in più di tipo diverso da un sito UNESCO. Si parte dalle regioni con meno schede vive. Lotti di circa 10 schede per regione.

- Tipi: città (anche piccole), mercati, musei e università, parchi e paesaggi, luoghi della cultura viva.
- Ogni scheda ha foto con licenza aperta e credito, come le altre. Dove non c'è foto, il sito lo dice.
- Le schede nuove nascono "documentate" solo con fonti non UNESCO; altrimenti "outline".

## Fase 3: piatti

Un piatto per Paese (54), come scheda di tipo `dish`. L'elenco di partenza è in `content/data/proposed-dishes.json`: è una proposta, con un livello di fiducia per ogni voce (alto, medio, basso). I piatti a bassa fiducia vanno confermati con te prima di essere ricercati.

- **Regola sulle affermazioni.** Nessuna scheda dice che un piatto è "nazionale" se non lo dice una fonte seria. I giornali e i blog lo ripetono spesso (per esempio per il Gambia e per l'Egitto) e non sempre sono d'accordo tra loro.
- **Che cosa c'è in una scheda.** Che cos'è, di che cosa è fatto, come e dove si mangia, nomi nelle lingue locali, origine con le tesi in conflitto, e `gaps`. Senza coordinate: la scheda sta nell'elenco dei luoghi, non sulla mappa.
- **Fonti.** Almeno tre fonti giornalistiche o accademiche leggibili per scheda, quando i pareri sulle origini divergono; Wikipedia solo come appoggio e mai come unica fonte.
- **Foto.** Da Wikimedia Commons con licenza aperta; si vede il piatto servito.
- **Condivisioni.** Dove un piatto è di più Paesi (moambe, couscous, ugali, nsima, thieb) si sceglie un'alternativa o si fa una scheda sola con più Paesi.
- **Ordine dei lotti.** Prima i piatti ad alta fiducia (circa 20), poi quelli a media, infine quelli a bassa fiducia dopo una tua conferma. Lotti di 5 o 6 schede.
- **Stato.** Koshari (Egitto), cachupa (Capo Verde), seswaa (Botswana) e thieboudienne (Senegal) sono pubblicati con foto; le altre 50 schede sono bozze generate dal registro, con Domoda (Gambia) già dotata di foto. Il comando `npm run seed-dish-drafts` ricrea solo le schede mancanti e il validator controlla i collegamenti.

## Fase 4: percorsi

Pagine che collegano luoghi, storie, piatti e dati attorno a un tema: scrittura e archivi, rotte commerciali, confini coloniali, lingue, cucina e scambi, città. Ogni percorso è una sequenza di 5 o 8 tappe con una domanda di apertura e una di chiusura.

## Da non dimenticare

- Le voci locali arrivano con il modulo: per ogni lotto, almeno una persona del posto da cui sperare una lettura.
- Il quiz cresce con le storie (due domande per storia).
- Le pagine dei Paesi si aggiornano da sole quando entrano schede e storie nuove.

## Da fare dopo il miglioramento delle storie esistenti (idee del 14 novembre 2026)

Obiettivo di fondo, deciso il 14 novembre 2026: il sito insegna in modo interattivo a un pubblico adulto e unisce molti lati delle culture africane; non è una guida turistica. Ogni storia nuova segue il modello di "The children Italy did not recognise": riquadro "In short", numeri, stima, cronologia, gioco dell'ordine, grafici o tabelle, domande e immagini con licenza aperta.

- **Digital divide e mito del "cellulare per tutti".** Spiegare la differenza tra abbonamenti SIM, persone che usano internet, copertura di rete, costo dei dati e uso reale; sfatare l'idea che quasi tutti in Africa abbiano un cellulare. Fonti da cercare: ITU, GSMA (Mobile Economy Africa), Banca Mondiale, Afrobarometer. Dati per Paese con grafici selezionabili e tabella ordinabile; una stima con cursore ("quante persone usano internet?").
- **"Cosa succede in Africa oggi".** Una sezione di aggiornamento su conflitti, crisi umanitarie e genocidi in corso: ogni affermazione con fonti istituzionali o di ricerca (ONU, ACLED, Uppsala Conflict Data Program, corti internazionali), distinzione netta tra "accertato da un tribunale o da un organo ONU" e "accusato o indagato", date degli ultimi aggiornamenti dichiarate, voci locali solo con il consenso e con particolare cura. Argomento delicato: lotti piccoli e rilettura umana prima di pubblicare.

## Luoghi da vedere, a partire dalle capitali (idea del 14 novembre 2026)

Stato: le 54 capitali hanno ciascuna un profilo vuoto in `content/capitals/` (bozze create da `scripts/seed-capital-drafts.mjs`, non ancora ricercate). Le schede dei luoghi sono 55 siti UNESCO più pochi piatti, un mercato e qualche luogo di cultura o natura.

Come procedere, a lotti di 5 o 6 capitali per regione, con rilettura umana dopo ogni lotto:
- **Profilo della capitale** nello stesso formato interattivo delle storie: "In short", numeri (popolazione della città con fonte e anno), cronologia con filtri, una stima con cursore, il gioco dell'ordine, una domanda "mito o fatto" e un'immagine con licenza aperta.
- **Da vedere**: da 3 a 5 luoghi per capitale che non siano siti UNESCO (mercati, musei, università, parchi, luoghi della cultura viva), ciascuno come scheda nel sito e collegato al profilo.
- **Fonti**: almeno una non UNESCO e non Wikipedia per ogni profilo o scheda; dove manca, la scheda resta "outline" con i `gaps` dichiarati.
- **Voci locali**: ogni profilo invita una persona della città a leggerlo, con la cura già prevista per i luoghi legati a storie dolorose.
- Il formato delle schede dei luoghi ora accetta gli stessi blocchi delle storie (stima, ordine, tabella, domande, ricetta); basta riempirle.

## Un altro lato da esplorare: arte (ricognizione del 14 novembre 2026)

La pista è sostenibile: esiste molto materiale digitale, ma diviso in famiglie con accessibilità e diritti diversi. Non conviene partire da una galleria indistinta di immagini; meglio costruire schede brevi, con contesto, luogo, comunità, data o periodo, materiali, funzione e licenza della riproduzione.

- **Arte rupestre e archeologia**: il progetto African Rock Art del British Museum ha catalogato circa 23.000 fotografie digitali, esplorabili per Paese e tema; le immagini sono dichiarate utilizzabili per studio, ricerca e insegnamento. È materiale adatto a mappe, confronti temporali e storie sulla lettura del paesaggio.
- **Collezioni museali e oggetti**: Smithsonian/National Museum of African Art, The Met e British Museum offrono cataloghi online di migliaia di oggetti, con schede, provenienze, periodi, materiali e in alcuni casi immagini ad alta risoluzione o open access. Tipi ricorrenti: scultura, maschere, ceramica, metalli, tessili, gioielli, fotografia e arte moderna/contemporanea.
- **Patrimonio costruito e cultura viva**: UNESCO, Dive into Heritage, Afro Heritage Atlas e African Built Heritage Digital Hub collegano siti, architetture, tecniche, rituali, musica, danza e artigianato. Qui il materiale non è solo "opera": è pratica, luogo, memoria e trasmissione; servono fonti locali e consenso quando si documentano conoscenze sensibili.
- **Arte contemporanea**: esistono archivi di artisti, biennali, gallerie, mostre digitali e guide di ricerca, ma il materiale è più frammentato e spesso protetto da copyright. È una pista ricca per profili e percorsi, meno adatta al riuso diretto delle immagini.
- **Fotografie e archivi storici**: gli archivi fotografici, per esempio quelli collegati allo Smithsonian, permettono di raccontare persone, atelier, performance e trasformazioni urbane; bisogna distinguere sempre tra immagine consultabile e immagine riutilizzabile.

Primo possibile perimetro editoriale, da verificare prima di iniziare:

1. **Segni nel paesaggio**: arte rupestre, incisioni, pitture e archeologia, con una mappa e una cronologia.
2. **Oggetti che fanno cose**: maschere, tessili, ceramiche, sculture e strumenti, spiegando funzione e contesto invece di presentarli come oggetti esotici.
3. **Luoghi che producono cultura**: laboratori, musei, scuole, quartieri, festival e biennali.
4. **Pratiche vive**: tecniche, musica, danza, tatuaggio, acconciature e artigianato, solo con voci e fonti adeguate.

Fonti di partenza: [British Museum African Rock Art](https://africanrockart.britishmuseum.org/), [National Museum of African Art](https://africa.si.edu/collection/), [Smithsonian Collections Search](https://collections.si.edu/search/), [The Met, African Art](https://www.metmuseum.org/departments/african-art), [UNESCO Priority Africa](https://ich.unesco.org/en/priority-africa), [UNESCO Dive into Heritage](https://whc.unesco.org/en/dive-into-heritage/), [Afro Heritage Atlas](https://afroatlas.org/) e [African Built Heritage Digital Hub](https://african-built-heritage-nu.hub.arcgis.com/).

## Regola di fondo (14 novembre 2026)

Il gioco e l'interattività sono la base di tutte le sezioni, non solo delle storie: storie, schede dei luoghi, profili delle capitali, la pagina Method e le pagine di dati usano la stessa famiglia di blocchi. La pagina Method è ora costruita da `content/pages/method.json` con gli stessi blocchi, con numeri contati dal contenuto del sito a ogni build.

### Avanzamento dei profili delle capitali (aggiornato il 14 novembre 2026)

Si procede zona per zona (le cinque sottoregioni del sito). Il metodo: una ricerca per capitale con regole di fonti fisse (niente Wikipedia, Britannica, BBC o UNESCO come unica fonte; ogni dato con citazione letta), poi `assemble.py` trasforma i risultati in profilo, schede dei luoghi, fonti e scelte di immagini; le bozze restano `draft` finché una persona non le rilegge. Le ricerche grezze con le citazioni sono in `docs/research/capitals/`.

- **Africa australe (5 capitali): fatto in bozza** (Gaborone, Maseru, Pretoria, Windhoek, Mbabane), 22 schede di luoghi nuove. Punti deboli: fonti istituzionali spesso illeggibili (siti di statistica e di turismo non raggiungibili); per Gaborone sono state tolte le frasi su fondazione, trasferimento da Mafeking e indipendenza perché reggevano solo su siti deboli; per quasi tutte manca un mercato.
- **Africa settentrionale (6 capitali): completato in bozza (6/6)**:
  - Algeri (DZA): profilo compilato con dati censuari ONS/CityPopulation (2,36M agglomerazione urbana), 4 nuove schede luoghi (Maqam Echahid, Jardin d'Essai du Hamma, Musée National des Beaux-Arts, Grande Poste) collegate al profilo assieme alla Casbah (UNESCO). Ricerca documentata in `docs/research/capitals/algiers.json`.
  - Rabat (MAR): profilo compilato con dati censuari HCP 2024 (509k città, >1,8M conurbazione), 4 nuove schede luoghi (Kasbah des Oudayas, Hassan Tower and Mausoleum of Mohammed V, Chellah, Musée Mohammed VI d'Art Moderne et Contemporain). Ricerca documentata in `docs/research/capitals/rabat.json`.
  - Tunisi (TUN): profilo compilato con dati censuari INS 2024 (604k comune, 2,64M Grand Tunis), 4 nuove schede luoghi (Bardo National Museum, Ez-Zitouna Mosque, Avenue Habib Bourguiba, Dar Lasram) collegate al profilo assieme alla Medina di Tunisi (UNESCO). Ricerca documentata in `docs/research/capitals/tunis.json`.
  - Il Cairo (EGY): profilo compilato con dati censuari CAPMAS 2017 (9,54M Governatorato, >20,1M Grande Cairo), 4 nuove schede luoghi (Al-Azhar Mosque, Citadel of Saladin, Khan el-Khalili, Egyptian Museum in Tahrir) collegate al profilo assieme a Memphis/Necropoli (UNESCO). Ricerca documentata in `docs/research/capitals/cairo.json`.
  - Tripoli (LBY): profilo compilato con dati censuari 2006 (1,06M distretto di Tripoli, stima urbana 1,2-1,3M), 4 nuove schede luoghi (Red Castle Museum / Assaraya Al-Hamra, Arch of Marcus Aurelius, Gurgi Mosque, Martyrs' Square). Ricerca documentata in `docs/research/capitals/tripoli.json`.
  - Khartum (SDN): profilo compilato con dati censuari CBS 2008 (4,27M conurbazione tripartita Khartum-Omdurman-Bahri, 5,27M stato di Khartum; nota esplicita sull'impatto e lo sfollamento del conflitto 2023-2024), 4 nuove schede luoghi (National Museum of Sudan, Nile Confluence Al-Mugran, Mahdi Tomb and Khalifa House, Souq Omdurman) collegate al profilo assieme all'Isola di Meroe (UNESCO). Ricerca documentata in `docs/research/capitals/khartoum.json`.
- Prossime zone, nell'ordine: Africa centrale (9), occidentale (16), orientale (18).
