# cgblog - istruzioni condivise per gli agenti

Questo file e la fonte normativa comune per Codex, Claude Code e ogni altro agente che opera nel repository.

## Principi di sicurezza e autorizzazione

- Non mostrare, copiare, registrare o inserire nel repository credenziali, password, token o altri valori sensibili.
- Nessun agente puo effettuare push su `main`, pubblicare un nuovo articolo o eseguire un'operazione che possa attivare GitHub Pages o i workflow social senza autorizzazione esplicita dell'utente per quella specifica operazione.
- Gli articoli gia presenti in `origin/main` sono considerati pubblicati. I contenuti locali non tracciati non devono essere pubblicati o recuperati automaticamente.

## Politica Git

- Sono consentite le operazioni Git in sola lettura.
- Staging, commit, push, pull, merge, rebase, reset, checkout, creazione o cambio branch e riscrittura della cronologia richiedono autorizzazione esplicita per quella specifica operazione.
- Prima di ogni operazione autorizzata verificare branch, stato del working tree, riferimenti remoti e possibili conflitti.
- Preservare i file locali non tracciati e non eliminarli senza autorizzazione separata.

## Struttura e funzionamento

- cgblog e un sito statico HTML/CSS/JavaScript, senza framework o fase di build obbligatoria.
- `blog.js` gestisce il comportamento condiviso e il dizionario inglese globale.
- Gli articoli sono in `post/`; le immagini in `img/`; i PDF e gli altri documenti in `assets/`.
- Un esempio di articolo bilingue completo e `post/sopralluogo-faeto-notturna.html`.

## Creazione degli articoli

- Ogni nuovo articolo deve essere pubblicato gia tradotto in inglese.
- Ogni elemento di contenuto usa un attributo `data-i18n="p.xxx"`, con chiavi locali alla pagina.
- La pagina definisce le traduzioni in inglese in un blocco inline `window.PAGE_EN` all'inizio del `body`.
- Le etichette generiche usano le chiavi globali `art.*` gia presenti in `blog.js`.
- I testi italiani devono rispettare la grammatica normale: ogni frase del corpo dei paragrafi e delle blockquote inizia con la maiuscola. Titoli e lede possono mantenere lo stile minuscolo del blog.
- Usare immagini ottimizzate e riferimenti relativi coerenti con la struttura del sito. I PDF vanno collegati solo quando fanno parte effettiva dell'articolo.

## `index.html`

- Il nuovo articolo va in testa alla lista `<section class="b-list">`.
- L'anteprima inglese usa le chiavi `p.eN.*` nel `PAGE_EN` di `index.html`.
- Quando si inserisce un articolo, rinumerare le chiavi inglesi esistenti (`e1` diventa `e2`, ecc.) sia nell'HTML sia nel blocco `window.PAGE_EN`.
- Aggiornare il contatore `data-count`.

## Pubblicazione e deployment

- Il sito e pubblicato tramite GitHub Pages e GitHub Actions, secondo `.github/workflows/pages.yml`.
- La pubblicazione online e normalmente provocata da un push su `main`; il workflow puo anche essere avviato manualmente.
- La presenza di un nuovo `post/*.html` su `main` puo avviare anche la pubblicazione social. Ogni pubblicazione richiede revisione e autorizzazione esplicita dell'utente.

## Social automatici

- `.github/workflows/social.yml` reagisce a un push su `main` che aggiunge un nuovo file in `post/`, oppure a un avvio manuale.
- Lo script `scripts/social_post.py` pubblica, quando configurato, su Facebook, Instagram e LinkedIn usando i Secret GitHub configurati nel workflow.
- L'automazione usa titolo, lede, immagine hero e collegamento all'articolo.
- `data-social="skip"` esclude l'articolo dalla pubblicazione social.
- `post/articolo.html` e escluso dall'automazione.
- Facebook puo pubblicare una foto o un collegamento; Instagram richiede un'immagine; LinkedIn puo pubblicare con immagine o collegamento.
- La mancanza dei dati Meta fa saltare la pubblicazione Meta senza errore bloccante; gli errori LinkedIn vengono riportati dal workflow ma non necessariamente fanno fallire l'intero processo.
- Non inserire mai valori dei Secret nei file, nei log o nei messaggi dell'agente. Usare esclusivamente i riferimenti ai Secret gia previsti dal workflow.

## Immagini, PDF e contenuti locali

- Verificare che immagini e PDF siano realmente riferiti da un articolo prima di considerarli parte della pubblicazione.
- Non aggiungere automaticamente file non tracciati a un commit.
- Un'immagine o un PDF da solo non attiva `social.yml`, ma se inviato su `main` puo comunque attivare il deployment Pages.

## Dettagli tecnici di manutenzione

- La transizione `.b-wipe` usa la classe `is-on`.
- Il listener `pageshow` con `e.persisted` in `blog.js` evita il velo nero ripristinato da BFCache su Safari mobile.

