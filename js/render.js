/* ===================================
   RENDER — homepage
   Pours js/data.js into index.html. Every string about Victor and his
   work comes from PORTFOLIO_DATA; this file only decides the layout:
   the hero (frame + live vectorscope), one chapter per collection —
   film first, in the film register; every other collection in the
   commercial register — then About, Experience and Contact.
   Runs before main.js, which binds motion to whatever was rendered.
=================================== */
(function () {
  var D = window.PORTFOLIO_DATA;
  var P = window.VWPortfolio;
  var R = window.VWReadings;
  if (!D || !P) return;

  var esc = P.esc;
  function $id(id) { return document.getElementById(id); }
  function setText(id, val) { var el = $id(id); if (el && val != null) el.textContent = val; }
  function setHTML(id, val) { var el = $id(id); if (el && val != null) el.innerHTML = val; }
  function titleCase(s) { return String(s).replace(/(^|\s)(\S)/g, function (m, a, b) { return a + b.toUpperCase(); }); }

  var HOME_SCREENINGS = 3;   // films shown as full screenings; the rest roll as credits
  var HOME_LOOKS = 5;        // looks in the commercial lookbook; the rest are listed by name

  // ── META ───────────────────────────────────────────────────────
  if (D.meta && D.meta.siteTitle) document.title = D.meta.siteTitle;
  var NAME = (D.meta && D.meta.name) || 'Victor Qixun Wu';
  setText('veilTitle', NAME);

  if (D.footer) {
    if (D.footer.logo) { setText('nav-logo', D.footer.logo); setText('footer-logo', D.footer.logo); }
    if (D.footer.copyright) setText('footer-copy', D.footer.copyright);
  }

  var cols = P.collections(D);
  var filmCols = cols.filter(P.isFilm);
  var otherCols = cols.filter(function (c) { return !P.isFilm(c); });
  // A work with "hideFromHome": true in js/data.js stays off this page (hero,
  // screenings, credits, lookbook) but still shows on film.html /
  // commercial.html and in the index.
  function onHome(w) { return !(w && w.hideFromHome); }
  function homeWorks(c) { return P.worksOf(c).filter(onHome); }
  var all = P.flatten(cols).filter(onHome);

  // ── HERO ───────────────────────────────────────────────────────
  if (D.hero) {
    // "Colorist · Vancouver, BC" → two parts, set as a role and a place
    var label = $id('hero-label');
    if (label && D.hero.label) {
      label.innerHTML = String(D.hero.label).split(/\s*[·•|]\s*/).filter(Boolean)
        .map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('');
    }
    setText('hero-desc', D.hero.description);

    // the name: one span per character so main.js can raise them
    var nameEl = $id('hero-line1');
    if (nameEl && D.hero.line1) {
      var words = titleCase(String(D.hero.line1).trim()).split(/\s+/);
      nameEl.innerHTML = '<span class="ln">' + words.map(function (w, wi) {
        return (wi ? '<span class="sp">&nbsp;</span>' : '') + Array.from(w).map(function (c) { return '<span class="ch">' + esc(c) + '</span>'; }).join('');
      }).join('') + '</span>';
      nameEl.setAttribute('aria-label', D.hero.line2 || NAME);
    }

    // showreel: plays in the shared player (portfolio.js); a link that can't
    // play in the page opens in a new tab
    var reelEl = $id('hero-reel');
    if (reelEl) {
      var url = (D.hero.reelUrl || '').trim();
      if (url) {
        reelEl.href = url;
        reelEl.hidden = false;
        reelEl.target = '_blank';
        reelEl.rel = 'noopener noreferrer';
        reelEl.setAttribute('data-play', url);
        reelEl.setAttribute('data-title', NAME);
        reelEl.setAttribute('data-kind', 'Showreel');
        if (D.hero.reelLabel) setText('hero-reel-label', D.hero.reelLabel);
      } else {
        reelEl.hidden = true;
      }
    }
  }

  // ── HERO FRAME + VECTORSCOPE ───────────────────────────────────
  // Interleaves the lead works of film and the other collections, so the
  // opener shows range; the scope beside it is measured from each frame.
  (function heroFrames() {
    var stack = $id('heroStack');
    if (!stack) return;
    var lanes = [P.flatten(filmCols).filter(onHome), P.flatten(otherCols).filter(onHome)].filter(function (l) { return l.length; });
    var picks = [], depth = 0;
    while (picks.length < 6) {
      var added = false;
      for (var l = 0; l < lanes.length && picks.length < 6; l++) {
        var w = lanes[l][depth];
        if (w && w.coverImage) { picks.push(w); added = true; }
      }
      if (!added) break;
      depth++;
    }
    if (!picks.length) { $id('heroFrame').hidden = true; return; }

    stack.innerHTML = picks.map(function (w, i) {
      return '<div class="hero-slide' + (i === 0 ? ' is-active' : '') + '">'
        + P.frameHTML(w, { eager: i < 4, alt: 'Frame from ' + w.title })
        + '</div>';
    }).join('');
    stack.setAttribute('role', 'button');
    stack.setAttribute('tabindex', '0');

    var slides = stack.querySelectorAll('.hero-slide');
    var idx = 0, timer = null, paused = false, inView = true, started = false;
    var canvas = $id('heroScopeCanvas');
    var scope = (R && canvas) ? new R.Scope(canvas, { labels: true, gain: 1 }) : null;

    // the frame on screen plays its video (a film's trailer) when it has one,
    // otherwise it opens the details
    function caption(i) {
      var w = picks[i];
      setText('heroCapTitle', w.title);
      setText('heroCapMeta', [P.clean(w.role), P.year(w)].filter(Boolean).join(', '));
      setText('heroIdx', (i + 1) + ' / ' + picks.length);
      var v = P.videoOf(w);
      if (v) {
        stack.setAttribute('data-play', v);
        stack.setAttribute('data-title', w.title);
        stack.setAttribute('data-kind', P.videoKind(w));
        stack.setAttribute('data-cursor', P.playCursor(w));
        stack.setAttribute('aria-label', P.playLabel(w));
      } else {
        ['data-play', 'data-title', 'data-kind'].forEach(function (a) { stack.removeAttribute(a); });
        stack.setAttribute('data-cursor', 'Details');
        stack.setAttribute('aria-label', 'Open details for ' + w.title);
      }
    }
    caption(0);

    function read(i, mode) {
      if (!scope) return;
      R.analyze(picks[i].coverImage).then(function (r) {
        if (i !== idx) return;
        if (r) scope.set(r, mode);
        else scope.clear();
      });
    }

    function show(n) {
      var from = slides[idx], to = slides[n];
      if (from === to) return;
      idx = n;
      var g = window.gsap, motion = window.VW && VW.motion;
      var cap = [$id('heroCapTitle'), $id('heroCapMeta'), $id('heroIdx')];
      read(n, motion ? 'morph' : false);
      if (g && motion) {
        to.classList.add('is-active');
        g.fromTo(to, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.inOut' });
        g.to(from, { opacity: 0, duration: 1.2, ease: 'power2.inOut', onComplete: function () { from.classList.remove('is-active'); g.set(from, { clearProps: 'opacity' }); } });
        g.timeline()
          .to(cap, { opacity: 0, duration: 0.3, ease: 'power2.in' })
          .add(function () { caption(n); })
          .to(cap, { opacity: 1, duration: 0.6, ease: 'power3.out' });
      } else {
        from.classList.remove('is-active'); to.classList.add('is-active'); caption(n);
      }
    }
    function tick() { if (!paused && inView && !document.hidden) show((idx + 1) % slides.length); }
    function start() {
      if (started || slides.length < 2) return;
      started = true;
      timer = setInterval(tick, 6500);
    }

    // pause while someone is looking closely
    [stack, canvas].forEach(function (el) {
      if (!el) return;
      el.addEventListener('pointerenter', function () { paused = true; });
      el.addEventListener('pointerleave', function () { paused = false; });
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }, { threshold: 0.2 }).observe(stack);
    }

    // without a video, the hero frame opens its details like any other frame
    // (with one, the shared [data-play] handler in portfolio.js plays it)
    function openCurrent() {
      if (stack.hasAttribute('data-play')) return;
      var w = picks[idx];
      var list = all.filter(function (x) { return x._collId === w._collId; });
      P.open(list.filter(function (x) { return x.id === w.id; })[0] || w, list);
    }
    stack.addEventListener('click', openCurrent);
    stack.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      if (stack.hasAttribute('data-play')) P.play(stack.getAttribute('data-play'), { title: stack.getAttribute('data-title'), kind: stack.getAttribute('data-kind') });
      else openCurrent();
    });

    // Which frame opens the site: a different one each visit, picked from
    // the first four that actually carry colour (a monochrome frame would
    // open on a scope with nothing but a dot — it still plays, just not first).
    var ready = new Promise(function (resolve) {
      if (!R || picks.length < 2) { resolve(0); return; }
      var pool = picks.slice(0, 4);
      var timeout = setTimeout(function () { resolve(null); }, 1500);
      Promise.all(pool.map(function (w) { return R.analyze(w.coverImage); })).then(function (rs) {
        clearTimeout(timeout);
        var ok = [];
        rs.forEach(function (r, i) { if (r && r.chroma >= 0.03) ok.push(i); });
        resolve(ok.length ? ok[Math.floor(Math.random() * ok.length)] : 0);
      });
    }).then(function (s) {
      s = s || 0;
      if (s !== idx) {
        slides[idx].classList.remove('is-active');
        slides[s].classList.add('is-active');
        idx = s;
        caption(s);
      }
      return slides[s].querySelector('img');
    });

    window.VWHero = {
      ready: ready,
      start: start,
      count: slides.length,
      bloom: function () { read(idx, 'bloom'); },
      still: function () { ready.then(function () { read(idx, false); }); }
    };
  })();

  // ── CHAPTERS ───────────────────────────────────────────────────
  (function chapters() {
    var host = $id('chapters');
    if (!host) return;
    var out = '';
    cols.forEach(function (c, ci) {
      var every = P.worksOf(c), works = every.filter(onHome);   // counts and years describe the whole collection
      if (!works.length) return;
      var film = P.isFilm(c);
      var num = P.roman(ci + 1);
      var id = film ? 'film' : (c.id === 'commercial' || !$id(c.id) ? c.id : 'c-' + c.id);
      var span = P.yearSpan(every);
      var head = '<header class="chapter-head">'
        + '<p class="chapter-num" aria-hidden="true">' + num + '</p>'
        + '<h2 class="chapter-title" id="' + esc(id) + '-title" data-split>' + esc(c.name) + '</h2>'
        + '<p class="chapter-meta"><strong>' + every.length + '</strong><span>' + P.noun(every.length, film ? 'film' : 'other') + (span ? ', ' + span : '') + '</span></p>'
        + '</header>';
      var body = '', page = film ? 'film.html' : 'commercial.html' + (c.id === (otherCols[0] && otherCols[0].id) ? '' : '#' + esc(c.id));

      if (film) {
        var lead = works.slice(0, HOME_SCREENINGS), rest = works.slice(HOME_SCREENINGS);
        body += '<div class="screenings">' + lead.map(function (w, i) { return P.screeningHTML(w, { eager: false }); }).join('') + '</div>';
        if (rest.length) {
          body += '<div class="more" data-coll="' + esc(c.id) + '">'
            + '<div class="more-head"><h3 class="more-title">More films</h3></div>'
            + '<div class="more-screen" aria-hidden="true"><div class="frame"></div><div class="palette"></div><p class="more-screen-cap"></p></div>'
            + '<ul class="credits">' + rest.map(P.creditHTML).join('') + '</ul>'
            + '</div>';
        }
      } else {
        var looks = works.slice(0, HOME_LOOKS), more = works.slice(HOME_LOOKS);
        body += '<div class="lookbook">' + looks.map(function (w) { return P.lookHTML(w); }).join('') + '</div>';
        if (more.length) {
          body += '<div class="also"><h3 class="also-title">More ' + esc(String(c.name).toLowerCase()) + ' work</h3>'
            + '<p class="also-list">' + P.runHTML(more) + '</p></div>';
        }
      }
      body += '<div class="chapter-foot"><a class="chapter-link" href="' + page + '" data-transition data-veil="' + esc(c.name) + '">'
        + 'All ' + esc(String(c.name).toLowerCase()) + ' work <small>' + every.length + '</small></a></div>';

      out += '<section class="chapter chapter--' + (film ? 'film' : 'other') + '" id="' + esc(id) + '" data-coll="' + esc(c.id) + '" aria-labelledby="' + esc(id) + '-title">'
        + '<div class="chapter-rail" aria-hidden="true"><span><b>' + num + '</b> ' + esc(c.name) + '</span></div>'
        + '<div class="wrap">' + head + body + '</div>'
        + '</section>';
    });
    host.innerHTML = out;

    // nav + menu labels follow the collection names
    if (filmCols[0]) document.querySelectorAll('[data-nav="film"]').forEach(function (a) { a.firstChild.textContent = filmCols[0].name; });
    if (otherCols[0]) document.querySelectorAll('[data-nav="other"]').forEach(function (a) {
      a.firstChild.textContent = otherCols[0].name;
      a.setAttribute('href', '#' + (otherCols[0].id === 'commercial' ? 'commercial' : otherCols[0].id));
    });
    if (!filmCols.length) document.querySelectorAll('[data-nav="film"]').forEach(function (a) { a.parentNode.removeChild(a); });
    if (!otherCols.length) document.querySelectorAll('[data-nav="other"]').forEach(function (a) { a.parentNode.removeChild(a); });

    // every frame, credit and title opens the details, prev/next within its collection
    Array.prototype.forEach.call(host.querySelectorAll('.chapter'), function (sec) {
      var c = cols.filter(function (x) { return String(x.id) === sec.getAttribute('data-coll'); })[0];
      if (!c) return;
      var list = homeWorks(c);
      P.bindOpen(sec, function (id) {
        return { work: list.filter(function (w) { return String(w.id) === String(id); })[0], list: list };
      });
      var more = sec.querySelector('.more');
      if (more) P.bindScreen(more.querySelector('.credits'), more.querySelector('.more-screen'), list.slice(HOME_SCREENINGS));
    });
  })();

  // ── ABOUT ──────────────────────────────────────────────────────
  if (D.about) {
    if (D.about.photo) {
      var photo = document.querySelector('.about-photo img');
      if (photo) { photo.src = D.about.photo; photo.alt = 'Portrait of ' + NAME; }
    }
    if (D.about.bio) setHTML('about-bio', D.about.bio.map(function (p) { return '<p>' + p + '</p>'; }).join(''));

    var facts = '';
    if (D.contact && D.contact.location) facts += '<div><dt>Based in</dt><dd>' + esc(D.contact.location) + '</dd></div>';
    if (D.about.languages && D.about.languages.length) {
      facts += '<div><dt>Languages</dt><dd>' + D.about.languages.map(function (l) {
        return esc(l.name) + (l.level ? ' <span>(' + esc(String(l.level).toLowerCase()) + ')</span>' : '');
      }).join('<br />') + '</dd></div>';
    }
    var edu = (D.experience || []).filter(function (x) { return /university|college|school|cinema/i.test(x.company || ''); })[0];
    if (edu) facts += '<div><dt>Studied</dt><dd>' + esc(edu.title) + '<br /><span>' + esc(String(edu.company).split('·').pop().trim()) + '</span></dd></div>';
    setHTML('about-facts', facts);

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
      setHTML('skills-grid', D.about.skills.map(function (s) {
        return '<div class="cap"><dt>' + esc(s.category) + '</dt><dd><ul>'
          + (s.items || []).map(function (it) { return '<li>' + esc(it) + '</li>'; }).join('')
          + '</ul></dd></div>';
      }).join(''));
    }
  }

  // ── EXPERIENCE ─────────────────────────────────────────────────
  if (D.experience) {
    setHTML('timeline', D.experience.map(function (x) {
      return '<li class="xp-item">'
        + '<p class="xp-period">' + esc(x.period) + '</p>'
        + '<div class="xp-head"><h3 class="xp-title">' + esc(x.title) + '</h3><span class="xp-company">' + esc(x.company) + '</span></div>'
        + '<div class="xp-detail">' + (x.description ? '<p>' + esc(x.description) + '</p>' : '') + P.tagsHTML(x.tags) + '</div>'
        + '</li>';
    }).join(''));
  }

  // ── CONTACT ────────────────────────────────────────────────────
  if (D.contact) {
    var C = D.contact;
    setText('contact-message', C.message);
    function link(id, href, text) {
      var el = $id(id);
      if (!el) return;
      if (!text) { var row = el.closest('div'); if (row) row.hidden = true; return; }
      if (href) el.href = href;
      el.textContent = text;
    }
    if (C.email) {
      var cta = $id('contact-cta');
      if (cta) cta.href = 'mailto:' + C.email;
      setText('contact-cta-mail', C.email);
      var mm = $id('menu-email');
      if (mm) { mm.href = 'mailto:' + C.email; mm.textContent = C.email; }
    }
    link('contact-phone', 'tel:' + String(C.phone || '').replace(/[^\d+]/g, ''), C.phone);
    link('contact-instagram', 'https://www.instagram.com/' + C.instagram + '/', C.instagram ? '@' + C.instagram : '');
    link('contact-facebook', 'https://www.facebook.com/' + C.facebook, C.facebook ? 'facebook.com/' + C.facebook : '');
    link('contact-website', 'https://' + String(C.website || '').replace(/^https?:\/\//, ''), C.website);
    var loc = $id('contact-location');
    if (loc && C.location) loc.textContent = C.location;
  }

  // ── READINGS + IMAGE LOAD STATES ───────────────────────────────
  P.markLoaded(document);
  if (R) R.mount(document);

})();
