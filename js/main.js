/**
 * XKX.at — Main JavaScript
 * Handles theme toggle, navigation, scroll animations,
 * animated statistics, and email obfuscation.
 */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
     Email obfuscation — prevents bots from harvesting mail@xkx.at
     Address is split, reversed, and assembled only on user interaction.
     -------------------------------------------------------------------------- */
  const EMAIL_PARTS = {
  u: String.fromCharCode(109, 97, 105, 108),       // mail
  d: String.fromCharCode(120, 107, 120),            // xkx
  t: String.fromCharCode(97, 116)                   // at
  };

  function buildEmail() {
    return EMAIL_PARTS.u + String.fromCharCode(64) + EMAIL_PARTS.d + String.fromCharCode(46) + EMAIL_PARTS.t;
  }

  function revealEmail(displayEl, asLink) {
    const email = buildEmail();
    if (asLink) {
      displayEl.innerHTML = '';
      const link = document.createElement('a');
      link.href = 'mai' + 'lto:' + email;
      link.textContent = email;
      link.className = 'contact__email-revealed';
      displayEl.appendChild(link);
    } else {
      displayEl.textContent = email;
    }
    displayEl.setAttribute('aria-label', 'Email: ' + email);
    return email;
  }

  function initEmailObfuscation() {
    const revealBtn = document.getElementById('email-reveal');
    const displayEl = document.getElementById('email-display');
    const footerEmail = document.getElementById('footer-email');
    let revealed = false;

    if (revealBtn && displayEl) {
      revealBtn.addEventListener('click', function () {
        if (!revealed) {
          revealEmail(displayEl, true);
          revealed = true;
        } else {
          const email = buildEmail();
          window.location.href = 'mai' + 'lto:' + email;
        }
      });
    }

    if (footerEmail) {
      footerEmail.addEventListener('click', function () {
        const email = buildEmail();
        window.location.href = 'mai' + 'lto:' + email;
      });
    }
  }

  /* --------------------------------------------------------------------------
     Theme toggle
     -------------------------------------------------------------------------- */
  function initTheme() {
    const toggle = document.querySelector('.theme-toggle');
    const stored = localStorage.getItem('xkx-theme');
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

    if (stored) {
      document.documentElement.setAttribute('data-theme', stored);
    } else if (prefersLight) {
      document.documentElement.setAttribute('data-theme', 'light');
    }

    if (toggle) {
      toggle.addEventListener('click', function () {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        if (next === 'dark') {
          document.documentElement.removeAttribute('data-theme');
        } else {
          document.documentElement.setAttribute('data-theme', 'light');
        }
        localStorage.setItem('xkx-theme', next);
      });
    }
  }

  /* --------------------------------------------------------------------------
     Mobile navigation
     -------------------------------------------------------------------------- */
  function initNav() {
    const toggle = document.querySelector('.nav__toggle');
    const menu = document.querySelector('.nav__menu');
    const links = document.querySelectorAll('.nav__link');

    if (!toggle || !menu) return;

    toggle.addEventListener('click', function () {
      const isOpen = menu.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    links.forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* --------------------------------------------------------------------------
     Header scroll effect
     -------------------------------------------------------------------------- */
  function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;

    let ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          header.classList.toggle('header--scrolled', window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* --------------------------------------------------------------------------
     Scroll reveal animations
     -------------------------------------------------------------------------- */
  function initReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      reveals.forEach(function (el) { el.classList.add('visible'); });
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    reveals.forEach(function (el) { observer.observe(el); });
  }

  /* --------------------------------------------------------------------------
     Animated statistics
     -------------------------------------------------------------------------- */
  function animateCounter(el, target, duration) {
    const start = performance.now();
    const suffix = el.nextElementSibling && el.nextElementSibling.classList.contains('stat__suffix')
      ? el.nextElementSibling
      : null;

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target;
      }
    }

    requestAnimationFrame(update);
  }

  function initStats() {
    const stats = document.querySelectorAll('.stat__number[data-target]');
    if (!stats.length) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const target = parseInt(entry.target.getAttribute('data-target'), 10);
          if (prefersReduced) {
            entry.target.textContent = target;
          } else {
            animateCounter(entry.target, target, 2000);
          }
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    stats.forEach(function (stat) { observer.observe(stat); });
  }

  /* --------------------------------------------------------------------------
     Active nav link highlighting
     -------------------------------------------------------------------------- */
  function initActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav__link[href^="#"]');
    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(function (link) {
            if (link.classList.contains('nav__link--cta')) return;
            link.classList.toggle('nav__link--active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    }, {
      threshold: 0.3,
      rootMargin: '-' + getComputedStyle(document.documentElement).getPropertyValue('--header-height') + ' 0px -60% 0px'
    });

    sections.forEach(function (section) { observer.observe(section); });
  }

  /* --------------------------------------------------------------------------
     Tech badge interaction
     -------------------------------------------------------------------------- */
  function initTechBadges() {
    const badges = document.querySelectorAll('.tech-badge');
    badges.forEach(function (badge) {
      badge.addEventListener('mouseenter', function () {
        badge.style.filter = 'brightness(1.15)';
      });
      badge.addEventListener('mouseleave', function () {
        badge.style.filter = '';
      });
    });
  }

  /* --------------------------------------------------------------------------
     Footer year
     -------------------------------------------------------------------------- */
  function initYear() {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  /* --------------------------------------------------------------------------
     Initialize
     -------------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initNav();
    initHeaderScroll();
    initReveal();
    initStats();
    initActiveNav();
    initEmailObfuscation();
    initTechBadges();
    initYear();
  });
})();
