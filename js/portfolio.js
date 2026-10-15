/* ===================================
   PORTFOLIO — shared work rendering
   Data helpers, the templates for each register (film screening, film
   credit, commercial look, index row), the detail panel, the full-screen
   frame viewer, the "more films" screen and the index hover preview.
   Used by index.html (render.js) and film / commercial / works.html
   (archive.js). Reads nothing but window.PORTFOLIO_DATA; motion goes
   through window.VW once main.js has loaded.

   Film vs. everything else: a collection is the film collection when its
   id is "film" (or its name says film / cinema / narrative). Every other
   collection — Commercial today, anything added in the editor later —
   is shown in the commercial register.
=================================== */
(function () {
  'use strict';

  var R = window.VWReadings;

  // ── HELPERS ────────────────────────────────────────────────────
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function clean(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function roman(n) { return ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n - 1] || String(n); }
  function anchorId(w) { return 'w-' + String(w.id).replace(/[^\w-]/g, ''); }
  function motionOK() { return !!(window.gsap && window.VW && !VW.reduced); }

  function isFilm(c) {
    return !!c && (c.id === 'film' || /\b(film|films|cinema|narrative)\b/i.test(c.name || ''));
  }

  // collections with works, film first, the rest in the editor's order
  function collections(D) {
    var cols = ((D && D.portfolio) || []).filter(function (c) { return c && Array.isArray(c.works); });
    return cols.filter(isFilm).concat(cols.filter(function (c) { return !isFilm(c); }));
  }

  function worksOf(c) {
    var kind = isFilm(c) ? 'film' : 'other';
    return (c.works || []).map(function (w) {
      var x = Object.assign({}, w);
      x._coll = c.name; x._collId = c.id; x._kind = kind;
      return x;
    });
  }
  function flatten(cols) { return cols.reduce(function (a, c) { return a.concat(worksOf(c)); }, []); }

  function yearSpan(works) {
    var ys = [];
    works.forEach(function (w) { (String(w.year || '').match(/\d{4}/g) || []).forEach(function (y) { ys.push(+y); }); });
    if (!ys.length) return '';
    var lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys);
    return lo === hi ? String(lo) : lo + '–' + hi;
  }
  function noun(n, kind) {
    return kind === 'film' ? (n === 1 ? 'title' : 'titles') : (n === 1 ? 'project' : 'projects');
  }
  function year(w) { return clean(w.year).replace(/\s*-\s*/, '–'); }

  // ── VIDEO ──────────────────────────────────────────────────────
  // A work's "Watch / Live URL" (links.live in data.js, set in the editor)
  // is its video: for a film, the trailer — or the whole film when the
  // link ends in #film (e.g. https://vimeo.com/123#film), which only
  // changes the wording to "Watch film". YouTube, Vimeo (including private
  // links with a hash), Facebook videos and plain video files play in the
  // page; anything else (an Instagram reel, say) opens in a new tab, its
  // buttons marked ↗.
  function videoOf(w) { return String((w && w.links && w.links.live) || '').trim(); }
  function isFullFilm(v) { return /#film\b/i.test(String(v || '')); }
  function bare(v) { return String(v || '').replace(/#film\b/i, ''); }   // the link as the host knows it
  function seconds(s) {
    var m = String(s || '').match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
    return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0;
  }
  function embedOf(url) {
    url = String(url || '').trim();
    if (!url) return null;
    var m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/);
    if (m) {
      var t = url.match(/[?&#](?:t|start)=([\dhms]+)/);
      var start = t ? seconds(t[1]) : 0;
      return {
        src: 'https://www.youtube-nocookie.com/embed/' + m[1] + '?autoplay=1&rel=0&modestbranding=1&playsinline=1' + (start ? '&start=' + start : ''),
        host: 'YouTube'
      };
    }
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/(\w+))?/);
    if (m) {
      var h = m[2] || (url.match(/[?&]h=(\w+)/) || [])[1];
      return { src: 'https://player.vimeo.com/video/' + m[1] + '?autoplay=1&title=0&byline=0&portrait=0&dnt=1' + (h ? '&h=' + h : ''), host: 'Vimeo' };
    }
    // Facebook videos: Facebook's own player — dark, full-bleed, no login
    // wall. It draws at the size it's asked for (sized: see play()).
    if (/^https?:\/\/(?:(?:www|m|web)\.)?facebook\.com\/(?:[^?#]+\/videos\/|watch\/?\?(?:[^#]*&)?v=\d|reel\/\d)|^https?:\/\/fb\.watch\//i.test(url)) {
      var href = bare(url).replace(/^https?:\/\/(?:(?:www|m|web)\.)?facebook\.com/i, 'https://www.facebook.com');
      return { src: 'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(href) + '&show_text=false&autoplay=true', host: 'Facebook', sized: true };
    }
    if (/\.(mp4|webm|mov|m4v)(\?.*)?(#.*)?$/i.test(url)) return { video: bare(url), host: '' };
    // anything else — Instagram included, whose embed is a white social
    // card with the video overlapping its own footer — opens in a new tab
    return null;
  }
  function plays(w) { return !!embedOf(videoOf(w)); }   // in the page, or in a new tab
  function videoKind(w) {
    if (w._kind !== 'film') return w._coll || '';
    return isFullFilm(videoOf(w)) ? 'Full film' : 'Trailer';
  }
  // the words on the button, and what a screen reader hears
  function watchLabel(w) {
    if (w._kind !== 'film') return 'Watch';
    return isFullFilm(videoOf(w)) ? 'Watch film' : 'Watch trailer';
  }
  function playLabel(w) {
    return (w._kind === 'film' && !isFullFilm(videoOf(w)) ? 'Play the trailer for ' + w.title : 'Play ' + w.title)
      + (plays(w) ? '' : ' (opens in a new tab)');
  }
  // the word beside the cursor over anything that plays it
  function playCursor(w) { return plays(w) ? 'Play' : 'Play ↗'; }
  // attributes that make any element play this work's video when clicked
  function playAttrs(w) {
    var v = videoOf(w);
    return v ? ' data-play="' + esc(v) + '" data-title="' + esc(w.title) + '" data-kind="' + esc(videoKind(w)) + '"' : '';
  }

  // ── TEMPLATES ──────────────────────────────────────────────────
  var EXT = '<svg class="ext" viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 7.5l5-5M3.6 2.5h3.9v3.9" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>';
  var PLAY = '<svg class="play" viewBox="0 0 10 10" aria-hidden="true"><path d="M2.6 1.4v7.2L8.6 5z" fill="currentColor"/></svg>';

  function tagsHTML(tags, cls) {
    if (!tags || !tags.length) return '';
    return '<ul class="tags' + (cls ? ' ' + cls : '') + '">' + tags.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
  }

  function linksHTML(w) {
    var l = w.links || {}, out = '';
    var v = videoOf(w);
    if (v) {
      var film = w._kind === 'film', inPage = !!embedOf(v);
      out += '<a class="' + (film ? 'link-play' : 'link') + '" href="' + esc(bare(v)) + '" target="_blank" rel="noopener noreferrer"' + playAttrs(w) + '>'
        + (film ? PLAY : '') + watchLabel(w)
        + (inPage ? '' : EXT + '<span class="sr-only"> (opens in a new tab)</span>')
        + '</a>';
    }
    if (l.case_study) out += '<a class="link" href="' + esc(l.case_study) + '" target="_blank" rel="noopener noreferrer">More info' + EXT + '<span class="sr-only"> (opens in a new tab)</span></a>';
    return out ? '<div class="links">' + out + '</div>' : '';
  }

  function frameHTML(w, o) {
    o = o || {};
    var cls = 'frame' + (o.cover ? ' frame--cover' : '') + (o.cls ? ' ' + o.cls : '');
    var img = w.coverImage
      ? '<img src="' + esc(w.coverImage) + '" alt="' + esc(o.alt != null ? o.alt : 'Frame from ' + w.title) + '" '
        + (o.eager ? 'fetchpriority="high"' : 'loading="lazy"') + ' decoding="async" />'
      : '<span class="frame-empty">' + esc(w.title) + '</span>';
    return '<div class="' + cls + '">' + img + '</div>';
  }

  // I · Film — a screening: year and tags in the margin, the frame wide,
  // its measured palette under it, then the title card and notes.
  // With a trailer, the frame plays it; without, it opens the details
  // (or, on film.html, the still full-screen).
  function screeningHTML(w, o) {
    o = o || {};
    var media = videoOf(w)
      ? '<button type="button" class="screening-media"' + playAttrs(w) + ' data-cursor="' + esc(playCursor(w)) + '" aria-label="' + esc(playLabel(w)) + '">'
      : '<button type="button" class="screening-media" data-open data-cursor="' + (o.cursor || 'Details') + '" aria-label="' + esc((o.verb || 'Open details for') + ' ' + w.title) + '">';
    return '<article class="screening" data-wid="' + esc(w.id) + '"' + (o.anchor ? ' id="' + anchorId(w) + '"' : '') + '>'
      + '<div class="screening-aside">'
      +   '<p class="screening-year">' + esc(year(w)) + '</p>'
      +   tagsHTML(w.tags)
      +   (w.coverImage ? '<canvas class="scope screening-scope" data-scope="' + esc(w.coverImage) + '" data-bloom aria-hidden="true"></canvas>' : '')
      + '</div>'
      + media
      +   frameHTML(w, { eager: o.eager, cls: 'frame--film' })
      + '</button>'
      + (w.coverImage ? '<div class="palette" data-palette="' + esc(w.coverImage) + '"></div>' : '')
      + '<div class="screening-body">'
      +   '<h3 class="screening-title">' + esc(w.title) + '</h3>'
      +   (w.role ? '<p class="screening-role">' + esc(clean(w.role)) + '</p>' : '')
      +   (w.description ? '<p class="screening-desc">' + esc(w.description) + '</p>' : '')
      +   linksHTML(w)
      + '</div>'
      + '</article>';
  }

  // I · Film — a line of the credits; the line opens the details, the
  // button beside it plays the trailer (or the film)
  function creditHTML(w) {
    var v = videoOf(w);
    var word = isFullFilm(v) ? 'Film' : 'Trailer';
    return '<li class="credit' + (v ? ' has-video' : '') + '">'
      + '<button type="button" class="credit-btn" data-wid="' + esc(w.id) + '" data-cursor="Details">'
      +   '<span class="credit-thumb">' + frameHTML(w, { alt: '' }) + '</span>'
      +   '<span class="credit-title">' + esc(w.title) + '</span>'
      +   (w.role ? '<span class="credit-role">' + esc(clean(w.role)) + '</span>' : '')
      +   '<span class="credit-year">' + esc(year(w)) + '</span>'
      + '</button>'
      + (v ? '<button type="button" class="credit-play"' + playAttrs(w) + ' aria-label="' + esc(playLabel(w)) + '">' + PLAY + word + (plays(w) ? '' : EXT) + '</button>' : '')
      + '</li>';
  }

  // II · Commercial — a look in the lookbook. o.full adds the notes under
  // the caption (the commercial page); the homepage keeps captions bare.
  function lookHTML(w, o) {
    o = o || {};
    return '<article class="look' + (o.full ? ' look--full' : '') + '" data-wid="' + esc(w.id) + '">'
      + '<button type="button" class="look-media" data-open data-cursor="Details" aria-label="Open details for ' + esc(w.title) + '">'
      +   frameHTML(w, { cover: true, eager: o.eager })
      + '</button>'
      + '<div class="look-cap">'
      +   '<h3 class="look-title">' + esc(w.title) + '</h3>'
      +   (w.role ? '<p class="look-role">' + esc(clean(w.role)) + '</p>' : '')
      +   '<p class="look-year">' + esc(year(w)) + '</p>'
      + '</div>'
      + (o.full
          ? '<div class="look-notes">'
            + (w.description ? '<p class="look-desc">' + esc(w.description) + '</p>' : '')
            + tagsHTML(w.tags)
            + linksHTML(w)
            + '</div>'
          : '')
      + '</article>';
  }

  // a run of titles, separated by slashes — buttons that open the panel, or
  // anchor links. Each title keeps its slash, so a line never starts on one.
  function runHTML(works, tag) {
    tag = tag || 'button';
    return works.map(function (w, i) {
      var inner = esc(w.title);
      var el = tag === 'a'
        ? '<a href="#' + anchorId(w) + '">' + inner + '</a>'
        : '<button type="button" data-wid="' + esc(w.id) + '">' + inner + '</button>';
      return '<span class="ri">' + el + (i < works.length - 1 ? '<span class="sep" aria-hidden="true">/</span>' : '') + '</span>';
    }).join(' ');
  }

  // index row (works.html)
  function rowHTML(w) {
    return '<li><button type="button" class="row" data-wid="' + esc(w.id) + '" data-cover="' + esc(w.coverImage || '') + '" data-cursor="Details">'
      + '<span class="row-title">' + esc(w.title) + '</span>'
      + '<span class="row-role">' + esc(clean(w.role)) + '</span>'
      + '<span class="row-year">' + esc(year(w)) + '</span>'
      + '</button></li>';
  }

  // fade each image in once it has decoded (a load state, not a decoration)
  function markLoaded(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll('.frame img:not(.is-loaded)'), function (img) {
      var done = function () { img.classList.add('is-loaded'); };
      if (img.complete && img.naturalWidth) done();
      else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); }
    });
  }

  // ── DETAIL PANEL ────────────────────────────────────────────────
  var modal, panel, backdrop, list = [], current = -1, lastFocus = null, isOpen = false, scope = null;
  var ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'work-modal';
    modal.id = 'workModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'modalTitle');
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML =
        '<div class="modal-backdrop"></div>'
      + '<div class="modal-panel">'
      +   '<button type="button" class="modal-close" id="modalClose">' + ICON_X + 'Close</button>'
      +   '<figure class="modal-media"><div id="modalFrame"></div><div class="palette" id="modalPalette"></div></figure>'
      +   '<div class="modal-body">'
      +     '<p class="modal-kicker modal-anim"><span id="modalColl"></span><span id="modalYear" class="num"></span></p>'
      +     '<h3 class="modal-title modal-anim" id="modalTitle"></h3>'
      +     '<p class="modal-role modal-anim" id="modalRole"></p>'
      +     '<p class="modal-desc modal-anim" id="modalDesc"></p>'
      +     '<div class="modal-anim" id="modalTags"></div>'
      +     '<div class="modal-links modal-anim" id="modalLinks"></div>'
      +     '<div class="modal-reading modal-anim" id="modalReading" hidden>'
      +       '<canvas class="scope" id="modalScope" aria-hidden="true"></canvas>'
      +       '<div><h4>Measured from this frame</h4><ul class="swatch-list" id="modalSwatches"></ul></div>'
      +     '</div>'
      +     '<div class="modal-nav modal-anim">'
      +       '<button type="button" id="modalPrev"><span>Previous</span><span class="nt"></span></button>'
      +       '<button type="button" id="modalNext"><span>Next</span><span class="nt"></span></button>'
      +     '</div>'
      +   '</div>'
      + '</div>';
    document.body.appendChild(modal);
    panel = modal.querySelector('.modal-panel');
    backdrop = modal.querySelector('.modal-backdrop');

    modal.querySelector('#modalClose').addEventListener('click', close);
    backdrop.addEventListener('click', close);
    modal.querySelector('#modalPrev').addEventListener('click', function () { step(-1); });
    modal.querySelector('#modalNext').addEventListener('click', function () { step(1); });
    document.addEventListener('keydown', function (e) {
      if (!isOpen || pOpen) return;     // a playing trailer takes the keys first
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'Tab') trapFocus(e, panel);
    });
    return modal;
  }

  function trapFocus(e, box) {
    var f = Array.prototype.filter.call(box.querySelectorAll('a[href], button:not([disabled])'), function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function fill(w) {
    var g = function (id) { return modal.querySelector('#' + id); };
    // with a trailer, the frame in the panel plays it too
    g('modalFrame').innerHTML  = videoOf(w)
      ? '<button type="button" class="modal-play"' + playAttrs(w) + ' data-cursor="' + esc(playCursor(w)) + '" aria-label="' + esc(playLabel(w)) + '">' + frameHTML(w, { eager: true }) + '</button>'
      : frameHTML(w, { eager: true });
    g('modalColl').textContent  = w._coll || '';
    g('modalYear').textContent  = year(w);
    g('modalTitle').textContent = w.title || '';
    g('modalRole').textContent  = clean(w.role);
    g('modalDesc').textContent  = w.description || '';
    g('modalTags').innerHTML    = tagsHTML(w.tags);
    g('modalLinks').innerHTML   = linksHTML(w);
    g('modalPalette').innerHTML = '';
    markLoaded(g('modalFrame'));
    var prev = list[current - 1], next = list[current + 1];
    var pb = g('modalPrev'), nb = g('modalNext');
    pb.disabled = !prev; nb.disabled = !next;
    pb.querySelector('.nt').textContent = prev ? prev.title : '';
    nb.querySelector('.nt').textContent = next ? next.title : '';

    // readings — measured from this frame; hidden if the browser can't read pixels
    var reading = g('modalReading');
    var id = w.id;
    if (!R || !w.coverImage) { reading.hidden = true; return; }
    R.analyze(w.coverImage).then(function (r) {
      if (!isOpen || !list[current] || list[current].id !== id) return;
      reading.hidden = !r;
      if (!r) return;
      g('modalPalette').innerHTML = R.paletteHTML(r);
      g('modalSwatches').innerHTML = R.swatchesHTML(r);
      if (!scope) scope = new R.Scope(g('modalScope'), { labels: true, gain: 0.9 });
      else scope.measure();
      scope.set(r, scope.cur ? 'morph' : 'bloom', scope.cur ? 1000 : 1400);
    });
  }

  function open(work, works) {
    ensureModal();
    closeViewer();
    list = works || [work];
    current = Math.max(0, list.indexOf(work));
    lastFocus = document.activeElement;
    isOpen = true;
    if (scope) scope.clear();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    fill(list[current]);
    document.body.classList.add('modal-open');
    panel.scrollTop = 0;
    if (window.VW && VW.lenis) VW.lenis.stop();
    document.body.style.overflow = 'hidden';

    var g = window.gsap;
    if (motionOK()) {
      g.killTweensOf([backdrop, panel]);
      g.set(backdrop, { opacity: 0 });
      g.set(panel, { xPercent: 100, x: 0 });
      g.timeline()
        .to(backdrop, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0)
        .to(panel, { xPercent: 0, duration: 0.95, ease: 'expo.out' }, 0.05)
        .fromTo(panel.querySelectorAll('.modal-anim'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.05, ease: 'power3.out' }, 0.35);
    } else {
      backdrop.style.opacity = 1;
      panel.style.transform = 'none';
    }
    setTimeout(function () { var c = modal.querySelector('#modalClose'); if (c) c.focus({ preventScroll: true }); }, 60);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    var done = function () {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      if (window.VW && VW.lenis) VW.lenis.start();
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    };
    var g = window.gsap;
    if (motionOK()) {
      g.killTweensOf([backdrop, panel]);
      g.timeline({ onComplete: done })
        .to(panel, { xPercent: 100, duration: 0.7, ease: 'expo.inOut' }, 0)
        .to(backdrop, { opacity: 0, duration: 0.5, ease: 'power2.in' }, 0.15);
    } else {
      done();
    }
  }

  function step(dir) {
    var n = current + dir;
    if (n < 0 || n >= list.length) return;
    var g = window.gsap;
    var parts = [panel.querySelector('.modal-media'), panel.querySelector('.modal-body')];
    if (motionOK()) {
      g.timeline()
        .to(parts, { opacity: 0, y: dir * -12, duration: 0.25, ease: 'power2.in' })
        .add(function () { current = n; fill(list[current]); panel.scrollTop = 0; })
        .fromTo(parts, { opacity: 0, y: dir * 16 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' });
    } else {
      current = n; fill(list[current]); panel.scrollTop = 0;
    }
  }

  // ── FRAME VIEWER (film.html) ───────────────────────────────────
  // The frame as large as the screen allows, on monitor black.
  var viewer, vList = [], vIdx = 0, vOpen = false, vLast = null;
  function ensureViewer() {
    if (viewer) return viewer;
    viewer = document.createElement('div');
    viewer.className = 'viewer';
    viewer.setAttribute('role', 'dialog');
    viewer.setAttribute('aria-modal', 'true');
    viewer.setAttribute('aria-label', 'Frame viewer');
    viewer.innerHTML =
        '<div class="viewer-stage"><img alt="" /></div>'
      + '<div class="viewer-bar">'
      +   '<p class="viewer-title"></p>'
      +   '<div class="viewer-ctrl">'
      +     '<button type="button" class="btn" data-v="-1">Previous</button>'
      +     '<button type="button" class="btn" data-v="1">Next</button>'
      +     '<button type="button" class="btn btn-solid" data-v="0">Close</button>'
      +   '</div>'
      + '</div>';
    document.body.appendChild(viewer);
    viewer.addEventListener('click', function (e) {
      var b = e.target.closest('[data-v]');
      if (b) { var v = +b.getAttribute('data-v'); if (v) showFrame(vIdx + v); else closeViewer(); return; }
      if (e.target.classList.contains('viewer-stage')) closeViewer();
    });
    document.addEventListener('keydown', function (e) {
      if (!vOpen) return;
      if (e.key === 'Escape') closeViewer();
      if (e.key === 'ArrowLeft') showFrame(vIdx - 1);
      if (e.key === 'ArrowRight') showFrame(vIdx + 1);
      if (e.key === 'Tab') trapFocus(e, viewer);
    });
    return viewer;
  }
  function showFrame(i) {
    if (i < 0 || i >= vList.length) return;
    vIdx = i;
    var w = vList[i], img = viewer.querySelector('img');
    img.src = w.coverImage || '';
    img.alt = 'Frame from ' + w.title;
    viewer.querySelector('.viewer-title').innerHTML = esc(w.title) + '<small>' + esc(year(w)) + '</small>';
    viewer.querySelector('[data-v="-1"]').disabled = i === 0;
    viewer.querySelector('[data-v="1"]').disabled = i === vList.length - 1;
    if (motionOK()) gsap.fromTo(img, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
  }
  function view(work, works) {
    ensureViewer();
    vList = (works || [work]).filter(function (w) { return w.coverImage; });
    vLast = document.activeElement;
    vOpen = true;
    viewer.classList.add('open');
    showFrame(Math.max(0, vList.indexOf(work)));
    document.body.style.overflow = 'hidden';
    if (window.VW && VW.lenis) VW.lenis.stop();
    if (motionOK()) gsap.fromTo(viewer, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power2.out' });
    setTimeout(function () { var c = viewer.querySelector('[data-v="0"]'); if (c) c.focus({ preventScroll: true }); }, 60);
  }
  function closeViewer() {
    if (!vOpen) return;
    vOpen = false;
    viewer.classList.remove('open');
    document.body.style.overflow = '';
    if (window.VW && VW.lenis) VW.lenis.start();
    if (vLast && vLast.focus) vLast.focus({ preventScroll: true });
  }

  // ── PLAYER: trailers, videos and the showreel, in the page ──────
  // Opens over everything (including the detail panel). Closing removes
  // the iframe, so playback stops. "Open on YouTube/Vimeo" is always
  // offered, for videos whose owners don't allow embedding.
  var player, pOpen = false, pLast = null;
  function ensurePlayer() {
    if (player) return player;
    player = document.createElement('div');
    player.className = 'player';
    player.setAttribute('role', 'dialog');
    player.setAttribute('aria-modal', 'true');
    player.setAttribute('aria-labelledby', 'playerTitle');
    player.setAttribute('aria-hidden', 'true');
    player.innerHTML =
        '<div class="player-backdrop"></div>'
      + '<div class="player-card">'
      +   '<div class="player-bar">'
      +     '<p class="player-title" id="playerTitle"></p>'
      +     '<button type="button" class="player-close">' + ICON_X + 'Close</button>'
      +   '</div>'
      +   '<div class="player-frame"></div>'
      +   '<p class="player-foot"><a class="link" href="#" target="_blank" rel="noopener noreferrer"></a></p>'
      + '</div>';
    document.body.appendChild(player);
    player.querySelector('.player-close').addEventListener('click', closePlayer);
    player.querySelector('.player-backdrop').addEventListener('click', closePlayer);
    // capture phase: a playing video gets Esc / Tab before the panel underneath
    document.addEventListener('keydown', function (e) {
      if (!pOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closePlayer(); }
      else if (e.key === 'Tab') { e.stopPropagation(); trapFocus(e, player); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.stopPropagation();
    }, true);
    return player;
  }

  function play(url, o) {
    o = o || {};
    var e = embedOf(url);
    if (!e) { window.open(bare(url), '_blank', 'noopener'); return; }
    ensurePlayer();
    pLast = document.activeElement;
    var t = player.querySelector('.player-title');
    t.innerHTML = esc(o.title || '') + (o.kind ? '<span>' + esc(o.kind) + '</span>' : '');
    var ext = player.querySelector('.player-foot a');
    ext.href = bare(url);
    ext.innerHTML = (e.host ? 'Open on ' + e.host : 'Open the video file') + EXT + '<span class="sr-only"> (opens in a new tab)</span>';
    pOpen = true;
    player.classList.add('open');
    // the frame has its size once the player is shown; a player that draws
    // at a given size (Facebook's) is asked for exactly the frame's
    var fr = player.querySelector('.player-frame'), src = e.src;
    if (e.sized) src += '&width=' + Math.round(fr.clientWidth) + '&height=' + Math.round(fr.clientHeight);
    fr.innerHTML = e.video
      ? '<video src="' + esc(e.video) + '" controls autoplay playsinline></video>'
      : '<iframe src="' + esc(src) + '" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen title="' + esc((o.title || 'Video') + (o.kind ? ' — ' + o.kind : '')) + '"></iframe>';
    player.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (window.VW && VW.lenis) VW.lenis.stop();
    if (motionOK()) {
      gsap.fromTo(player.querySelector('.player-backdrop'), { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power2.out' });
      gsap.fromTo(player.querySelector('.player-card'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out' });
    }
    setTimeout(function () { var c = player.querySelector('.player-close'); if (c) c.focus({ preventScroll: true }); }, 60);
  }

  function closePlayer() {
    if (!pOpen) return;
    pOpen = false;
    player.classList.remove('open');
    player.setAttribute('aria-hidden', 'true');
    player.querySelector('.player-frame').innerHTML = '';   // stops playback
    if (!isOpen && !vOpen) {
      document.body.style.overflow = '';
      if (window.VW && VW.lenis) VW.lenis.start();
    }
    if (pLast && pLast.focus) pLast.focus({ preventScroll: true });
  }

  // Anything carrying data-play plays in the player — frames, trailer
  // links, credit buttons. Modified clicks on links keep their default
  // (open in a new tab); a URL that can't play in the page opens in a tab.
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-play]') : null;
    if (!el) return;
    var url = el.getAttribute('data-play');
    if (el.tagName === 'A' && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return;
    e.preventDefault();
    e.stopPropagation();
    play(url, { title: el.getAttribute('data-title'), kind: el.getAttribute('data-kind') });
  });

  // ── BINDINGS ───────────────────────────────────────────────────
  // Click on a frame, a credit, a row or a title in a run → resolve → open
  function bindOpen(root, resolve, opener) {
    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-play]')) return;   // trailers are the player's
      var hit = e.target.closest('[data-open], .credit-btn, .row, .also-list button');
      if (!hit || !root.contains(hit)) return;
      var holder = hit.hasAttribute('data-wid') ? hit : hit.closest('[data-wid]');
      if (!holder) return;
      var r = resolve(holder.getAttribute('data-wid'));
      if (!r || !r.work) return;
      e.preventDefault();
      (opener || open)(r.work, r.list);
    });
  }

  // "More films": one screen beside the credits — pointing at a credit
  // puts its frame on the screen, unaltered
  function bindScreen(listEl, screenEl, works) {
    if (!listEl || !screenEl || !works.length) return;
    var frame = screenEl.querySelector('.frame');
    var cap = screenEl.querySelector('.more-screen-cap');
    var pal = screenEl.querySelector('.palette');
    var slides = {}, on = null;
    function show(id) {
      if (on === id) return;
      var w = works.filter(function (x) { return String(x.id) === String(id); })[0];
      if (!w) return;
      on = id;
      var s = slides[id];
      if (!s) {
        s = document.createElement('div');
        s.className = 'more-slide';
        s.innerHTML = w.coverImage ? '<img src="' + esc(w.coverImage) + '" alt="Frame from ' + esc(w.title) + '" decoding="async" />' : '';
        frame.appendChild(s);
        slides[id] = s;
      }
      Object.keys(slides).forEach(function (k) { slides[k].classList.toggle('is-on', k === String(id)); });
      Array.prototype.forEach.call(listEl.querySelectorAll('.credit-btn'), function (b) {
        b.classList.toggle('is-on', b.getAttribute('data-wid') === String(id));
      });
      if (cap) cap.textContent = [w.title, year(w)].filter(Boolean).join(', ');
      screenEl.setAttribute('data-cursor', videoOf(w) ? playCursor(w) : 'Details');
      if (pal && R) {
        R.analyze(w.coverImage).then(function (r) {
          if (on !== id) return;
          pal.innerHTML = r ? R.paletteHTML(r) : '';
          if (r) pal.setAttribute('aria-label', R.paletteLabel(r));
        });
      }
    }
    listEl.addEventListener('pointerover', function (e) {
      var b = e.target.closest('.credit-btn');
      if (!b) return;
      listEl.classList.add('is-pointing');
      show(b.getAttribute('data-wid'));
    });
    listEl.addEventListener('pointerleave', function () { listEl.classList.remove('is-pointing'); });
    listEl.addEventListener('focusin', function (e) {
      var b = e.target.closest('.credit-btn');
      if (b) show(b.getAttribute('data-wid'));
    });
    // the screen itself: plays the trailer on it, or opens its details
    screenEl.addEventListener('click', function () {
      var w = works.filter(function (x) { return String(x.id) === String(on); })[0];
      if (!w) return;
      if (videoOf(w)) { play(videoOf(w), { title: w.title, kind: videoKind(w) }); return; }
      var b = listEl.querySelector('.credit-btn[data-wid="' + String(on).replace(/"/g, '') + '"]');
      if (b) b.click();
    });
    show(String(works[0].id));
  }

  // index rows: a frame follows the pointer
  function bindPreview(listEl) {
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    var g = window.gsap;
    if (!g) return;
    var box = document.createElement('div');
    box.className = 'preview';
    box.innerHTML = '<div class="frame"><img alt="" /></div>';
    document.body.appendChild(box);
    var img = box.querySelector('img');
    var toX = g.quickTo(box, 'x', { duration: 0.6, ease: 'power3' });
    var toY = g.quickTo(box, 'y', { duration: 0.6, ease: 'power3' });
    var shown = false;
    listEl.addEventListener('mousemove', function (e) {
      var row = e.target.closest('.row');
      if (!row) { if (shown) hide(); return; }
      var src = row.getAttribute('data-cover');
      if (!src) { if (shown) hide(); return; }
      if (img.getAttribute('src') !== src) img.setAttribute('src', src);
      toX(e.clientX + 28);
      toY(e.clientY - box.offsetHeight / 2);
      if (!shown) { shown = true; g.to(box, { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' }); }
    });
    listEl.addEventListener('mouseleave', hide);
    function hide() { shown = false; g.to(box, { opacity: 0, scale: 0.92, duration: 0.4, ease: 'power3.out' }); }
  }

  window.VWPortfolio = {
    esc: esc, pad: pad, clean: clean, roman: roman, anchorId: anchorId, year: year,
    isFilm: isFilm, collections: collections, worksOf: worksOf, flatten: flatten,
    yearSpan: yearSpan, noun: noun,
    tagsHTML: tagsHTML, linksHTML: linksHTML, frameHTML: frameHTML,
    screeningHTML: screeningHTML, creditHTML: creditHTML, lookHTML: lookHTML, runHTML: runHTML, rowHTML: rowHTML,
    markLoaded: markLoaded,
    videoOf: videoOf, embedOf: embedOf, videoKind: videoKind, playLabel: playLabel, playCursor: playCursor, isFullFilm: isFullFilm,
    play: play, closePlayer: closePlayer,
    open: open, close: close, view: view, closeViewer: closeViewer,
    bindOpen: bindOpen, bindScreen: bindScreen, bindPreview: bindPreview
  };
})();
