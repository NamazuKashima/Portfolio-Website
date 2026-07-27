/* ===================================
   VICTOR PORTFOLIO — MAIN JS
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

document.querySelectorAll('a, button, .project-card, input, textarea').forEach(el => {
  el.addEventListener('mouseenter', () => { cursor.classList.add('hover'); cursorRing.classList.add('hover'); });
  el.addEventListener('mouseleave', () => { cursor.classList.remove('hover'); cursorRing.classList.remove('hover'); });
});


// ---------- NAVBAR SCROLL ----------
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});


// ---------- MOBILE MENU ----------
const menuBtn  = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');

menuBtn.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  const spans = menuBtn.querySelectorAll('span');
  const isOpen = navLinks.classList.contains('open');
  spans[0].style.transform = isOpen ? 'translateY(6.5px) rotate(45deg)' : '';
  spans[1].style.transform = isOpen ? 'translateY(-6.5px) rotate(-45deg)' : '';
});

navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuBtn.querySelectorAll('span').forEach(s => s.style.transform = '');
  });
});


// ---------- INTERSECTION OBSERVER (reveal) ----------
const revealEls = document.querySelectorAll('.reveal, .timeline-item');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

// Add reveal class to sections' children
document.querySelectorAll('#about .about-grid, #projects .projects-grid > *, #experience .section-title, #contact .contact-grid > *').forEach(el => {
  el.classList.add('reveal');
});

revealEls.forEach(el => revealObserver.observe(el));
// Re-query after adding reveal class
document.querySelectorAll('.reveal, .timeline-item').forEach(el => revealObserver.observe(el));


// ---------- HERO PARALLAX ----------
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const bgText  = document.querySelector('.hero-bg-text');
  if (bgText) bgText.style.transform = `translateY(${scrollY * 0.3}px)`;
  const heroContent = document.querySelector('.hero-content');
  if (heroContent) heroContent.style.transform = `translateY(${scrollY * 0.15}px)`;
});


// ---------- ACTIVE NAV LINK ----------
const sections = document.querySelectorAll('section[id]');
const navItems = document.querySelectorAll('.nav-links a');

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


// ---------- CONTACT FORM ----------
document.getElementById('contactForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const btn = this.querySelector('button[type="submit"]');
  const original = btn.textContent;
  btn.textContent = '已发送 ✓';
  btn.style.pointerEvents = 'none';
  btn.style.opacity = '0.7';
  setTimeout(() => {
    btn.textContent = original;
    btn.style.pointerEvents = '';
    btn.style.opacity = '';
    this.reset();
  }, 3000);
});


// ---------- STAGGER PROJECT CARDS ----------
document.querySelectorAll('.project-card').forEach((card, i) => {
  card.style.transitionDelay = `${i * 0.1}s`;
});
