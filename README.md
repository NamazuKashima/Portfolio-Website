# Victor Qixun Wu — Portfolio

Personal portfolio site for a colorist and editor based in Vancouver, BC.
Static site, no build step — deployed on GitHub Pages at
**[www.victorqixunwu.com](https://www.victorqixunwu.com)**. The only runtime
dependencies are GSAP + ScrollTrigger and Lenis, loaded from a CDN for the
motion layer; the page still renders fully (static, no animation) if they
fail to load.

---

## Overview

The site is data-driven: all content lives in a single file (`js/data.js`), and a
browser-based visual editor (`editor.html`) is included for editing it without touching code.

| Page | Purpose |
|---|---|
| `index.html` | Homepage — hero, **I · Film**, **II · Commercial**, about, experience, contact |
| `film.html` | Every film as a full "screening" (frame, measured palette + vectorscope, notes) |
| `commercial.html` | Every commercial project as a lookbook, with notes under each frame |
| `works.html` | Index — every project on one line, grouped by collection, hover preview |
| `editor.html` | Visual content editor (local tool, not linked publicly) |

---

## Project structure

```
.
├── index.html              Homepage
├── film.html               I · Film — every film as a screening
├── commercial.html         II · Commercial — every other collection as a lookbook
├── works.html              Index of all work (kept at its old URL)
├── resume.html             Résumé generator/customizer (noindex, not linked publicly)
├── editor.html             Visual content editor (noindex, not linked publicly)
├── 404.html                Custom not-found page
├── CNAME                   Custom domain for GitHub Pages
├── robots.txt              Keeps the editor + résumé generator out of search results
├── sitemap.xml
├── assets/
│   ├── works/              Project covers, one file per work
│   ├── portrait.jpg
│   ├── og.jpg              Social-share card (1200×630)
│   └── doc/                CV
├── css/
│   └── style.css           All styles — design tokens live in :root
├── js/
│   ├── data.js             ← All site content (paths only, ~24 KB)
│   ├── readings.js         Vectorscope + palette, measured from each cover image's pixels
│   ├── portfolio.js        Shared templates (screening, credit, look, row), detail panel, frame viewer
│   ├── render.js           Renders data into the homepage
│   ├── archive.js          Renders film.html, commercial.html and works.html
│   ├── seo.js              Injects Person JSON-LD (schema.org) from data.js
│   └── main.js             Motion engine — title cards, Lenis, cursor, projector-masking reveals
└── .github/workflows/
    └── cache-bust.yml      Auto-versions css/js on every push
```

---

## Editing content

### Using the editor (recommended)

1. Open `editor.html` in Chrome or Edge.
2. Click **🔗 Connect Folder** once and pick your `Portfolio-Website` folder.
   The browser remembers this permission, so you normally only do it the
   first time (it may ask you to reconnect after a full browser restart —
   click the same button again, no folder-picking needed).
3. Edit any section from the sidebar — General, Hero, About, Portfolio, Experience, Contact, Logo & Footer, Theme.
4. That's it. About 1.5 seconds after you stop typing, or right away when you
   click **💾 Save to Folder**, the editor writes `js/data.js` straight to
   disk — and any image you just uploaded is compressed, cropped, and saved
   as a real file under `assets/` at the same time. No download, no manual
   drag-and-drop into the folder.
5. Commit and push.

Firefox and Safari don't support direct folder access yet — the toolbar
falls back to the old flow there: **↓ Export** downloads `data.js` plus any
new image/PDF files individually, with an `EXPORT-README.txt` telling you
where each one goes.

Deleting a work does not automatically delete its old cover image — when you
click **💾 Save to Folder** and unused files exist, the editor lists them and
asks before deleting anything from disk.

> The editor loads content in this order: `js/data.js` on disk → browser draft
> (only if there's no file to read at all) → built-in defaults. Disk always
> wins, so a leftover draft from a previous session can never shadow real
> content — and once a folder is connected, the editor re-reads `js/data.js`
> straight from that folder on every open, bypassing the browser entirely. If
> you ever need to load a `data.js` file manually, use **↑ Import**.

### Editor features

- **Collections** — Portfolio is organized into Film and Commercial; both can be renamed, added to, or removed
- **Works** — add, duplicate, reorder, delete; each has a title, year, role, description, tags, cover image, and links
- **Image handling** — uploads are auto-compressed (max 2400px), then cropped to 16:9 (covers) or 4:5 (profile photo) with drag-to-pan and zoom; once connected to your folder, they're written to `assets/` immediately
- **Showreel** — set a Vimeo/YouTube URL under Hero to show a play button on the homepage; leave empty to hide it

### Editing by hand

`js/data.js` is a plain object. Editing it directly works fine — just keep the
shape intact:

```js
{
  theme:      { bg, surface, border, fg, muted, gray, accent, accentSoft,
                earth, sand, washiOpacity },
  meta:       { name, siteTitle },
  hero:       { label, line1, line2, description, reelUrl, reelLabel },
              // line1 = the large channel-split wordmark, line2 = signature
  about:      { photo, bio: [...], skills: [{ category, items: [...] }],
                cvUrl, cvLabel, cvFileName },
  portfolio:  [{ id, name, works: [{ id, title, year, role,
                                     description, tags, coverImage, links }] }],
  experience: [{ id, period, title, company, description, tags }],
  contact:    { email, phone, website, instagram, facebook, location, message },
  footer:     { logo, copyright }
}
```

---

## Deploying

Push to `main`. GitHub Pages redeploys automatically, usually within 1–2 minutes.

A GitHub Action (`cache-bust.yml`) runs on every push and rewrites the `?v=`
query strings on all CSS/JS links, so returning visitors always get the newest
files instead of a cached copy — no hard refresh needed on their end.

Only `css/` and `js/` are versioned this way — images under `assets/` are
served with their own filenames and cached normally.

---

## Design — v4 「暗室」

**Concept.** The grading suite at night: the frame is the only light in the
room, and everything around it stays quiet and measured. The work is split
into two chapters with two different visual registers:

| | I · Film | II · Commercial |
|---|---|---|
| Layout | one wide frame per film, year + tags in the margin, title card under it | asymmetric lookbook grid (8+4 / 4+4+4) |
| Type | condensed serif titles, credits in true italic | editorial captions in the sans |
| Motion | frames open like projector masking: a slit → 2.39 scope → full frame | frames simply cut in |
| Readings | palette strip + small vectorscope beside every frame | in the detail panel |

**Which collection is "film".** The collection whose id is `film` (or whose
name contains film / cinema / narrative). Every other collection — Commercial
today, anything added in the editor later — is shown in the commercial
register, as its own chapter (II, III …) on the homepage and as a group on
`commercial.html`.

**Palette** — unchanged 日本の伝統色: 墨 sumi `#000a02` ground, 白練
shironeri `#fcfaf2` type, 灰汁 aku / 青白橡 for secondary text, 藍墨茶
hairlines, 松葉 matsuba `#4a593d` and 老竹 oitake `#769164` as the only
chroma. The footer colophon shows the six colours with their names.

**Type** — [Noto Serif Display](https://fonts.google.com/specimen/Noto+Serif+Display)
(variable width: condensed 62.5% for titles, 87.5% italic for credits/roles),
[Zen Kaku Gothic New](https://fonts.google.com/specimen/Zen+Kaku+Gothic+New)
for text and interface, a tiny Shippori Mincho subset for the kanji in the
colophon. No all-caps tracked labels, no pill tags — tags are plain words
separated by slashes.

**Frames are never altered.** No gradient overlays, filters, tints or
brightness changes on any image, in any state. Frames are shown whole —
letterboxed/pillarboxed on monitor black (`--screen: #000`) when their ratio
isn't 16:9 — except the commercial lookbook, which crops to 16:9 like a
magazine layout.

**Readings (`js/readings.js`).** The hero vectorscope, the palette strips and
the small scopes are computed in the browser from each cover image's own
pixels (Rec.709 coefficients, 2× zoom, skin-tone line in 老竹). They are
measurements, not illustrations: a black-and-white frame (Foosball Fever,
Prada) really collapses to a point. The hero scope morphs sample-for-sample
from one frame's reading to the next. Browsers only allow this when the page
is served over http(s) — opened straight from disk (`file://`) the scopes
show an empty graticule. To preview locally with the readings, run
`python -m http.server` in the folder and open http://localhost:8000.

**Hero.** A frame and its vectorscope side by side, role and notes under the
circle, the name as a title card along the bottom; every size is derived from
the viewport height so the whole composition lands on the first screen
(checked at 1024×768, 1280×800, 1366×768, 1440×900, 1536×864, 1920×1080).
Each visit opens on a different frame, picked from the first four hero frames
that carry colour.

**Motion** (`js/main.js`, GSAP + ScrollTrigger + Lenis) — spent in a few places:
- the opening: a title card ("Victor Qixun Wu", first visit of a session),
  then the hero frame opens like projector masking while its scope blooms out
  of the centre and the name rises;
- page transitions: the curtain drops with the destination's title card,
  which stays up across the page load and lifts on the new page;
- film frames open with the same masking when they first come on screen;
  chapter titles rise from a mask;
- everything else answers an action: detail panel (←/→, Esc), full-screen
  frame viewer on `film.html`, the "More films" screen that follows the
  credit you point at, the index preview, the menu.
- `prefers-reduced-motion`, touch devices and a failed CDN all fall back to a
  complete static page — every hidden state lives under `html.js.has-motion`.
  A CSS failsafe also clears the veil after 4.5 s if `main.js` never runs.

**resume.html** shares `css/style.css`. Its tokens (`--border`, `--muted`,
`--gray`, `--accent-soft`, `--earth`, `--sand`, `--font-display`, `--w`, `--t`)
and the base rules it relies on (`body` metrics, `.nav-logo`, `.footer-logo`)
are kept exactly as v3 had them, so it renders identically.

> **Theme panel in the editor.** Like v3, the site defines its own palette in
> `css/style.css` and does not read the `theme` block of `data.js`; editing
> colours in the editor's Theme panel only affects `resume.html`. Everything
> else in the editor — hero copy, bio, skills, languages, works, experience,
> contact, logo and footer — renders exactly as before.

---

## Hosting & DNS

- **Host** — GitHub Pages, `main` branch, root directory
- **Domain** — `www.victorqixunwu.com` (set via `CNAME`)
- **HTTPS** — GitHub-issued certificate, enforced

DNS records required:

```
CNAME  www   →  namazukashima.github.io
A      @     →  185.199.108.153, 185.199.109.153,
                185.199.110.153, 185.199.111.153
AAAA   @     →  2606:50c0:8000::153, 2606:50c0:8001::153,
                2606:50c0:8002::153, 2606:50c0:8003::153
```

> If DNS sits behind Cloudflare, keep these records **DNS only** (grey cloud).
> Proxying them conflicts with GitHub's certificate and can cause redirect loops.

---

## Analytics

**Cloudflare Web Analytics** runs on `index.html`, `film.html`, `commercial.html`, `works.html` and `404.html`
— not on `editor.html` or `resume.html`, since those are private tools and
their own edits/generations shouldn't skew traffic numbers. A ~1 line beacon
script, no cookies, no DNS change required. View data at
[dash.cloudflare.com](https://dash.cloudflare.com) → Web Analytics.

---

## SEO

`js/seo.js` builds a schema.org `Person` JSON-LD block straight from
`data.js` (name, job title, photo, bio, address, contact, skills as
`knowsAbout`, school as `alumniOf`) and injects it into `<head>` on
`index.html`, `film.html`, `commercial.html` and `works.html`. Same principle as `render.js` — generated
from the live data, so it can't drift out of sync with what's on the page.
`404.html` is marked `noindex` and doesn't get this block; there's nothing
to index there.

---

## Notes

- No build tooling, no package manager, no framework — open the HTML files directly and they work (the motion layer needs GSAP/Lenis from the CDN; without network you get the static fallback)
- The contact section links out (email, phone, socials); there is no form, so there's no backend to maintain
- `editor.html` ships with the site but isn't linked from anywhere public
