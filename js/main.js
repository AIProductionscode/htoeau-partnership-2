/**
 * HtoEAU × Burnley FC Partnership - Visual Redesign
 * Precise Vanilla JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavScrollSpy();
  initStickyOfferRibbon();
  initFanOfferForm();
  initPromoModal();
  initSmoothScroll();
  initScrollReveal();
  initStatsBandCounter();
  initRangeCarousel();
  initBackToTop();
  initProductButtons();
});

/**
 * 0. Nav Scroll-Spy & Active State
 * Observes page sections and underlines the active navigation item
 */
function initNavScrollSpy() {
  const navLinks = document.querySelectorAll('.nav-menu-link');
  if (navLinks.length === 0) return;

  const sections = ['partnership', 'products', 'performance']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  if (!('IntersectionObserver' in window)) return;

  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          if (link.getAttribute('data-section') === id || link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(sec => observer.observe(sec));
}

/**
 * 1. Sticky Offer Ribbon
 * Slides down a 44px bar when fan-offer leaves the viewport.
 * Hides while fan-offer is in view or if dismissed during this session.
 */
function initStickyOfferRibbon() {
  const ribbon = document.getElementById('sticky-offer-ribbon');
  const fanOfferSection = document.getElementById('fan-offer');
  const dismissBtn = document.getElementById('ribbon-dismiss-btn');
  const ctaBtn = document.getElementById('ribbon-cta-btn');

  if (!ribbon || !fanOfferSection) return;

  let isDismissed = false;
  try {
    isDismissed = sessionStorage.getItem('htoeau_offer_ribbon_dismissed') === '1';
  } catch (e) {
    isDismissed = false;
  }

  if (isDismissed) return;

  const showRibbon = () => {
    if (isDismissed) return;
    ribbon.removeAttribute('hidden');
    // Force reflow for CSS transition
    void ribbon.offsetWidth;
    ribbon.classList.add('is-visible');
  };

  const hideRibbon = () => {
    ribbon.classList.remove('is-visible');
    setTimeout(() => {
      if (!ribbon.classList.contains('is-visible')) {
        ribbon.setAttribute('hidden', '');
      }
    }, 300);
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // If fan offer is currently visible, hide ribbon
        if (entry.isIntersecting) {
          hideRibbon();
        } else {
          // If scrolled past fan offer, reveal sticky ribbon
          const rect = entry.boundingClientRect;
          if (rect.top < 0 && !isDismissed) {
            showRibbon();
          } else {
            hideRibbon();
          }
        }
      });
    }, {
      root: null,
      threshold: 0
    });

    observer.observe(fanOfferSection);
  }

  // Dismiss button handler
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      isDismissed = true;
      hideRibbon();
      try {
        sessionStorage.setItem('htoeau_offer_ribbon_dismissed', '1');
      } catch (e) {
        // Ignore storage errors
      }
    });
  }

  // CTA button handler: scroll back to form & focus email input
  if (ctaBtn) {
    ctaBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('fan-offer-email');
      const header = document.getElementById('site-header');
      const headerHeight = header ? header.offsetHeight : 56;
      const targetPos = fanOfferSection.getBoundingClientRect().top + window.pageYOffset - headerHeight;

      window.scrollTo({
        top: targetPos,
        behavior: 'smooth'
      });

      setTimeout(() => {
        if (emailInput) {
          emailInput.focus();
        }
      }, 400);
    });
  }
}

/**
 * 2. Fan Offer Email Form Handler
 * Validates the email address via native constraint validation.
 * Opens the promotional modal when valid.
 */
function initFanOfferForm() {
  const form = document.getElementById('fan-offer-form');
  const emailInput = document.getElementById('fan-offer-email');
  if (!form || !emailInput) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!emailInput.checkValidity()) {
      emailInput.reportValidity();
      return;
    }

    openPromoModal();
  });
}

/**
 * 3. Promotional Modal Management
 */
let lastFocusedElement = null;

function openPromoModal() {
  const modal = document.getElementById('promo-modal');
  const closeBtn = document.getElementById('modal-close-btn');
  if (!modal) return;

  lastFocusedElement = document.activeElement;

  modal.removeAttribute('hidden');
  modal.classList.add('is-open');
  document.body.classList.add('modal-open');

  if (closeBtn) {
    closeBtn.focus();
  }
}

function closePromoModal() {
  const modal = document.getElementById('promo-modal');
  if (!modal || modal.hasAttribute('hidden')) return;

  modal.classList.remove('is-open');
  document.body.classList.remove('modal-open');

  setTimeout(() => {
    modal.setAttribute('hidden', '');
  }, 200);

  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus();
  } else {
    const btnGetCode = document.getElementById('btn-get-code');
    if (btnGetCode) btnGetCode.focus();
  }
}

function initPromoModal() {
  const modal = document.getElementById('promo-modal');
  const dialog = document.getElementById('promo-modal-dialog');
  const closeBtn = document.getElementById('modal-close-btn');
  const copyBtn = document.getElementById('btn-modal-copy-code');
  if (!modal) return;

  if (closeBtn) {
    closeBtn.addEventListener('click', closePromoModal);
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closePromoModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (modal.hasAttribute('hidden') || !modal.classList.contains('is-open')) return;

    if (e.key === 'Escape' || e.key === 'Esc') {
      e.preventDefault();
      closePromoModal();
      return;
    }

    if (e.key === 'Tab') {
      trapModalFocus(e, dialog || modal);
    }
  });

  if (copyBtn) {
    const codeToCopy = 'FAN-N6L75R';
    let resetTimer = null;

    copyBtn.addEventListener('click', async () => {
      let success = false;

      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(codeToCopy);
          success = true;
        } catch (err) {
          success = fallbackCopyText(codeToCopy);
        }
      } else {
        success = fallbackCopyText(codeToCopy);
      }

      if (success) {
        copyBtn.textContent = 'Copied.';
        copyBtn.setAttribute('aria-label', `Code ${codeToCopy} copied to clipboard`);

        if (resetTimer) clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
          copyBtn.textContent = 'Copy code';
          copyBtn.setAttribute('aria-label', `Copy discount code ${codeToCopy}`);
        }, 1500);
      }
    });
  }
}

function trapModalFocus(e, container) {
  const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const focusables = Array.from(container.querySelectorAll(focusableSelector)).filter(
    el => el.offsetParent !== null
  );

  if (focusables.length === 0) return;

  const firstEl = focusables[0];
  const lastEl = focusables[focusables.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === firstEl) {
      e.preventDefault();
      lastEl.focus();
    }
  } else {
    if (document.activeElement === lastEl) {
      e.preventDefault();
      firstEl.focus();
    }
  }
}

function fallbackCopyText(text) {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const result = document.execCommand('copy');
    document.body.removeChild(textArea);
    return result;
  } catch (e) {
    return false;
  }
}

/**
 * 4. Smooth Scrolling for Anchor Links with Sticky Header Offset
 */
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  const header = document.getElementById('site-header');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#' || targetId.startsWith('#refund') || targetId.startsWith('#privacy') || targetId.startsWith('#terms')) return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const headerHeight = header ? header.offsetHeight : 56;
        const targetPos = targetEl.getBoundingClientRect().top + window.pageYOffset - headerHeight;

        window.scrollTo({
          top: targetPos,
          behavior: 'smooth'
        });

        if (history.pushState) {
          history.pushState(null, null, targetId);
        }
      }
    });
  });
}

/**
 * 5. Scroll Reveal (500ms ease)
 */
function initScrollReveal() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealElements = document.querySelectorAll('.reveal');

  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealElements.forEach(el => el.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => observer.observe(el));
}

/**
 * 6. Stats Band Count-Up Animation
 * Counts up "5" and "8.3" over 900ms upon scroll into view.
 * Respects prefers-reduced-motion.
 */
function initStatsBandCounter() {
  const statsBand = document.getElementById('stats-band');
  const val1 = document.getElementById('stat-val-1');
  const val2 = document.getElementById('stat-val-2');
  if (!statsBand || !val1 || !val2) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced || !('IntersectionObserver' in window)) {
    // Already rendered static final values
    return;
  }

  let animated = false;

  const animateValues = () => {
    if (animated) return;
    animated = true;

    const duration = 900;
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      // Animate 5
      const currentVal1 = Math.round(easeProgress * 5);
      val1.textContent = `${currentVal1} mg/L`;

      // Animate 8.3
      const currentVal2 = (easeProgress * 8.3).toFixed(1);
      val2.textContent = `pH ${currentVal2}`;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        val1.textContent = '5 mg/L';
        val2.textContent = 'pH 8.3';
      }
    }

    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateValues();
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.2
  });

  observer.observe(statsBand);
}

/**
 * 7. Store-Style Product Carousel
 * Prev/next navigation, 1/3 counter, touch scroll-snap on mobile/tablet
 */
function initRangeCarousel() {
  const carousel = document.getElementById('range-carousel');
  const prevBtn = document.getElementById('carousel-prev-btn');
  const nextBtn = document.getElementById('carousel-next-btn');
  const counter = document.getElementById('carousel-counter');

  if (!carousel || !prevBtn || !nextBtn || !counter) return;

  const cards = carousel.querySelectorAll('.product-card');
  const totalCards = cards.length;

  const updateCounter = () => {
    const scrollLeft = carousel.scrollLeft;
    const cardWidth = cards[0] ? cards[0].offsetWidth + 16 : 300;
    let activeIndex = Math.round(scrollLeft / cardWidth);
    activeIndex = Math.max(0, Math.min(activeIndex, totalCards - 1));

    counter.textContent = `${activeIndex + 1} / ${totalCards}`;
    prevBtn.disabled = activeIndex === 0;
    nextBtn.disabled = activeIndex === totalCards - 1;
  };

  carousel.addEventListener('scroll', updateCounter, { passive: true });
  updateCounter();

  prevBtn.addEventListener('click', () => {
    const cardWidth = cards[0] ? cards[0].offsetWidth + 16 : 300;
    carousel.scrollBy({ left: -cardWidth, behavior: 'smooth' });
  });

  nextBtn.addEventListener('click', () => {
    const cardWidth = cards[0] ? cards[0].offsetWidth + 16 : 300;
    carousel.scrollBy({ left: cardWidth, behavior: 'smooth' });
  });

  // Keyboard navigation when carousel has focus
  carousel.addEventListener('keydown', (e) => {
    const cardWidth = cards[0] ? cards[0].offsetWidth + 16 : 300;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      carousel.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      carousel.scrollBy({ left: cardWidth, behavior: 'smooth' });
    }
  });
}

/**
 * 8. Back to Top Button
 */
function initBackToTop() {
  const backBtn = document.getElementById('back-to-top');
  if (!backBtn) return;

  const toggleBackBtn = () => {
    if (window.scrollY > 400) {
      backBtn.style.opacity = '1';
      backBtn.style.pointerEvents = 'auto';
    } else {
      backBtn.style.opacity = '0';
      backBtn.style.pointerEvents = 'none';
    }
  };

  window.addEventListener('scroll', toggleBackBtn, { passive: true });
  toggleBackBtn();

  backBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/**
 * 9. Product CTA Clicks
 */
function initProductButtons() {
  const productBtns = document.querySelectorAll('.btn-product-view');
  productBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // If href is external, allow default navigation
      const href = btn.getAttribute('href');
      if (href && (href.startsWith('http') || href.startsWith('//'))) {
        return;
      }
      e.preventDefault();
      const fanOffer = document.getElementById('fan-offer');
      if (fanOffer) {
        const header = document.getElementById('site-header');
        const headerHeight = header ? header.offsetHeight : 56;
        const targetPos = fanOffer.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        window.scrollTo({
          top: targetPos,
          behavior: 'smooth'
        });
      }
    });
  });
}
