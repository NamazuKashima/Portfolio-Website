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
├── editor.html             Visual content editor
├── CNAME                   Custom domain for GitHub Pages
├── deploy.bat              Manual deploy helper (Windows)
├── css/
│   └── style.css           All styles — design tokens live in :root
├── js/
│   ├── data.js             ← All site content (single source of truth)
│   ├── render.js           Renders data into the homepage
│   └── main.js             Cursor, nav, scroll reveals, parallax
└── .github/workflows/
    └── cache-bust.yml      Auto-versions assets on every push
```

---

## Editing content

### Using the editor (recommended)

1. Open `editor.html` in a browser.
2. Edit any section from the sidebar — General, Hero, About, Portfolio, Experience, Contact.
3. Changes auto-save to browser storage as you type.
4. Click **↓ Export data.js** when done.
5. Replace `js/data.js` with the downloaded file.
6. Commit and push.

> The editor loads content in this order: browser draft → `js/data.js` → built-in
> defaults. If a draft is ever lost (new browser, cleared cache, moved folder),
> use **↑ Import** to load a `data.js` file back in.

### Editor features

- **Collections** — Portfolio is organized into Film and Commercial; both can be renamed, added to, or removed
- **Works** — add, duplicate, reorder, delete; each has a title, year, role, description, tags, cover image, and links
- **Image handling** — uploads are auto-compressed, then cropped to 16:9 (covers) or 4:5 (profile photo) with drag-to-pan and zoom
- **Showreel** — set a Vimeo/YouTube URL under Hero to show a play button on the homepage; leave empty to hide it

### Editing by hand

`js/data.js` is a plain object. Editing it directly works fine — just keep the
shape intact:

```js
{
  meta:       { name, siteTitle },
  hero:       { label, line1, line2, description, reelUrl, reelLabel },
  about:      { photo, bio: [...], skills: [{ category, items: [...] }] },
  portfolio:  [{ id, name, works: [{ id, title, year, role,
                                     description, tags, coverImage, links }] }],
  experience: [{ id, period, title, company, description, tags }],
  contact:    { email, phone, website, instagram, facebook, location, message }
}
```

---

## Deploying

Push to `main`. GitHub Pages redeploys automatically, usually within 1–2 minutes.

A GitHub Action (`cache-bust.yml`) runs on every push and rewrites the `?v=`
query strings on all CSS/JS links, so returning visitors always get the newest
files instead of a cached copy — no hard refresh needed on their end.

`deploy.bat` does the same version bump locally and pushes, for when you want to
handle it manually.

---

## Design

Dark, editorial, cinema-leaning. All colors and fonts are CSS custom properties
in `css/style.css` — change them in one place to restyle the whole site.

```css
--bg:      #070b09;   /* near-black green */
--surface: #0d1310;   /* cards, inputs */
--accent:  #4fa980;   /* jade green */
--fg:      #e9efeb;   /* primary text */
```

**Type** — [Cormorant](https://fonts.google.com/specimen/Cormorant) for display
headings, [Manrope](https://fonts.google.com/specimen/Manrope) for body.

**Details** — custom dot-and-ring cursor, scroll-triggered reveals, hero
parallax, 16:9 work cards with hover overlays. Fully responsive; the custom
cursor is desktop-only by nature and degrades cleanly on touch.

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

## Notes

- No build tooling, no package manager, no framework — open the HTML files directly and they work
- The contact section links out (email, phone, socials); there is no form, so there's no backend to maintain
- `editor.html` ships with the site but isn't linked from anywhere public
