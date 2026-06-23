#!/usr/bin/env python3
"""Pubblica un nuovo articolo del diario su Facebook, Instagram e LinkedIn.

Uso: social_post.py post/nome-articolo.html [post/altro.html ...]

Richiede variabili d'ambiente (GitHub Secrets):
  META_PAGE_TOKEN    — Page Access Token (long-lived) dell'app Meta
  FB_PAGE_ID         — id della pagina Facebook
  IG_USER_ID         — id dell'account Instagram Business
  LINKEDIN_TOKEN     — Access Token LinkedIn (scade in ~60gg)
  LINKEDIN_PERSON_ID — Person ID LinkedIn (da OpenID Connect sub)

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

SITE = "https://blog.cibellieguadagno.com"
GRAPH = "https://graph.facebook.com/v21.0"
LINKEDIN_API = "https://api.linkedin.com/v2"

TOKEN = os.environ.get("META_PAGE_TOKEN", "")
FB_PAGE_ID = os.environ.get("FB_PAGE_ID", "")
IG_USER_ID = os.environ.get("IG_USER_ID", "")
LINKEDIN_TOKEN = os.environ.get("LINKEDIN_TOKEN", "")
LINKEDIN_PERSON_ID = os.environ.get("LINKEDIN_PERSON_ID", "")


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
    m = re.search(r'<figure class="b-art-hero">.*?<(?:img|image-slot) src="\.\./([^"]+)"', html, re.S)
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
    caption_fb = f"{title}\n\n{lede}\n\nLeggi sul diario: {link}"
    caption_ig = f"{title}\n\n{lede}\n\nLink in bio"

    if image and not wait_for(image):
        print(f"· {name}: immagine non ancora online, salto")
        return

    # Facebook: post con foto (o solo link se l'articolo non ha foto)
    if image:
        fb = api(f"{FB_PAGE_ID}/photos", {"url": image, "caption": caption_fb})
    else:
        fb = api(f"{FB_PAGE_ID}/feed", {"message": caption_fb, "link": link})
    print(f"· {name}: facebook ok ({fb.get('id') or fb.get('post_id')})")

    # Instagram: container + publish (richiede un'immagine)
    if image:
        container = api(f"{IG_USER_ID}/media", {"image_url": image, "caption": caption_ig})
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

    # LinkedIn: foto caricata + link nel testo
    if LINKEDIN_TOKEN and LINKEDIN_PERSON_ID:
        try:
            li = post_linkedin(title, lede, link, image)
            print(f"· {name}: linkedin ok ({li.get('id', '')})")
        except urllib.error.HTTPError as e:
            print(f"· {name}: linkedin errore {e.code}: {e.read().decode()[:500]}")


def api_get(path):
    sep = "&" if "?" in path else "?"
    url = f"{GRAPH}/{path}{sep}access_token={TOKEN}"
    with urllib.request.urlopen(url, timeout=60) as r:
        return json.load(r)


def linkedin_upload_image(image_url):
    """Scarica l'immagine e la carica su LinkedIn, ritorna l'asset URN."""
    with urllib.request.urlopen(image_url, timeout=60) as r:
        image_data = r.read()
        content_type = r.headers.get("Content-Type", "image/jpeg").split(";")[0]

    register_payload = {
        "registerUploadRequest": {
            "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
            "owner": f"urn:li:person:{LINKEDIN_PERSON_ID}",
            "serviceRelationships": [{"relationshipType": "OWNER", "identifier": "urn:li:userGeneratedContent"}],
        }
    }
    req = urllib.request.Request(
        f"{LINKEDIN_API}/assets?action=registerUpload",
        data=json.dumps(register_payload).encode(),
        headers={
            "Authorization": f"Bearer {LINKEDIN_TOKEN}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        reg = json.load(r)

    upload_url = reg["value"]["uploadMechanism"]["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]["uploadUrl"]
    asset_urn = reg["value"]["asset"]

    put_req = urllib.request.Request(
        upload_url,
        data=image_data,
        method="PUT",
        headers={"Authorization": f"Bearer {LINKEDIN_TOKEN}", "Content-Type": content_type},
    )
    with urllib.request.urlopen(put_req, timeout=120) as r:
        pass

    return asset_urn


def post_linkedin(title, lede, link, image=None):
    text = f"{title}\n\n{lede}\n\nLeggi sul diario: {link}"

    if image:
        try:
            asset_urn = linkedin_upload_image(image)
            media = [{"status": "READY", "description": {"text": lede}, "media": asset_urn, "title": {"text": title}}]
            media_category = "IMAGE"
        except Exception as e:
            print(f"  linkedin upload immagine fallito ({e}), uso link senza foto")
            image = None

    if not image:
        media = [{"status": "READY", "originalUrl": link, "title": {"text": title}, "description": {"text": lede}}]
        media_category = "ARTICLE"

    payload = {
        "author": f"urn:li:person:{LINKEDIN_PERSON_ID}",
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {"text": text},
                "shareMediaCategory": media_category,
                "media": media,
            }
        },
        "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"},
    }
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{LINKEDIN_API}/ugcPosts",
        data=data,
        headers={
            "Authorization": f"Bearer {LINKEDIN_TOKEN}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as r:
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
