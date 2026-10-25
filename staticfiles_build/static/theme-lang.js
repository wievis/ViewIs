(function () {
    const themeToggles = Array.from(document.querySelectorAll('.theme-toggle'));
    const langToggles = Array.from(document.querySelectorAll('.lang-toggle'));

    // ---------- motyw ----------
    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch (e) {}
    const applyTheme = light => {
        document.documentElement.classList.toggle('light-mode', light);
        document.body.classList.toggle('light-mode', light);
        themeToggles.forEach(t => { t.checked = light; });
    };
    applyTheme(saved === 'light');

    themeToggles.forEach(t => t.addEventListener('change', e => {
        const light = e.target.checked;
        applyTheme(light);
        try { localStorage.setItem('theme', light ? 'light' : 'dark'); } catch (err) {}
    }));

    // ---------- język ----------
    const PAIRS = [
        ['/portfolio/', '/en/portfolio/'],
        ['/o-mnie/', '/en/about/'],
        ['/kontakt/', '/en/contact/'],
        ['/mep/', '/en/mep/'],
        ['/', '/en/']
    ];

    function targetPath(toEn) {
        const path = window.location.pathname;
        const art = toEn ? ['/artykuly/', '/en/articles/'] : ['/en/articles/', '/artykuly/'];
        if (path.startsWith(art[0])) return art[1] + path.slice(art[0].length);
        for (const [pl, en] of PAIRS) {
            if (path === (toEn ? pl : en)) return toEn ? en : pl;
        }
        return toEn ? '/en/' : '/';
    }

    langToggles.forEach(t => t.addEventListener('change', e => {
        const toEn = !e.target.checked;   // zaznaczony = PL
        const lbEl = document.getElementById('lightbox');
        const lbActive = lbEl ? lbEl.classList.contains('active') : false;
        const state = { scroll: window.pageYOffset || document.documentElement.scrollTop || 0 };
        if (lbActive && typeof window.lbGetCurrentId === 'function') state.lb = window.lbGetCurrentId();
        try { sessionStorage.setItem('viewis-restore', JSON.stringify(state)); } catch (err) {}
        setTimeout(() => { window.location.href = targetPath(toEn); }, 450);
    }));
})();