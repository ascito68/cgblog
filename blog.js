/* blog.js — small ambient interactions, no framework.
 *  • slash rotates with scroll
 *  • search filters entries by title / kind / tags / lede
 *  • category filter buttons
 *  • intersection observer staggers entry reveal
 *  • slash-wipe transition on outbound entry clicks
 */
(() => {
  'use strict';

  // ─── slash rotation on scroll ────────────────────────────────
  const root = document.documentElement;
  const base = 70;                  // resting angle of the slash
  const range = 220;                // total degrees across full doc scroll
  let raf = 0;
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
      const t = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      root.style.setProperty('--slash-rot', (base + t * range).toFixed(2) + 'deg');
      raf = 0;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ─── reveal stagger ──────────────────────────────────────────
  const entries = [...document.querySelectorAll('.b-entry')];
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((records) => {
      records.forEach((r, i) => {
        if (r.isIntersecting) {
          setTimeout(() => r.target.classList.add('is-in'), i * 60);
          io.unobserve(r.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
    entries.forEach((el) => io.observe(el));
  } else {
    entries.forEach((el) => el.classList.add('is-in'));
  }

  // ─── search ──────────────────────────────────────────────────
  const input = document.querySelector('[data-search]');
  const counter = document.querySelector('[data-count]');
  const buttons = [...document.querySelectorAll('[data-filter]')];
  let activeKind = 'tutti';
  let query = '';

  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  function recount() {
    let n = 0;
    entries.forEach((el) => {
      const kind = el.dataset.kind || '';
      const hay = norm(el.textContent + ' ' + (el.dataset.tags || ''));
      const hitKind = activeKind === 'tutti' || kind === activeKind;
      const hitQuery = !query || hay.includes(query);
      const show = hitKind && hitQuery;
      el.classList.toggle('is-hidden', !show);
      if (show) n++;
    });
    if (counter) {
      const total = entries.length;
      counter.textContent = (n === total)
        ? `${String(total).padStart(2, '0')} scritture`
        : `${String(n).padStart(2, '0')} di ${String(total).padStart(2, '0')}`;
    }
  }

  if (input) {
    input.addEventListener('input', (e) => {
      query = norm(e.target.value.trim());
      recount();
    });
  }
  buttons.forEach((b) => {
    b.addEventListener('click', () => {
      buttons.forEach((x) => x.classList.toggle('is-on', x === b));
      activeKind = b.dataset.filter;
      recount();
    });
  });
  recount();

  // ─── slash-wipe outbound transition ──────────────────────────
  const wipe = document.querySelector('.b-wipe');
  if (wipe) {
    document.querySelectorAll('a.b-entry, a.b-next').forEach((a) => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (!href || href.startsWith('#') || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
        e.preventDefault();
        wipe.classList.add('is-on');
        setTimeout(() => { window.location.href = href; }, 520);
      });
    });
  }

  // ─── reveal-from-transition on article pages ─────────────────
  // (incoming pages get a soft fade-in via CSS; nothing to do here)

})();
