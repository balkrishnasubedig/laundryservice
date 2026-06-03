/* ============================================================
   NEPAL TREK CONNECT — app.js
   Form handling, sticky widget, UI interactivity
   ============================================================ */

"use strict";

// ============================================================
// UTILITY
// ============================================================
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ============================================================
// 1. STICKY HEADER
// ============================================================
(function initStickyHeader() {
  const header = qs('.site-header');
  if (!header) return;
  const toggle = () => {
    const scrolled = window.scrollY > 60;
    header.classList.toggle('scrolled', scrolled);
    header.classList.toggle('transparent', !scrolled);
  };
  toggle();
  window.addEventListener('scroll', toggle, { passive: true });
})();

// ============================================================
// 2. MOBILE NAV
// ============================================================
(function initMobileNav() {
  const toggle     = qs('.nav-toggle');
  const closeBtn   = qs('.close-menu');
  const mobileMenu = qs('.mobile-menu');
  if (!toggle || !mobileMenu) return;

  const openMenu = () => {
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
    toggle.setAttribute('aria-expanded', 'true');
  };
  const closeMenu = () => {
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);

  qsa('.mobile-menu a', mobileMenu).forEach(a => a.addEventListener('click', closeMenu));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });
})();

// ============================================================
// 3. ACTIVE NAV LINK
// ============================================================
(function initActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  qsa('.nav-links a, .mobile-menu a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();

// ============================================================
// 4. SCROLL REVEAL
// ============================================================
(function initScrollReveal() {
  const els = qsa('.fade-up');
  if (!els.length || !window.IntersectionObserver) {
    els.forEach(el => el.classList.add('visible'));
    return;
  }
  const obs = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    }),
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  els.forEach(el => obs.observe(el));
})();

// ============================================================
// 5. STICKY FLOATING WIDGET
// ============================================================
(function initStickyWidget() {
  const mainFab   = qs('.sticky-fab--main');
  const actions   = qs('.sticky-actions');
  const emailFab  = qs('.sticky-fab--email');
  const popup     = qs('.quick-form-popup');
  const closePopup = qs('.close-popup');

  if (!mainFab || !actions) return;

  // Toggle actions panel
  mainFab.addEventListener('click', () => {
    const isHidden = actions.classList.contains('hidden');
    actions.classList.toggle('hidden', !isHidden);
    mainFab.setAttribute('aria-expanded', String(isHidden));
    mainFab.textContent = isHidden ? '✕' : '✦';
    // Close popup if open
    if (popup && !popup.classList.contains('hidden')) {
      popup.classList.add('hidden');
    }
  });

  // Toggle quick email form
  if (emailFab && popup) {
    emailFab.addEventListener('click', (e) => {
      e.stopPropagation();
      popup.classList.toggle('hidden');
    });
  }
  if (closePopup && popup) {
    closePopup.addEventListener('click', () => popup.classList.add('hidden'));
  }

  // Close on outside click
  document.addEventListener('click', e => {
    if (popup && !popup.contains(e.target) && !emailFab?.contains(e.target)) {
      popup.classList.add('hidden');
    }
  });

  // Quick form submission
  const quickForm = qs('#quick-contact-form');
  if (quickForm) {
    quickForm.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(quickForm);
      const name    = fd.get('qname')?.toString().trim();
      const email   = fd.get('qemail')?.toString().trim();
      const message = fd.get('qmessage')?.toString().trim();

      if (!name || !email) {
        showFormError(quickForm, 'Please fill in your name and email.');
        return;
      }
      if (!isValidEmail(email)) {
        showFormError(quickForm, 'Please enter a valid email address.');
        return;
      }

      // Build WhatsApp message as fallback
      const wa = `Hello Nepal Trek Connect!%0AName: ${encodeURIComponent(name)}%0AEmail: ${encodeURIComponent(email)}%0AMessage: ${encodeURIComponent(message || 'I would like to inquire about your services.')}`;
      window.open(`https://wa.me/9779846958184?text=${wa}`, '_blank');

      showFormSuccess(quickForm, '✓ Message sent! We\'ll contact you soon.');
      quickForm.reset();
      setTimeout(() => {
        if (popup) popup.classList.add('hidden');
      }, 3000);
    });
  }
})();

// ============================================================
// 6. MAIN FORMS (booking / contact)
// ============================================================
(function initMainForms() {
  qsa('form[data-form]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const type = form.dataset.form;
      const fd   = new FormData(form);
      const data = Object.fromEntries(fd.entries());

      // Validation
      const name  = data.name?.toString().trim();
      const email = data.email?.toString().trim();
      if (!name || !email) {
        showFormError(form, 'Please fill in all required fields.');
        return;
      }
      if (!isValidEmail(email)) {
        showFormError(form, 'Please enter a valid email address.');
        return;
      }

      clearFormMessages(form);

      // Build WhatsApp message
      let waMsg = `Hello Nepal Trek Connect!%0ANew ${type === 'booking' ? 'Booking Inquiry' : 'Contact Message'}%0A`;
      Object.entries(data).forEach(([k, v]) => {
        if (v) waMsg += `${capitalize(k)}: ${encodeURIComponent(v)}%0A`;
      });

      // Open WhatsApp
      window.open(`https://wa.me/9779846958184?text=${waMsg}`, '_blank');

      showFormSuccess(form, '✓ Inquiry sent! We\'ll get back to you within 24 hours.');
      form.reset();
    });
  });
})();

// ============================================================
// 7. TREK FILTER (treks.html)
// ============================================================
(function initTrekFilter() {
  const filterBtn    = qs('#apply-filters');
  const resetBtn     = qs('#reset-filters');
  const cards        = qsa('.trek-card[data-difficulty]');
  const noResults    = qs('.no-results');
  if (!filterBtn || !cards.length) return;

  const applyFilters = () => {
    const difficulty = qs('#filter-difficulty')?.value || 'all';
    const duration   = qs('#filter-duration')?.value   || 'all';
    const price      = qs('#filter-price')?.value      || 'all';
    let visible = 0;

    cards.forEach(card => {
      const cd = card.dataset.difficulty || '';
      const cdur = parseInt(card.dataset.duration || '0');
      const cprice = parseInt(card.dataset.price || '0');

      let show = true;
      if (difficulty !== 'all' && cd !== difficulty) show = false;
      if (duration !== 'all') {
        if (duration === '1-7'   && !(cdur >= 1 && cdur <= 7))   show = false;
        if (duration === '8-14'  && !(cdur >= 8 && cdur <= 14))  show = false;
        if (duration === '15+'   && !(cdur >= 15))                show = false;
      }
      if (price !== 'all') {
        if (price === 'budget'   && !(cprice < 500))              show = false;
        if (price === 'mid'      && !(cprice >= 500 && cprice < 1500)) show = false;
        if (price === 'premium'  && !(cprice >= 1500))            show = false;
      }

      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    if (noResults) noResults.classList.toggle('show', visible === 0);
  };

  filterBtn.addEventListener('click', applyFilters);

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      qsa('select[id^="filter-"]').forEach(s => s.value = 'all');
      cards.forEach(c => c.style.display = '');
      if (noResults) noResults.classList.remove('show');
    });
  }
})();

// ============================================================
// 8. SMOOTH SCROLL FOR HASH LINKS
// ============================================================
document.addEventListener('click', e => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const target = qs(link.getAttribute('href'));
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ============================================================
// 9. HERO PARALLAX (subtle)
// ============================================================
(function initParallax() {
  const heroBg = qs('.hero-bg-img');
  if (!heroBg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    heroBg.style.transform = `translateY(${y * 0.3}px)`;
  }, { passive: true });
})();

// ============================================================
// HELPERS
// ============================================================
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function clearFormMessages(form) {
  qsa('.form-success, .form-error', form).forEach(el => {
    el.classList.remove('show');
  });
}

function showFormSuccess(form, msg) {
  clearFormMessages(form);
  let el = qs('.form-success', form);
  if (!el) {
    el = document.createElement('div');
    el.className = 'form-success';
    form.appendChild(el);
  }
  el.innerHTML = `<span>✓</span> ${msg}`;
  el.classList.add('show');
}

function showFormError(form, msg) {
  clearFormMessages(form);
  let el = qs('.form-error', form);
  if (!el) {
    el = document.createElement('div');
    el.className = 'form-error';
    el.style.cssText = 'padding:12px 16px;background:rgba(224,85,85,0.1);border:1px solid rgba(224,85,85,0.3);border-radius:6px;color:#e05555;font-size:.85rem;font-weight:600;margin-top:10px;';
    form.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}