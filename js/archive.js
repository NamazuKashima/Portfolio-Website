/* ===================================
   ARCHIVE — the chapter pages and the index
   film.html        I  every film as a screening (frames open full-screen)
   commercial.html  II every other collection as a lookbook (frames open details)
   works.html          the index: every project as one line, grouped
   Which one runs is set by <body data-page="film|commercial|index">.
   Like render.js, every string about the work comes from js/data.js.
=================================== */
(function () {
  var D = window.PORTFOLIO_DATA;
  var P = window.VWPortfolio;
  var R = window.VWReadings;
  if (!D || !P) return;

  var esc = P.esc;
  var page = document.body.getAttribute('data-page');
  function $id(id) { return document.getElementById(id); }
  function setText(id, val) { var el = $id(id); if (el && val != null) el.textContent = val; }

  // ── SHARED CHROME ──────────────────────────────────────────────
  var NAME = (D.meta && D.meta.name) || 'Victor Qixun Wu';
  if (D.footer) {
    if (D.footer.logo) { setText('nav-logo', D.footer.logo); setText('footer-logo', D.footer.logo); }
    if (D.footer.copyright) setText('footer-copy', D.footer.copyright);
  }
  if (D.contact && D.contact.email) {
    var mm = $id('menu-email');
    if (mm) { mm.href = 'mailto:' + D.contact.email; mm.textContent = D.contact.email; }
  }
  setText('crumbName', NAME);

  var cols = P.collections(D);
  var filmCols = cols.filter(P.isFilm);
  var otherCols = cols.filter(function (c) { return !P.isFilm(c); });
  var films = P.flatten(filmCols);
  var others = P.flatten(otherCols);

  // nav + menu labels follow the collection names
  function relabel(sel, name) {
    document.querySelectorAll(sel).forEach(function (a) {
      a.firstChild.textContent = name;
      if (a.hasAttribute('data-veil')) a.setAttribute('data-veil', name);
    });
  }
  if (filmCols[0]) relabel('[data-nav="film"]', filmCols[0].name);
  if (otherCols.length) relabel('[data-nav="other"]', otherCols.map(function (c) { return c.name; }).join(' & '));

  function meta(works, kind) {
    var span = P.yearSpan(works);
    return '<strong>' + works.length + '</strong><span>' + P.noun(works.length, kind) + (span ? ', ' + span : '') + '</span>';
  }
  function byId(list) {
    return function (id) { return { work: list.filter(function (w) { return String(w.id) === String(id); })[0], list: list }; };
  }

  // ── I · FILM ───────────────────────────────────────────────────
  if (page === 'film') {
    var fname = (filmCols[0] && filmCols[0].name) || 'Film';
    setText('pageTitle', fname);
    setText('veilTitle', fname);
    document.title = fname + ' — ' + NAME;
    $id('pageMeta').innerHTML = meta(films, 'film');
    $id('contents').innerHTML = P.runHTML(films, 'a');
    var prog = $id('programme');
    prog.innerHTML = films.length
      ? films.map(function (w, i) {
          return P.screeningHTML(w, { anchor: true, eager: i === 0, cursor: 'View', verb: 'View the frame from' });
        }).join('')
      : '<p class="meta">No films yet.</p>';
    // a frame opens full-screen, on monitor black; the screening already carries the notes
    P.bindOpen(prog, byId(films), P.view);
  }

  // ── II · COMMERCIAL (and any other collection) ─────────────────
  if (page === 'commercial') {
    var lead = otherCols[0];
    var title = otherCols.map(function (c) { return c.name; }).join(' & ') || 'Commercial';
    setText('pageTitle', title);
    setText('veilTitle', title);
    setText('pageNum', P.roman(filmCols.length + 1));
    document.title = title + ' — ' + NAME;
    $id('pageMeta').innerHTML = meta(others, 'other');
    var host = $id('groups');
    host.innerHTML = otherCols.map(function (c) {
      var works = P.worksOf(c);
      var head = otherCols.length > 1
        ? '<header class="group-head"><h2 class="group-title">' + esc(c.name) + '</h2><p class="meta">' + works.length + ' ' + P.noun(works.length, 'other') + '</p></header>'
        : '';
      return '<section class="group" id="' + esc(c.id) + '" data-coll="' + esc(c.id) + '">' + head
        + '<div class="lookbook lookbook--full">' + works.map(function (w, i) { return P.lookHTML(w, { eager: i < 2, full: true }); }).join('') + '</div>'
        + '</section>';
    }).join('') || '<p class="meta">No projects yet.</p>';
    Array.prototype.forEach.call(host.querySelectorAll('.group'), function (sec) {
      var c = otherCols.filter(function (x) { return String(x.id) === sec.getAttribute('data-coll'); })[0];
      if (c) P.bindOpen(sec, byId(P.worksOf(c)));
    });
    if (!lead) $id('groups').innerHTML = '<p class="meta">No projects yet.</p>';
  }

  // ── INDEX ──────────────────────────────────────────────────────
  if (page === 'index') {
    var everything = films.concat(others);
    $id('pageMeta').innerHTML = meta(everything, 'other');
    var idx = $id('index');
    idx.innerHTML = cols.map(function (c, ci) {
      var works = P.worksOf(c);
      if (!works.length) return '';
      var film = P.isFilm(c);
      var href = film ? 'film.html' : 'commercial.html' + (otherCols[0] && c.id === otherCols[0].id ? '' : '#' + esc(c.id));
      return '<section class="index-group" data-coll="' + esc(c.id) + '">'
        + '<header class="index-head"><h2>' + P.roman(ci + 1) + ' &nbsp;' + esc(c.name) + '</h2>'
        + '<a href="' + href + '" data-transition data-veil="' + esc(c.name) + '">See the ' + esc(String(c.name).toLowerCase()) + ' page</a></header>'
        + '<ul>' + works.map(P.rowHTML).join('') + '</ul>'
        + '</section>';
    }).join('');
    Array.prototype.forEach.call(idx.querySelectorAll('.index-group'), function (sec) {
      var c = cols.filter(function (x) { return String(x.id) === sec.getAttribute('data-coll'); })[0];
      if (c) P.bindOpen(sec, byId(P.worksOf(c)));
    });
    P.bindPreview(idx);
  }

  P.markLoaded(document);
  if (R) R.mount(document);
})();
