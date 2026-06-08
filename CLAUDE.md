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

## Animazioni
- La transizione `.b-wipe` usa la classe `is-on` per coprire lo schermo durante la navigazione.
- Su Safari mobile il BFCache può ripristinare la pagina con il velo ancora attivo (schermo nero). Il fix è il listener `pageshow` con `e.persisted` in `blog.js`.
