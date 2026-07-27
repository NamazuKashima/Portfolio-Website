/* ===================================
   VICTOR PORTFOLIO — MAIN JS
   Shared across all pages — every block below
   guards for missing elements so this file is
   safe to include on index.html, works.html, etc.
=================================== */

// ---------- CUSTOM CURSOR ----------
const cursor     = document.createElement('div');
const cursorRing = document.createElement('div');
cursor.className     = 'cursor';
cursorRing.className = 'cursor-ring';
document.body.appendChild(cursor);
document.body.appendChild(cursorRing);

let mouseX = 0, mouseY = 0;
let ringX  = 0, ringY  = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursor.style.left = mouseX + 'px';
  cursor.style.top  = mouseY + 'px';
});

(function animateRing() {
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top  = ringY + 'px';
  requestAnimationFrame(animateRing);
})();

function bindCursorHover(root) {
  (root || document).querySelectorAll('a, button, .project-card, .work-card, .col-tab, .btn-reel, .btn-cv, input, textarea').forEach(el => {
    el.addEventListener('mouseenter', () => { cursor.classList.add('hover'); cursorRing.classList.add('hover'); });
    el.addEventListener('mouseleave', () => { cursor.classList.remove('hover'); cursorRing.classList.remove('hover'); });
  });
}
bindCursorHover();

// Re-bind hover targets whenever the works grid re-renders dynamically
// (render.js / works.html rebuild .work-card / .col-tab elements after this script loads)
const worksGridEl = document.getElementById('worksGrid');
if (worksGridEl) {
  const gridObserver = new MutationObserver(() => bindCursorHover(worksGridEl));
  gridObserver.observe(worksGridEl, { childList: true });
}
const tabsEl = document.getElementById('collectionTabs');
if (tabsEl) {
  const tabsObserver = new MutationObserver(() => bindCursorHover(tabsEl));
  tabsObserver.observe(tabsEl, { childList: true });
}


// ---------- NAVBAR SCROLL ----------
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  });
}


// ---------- MOBILE MENU ----------
const menuBtn  = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');

if (menuBtn && navLinks) {
  const setMenu = (open) => {
    navLinks.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    const spans = menuBtn.querySelectorAll('span');
    spans[0].style.transform = open ? 'translateY(3.5px) rotate(45deg)'  : '';
    spans[1].style.transform = open ? 'translateY(-3.5px) rotate(-45deg)' : '';
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  menuBtn.addEventListener('click', () => {
    setMenu(!navLinks.classList.contains('open'));
  });

  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => setMenu(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });

  // Close if the viewport grows back to desktop while the menu is open
  window.addEventListener('resize', () => {
    if (window.innerWidth > 980 && navLinks.classList.contains('open')) setMenu(false);
  });
}


// ---------- INTERSECTION OBSERVER (reveal) ----------
document.querySelectorAll('#about .about-grid, #projects .projects-grid > *, #experience .section-title, #contact .contact-grid > *').forEach(el => {
  el.classList.add('reveal');
});

const revealEls = document.querySelectorAll('.reveal, .timeline-item');
if (revealEls.length) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  revealEls.forEach(el => revealObserver.observe(el));
}


// ---------- HERO PARALLAX ----------
if (document.getElementById('hero')) {
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const bgText  = document.querySelector('.hero-bg-text');
    if (bgText) bgText.style.transform = `translateY(${scrollY * 0.3}px)`;
    const heroInner = document.querySelector('.hero-inner');
    if (heroInner) heroInner.style.transform = `translateY(${scrollY * 0.15}px)`;
  });
}


// ---------- ACTIVE NAV LINK ----------
const sections = document.querySelectorAll('section[id]');
const navItems = document.querySelectorAll('.nav-links a');
if (sections.length && navItems.length) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navItems.forEach(a => {
          a.style.color = '';
          if (a.getAttribute('href') === `#${id}`) {
            a.style.color = 'var(--accent)';
          }
        });
      }
    });
  }, { threshold: 0.5 });
  sections.forEach(s => sectionObserver.observe(s));
}


// ---------- STAGGER PROJECT CARDS ----------
document.querySelectorAll('.project-card').forEach((card, i) => {
  card.style.transitionDelay = `${i * 0.1}s`;
});
