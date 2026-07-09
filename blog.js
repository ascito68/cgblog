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
    let total = 0;
    entries.forEach((el) => {
      const kind = el.dataset.kind || '';
      const archiveOnly = el.dataset.archiveOnly || '';
      const hay = norm(el.textContent + ' ' + (el.dataset.tags || ''));
      const hitArchive = !archiveOnly || activeKind === archiveOnly;
      const hitKind = activeKind === 'tutti' || kind === activeKind;
      const hitQuery = !query || hay.includes(query);
      const eligible = hitArchive && hitKind;
      const show = eligible && hitQuery;
      el.classList.toggle('is-hidden', !show);
      if (eligible) total++;
      if (show) n++;
    });
    if (counter) {
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

  // ─── mobile menu ─────────────────────────────────────────────
  const menuBtn = document.querySelector('.b-head__menu');
  const headNav = document.querySelector('.b-head__nav');
  if (menuBtn && headNav) {
    menuBtn.addEventListener('click', () => {
      const open = headNav.classList.toggle('is-open');
      menuBtn.textContent = open ? '×' : 'menu';
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.b-head') && headNav.classList.contains('is-open')) {
        headNav.classList.remove('is-open');
        menuBtn.textContent = 'menu';
      }
    });
  }

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
    // BFCache (Safari mobile): reset the overlay when the page is restored from cache
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) wipe.classList.remove('is-on');
    });
  }

  // ─── reveal-from-transition on article pages ─────────────────
  // (incoming pages get a soft fade-in via CSS; nothing to do here)

  // ─── newsletter subscription (MailerLite — POST in iframe) ───
  // POST nativo verso un iframe nascosto: nessun CORS, nessun parsing
  // JSON (la risposta resta dentro l'iframe), quindi nessun errore di
  // script. È il metodo più affidabile per un sito statico.
  const ML_SUBSCRIBE = 'https://assets.mailerlite.com/jsonp/2449988/forms/190452260255303327/subscribe';

  const mlFrame = document.createElement('iframe');
  mlFrame.name = 'ml_target';
  mlFrame.setAttribute('aria-hidden', 'true');
  mlFrame.style.cssText = 'position:absolute;left:-9999px;top:0;width:0;height:0;border:0;';
  document.body.appendChild(mlFrame);

  document.querySelectorAll('.b-foot__form').forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const input = this.querySelector('input[type="email"]');
      const btn   = this.querySelector('button[type="submit"]');
      const email = (input?.value || '').trim();
      if (!email) return;
      // form temporaneo che invia il POST dentro l'iframe nascosto
      const tmp = document.createElement('form');
      tmp.action = ML_SUBSCRIBE;
      tmp.method = 'post';
      tmp.target = 'ml_target';
      tmp.style.display = 'none';
      tmp.innerHTML =
        '<input name="fields[email]">' +
        '<input name="ml-submit" value="1">' +
        '<input name="anticsrf" value="true">';
      tmp.querySelector('input[name="fields[email]"]').value = email;
      document.body.appendChild(tmp);
      tmp.submit();
      setTimeout(() => tmp.remove(), 2000);
      input.value = '';
      btn.textContent = 'grazie ·';
    });
  });

  // ─── language toggle ─────────────────────────────────────────
  const EN = {
    // shared nav
    'nav.lavori':           'works',
    'nav.diario':           'journal',
    'nav.software':         'software',
    'nav.contatti':         'contacts',
    // shared footer links
    'foot.link.profilo':    'profile',
    'foot.link.lavori':     'works',
    'foot.link.contatti':   'contacts',
    'foot.col.altrove':     'elsewhere',
    // shared footer diary newsletter
    'foot.diary.title':     'the journal <span class="s">/</span> by <b>mail</b>',
    'foot.diary.sub':       'A few writings a month, never more than two. No promotions, no notifications. Just things that seem worth remembering.',
    'foot.subscribe':       'subscribe →',
    // index banner
    'index.meta2':          'open journal, non-periodic',
    'index.l1':             'architectural',
    'index.l2':             '/ inclinations',
    'index.lede':           'An open notebook. Annotations, photographs, detours. Things seen on scaffolding, readings left in a pocket, dialogues with matter. <em>Brief writings, the occasional long dive.</em>',
    // index filters
    'filter.tutti':         'all',
    'filter.cantiere':      'site',
    'filter.progetto':      'project',
    'filter.riflessioni':   'reflections',
    'filter.pubblicazioni': 'publications',
    // studio page
    'studio.kind':          'studio',
    'studio.since':         'active since 2000',
    'studio.h1':            'two names <span class="s">/</span> one oblique <b>line</b>',
    'studio.lede':          'Stefano Cibelli and Piero Guadagno graduated in architecture from La Sapienza in Rome. After graduating they began their professional practice in Troia (FG), their hometown, founding Cibelli / Guadagno architetti. They work on architectural design, recovery and conservation restoration of historic heritage, and design. The slash in the name is not a separator: it is the position from which they look.',
    'studio.rail.tipo':     'architects',
    'studio.rail.sede':     'troia (fg), puglia',
    'studio.rail.attivi':   'since 2000',
    'studio.rail.settori':  'restoration · interiors · design',
    'studio.p1':            'The studio was born from the meeting of two sensibilities formed at the same school and then matured on different building sites. Stefano Cibelli and Piero Guadagno each bring their own practice of reading spaces — of listening, before design. Together they work by subtraction and addition: every new element must earn its place among what already exists.',
    'studio.p2':            'Together they design restorations, interiors, small buildings and design pieces. The scale of work varies — from a door to a palace — but the method remains unchanged: long listening, slow decisions, precise execution.',
    'studio.h2.what':       'what we <b>do</b>',
    'studio.p3':            'Architectural design and functional recovery of existing buildings. Conservation restoration of historic heritage, with attention to stratigraphy and material compatibility. Design of residential and commercial interiors. Design of objects for artisan production. Consultancy on purchase and transformation of historic properties in Puglia and southern Italy.',
    'studio.p4':            'In 2000 they participated in the Venice Biennale with a project that won an ideas competition, exhibited in the Italian pavilion in the "Third Millennium Cities" section. In 2002 they restored the Cathedral of Troia and built its Treasury Museum. They collaborated with the University of Basilicata as teachers on the RECPOLIS post-graduate master.',
    'studio.p5':            'In design, they create objects evoking the sedimentary forms of popular memory — artefacts speaking of peasant tradition. The collection "Tra Arte e Design" with the De Mura brand was presented at Fuorisalone in Milan in 2012; two pieces were shown at the Triennale di Milano in 2013 and 2014 in the HABITAPULIA exhibition curated by Michele De Lucchi.',
    'studio.pull':          'the / does not separate: <em>it inclines</em>.',
    'studio.pull.src':      '— from the studio presentation',
    'studio.h2.method':     'the <b>method</b>',
    'studio.p.method1':     'Every project begins with a long site visit. Not to take measurements — those come later — but to listen. An abandoned building tells more than a specification. A crumbling wall says things no archive document can say.',
    'studio.p.method2':     'The sampling phase — mortars, colours, finishes — is for us part of the design, not a verification. It is the moment when the material responds and the project adjusts. Patience here is not a virtue: it is a technique.',
    'studio.team':          'team',
    'studio.bio.sc':        '<strong>stefano cibelli</strong> born in Turin in 1968. degree in architecture from La Sapienza in Rome. specialised in conservation restoration and historic building design. based in Troia (FG) since 2000.',
    'studio.bio.pg':        '<strong>piero guadagno</strong> born in Foggia in 1969. degree in architecture from La Sapienza in Rome. works on architectural design, interiors and object design. based in Troia (FG) since 2000.',
    // lavori page
    'lavori.meta1':         '2000 / ongoing',
    'lavori.meta2':         'restoration · interiors · design',
    'lavori.l1':            'selected',
    'lavori.l2':            '/ works',
    'lavori.lede':          'A selection of completed and ongoing projects. Conservation restorations, residential interiors, public spaces, design objects. <em>Every work is a dialogue with matter and time.</em>',
    'lavori.tag.restauro':  'restoration',
    'lavori.tag.interni':   'interiors',
    'lavori.tag.spazi':     'public spaces',
    'lavori.foot.title':    'do you have a <span class="s">/</span> <b>project</b>?',
    'lavori.foot.sub':      'Tell us about it. We work mainly in Puglia and southern Italy, but travel willingly for restoration.',
    'lavori.foot.btn':      'write to us →',
    // contatti page
    'contatti.kind':        'contacts',
    'contatti.location':    'troia (fg) · puglia',
    'contatti.h1':          'write to us <span class="s">/</span> we are <b>listeners</b>',
    'contatti.lede':        'For professional commissions, consultations, educational collaborations or simply to tell us about a project you have in mind. We reply within three working days, usually sooner.',
    'contatti.rail.sede':   'location',
    'contatti.body.p1':     'The studio is in Troia (FG), in Puglia, their hometown. Receiving clients in the studio is part of our work — the place where people meet is already something of a statement of intent.',
    'contatti.body.p2':     'We work mainly in Puglia and southern Italy. For restoration commissions we travel willingly: matter, wherever it is, speaks more or less the same language.',
    'contatti.h2.project':  'for a <b>project</b>',
    'contatti.p.project1':  'The first meeting is always free and informal. You tell us what you have in mind, we listen, we ask a few questions. Then, if there is mutual interest, we prepare a written commission proposal: clear, no surprises.',
    'contatti.p.project2':  'We do not take on every project offered to us — not out of snobbery, but out of respect: a commission we cannot follow well is better not taken. When we say no, we say it early and suggest alternatives.',
    'contatti.h2.collab':   'for <b>collaborations</b>',
    'contatti.p.collab':    'We are open to collaborations with like-minded professionals — structural engineers, landscape architects, photographers, craftspeople. If you have a project where you think we could bring something useful, write to us without formality.',
    'contatti.grid.studio': 'studio',
    'contatti.grid.recapiti':'contacts',
    'contatti.grid.altrove':'elsewhere',
    'contatti.grid.orari':  'hours',
    'contatti.grid.days':   'mon – fri',
    'contatti.grid.appt':   'by appointment',
    // article pages — generic labels only (article content stays in its own language)
    'art.rail.committente': 'client',
    'art.rail.luogo':       'location',
    'art.rail.team':        'team',
    'art.rail.fotografia':  'photography',
    'art.colophon':         'colophon',
    'art.share':            'share',
    'art.copy':             'copy link',
    'art.back.label':       'back to the journal <span class="s" style="color:var(--accent);font-weight:200;padding:0 .14em;">/</span>',
    'art.back.title':       'all the <b>posts</b>',
  };

  // per-page translations: each page (article) can define its own
  // window.PAGE_EN = { 'p.xxx': '...' } in an inline <script> — merged here
  Object.assign(EN, window.PAGE_EN || {});

  const _itCache = {};
  let _lang = localStorage.getItem('cg-lang') || 'it';

  function applyLang(lang) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (lang === 'en' && EN[key] !== undefined) {
        if (_itCache[key] === undefined) _itCache[key] = el.innerHTML;
        el.innerHTML = EN[key];
      } else if (lang === 'it' && _itCache[key] !== undefined) {
        el.innerHTML = _itCache[key];
      }
    });
    document.documentElement.lang = lang;
    const btn = document.querySelector('.b-head__lang');
    if (btn) btn.textContent = lang === 'en' ? 'en / it' : 'it / en';
    _lang = lang;
    localStorage.setItem('cg-lang', lang);
  }

  const langBtn = document.querySelector('.b-head__lang');
  if (langBtn) langBtn.addEventListener('click', () => applyLang(_lang === 'it' ? 'en' : 'it'));
  if (_lang === 'en') applyLang('en');

})();
