# Power of the Cross Church - Toronto

Website for Церковь «Сила Креста» / Power of the Cross Church, a Russian-speaking
Christian church in Toronto. Static site, no build step required to deploy.

**Live:** https://eugenazxa.github.io/powerofthecrosschurch/

---

## What is here

| Page | File | Content |
|---|---|---|
| Home | `index.html` | Hero, service times, welcome, ministries, camp, gallery preview |
| About | `about.html` | Who we are, preaching and growth |
| What We Believe | `beliefs.html` | All 17 articles of faith with scripture references |
| Ministries | `ministries.html` | Six ministries plus Sunday School |
| Camp | `camp.html` | Druzhba children's camp, program and packing list |
| Media | `media.html` | Live stream, YouTube, Facebook, gallery links |
| Gallery | `gallery.html` | 20 photos with lightbox |
| Visit | `visit.html` | Address, phone, schedule, map, first-visit guide |
| Give | `give.html` | INTERAC e-Transfer instructions |

All page text comes from the church's own content on pocc.ca. Photographs are the
church's own, pulled from the previous site's gallery and re-encoded as WebP.

## Bilingual

Every page is fully Russian and English. Russian is the default; English is opt-in
through the RU/EN toggle in the header, and the choice persists in `localStorage`.
You can also force a language with `?lang=en` or `?lang=ru`.

**All copy lives in one file: `js/i18n.js`.** It holds two dictionaries (`ru` and
`en`) with matching keys. To change wording anywhere on the site, edit the value in
both dictionaries - do not edit text inside the HTML.

```js
"visit.addr.v":"255 Wildcat Rd, Toronto, ON M3J 2S3",
```

In the HTML, text is bound by key:

```html
<span data-i18n="visit.addr.v"></span>       <!-- plain text -->
<span data-i18n-html="visit.times.v"></span> <!-- allows <br> -->
<button data-i18n-attr="aria-label:nav.menu"></button>
```

## Editing

**Text** - edit `js/i18n.js` only. Keep the `ru` and `en` dictionaries in sync; the
site falls back to Russian if an English key is missing.

**Structure or layout** - the nine HTML files are generated from shared partials so
the header, footer and metadata stay identical everywhere. Edit `tools/build.py`
and regenerate:

```bash
python3 tools/build.py
```

This overwrites the `.html` files in the repo root. If you would rather hand-edit
the HTML directly, that works too - just stop running the build script, or your
edits will be overwritten.

**Photos** - drop new images in `assets/img/`. Gallery entries are listed in the
`GALLERY` array in `tools/build.py`, each paired with a caption key from `i18n.js`.
Images are served as WebP at two widths (`-560` / `-1100` for gallery,
`-600` / `-900` for cards, `-760` / `-1100` / `-1600` for the hero).

## Loading screen

On the first view of a session a luminous cross draws itself over a black veil,
blooms, and then opens as a mask - the page is revealed *through* the cross shape
as it expands past the edges of the screen. Later views in the same session, and
navigation between pages, use a short wipe in the same language: the cross closes
over the page you are leaving and opens again on the page you land on.

It is built from an SVG mask (`.lm-cross` punched out of a full-screen rect) driven
by CSS keyframes, so there is no animation library. Three things keep it safe:

- The CSS animation ends in a cleared state with `fill-mode: forwards`, so the veil
  lifts itself even if JavaScript never runs.
- A critical rule is inlined in `<head>` so the veil covers the page even if
  `style.css` is still in flight and can never flash unstyled.
- `prefers-reduced-motion: reduce` skips the loader entirely.

Timings live at the bottom of `css/style.css`. The sequence is roughly: draw
0.18-1.35s, bloom 1.26s, mask opens 1.62-2.86s.

## Design

- Deep midnight base (`#05080F`) with the sanctuary's blue neon cross as the accent
  (`#5AA9FF`), and a warm gold for calls to action (`#E8C07D`).
- Display type is Cormorant Garamond, body type is Inter - both have full Cyrillic.
- Every text/background pair used on the site meets WCAG AA (4.5:1 or better).
- Motion respects `prefers-reduced-motion`.
- Tokens live at the top of `css/style.css` as CSS custom properties.

## Local preview

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deployment

GitHub Pages serves the `main` branch from the repository root. Pushing to `main`
publishes the site; there is no build step on the server.

## Church details

- 255 Wildcat Rd, Toronto, ON M3J 2S3
- 416-858-9317
- Sunday worship 11:00, home groups Wednesday 19:30, prayer Friday 19:30
- YouTube: https://www.youtube.com/channel/UCHgwxXYXpZgW1Gz1Y6uOVHQ
- Facebook: https://www.facebook.com/powerofthecrossofficial

## Open item

The **e-Transfer email address** for donations is not in this repo. On the old site
it was obfuscated against scrapers and could not be read. `give.html` currently
directs people to phone the church for it. Once you have the address, set
`give.email.k` / `give.protect` in `js/i18n.js`, or add the address directly to the
Give page.
