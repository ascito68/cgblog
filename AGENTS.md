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

- Preferenza esplicita dell’utente (6 ottobre 2026): quando chiede di pubblicare un articolo su cgblog, includere anche la pubblicazione social automatica su Facebook, Instagram e LinkedIn. Non usare `data-social="skip"` salvo richiesta specifica. La richiesta di pubblicazione autorizza staging, commit e push su `main` dei soli file necessari, dopo revisione e verifica; non richiedere una seconda conferma.

- `.github/workflows/social.yml` reagisce a un push su `main` che aggiunge un nuovo file in `post/`, oppure a un avvio manuale.
- Lo script `scripts/social_post.py` pubblica, quando configurato, su Facebook, Instagram e LinkedIn usando i Secret GitHub configurati nel workflow.
- L'automazione usa titolo, lede, immagine hero e collegamento all'articolo.
- `data-social="skip"` esclude l'articolo dalla pubblicazione social.
- `post/articolo.html` e escluso dall'automazione.
- Facebook puo pubblicare una foto o un collegamento; Instagram richiede un'immagine; LinkedIn puo pubblicare con immagine o collegamento.
- La mancanza dei dati Meta fa saltare la pubblicazione Meta senza errore bloccante; gli errori LinkedIn vengono riportati dal workflow ma non necessariamente fanno fallire l'intero processo.
- Non inserire mai valori dei Secret nei file, nei log o nei messaggi dell'agente. Usare esclusivamente i riferimenti ai Secret gia previsti dal workflow.

## Token LinkedIn — rinnovo periodico

Il `LINKEDIN_TOKEN` scade ogni ~60 giorni. **Ultimo rinnovo: 21 settembre 2026. Prossima scadenza: ~21 novembre 2026.**

Procedura di rinnovo (tutto va eseguito in locale dall'utente, non dall'agente — LinkedIn e bloccato dal proxy dell'ambiente remoto):

1. Apri nel browser:
   `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=780rpwwjh6gqpb&redirect_uri=https%3A%2F%2Flocalhost&scope=w_member_social%20openid%20profile&state=li123`
2. Autorizza → copia il valore `code=...` dall'URL (scade in pochi secondi).
3. Esegui subito in terminale locale (sostituendo `CODICE`):
   `curl -s 'https://www.linkedin.com/oauth/v2/accessToken' -H 'Content-Type: application/x-www-form-urlencoded' -d 'grant_type=authorization_code&code=CODICE&redirect_uri=https%3A%2F%2Flocalhost&client_id=780rpwwjh6gqpb&client_secret=WPL_AP1.TizRneL6vIaZbhJN.fore9A%3D%3D'`
4. Copia `access_token` dalla risposta JSON → aggiorna il GitHub Secret `LINKEDIN_TOKEN`.
5. Se un post non e stato pubblicato su LinkedIn per token scaduto, triggerare manualmente `social.yml` via `workflow_dispatch` con input `files=post/nome-articolo.html`.

## Sistema di design e identita visiva

- `colors_and_type.css` e la fonte dei design token (palette, tipografia, spaziatura, animazioni): e importato via `@import` in cima a `styles.css`, quindi e sempre attivo anche se nessuna pagina lo collega direttamente nel `<head>`. Encoda il rebrand "BecomeBrand Visual Concept #01" (marzo 2021).
- Non scrivere mai colori, font-size o spaziature "a mano": usare sempre le variabili CSS (`--cg-nero`, `--cg-tortora-mid`, `--accent`, `--cg-space-*`, `--cg-size-*`, ecc.). `--accent` in `styles.css` punta a `--cg-tortora-mid`.
- Il font primario e Helvetica Neue (licenza Linotype, non in bundle); il fallback web e Inter via Google Fonts. Non sostituire il fallback senza motivo.
- Il brand e "rigorosamente squadrato": `--cg-radius: 0`, nessun border-radius nei nuovi componenti.
- Stile tipografico minuscolo ("il brand sussurra"): la classe `.cg-whisper` forza il lowercase; titoli e lede restano in minuscolo salvo nomi propri.
- Il motivo grafico della "slash" (colore, peso, angolo) e definito dai token `--cg-slash-*` ed e usato nel logo, in `.b-ambient__slash` e nella transizione `.b-wipe`.
- `tweaks-panel.jsx` nella root e uno strumento di prototipazione React NON collegato da nessuna pagina del sito: non fa parte del design system in produzione, va ignorato a meno che l'utente non chieda di riutilizzarlo o rimuoverlo.

## Immagini, PDF e contenuti locali

- Verificare che immagini e PDF siano realmente riferiti da un articolo prima di considerarli parte della pubblicazione.
- Non aggiungere automaticamente file non tracciati a un commit.
- Un'immagine o un PDF da solo non attiva `social.yml`, ma se inviato su `main` puo comunque attivare il deployment Pages.

## Dettagli tecnici di manutenzione

- La transizione `.b-wipe` usa la classe `is-on`.
- Il listener `pageshow` con `e.persisted` in `blog.js` evita il velo nero ripristinato da BFCache su Safari mobile.

