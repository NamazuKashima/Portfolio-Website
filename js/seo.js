/* ===================================
   SEO — STRUCTURED DATA
   Builds a schema.org Person JSON-LD block straight from the live
   portfolio data and injects it into <head>. Shared across pages
   (index.html, works.html) so it can never drift out of sync with
   what's actually on the page — same principle as render.js.
=================================== */
(function () {
  var D = window.PORTFOLIO_DATA;
  if (!D) return;

  var SITE_URL = 'https://www.victorqixunwu.com/';

  function abs(path) {
    if (!path) return undefined;
    if (/^https?:\/\//i.test(path)) return path;
    return SITE_URL + String(path).replace(/^\//, '');
  }

  // "Colorist · Vancouver, BC" → "Colorist"
  var jobTitle = 'Colorist';
  if (D.hero && D.hero.label) {
    var firstPart = D.hero.label.split('·')[0].trim();
    if (firstPart) jobTitle = firstPart;
  }

  var sameAs = [];
  if (D.contact) {
    if (D.contact.instagram) sameAs.push('https://www.instagram.com/' + D.contact.instagram + '/');
    if (D.contact.facebook)  sameAs.push('https://www.facebook.com/' + D.contact.facebook);
  }
  // Confirmed by Victor — links the site to his existing IMDb credits.
  sameAs.push('https://www.imdb.com/name/nm14787989/');

  // schema.org allows address as plain Text as well as a structured
  // PostalAddress — Text is used here on purpose. D.contact.location now
  // covers two cities ("Vancouver, BC & Montreal, QC, Canada"), and
  // splitting that on commas into a single addressLocality/addressRegion
  // would misparse it. areaServed below carries the two-market signal in
  // a structured way instead.
  var address = D.contact && D.contact.location ? D.contact.location : undefined;
  var areaServed = ['Vancouver, BC', 'Montreal, QC', 'Canada'];

  var knowsAbout = [];
  if (D.about && D.about.skills) {
    D.about.skills.forEach(function (group) {
      (group.items || []).forEach(function (item) { knowsAbout.push(item); });
    });
  }
  // British/Canadian spelling variant — kept only here (never rendered on
  // the page itself) so both spellings carry search relevance without
  // either one showing up as visible text anywhere.
  knowsAbout.push('Colourist');

  // Detect an education entry in the experience timeline (same heuristic
  // used by resume.html) to surface alumniOf without hardcoding a school name.
  var alumniOf;
  if (D.experience) {
    var eduEntry = D.experience.find(function (exp) {
      return /university|college|school|cinema/i.test(exp.company || '')
        || /^(BFA|BA|BS|BSc|MFA|MA|MS|MSc)\b/i.test(exp.title || '');
    });
    if (eduEntry && eduEntry.company) {
      // "Mel Hoppenheim School of Cinema · Concordia University" → last segment
      var schoolParts = eduEntry.company.split('·').map(function (s) { return s.trim(); }).filter(Boolean);
      alumniOf = { '@type': 'CollegeOrUniversity', name: schoolParts[schoolParts.length - 1] };
    }
  }

  var person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: (D.meta && D.meta.name) || 'Victor Qixun Wu',
    alternateName: 'Victor Wu',
    url: SITE_URL,
    image: abs(D.about && D.about.photo),
    jobTitle: jobTitle,
    description: D.hero && D.hero.description,
    address: address,
    areaServed: areaServed,
    email: D.contact && D.contact.email ? 'mailto:' + D.contact.email : undefined,
    telephone: D.contact && D.contact.phone,
    sameAs: sameAs.length ? sameAs : undefined,
    knowsAbout: knowsAbout.length ? knowsAbout : undefined,
    alumniOf: alumniOf
  };

  Object.keys(person).forEach(function (k) { if (person[k] === undefined) delete person[k]; });

  var script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(person);
  document.head.appendChild(script);
})();
