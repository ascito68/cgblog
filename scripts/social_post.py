#!/usr/bin/env python3
"""Pubblica un nuovo articolo del diario su Facebook e Instagram.

Uso: social_post.py post/nome-articolo.html [post/altro.html ...]

Richiede tre variabili d'ambiente (GitHub Secrets):
  META_PAGE_TOKEN  — Page Access Token (long-lived) dell'app Meta
  FB_PAGE_ID       — id della pagina Facebook
  IG_USER_ID       — id dell'account Instagram Business

Se i secret non sono configurati, esce senza errore: il deploy
del sito non deve mai fallire per colpa dei social.
"""
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

SITE = "https://ascito68.github.io/cgblog"
GRAPH = "https://graph.facebook.com/v21.0"

TOKEN = os.environ.get("META_PAGE_TOKEN", "")
FB_PAGE_ID = os.environ.get("FB_PAGE_ID", "")
IG_USER_ID = os.environ.get("IG_USER_ID", "")


def strip_tags(html):
    text = re.sub(r"<[^>]+>", " ", html)
    return re.sub(r"\s+", " ", text).strip()


def extract(path):
    """Estrae titolo, lede e immagine hero da un articolo."""
    html = open(path, encoding="utf-8").read()
    title = lede = image = None
    m = re.search(r'class="b-art-head__title"[^>]*>(.*?)</h1>', html, re.S)
    if m:
        title = strip_tags(m.group(1))
    m = re.search(r'class="b-art-head__lede"[^>]*>(.*?)</p>', html, re.S)
    if m:
        lede = strip_tags(m.group(1))
    m = re.search(r'<figure class="b-art-hero">.*?<img src="\.\./([^"]+)"', html, re.S)
    if m:
        image = f"{SITE}/{m.group(1)}"
    return title, lede, image


def api(path, params):
    params = dict(params, access_token=TOKEN)
    data = urllib.parse.urlencode(params).encode()
    req = urllib.request.Request(f"{GRAPH}/{path}", data=data)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def wait_for(url, attempts=40, pause=15):
    """Aspetta che l'immagine sia online (il deploy Pages corre in parallelo)."""
    for _ in range(attempts):
        try:
            req = urllib.request.Request(url, method="HEAD")
            with urllib.request.urlopen(req, timeout=20) as r:
                if r.status == 200:
                    return True
        except Exception:
            pass
        time.sleep(pause)
    return False


def publish(path):
    name = os.path.basename(path)
    if name == "articolo.html":  # template, mai pubblicare
        print(f"· {name}: template, salto")
        return
    title, lede, image = extract(path)
    if not (title and lede):
        print(f"· {name}: titolo o lede mancanti, salto")
        return
    link = f"{SITE}/post/{name}"
    caption = f"{title}\n\n{lede}\n\nLeggi sul diario: {link}"

    if image and not wait_for(image):
        print(f"· {name}: immagine non ancora online, salto")
        return

    # Facebook: post con foto (o solo link se l'articolo non ha foto)
    if image:
        fb = api(f"{FB_PAGE_ID}/photos", {"url": image, "caption": caption})
    else:
        fb = api(f"{FB_PAGE_ID}/feed", {"message": caption, "link": link})
    print(f"· {name}: facebook ok ({fb.get('id') or fb.get('post_id')})")

    # Instagram: container + publish (richiede un'immagine)
    if image:
        container = api(f"{IG_USER_ID}/media", {"image_url": image, "caption": caption})
        cid = container["id"]
        for _ in range(20):
            time.sleep(5)
            status = api_get(f"{cid}?fields=status_code")
            if status.get("status_code") == "FINISHED":
                break
        ig = api(f"{IG_USER_ID}/media_publish", {"creation_id": cid})
        print(f"· {name}: instagram ok ({ig.get('id')})")
    else:
        print(f"· {name}: nessuna immagine, instagram saltato")


def api_get(path):
    sep = "&" if "?" in path else "?"
    url = f"{GRAPH}/{path}{sep}access_token={TOKEN}"
    with urllib.request.urlopen(url, timeout=60) as r:
        return json.load(r)


def main():
    files = [f for f in sys.argv[1:] if f.strip()]
    if not files:
        print("nessun articolo nuovo, niente da pubblicare")
        return
    if not (TOKEN and FB_PAGE_ID and IG_USER_ID):
        print("secret Meta non configurati: pubblicazione social saltata")
        return
    for f in files:
        try:
            publish(f)
        except urllib.error.HTTPError as e:
            print(f"· {f}: errore API Meta {e.code}: {e.read().decode()[:500]}")
            sys.exit(1)


if __name__ == "__main__":
    main()
