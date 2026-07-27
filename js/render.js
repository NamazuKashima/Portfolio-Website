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

    var collections = D.portfolio || [];
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
        var caseLink   = w.links && w.links.case_study ? '<a href="' + w.links.case_study + '" class="link-arrow" target="_blank">Case Study →</a>' : '';
        return '<div class="work-card' + (i === 0 ? ' featured' : '') + '">'
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
      var totalAll = collections.reduce(function(n, c) { return n + c.works.length; }, 0);
      var label = 'View all ' + totalAll + ' projects →';
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
