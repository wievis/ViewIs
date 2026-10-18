(function () {
    // header: tlo po przewinieciu
            const header = document.getElementById('site-header');
    const heroBackdrop = document.getElementById('hero-backdrop');
    const heroMedia = document.getElementById('hero-media');
    const heroScrollDim = document.getElementById('hero-scroll-dim');

    const onScroll = () => {
        const y = window.scrollY;
        if (header) header.classList.toggle('solid', y > 40);
        if (!heroBackdrop) return;

        const vh = window.innerHeight;
        const progress = Math.min(1, Math.max(0, y / (vh * 2.0)));

        if (heroMedia) {
            heroMedia.style.transform = `translate3d(0, ${-y * 0.16}px, 0)`;
        }
        if (heroScrollDim) {
            heroScrollDim.style.opacity = progress.toFixed(3);
        }
        if (y > vh * 2.3) {
            if (heroBackdrop.style.visibility !== 'hidden') heroBackdrop.style.visibility = 'hidden';
        } else {
            if (heroBackdrop.style.visibility === 'hidden') heroBackdrop.style.visibility = 'visible';
        }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    // menu mobilne
    const toggle = document.getElementById('nav-toggle');
    const nav = document.getElementById('site-nav');
    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            const open = nav.classList.toggle('open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            header.classList.toggle('menu-open', open);
        });
        nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
            nav.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
            header.classList.remove('menu-open');
        }));
    }

    // pojawianie sie sekcji
    const els = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(entries => entries.forEach(en => {
            if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        }), { threshold: 0.12 });
        els.forEach(el => io.observe(el));
    } else {
        els.forEach(el => el.classList.add('in'));
    }

    // hero: wideo z crossfade
    let vids = Array.from(document.querySelectorAll('.hero-video'));
    if (vids.length) {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
            (navigator.connection && navigator.connection.saveData);
        if (reduce) {
            vids.forEach(v => v.remove());
        } else {
            let list = vids.slice();
            let i = 0;
            const load = v => { if (v && !v.getAttribute('src')) { v.src = v.dataset.src; v.preload = 'auto'; } };
            const show = n => {
                list.forEach((v, k) => {
                    if (k === n) {
                        load(v);
                        try { v.currentTime = 0; } catch (e) {}
                        v.classList.add('active');
                        const p = v.play(); if (p && p.catch) p.catch(() => {});
                    } else {
                        v.classList.remove('active');
                        setTimeout(() => { if (!v.classList.contains('active')) v.pause(); }, 1600);
                    }
                });
                load(list[(n + 1) % list.length]);
            };
            list.forEach(v => {
                v.addEventListener('ended', () => {
                    if (list.length === 1) { v.currentTime = 0; v.play(); return; }
                    i = (list.indexOf(v) + 1) % list.length;
                    show(i);
                });
                v.addEventListener('error', () => {
                    const cur = list[i];
                    list = list.filter(x => x !== v);
                    v.remove();
                    if (!list.length) return;
                    if (cur === v) { i = i % list.length; show(i); } else { i = list.indexOf(cur); }
                });
            });
            show(0);
        }
    }

    // portfolio: filtry
    const chips = document.querySelectorAll('.chip[data-filter]');
    if (chips.length) {
        chips.forEach(chip => chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const f = chip.dataset.filter;
            document.querySelectorAll('.gallery [data-cat]').forEach(el => {
                el.style.display = (f === 'all' || el.dataset.cat === f) ? '' : 'none';
            });
            window.dispatchEvent(new Event('resize'));
        }));
    }

    // artykuly: przycisk kopiowania kodu
    document.querySelectorAll('.prose .codehilite, .prose pre').forEach(block => {
        if (block.parentElement.classList.contains('codehilite')) return;
        if (!block.classList.contains('codehilite')) { block.style.position = 'relative'; }
        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.type = 'button';
        btn.textContent = document.documentElement.lang === 'en' ? 'COPY' : 'KOPIUJ';
        btn.addEventListener('click', async () => {
            const code = block.querySelector('pre') || block;
            try { await navigator.clipboard.writeText(code.innerText); btn.textContent = 'OK'; } catch (e) { btn.textContent = '!'; }
            setTimeout(() => { btn.textContent = document.documentElement.lang === 'en' ? 'COPY' : 'KOPIUJ'; }, 1400);
        });
        block.appendChild(btn);
    });
})();
