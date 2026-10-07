# Metodo editoriale

Regole del progetto. La versione pubblica, in inglese, è `content/pages/method.html`: le due devono dire le stesse cose.

## Strato 1: il racconto documentato

- **Ogni affermazione ha una fonte.** Una frase senza citazione è ammessa solo se è un tuo commento di raccordo
  e la marchi `"editorial": true`. Non deve contenere fatti.
- **Parafrasa.** Non copiare passaggi dalle fonti. Eventuali citazioni dirette brevi, tra virgolette, con la fonte accanto.
- **Etichetta le fonti.** Tipo: istituzionale, stampa, accademica, primaria, enciclopedia.
  Stato: `verified` solo se hai letto la fonte e ne sei sicura; `to-verify` per ciò che è un punto di partenza
  (le voci di enciclopedia lo sono sempre); `draft` per testi non definitivi.
- **Risali alle fonti originali.** Una voce di enciclopedia che riassume uno studio è un'indicazione per trovare
  lo studio, non un punto di arrivo.
- **Dichiara le lacune.** Ogni scheda ha una sezione "Not yet sourced" con ciò che non si sa o non si è trovato.
  Un numero non trovato non si stima: si scrive che manca.
- **Data di consultazione.** Ogni fonte ha `retrieved`. Per ciò che cambia nel tempo (stato di conservazione,
  incarichi, prezzi) la scheda deve dire a che data si riferisce.

## Strato 2: le voci

- **Consenso.** Una nota si pubblica solo se l'autore ha accettato, dopo aver saputo che il repository è pubblico
  e che il testo resta nella cronologia di GitHub anche dopo una rimozione dal sito. Registra data e modalità.
  Se la nota arriva dal modulo del sito, il consenso è la casella spuntata e il testo che la accompagna, che finisce
  nel messaggio. Conserva il messaggio originale fuori dal repository come prova.
- **Anonimato facoltativo.** Nome o soprannome si pubblicano solo se l'autore li vuole. Il legame con il luogo è
  un'etichetta scelta dall'autore e non viene verificata.
- **Nessun contatto nel repository.** Niente email, telefoni, profili. La validazione blocca i casi più evidenti,
  ma la responsabilità è di chi inserisce la nota.
- **Non si riscrive.** Il testo resta com'è, salvo refusi concordati con l'autore. Una traduzione si dichiara
  (campo `lang` per la lingua originale) e va riletta, se possibile, da chi ha scritto la nota.
- **"Cosa evitare".** Preferisci abitudini e pratiche ("a casa si mangia così") a giudizi su attività commerciali
  precise: nominare un locale come trappola per turisti espone l'autore e il progetto a contestazioni.
- **Rimozione.** Chi ha scritto una nota può chiedere in qualsiasi momento di toglierla. Si rimuove dal file e si
  ripubblica. Se serve cancellare anche la cronologia di Git, è un'operazione a parte da valutare caso per caso.

## Come arrivano le note dal sito

Ogni scheda ha un modulo "Add your voice". Il modulo **non invia nulla dal sito**: compone nel browser un messaggio e
apre WhatsApp, l'email o Signal con il testo già scritto, e la persona decide se inviarlo. Così il sito non raccoglie
dati e le promesse della pagina Method restano vere.

- I canali si impostano in `site.config.json`, campo `channels`: `whatsapp` (solo cifre con il prefisso, senza +),
  `email` e `link` (per esempio Signal). Un canale senza valore non compare. Senza nessun canale il modulo può solo
  copiare il messaggio.
- Usa un numero e un indirizzo dedicati al progetto, non quelli personali: compaiono nella pagina e nel codice.
- Il modulo controlla consenso, lunghezza e assenza di email e numeri di telefono, come `npm run check`.
- Il messaggio ricevuto si trasforma in nota con `npm run add-note` (vedi il README): il comando applica le stesse
  regole e registra data e modalità del consenso. Poi si legge la nota prima di pubblicare, come sempre.
- Prima di rendere pubblico il numero o l'indirizzo, prepara l'informativa per chi scrive: chi riceve il messaggio,
  perché, per quanto lo conservi, come chiedere la rimozione. Il testo del modulo ("What happens to your note") è un
  punto di partenza e va verificato con chi può dare un parere professionale. Questo documento non è una consulenza legale.

## Quando uno strato contraddice l'altro

Nessuno dei due sovrascrive l'altro. Se una nota di tipo "Correction to the record" segnala un errore, si cerca
una fonte che chiarisca il punto. Il racconto cambia solo se la si trova, e la modifica è citata come tutto il resto.
Se non la si trova, la questione può entrare nelle lacune della scheda.

## Voci diverse sullo stesso luogo

Un abitante del villaggio, un gambiano di un'altra regione e uno della diaspora in Italia non dicono le stesse cose.
Più note sulla stessa scheda sono la norma, non un'anomalia. Non scegliere "la" voce locale e non riassumerle in una sola.

## La pagina Countries

- I dati vengono da fonti istituzionali (Banca Mondiale, ONU) e sono citati come nelle schede. Si dichiara l'anno di
  ciascun valore e che le cifre di popolazione sono stime.
- Ciò che è calcolato qui (percentuali, densità, fasce di colore) è dichiarato come tale.
- Non si stima ciò che manca: il Sahara Occidentale e gli altri territori senza cifre per paese restano fuori e
  la pagina lo scrive tra le lacune.
- I confini sono quelli di fatto di Natural Earth. La pagina non prende posizione sulle frontiere contestate.
- Nessuna voce locale in questa pagina: è tutta nello strato documentato.

## Fotografie

- Solo immagini con licenza aperta (per ora da Wikimedia Commons), scaricate e ospitate nel sito: nessuna immagine
  viene caricata da altri domini.
- Ogni foto ha nel file della scheda `image` con testo alternativo, didascalia, autore, licenza, indirizzo della
  licenza e indirizzo del file originale. Il build si ferma se manca uno di questi campi o se mancano i file.
- Si controlla che la foto mostri davvero quel luogo (le categorie di Commons aiutano) e si scrive in didascalia
  solo ciò che la foto o la sua scheda dicono, per esempio l'anno dello scatto.
- Le foto con licenza "share alike" restano sotto la propria licenza anche dentro il sito: la scelta della licenza dei
  contenuti del progetto non le riguarda.
- Una foto è un'illustrazione, non una fonte: non sostituisce le citazioni dello strato documentato.

## Dipendenze

Il sito non è obbligato a essere senza dipendenze: si valutano una per una. Regole: servono davvero, hanno licenza
compatibile, e il build le copia in `dist/` come file locali (con la licenza). Il controllo sul sito generato continua a
bloccare qualsiasi risorsa caricata da un altro dominio. Oggi c'è una dipendenza, `motion` (MIT), per le animazioni:
`src/motion.js` la usa solo come miglioramento progressivo e si ferma con "riduci movimento".

## Dati UNESCO

Il sito web dell'UNESCO blocca le richieste automatiche (403), e non lo aggiriamo. L'UNESCO pubblica però il dataset
"World Heritage List" sul portale di dati aperti (data.unesco.org, licenza CC BY-SA 4.0): `node scripts/prepare-unesco.mjs`
lo scarica con pause tra le richieste, e `seed-unesco-cards.mjs` riempie le bozze con anno, categoria, criteri, area,
coordinate e descrizione ufficiale. La licenza chiede attribuzione (la scheda cita la fonte) e, per le opere derivate, la stessa
licenza: va deciso prima di scegliere la licenza dei contenuti del sito. Il testo UNESCO è una sola voce istituzionale: una scheda
da pubblicare ha bisogno anche di fonti indipendenti.

## Privacy

- Il sito non raccoglie dati: nessun cookie, statistica, font o script esterno, e il modulo delle note non invia
  nulla (prepara un messaggio che la persona manda da sé). Il build verifica che non si carichi nulla da altri domini.
- L'hosting (GitHub Pages) può tenere propri log dei server, che il progetto non controlla.
- Le persone con cui parli, le note che raccogli e le prove di consenso sono dati personali trattati da te
  in quanto titolare. Prima di aprire il progetto al pubblico serve un'informativa chiara per gli autori
  delle note e la verifica degli obblighi GDPR con chi può darti un parere professionale.
  Questo documento non è una consulenza legale.

## Checklist per una nuova scheda

- [ ] Fonti istituzionali o primarie trovate per i fatti principali
- [ ] Ogni frase citata o marcata `editorial`
- [ ] Fonti "to-verify" ridotte al minimo e segnalate
- [ ] Lacune dichiarate
- [ ] Almeno una persona che conosce il luogo ha letto il racconto e può dire se qualcosa suona sbagliato
- [ ] Note raccolte con consenso registrato
- [ ] `npm run check` senza errori
