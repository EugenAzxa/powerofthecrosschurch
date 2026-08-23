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
| Legacy | `memory.html` | What the church preserves, its archive, interactive learning |
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

On the first view of a session two hands reach in from either side and draw
themselves in luminous line, a cross draws in the gap their fingertips leave, and
the cross then blooms and opens as a mask - the page is revealed *through* the cross shape
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

The full sequence plays once per browser session, tracked in `sessionStorage`
under `pocc-seen`. **To replay it, add `?intro` to the URL** - for example
`index.html?intro` - or open the site in a new tab.

Timings live at the bottom of `css/style.css`. The sequence is roughly: draw
0.18-1.35s, bloom 1.26s, mask opens 1.62-2.86s.

## Design

The site is light and open. Only three things stay dark: the loader, the home
hero, and the footer. Everything else - inner page heroes, scripture bands, the
closing CTA - is light, and the dark that remains is a deep blue night
(`#0B1834`) rather than black.

- **Light (default)** - page `#F6F8FC`, white cards, ink `#0D1626`, blue `#1256B8`.
  Photographs render at full brightness.
- **Dark** - applied by putting `dark-zone` on a section.

`dark-zone` redefines the *same* custom property names (`--text`, `--surface`,
`--line`, `--blue`, `--on-blue`...), so every component works unchanged in either
context - there is no second set of component styles. To flip any section, add or
remove the one class.

The header is light by default. A page that declares `has-dark-hero` on `<body>`
(only the home page) gets a header with dark tokens until it sticks, at which
point it becomes a light glass bar.

Other notes:

- Display type is Cormorant Garamond, body type is Inter - both have full Cyrillic.
- Every text/background pair on every page meets WCAG AA, verified by measuring
  the rendered colours in a browser rather than by reading the tokens.
- Motion respects `prefers-reduced-motion`.
- Tokens live at the top of `css/style.css`.

## Legacy page

`memory.html` carries the "faith preserved in memory" idea: what the congregation
keeps (sermons, testimonies, its record since 2012, and knowledge of the faith),
the archive itself, and an interactive learning page prepared with
[Saylavy](https://saylavy.world) - Bible stories and verses spoken aloud, reachable
from a QR code in the hall, with every word approved by the church's pastor.

Note the framing: this describes what the church offers its own people. It is
deliberately not written as a sales pitch, and carries no pricing or
subscription language.

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

## Giving

The Give page offers two methods side by side: card payment and INTERAC
e-Transfer. Both are driven by **`js/config.js`** - edit that one file and reload,
no build step:

```js
window.POCC_CONFIG = {
  payLinks: { "25":"", "50":"", "100":"", "250":"", "other":"" },
  etransferEmail: ""
};
```

- **Card giving** is provider-agnostic. Create one payment link per amount with
  whatever processor the church uses - Stripe Payment Links, PayPal, Donorbox,
  tithe.ly, CanadaHelps - and paste the URLs in. Amounts differ in how each
  processor expresses them, so each chip simply carries its own link and none of
  that has to be encoded here.
- **While every link is empty the card panel does not render at all**, and the
  page shows e-Transfer only. The site can never go live with a Give button that
  leads nowhere.
- `etransferEmail` fills the e-Transfer address. Left empty, the page asks people
  to phone the church for it instead.

## Open item

Two values are still needed from the church, both set in `js/config.js`:

1. **The INTERAC e-Transfer address.** On the old site it was obfuscated against
   scrapers and could not be read. Until it is set, the Give page asks people to
   phone for it.
2. **Payment links**, if the church wants card giving. This needs an account with
   a payment processor - the page is built and waiting for the URLs.
