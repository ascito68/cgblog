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

## Pubblicazione social automatica
Workflow `.github/workflows/social.yml`: quando un push su `main` **aggiunge** un
nuovo file in `post/`, lo script `scripts/social_post.py` lo pubblica su Facebook
e Instagram (foto hero + titolo + lede + link). Richiede i GitHub Secrets
`META_PAGE_TOKEN`, `FB_PAGE_ID`, `IG_USER_ID`; senza secret lo step viene saltato
senza errori. Il template `post/articolo.html` non viene mai pubblicato.
Gli articoli si pubblicano sui social SOLO dopo revisione dell'utente (il push
su main È l'atto di pubblicazione approvato).

## Sicurezza
Non condividere mai GitHub Personal Access Token (formato `ghp_...`) né altri token/secret nella chat o nel codice. Se l'utente li invia per errore, avvisare di revocarli immediatamente.

## Ordine degli articoli in index.html
Il nuovo articolo va sempre **in testa** alla lista `<section class="b-list">`, prima di tutti gli altri.
Le chiavi `p.eN.*` nel `PAGE_EN` di index seguono l'ordine: e1 = più recente, e2 = secondo, ecc.
Quando si aggiunge un nuovo articolo, rinumerare le chiavi degli articoli esistenti di conseguenza (e1→e2, e2→e3, …) sia nell'HTML che nel blocco `window.PAGE_EN`.
Aggiornare anche il contatore `data-count` (es. "06 scritture").


- La transizione `.b-wipe` usa la classe `is-on` per coprire lo schermo durante la navigazione.
- Su Safari mobile il BFCache può ripristinare la pagina con il velo ancora attivo (schermo nero). Il fix è il listener `pageshow` con `e.persisted` in `blog.js`.
