/* ===================================
   PORTFOLIO — shared work rendering
   Card / row templates, the detail panel and the hover preview,
   used by both index.html (render.js) and works.html. Reads nothing
   but window.PORTFOLIO_DATA; motion hooks go through window.VW when
   main.js has loaded (it always loads after this file).
=================================== */
(function () {
  var ORDER = ['commercial', 'film'];   // display order for collections

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // Collections in display order (ids not listed keep their order, after these)
  function collections(D) {
    return ((D && D.portfolio) || []).slice().sort(function (a, b) {
      var ia = ORDER.indexOf(a.id), ib = ORDER.indexOf(b.id);
      if (ia === -1) ia = ORDER.length;
      if (ib === -1) ib = ORDER.length;
      return ia - ib;
    });
  }

  // Flat list of works, each tagged with its collection name
  function flatten(cols) {
    return cols.reduce(function (arr, c) {
      return arr.concat((c.works || []).map(function (w) {
        var x = Object.assign({}, w);
        x._coll = c.name;
        x._collId = c.id;
        return x;
      }));
    }, []);
  }

  function tagsHTML(tags) {
    if (!tags || !tags.length) return '';
    return '<ul class="tags">' + tags.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
  }

  function linksHTML(w, cls) {
    var out = '';
    if (w.links && w.links.live)       out += '<a href="' + esc(w.links.live) + '" class="' + cls + '" target="_blank" rel="noopener noreferrer">Watch <span class="btn-arrow" aria-hidden="true">→</span></a>';
    if (w.links && w.links.case_study) out += '<a href="' + esc(w.links.case_study) + '" class="' + cls + '" target="_blank" rel="noopener noreferrer">More Info <span class="btn-arrow" aria-hidden="true">→</span></a>';
    return out;
  }

  function imgHTML(w, eager) {
    if (!w.coverImage) return '<div class="work-placeholder"><span>' + esc(w.title) + '</span></div>';
    return '<img src="' + esc(w.coverImage) + '" alt="' + esc(w.title) + '" ' +
      (eager ? 'fetchpriority="high"' : 'loading="lazy"') + ' decoding="async" />';
  }

  // Editorial card — image, index, title, year, role, tags, description, links
  function cardHTML(w, i, opts) {
    opts = opts || {};
    var links = linksHTML(w, 'u-link');
    return '<article class="work-card" data-wid="' + esc(w.id) + '">'
      + '<button type="button" class="work-media" data-cursor="Open" aria-label="Open ' + esc(w.title) + '">'
      +   (opts.corner && w._coll ? '<span class="work-corner">' + esc(w._coll) + '</span>' : '')
      +   '<div class="work-media-inner" data-card-parallax>' + imgHTML(w, opts.eager) + '</div>'
      + '</button>'
      + '<div class="work-body">'
      +   '<div class="work-head">'
      +     '<span class="work-idx mono-label">' + pad(i + 1) + '</span>'
      +     '<h3 class="work-title">' + esc(w.title) + '</h3>'
      +     '<span class="work-year mono-label">' + esc(w.year) + '</span>'
      +   '</div>'
      +   '<p class="work-role mono-label">' + esc(w.role) + '</p>'
      +   tagsHTML(w.tags)
      +   '<p class="work-desc">' + esc(w.description) + '</p>'
      +   (links ? '<div class="work-links">' + links + '</div>' : '')
      + '</div>'
      + '</article>';
  }

  // Index row — for the archive list view
  function rowHTML(w, i) {
    return '<button type="button" class="work-row" data-wid="' + esc(w.id) + '" data-cover="' + esc(w.coverImage || '') + '" data-cursor="Open">'
      + '<span class="work-idx mono-label">' + pad(i + 1) + '</span>'
      + '<span class="row-title">' + esc(w.title) + '</span>'
      + '<span class="row-meta"><span class="row-role mono-label">' + esc(w.role) + '</span>' + tagsHTML(w.tags) + '</span>'
      + '<span class="row-year mono-label">' + esc(w.year) + '</span>'
      + '</button>';
  }

  // ── DETAIL PANEL ────────────────────────────────────────────────
  var modal, panel, backdrop, list = [], current = -1, lastFocus = null, isOpen = false;

  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'work-modal';
    modal.id = 'workModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML =
        '<div class="modal-backdrop" id="modalBackdrop"></div>'
      + '<div class="modal-panel" id="modalPanel">'
      +   '<button type="button" class="modal-close" id="modalClose" aria-label="Close">'
      +     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>'
      +   '</button>'
      +   '<figure class="modal-media" id="modalImg"></figure>'
      +   '<div class="modal-body">'
      +     '<div class="modal-kicker mono-label modal-anim"><span id="modalColl"></span><span id="modalYear"></span></div>'
      +     '<h3 class="modal-title modal-anim" id="modalTitle"></h3>'
      +     '<p class="modal-role mono-label modal-anim" id="modalRole"></p>'
      +     '<div class="modal-anim" id="modalTags"></div>'
      +     '<p class="modal-desc modal-anim" id="modalDesc"></p>'
      +     '<div class="modal-links modal-anim" id="modalLinks"></div>'
      +     '<div class="modal-nav modal-anim">'
      +       '<button type="button" id="modalPrev"><span class="mono-label">← Prev</span><span class="nt"></span></button>'
      +       '<button type="button" id="modalNext"><span class="mono-label">Next →</span><span class="nt"></span></button>'
      +     '</div>'
      +   '</div>'
      + '</div>';
    document.body.appendChild(modal);
    panel    = modal.querySelector('#modalPanel');
    backdrop = modal.querySelector('#modalBackdrop');

    modal.querySelector('#modalClose').addEventListener('click', close);
    backdrop.addEventListener('click', close);
    modal.querySelector('#modalPrev').addEventListener('click', function () { step(-1); });
    modal.querySelector('#modalNext').addEventListener('click', function () { step(1); });
    document.addEventListener('keydown', function (e) {
      if (!isOpen) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
    if (window.VW && VW.bind) VW.bind(modal);
    return modal;
  }

  function fill(w) {
    var g = function (id) { return modal.querySelector('#' + id); };
    g('modalImg').innerHTML = imgHTML(w, true);
    g('modalColl').textContent  = w._coll || '';
    g('modalYear').textContent  = w.year || '';
    g('modalTitle').textContent = w.title || '';
    g('modalRole').textContent  = w.role || '';
    g('modalTags').innerHTML    = tagsHTML(w.tags);
    g('modalDesc').textContent  = w.description || '';
    g('modalLinks').innerHTML   = linksHTML(w, 'btn');
    var prev = list[current - 1], next = list[current + 1];
    var pb = g('modalPrev'), nb = g('modalNext');
    pb.disabled = !prev; nb.disabled = !next;
    pb.querySelector('.nt').textContent = prev ? prev.title : '';
    nb.querySelector('.nt').textContent = next ? next.title : '';
    if (window.VW && VW.bind) VW.bind(modal);
  }

  function open(work, works) {
    ensureModal();
    list = works || [work];
    current = Math.max(0, list.indexOf(work));
    if (current === -1) current = 0;
    fill(list[current]);
    lastFocus = document.activeElement;
    isOpen = true;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    panel.scrollTop = 0;
    if (window.VW && VW.lenis) VW.lenis.stop();
    document.body.style.overflow = 'hidden';

    var g = window.gsap;
    if (g && !(window.VW && VW.reduced)) {
      g.killTweensOf([backdrop, panel]);
      g.set(backdrop, { opacity: 0 });
      g.set(panel, { xPercent: 100, x: 0 });
      var tl = g.timeline();
      tl.to(backdrop, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0)
        .to(panel, { xPercent: 0, duration: 0.95, ease: 'expo.out' }, 0.05)
        .fromTo(panel.querySelector('.modal-media img') || panel.querySelector('.modal-media'), { scale: 1.15 }, { scale: 1, duration: 1.4, ease: 'expo.out' }, 0.05)
        .fromTo(panel.querySelectorAll('.modal-anim'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.06, ease: 'power3.out' }, 0.35);
    } else {
      backdrop.style.opacity = 1;
      panel.style.transform = 'none';
      panel.querySelectorAll('.modal-anim').forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; });
    }
    setTimeout(function () { var c = modal.querySelector('#modalClose'); if (c) c.focus({ preventScroll: true }); }, 50);
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
    if (g && !(window.VW && VW.reduced)) {
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
    var body = panel.querySelector('.modal-body');
    var media = panel.querySelector('.modal-media');
    if (g && !(window.VW && VW.reduced)) {
      g.timeline()
        .to([media, body], { opacity: 0, y: dir * -14, duration: 0.28, ease: 'power2.in' })
        .add(function () { current = n; fill(list[current]); panel.scrollTop = 0; })
        .fromTo([media, body], { opacity: 0, y: dir * 18 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' });
    } else {
      current = n; fill(list[current]); panel.scrollTop = 0;
    }
  }

  // Click → open. Works for both cards and rows.
  function bindOpen(root, resolve) {
    root.addEventListener('click', function (e) {
      var hit = e.target.closest('.work-media, .work-row');
      if (!hit) return;
      var id = hit.closest('[data-wid]').getAttribute('data-wid');
      var r = resolve(id);
      if (!r || !r.work) return;
      e.preventDefault();
      open(r.work, r.list);
    });
  }

  // ── HOVER PREVIEW (list view) ──────────────────────────────────
  function bindPreview(listEl) {
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    var g = window.gsap;
    if (!g) return;
    var box = document.createElement('div');
    box.className = 'work-preview';
    box.innerHTML = '<img alt="" />';
    document.body.appendChild(box);
    var img = box.querySelector('img');
    var toX = g.quickTo(box, 'x', { duration: 0.6, ease: 'power3' });
    var toY = g.quickTo(box, 'y', { duration: 0.6, ease: 'power3' });
    var shown = false;
    listEl.addEventListener('mousemove', function (e) {
      var row = e.target.closest('.work-row');
      if (!row) { if (shown) hide(); return; }
      var src = row.getAttribute('data-cover');
      if (src && img.getAttribute('src') !== src) img.setAttribute('src', src);
      toX(e.clientX + 28);
      toY(e.clientY - box.offsetHeight / 2);
      if (!shown) { shown = true; g.to(box, { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' }); }
    });
    listEl.addEventListener('mouseleave', hide);
    function hide() { shown = false; g.to(box, { opacity: 0, scale: 0.85, duration: 0.4, ease: 'power3.out' }); }
  }

  // ── TICKER ─────────────────────────────────────────────────────
  function tickerHTML(works) {
    return works.map(function (w) {
      return '<span class="ticker-item"><i></i>' + esc(w.title) + ' ' + esc(w.year) + '</span>';
    }).join('');
  }

  window.VWPortfolio = {
    esc: esc, pad: pad,
    collections: collections, flatten: flatten,
    cardHTML: cardHTML, rowHTML: rowHTML, tagsHTML: tagsHTML, imgHTML: imgHTML, tickerHTML: tickerHTML,
    open: open, close: close, bindOpen: bindOpen, bindPreview: bindPreview
  };
})();
