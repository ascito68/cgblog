# cgblog — istruzioni per Claude

## Deploy
Il sito è pubblicato su **GitHub Pages** tramite GitHub Actions.
Il workflow si attiva **solo su push a `main`** (`.github/workflows/pages.yml`).

**Regola**: ogni volta che si completano modifiche, fare sempre merge su `main` e push. Le modifiche non sono online finché non arrivano su `main`.

Procedura standard:
```
git checkout main
git merge <feature-branch> --no-edit
git push origin main
```

## Branch di sviluppo
Le sessioni Claude Code lavorano su branch dedicati (es. `claude/...`).
Al termine di ogni sessione, mergiare sempre su `main`.

## Traduzione inglese degli articoli (OBBLIGATORIA)
Ogni nuovo articolo deve essere pubblicato già tradotto in inglese. Il sistema:
1. Ogni elemento di contenuto dell'articolo ha un attributo `data-i18n="p.xxx"` (chiavi locali alla pagina, prefisso `p.`).
2. La pagina definisce le traduzioni in un `<script>` inline a inizio `<body>`: `window.PAGE_EN = { 'p.xxx': '...', ... }`.
3. `blog.js` fa il merge di `window.PAGE_EN` nel dizionario EN globale.
4. Anche l'anteprima dell'articolo su `index.html` va tradotta: chiavi `p.eN.*` nel `PAGE_EN` di index.
5. Le etichette generiche (colophon, condividi, torna al diario, rail committente/luogo/team) usano le chiavi globali `art.*` già presenti in `blog.js`.

Esempio di riferimento: `post/sopralluogo-faeto-notturna.html`.

## Animazioni
- La transizione `.b-wipe` usa la classe `is-on` per coprire lo schermo durante la navigazione.
- Su Safari mobile il BFCache può ripristinare la pagina con il velo ancora attivo (schermo nero). Il fix è il listener `pageshow` con `e.persisted` in `blog.js`.
