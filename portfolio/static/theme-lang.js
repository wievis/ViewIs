// theme-lang.js: motyw jasny/ciemny + przelacznik jezyka
const themeToggle = document.getElementById('theme-toggle');
const langToggle = document.getElementById('lang-toggle');

function applyTheme(light) {
    document.documentElement.classList.toggle('light-mode', light);
    document.body.classList.toggle('light-mode', light);
}

let savedLight = false;
try { savedLight = localStorage.getItem('theme') === 'light'; } catch (e) {}
applyTheme(savedLight);
if (themeToggle) {
    themeToggle.checked = savedLight;
    themeToggle.addEventListener('change', e => {
        applyTheme(e.target.checked);
        try { localStorage.setItem('theme', e.target.checked ? 'light' : 'dark'); } catch (err) {}
    });
}

const LANG_MAP = [
    ['/', '/en/'],
    ['/portfolio/', '/en/portfolio/'],
    ['/artykuly/', '/en/articles/'],
    ['/o-mnie/', '/en/about/'],
    ['/mep/', '/en/mep/'],
    ['/kontakt/', '/en/contact/']
];

function swapLangPath(path, toPl) {
    for (const [pl, en] of LANG_MAP) {
        const from = toPl ? en : pl;
        const to = toPl ? pl : en;
        if (from === '/') { if (path === '/') return to; continue; }
        if (path === from || path.startsWith(from)) return to + path.slice(from.length);
    }
    return toPl ? '/' : '/en/';
}

if (langToggle) {
    langToggle.addEventListener('change', e => {
        const toPl = e.target.checked; // zaznaczony = PL
        setTimeout(() => {
            window.location.href = swapLangPath(window.location.pathname, toPl);
        }, 450);
    });
}
