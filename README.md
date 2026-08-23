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
| Sermons | `sermons.html` | Searchable archive of 548 recorded services |
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

## Mobile demo and QR code

The home page ends with a live preview of the site running in a phone frame,
beside a code you can scan to open it on a real device.

The preview is a real `<iframe>` of the site itself, not a picture, loaded with
`?embed=1`. That flag is read before first paint and puts `is-embed` on the root
element, which hides the loader and the demo section itself so there is never a
demo inside the demo. It only loads once scrolled near, and reloads in whichever
language the visitor is reading.

The code is generated at runtime by `js/qr.js` from `location.href`, so it always
points at wherever the site is actually served from - localhost, GitHub Pages or a
custom domain - with nothing to regenerate when the address changes. It can be
printed and put up in the hall.

`js/qr.js` is a small from-scratch encoder (byte mode, ECC level M, versions
1-10). It was verified by rendering codes for URLs of different lengths and
decoding them back with the macOS Vision barcode reader, including a decode of
the QR as actually rendered on the page.

## Nations

The hall on Wildcat Road has flags hanging from the ceiling, one for each
country the congregation came from. The home page carries them as a row of
chips between the welcome and the scripture band.

The flag artwork is real SVG in `assets/flags/`, taken from flagcdn (national
flags are not copyrightable). It is deliberately not drawn by hand and
deliberately not emoji: several of these - Kyrgyzstan, Kazakhstan, South Korea,
DR Congo - have detail that a hand-drawn version would get wrong.

The list lives in `NAT` in `tools/build.py`, paired with `nat.*` keys in
`js/i18n.js`. To add a country: drop its two-letter SVG in `assets/flags/`, add
the pair to `NAT`, and add the name to both dictionaries.

## Invitation film

The home page carries the church's own invitation film - the pastor speaking to
camera, with the address on screen - directly under the service times.

The poster is a local WebP cropped from the video's own frame, so **nothing is
requested from YouTube until someone chooses to watch**. Selecting play swaps in
a `youtube-nocookie` iframe in place. The video id is on the markup as
`data-video`, so swapping the film is a one-line change in `tools/build.py`.

## Sermon archive

`sermons.html` holds **548 services from 2014 to 2026, by 34 preachers**, searchable by title and
preacher and filterable by year and preacher. Selecting one opens the recording
in a modal; services with more than one message get numbered part buttons.

The data lives in **`assets/data/sermons.json`**, scraped from the church's own
archive on the old site. Each entry is:

```json
{"d":"2026-07-26",
 "i":[{"t":"Во Что Вы Вкладываете Свою Жизнь?","p":"Валерий Наривончик"}],
 "v":["_AJbAgLiihk"]}
```

`d` is the date, `i` the messages preached that service (title and preacher),
`v` the YouTube ids. Entries with no recording are left out, so nothing on the
page is unplayable.

**The page and its nav entry only exist when `assets/data/sermons.json` is
present** (`SERMONS_READY` in `tools/build.py`), so the site never links to an
empty archive. Add the data file and rebuild and the page, the nav entry, the
footer link and the home teaser all appear.

To add a new sermon, append an object to `sermons` and bump `count`. Nothing
needs rebuilding - `js/sermons.js` reads the file at runtime, and the year and
preacher filters are derived from the data, so a new preacher appears in the
filter automatically. If the file is missing or fails to load, the page shows
its empty state rather than breaking.

Videos are embedded through `youtube-nocookie.com`, and the iframe `src` is
cleared on close so audio stops.

## Legacy page

`memory.html` carries the "faith preserved in memory" idea: what the congregation
keeps (sermons, testimonies, its record since 2012, and knowledge of the faith),
the archive itself, and an interactive learning page prepared with
[Saylavy](https://saylavy.world) - Bible stories and verses spoken aloud, reachable
from a QR code in the hall, with every word approved by the church's pastor.

Note the framing: this describes what the church offers its own people. It is
deliberately not written as a sales pitch, and carries no pricing or
subscription language.

## Cloth scripture banner

The scripture bands hang as fabric that ripples in the wind, and brushing them
with the cursor sends a wave across the cloth. `js/cloth.js`, mounted from
`initCloth()` in `js/main.js`.

This is a from-scratch vanilla WebGL implementation, inspired by
[canvasui.dev](https://canvasui.dev/docs/components/cloth) but deliberately not
using it, for two reasons:

1. That component renders **live DOM** through the experimental `html-in-canvas`
   API, which needs Chrome with `chrome://flags/#canvas-draw-element` enabled or
   a registered origin trial. Safari, Firefox and every iPhone show nothing.
   Most of this congregation would never see the effect.
2. It ships for React, Vue, Solid, Preact and Svelte. This site is static HTML
   with no build step.

Instead the verse is painted onto a 2D canvas - panel, cross, text and reference,
read from the live DOM so it always matches the current language and styles - and
that canvas is used as the texture. Same look, works in every browser, no
dependency.

Displacement, normals, lighting and the cursor ripple are computed in the vertex
and fragment shaders. The banner is pinned along its top edge. Options are passed
where the cloth is constructed in `initCloth()`: `wind`, `speed`, `amplitude`,
`brush`, `light`, `sheen`.

It degrades quietly. No WebGL, no `Cloth` class, or `prefers-reduced-motion:
reduce` and the original markup is simply left visible and untouched - the source
verse always stays in the DOM for screen readers. Animation only runs while the
band is on screen.

## Local preview

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Domain

The church already owns **pocc.ca** - registered in 2011, active, DNS at
HostPapa - and it currently serves the old Joomla site. That is the right
address for this site to end up on; there is no need for a new domain.

Until then the site is configured for its GitHub Pages address. To move it:

```sh
sh tools/set-domain.sh https://pocc.ca/
```

That rewrites the canonical and Open Graph addresses, `sitemap.xml` and
`robots.txt`, rebuilds the pages, and writes the `CNAME` file GitHub Pages needs.
It then prints the DNS records to set. The QR code and the mobile preview need no
change at all - both read `location.href` at runtime, so they follow the site
wherever it is served from.

**Note that this is a cutover, not an addition.** Pointing pocc.ca at GitHub
Pages replaces the live site the congregation currently uses, so it wants the
church's agreement and a moment when someone can check the result.

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
