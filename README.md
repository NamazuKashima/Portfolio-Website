# Victor Qixun Wu — Portfolio

Personal portfolio site for a colorist and editor based in Montreal, QC.
Static site, no build step, no dependencies — deployed on GitHub Pages at
**[www.victorqixunwu.com](https://www.victorqixunwu.com)**.

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
├── editor.html             Visual content editor (noindex, not linked publicly)
├── CNAME                   Custom domain for GitHub Pages
├── robots.txt              Keeps the editor out of search results
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
│   ├── render.js           Renders data into the homepage
│   └── main.js             Cursor, wordmark split, nav, scroll reveals
└── .github/workflows/
    └── cache-bust.yml      Auto-versions css/js on every push
```

---

## Editing content

### Using the editor (recommended)

1. Open `editor.html` in a browser.
2. Edit any section from the sidebar — General, Hero, About, Portfolio, Experience, Contact, Logo & Footer, Theme.
3. Changes auto-save to browser storage as you type.
4. Click **↓ Export** when done. Several files download:
   - `data.js` — replace `js/data.js` with it
   - any newly uploaded image or PDF, as a real file
   - `EXPORT-README.txt` — says exactly where each file goes, and which
     old files are no longer referenced and can be deleted
5. Commit and push.

Images are stored as files under `assets/`, never inside `data.js`. While
drafting they live in browser storage as base64; export converts them. A file
is only written when its image was newly uploaded — covers already on disk keep
their filename even if you rename the work, so nothing breaks.

Deleting a work does **not** delete its image: a web page cannot remove files
from your disk. `EXPORT-README.txt` lists those orphans so you can delete them
by hand.

> The editor loads content in this order: browser draft → `js/data.js` → built-in
> defaults. If a draft is ever lost (new browser, cleared cache, moved folder),
> use **↑ Import** to load a `data.js` file back in.

### Editor features

- **Collections** — Portfolio is organized into Film and Commercial; both can be renamed, added to, or removed
- **Works** — add, duplicate, reorder, delete; each has a title, year, role, description, tags, cover image, and links
- **Image handling** — uploads are auto-compressed (max 2400px), then cropped to 16:9 (covers) or 4:5 (profile photo) with drag-to-pan and zoom; on export they become files in `assets/`
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

Dark and editorial. Every colour is an authentic 日本の伝統色 (traditional
Japanese colour) used at its documented hex — nothing is mixed or approximated.
They live as CSS custom properties in `css/style.css` and are overridden at
runtime by `theme` in `data.js`, so the Theme panel in the editor restyles the
whole site without touching code.

```css
--bg:      #000a02;   /* 墨色   SUMI       ink */
--surface: #0c0c0c;   /* 呂色   ROIRO      wet black lacquer */
--border:  #373c38;   /* 藍墨茶 AISUMICHA  indigo-ink tea */
--fg:      #fcfaf2;   /* 白練   SHIRONERI  glossed white silk */
--accent:  #3f7735;   /* 松葉色 MATSUBA    pine needle */
--muted:   #bcb09c;   /* 灰汁色 AKU        lye */
```

**Type** — [Inter Tight](https://fonts.google.com/specimen/Inter+Tight) for the
wordmark and headings, [Zen Kaku Gothic New](https://fonts.google.com/specimen/Zen+Kaku+Gothic+New)
for body. Both fall back to system Japanese faces if the CDN is unreachable.

**The wordmark** — the name is set larger than the window that frames it, so it
is cropped on all four sides, and drawn four times: once per R/G/B channel plus
a white base, blended with `mix-blend-mode: screen`. The channels drift with the
pointer, breathe when it is still, and separate further as you scroll (capped at
1.5×). For a colorist, misregistration is the subject. Geometry is driven by
three variables on `.hero-title`: `--over` (how far the word overruns the frame),
`--frame` (window height) and `--lift` (vertical trim).

**Details** — custom dot-and-ring cursor, a faint 和紙 paper grain over the whole
page (`--washi-opacity`, editable), scroll-triggered reveals, 16:9 covers with
hover overlays. Fully responsive; on touch devices the custom cursor and hover
overlays are disabled and the wordmark stops animating.

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

Google Analytics 4 (`gtag.js`, measurement ID `G-WLB1P3EN65`) is loaded on
`index.html` and `works.html` only — not on `editor.html`, since that's a
private tool and its own edits shouldn't skew traffic numbers. View data at
[analytics.google.com](https://analytics.google.com).

---

## Notes

- No build tooling, no package manager, no framework — open the HTML files directly and they work
- The contact section links out (email, phone, socials); there is no form, so there's no backend to maintain
- `editor.html` ships with the site but isn't linked from anywhere public
