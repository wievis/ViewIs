// theme-lang.js
const themeToggle = document.getElementById('theme-toggle');
const themeToggleMob = document.getElementById('theme-toggle-mob');
const langToggle = document.getElementById('lang-toggle');
const langToggleMob = document.getElementById('lang-toggle-mob');

const currentTheme = localStorage.getItem('theme') || 'dark';
if (currentTheme === 'light') {
    document.body.classList.add('light-mode');
    if(themeToggle) themeToggle.checked = true;
    if(themeToggleMob) themeToggleMob.checked = true;
}

const handleThemeChange = (e) => {
    const isChecked = e.target.checked;
    if (isChecked) {
        document.body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
    }
    if(themeToggle) themeToggle.checked = isChecked;
    if(themeToggleMob) themeToggleMob.checked = isChecked;
};

if(themeToggle) themeToggle.addEventListener('change', handleThemeChange);
if(themeToggleMob) themeToggleMob.addEventListener('change', handleThemeChange);

const handleLangChange = (e) => {
    const isChecked = e.target.checked;
    const isLightboxActive = document.getElementById('lightbox').classList.contains('active');
    const currentLightboxIndex = isLightboxActive ? currentIndex : null;
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    setTimeout(() => {
        const targetPath = isChecked 
            ? (window.location.pathname === '/en/contact/' ? '/kontakt/' : '/')
            : (window.location.pathname === '/kontakt/' ? '/en/contact/' : '/en/');
        
        if (isLightboxActive && currentLightboxIndex !== null) {
            window.location.href = targetPath + '?lightbox=' + currentLightboxIndex;
        } else {
            window.location.href = targetPath + '?scroll=' + scrollPosition;
        }
    }, 450);
};

if(langToggle) langToggle.addEventListener('change', handleLangChange);
if(langToggleMob) langToggleMob.addEventListener('change', handleLangChange);