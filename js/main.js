/* ===================================
   VICTOR PORTFOLIO — MOTION ENGINE (v4)
   Shared by every public page. GSAP + ScrollTrigger + Lenis from the CDN.

   Motion is spent in a few deliberate places:
   · the opening: a title card, then the hero frame opens like projector
     masking (slit → 2.39 scope → full frame) while its vectorscope
     blooms out of the centre
   · film frames open the same way when they first come on screen
   · chapter titles rise from a mask, like a title card
   Everything else either answers an action (panel, viewer, menu, credits
   screen) or doesn't move. Commercial frames simply cut in.

   Falls back to a complete static page when GSAP is missing or the
   visitor prefers reduced motion.
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
  // The hero name and the 404 mark are sized with viewport units; if a
  // font swap or a long name renders them wider than their grid area,
  // scale the font down to fit rather than letting them collide.
  (function fitToWidth() {
    var targets = [document.getElementById('hero-line1'), $('.notfound-mark'), $('.contact-mail')];
    function fit(el) {
      if (!el) return;
      el.style.fontSize = '';
      // .contact-mail sizes to its text, so measure it against its section
      var avail = el.classList.contains('contact-mail') ? el.parentElement.clientWidth - parseFloat(getComputedStyle(el.parentElement).paddingLeft) * 2 : el.clientWidth;
      var need = el.scrollWidth;
      if (!avail || need <= avail + 1) return;
      var size = parseFloat(window.getComputedStyle(el).fontSize);
      el.style.fontSize = (size * (avail / need) * 0.985) + 'px';
    }
    function fitAll() { targets.forEach(fit); }
    fitAll();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
    var t = null;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fitAll, 150); });
  })();

  var VW = window.VW = { reduced: !motion, motion: motion, lenis: null, bind: function () {} };

  // ── NO-MOTION PATH ─────────────────────────────────────────────
  if (!motion) {
    html.classList.remove('js');
    html.classList.add('no-motion');
    staticNav();
    clock();
    if (window.VWHero) VWHero.still();
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
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 });
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
    else scrollTo(el, { offset: id === 'film' || id === 'commercial' ? -24 : -16 });
  });

  // ── VEIL: title card on arrival, curtain on the way out ────────
  var veil = $('#veil');
  var veilTitle = $('#veilTitle');
  var isHome = !!$('#hero');
  var seen = false, arriving = false;
  try {
    seen = !!sessionStorage.getItem('vw_seen');
    arriving = !!sessionStorage.getItem('vw_transition');
    sessionStorage.setItem('vw_seen', '1');
    sessionStorage.removeItem('vw_transition');
  } catch (e) {}

  function lift(done) {
    gsap.to(veil, { yPercent: -100, duration: 1, ease: 'expo.inOut', onComplete: function () { gsap.set(veil, { display: 'none' }); } });
    gsap.delayedCall(0.4, done);
  }
  function runVeil(done) {
    if (!veil) { done(); return; }
    gsap.set(veil, { animation: 'none' });
    if (!veilTitle) { lift(done); return; }
    if (arriving) {
      // the title card from the last page is already up: hold it, then cut
      gsap.set(veilTitle, { opacity: 1 });
      gsap.timeline()
        .to(veilTitle, { opacity: 0, duration: 0.3, ease: 'power2.in' }, 0.35)
        .add(function () { lift(done); });
      return;
    }
    if (isHome && !seen) {
      // first visit: the opening title card
      gsap.timeline()
        .fromTo(veilTitle, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' })
        .to(veilTitle, { opacity: 0, duration: 0.35, ease: 'power2.in' }, '+=0.85')
        .add(function () { lift(done); });
      return;
    }
    gsap.set(veilTitle, { opacity: 0 });
    lift(done);
  }

  // outbound: internal links marked data-transition drop the curtain and
  // raise the destination's title card before the browser moves on
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-transition]');
    if (!a || !veil || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;
    e.preventDefault();
    closeMenu();
    var label = a.getAttribute('data-veil') || '';
    try { if (label) sessionStorage.setItem('vw_transition', '1'); } catch (err) {}
    if (veilTitle) { veilTitle.textContent = label; gsap.set(veilTitle, { opacity: 0, y: 0 }); }
    gsap.set(veil, { display: 'grid', yPercent: 100, visibility: 'visible' });
    gsap.timeline({ onComplete: function () { window.location.href = href; } })
      .to(veil, { yPercent: 0, duration: 0.75, ease: 'expo.inOut' }, 0)
      .to(veilTitle, { opacity: label ? 1 : 0, duration: 0.3, ease: 'power2.out' }, 0.55);
  });
  // coming back through the bfcache with the curtain still down
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted || !veil) return;
    try { sessionStorage.removeItem('vw_transition'); } catch (err) {}
    gsap.to(veilTitle, { opacity: 0, duration: 0.2 });
    gsap.to(veil, { yPercent: -100, duration: 0.8, ease: 'expo.inOut', delay: 0.1, onComplete: function () { gsap.set(veil, { display: 'none' }); } });
  });

  // ── CURSOR ─────────────────────────────────────────────────────
  (function cursor() {
    if (!fine) return;
    var dot = $('.cursor'), label = $('.cursor-label'), labelText = label && $('span', label);
    if (!dot || !label) return;
    var dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
    var dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
    var lx = gsap.quickTo(label, 'x', { duration: 0.45, ease: 'power3' });
    var ly = gsap.quickTo(label, 'y', { duration: 0.45, ease: 'power3' });
    var first = true;
    document.addEventListener('mousemove', function (e) {
      if (first) { gsap.set([dot, label], { x: e.clientX, y: e.clientY }); html.classList.add('cursor-on'); first = false; }
      dx(e.clientX); dy(e.clientY); lx(e.clientX); ly(e.clientY);
    }, { passive: true });
    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest ? e.target.closest('[data-cursor]') : null;
      if (t && !t.closest('.work-modal, .viewer')) { labelText.textContent = t.getAttribute('data-cursor'); html.classList.add('cursor-has-label'); }
      else html.classList.remove('cursor-has-label');
      html.classList.toggle('cursor-hover', !!(e.target.closest && e.target.closest('a, button, [role="button"]')));
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
      nav.classList.toggle('is-hidden', y > last && y > 160);
      nav.classList.toggle('is-scrolled', y > 40);
      last = y;
    };
    if (lenis) lenis.on('scroll', function (e) { onScroll(e.scroll); });
    else window.addEventListener('scroll', function () { onScroll(window.scrollY); }, { passive: true });

    // the link for the section on screen
    var links = $$('.nav-links a');
    links.forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (href.charAt(0) !== '#') return;
      var sec = document.getElementById(href.slice(1));
      if (!sec) return;
      ST.create({
        trigger: sec, start: 'top 45%', end: 'bottom 45%',
        onToggle: function (self) {
          if (self.isActive) links.forEach(function (l) { l.classList.toggle('active', l === a); });
          else a.classList.remove('active');
        }
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
    if (menuBtn) { menuBtn.setAttribute('aria-expanded', 'true'); menuBtn.setAttribute('aria-label', 'Close menu'); }
    if (nav) nav.classList.remove('is-hidden');
    if (lenis) lenis.stop();
    gsap.timeline()
      .to(overlay, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.inOut' }, 0)
      .fromTo($$('li a', overlay), { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 1, stagger: 0.06, ease: 'power4.out' }, 0.3)
      .fromTo($('.menu-foot', overlay), { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.7);
  }
  function closeMenu() {
    if (!overlay || !menuOpen) return;
    menuOpen = false;
    if (menuBtn) { menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Open menu'); }
    gsap.timeline({ onComplete: function () {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        body.classList.remove('menu-open');
        if (lenis) lenis.start();
      } })
      .to($$('li a', overlay), { yPercent: 110, y: 0, duration: 0.45, stagger: 0.03, ease: 'power3.in' }, 0)
      .to($('.menu-foot', overlay), { opacity: 0, duration: 0.3 }, 0)
      .to(overlay, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.7, ease: 'expo.inOut' }, 0.2);
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { menuOpen ? closeMenu() : openMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', function () { if (window.innerWidth > 900) closeMenu(); });

  clock();

  // ── TEXT SPLITTING (chapter titles) ────────────────────────────
  function splitLines(el) {
    if (!el.__orig) el.__orig = el.innerHTML;
    el.innerHTML = el.__orig;
    var words = [];
    var frag = document.createDocumentFragment();
    el.textContent.split(/(\s+)/).forEach(function (tok) {
      if (!tok) return;
      if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
      var s = document.createElement('span'); s.textContent = tok; s.style.display = 'inline-block';
      words.push(s); frag.appendChild(s);
    });
    el.innerHTML = '';
    el.appendChild(frag);
    var lines = [], cur = null, top = null;
    words.forEach(function (w) {
      var t = w.offsetTop;
      if (top === null || Math.abs(t - top) > 2) { top = t; cur = []; lines.push(cur); }
      cur.push(w);
    });
    el.innerHTML = '';
    lines.forEach(function (ws) {
      var line = document.createElement('span'); line.className = 'split-line';
      var inner = document.createElement('span'); inner.className = 'split-inner';
      ws.forEach(function (w, i) { if (i) inner.appendChild(document.createTextNode(' ')); inner.appendChild(w); });
      line.appendChild(inner);
      el.appendChild(line);
    });
    return $$('.split-inner', el);
  }

  // ── BINDINGS (re-runnable for content rendered later) ──────────
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

    // chapter titles: lines rise out of a mask
    fresh('[data-split]').forEach(function (el) {
      mark(el);
      var inners = splitLines(el);
      gsap.set(inners, { yPercent: 105, y: 0 });
      el.style.visibility = 'visible';
      gsap.to(inners, { yPercent: 0, y: 0, duration: 1.4, stagger: 0.1, ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
      el.__resplit = true;
    });

    // film frames: projector masking — a slit, the 2.39 scope frame, then full
    fresh('.frame--film').forEach(function (fr) {
      mark(fr);
      var scopeInset = ((1 - (16 / 9) / 2.39) / 2 * 100).toFixed(2) + '%';
      gsap.set(fr, { clipPath: 'inset(50% 0% 50% 0%)' });
      var tl = gsap.timeline({ paused: true });
      tl.to(fr, { clipPath: 'inset(' + scopeInset + ' 0% ' + scopeInset + ' 0%)', duration: 1.05, ease: 'expo.out' })
        .to(fr, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.95, ease: 'power3.inOut' }, '+=0.18');
      ST.create({ trigger: fr, start: 'top 82%', once: true, onEnter: function () { tl.play(); } });
    });

    // magnetic buttons
    if (fine) fresh('[data-magnetic]').forEach(function (el) {
      mark(el);
      var xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
      var yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.22);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.22);
      });
      el.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
    });

    queueRefresh();
  }
  VW.bind = bind;

  // re-split titles when the viewport width changes
  var lastW = window.innerWidth, rsT = null;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    clearTimeout(rsT);
    rsT = setTimeout(function () {
      $$('[data-split]').forEach(function (el) {
        if (!el.__resplit) return;
        gsap.set(splitLines(el), { yPercent: 0, y: 0 });
      });
      ST.refresh();
    }, 250);
  });

  // ── HERO: the one orchestrated moment ─────────────────────────
  function heroIntro() {
    var hero = $('#hero');
    if (!hero) return;
    var stack = $('#heroStack');
    var scopeInset = ((1 - (16 / 9) / 2.39) / 2 * 100).toFixed(2) + '%';
    var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    if (stack) {
      tl.fromTo(stack, { clipPath: 'inset(50% 0% 50% 0%)' }, { clipPath: 'inset(' + scopeInset + ' 0% ' + scopeInset + ' 0%)', duration: 1.05, ease: 'expo.out' }, 0)
        .to(stack, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.95, ease: 'power3.inOut' }, 1.2);
    }
    tl.to('.hero-scope', { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0.35)
      .add(function () { if (window.VWHero) VWHero.bloom(); }, 0.35)
      .fromTo('.hero-name .ch', { yPercent: 105, y: 0 }, { yPercent: 0, y: 0, duration: 1.35, stagger: 0.045 }, 0.55)
      .fromTo(['.hero-cap', '.hero-text', '.hero-actions'], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: 'power3.out' }, 1.35)
      .add(function () { if (window.VWHero) VWHero.start(); }, 2.6);
  }

  // ── BOOT ───────────────────────────────────────────────────────
  function boot() {
    bind(document);
    runVeil(function () {
      heroIntro();
      ST.refresh();
    });
  }
  // wait (bounded) for webfonts, so split lines measure real metrics, and
  // for the first hero frame, so the masking opens on a picture
  var booted = false;
  var go = function () { if (booted) return; booted = true; boot(); };
  var waits = [];
  if (document.fonts && document.fonts.ready) waits.push(document.fonts.ready);
  if (window.VWHero && VWHero.ready) {
    waits.push(VWHero.ready.then(function (img) { return img && img.decode ? img.decode().catch(function () {}) : null; }));
  }
  Promise.all(waits).then(go, go);
  setTimeout(go, 2600);

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
        navEl.classList.toggle('is-hidden', y > last && y > 160 && !open);
        navEl.classList.toggle('is-scrolled', y > 40);
        last = y;
      }, { passive: true });
    }
  }
})();
