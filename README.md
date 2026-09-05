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
| `index.html` | Homepage — hero, about, selected work, experience, contact |
| `works.html` | Full project archive with filtering and detail modals |
| `editor.html` | Visual content editor (local tool, not linked publicly) |

---

## Project structure

```
.
├── index.html              Homepage
├── works.html              Project archive
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
│   ├── portfolio.js        Shared work cards / archive rows / detail panel / hover preview
│   ├── render.js           Renders data into the homepage
│   ├── seo.js               Injects Person JSON-LD (schema.org) from data.js
│   └── main.js             Motion engine — loader, Lenis, cursor, reveals, theme morph, transitions
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

## Design

**Japanese traditional palette.** The editorial grid keeps the v3 layout,
but the palette is the original 日本の伝統色 set — near-black
sumi (`#000a02`) and glossed-silk shironeri (`#fcfaf2`), with a single
chroma, matsuba pine (`#4a593d`), reserved for hover states, rules and
small accents. One ground throughout — no per-section theme tweening.

**Type** — [Libre Caslon Display](https://fonts.google.com/specimen/Libre+Caslon+Display)
for headlines and other display text (`--font-serif`), [Zen Kaku Gothic New]
(https://fonts.google.com/specimen/Zen+Kaku+Gothic+New) for body and every
piece of metadata — years, roles, tags, indexes, the timecode clock. No mono
face. Libre Caslon Display ships one weight and no italic, so emphasized
words (`<em>` inside headlines, `.hero-word`, `.notfound-mark`) are set
upright in walnut brown (`--emphasis`, `#7c5c3e`) rather than faked-italic.

**Layout** — a full-width 12-column grid (`--gutter`, `--col-gap`). The hero
name is set in caps at ~29vw so it runs edge to edge and overlaps the lead
image; Selected Work is an asymmetric editorial grid (7/12 + 4/12 offset,
then 4/12 + 7/12) rather than a uniform card wall; skills and experience are
hairline index rows.

Big nameplate text sized this way (`#hero-line1`, `#footer-name`,
`.notfound-mark`) is re-measured in `js/main.js` after render and again once
webfonts finish loading: if the actual rendered text is wider than its box
(a font swap, an uppercase transform, or a narrow viewport can all do that
to a `clamp(…vw…)` value tuned for one typeface), its font-size is scaled
down to fit rather than letting `overflow: hidden` clip it. Re-checked on
resize.

**Hero image** — a single frame, cycling through the lead work of each
collection every ~5 s with a crossfade. (An earlier draft faked a Log vs.
Rec.709 compare slider over these covers — removed, since there are no
actual Log-footage screenshots to back it.)

**Motion** (`js/main.js`, GSAP + ScrollTrigger + Lenis)
- Loader on the first homepage visit of a session (name, 0→100 counter,
  spectrum bar), then a curtain; internal links marked `data-transition`
  reuse the same veil as a page transition.
- Lenis smooth scroll, synced to ScrollTrigger; anchors scroll through it.
- Headlines split into lines that rise from a mask (`data-split="lines"`);
  the bio's first paragraph brightens word by word as you read
  (`data-split="words"`); images clip-reveal with a settle; work covers
  parallax inside their frames; rows stagger in.
- Custom cursor: a dot that inverts over whatever it crosses, and a
  pine-colored label ("Open", "Play") on interactive targets.
  Magnetic buttons (`data-magnetic`). Ticker of every project title whose
  speed follows scroll velocity. Detail panel slides in from the right with
  prev/next through the current list (← → keys, Esc to close).
- `prefers-reduced-motion`, touch devices and a failed CDN all fall back to
  a fully visible static page — every "hidden until revealed" state lives
  under `html.js.has-motion` in the CSS and is only applied once GSAP is
  confirmed present.

**Archive** (`works.html`) — All / Commercial / Film filters, Grid or List
view (List shows a floating cover preview that follows the cursor; the
choice is remembered), and the same detail panel as the homepage.

> **Theme panel in the editor.** The v3 design defines its own palette in
> `css/style.css` and no longer reads the `theme` block of `data.js`;
> editing colours in the editor's Theme panel only affects `resume.html`,
> which still applies those tokens itself. Everything else in the editor —
> hero copy, bio, skills, languages, works, experience, contact, logo and
> footer — renders exactly as before.

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

**Cloudflare Web Analytics** runs on `index.html`, `works.html`, and `404.html`
— not on `editor.html` or `resume.html`, since those are private tools and
their own edits/generations shouldn't skew traffic numbers. A ~1 line beacon
script, no cookies, no DNS change required. View data at
[dash.cloudflare.com](https://dash.cloudflare.com) → Web Analytics.

---

## SEO

`js/seo.js` builds a schema.org `Person` JSON-LD block straight from
`data.js` (name, job title, photo, bio, address, contact, skills as
`knowsAbout`, school as `alumniOf`) and injects it into `<head>` on
`index.html` and `works.html`. Same principle as `render.js` — generated
from the live data, so it can't drift out of sync with what's on the page.
`404.html` is marked `noindex` and doesn't get this block; there's nothing
to index there.

---

## Notes

- No build tooling, no package manager, no framework — open the HTML files directly and they work (the motion layer needs GSAP/Lenis from the CDN; without network you get the static fallback)
- The contact section links out (email, phone, socials); there is no form, so there's no backend to maintain
- `editor.html` ships with the site but isn't linked from anywhere public
