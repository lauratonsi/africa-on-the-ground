# Come si gestiscono i contributi

Questo documento fissa le decisioni prese il 7 ottobre 2026 e il percorso di una nota, dall'arrivo alla pubblicazione e al ritiro.
Non è una consulenza legale: informativa e trattamento dei dati vanno fatti verificare da un professionista prima di rendere pubblico il contatto.

## Decisioni

- **Che cosa si accetta, all'inizio:** solo note di voce, cioè un testo breve di una persona che conosce il luogo. Una segnalazione "qui il racconto sbaglia"
  (tipo `fix`) si legge e si controlla, ma non si pubblica come voce: la scheda cambia solo se si trova una fonte.
  Foto e fonti suggerite dai lettori restano fuori per ora.
- **Chi riceve e chi decide:** una sola casella, la tua. Email e numero dedicati al progetto, non personali. Il lettore locale entra più tardi,
  come passaggio di revisione.
- **Revisione dopo la pubblicazione, per tutto il progetto:** né le schede né le note passano da una revisione preventiva di chi conosce i luoghi.
  La lettura di una persona del posto viene dopo, e si registra con `npm run review-note`. Il progetto la dichiara apertamente nelle schede e nella pagina Method.
  Resta il controllo del curatore (la lista qui sotto) prima di pubblicare una nota, e il ritiro immediato se qualcuno del posto lo chiede.
- **Luoghi delicati:** il campo `"sensitive": true` non blocca la pubblicazione; fa comparire un avviso in `add-note` (rileggi con più cura, fissa la lettura successiva).
  Sono segnati: Kunta Kinteh, Gorée, i forti del Ghana, Cidade Velha, i memoriali del Ruanda, Robben Island, Aapravasi Ghat, Stone Town, Providence Island, Laas Geel.
- **Diritti sul testo:** l'autore resta autore e dà al progetto il permesso di pubblicare; può chiedere il ritiro. Nessuna licenza aperta sulle note.
  La licenza dei contenuti del sito si sceglie dopo (attenzione ai dati UNESCO, CC BY-SA 4.0: vedi `metodo-editoriale.md`).

## Il percorso di una nota

1. **Arrivo.** Il messaggio del modulo (formato `[AOTG-NOTE v1]`) arriva sulla tua casella. Conserva l'originale **fuori dal repository** (cartella privata): è la prova del consenso.
2. **Registro privato.** Per ogni messaggio annota in un file fuori dal repository: data, canale, luogo, id assegnato, esito (pubblicata, rifiutata, in attesa di revisione, ritirata).
   Un foglio con queste colonne basta.
3. **Controllo.** `pbpaste | npm run add-note` mostra la nota e dice se passa i controlli. Leggi con la lista qui sotto.
4. **Pubblicazione, poi revisione.** `pbpaste | npm run add-note -- --write` salva la nota. Se la nota è già stata letta da una persona del posto, aggiungi `--reviewed "Nome"`.
   Altrimenti la lettura viene dopo: `npm run review-note -- <id> --by "Nome" --write`.
5. **Online.** `npm run check`, commit, push. La nota compare con il nome e il legame che l'autore ha scelto.
6. **Ritiro.** `npm run remove-note -- <id>` mostra la nota, con `--write` la toglie. Poi check, commit, push, e aggiorna il registro.
   Il testo resta nella cronologia pubblica del repository: se l'autore chiede anche di cancellarlo, bisogna riscrivere la storia
   (`git filter-repo`) e rifare il push forzato. Va detto all'autore prima, nel modulo e nella pagina Method lo diciamo già.

## Cosa si rifiuta

- Dati di contatto (email, telefono) nel testo o nel nome: il controllo li blocca.
- Accuse a persone riconoscibili, notizie su salute o vita privata di terzi, nomi di minori.
- Testi che incitano all'odio, pubblicità, link commerciali.
- Affermazioni sul luogo scritte come fatti documentati: una nota è un'esperienza, non una fonte. Se contiene un dato che sembra un fatto, si cerca la fonte e si cita nel racconto.
- Note senza consenso scritto nel messaggio (`consent: yes`): il comando le rifiuta.

## Ancora da fare prima di rendere pubblico il numero

- Compilare `channels` in `site.config.json` con contatti dedicati (numero WhatsApp in sole cifre, email, link Signal).
- Scrivere l'informativa per chi contribuisce: chi riceve i dati, per quanto tempo, come chiedere accesso e ritiro, e che il repository è pubblico. Farla verificare.
- Decidere per quanto tempo si conservano i messaggi originali e il registro.
- Un contatto pubblico per le correzioni (anche solo un'email dedicata): senza, il link "tell the project" nelle schede non porta da nessuna parte.
- Trovare i primi lettori locali, per la revisione successiva: non bloccano la pubblicazione.

## Dove si può contribuire e come cambia il messaggio

Il modulo c'è su tre tipi di pagina: schede dei luoghi, storie e pagine dei paesi (Countries e Compare, con un menu per scegliere il paese). A seconda del tipo cambiano le domande (`noteKinds` per i luoghi, `storyNoteKinds` per le storie, divise per filone, e `countryNoteKinds` per i paesi in `site.config.json`) e i campi specifici (`fields`). Il messaggio ha una riga `place:`, `story:` o `country:` e righe `field.<id>:`; `npm run add-note` le legge e salva in `content/notes/<luogo>.json`, `story-<slug>.json` o `country-<ISO3>.json`. Le correzioni (`fix`) non si pubblicano come voci. `remove-note` e `review-note` funzionano su tutti e tre i tipi.

**Canale GitHub.** In `channels` c'è un canale di tipo `github` (valore `proprietario/repository`, per esempio `lauratonsi/africa-on-the-ground`), vuoto di proposito. Se lo si attiva, il modulo apre una nuova issue con il messaggio già scritto. È l'unico canale che non richiede di pubblicare un numero o un indirizzo, ma ha un prezzo: il messaggio diventa pubblico subito, sotto il nome GitHub di chi lo manda. Il modulo lo dice prima. Va deciso con la revisione dopo la pubblicazione e con l'informativa.

**Senza canali.** Il modulo si mostra comunque, con un avviso, e permette di copiare il messaggio. Finché nessun canale ha un valore, nessuno può mandarlo a chi gestisce il progetto.
