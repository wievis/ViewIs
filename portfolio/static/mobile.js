/* mobile.js · ViewIs · logika UI ≤768 px (na desktopie nic nie robi) */
(function () {
  'use strict';
  const $  = id => document.getElementById(id);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const mq = matchMedia('(max-width:768px)');
  const conn = navigator.connection || {};
  const LITE = !!conn.saveData || /2g|3g/.test(conn.effectiveType || '');   // oszczędzanie transferu

  // uruchom raz, gdy viewport jest „mobilny” (od razu albo po zmianie rozmiaru)
  function onMobile(fn) {
    let done = false;
    const run = () => { if (!done && mq.matches) { done = true; fn(); } };
    run();
    if (mq.addEventListener) mq.addEventListener('change', run); else mq.addListener(run);
  }

  // theme-color przeglądarki = aktualne tło motywu
  const tc = document.createElement('meta'); tc.name = 'theme-color'; document.head.appendChild(tc);
  const syncTc = () => { tc.content = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(); };
  new MutationObserver(syncTc).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  syncTc();

  // lazy loader model-viewer (wywołuje go lightbox.js przy pierwszym modelu 3D)
  window.loadModelViewer = () => {
    if (window.__mv) return;
    window.__mv = true;
    const s = document.createElement('script');
    s.type = 'module';
    s.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
    document.head.appendChild(s);
  };

  // ── 1 · powłoka: szuflada, CTA, klawiatura, linia postępu
  onMobile(() => {
    const more = $('m-more'), sheet = $('m-sheet'), scrim = $('m-scrim');
    if (more && sheet && scrim) {
      const open = on => {
        sheet.classList.toggle('open', on);
        scrim.classList.toggle('open', on);
        sheet.setAttribute('aria-hidden', String(!on));
        more.setAttribute('aria-expanded', String(on));
        document.documentElement.style.overflow = on ? 'hidden' : '';
        if (on) { const a = sheet.querySelector('a'); if (a) a.focus({ preventScroll: true }); }
        else more.focus({ preventScroll: true });
      };
      more.addEventListener('click', () => open(!sheet.classList.contains('open')));
      scrim.addEventListener('click', () => open(false));
      sheet.addEventListener('click', e => { if (e.target.closest('a')) open(false); });
      addEventListener('keydown', e => { if (e.key === 'Escape' && sheet.classList.contains('open')) open(false); });

      let y0 = null;                                   // swipe w dół zamyka szufladę
      sheet.addEventListener('touchstart', e => { y0 = sheet.scrollTop === 0 ? e.touches[0].clientY : null; }, { passive: true });
      sheet.addEventListener('touchmove', e => {
        if (y0 === null) return;
        const dy = e.touches[0].clientY - y0;
        if (dy > 0) { sheet.style.transition = 'none'; sheet.style.transform = 'translateY(' + dy + 'px)'; }
      }, { passive: true });
      sheet.addEventListener('touchend', e => {
        if (y0 === null) return;
        const dy = e.changedTouches[0].clientY - y0;
        y0 = null;
        sheet.style.transition = '';
        sheet.style.transform = '';
        if (dy > 80) open(false);
      });
    }

    const cta = $('m-cta'), contact = $('contact');
    if (cta && contact) {
      cta.addEventListener('click', e => { e.preventDefault(); contact.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([en]) => document.body.classList.toggle('m-contact-in', en.isIntersecting), { threshold: .15 }).observe(contact);
      }
    }
    document.addEventListener('focusin', e => {
      if (e.target.matches('input:not([type=checkbox]),textarea,select')) document.body.classList.add('m-kbd');
    });
    document.addEventListener('focusout', () => document.body.classList.remove('m-kbd'));

    const hdr = $('site-header');
    if (hdr) {
      const upd = () => {
        const h = document.documentElement.scrollHeight - innerHeight;
        hdr.style.setProperty('--m-p', h > 0 ? Math.min(1, scrollY / h).toFixed(3) : 0);
      };
      addEventListener('scroll', upd, { passive: true });
      upd();
    }
  });

  // ── 2 · komponenty treści
  function accordion(cards, openFirst) {
    cards.forEach((card, i) => {
      const head = card.querySelector('h3');
      if (!head) return;
      card.classList.add('m-acc');
      head.setAttribute('role', 'button');
      head.tabIndex = 0;
      const set = on => { card.classList.toggle('is-open', on); head.setAttribute('aria-expanded', String(on)); };
      set(openFirst && i === 0);
      card.addEventListener('click', e => { if (e.target.closest('h3, .cell-h')) set(!card.classList.contains('is-open')); });
      head.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); head.click(); } });
    });
  }

  function snapDots(track) {
    const items = Array.from(track.children);
    if (items.length < 2 || !('IntersectionObserver' in window)) return;
    const dots = document.createElement('div');
    dots.className = 'm-dots';
    items.forEach(() => dots.appendChild(document.createElement('i')));
    (track.closest('table') || track).after(dots);
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) Array.from(dots.children).forEach((d, k) => d.classList.toggle('on', items[k] === en.target));
    }), { root: track, threshold: .6 });
    items.forEach(el => io.observe(el));
  }

  function labelTables() {            // nagłówki <th> → data-label w <td> (z uwzględnieniem colspan)
    $$('.eng-tbl.m-cards').forEach(t => {
      const head = $$('thead th', t).map(th => th.textContent.trim());
      $$('tbody tr, tfoot tr', t).forEach(tr => {
        let col = 0;
        Array.from(tr.cells).forEach(td => {
          if (td.colSpan === 1 && head[col]) td.dataset.label = head[col];
          col += td.colSpan;
        });
      });
    });
  }

  onMobile(() => {
    accordion($$('#domains .cut.eng-cell'), true);
    accordion($$('.about-grid .competency'), false);
    labelTables();
    ['#roles .cut-grid', '#quality .eng-grid', '.eng-tbl.m-cards--swipe tbody', '.featured'].forEach(s => $$(s).forEach(snapDots));
  });

  // ── 3 · portfolio: bez WebGL w siatce, rytm kafli, „Pokaż więcej”
  onMobile(() => {
    const grid = document.querySelector('.portfolio-grid');
    if (!grid) return;
    $$('model-viewer', grid).forEach(mv => mv.remove());     // modele ładuje dopiero lightbox
    const en = document.documentElement.lang === 'en', LIMIT = 8;
    let shown = LIMIT;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-ghost m-more';
    grid.after(btn);
    const refresh = () => {
      const vis = Array.from(grid.children).filter(c => c.style.display !== 'none');
      vis.forEach((c, i) => { c.classList.toggle('is-wide', i % 5 === 0); c.classList.toggle('m-hide', i >= shown); });
      const rest = vis.length - shown;
      btn.hidden = rest <= 0;
      btn.textContent = (en ? 'Show more' : 'Pokaż więcej') + ' (' + rest + ')';
    };
    btn.addEventListener('click', () => { shown += LIMIT; refresh(); });
    document.addEventListener('portfolio:filtered', () => { shown = LIMIT; refresh(); });
    $$('.filters .filter-btn').forEach(b => b.addEventListener('click',
      () => b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })));
    refresh();
  });

  // ── 4 · wideo w kafelkach: <video data-src preload="none">.
  //    Desktop startuje wszystko od razu, jak dotąd. Mobile: tylko to, co widać na ekranie.
  const vids = $$('.portfolio-card video[data-src]');
  if (vids.length) {
    const start = v => { if (!v.src) v.src = v.dataset.src; const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    if (!mq.matches) vids.forEach(start);
    else if (!LITE && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(en => en.isIntersecting ? start(en.target) : en.target.pause()),
        { rootMargin: '80px', threshold: .25 });
      vids.forEach(v => io.observe(v));
    }   // LITE: tylko plakat, a wideo startuje dopiero w lightboxie
  }
})();
