/* ===================================
   VICTOR PORTFOLIO — MOTION ENGINE
   Shared by index.html, works.html and 404.html. Built on GSAP +
   ScrollTrigger + Lenis (loaded from CDN just before this file).
   Every block guards for missing elements, and the whole file falls
   back to a static, fully-visible page when GSAP is unavailable or
   the visitor prefers reduced motion.
=================================== */
(function () {
  'use strict';

  var html = document.documentElement;
  var body = document.body;
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine    = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var motion  = hasGsap && !reduced;

  // ── FIT-TO-WIDTH ─────────────────────────────────────────────
  // The hero name, the footer signature and the 404 mark are sized with
  // a viewport-relative clamp() so they can run edge-to-edge — a value
  // tuned for one font's character widths. A font swap, uppercase, or a
  // narrow viewport can all render them wider than their box, so this
  // re-measures the actual rendered width and scales the font down only
  // if it would otherwise overflow. Runs regardless of motion support,
  // again once webfonts finish swapping in, and on resize.
  (function fitToWidth() {
    var targets = [
      document.getElementById('hero-line1'),
      document.getElementById('footer-name'),
      document.querySelector('.notfound-mark')
    ];
    function fit(el) {
      if (!el || !el.parentElement) return;
      el.style.fontSize = '';
      var avail = el.parentElement.clientWidth;
      var need = el.scrollWidth;
      if (!avail || need <= avail) return;
      var size = parseFloat(window.getComputedStyle(el).fontSize);
      el.style.fontSize = (size * (avail / need) * 0.985) + 'px';
    }
    function fitAll() { targets.forEach(fit); }
    fitAll();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
    var t = null;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(fitAll, 150);
    });
  })();

  var VW = window.VW = { reduced: !motion, lenis: null, bind: bind, swapGrid: swapGrid, motion: motion };

  // ── NO-MOTION PATH ─────────────────────────────────────────────
  // Drop the .js hook so every CSS "hidden until released" state and the
  // veil disappear, then wire up only the essentials.
  if (!motion) {
    html.classList.remove('js');
    html.classList.add('no-motion');
    staticNav();
    clock();
    return;
  }

  html.classList.add('has-motion');
  if (fine) html.classList.add('fine-pointer');

  var gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);
  gsap.defaults({ ease: 'power3.out', duration: 1 });

  // ── SMOOTH SCROLL ──────────────────────────────────────────────
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    VW.lenis = lenis;
  }

  function scrollTo(target, opts) {
    if (lenis) lenis.scrollTo(target, Object.assign({ duration: 1.5, easing: function (t) { return 1 - Math.pow(1 - t, 4); } }, opts || {}));
    else if (typeof target === 'number') window.scrollTo({ top: target, behavior: 'smooth' });
    else if (target && target.scrollIntoView) target.scrollIntoView({ behavior: 'smooth' });
  }

  // in-page anchors go through Lenis
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (!id) return;
    var el = document.getElementById(id);
    if (!el && id !== 'top') return;
    e.preventDefault();
    closeMenu();
    if (id === 'hero' || id === 'top') scrollTo(0);
    else scrollTo(el, { offset: -8 });
  });

  // ── VEIL: loader / page transitions ───────────────────────────
  var veil = $('#veil');
  var veilInner = veil ? $$('.veil-top, .veil-bottom, .veil-bar', veil) : [];
  var isHome = !!$('#hero');
  var seen = false;
  try { seen = !!sessionStorage.getItem('vw_seen'); sessionStorage.setItem('vw_seen', '1'); sessionStorage.removeItem('vw_transition'); } catch (e) {}

  // Full loader only on the first homepage visit of the session.
  var fullLoader = isHome && !seen;

  function prepareVeilName() {
    var nameEl = $('#veilName');
    if (!nameEl) return [];
    var words = nameEl.textContent.trim().split(/\s+/);
    nameEl.innerHTML = words.map(function (w) { return '<span class="w"><span>' + w + '</span></span>'; }).join('');
    return $$('.w > span', nameEl);
  }

  function runVeil(done) {
    if (!veil) { done(); return; }
    if (!fullLoader) {
      gsap.set(veilInner, { opacity: 0 });
      gsap.to(veil, { yPercent: -100, duration: 1, ease: 'expo.inOut', delay: 0.1, onComplete: function () { gsap.set(veil, { display: 'none' }); } });
      gsap.delayedCall(0.35, done);
      return;
    }
    var spans = prepareVeilName();
    var count = { v: 0 }, countEl = $('#veilCount'), bar = $('#veilBar');
    var tl = gsap.timeline();
    tl.fromTo(spans, { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 1.1, stagger: 0.09, ease: 'power4.out' }, 0)
      .to(count, { v: 100, duration: 1.6, ease: 'power2.inOut', onUpdate: function () { if (countEl) countEl.textContent = (count.v < 10 ? '0' : '') + Math.round(count.v); } }, 0.1)
      .to(bar, { scaleX: 1, duration: 1.6, ease: 'power2.inOut' }, 0.1)
      .to(veilInner, { opacity: 0, duration: 0.4, ease: 'power2.in' }, 1.8)
      .to(veil, { yPercent: -100, duration: 1.15, ease: 'expo.inOut', onComplete: function () { gsap.set(veil, { display: 'none' }); } }, 1.9)
      .add(done, 2.2);
  }

  // Outbound transition for internal links marked data-transition
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-transition]');
    if (!a || !veil || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;
    e.preventDefault();
    closeMenu();
    try { sessionStorage.setItem('vw_transition', '1'); } catch (err) {}
    gsap.set(veilInner, { opacity: 0 });
    gsap.set(veil, { display: 'flex', yPercent: 100 });
    gsap.to(veil, { yPercent: 0, duration: 0.8, ease: 'expo.inOut', onComplete: function () { window.location.href = href; } });
  });
  // Coming back through bfcache with the veil still up
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && veil) gsap.to(veil, { yPercent: -100, duration: 0.8, ease: 'expo.inOut', onComplete: function () { gsap.set(veil, { display: 'none' }); } });
  });

  // ── CURSOR ─────────────────────────────────────────────────────
  (function cursor() {
    if (!fine) return;
    var dot = $('.cursor'), label = $('.cursor-label'), labelText = label && $('span', label);
    if (!dot || !label) return;
    var dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
    var dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
    var lx = gsap.quickTo(label, 'x', { duration: 0.5, ease: 'power3' });
    var ly = gsap.quickTo(label, 'y', { duration: 0.5, ease: 'power3' });
    var first = true;
    document.addEventListener('mousemove', function (e) {
      if (first) { gsap.set([dot, label], { x: e.clientX, y: e.clientY }); html.classList.add('cursor-on'); first = false; }
      dx(e.clientX); dy(e.clientY); lx(e.clientX); ly(e.clientY);
    }, { passive: true });
    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest ? e.target.closest('[data-cursor]') : null;
      if (t) { labelText.textContent = t.getAttribute('data-cursor'); html.classList.add('cursor-has-label'); }
      else html.classList.remove('cursor-has-label');
      html.classList.toggle('cursor-hover', !!(e.target.closest && e.target.closest('a, button, .col-tab, [data-magnetic]')));
    });
    document.addEventListener('mouseleave', function () { html.classList.remove('cursor-on'); });
    document.addEventListener('mouseenter', function () { if (!first) html.classList.add('cursor-on'); });
    document.addEventListener('mousedown', function () { html.classList.add('cursor-down'); });
    document.addEventListener('mouseup', function () { html.classList.remove('cursor-down'); });
  })();

  // ── NAV ────────────────────────────────────────────────────────
  var nav = $('#navbar');
  var menuOpen = false;
  (function navBehaviour() {
    if (!nav) return;
    var last = 0;
    var onScroll = function (y) {
      if (menuOpen) return;
      var down = y > last && y > 120;
      nav.classList.toggle('is-hidden', down);
      nav.classList.toggle('is-scrolled', y > 40);
      last = y;
    };
    if (lenis) lenis.on('scroll', function (e) { onScroll(e.scroll); });
    else window.addEventListener('scroll', function () { onScroll(window.scrollY); }, { passive: true });

    // active link — sections that have a matching nav link
    var links = $$('.nav-links a');
    links.forEach(function (a) {
      var id = (a.getAttribute('href') || '').replace(/^.*#/, '');
      var sec = id && document.getElementById(id);
      if (!sec) return;
      ST.create({
        trigger: sec, start: 'top 45%', end: 'bottom 45%',
        onToggle: function (self) { if (self.isActive) links.forEach(function (l) { l.classList.toggle('active', l === a); }); }
      });
    });
  })();

  // mobile menu
  var overlay = $('#menuOverlay'), menuBtn = $('#menuBtn');
  function openMenu() {
    if (!overlay || menuOpen) return;
    menuOpen = true;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    body.classList.add('menu-open');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
    nav.classList.remove('is-hidden');
    if (lenis) lenis.stop();
    gsap.timeline()
      .to(overlay, { clipPath: 'inset(0 0 0% 0)', duration: 0.9, ease: 'expo.inOut' }, 0)
      .fromTo($$('li a', overlay), { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 1, stagger: 0.07, ease: 'power4.out' }, 0.35)
      .fromTo($('.menu-foot', overlay), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6 }, 0.7);
  }
  function closeMenu() {
    if (!overlay || !menuOpen) return;
    menuOpen = false;
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    gsap.timeline({ onComplete: function () {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        body.classList.remove('menu-open');
        if (lenis) lenis.start();
      } })
      .to($$('li a', overlay), { yPercent: 110, duration: 0.5, stagger: 0.04, ease: 'power3.in' }, 0)
      .to($('.menu-foot', overlay), { opacity: 0, duration: 0.3 }, 0)
      .to(overlay, { clipPath: 'inset(0 0 100% 0)', duration: 0.7, ease: 'expo.inOut' }, 0.2);
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { menuOpen ? closeMenu() : openMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', function () { if (window.innerWidth > 900) closeMenu(); });

  clock();

  // ── TEXT SPLITTING ─────────────────────────────────────────────
  function wrapWords(el) {
    // Wrap every word in <span class="wd">, keeping inline formatting
    // (em/strong) by cloning the tag around each word.
    var frag = document.createDocumentFragment();
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (tok) {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
          var s = document.createElement('span'); s.className = 'wd'; s.textContent = tok; frag.appendChild(s);
        });
      } else if (node.nodeType === 1) {
        var tag = node.tagName.toLowerCase();
        node.textContent.split(/(\s+)/).forEach(function (tok) {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement(tag); w.className = 'wd'; w.textContent = tok;
          if (node.className) w.className += ' ' + node.className;
          frag.appendChild(w);
        });
      }
    });
    el.innerHTML = '';
    el.appendChild(frag);
    return $$('.wd', el);
  }

  function splitLines(el) {
    if (!el.__orig) el.__orig = el.innerHTML;
    el.innerHTML = el.__orig;
    var words = wrapWords(el);
    if (!words.length) return [];
    // group by rendered line
    var lines = [], cur = null, top = null;
    words.forEach(function (w) {
      var t = w.offsetTop;
      if (top === null || Math.abs(t - top) > 2) { top = t; cur = []; lines.push(cur); }
      cur.push(w);
    });
    var frag = document.createDocumentFragment();
    lines.forEach(function (ws) {
      var line = document.createElement('span'); line.className = 'split-line';
      var inner = document.createElement('span'); inner.className = 'split-inner';
      ws.forEach(function (w, i) { if (i) inner.appendChild(document.createTextNode(' ')); inner.appendChild(w); });
      line.appendChild(inner);
      frag.appendChild(line);
    });
    el.innerHTML = '';
    el.appendChild(frag);
    return $$('.split-inner', el);
  }

  // ── BINDINGS (re-runnable for dynamic content) ─────────────────
  var refreshQueued = false;
  function queueRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(function () { refreshQueued = false; ST.refresh(); });
  }

  function bind(root) {
    root = root || document;
    var fresh = function (sel) { return $$(sel, root).filter(function (el) { return !el.__bound; }); };
    var mark = function (el) { el.__bound = true; };

    // simple fade-up
    fresh('[data-reveal]').forEach(function (el, i) {
      mark(el);
      gsap.to(el, { opacity: 1, y: 0, duration: 1.1, delay: (i % 6) * 0.06, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });

    // headline lines rising from a mask
    fresh('[data-split="lines"]').forEach(function (el) {
      mark(el);
      var inners = splitLines(el);
      gsap.set(inners, { yPercent: 110 });
      el.style.visibility = 'visible';
      gsap.to(inners, { yPercent: 0, duration: 1.3, stagger: 0.11, ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      el.__resplit = true;
    });

    // paragraph words brightening as you read down
    fresh('[data-split="words"]').forEach(function (el) {
      mark(el);
      var words = wrapWords(el);
      el.style.visibility = 'visible';
      gsap.fromTo(words, { opacity: 0.16 }, { opacity: 1, stagger: 0.02, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 55%', scrub: 0.5 } });
    });

    // images sliding out of a clip with a settle
    fresh('.reveal-img').forEach(function (el) {
      mark(el);
      var img = $('img', el);
      var tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
      tl.to(el, { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'expo.out' }, 0);
      if (img) tl.to(img, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0);
    });

    // work cards: clip reveal + inner parallax + body fade
    fresh('.work-card').forEach(function (card, i) {
      mark(card);
      var media = $('.work-media', card), inner = $('.work-media-inner', card), bodyEl = $('.work-body', card);
      gsap.set(media, { clipPath: 'inset(0 0 100% 0)' });
      if (bodyEl) gsap.set(bodyEl.children, { opacity: 0, y: 18 });
      var tl = gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 88%', once: true }, delay: (i % 4) * 0.08 });
      tl.to(media, { clipPath: 'inset(0 0 0% 0)', duration: 1.4, ease: 'expo.out' }, 0);
      if (bodyEl) tl.to(bodyEl.children, { opacity: 1, y: 0, duration: 0.9, stagger: 0.07, ease: 'power3.out' }, 0.35);
      if (inner) {
        gsap.fromTo(inner, { yPercent: -7 }, { yPercent: 7, ease: 'none',
          scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true } });
      }
    });

    // archive rows
    fresh('.work-row').forEach(function (row, i) {
      mark(row);
      gsap.fromTo(row, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, delay: (i % 8) * 0.05, ease: 'power3.out',
        scrollTrigger: { trigger: row, start: 'top 94%', once: true } });
    });

    // experience + skills rows
    fresh('.xp-row, .skill-line').forEach(function (row) {
      mark(row);
      gsap.to(row.children, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out',
        scrollTrigger: { trigger: row, start: 'top 90%', once: true } });
    });

    // magnetic buttons
    if (fine) fresh('[data-magnetic]').forEach(function (el) {
      mark(el);
      var xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
      var yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.28);
      });
      el.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
    });

    queueRefresh();
  }

  // Swap a grid's contents with a fade-out / rebuild / staggered reveal
  function swapGrid(gridEl, renderFn) {
    var kids = Array.prototype.slice.call(gridEl.children);
    gsap.to(kids, { opacity: 0, y: -14, duration: 0.35, stagger: 0.03, ease: 'power2.in', onComplete: function () {
      renderFn();
      bind(gridEl);
    } });
  }

  // re-split headlines when the viewport width changes
  var lastW = window.innerWidth, rsT = null;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    clearTimeout(rsT);
    rsT = setTimeout(function () {
      $$('[data-split="lines"]').forEach(function (el) {
        if (!el.__resplit) return;
        var inners = splitLines(el);
        gsap.set(inners, { yPercent: 0 });
      });
      ST.refresh();
    }, 250);
  });

  // ── HERO ───────────────────────────────────────────────────────
  var hero = $('#hero');
  function heroIntro() {
    if (!hero) return;
    var grade = $('#grade');
    var chars = $$('.hero-word .ch');
    var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    if (grade) {
      tl.set(grade, { opacity: 1 }, 0)
        .fromTo(grade, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.4, ease: 'expo.out' }, 0)
        .fromTo($$('.grade-slide.is-active img', grade), { scale: 1.28 }, { scale: 1.06, duration: 2, ease: 'expo.out' }, 0);
    }
    tl.fromTo(chars, { yPercent: 115, y: 0, rotate: 4 }, { yPercent: 0, y: 0, rotate: 0, duration: 1.4, stagger: 0.045, ease: 'power4.out' }, 0.2)
      .to('.hero-label', { opacity: 1, duration: 0.8 }, 0.6)
      .fromTo('.hero-desc', { y: 18 }, { opacity: 1, y: 0, duration: 1 }, 0.8)
      .to('.hero-media figcaption', { opacity: 1, duration: 0.8 }, 1)
      .fromTo('.hero-foot', { y: 12 }, { opacity: 1, y: 0, duration: 1 }, 1.05)
      .add(function () {
        if (window.VWHero) VWHero.start();
      }, 1.9);

    // scroll parallax within the hero
    var title = $('.hero-title'), media = $('.hero-media');
    if (title) gsap.to(title, { yPercent: -28, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    if (media) gsap.to(media, { y: 90, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });

    // pointer parallax — media drifts against the wordmark
    if (fine && media && title) {
      var mx = gsap.quickTo(media, 'x', { duration: 1.2, ease: 'power3' });
      var tx = gsap.quickTo(title, 'x', { duration: 1.4, ease: 'power3' });
      hero.addEventListener('mousemove', function (e) {
        var nx = (e.clientX / window.innerWidth - 0.5) * 2;
        mx(nx * 14); tx(nx * -8);
      });
    }
  }

  // ── TICKER ─────────────────────────────────────────────────────
  (function ticker() {
    var track = $('#tickerTrack');
    if (!track || !track.children.length) return;
    var base = track.innerHTML, set = base, guard = 0;
    track.innerHTML = set;
    while (track.scrollWidth < window.innerWidth * 1.2 && guard++ < 10) { set += base; track.innerHTML = set; }
    track.innerHTML = set + set;
    var tween = gsap.to(track, { xPercent: -50, duration: Math.max(20, track.scrollWidth / 2 / 70), ease: 'none', repeat: -1 });
    if (lenis) {
      var calm = null;
      lenis.on('scroll', function (e) {
        var boost = 1 + Math.min(Math.abs(e.velocity) / 18, 3.5);
        gsap.to(tween, { timeScale: boost, duration: 0.2, overwrite: true });
        clearTimeout(calm);
        calm = setTimeout(function () { gsap.to(tween, { timeScale: 1, duration: 1.4, ease: 'power2.out', overwrite: true }); }, 120);
      });
    }
  })();

  // ── VELOCITY SKEW on the works grid ────────────────────────────
  (function skew() {
    var grid = $('.works-editorial');
    if (!grid || !lenis) return;
    var to = gsap.quickTo(grid, 'skewY', { duration: 0.6, ease: 'power3' });
    lenis.on('scroll', function (e) { to(gsap.utils.clamp(-1.4, 1.4, e.velocity / 50)); });
  })();

  // ── FOOTER NAME rises in ───────────────────────────────────────
  (function footerName() {
    var el = $('.footer-name'), foot = $('.footer');
    if (!el || !foot) return;
    gsap.fromTo(el, { yPercent: 45, opacity: 0 }, { yPercent: 0, opacity: 1, ease: 'none',
      scrollTrigger: { trigger: foot, start: 'top 95%', end: 'top 45%', scrub: true } });
  })();

  // ── BOOT ───────────────────────────────────────────────────────
  function boot() {
    bind(document);
    runVeil(function () {
      heroIntro();
      ST.refresh();
    });
  }
  // wait for the webfonts (bounded) so line splitting measures the real metrics
  var booted = false;
  var go = function () { if (booted) return; booted = true; boot(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
  setTimeout(go, 1800);

  // ── SHARED HELPERS ─────────────────────────────────────────────
  function clock() {
    var el = $('#navClock span');
    if (!el) return;
    var fmt;
    try { fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Vancouver', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }); } catch (e) { fmt = null; }
    var tick = function () {
      var d = new Date();
      var t = fmt ? fmt.format(d).replace(/^24/, '00') : d.toTimeString().slice(0, 8);
      var f = Math.floor(d.getMilliseconds() / 1000 * 24);
      el.textContent = 'VAN ' + t + ':' + (f < 10 ? '0' : '') + f;
    };
    tick();
    setInterval(tick, 1000 / 24);
  }

  function staticNav() {
    var navEl = $('#navbar'), btn = $('#menuBtn'), ov = $('#menuOverlay');
    var open = false;
    if (btn && ov) {
      btn.addEventListener('click', function () {
        open = !open;
        ov.classList.toggle('open', open);
        ov.style.clipPath = open ? 'inset(0 0 0% 0)' : '';
        ov.setAttribute('aria-hidden', open ? 'false' : 'true');
        $$('li a', ov).forEach(function (a) { a.style.transform = open ? 'none' : ''; });
        body.classList.toggle('menu-open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      $$('a', ov).forEach(function (a) { a.addEventListener('click', function () { if (open) btn.click(); }); });
    }
    if (navEl) {
      var last = 0;
      window.addEventListener('scroll', function () {
        var y = window.scrollY;
        navEl.classList.toggle('is-hidden', y > last && y > 120 && !open);
        navEl.classList.toggle('is-scrolled', y > 40);
        last = y;
      }, { passive: true });
    }
    // Hero images: start the slideshow
    if (window.VWHero) VWHero.start();
  }
})();
