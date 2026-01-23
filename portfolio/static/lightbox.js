// lightbox.js

let currentIndex = 0;

function updateMenuHeight() {
    if (window.innerWidth <= 768) {
        const menu = document.querySelector('.menu');
        const menuHeight = menu.offsetHeight;
        document.documentElement.style.setProperty('--menu-height', menuHeight + 'px');
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
        video.style.maxWidth = '100%';
        video.style.maxHeight = '100%';
        content.appendChild(video);
    } else if (item.type === 'model3d') {
        const viewer = document.createElement('div');
        viewer.className = 'model-viewer';
        viewer.dataset.model = item.url;
        viewer.dataset.mtl = item.mtl || '';
        viewer.dataset.texture = item.texture || '';
        viewer.dataset.autoRotate = 'false'; // Wyłącz automatyczne obracanie
        viewer.style.width = '100%';
        viewer.style.height = '100%';
        content.appendChild(viewer);
        
        setTimeout(() => {
            initSingleModelViewer(viewer);
        }, 100);
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

document.addEventListener('keydown', function(e) {
    if (document.getElementById('lightbox').classList.contains('active')) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') changePhoto(-1);
        if (e.key === 'ArrowRight') changePhoto(1);
    }
});

window.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const lightboxIndex = urlParams.get('lightbox');
    const scrollPosition = urlParams.get('scroll');
    
    if (lightboxIndex !== null) {
        openLightbox(parseInt(lightboxIndex));
        window.history.replaceState({}, '', window.location.pathname);
    } else if (scrollPosition !== null) {
        window.scrollTo(0, parseInt(scrollPosition));
        window.history.replaceState({}, '', window.location.pathname);
    }
});

window.addEventListener('resize', updateMenuHeight);
updateMenuHeight();