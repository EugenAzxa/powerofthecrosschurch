#!/usr/bin/env python3
"""Static page generator for Power of the Cross Church.

Writes the .html files in the repo root from shared partials so the header,
footer and metadata stay identical on every page. Output is plain HTML with
no runtime build step - the generated files are what GitHub Pages serves.

Usage:  python3 tools/build.py
"""
import os, re, textwrap
import os as _os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Canonical address of the site. Used for <link rel=canonical>, the Open Graph
# tags and sitemap.xml. The church already owns pocc.ca; when the new site moves
# onto it, change this one line, rerun the build, and add a CNAME file.
# ---------------------------------------------------------------- cache
# Browsers were serving stale CSS and JS after a deploy, which showed up as
# untranslated keys and unstyled panels. Every local css/js URL carries a hash
# of the file's own contents, so a changed file is always a new URL and an
# unchanged one still caches.
import hashlib as _hashlib
def _ver(rel):
    try:
        with open(_os.path.join(ROOT, rel), "rb") as fh:
            return _hashlib.sha1(fh.read()).hexdigest()[:8]
    except OSError:
        return "0"
def asset(rel):
    return rel + "?v=" + _ver(rel)

SITE  = "https://eugenazxa.github.io/powerofthecrosschurch/"
PHONE = "416-858-9317"
PHONE_HREF = "+14168589317"
ADDR  = "255 Wildcat Rd, Toronto, ON M3J 2S3"
MAPQ  = "255+Wildcat+Rd,+Toronto,+ON+M3J+2S3"
YT    = "https://www.youtube.com/channel/UCHgwxXYXpZgW1Gz1Y6uOVHQ"
YTLIVE= YT + "/live"
FB    = "https://www.facebook.com/powerofthecrossofficial"

# --------------------------------------------------------------------- icons
I = {
"cross":'<path d="M13 2h6v9h9v6h-9v13h-6V17H4v-6h9V2z" fill="currentColor"/>',
"arrow":'<path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
"chev" :'<path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
"chevl":'<path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
"plus" :'<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
"close":'<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
"play" :'<path d="M8 5.5v13l11-6.5-11-6.5z" fill="currentColor"/>',
"pin"  :'<path d="M12 21s7-6.1 7-11a7 7 0 10-14 0c0 4.9 7 11 7 11z" stroke="currentColor" stroke-width="1.8" fill="none"/><circle cx="12" cy="10" r="2.6" stroke="currentColor" stroke-width="1.8" fill="none"/>',
"phone":'<path d="M6.5 3h3l1.5 5-2.2 1.6a13 13 0 006.6 6.6L17 14l5 1.5v3a2 2 0 01-2.2 2A17.5 17.5 0 013.5 5.2 2 2 0 015.5 3z" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round"/>',
"mail" :'<rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M3.6 7l8.4 6 8.4-6" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/>',
"cal"  :'<rect x="3" y="5" width="18" height="16" rx="2.5" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/>',
"users":'<circle cx="9" cy="8" r="3.3" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M2.6 20a6.6 6.6 0 0112.8 0M17 11.2a3.2 3.2 0 000-6.3M18 20h3.4a5.6 5.6 0 00-3.9-5.3" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/>',
"book" :'<path d="M12 6.5S10 4 5.5 4H3v14h2.5C10 18 12 20.5 12 20.5S14 18 18.5 18H21V4h-2.5C14 4 12 6.5 12 6.5zM12 6.5v14" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round"/>',
"heart":'<path d="M12 20s-7.4-4.7-7.4-9.6A4.4 4.4 0 0112 8.2a4.4 4.4 0 017.4 2.2C19.4 15.3 12 20 12 20z" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round"/>',
"tent" :'<path d="M12 4l8.5 15H3.5L12 4z" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round"/><path d="M12 9v10M8 19l4-6 4 6" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round"/>',
"hands":'<path d="M12 21c-4.4 0-8-3.2-8-7.2V7.6a1.6 1.6 0 013.2 0v3.6M20 13.8V7.6a1.6 1.6 0 00-3.2 0v3.6M9.6 11.2V4.6a1.6 1.6 0 013.2 0v6M14.4 11.2v-5a1.6 1.6 0 013.2 0v5" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
"check":'<path d="M4 12.5l5 5L20 6.5" stroke="currentColor" stroke-width="2.1" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
"ext"  :'<path d="M14 4h6v6M20 4l-9 9M18 14v5a1.6 1.6 0 01-1.6 1.6H5A1.6 1.6 0 013.4 19V7.6A1.6 1.6 0 015 6h5" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
"yt"   :'<path d="M22.2 7.4a2.7 2.7 0 00-1.9-1.9C18.6 5 12 5 12 5s-6.6 0-8.3.5A2.7 2.7 0 001.8 7.4 28 28 0 001.3 12a28 28 0 00.5 4.6 2.7 2.7 0 001.9 1.9C5.4 19 12 19 12 19s6.6 0 8.3-.5a2.7 2.7 0 001.9-1.9 28 28 0 00.5-4.6 28 28 0 00-.5-4.6z" fill="currentColor"/><path d="M9.9 15.2l5.5-3.2-5.5-3.2v6.4z" fill="#05080F"/>',
"fb"   :'<path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0022 12z" fill="currentColor"/>',
"clock":'<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M12 7v5.2l3.4 2" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/>',
"candle":'<path d="M12 2.6c1.6 1.7 2.4 3 2.4 4.1a2.4 2.4 0 1 1-4.8 0c0-1.1.8-2.4 2.4-4.1z" fill="currentColor"/><rect x="9.2" y="10" width="5.6" height="10.4" rx="1.4" stroke="currentColor" stroke-width="1.6" fill="none"/>',
"shield":'<path d="M12 3l7.5 3v5.6c0 4.3-3 8.2-7.5 9.4-4.5-1.2-7.5-5.1-7.5-9.4V6L12 3z" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round"/><path d="M9 12l2.2 2.2L15.4 10" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
"search":'<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
"globe":'<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M3 12h18M12 3a15 15 0 010 18 15 15 0 010-18z" stroke="currentColor" stroke-width="1.7" fill="none"/>',
}
def svg(name, cls="", size=24):
    return ('<svg class="%s" viewBox="0 0 24 24" width="%d" height="%d" '
            'aria-hidden="true" focusable="false">%s</svg>'%(cls,size,size,I[name]))

# The sermon archive needs assets/data/sermons.json. Until that file exists the
# page and its nav entry are left out, so the site never links to an empty
# archive. Flip this by simply adding the data file.
import os as _os
SERMONS_READY = _os.path.exists(_os.path.join(ROOT,"assets","data","sermons.json"))

# ------------------------------------------------------------------ nav data
# Gallery stays out of the top bar to keep it to six items; it is reachable
# from Media, from Legacy, from the drawer and from the footer.
# Six is what fits without wrapping. "Во что мы верим" is long and is already
# linked prominently from About and the footer, so it comes out of the top bar.
NAV = [("about.html","nav.about"),("ministries.html","nav.ministries")] \
    + ([("sermons.html","nav.sermons")] if SERMONS_READY else []) \
    + [("memory.html","nav.memory"),("call.html","nav.call"),("visit.html","nav.visit")]

BRAND_MARK = ('<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">'
 '<defs><linearGradient id="bm" x1="0" y1="0" x2="1" y2="1">'
 '<stop offset="0" stop-color="var(--mark-1)"/><stop offset="1" stop-color="var(--mark-2)"/>'
 '</linearGradient></defs>'
 '<path d="M13 2h6v9h9v6h-9v13h-6V17H4v-6h9V2z" fill="url(#bm)"/></svg>')

def brand(tag="a", href="index.html"):
    return ('<%s class="brand" href="%s" aria-label="Power of the Cross Church">%s'
            '<span class="brand-text">'
            '<span class="brand-name" data-i18n="brand.name">Сила Креста</span>'
            '<span class="brand-sub" data-i18n="brand.sub">Торонто</span>'
            '</span></%s>'%(tag,href,BRAND_MARK,tag))

CROSS_PATH = "M56 36 h8 v14 h12 v8 h-12 v26 h-8 v-26 h-12 v-8 h12 z"

def loader():
    """Veil shown over the page while the cross draws and then opens.

    The mask rect is painted in the page background colour with the cross
    punched out of it, so scaling the cross up wipes the veil away."""
    return ('<div class="loader dark-zone" id="loader" aria-hidden="true">\n'
      '  <svg class="loader-veil" viewBox="0 0 120 120" preserveAspectRatio="xMidYMid slice">\n'
      '    <defs><mask id="loaderMask">\n'
      '      <rect width="120" height="120" fill="#fff"/>\n'
      '      <path class="lm-cross" d="%s" fill="#000"/>\n'
      '    </mask></defs>\n'
      '    <rect class="veil" width="120" height="120" mask="url(#loaderMask)"/>\n'
      '  </svg>\n'
      '  <span class="loader-halo"></span>\n'
      '  <div class="loader-mark">\n'
      '    <svg class="loader-draw" viewBox="88 12 64 92">\n'
      '      <path class="xfill" d="M112 20 h16 v26 h20 v16 h-20 v36 h-16 v-36 h-20 v-16 h20 z"/>\n'
      '      <path class="xline" d="M112 20 h16 v26 h20 v16 h-20 v36 h-16 v-36 h-20 v-16 h20 z" pathLength="1"/>\n'
      '    </svg>\n'
      '    <p class="loader-word" data-i18n="brand.name">Сила Креста</p>\n'
      '  </div>\n'
      '</div>\n') % (CROSS_PATH,)


def head(title_key, desc_key, page):
    body_cls = "has-dark-hero" if page=="index.html" else ""
    return f'''<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Церковь «Сила Креста», Торонто</title>
<meta name="description" content="Русскоязычная христианская церковь в Торонто. Воскресное служение в 11:00, 255 Wildcat Rd.">
<meta name="theme-color" content="#0B1834">
<link rel="canonical" href="{SITE}{'' if page=='index.html' else page}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Power of the Cross Church">
<meta property="og:title" content="Церковь «Сила Креста», Торонто">
<meta property="og:description" content="Русскоязычная христианская церковь в Торонто. Воскресное служение в 11:00.">
<meta property="og:image" content="{SITE}assets/img/hero-worship-1100.webp">
<meta property="og:url" content="{SITE}{'' if page=='index.html' else page}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="{asset('css/style.css')}">
<style>
/* critical: guarantee the veil covers the page even if style.css is still
   in flight, so the loader markup can never flash unstyled */
.loader{{position:fixed;inset:0;z-index:9999;background:#0B1834;display:grid;place-items:center}}
.loader-mark{{position:relative}}
</style>
<script>
/* set language before first paint to avoid a flash of the wrong copy */
(function(){{try{{var q=new URLSearchParams(location.search).get('lang');
var s=q||localStorage.getItem('pocc-lang')||'ru';
document.documentElement.lang=(s==='en'?'en':'ru');
if(new URLSearchParams(location.search).has('embed'))
  document.documentElement.classList.add('is-embed');}}catch(e){{}}}})();
</script>
</head>
<body class="{body_cls}" data-title-key="{title_key}" data-desc-key="{desc_key}">
{loader()}<a class="skip" href="#main" data-i18n="a11y.skip">Перейти к содержанию</a>
'''

def header(page):
    links="".join('<a href="%s" data-i18n="%s">%s</a>'%(h,k,k) for h,k in NAV)
    drawer_links="".join(
        '<a href="%s"><span data-i18n="%s">%s</span>%s</a>'%(h,k,k,svg("chev","",17))
        for h,k in NAV+[("beliefs.html","nav.beliefs"),("camp.html","nav.camp"),("media.html","nav.media"),("gallery.html","nav.gallery"),("give.html","nav.give")])
    return f'''<header class="header">
  <div class="header-inner">
    {brand()}
    <nav class="nav" aria-label="Main">{links}</nav>
    <div class="header-actions">
      <div class="lang" role="group" aria-label="Language">
        <button type="button" data-lang="ru" aria-pressed="true">RU</button>
        <button type="button" data-lang="en" aria-pressed="false">EN</button>
      </div>
      <a class="btn btn-primary btn-sm" href="give.html" data-i18n="nav.give">Пожертвования</a>
      <button class="burger" type="button" aria-expanded="false" aria-controls="drawer"
              data-i18n-attr="aria-label:nav.menu"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="drawer" id="drawer">
  <div class="wrap">
    <a href="index.html"><span data-i18n="nav.home">Главная</span>{svg("chev","",17)}</a>
    {drawer_links}
    <a class="btn btn-blue" href="{YTLIVE}" target="_blank" rel="noopener">
      {svg("play","",18)}<span data-i18n="nav.watch">Смотреть онлайн</span></a>
  </div>
</div>
<main id="main">
'''

def cta_band():
    return f'''<section class="section"><div class="wrap">
  <div class="cta" data-reveal>
    <div class="wrap-narrow">
      <h2 data-i18n="cta.h">Мы будем рады видеть вас в это воскресенье</h2>
      <p data-i18n="cta.p"></p>
      <div class="cta-btns">
        <a class="btn btn-primary" href="visit.html">{svg("pin","",18)}<span data-i18n="cta.b1">Как нас найти</span></a>
        <a class="btn btn-ghost" href="{YTLIVE}" target="_blank" rel="noopener">{svg("play","",18)}<span data-i18n="cta.b2">Смотреть онлайн</span></a>
      </div>
    </div>
  </div>
</div></section>
'''

def footer(extra_js=()):
    sect="".join('<a href="%s" data-i18n="%s">%s</a>'%(h,k,k) for h,k in
        [("about.html","nav.about"),("beliefs.html","nav.beliefs"),
         ("memory.html","nav.memory"),("gallery.html","nav.gallery"),("give.html","nav.give")])
    serv="".join('<a href="%s" data-i18n="%s">%s</a>'%(h,k,k) for h,k in
        [("ministries.html","nav.ministries"),("camp.html","nav.camp")]
        + ([("sermons.html","nav.sermons")] if SERMONS_READY else [])
        + [("media.html","nav.media")])
    return f'''</main>
<footer class="footer dark-zone">
  <div class="wrap">
    <div class="footer-grid">
      <div class="footer-about">
        {brand()}
        <p data-i18n="foot.about"></p>
        <div class="socials">
          <a href="{YT}" target="_blank" rel="noopener" aria-label="YouTube">{svg("yt","",19)}</a>
          <a href="{FB}" target="_blank" rel="noopener" aria-label="Facebook">{svg("fb","",19)}</a>
        </div>
      </div>
      <div>
        <h4 data-i18n="foot.nav">Разделы</h4>
        <div class="footer-links">{sect}</div>
      </div>
      <div>
        <h4 data-i18n="foot.serv">Служения</h4>
        <div class="footer-links">{serv}</div>
      </div>
      <div>
        <h4 data-i18n="foot.contact">Контакты</h4>
        <div class="footer-links">
          <a href="https://www.google.com/maps/search/?api=1&amp;query={MAPQ}" target="_blank" rel="noopener">{ADDR}</a>
          <a href="tel:{PHONE_HREF}">{PHONE}</a>
          <a href="visit.html" data-i18n="visit.dir">Проложить маршрут</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; <span data-year>2026</span> <span data-i18n="brand.legal">Power of the Cross Church</span>. <span data-i18n="foot.rights">Все права защищены.</span></span>
      <span data-i18n="foot.built">Сайт обновлён в 2026 году</span>
    </div>
  </div>
</footer>
<script src="{asset('js/config.js')}"></script>
<script src="{asset('js/cloth.js')}"></script>
<script src="{asset('js/qr.js')}"></script>
<script src="{asset('js/i18n.js')}"></script>
<script src="{asset('js/main.js')}"></script>
__EXTRA__
</body>
</html>
'''.replace("__EXTRA__", "".join('<script src="%s"></script>\n' % asset('js/'+j) for j in extra_js).rstrip("\n"))

def lightbox():
    return f'''<div class="lb" aria-hidden="true" role="dialog" aria-modal="true">
  <button class="lb-close" type="button" data-i18n-attr="aria-label:a11y.lightbox.close">{svg("close","",20)}</button>
  <button class="lb-nav lb-prev" type="button" data-i18n-attr="aria-label:a11y.lightbox.prev">{svg("chevl","",20)}</button>
  <button class="lb-nav lb-next" type="button" data-i18n-attr="aria-label:a11y.lightbox.next">{svg("chev","",20)}</button>
  <div><img src="" alt=""><p class="lb-cap"></p></div>
</div>
'''

def page_hero(crumb_key, eyebrow_key, h_key, lead_key):
    return f'''<section class="page-hero"><div class="wrap">
  <nav class="crumb" aria-label="Breadcrumb" data-reveal>
    <a href="index.html" data-i18n="nav.home">Главная</a>{svg("chev","",12)}
    <span data-i18n="{crumb_key}"></span>
  </nav>
  <div data-reveal>
    <p class="eyebrow" data-i18n="{eyebrow_key}"></p>
    <h1 data-i18n="{h_key}"></h1>
    <p class="lead" data-i18n="{lead_key}"></p>
  </div>
</div></section>
'''

def times_strip():
    rows=""
    for k in ("sun","wed","fri"):
        rows+=f'''<div class="times-item">
        <span class="times-day" data-i18n="times.{k}.day"></span>
        <span class="times-name" data-i18n="times.{k}.name"></span>
        <span class="times-hour" data-i18n="times.{k}.hour"></span>
      </div>'''
    return f'''<section class="times"><div class="wrap">
    <div class="times-grid" data-reveal-stagger>{rows}</div>
  </div></section>
'''

GALLERY = [
 ("g-worship","gal.g1"),("g-baptism","gal.g4"),("g-nativity","gal.g2"),
 ("g-camp-lake","gal.g11"),("g-praise","gal.g6"),("g-outreach","gal.g15"),
 ("g-children","gal.g3"),("g-camp-group","gal.g10"),("g-fellowship","gal.g8"),
 ("g-baptism-day","gal.g5"),("g-camp-forest","gal.g13"),("g-community","gal.g17"),
 ("g-youth","gal.g7"),("g-camp-meal","gal.g12"),("g-service","gal.g9"),
 ("g-outreach-crowd","gal.g16"),("g-flowers","gal.g18"),("g-camp-family","gal.g14"),
 ("g-wedding","gal.g19"),("g-building","gal.g20"),
]
def gal_items(items):
    out=""
    for slug,key in items:
        out+=f'''<button class="gal-item" type="button" data-lb="assets/img/{slug}-1100.webp"
      data-lb-cap="" data-lb-capkey="{key}" data-i18n-attr="aria-label:a11y.gallery.open">
      <img src="assets/img/{slug}-560.webp" srcset="assets/img/{slug}-560.webp 560w, assets/img/{slug}-1100.webp 1100w"
           sizes="(max-width:560px) 92vw, (max-width:940px) 46vw, 31vw"
           width="560" height="420" loading="lazy" decoding="async" alt="">
      <span class="gal-cap" data-i18n="{key}"></span>
    </button>'''
    return out

# ===================================================================== PAGES
def p_index():
    mins=[("c-prayer","min.m1"),("c-groups","min.m2"),("c-school","min.m4")]
    cards=""
    for img,k in mins:
        cards+=f'''<article class="card">
        <div class="card-media"><img src="assets/img/{img}-600.webp"
          srcset="assets/img/{img}-600.webp 600w, assets/img/{img}-900.webp 900w"
          sizes="(max-width:700px) 92vw, 31vw" width="600" height="400"
          loading="lazy" decoding="async" alt=""></div>
        <div class="card-body">
          <span class="card-meta" data-i18n="{k}.meta"></span>
          <h3 data-i18n="{k}.t"></h3>
          <p data-i18n="{k}.d"></p>
        </div></article>'''
    stats=""
    for n in (1,2,3):
        stats+=f'''<div class="stat"><div class="stat-n" data-i18n="home.stat{n}.n"></div>
        <div class="stat-l" data-i18n="home.stat{n}.l"></div></div>'''
    return head("nav.home","foot.about","index.html")+header("index.html")+f'''
<section class="hero dark-zone">
  <div class="hero-media">
    <img src="assets/img/hero-worship-1600.webp"
         srcset="assets/img/hero-worship-760.webp 760w, assets/img/hero-worship-1100.webp 1100w, assets/img/hero-worship-1600.webp 1600w"
         sizes="100vw" width="1600" height="900" fetchpriority="high" decoding="async" alt="">
  </div>
  <div class="hero-inner"><div class="wrap">
    <svg class="hero-cross" viewBox="0 0 32 32" aria-hidden="true">
      <defs><linearGradient id="hc" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#BFE0FF"/><stop offset="1" stop-color="#5AA9FF"/></linearGradient></defs>
      <path d="M13 2h6v9h9v6h-9v13h-6V17H4v-6h9V2z" fill="url(#hc)"/></svg>
    <p class="eyebrow" data-i18n="hero.kicker"></p>
    <h1 class="display"><span data-i18n="hero.t1">Сила</span><em data-i18n="hero.t2">Креста</em></h1>
    <p class="hero-verse"><span data-i18n="hero.verse"></span>
      <cite data-i18n="hero.verse.ref"></cite></p>
    <div class="hero-cta">
      <a class="btn btn-primary" href="visit.html">{svg("pin","",18)}<span data-i18n="hero.cta1">Прийти в воскресенье</span></a>
      <a class="btn btn-ghost" href="{YTLIVE}" target="_blank" rel="noopener">{svg("play","",18)}<span data-i18n="hero.cta2">Смотреть служение</span></a>
    </div>
  </div></div>
  <div class="scroll-hint" aria-hidden="true"><span></span><small data-i18n="hero.scroll"></small></div>
</section>

{times_strip()}

<section class="film dark-zone"><div class="wrap">
  <div class="film-head" data-reveal>
    <p class="eyebrow" data-i18n="film.eyebrow"></p>
    <h2 data-i18n="film.h"></h2>
    <p data-i18n="film.p"></p>
    <p class="film-by"><strong data-i18n="film.pastor"></strong><span data-i18n="film.role"></span></p>
    <div class="cta-btns" style="justify-content:flex-start;margin-top:1.4rem">
      <a class="btn btn-primary" href="call.html">
        {svg("hands","",18)}<span data-i18n="home.call.link"></span></a>
      <a class="btn btn-ghost" href="tel:{PHONE_HREF}">
        {svg("phone","",18)}<span data-i18n="call.callnow"></span></a>
    </div>
  </div>
  <div class="film-stage" id="filmStage" data-video="v3GWHgBy_DM" data-reveal>
    <img src="assets/img/invite-1280.webp"
         srcset="assets/img/invite-560.webp 560w, assets/img/invite-860.webp 860w, assets/img/invite-1280.webp 1280w"
         sizes="(max-width:700px) 92vw, 1160px" width="1280" height="720"
         loading="lazy" decoding="async" alt="">
    <button class="film-play" type="button" id="filmPlay" data-i18n-attr="aria-label:film.play">
      <span class="film-play-ring">{svg("play","",30)}</span>
    </button>
    <span class="film-len" data-i18n="film.len"></span>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <div class="split">
    <div class="split-media" data-reveal>
      <img src="assets/img/g-worship-1100.webp" width="1100" height="825" loading="lazy" decoding="async" alt="">
    </div>
    <div class="split-body" data-reveal>
      <p class="eyebrow" data-i18n="home.welcome.eyebrow"></p>
      <h2 data-i18n="home.welcome.h"></h2>
      <p class="lead" data-i18n="home.welcome.p1"></p>
      <p class="muted" style="margin-top:1rem" data-i18n="home.welcome.p2"></p>
      <a class="link-arrow" href="about.html"><span data-i18n="home.welcome.link"></span>{svg("arrow","",16)}</a>
    </div>
  </div>
  <div class="stats" style="margin-top:4.5rem" data-reveal-stagger>{stats}</div>
</div></section>

<section class="verse">
  <div class="wrap-narrow verse-src">
    <svg class="verse-cross" viewBox="0 0 32 32" aria-hidden="true" style="color:var(--blue-br)">
      <path d="M13 2h6v9h9v6h-9v13h-6V17H4v-6h9V2z" fill="currentColor"/></svg>
    <blockquote data-i18n="hero.verse"></blockquote>
    <cite data-i18n="hero.verse.ref"></cite>
  </div>
</section>

<section class="section"><div class="wrap">
  <div class="section-head" data-reveal>
    <p class="eyebrow" data-i18n="home.min.eyebrow"></p>
    <h2 data-i18n="home.min.h"></h2>
    <p class="lead" data-i18n="home.min.p"></p>
  </div>
  <div class="grid grid-3" data-reveal-stagger>{cards}</div>
  <div style="margin-top:2rem" data-reveal>
    <a class="link-arrow" href="ministries.html"><span data-i18n="home.min.all"></span>{svg("arrow","",16)}</a>
  </div>
</div></section>

''' + (f"""<section class="section"><div class="wrap">
  <div class="split is-reverse">
    <div class="split-media" data-reveal>
      <img src="assets/img/g-service-1100.webp" width="1100" height="825" loading="lazy" decoding="async" alt="">
    </div>
    <div class="split-body" data-reveal>
      <p class="eyebrow" data-i18n="home.serm.eyebrow"></p>
      <h2 data-i18n="home.serm.h"></h2>
      <p class="lead" data-i18n="home.serm.p"></p>
      <a class="link-arrow" href="sermons.html"><span data-i18n="home.serm.link"></span>{svg("arrow","",16)}</a>
    </div>
  </div>
</div></section>
""" if SERMONS_READY else '') + f'''<section class="section-sm"><div class="wrap">
  <div class="split">
    <div class="split-body" data-reveal>
      <p class="eyebrow" data-i18n="home.mem.eyebrow"></p>
      <h2 data-i18n="home.mem.h"></h2>
      <p class="lead" data-i18n="home.mem.p"></p>
      <a class="link-arrow" href="memory.html"><span data-i18n="home.mem.link"></span>{svg("arrow","",16)}</a>
    </div>
    <div class="split-media" data-reveal>
      <img src="assets/img/g-baptism-day-1100.webp" width="1100" height="825" loading="lazy" decoding="async" alt="">
    </div>
  </div>
</div></section>

<section class="section-sm"><div class="wrap">
  <div class="split is-reverse">
    <div class="split-media" data-reveal>
      <img src="assets/img/c-prayer-900.webp" width="900" height="600" loading="lazy" decoding="async" alt="">
    </div>
    <div class="split-body" data-reveal>
      <p class="eyebrow" data-i18n="home.call.eyebrow"></p>
      <h2 data-i18n="home.call.h"></h2>
      <p class="lead" data-i18n="home.call.p"></p>
      <a class="link-arrow" href="call.html"><span data-i18n="home.call.link"></span>{svg("arrow","",16)}</a>
    </div>
  </div>
</div></section>

<section class="section demo-section"><div class="wrap">
  <div class="section-head" data-reveal>
    <p class="eyebrow" data-i18n="demo.app.eyebrow"></p>
    <h2 data-i18n="demo.app.h"></h2>
  </div>
  <div class="demo-grid">
    <div data-reveal>
      <div class="phone">
        <div class="phone-screen">
          <iframe id="demoFrame" title="" loading="lazy" tabindex="-1" scrolling="no"></iframe>
        </div>
      </div>
      <p class="phone-note" data-i18n="demo.live"></p>
    </div>
    <div class="demo-body" data-reveal>
      <p class="lead" data-i18n="demo.app.p"></p>
      <div class="qr-card">
        <div id="qrBox"></div>
        <span class="qr-scan" data-i18n="demo.scan"></span>
      </div>
      <a class="btn btn-primary" href="app.html" style="margin-top:1.2rem">
        {svg("play","",18)}<span data-i18n="demo.app.open"></span></a>
      <p class="pane-note">{svg("check","",15)}<span data-i18n="demo.hint"></span></p>
    </div>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <div class="section-head is-center" data-reveal>
    <p class="eyebrow" data-i18n="home.gal.eyebrow"></p>
    <h2 data-i18n="home.gal.h"></h2>
  </div>
  <div class="gal" data-reveal>{gal_items(GALLERY[:6])}</div>
  <div style="margin-top:2rem;text-align:center" data-reveal>
    <a class="link-arrow" href="gallery.html"><span data-i18n="home.gal.all"></span>{svg("arrow","",16)}</a>
  </div>
</div></section>

<section class="section-sm"><div class="wrap">
  <div class="syb" data-reveal>
    <div>
      <span class="sy-kept">{svg("shield","",16)}
        <span data-i18n="sy.kept"></span><b>Saylavy</b></span>
      <h2 data-i18n="syb.h"></h2>
      <p data-i18n="syb.p"></p>
    </div>
    <div class="syb-links">
      <a class="btn btn-primary" href="memory.html">
        {svg("heart","",18)}<span data-i18n="syb.link"></span></a>
      <a class="btn btn-ghost" href="https://saylavy.world" target="_blank" rel="noopener">
        <span data-i18n="sy.cta"></span>{svg("ext","",18)}</a>
    </div>
  </div>
</div></section>

{cta_band()}
{lightbox()}
'''+footer()

def p_about():
    return head("nav.about","about.lead","about.html")+header("about.html")+\
      page_hero("about.crumb","about.eyebrow","about.h","about.lead")+f'''
<section class="section-sm"><div class="wrap">
  <div class="split">
    <div class="split-media" data-reveal>
      <img src="assets/img/g-service-1100.webp" width="1100" height="825" loading="lazy" decoding="async" alt="">
    </div>
    <div class="split-body" data-reveal>
      <h2 data-i18n="about.s1.h"></h2>
      <p class="lead" data-i18n="about.s1.p1"></p>
      <p class="muted" style="margin-top:1rem" data-i18n="about.s1.p2"></p>
    </div>
  </div>
</div></section>

<section class="verse">
  <div class="wrap-narrow verse-src">
    <svg class="verse-cross" viewBox="0 0 32 32" aria-hidden="true" style="color:var(--blue-br)">
      <path d="M13 2h6v9h9v6h-9v13h-6V17H4v-6h9V2z" fill="currentColor"/></svg>
    <blockquote data-i18n="hero.verse"></blockquote>
    <cite data-i18n="hero.verse.ref"></cite>
  </div>
</section>

<section class="section"><div class="wrap">
  <div class="split is-reverse">
    <div class="split-media" data-reveal>
      <img src="assets/img/g-praise-1100.webp" width="1100" height="825" loading="lazy" decoding="async" alt="">
    </div>
    <div class="split-body" data-reveal>
      <h2 data-i18n="about.s2.h"></h2>
      <p class="lead" data-i18n="about.s2.p1"></p>
      <p class="muted" style="margin-top:1rem" data-i18n="about.s2.p2"></p>
      <a class="link-arrow" href="beliefs.html"><span data-i18n="nav.beliefs"></span>{svg("arrow","",16)}</a>
    </div>
  </div>
</div></section>

{times_strip()}

<section class="section"><div class="wrap-narrow" style="text-align:center">
  <div data-reveal>
    <h2 data-i18n="about.s3.h"></h2>
    <p class="lead" style="margin:1rem auto 0" data-i18n="about.s3.p"></p>
    <div class="cta-btns" style="margin-top:2rem">
      <a class="btn btn-primary" href="visit.html">{svg("pin","",18)}<span data-i18n="cta.b1"></span></a>
      <a class="btn btn-ghost" href="ministries.html"><span data-i18n="nav.ministries"></span>{svg("arrow","",18)}</a>
    </div>
  </div>
</div></section>
'''+footer()

def p_beliefs():
    rows=""
    for n in range(1,18):
        rows+=f'''<div class="belief">
      <button class="belief-q" type="button" aria-expanded="{'true' if n==1 else 'false'}">
        <span class="belief-n">{n:02d}</span>
        <span class="belief-t" data-i18n="b{n}.t"></span>
        <span class="belief-icon">{svg("plus","",13)}</span>
      </button>
      <div class="belief-a"><div><p><span data-i18n="b{n}.d"></span>
        <span class="belief-ref" data-i18n="b{n}.r"></span></p></div></div>
    </div>'''
    return head("nav.beliefs","beliefs.lead","beliefs.html")+header("beliefs.html")+\
      page_hero("beliefs.crumb","beliefs.eyebrow","beliefs.h","beliefs.lead")+f'''
<section class="section-sm"><div class="wrap-narrow">
  <p class="dim" style="font-size:.85rem;margin-bottom:1rem" data-i18n="beliefs.hint"></p>
  <div class="beliefs" data-reveal>{rows}</div>
</div></section>
{cta_band()}
'''+footer()

def p_ministries():
    mins=[("c-prayer","min.m1"),("c-groups","min.m2"),("c-baptism","min.m3"),
          ("c-school","min.m4"),("c-youth","min.m5"),("c-camp","min.m6")]
    cards=""
    for img,k in mins:
        cards+=f'''<article class="card">
        <div class="card-media"><img src="assets/img/{img}-600.webp"
          srcset="assets/img/{img}-600.webp 600w, assets/img/{img}-900.webp 900w"
          sizes="(max-width:700px) 92vw, 31vw" width="600" height="400"
          loading="lazy" decoding="async" alt=""></div>
        <div class="card-body">
          <span class="card-meta" data-i18n="{k}.meta"></span>
          <h3 data-i18n="{k}.t"></h3>
          <p data-i18n="{k}.d"></p>
        </div></article>'''
    return head("nav.ministries","min.lead","ministries.html")+header("ministries.html")+\
      page_hero("min.crumb","min.eyebrow","min.h","min.lead")+f'''
<section class="section-sm"><div class="wrap">
  <div class="grid grid-3" data-reveal-stagger>{cards}</div>
</div></section>

{times_strip()}

<section class="section"><div class="wrap">
  <div class="split">
    <div class="split-media" data-reveal>
      <img src="assets/img/g-children-1100.webp" width="1100" height="825" loading="lazy" decoding="async" alt="">
    </div>
    <div class="split-body" data-reveal>
      <p class="eyebrow" data-i18n="min.school.eyebrow"></p>
      <h2 data-i18n="min.school.h"></h2>
      <p class="lead" data-i18n="min.school.p1"></p>
      <p class="muted" style="margin-top:1rem" data-i18n="min.school.p2"></p>
      <p class="muted" style="margin-top:1rem" data-i18n="min.school.p3"></p>
    </div>
  </div>
</div></section>

<section class="section-sm"><div class="wrap">
  <div class="split is-reverse">
    <div class="split-media" data-reveal>
      <img src="assets/img/c-camp-900.webp" width="900" height="600" loading="lazy" decoding="async" alt="">
    </div>
    <div class="split-body" data-reveal>
      <p class="eyebrow" data-i18n="home.camp.eyebrow"></p>
      <h2 data-i18n="home.camp.h"></h2>
      <p class="lead" data-i18n="home.camp.p"></p>
      <a class="link-arrow" href="camp.html"><span data-i18n="home.camp.link"></span>{svg("arrow","",16)}</a>
    </div>
  </div>
</div></section>
{cta_band()}
'''+footer()

def p_camp():
    facts=""
    for k,ic in (("age","users"),("len","clock"),("size","users"),("place","pin")):
        facts+=f'''<div class="icard">
        <span class="icard-icon">{svg(ic,"",22)}</span>
        <span class="card-meta" data-i18n="camp.{k}"></span>
        <h3 style="font-size:1.25rem" data-i18n="camp.{k}.v"></h3>
      </div>'''
    prog="".join(f'''<li>{svg("check","",19)}<span data-i18n="camp.p{n}"></span></li>''' for n in range(1,9))
    pack="".join(f'''<li>{svg("check","",19)}<span data-i18n="camp.k{n}"></span></li>''' for n in range(1,13))
    return head("nav.camp","camp.lead","camp.html")+header("camp.html")+\
      page_hero("camp.crumb","camp.eyebrow","camp.h","camp.lead")+f'''
<section class="section-sm"><div class="wrap">
  <div class="grid grid-4" data-reveal-stagger>{facts}</div>
</div></section>

<section class="section-sm"><div class="wrap">
  <div class="split">
    <div class="split-media" data-reveal>
      <img src="assets/img/g-camp-lake-1100.webp" width="1100" height="825" loading="lazy" decoding="async" alt="">
    </div>
    <div class="split-body" data-reveal>
      <h2 data-i18n="camp.prog.h"></h2>
      <ul class="checks" style="margin-top:1.5rem">{prog}</ul>
    </div>
  </div>
</div></section>

<section class="section-sm"><div class="wrap">
  <div class="split is-reverse">
    <div class="split-media" data-reveal>
      <img src="assets/img/g-camp-group-1100.webp" width="1100" height="825" loading="lazy" decoding="async" alt="">
    </div>
    <div class="split-body" data-reveal>
      <h2 data-i18n="camp.pack.h"></h2>
      <ul class="checks" style="margin-top:1.5rem">{pack}</ul>
      <div class="icard" style="margin-top:2rem">
        <span class="icard-icon">{svg("heart","",22)}</span>
        <h3 style="font-size:1.15rem" data-i18n="camp.no.h"></h3>
        <p data-i18n="camp.no.d"></p>
      </div>
    </div>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <div class="cta" data-reveal><div class="wrap-narrow">
    <h2 data-i18n="camp.cta.h"></h2>
    <p data-i18n="camp.cta.p"></p>
    <div class="cta-btns">
      <a class="btn btn-primary" href="tel:{PHONE_HREF}">{svg("phone","",18)}<span>{PHONE}</span></a>
      <a class="btn btn-ghost" href="visit.html">{svg("pin","",18)}<span data-i18n="cta.b1"></span></a>
    </div>
  </div></div>
</div></section>
'''+footer()

def p_media():
    tiles=[("live","play",YTLIVE,"media.live.cta"),
           ("yt","yt",YT,"media.open"),
           ("fb","fb",FB,"media.open"),
           ("gal","book","gallery.html","media.open")]
    out=""
    for k,ic,href,cta in tiles:
        ext=' target="_blank" rel="noopener"' if href.startswith("http") else ""
        out+=f'''<article class="icard">
        <span class="icard-icon">{svg(ic,"",22)}</span>
        <h3 data-i18n="media.{k}.h"></h3>
        <p data-i18n="media.{k}.p"></p>
        <a class="link-arrow" href="{href}"{ext}><span data-i18n="{cta}"></span>{svg("arrow","",16)}</a>
      </article>'''
    return head("nav.media","media.lead","media.html")+header("media.html")+\
      page_hero("media.crumb","media.eyebrow","media.h","media.lead")+f'''
<section class="section-sm"><div class="wrap">
  <div class="split">
    <div class="split-media" data-reveal>
      <img src="assets/img/g-worship-1100.webp" width="1100" height="825" loading="lazy" decoding="async" alt="">
    </div>
    <div class="split-body" data-reveal>
      <p class="eyebrow" data-i18n="times.sun.hour"></p>
      <h2 data-i18n="media.live.h"></h2>
      <p class="lead" data-i18n="media.live.p"></p>
      <a class="btn btn-blue" href="{YTLIVE}" target="_blank" rel="noopener" style="margin-top:1.5rem">
        {svg("play","",18)}<span data-i18n="media.live.cta"></span></a>
    </div>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <div class="grid grid-4" data-reveal-stagger>{out}</div>
</div></section>
{cta_band()}
'''+footer()

def p_gallery():
    return head("nav.gallery","gal.lead","gallery.html")+header("gallery.html")+\
      page_hero("gal.crumb","gal.eyebrow","gal.h","gal.lead")+f'''
<section class="section-sm"><div class="wrap">
  <div class="gal" data-reveal>{gal_items(GALLERY)}</div>
</div></section>
{cta_band()}
{lightbox()}
'''+footer()

def p_visit():
    first="".join(f'''<li>{svg("check","",19)}<span data-i18n="visit.f{n}"></span></li>''' for n in range(1,5))
    return head("nav.visit","visit.lead","visit.html")+header("visit.html")+\
      page_hero("visit.crumb","visit.eyebrow","visit.h","visit.lead")+f'''
<section class="section-sm"><div class="wrap">
  <div class="split is-top">
    <div class="split-body" data-reveal>
      <div class="info">
        <div class="info-row">
          <span class="info-k" data-i18n="visit.addr"></span>
          <span class="info-v"><a href="https://www.google.com/maps/search/?api=1&amp;query={MAPQ}"
            target="_blank" rel="noopener">{ADDR}</a></span>
        </div>
        <div class="info-row">
          <span class="info-k" data-i18n="visit.phone"></span>
          <span class="info-v"><a href="tel:{PHONE_HREF}">{PHONE}</a></span>
        </div>
        <div class="info-row">
          <span class="info-k" data-i18n="visit.times.k"></span>
          <span class="info-v" data-i18n-html="visit.times.v"></span>
        </div>
        <div class="info-row">
          <span class="info-k" data-i18n="visit.lang.k"></span>
          <span class="info-v" data-i18n="visit.lang.v"></span>
        </div>
      </div>
      <div class="cta-btns" style="justify-content:flex-start;margin-top:2rem">
        <a class="btn btn-primary" href="https://www.google.com/maps/dir/?api=1&amp;destination={MAPQ}"
           target="_blank" rel="noopener">{svg("pin","",18)}<span data-i18n="visit.dir"></span></a>
        <a class="btn btn-ghost" href="tel:{PHONE_HREF}">{svg("phone","",18)}<span data-i18n="visit.call"></span></a>
      </div>
    </div>
    <div class="split-body" data-reveal>
      <h2 data-i18n="visit.first.h"></h2>
      <ul class="checks" style="margin-top:1.5rem">{first}</ul>
    </div>
  </div>
</div></section>

{times_strip()}

<section class="section"><div class="wrap">
  <div class="section-head" data-reveal><h2 data-i18n="visit.map.h"></h2></div>
  <div class="map" data-reveal>
    <iframe src="https://www.google.com/maps?q={MAPQ}&amp;output=embed"
      loading="lazy" referrerpolicy="no-referrer-when-downgrade"
      title="255 Wildcat Rd, Toronto"></iframe>
  </div>
</div></section>
{cta_band()}
'''+footer()

def p_give():
    steps="".join('''<div class="step"><span class="step-n"></span>
      <div><h3 style="font-size:1.08rem" data-i18n="give.s%d.h"></h3>
      <p data-i18n="give.s%d.p"></p></div></div>''' % (n,n) for n in range(1,5))

    uses="".join('''<article class="icard">
        <span class="icard-icon">%s</span>
        <h3 style="font-size:1.15rem" data-i18n="give.use%d.h"></h3>
        <p data-i18n="give.use%d.d"></p>
      </article>''' % (svg(ic,"",22),n,n)
      for n,ic in ((1,"hands"),(2,"users"),(3,"heart"),(4,"book")))

    # Card panel ships hidden. js/config.js decides whether it appears, so the
    # page can never go live with a Give button that leads nowhere.
    chips="".join(
      '<button class="amount" type="button" aria-pressed="false" data-amount="%s">$%s</button>' % (a,a)
      for a in ("25","50","100","250"))
    chips+='<button class="amount is-other" type="button" aria-pressed="false" data-amount="other" data-i18n="give.card.other"></button>'

    card='''<div class="pane is-lead" id="cardPane" hidden data-reveal>
        <span class="pane-tag" data-i18n="give.card.tag"></span>
        <span class="pane-icon">%s</span>
        <h2 data-i18n="give.card.h"></h2>
        <p data-i18n="give.card.p"></p>
        <span class="amount-label" data-i18n="give.card.pick"></span>
        <div class="amounts" id="amounts">%s</div>
        <a class="btn btn-primary" id="giveBtn" href="#" target="_blank" rel="noopener">
          %s<span data-i18n="give.card.btn"></span></a>
        <p class="pane-note">%s<span data-i18n="give.card.safe"></span></p>
      </div>''' % (svg("heart","",22), chips, svg("heart","",18), svg("check","",15))

    etr='''<div class="pane" data-reveal>
        <span class="pane-icon">%s</span>
        <h2 data-i18n="give.etr.h"></h2>
        <p data-i18n="give.etr.p"></p>
        <div class="etr-box">
          <span class="etr-addr" id="etrAddr">
            <a href="tel:%s">%s</a>
            <small data-i18n="give.protect"></small>
          </span>
          <span class="pill" data-i18n="give.etr.free"></span>
        </div>
        <div class="steps" style="margin-top:.5rem">%s</div>
      </div>''' % (svg("mail","",22), PHONE_HREF, PHONE, steps)

    return head("nav.give","give.lead","give.html")+header("give.html")+\
      page_hero("give.crumb","give.eyebrow","give.h","give.lead")+f'''
<section class="section-sm"><div class="wrap">
  <div class="section-head" data-reveal>
    <h2 data-i18n="give.methods.h"></h2>
    <p class="lead" data-i18n="give.methods.p"></p>
  </div>
  <div class="give-grid">{card}{etr}</div>
</div></section>

<section class="section"><div class="wrap">
  <div class="section-head" data-reveal>
    <p class="eyebrow" data-i18n="give.eyebrow"></p>
    <h2 data-i18n="give.use.h"></h2>
    <p class="lead" data-i18n="give.use.p"></p>
  </div>
  <div class="grid grid-4" data-reveal-stagger>{uses}</div>
</div></section>

<section class="section-sm"><div class="wrap">
  <div class="cta" data-reveal><div class="wrap-narrow">
    <h2 data-i18n="give.note.h"></h2>
    <p data-i18n="give.note.p"></p>
    <div class="cta-btns">
      <a class="btn btn-primary" href="tel:{PHONE_HREF}">{svg("phone","",18)}<span>{PHONE}</span></a>
      <a class="btn btn-ghost" href="visit.html">{svg("pin","",18)}<span data-i18n="cta.b1"></span></a>
    </div>
  </div></div>
</div></section>
'''+footer()

def p_memory():
    cards="".join('''<article class="icard">
        <span class="icard-icon">%s</span>
        <h3 style="font-size:1.18rem" data-i18n="mem.c%d.h"></h3>
        <p data-i18n="mem.c%d.d"></p>
      </article>''' % (svg(ic,"",22),n,n)
      for n,ic in ((1,"play"),(2,"users"),(3,"book"),(4,"hands")))

    checks="".join('<li>%s<span data-i18n="mem.l%d"></span></li>' % (svg("check","",19),n)
                   for n in range(1,7))

    return head("nav.memory","mem.lead","memory.html")+header("memory.html")+\
      page_hero("mem.crumb","mem.eyebrow","mem.h","mem.lead")+f'''
<section class="section-sm"><div class="wrap">
  <div class="section-head" data-reveal>
    <h2 data-i18n="mem.what.h"></h2>
    <p class="lead" data-i18n="mem.what.p"></p>
  </div>
  <div class="grid grid-4" data-reveal-stagger>{cards}</div>
</div></section>

<section class="section"><div class="wrap">
  <div class="split">
    <div class="split-media" data-reveal>
      <img src="assets/img/g-baptism-1100.webp" width="1100" height="825" loading="lazy" decoding="async" alt="">
    </div>
    <div class="split-body" data-reveal>
      <p class="eyebrow" data-i18n="mem.arch.eyebrow"></p>
      <h2 data-i18n="mem.arch.h"></h2>
      <p class="lead" data-i18n="mem.arch.p1"></p>
      <p class="muted" style="margin-top:1rem" data-i18n="mem.arch.p2"></p>
      <a class="link-arrow" href="gallery.html"><span data-i18n="mem.arch.link"></span>{svg("arrow","",16)}</a>
    </div>
  </div>
</div></section>

<section class="verse">
  <div class="wrap-narrow verse-src">
    <svg class="verse-cross" viewBox="0 0 32 32" aria-hidden="true" style="color:var(--blue)">
      <path d="M13 2h6v9h9v6h-9v13h-6V17H4v-6h9V2z" fill="currentColor"/></svg>
    <blockquote data-i18n="hero.verse"></blockquote>
    <cite data-i18n="hero.verse.ref"></cite>
  </div>
</section>

<section class="section"><div class="wrap">
  <div class="split is-reverse">
    <div class="split-media" data-reveal>
      <img src="assets/img/g-children-1100.webp" width="1100" height="825" loading="lazy" decoding="async" alt="">
    </div>
    <div class="split-body" data-reveal>
      <p class="eyebrow" data-i18n="mem.learn.eyebrow"></p>
      <h2 data-i18n="mem.learn.h"></h2>
      <p class="lead" data-i18n="mem.learn.p1"></p>
      <p class="muted" style="margin-top:1rem" data-i18n="mem.learn.p2"></p>
      <ul class="checks" style="margin-top:1.5rem">{checks}</ul>
    </div>
  </div>
</div></section>

<section class="sy"><div class="wrap">
  <span class="sy-kept">{svg("shield","",16)}
    <span data-i18n="sy.kept"></span><b>Saylavy</b></span>
  <div class="sy-head" data-reveal>
    <p class="eyebrow" data-i18n="sy.eyebrow"></p>
    <h2 data-i18n="sy.h"></h2>
    <p class="lead" data-i18n="sy.p"></p>
  </div>
  <div class="sy-grid" data-reveal-stagger><article class="sy-card"><span class="icard-icon">{svg("heart","",20)}</span><h3 data-i18n="sy.f1.h"></h3><p data-i18n="sy.f1.d"></p></article><article class="sy-card"><span class="icard-icon">{svg("play","",20)}</span><h3 data-i18n="sy.f2.h"></h3><p data-i18n="sy.f2.d"></p></article><article class="sy-card"><span class="icard-icon">{svg("globe","",20)}</span><h3 data-i18n="sy.f3.h"></h3><p data-i18n="sy.f3.d"></p></article><article class="sy-card"><span class="icard-icon">{svg("check","",20)}</span><h3 data-i18n="sy.f4.h"></h3><p data-i18n="sy.f4.d"></p></article></div>

  <div class="wall-note" data-reveal>{svg("shield","",19)}
    <div><b data-i18n="wall.demo.h"></b><p data-i18n="wall.demo.p"></p></div>
  </div>

  <div class="sy-head" data-reveal style="margin-top:var(--s-6)">
    <h2 style="font-size:clamp(1.6rem,1.2rem + 1.6vw,2.4rem)" data-i18n="wall.h"></h2>
    <p data-i18n="wall.p"></p>
  </div>

  <div class="wall-tools" data-reveal>
    <div class="wall-chips" id="wallChips">
      <button class="wall-chip" type="button" data-filter="all" aria-pressed="true" data-i18n="wall.f.all"></button>
      <button class="wall-chip" type="button" data-filter="founders" aria-pressed="false" data-i18n="wall.f.founders"></button>
      <button class="wall-chip" type="button" data-filter="recent" aria-pressed="false" data-i18n="wall.f.recent"></button>
    </div>
    <div class="wall-search">{svg("search","",16)}
      <input type="search" id="wallSearch" autocomplete="off" data-i18n-attr="placeholder:wall.search|aria-label:wall.search">
    </div>
  </div>

  <div class="wall-grid" id="wallGrid" data-reveal><article class="mem" data-tag="founders"><div class="mem-portrait"><button class="mem-open" type="button" data-open="1" data-i18n-attr="aria-label:mp.open"></button><span class="mem-mono">М</span><img class="mem-photo" src="assets/memory/p1.webp" alt="" loading="lazy" decoding="async" onerror="this.remove()"><button class="mem-candle" type="button" data-candle="1" data-i18n-attr="aria-label:wall.candle">{svg("candle","",12)}<span class="mem-count"></span></button></div><span class="mem-name" data-i18n="wall.p1.n"></span><span class="mem-years" data-i18n="wall.p1.y"></span><span class="mem-desc" data-i18n="wall.p1.d"></span></article><article class="mem" data-tag="founders"><div class="mem-portrait"><button class="mem-open" type="button" data-open="2" data-i18n-attr="aria-label:mp.open"></button><span class="mem-mono">П</span><img class="mem-photo" src="assets/memory/p2.webp" alt="" loading="lazy" decoding="async" onerror="this.remove()"><button class="mem-candle" type="button" data-candle="2" data-i18n-attr="aria-label:wall.candle">{svg("candle","",12)}<span class="mem-count"></span></button></div><span class="mem-name" data-i18n="wall.p2.n"></span><span class="mem-years" data-i18n="wall.p2.y"></span><span class="mem-desc" data-i18n="wall.p2.d"></span></article><article class="mem" data-tag="recent"><div class="mem-portrait"><button class="mem-open" type="button" data-open="3" data-i18n-attr="aria-label:mp.open"></button><span class="mem-mono">А</span><img class="mem-photo" src="assets/memory/p3.webp" alt="" loading="lazy" decoding="async" onerror="this.remove()"><button class="mem-candle" type="button" data-candle="3" data-i18n-attr="aria-label:wall.candle">{svg("candle","",12)}<span class="mem-count"></span></button></div><span class="mem-name" data-i18n="wall.p3.n"></span><span class="mem-years" data-i18n="wall.p3.y"></span><span class="mem-desc" data-i18n="wall.p3.d"></span></article><article class="mem" data-tag=""><div class="mem-portrait"><button class="mem-open" type="button" data-open="4" data-i18n-attr="aria-label:mp.open"></button><span class="mem-mono">И</span><img class="mem-photo" src="assets/memory/p4.webp" alt="" loading="lazy" decoding="async" onerror="this.remove()"><button class="mem-candle" type="button" data-candle="4" data-i18n-attr="aria-label:wall.candle">{svg("candle","",12)}<span class="mem-count"></span></button></div><span class="mem-name" data-i18n="wall.p4.n"></span><span class="mem-years" data-i18n="wall.p4.y"></span><span class="mem-desc" data-i18n="wall.p4.d"></span></article><article class="mem" data-tag="recent"><div class="mem-portrait"><button class="mem-open" type="button" data-open="5" data-i18n-attr="aria-label:mp.open"></button><span class="mem-mono">О</span><img class="mem-photo" src="assets/memory/p5.webp" alt="" loading="lazy" decoding="async" onerror="this.remove()"><button class="mem-candle" type="button" data-candle="5" data-i18n-attr="aria-label:wall.candle">{svg("candle","",12)}<span class="mem-count"></span></button></div><span class="mem-name" data-i18n="wall.p5.n"></span><span class="mem-years" data-i18n="wall.p5.y"></span><span class="mem-desc" data-i18n="wall.p5.d"></span></article><article class="mem" data-tag="founders"><div class="mem-portrait"><button class="mem-open" type="button" data-open="6" data-i18n-attr="aria-label:mp.open"></button><span class="mem-mono">Н</span><img class="mem-photo" src="assets/memory/p6.webp" alt="" loading="lazy" decoding="async" onerror="this.remove()"><button class="mem-candle" type="button" data-candle="6" data-i18n-attr="aria-label:wall.candle">{svg("candle","",12)}<span class="mem-count"></span></button></div><span class="mem-name" data-i18n="wall.p6.n"></span><span class="mem-years" data-i18n="wall.p6.y"></span><span class="mem-desc" data-i18n="wall.p6.d"></span></article><div class="mem"><button class="mem-add" type="button" id="wallAdd">{svg("plus","",26)}
      <b data-i18n="wall.add.h"></b><span data-i18n="wall.add.p"></span></button></div>
  </div>
  <p class="wall-empty" id="wallEmpty" hidden data-i18n="wall.none"></p>

  <div class="sy-foot" data-reveal>
    <a class="btn btn-primary" href="https://saylavy.world" target="_blank" rel="noopener">
      <span data-i18n="sy.cta"></span>{svg("ext","",18)}</a>
    <p class="sy-note">{svg("shield","",15)}<span data-i18n="sy.demo"></span></p>
  </div>

  <div class="sheet" id="profSheet" aria-hidden="true" role="dialog" aria-modal="true">
    <div class="sheet-box">
      <div class="sheet-head">
        <span></span>
        <button class="sheet-close" type="button" data-close data-i18n-attr="aria-label:mp.close">{svg("close","",17)}</button>
      </div>
      <div class="sheet-body">
        <div class="prof-top">
          <div class="prof-portrait" id="profPortrait"></div>
          <div>
            <h3 class="prof-name" id="profName"></h3>
            <p class="prof-years" id="profYears"></p>
            <p class="prof-desc" id="profDesc"></p>
            <div class="prof-stats">
              <span class="prof-stat"><span data-i18n="mp.lit"></span>: <b id="profCandles">0</b></span>
            </div>
            <div class="prof-actions">
              <button class="btn btn-ghost btn-sm" type="button" id="profCandle">
                {svg("candle","",16)}<span data-i18n="mp.candle"></span></button>
            </div>
          </div>
        </div>

        <form class="pray-block" id="prayForm" novalidate>
          <h4><span data-i18n="mp.pray.h"></span><span class="pray-free" data-i18n="mp.free"></span></h4>
          <p data-i18n="mp.pray.p"></p>
          <div class="two">
            <div class="field" id="fPrayWho">
              <label for="prayWho" data-i18n="mp.pray.who"></label>
              <input id="prayWho" type="text" autocomplete="name" data-i18n-attr="placeholder:mp.pray.who.ph">
              <span class="field-err" data-i18n="mp.pray.req"></span>
            </div>
            <div class="field">
              <label for="prayContact" data-i18n="mp.pray.contact"></label>
              <input id="prayContact" type="text" data-i18n-attr="placeholder:mp.pray.contact.ph">
            </div>
          </div>
          <div class="field">
            <label for="prayWords" data-i18n="mp.pray.words"></label>
            <textarea id="prayWords" data-i18n-attr="placeholder:mp.pray.words.ph"></textarea>
          </div>
          <button class="btn btn-primary" type="submit">
            {svg("hands","",17)}<span data-i18n="mp.pray.send"></span></button>
          <p class="ok-note" id="prayOk">{svg("check","",17)}<span data-i18n="mp.pray.done"></span></p>
        </form>
      </div>
    </div>
  </div>

  <div class="sheet" id="createSheet" aria-hidden="true" role="dialog" aria-modal="true">
    <div class="sheet-box">
      <div class="sheet-head">
        <div>
          <h3 style="font-family:var(--display);font-size:1.5rem;font-weight:500" data-i18n="mc.h"></h3>
          <p class="muted" style="font-size:.92rem;margin-top:.3rem" data-i18n="mc.p"></p>
        </div>
        <button class="sheet-close" type="button" data-close data-i18n-attr="aria-label:mp.close">{svg("close","",17)}</button>
      </div>
      <form class="sheet-body" id="createForm" novalidate>
        <div class="field" id="fMcName">
          <label for="mcName" data-i18n="mc.name"></label>
          <input id="mcName" type="text" data-i18n-attr="placeholder:mc.name.ph">
          <span class="field-err" data-i18n="mc.req.name"></span>
        </div>
        <div class="field">
          <label for="mcYears" data-i18n="mc.years"></label>
          <input id="mcYears" type="text" data-i18n-attr="placeholder:mc.years.ph">
        </div>
        <div class="field">
          <label for="mcAbout" data-i18n="mc.about"></label>
          <textarea id="mcAbout" data-i18n-attr="placeholder:mc.about.ph"></textarea>
        </div>
        <div class="two">
          <div class="field" id="fMcBy">
            <label for="mcBy" data-i18n="mc.by"></label>
            <input id="mcBy" type="text" autocomplete="name" data-i18n-attr="placeholder:mc.by.ph">
            <span class="field-err" data-i18n="mc.req.by"></span>
          </div>
          <div class="field">
            <label for="mcContact" data-i18n="mc.contact"></label>
            <input id="mcContact" type="text" data-i18n-attr="placeholder:mc.contact.ph">
          </div>
        </div>
        <p class="pane-note">{svg("check","",15)}<span data-i18n="mc.photo.p"></span></p>
        <div class="form-actions">
          <button class="btn btn-primary" type="submit">{svg("check","",17)}<span data-i18n="mc.send"></span></button>
          <button class="btn btn-ghost" type="button" data-close data-i18n="mc.cancel"></button>
        </div>
        <p class="ok-note" id="createOk">{svg("check","",17)}
          <span><b data-i18n="mc.done.h"></b><br><span data-i18n="mc.done.p"></span></span></p>
        <p class="pane-note">{svg("shield","",15)}<span data-i18n="mc.demo"></span></p>
      </form>
    </div>
  </div>
</div></section>
'''+cta_band()+footer(['wall.js'])

def p_sermons():
    return head("nav.sermons","serm.lead","sermons.html")+header("sermons.html")+\
      page_hero("serm.crumb","serm.eyebrow","serm.h","serm.lead")+f'''
<section class="section-sm"><div class="wrap">
  <div class="stats" style="margin-bottom:3rem" data-reveal-stagger>
    <div class="stat"><div class="stat-n" id="statTotal">-</div>
      <div class="stat-l" data-i18n="serm.stat1"></div></div>
    <div class="stat"><div class="stat-n" id="statPreachers">-</div>
      <div class="stat-l" data-i18n="serm.stat2"></div></div>
    <div class="stat"><div class="stat-n" id="statYears">-</div>
      <div class="stat-l" data-i18n="serm.stat3"></div></div>
  </div>

  <div class="serm-tools" data-reveal>
    <div class="serm-field">
      {svg("search","",17)}
      <input class="serm-input" id="sermSearch" type="search" autocomplete="off"
             data-i18n-attr="placeholder:serm.search|aria-label:serm.search">
    </div>
    <select class="serm-select" id="sermYear" data-i18n-attr="aria-label:serm.year.all"></select>
    <select class="serm-select" id="sermPreacher" data-i18n-attr="aria-label:serm.preacher.all"></select>
  </div>

  <p class="serm-count"><span data-i18n="serm.found"></span> <b id="sermCount">0</b></p>
  <div class="serm-list" id="sermList"></div>
  <div class="serm-empty" id="sermEmpty" hidden>
    <p data-i18n="serm.none"></p>
    <button class="btn btn-ghost btn-sm" id="sermReset" style="margin-top:1rem"
            data-i18n="serm.reset"></button>
  </div>
  <div class="serm-more"><button class="btn btn-ghost" id="sermMore" hidden
      data-i18n="serm.more"></button></div>
</div></section>

<div class="vid" id="vid" aria-hidden="true" role="dialog" aria-modal="true">
  <div class="vid-inner">
    <div class="vid-head">
      <div><h3 id="vidTitle"></h3><p id="vidMeta"></p></div>
      <button class="vid-close" id="vidClose" type="button"
              data-i18n-attr="aria-label:serm.close">{svg("close","",19)}</button>
    </div>
    <div class="vid-frame"><iframe id="vidFrame" src="" title="" allowfullscreen
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"></iframe></div>
    <div class="vid-parts" id="vidParts"></div>
  </div>
</div>
'''+cta_band()+footer(['sermons.js'])

def p_call():
    lens="".join(
      '<button class="opt-btn" type="button" data-len="%s" aria-pressed="%s">'
      '<strong data-i18n="call.len%s"></strong><span data-i18n="call.len%sd"></span></button>'
      % (v,'true' if v=='30' else 'false',v,v) for v in ("15","30","60"))
    whens="".join(
      '<button class="opt-btn" type="button" data-when="%s" aria-pressed="%s">'
      '<strong data-i18n="call.when.%s"></strong><span data-i18n="call.when.%sd"></span></button>'
      % (k,'true' if k=='evening' else 'false',k,k) for k in ("morning","day","evening"))
    gifts=('<button class="gift is-none" type="button" data-gift="0" aria-pressed="true" '
           'data-i18n="call.gift.none"></button>')
    gifts+="".join('<button class="gift" type="button" data-gift="%s" aria-pressed="false">$%s</button>'%(a,a)
                   for a in ("10","20","50","100"))

    return head("nav.call","call.lead","call.html")+header("call.html")+\
      page_hero("call.crumb","call.eyebrow","call.h","call.lead")+f'''
<section class="section-sm"><div class="wrap">

  <div class="free-note" data-reveal>
    <span class="icard-icon">{svg("hands","",20)}</span>
    <div>
      <h3 data-i18n="call.free"></h3>
      <p data-i18n="call.free.p"></p>
    </div>
  </div>

  <form class="steps-form" id="callForm" novalidate data-reveal>
    <div class="step-block">
      <span class="step-lbl"><span data-i18n="call.step1"></span></span>
      <div class="opts" id="callLen">{lens}</div>
    </div>

    <div class="step-block">
      <span class="step-lbl"><span data-i18n="call.step2"></span></span>
      <div class="opts" id="callWhen">{whens}</div>
    </div>

    <div class="step-block">
      <span class="step-lbl"><span data-i18n="call.step3"></span></span>
      <div class="two">
        <div class="field" id="fName">
          <label for="cName" data-i18n="call.name"></label>
          <input id="cName" name="name" type="text" autocomplete="name"
                 data-i18n-attr="placeholder:call.name.ph">
          <span class="field-err" data-i18n="call.req.name"></span>
        </div>
        <div class="field" id="fPhone">
          <label for="cPhone" data-i18n="call.phone"></label>
          <input id="cPhone" name="phone" type="tel" autocomplete="tel"
                 data-i18n-attr="placeholder:call.phone.ph">
          <span class="field-err" data-i18n="call.req.phone"></span>
        </div>
      </div>
      <div class="field" style="margin-top:.9rem">
        <label for="cTopic" data-i18n="call.topic"></label>
        <textarea id="cTopic" name="topic" data-i18n-attr="placeholder:call.topic.ph"></textarea>
      </div>
    </div>

    <div class="step-block">
      <span class="step-lbl">
        <span data-i18n="call.step4"></span>
        <span class="opt" data-i18n="call.step4.opt"></span>
      </span>
      <p class="muted" style="font-size:.92rem" data-i18n="call.gift.p"></p>
      <div class="gift-row" id="callGift">{gifts}</div>
    </div>

    <div class="form-actions">
      <button class="btn btn-primary" type="submit">
        {svg("mail","",18)}<span data-i18n="call.send"></span></button>
      <a class="btn btn-ghost" href="tel:{PHONE_HREF}">
        {svg("phone","",18)}<span data-i18n="call.callnow"></span></a>
    </div>
  </form>

  <div class="sent" id="callSent">
    <span class="icard-icon">{svg("check","",20)}</span>
    <div>
      <h3 data-i18n="call.sent.h"></h3>
      <p data-i18n="call.sent.p"></p>
    </div>
  </div>

  <p class="pane-note" style="margin-top:var(--s-4)">{svg("check","",15)}
    <span data-i18n="call.note"></span></p>

</div></section>
'''+cta_band()+footer(['call.js'])

# ====================================================================== MAIN
PAGES = {
 "index.html":p_index, "about.html":p_about, "beliefs.html":p_beliefs,
 "ministries.html":p_ministries, "camp.html":p_camp, "media.html":p_media,
 "gallery.html":p_gallery, "memory.html":p_memory, "visit.html":p_visit, "call.html":p_call, "give.html":p_give,
}
def stamp_static(name):
    """app.html is hand written, so refresh its asset versions in place."""
    path=_os.path.join(ROOT,name)
    if not _os.path.exists(path): return
    html=open(path,encoding="utf-8").read()
    out=re.sub(r'((?:href|src)=")((?:css|js)/[A-Za-z0-9_.-]+)(?:\?v=[a-f0-9]+)?(")',
               lambda m: m.group(1)+asset(m.group(2))+m.group(3), html)
    if out!=html:
        open(path,"w",encoding="utf-8").write(out)
        print("  %-18s asset versions refreshed"%name)

if __name__=="__main__":
    if SERMONS_READY: PAGES["sermons.html"]=p_sermons
    for name,fn in PAGES.items():
        html=fn()
        with open(os.path.join(ROOT,name),"w",encoding="utf-8") as f:
            f.write(html)
        print("  %-18s %6.1f KB"%(name,len(html.encode())/1024))
    stamp_static("app.html")
    print("built %d pages"%len(PAGES))
