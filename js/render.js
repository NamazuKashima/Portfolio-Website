(function () {
  var D = window.PORTFOLIO_DATA;
  if (!D) return;

  // ── UTILS ──────────────────────────────────────────────────────
  function $id(id) { return document.getElementById(id); }
  function setText(id, val) { var el = $id(id); if (el && val != null) el.textContent = val; }
  function setHTML(id, val) { var el = $id(id); if (el && val != null) el.innerHTML = val; }

  // ── META ───────────────────────────────────────────────────────
  if (D.meta) document.title = D.meta.siteTitle || 'Victor — Portfolio';

  // ── HERO ───────────────────────────────────────────────────────
  if (D.hero) {
    setText('hero-label', D.hero.label);
    setText('hero-line1', D.hero.line1);
    setText('hero-line2', D.hero.line2);
    setText('hero-desc',  D.hero.description);

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
    if (D.footer.logo) {
      setText('nav-logo',    D.footer.logo);   // top-left logo
      setText('footer-logo', D.footer.logo);   // bottom logo
    }
    if (D.footer.copyright) setText('footer-copy', D.footer.copyright);
  }

  // ── SHOWREEL LIGHTBOX ──────────────────────────────────────────
  function toEmbedUrl(url) {
    var m;
    // YouTube: youtu.be/ID  |  youtube.com/watch?v=ID  |  /embed/ID  |  /shorts/ID
    m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
    if (m) return 'https://www.youtube.com/embed/' + m[1] + '?autoplay=1&rel=0&modestbranding=1';

    // Vimeo: vimeo.com/ID  |  vimeo.com/ID/HASH (unlisted)  |  player.vimeo.com/video/ID
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([\w]+))?/);
    if (m) {
      var src = 'https://player.vimeo.com/video/' + m[1] + '?autoplay=1&title=0&byline=0&portrait=0';
      if (m[2]) src += '&h=' + m[2];
      return src;
    }

    // Direct video file
    if (/\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url)) return { video: url };

    return null;
  }

  function setupReelLightbox(trigger, url) {
    var modal   = $id('reelModal');
    var frame   = $id('reelFrame');
    var closeBt = $id('reelClose');
    var backdrop= $id('reelBackdrop');
    if (!modal || !frame) return;

    var embed = toEmbedUrl(url);

    trigger.addEventListener('click', function(e) {
      // Unrecognized link (portfolio site, Frame.io, etc.) → open normally
      if (!embed) { trigger.target = '_blank'; trigger.rel = 'noopener'; return; }
      e.preventDefault();
      frame.innerHTML = embed.video
        ? '<video src="' + embed.video + '" controls autoplay playsinline></video>'
        : '<iframe src="' + embed + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    });

    function close() {
      modal.classList.remove('open');
      frame.innerHTML = '';               // stops playback
      document.body.style.overflow = '';
    }
    if (closeBt)  closeBt.onclick  = close;
    if (backdrop) backdrop.onclick = close;
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) close();
    });
  }

  // ── ABOUT ──────────────────────────────────────────────────────
  if (D.about) {
    if (D.about.photo) {
      var avatarEl = document.querySelector('.about-avatar');
      if (avatarEl) {
        avatarEl.innerHTML = '<img src="' + D.about.photo + '" alt="Portrait" style="width:100%;height:100%;object-fit:cover;" />';
      }
    }
    if (D.about.bio) {
      setHTML('about-bio', D.about.bio.map(function(p) {
        return '<p class="about-bio">' + p + '</p>';
      }).join(''));
    }
    // Download CV button — only shown when a file/URL is set
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
      setHTML('skills-grid', D.about.skills.map(function(s) {
        return '<div class="skill-group">'
          + '<h4>' + s.category + '</h4>'
          + '<ul>' + s.items.map(function(i) { return '<li>' + i + '</li>'; }).join('') + '</ul>'
          + '</div>';
      }).join(''));
    }
  }

  // ── PORTFOLIO ──────────────────────────────────────────────────
  renderPortfolio();

  // ── EXPERIENCE ─────────────────────────────────────────────────
  if (D.experience) {
    setHTML('timeline', D.experience.map(function(exp) {
      return '<div class="timeline-item">'
        + '<div class="timeline-dot"></div>'
        + '<div class="timeline-date">' + exp.period + '</div>'
        + '<div class="timeline-content">'
        + '<h3>' + exp.title + '</h3>'
        + '<div class="timeline-company">' + exp.company + '</div>'
        + '<p>' + exp.description + '</p>'
        + (exp.tags && exp.tags.length
            ? '<div class="timeline-tags">' + exp.tags.map(function(t) { return '<span>' + t + '</span>'; }).join('') + '</div>'
            : '')
        + '</div></div>';
    }).join(''));

    // observe for reveal animation
    var items = document.querySelectorAll('.timeline-item');
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    items.forEach(function(i) { obs.observe(i); });
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

    setContactLink('contact-email',   'mailto:' + D.contact.email,           D.contact.email);

    var ctaEl = $id('contact-cta');
    if (ctaEl && D.contact.email) {
      ctaEl.href = 'mailto:' + D.contact.email;
      setText('contact-cta-mail', D.contact.email);
    }
    setContactLink('contact-phone',   'tel:' + (D.contact.phone || '').replace(/\s/g,''), D.contact.phone);
    setContactLink('contact-website', 'https://' + (D.contact.website || '').replace(/^https?:\/\//,''), D.contact.website);
    if (D.contact.instagram) setContactLink('contact-instagram', 'https://www.instagram.com/' + D.contact.instagram + '/', '@' + D.contact.instagram);
    if (D.contact.facebook)  setContactLink('contact-facebook',  'https://www.facebook.com/'  + D.contact.facebook,        'facebook.com/' + D.contact.facebook);
    setText('contact-location', D.contact.location);
    var locText = $id('contact-location') && $id('contact-location').querySelector('.contact-text');
    if (locText && D.contact.location) locText.textContent = D.contact.location;
  }

  // ── PORTFOLIO RENDERER ─────────────────────────────────────────
  function renderPortfolio() {
    var tabsEl = $id('collectionTabs');
    var gridEl = $id('worksGrid');
    if (!tabsEl || !gridEl) return;

    // Display order for collections (ids not listed keep their original order, after these)
    var ORDER = ['commercial', 'film'];
    var collections = (D.portfolio || []).slice().sort(function(a, b) {
      var ia = ORDER.indexOf(a.id), ib = ORDER.indexOf(b.id);
      if (ia === -1) ia = ORDER.length;
      if (ib === -1) ib = ORDER.length;
      return ia - ib;
    });
    if (!collections.length) { gridEl.innerHTML = '<p style="color:#555;padding:2rem">No works yet.</p>'; return; }

    var activeId = collections[0].id;

    // Render tabs
    function buildTabs() {
      tabsEl.innerHTML = collections.map(function(c) {
        return '<button class="col-tab' + (c.id === activeId ? ' active' : '') + '" data-id="' + c.id + '">' + c.name + '</button>';
      }).join('');
    }

    var HOME_LIMIT = 4; // works shown per collection on homepage

    // Render work cards
    function buildGrid(collId) {
      var col = collections.find(function(c) { return c.id === collId; });
      if (!col || !col.works.length) {
        gridEl.innerHTML = '<p style="color:#555;padding:2rem 0">No works in this collection yet.</p>';
        return;
      }
      var shown = col.works.slice(0, HOME_LIMIT);
      var hiddenCount = col.works.length - shown.length;
      gridEl.innerHTML = shown.map(function(w, i) {
        var imgHTML = w.coverImage
          ? '<img src="' + w.coverImage + '" alt="' + w.title + '" />'
          : '<div class="work-placeholder"><span>' + w.title + '</span></div>';
        var liveLink   = w.links && w.links.live       ? '<a href="' + w.links.live       + '" class="link-arrow" target="_blank">Watch →</a>' : '';
        var caseLink   = w.links && w.links.case_study ? '<a href="' + w.links.case_study + '" class="link-arrow" target="_blank">More Info →</a>' : '';
        return '<div class="work-card">'
          + '<div class="work-img">'
          + imgHTML
          + '<div class="work-overlay"><div class="overlay-title">' + w.title + '</div><div class="overlay-role">' + w.role + '</div></div>'
          + '</div>'
          + '<div class="work-info">'
          + '<div class="work-meta-row"><span class="work-title-text">' + w.title + '</span><span class="work-year">' + w.year + '</span></div>'
          + '<div class="work-tags">' + (w.tags || []).map(function(t) { return '<span>' + t + '</span>'; }).join('') + '</div>'
          + '<p class="work-desc">' + w.description + '</p>'
          + (liveLink || caseLink ? '<div class="work-links">' + liveLink + caseLink + '</div>' : '')
          + '</div></div>';
      }).join('');

      // "View all" link below grid (replace previous one on tab switch)
      var oldRow = document.getElementById('viewAllRow');
      if (oldRow) oldRow.remove();
      var label = 'View all projects →';
      gridEl.insertAdjacentHTML('afterend',
        '<div class="view-all-row" id="viewAllRow"><a href="works.html" class="btn-primary">' + label + '</a></div>');
    }

    buildTabs();
    buildGrid(activeId);

    tabsEl.addEventListener('click', function(e) {
      var btn = e.target.closest('.col-tab');
      if (!btn) return;
      activeId = btn.dataset.id;
      tabsEl.querySelectorAll('.col-tab').forEach(function(b) { b.classList.toggle('active', b === btn); });
      buildGrid(activeId);
    });
  }

})();
