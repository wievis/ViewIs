// lightbox.js
let currentIndex = 0;
let lbTouchStartX = 0;
let lbTouchStartY = 0;

function updateMenuHeight() {
    if (window.innerWidth <= 768) {
        const menu = document.querySelector('.menu');
        if (menu) {
            const menuHeight = menu.offsetHeight;
            document.documentElement.style.setProperty('--menu-height', menuHeight + 'px');
        }
    } else {
        document.documentElement.style.removeProperty('--menu-height');
    }
}

function createMediaElement(item) {
    const content = document.querySelector('.lightbox-content');
    content.innerHTML = '';
    
    if (item.type === 'image') {
        const img = document.createElement('img');
        img.src = item.url;
        content.appendChild(img);
    } else if (item.type === 'video') {
        const video = document.createElement('video');
        video.src = item.url;
        video.controls = true;
        video.autoplay = true;
        content.appendChild(video);
    } else if (item.type === 'model3d') {
        const viewer = document.createElement('div');
        viewer.className = 'model-viewer';
        viewer.dataset.model = item.url;
        viewer.dataset.hdr = item.hdr || '';
        viewer.style.width = '100%';
        viewer.style.height = '100%';
        content.appendChild(viewer);
        
        setTimeout(() => {
            if (window.initSingleModelViewer) window.initSingleModelViewer(viewer);
        }, 50);
    }
}

function openLightbox(index) {
    currentIndex = index;
    updateMenuHeight();
    createMediaElement(window.mediaItems[currentIndex]);
    document.getElementById('lightbox').classList.add('active');
}

function changePhoto(direction) {
    currentIndex += direction;
    if (currentIndex < 0) currentIndex = window.mediaItems.length - 1;
    if (currentIndex >= window.mediaItems.length) currentIndex = 0;
    createMediaElement(window.mediaItems[currentIndex]);
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
}

const lb = document.getElementById('lightbox');

lb.addEventListener('touchstart', e => {
    lbTouchStartX = e.changedTouches[0].screenX;
    lbTouchStartY = e.changedTouches[0].screenY;
}, { passive: true });

lb.addEventListener('touchend', e => {
    const endX = e.changedTouches[0].screenX;
    const endY = e.changedTouches[0].screenY;
    
    const diffX = lbTouchStartX - endX;
    const diffY = lbTouchStartY - endY;
    const threshold = 50;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > threshold) {
            diffX > 0 ? changePhoto(1) : changePhoto(-1);
        }
    } else {
        if (diffY > threshold && Math.abs(diffY) > 70) {
            closeLightbox();
        }
    }
}, { passive: true });

document.addEventListener('keydown', e => {
    if (!lb.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') changePhoto(-1);
    if (e.key === 'ArrowRight') changePhoto(1);
});

window.addEventListener('resize', updateMenuHeight);
updateMenuHeight();