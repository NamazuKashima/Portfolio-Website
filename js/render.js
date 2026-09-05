/* ===================================
   RENDER — homepage
   Pours js/data.js into index.html. Every string on the page comes
   from PORTFOLIO_DATA; nothing here is hard-coded copy. Runs before
   main.js, which then binds motion to whatever was rendered.
=================================== */
(function () {
  var D = window.PORTFOLIO_DATA;
  var P = window.VWPortfolio;
  if (!D || !P) return;

  var esc = P.esc, pad = P.pad;
  function $id(id) { return document.getElementById(id); }
  function setText(id, val) { var el = $id(id); if (el && val != null) el.textContent = val; }
  function setHTML(id, val) { var el = $id(id); if (el && val != null) el.innerHTML = val; }

  // ── META ───────────────────────────────────────────────────────
  if (D.meta) document.title = D.meta.siteTitle || document.title;
  var NAME = (D.meta && D.meta.name) || 'Victor Qixun Wu';

  // ── VEIL + FOOTER NAME (both carry the full name) ──────────────
  setText('veilName', NAME);
  setText('footer-name', NAME);
  setText('about-cap-name', NAME);

  // ── HERO ───────────────────────────────────────────────────────
  if (D.hero) {
    setText('hero-label', D.hero.label);
    setText('veilLabel', D.hero.label);
    setText('hero-line2', D.hero.line2);
    setText('hero-desc',  D.hero.description);

    // Wordmark: one character per span so main.js can raise them one by
    // one; the last word is set in italic (a styling choice — the string
    // itself is D.hero.line1, untouched).
    var wordEl = $id('hero-line1');
    var titleEl = document.querySelector('.hero-title');
    if (wordEl && D.hero.line1) {
      var words = String(D.hero.line1).trim().split(/\s+/);
      wordEl.innerHTML = words.map(function (w, wi) {
        var chars = Array.from(w).map(function (c) { return '<span class="ch">' + esc(c) + '</span>'; }).join('');
        var inner = (wi === words.length - 1 && words.length > 1) ? '<em>' + chars + '</em>' : chars;
        return (wi ? '<span class="sp"> </span>' : '') + inner;
      }).join('');
    }
    if (titleEl) titleEl.setAttribute('aria-label', D.hero.line2 || D.hero.line1);

    // Showreel CTA — only shown when a URL is set
    var reelEl = $id('hero-reel');
    if (reelEl) {
      var url = (D.hero.reelUrl || '').trim();
      if (url) {
        reelEl.href = url;
        reelEl.hidden = false;
        setText('hero-reel-label', D.hero.reelLabel || 'Watch Showreel');
        setupReelLightbox(reelEl, url);
      } else {
        reelEl.hidden = true;
      }
    }
  }

  // ── LOGO + FOOTER ──────────────────────────────────────────────
  if (D.footer) {
    if (D.footer.logo) { setText('nav-logo', D.footer.logo); setText('footer-logo', D.footer.logo); }
    if (D.footer.copyright) setText('footer-copy', D.footer.copyright);
  }

  // ── COLLECTIONS ────────────────────────────────────────────────
  var collections = P.collections(D);
  var allWorks = P.flatten(collections);

  // ── HERO MEDIA: cycling through the lead works of each collection ──
  (function heroMedia() {
    var stack = $id('gradeStack');
    if (!stack || !allWorks.length) return;
    // Interleave the first works of each collection so the opener shows range.
    var picks = [], depth = 0;
    while (picks.length < Math.min(4, allWorks.length)) {
      var added = false;
      for (var c = 0; c < collections.length && picks.length < 4; c++) {
        var w = (collections[c].works || [])[depth];
        if (w && w.coverImage) { picks.push(Object.assign({}, w, { _coll: collections[c].name })); added = true; }
      }
      if (!added) break;
      depth++;
    }
    if (!picks.length) return;

    stack.innerHTML = picks.map(function (w, i) {
      var eager = i === 0;
      var img = '<img src="' + esc(w.coverImage) + '" alt="" ' + (eager ? 'fetchpriority="high"' : 'loading="lazy"') + ' decoding="async" />';
      return '<div class="grade-slide' + (i === 0 ? ' is-active' : '') + '" data-i="' + i + '">' + img + '</div>';
    }).join('');

    var slides = stack.querySelectorAll('.grade-slide');
    var idx = 0, timer = null, paused = false, running = false;
    function caption(i) {
      var w = picks[i];
      setText('heroMediaTitle', w.title);
      setText('heroMediaMeta', [w.role, w.year].filter(Boolean).join(' · '));
      setText('heroIndex', pad(i + 1) + ' / ' + pad(picks.length));
    }
    caption(0);

    function show(n) {
      var from = slides[idx], to = slides[n];
      if (from === to) return;
      idx = n;
      var g = window.gsap, reduced = window.VW && VW.reduced;
      var cap = [$id('heroMediaTitle'), $id('heroMediaMeta'), $id('heroIndex')];
      if (g && !reduced) {
        to.classList.add('is-active');
        g.fromTo(to, { opacity: 0 }, { opacity: 1, duration: 1.1, ease: 'power2.inOut' });
        g.fromTo(to.querySelectorAll('img'), { scale: 1.12 }, { scale: 1.06, duration: 2.4, ease: 'power2.out' });
        g.to(from, { opacity: 0, duration: 1.1, ease: 'power2.inOut', onComplete: function () { from.classList.remove('is-active'); g.set(from, { clearProps: 'opacity' }); } });
        g.timeline()
          .to(cap, { opacity: 0, y: -6, duration: 0.3, ease: 'power2.in' })
          .add(function () { caption(n); })
          .to(cap, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
      } else {
        from.classList.remove('is-active'); to.classList.add('is-active'); caption(n);
      }
    }
    function tick() { if (!paused && !document.hidden) show((idx + 1) % slides.length); }
    function start() {
      if (running || slides.length < 2) return;
      running = true;
      timer = setInterval(tick, 5200);
    }
    var grade = $id('grade');
    if (grade) {
      grade.addEventListener('pointerenter', function () { paused = true; });
      grade.addEventListener('pointerleave', function () { paused = false; });
    }
    window.VWHero = { start: start, next: function () { show((idx + 1) % slides.length); }, count: slides.length };
  })();

  // ── TICKER ─────────────────────────────────────────────────────
  var ticker = $id('tickerTrack');
  if (ticker && allWorks.length) ticker.innerHTML = P.tickerHTML(allWorks);

  // ── ABOUT ──────────────────────────────────────────────────────
  if (D.about) {
    if (D.about.photo) {
      var photo = document.querySelector('.about-photo img');
      if (photo) { photo.src = D.about.photo; photo.alt = 'Portrait of ' + NAME; }
    }
    if (D.about.bio) {
      setHTML('about-bio', D.about.bio.map(function (p, i) {
        return '<p' + (i === 0 ? ' data-split="words"' : ' data-reveal') + '>' + p + '</p>';
      }).join(''));
    }
    if (D.about.languages && D.about.languages.length) {
      setHTML('about-langs', D.about.languages.map(function (l) {
        return '<li><span>' + esc(l.name) + '</span><span>' + esc(l.level) + '</span></li>';
      }).join(''));
    }
    var cvEl = $id('about-cv');
    if (cvEl) {
      var cv = (D.about.cvUrl || '').trim();
      if (cv) {
        cvEl.href = cv;
        cvEl.hidden = false;
        cvEl.setAttribute('download', D.about.cvFileName || 'CV.pdf');
        setText('about-cv-label', D.about.cvLabel || 'Download CV');
      } else {
        cvEl.hidden = true;
      }
    }
    if (D.about.skills) {
      setHTML('skills-grid', D.about.skills.map(function (s, i) {
        return '<div class="skill-line">'
          + '<span class="skill-idx mono-label">' + pad(i + 1) + '</span>'
          + '<h4>' + esc(s.category) + '</h4>'
          + '<ul>' + (s.items || []).map(function (it) { return '<li>' + esc(it) + '</li>'; }).join('') + '</ul>'
          + '</div>';
      }).join(''));
    }
  }
  if (D.contact && D.contact.location) {
    // "Vancouver, BC, Canada" → "Vancouver, BC" for the small photo caption
    var loc = String(D.contact.location).split(',').slice(0, 2).map(function (s) { return s.trim(); }).join(', ');
    setText('about-cap-loc', loc);
  }

  // ── PORTFOLIO ──────────────────────────────────────────────────
  (function portfolio() {
    var tabsEl = $id('collectionTabs');
    var gridEl = $id('worksGrid');
    if (!tabsEl || !gridEl) return;
    if (!collections.length) { gridEl.innerHTML = '<p class="works-empty">No works yet.</p>'; return; }

    var HOME_LIMIT = 4;   // works shown per collection on the homepage
    var activeId = collections[0].id;

    function buildTabs() {
      tabsEl.innerHTML = collections.map(function (c) {
        return '<button type="button" class="col-tab' + (c.id === activeId ? ' active' : '') + '" data-id="' + esc(c.id) + '">'
          + esc(c.name) + '<sup>' + (c.works || []).length + '</sup></button>';
      }).join('');
    }

    function currentList() {
      var col = collections.find(function (c) { return c.id === activeId; });
      if (!col) return [];
      return (col.works || []).map(function (w) { var x = Object.assign({}, w); x._coll = col.name; return x; });
    }

    function gridHTML() {
      var works = currentList().slice(0, HOME_LIMIT);
      if (!works.length) return '<p class="works-empty">No works in this collection yet.</p>';
      return works.map(function (w, i) { return P.cardHTML(w, i, { eager: i < 2 }); }).join('');
    }

    buildTabs();
    gridEl.innerHTML = gridHTML();

    tabsEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.col-tab');
      if (!btn || btn.dataset.id === activeId) return;
      activeId = btn.dataset.id;
      tabsEl.querySelectorAll('.col-tab').forEach(function (b) { b.classList.toggle('active', b === btn); });
      if (window.VW && VW.swapGrid) VW.swapGrid(gridEl, function () { gridEl.innerHTML = gridHTML(); });
      else gridEl.innerHTML = gridHTML();
    });

    // Detail panel: prev/next moves through the active collection
    P.bindOpen(gridEl, function (id) {
      var list = currentList();
      var work = list.find(function (w) { return w.id === id; });
      return { work: work, list: list };
    });
  })();

  // ── EXPERIENCE ─────────────────────────────────────────────────
  if (D.experience) {
    setHTML('timeline', D.experience.map(function (exp) {
      return '<li class="xp-row">'
        + '<span class="xp-period mono-label">' + esc(exp.period) + '</span>'
        + '<div class="xp-main"><h3 class="xp-title">' + esc(exp.title) + '</h3><span class="xp-company">' + esc(exp.company) + '</span></div>'
        + '<div class="xp-detail"><p>' + esc(exp.description) + '</p>' + P.tagsHTML(exp.tags) + '</div>'
        + '</li>';
    }).join(''));
  }

  // ── CONTACT ────────────────────────────────────────────────────
  if (D.contact) {
    setText('contact-message', D.contact.message);
    function setContactLink(id, href, text) {
      var el = $id(id);
      if (!el) return;
      if (href) el.href = href;
      var t = el.querySelector('.contact-text');
      if (t && text) t.textContent = text;
    }
    setContactLink('contact-email', 'mailto:' + D.contact.email, D.contact.email);
    var ctaEl = $id('contact-cta');
    if (ctaEl && D.contact.email) { ctaEl.href = 'mailto:' + D.contact.email; setText('contact-cta-mail', D.contact.email); }
    var menuMail = $id('menu-email');
    if (menuMail && D.contact.email) { menuMail.href = 'mailto:' + D.contact.email; menuMail.textContent = D.contact.email; }
    setContactLink('contact-phone',   'tel:' + (D.contact.phone || '').replace(/\s/g, ''), D.contact.phone);
    setContactLink('contact-website', 'https://' + (D.contact.website || '').replace(/^https?:\/\//, ''), D.contact.website);
    if (D.contact.instagram) setContactLink('contact-instagram', 'https://www.instagram.com/' + D.contact.instagram + '/', '@' + D.contact.instagram);
    if (D.contact.facebook)  setContactLink('contact-facebook',  'https://www.facebook.com/'  + D.contact.facebook, 'facebook.com/' + D.contact.facebook);
    var locText = $id('contact-location') && $id('contact-location').querySelector('.contact-text');
    if (locText && D.contact.location) locText.textContent = D.contact.location;
  }

  // ── SHOWREEL LIGHTBOX ──────────────────────────────────────────
  function toEmbedUrl(url) {
    var m;
    m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
    if (m) return 'https://www.youtube.com/embed/' + m[1] + '?autoplay=1&rel=0&modestbranding=1';
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([\w]+))?/);
    if (m) {
      var src = 'https://player.vimeo.com/video/' + m[1] + '?autoplay=1&title=0&byline=0&portrait=0';
      if (m[2]) src += '&h=' + m[2];
      return src;
    }
    if (/\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url)) return { video: url };
    return null;
  }

  function setupReelLightbox(trigger, url) {
    var modal = $id('reelModal'), frame = $id('reelFrame'), closeBt = $id('reelClose'), backdrop = $id('reelBackdrop');
    if (!modal || !frame) return;
    var embed = toEmbedUrl(url);
    trigger.addEventListener('click', function (e) {
      if (!embed) { trigger.target = '_blank'; trigger.rel = 'noopener'; return; }
      e.preventDefault();
      frame.innerHTML = embed.video
        ? '<video src="' + esc(embed.video) + '" controls autoplay playsinline></video>'
        : '<iframe src="' + embed + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Showreel"></iframe>';
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      if (window.VW && VW.lenis) VW.lenis.stop();
      if (window.gsap) gsap.fromTo(modal.querySelector('.reel-card'), { opacity: 0, y: 30, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'expo.out' });
    });
    function close() {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      frame.innerHTML = '';
      document.body.style.overflow = '';
      if (window.VW && VW.lenis) VW.lenis.start();
    }
    if (closeBt) closeBt.onclick = close;
    if (backdrop) backdrop.onclick = close;
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });
  }
})();
