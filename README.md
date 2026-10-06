# Home Ground

*Nome provvisorio.* Guide ai luoghi che tengono separati due tipi di conoscenza:

1. **Il racconto documentato.** Ogni affermazione ha una citazione numerata e ogni fonte è etichettata
   per tipo (istituzionale, stampa, accademica, primaria, enciclopedia) e per stato (verificata, da verificare, bozza).
2. **La voce di chi conosce il luogo.** Note di persone reali, mostrate come esperienza di una persona
   e non come fatto, con il nome e il legame con il luogo che l'autore ha scelto di dichiarare.

La separazione è il cuore del progetto. Se i due strati si mescolano, il sito perde la possibilità di dire
onestamente "questo è documentato" e "questo lo dice una persona".

Il sito è **statico**: nessun database, nessun modulo, nessun cookie, nessuna statistica, nessuna risorsa
caricata da altri siti. Le note non arrivano dal sito: le raccogli tu di persona o in messaggio diretto,
con il consenso dell'autore, e le aggiungi a un file del progetto.

## Struttura

```
site.config.json          nome, tagline, domande per i locals, etichette, contatto
content/
  sources.json            tutte le fonti, riusabili da più schede
  places/<slug>.json      una scheda per luogo (strato 1)
  notes/<slug>.json       le note approvate per quel luogo (strato 2)
  pages/method.html       la pagina pubblica "Method"
src/
  styles.css              lo stile (due strati, tema chiaro e scuro)
  fonts/                  font locali con licenze, vedi LEGGIMI.txt
scripts/
  validate.mjs            controlla i contenuti
  build.mjs               valida e genera il sito in dist/
  serve.mjs               anteprima locale
docs/
  metodo-editoriale.md    le regole del progetto
  roadmap.md              proposta di fasi e decisioni aperte
.github/workflows/        pubblicazione su GitHub Pages e controllo sulle pull request
```

Serve solo Node 20 o successivo. Non ci sono dipendenze da installare.

## Comandi

```
npm run validate     controlla fonti, citazioni, note e consenso
npm run build        valida e genera dist/
npm start            anteprima su http://localhost:4173 (dopo il build)
npm run check        validate + build
```

Per vedere anche le schede con `"status": "draft"`: `node scripts/build.mjs --drafts`.

## Cosa controlla la validazione

La build si ferma, e il sito non viene pubblicato, se:

- un'affermazione di una scheda non ha citazione, o cita una fonte che non esiste in `sources.json`
  (le frasi di commento tue vanno marcate `"editorial": true`);
- una fonte non ha tipo, stato, https o data di consultazione;
- una nota non ha il consenso (`consent.given: true`, data e modalità);
- il testo o il nome di una nota sembra contenere un'email o un numero di telefono;
- una nota ha un tipo, o un legame con il luogo, non previsto in `site.config.json`;
- il sito generato carica qualcosa da un altro dominio.

Gli **avvisi** non bloccano ma vanno letti: schede che poggiano su fonti "da verificare", fonti non citate,
contatto non configurato.

## Aggiungere una nota

Apri `content/notes/<slug>.json` e aggiungi un oggetto. `name` e `relation` sono facoltativi.

```json
{
  "id": "kunta-kinteh-001",
  "kind": "look",
  "text": "Il testo della nota, come l'ha detto l'autore.",
  "name": "Nome o soprannome, se lo vuole",
  "relation": "near",
  "lang": "en",
  "consent": { "given": true, "date": "2026-10-20", "how": "message" },
  "added": "2026-10-21"
}
```

- `kind`: uno degli `id` di `noteKinds` in `site.config.json`.
- `relation`: `near`, `gambia`, `abroad`, `other`, oppure ometti il campo.
- `consent.how`: `in-person`, `message` o `other`. Conserva tu, fuori dal repository, la prova del consenso.
- Non scrivere nel repository contatti dell'autore: il repository è pubblico.

## Aggiungere un luogo

1. Aggiungi le fonti nuove a `content/sources.json`.
2. Copia `content/places/kunta-kinteh-island.json` in `content/places/<nuovo-slug>.json` e riscrivilo.
   Lo slug deve coincidere con il nome del file.
3. Crea `content/notes/<nuovo-slug>.json` con `[]`.
4. `npm run check`.

Tipi di blocco previsti nelle sezioni: `p` (paragrafo a frasi citate), `facts` (la griglia dei dati),
`timeline` (cronologia).

## Pubblicare su GitHub Pages

1. Crea un repository su GitHub e carica questa cartella (branch `main`).
2. Nelle impostazioni del repository, in *Pages*, scegli come sorgente *GitHub Actions*.
3. Ogni push su `main` lancia `.github/workflows/pages.yml`, che esegue `npm run check` e pubblica `dist/`.

Il sito usa solo percorsi relativi, quindi funziona sia su `utente.github.io/nome-repo/` sia su un dominio proprio.
Le versioni delle azioni nel workflow (`checkout@v4`, ecc.) vanno controllate al momento della pubblicazione.

## Cosa resta da decidere

Vedi `docs/roadmap.md`. In breve: nome definitivo, contatto pubblico, licenza dei contenuti (la scegli tu),
quali font usare, e chi scrive le prime note.

## Stato dei contenuti

La scheda pilota su Kunta Kinteh Island è scritta da fonti recuperate il 6 ottobre 2026. Due fonti sono
voci di Wikipedia e una è una bozza accademica senza anno: sono marcate come da verificare e da sostituire
con fonti primarie e studi a stampa prima di presentare il sito come affidabile. Il numero di persone
imbarcate da questo sito non è citato perché non è stato trovato in nessuna fonte consultata.
