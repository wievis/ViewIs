// theme-lang.js

const themeToggle = document.getElementById('theme-toggle');
const langToggle = document.getElementById('lang-toggle');

const currentTheme = localStorage.getItem('theme') || 'dark';
if (currentTheme === 'light') {
    document.body.classList.add('light-mode');
    themeToggle.checked = true;
}

themeToggle.addEventListener('change', function() {
    if (this.checked) {
        document.body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
    }
});

langToggle.addEventListener('change', function(e) {
    const isLightboxActive = document.getElementById('lightbox').classList.contains('active');
    const currentLightboxIndex = isLightboxActive ? currentIndex : null;
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    setTimeout(() => {
        const targetPath = this.checked 
            ? (window.location.pathname === '/en/contact/' ? '/kontakt/' : '/')
            : (window.location.pathname === '/kontakt/' ? '/en/contact/' : '/en/');
        
        if (isLightboxActive && currentLightboxIndex !== null) {
            window.location.href = targetPath + '?lightbox=' + currentLightboxIndex;
        } else {
            window.location.href = targetPath + '?scroll=' + scrollPosition;
        }
    }, 450);
});