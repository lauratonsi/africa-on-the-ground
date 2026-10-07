# Come si gestiscono i contributi

Questo documento fissa le decisioni prese il 7 ottobre 2026 e il percorso di una nota, dall'arrivo alla pubblicazione e al ritiro.
Non è una consulenza legale: informativa e trattamento dei dati vanno fatti verificare da un professionista prima di rendere pubblico il contatto.

## Decisioni

- **Che cosa si accetta, all'inizio:** solo note di voce, cioè un testo breve di una persona che conosce il luogo. Una segnalazione "qui il racconto sbaglia"
  (tipo `fix`) si legge e si controlla, ma non si pubblica come voce: la scheda cambia solo se si trova una fonte.
  Foto e fonti suggerite dai lettori restano fuori per ora.
- **Chi riceve e chi decide:** una sola casella, la tua. Email e numero dedicati al progetto, non personali. Il lettore locale entra più tardi,
  come passaggio di revisione.
- **Luoghi delicati:** per i luoghi segnati `"sensitive": true` nella scheda (memoria della schiavitù, apartheid, genocidio, conflitti) una nota
  non si pubblica senza la lettura di una persona del posto. Il controllo (`npm run check`) e il comando `add-note` lo impongono.
  Oggi sono segnati: Kunta Kinteh, Gorée, i forti del Ghana, Cidade Velha, i memoriali del Ruanda, Robben Island, Aapravasi Ghat,
  Stone Town di Zanzibar, Providence Island, Laas Geel. L'elenco si cambia nelle schede.
- **Diritti sul testo:** l'autore resta autore e dà al progetto il permesso di pubblicare; può chiedere il ritiro. Nessuna licenza aperta sulle note.
  La licenza dei contenuti del sito si sceglie dopo (attenzione ai dati UNESCO, CC BY-SA 4.0: vedi `metodo-editoriale.md`).

## Il percorso di una nota

1. **Arrivo.** Il messaggio del modulo (formato `[AOTG-NOTE v1]`) arriva sulla tua casella. Conserva l'originale **fuori dal repository** (cartella privata): è la prova del consenso.
2. **Registro privato.** Per ogni messaggio annota in un file fuori dal repository: data, canale, luogo, id assegnato, esito (pubblicata, rifiutata, in attesa di revisione, ritirata).
   Un foglio con queste colonne basta.
3. **Controllo.** `pbpaste | npm run add-note` mostra la nota e dice se passa i controlli. Leggi con la lista qui sotto.
4. **Revisione locale** (solo luoghi delicati, poi per tutti quando c'è un lettore): la persona legge e dà l'ok. Poi:
   `pbpaste | npm run add-note -- --write --reviewed "Nome del lettore"`.
5. **Pubblicazione.** `npm run check`, commit, push. La nota compare con il nome e il legame che l'autore ha scelto.
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
- Trovare il primo lettore locale per i luoghi delicati. Fino a quel momento il modulo può restare online, ma le note su quei luoghi restano in attesa.
