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

## Privacy

- Il sito non raccoglie dati: nessun modulo, cookie, statistica, font o script esterni. Il build lo verifica.
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
