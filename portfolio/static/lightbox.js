let currentGroup = [];
let currentGroupIndex = 0;
let lbTouchStartX = 0;
let lbTouchStartY = 0;

function setLoader(progress) {
    const bar = document.getElementById('lb-progress-bar');
    if (!bar) return;
    if (progress === null) {
        bar.style.opacity = '0';
        setTimeout(() => { bar.style.width = '0%'; }, 200);
        return;
    }
    bar.style.opacity = '1';
    bar.style.width = Math.min(100, Math.max(0, progress)) + '%';
    if (progress >= 100) {
        setTimeout(() => {
            bar.style.opacity = '0';
            setTimeout(() => { bar.style.width = '0%'; }, 250);
        }, 250);
    }
}

function openLightboxByAlbum(albumId) {
    if (!window.mediaItems) return;
    const group = window.mediaItems.filter(item => item.parentId === albumId);
    if (!group.length) return;
    currentGroup = group;
    currentGroupIndex = 0;
    renderActiveItem();
    openLightboxContainer();
}

function openLightboxById(target) {
    if (!window.mediaItems) return;
    const item = window.mediaItems.find(i => i.id === target || i.url === target);
    if (!item) return;
    if (item.parentId !== null) {
        currentGroup = window.mediaItems.filter(i => i.parentId === item.parentId);
        currentGroupIndex = Math.max(0, currentGroup.findIndex(i => i.id === item.id));
    } else {
        currentGroup = [item];
        currentGroupIndex = 0;
    }
    renderActiveItem();
    openLightboxContainer();
}

function openAlbumPreview(albumId) {
    openLightboxByAlbum(albumId);
}

function openItemPreview(target) {
    openLightboxById(target);
}

function openLightbox(index) {
    if (!window.mediaItems || !window.mediaItems[index]) return;
    openLightboxById(window.mediaItems[index].id);
}

function openLightboxContainer() {
    const lb = document.getElementById('lightbox');
    if (lb) lb.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lb = document.getElementById('lightbox');
    if (lb) lb.classList.remove('active');
    document.body.style.overflow = '';
    const content = document.querySelector('.lightbox-content');
    if (content) content.innerHTML = '';
    setLoader(null);
}

function changePhoto(direction) {
    if (!currentGroup.length) return;
    currentGroupIndex += direction;
    if (currentGroupIndex < 0) currentGroupIndex = currentGroup.length - 1;
    if (currentGroupIndex >= currentGroup.length) currentGroupIndex = 0;
    renderActiveItem();
}

function selectThumb(idx) {
    if (idx < 0 || idx >= currentGroup.length) return;
    currentGroupIndex = idx;
    renderActiveItem();
}

function renderActiveItem() {
    const item = currentGroup[currentGroupIndex];
    if (!item) return;

    const counter = document.getElementById('lb-counter');
    if (counter) {
        if (currentGroup.length > 1) {
            counter.textContent = `${currentGroupIndex + 1} / ${currentGroup.length}`;
        } else {
            counter.textContent = '1 / 1';
        }
    }

    const badge = document.getElementById('lb-badge');
    if (badge) {
        badge.textContent = item.category || (item.type === 'model3d' ? '3D MODEL' : (item.type === 'video' ? 'ANIMACJA' : 'WIZUALIZACJA'));
    }

    const statusText = document.getElementById('lb-status-text');
    const tagEngine = document.getElementById('lb-tag-engine');
    if (statusText) {
        if (item.type === 'model3d') {
            statusText.textContent = 'OBRÓT • ZOOM • PAN';
            if (tagEngine) tagEngine.textContent = 'WEBGL // 3D';
        } else if (item.type === 'video') {
            statusText.textContent = 'ODTWARZANIE WIDEO';
            if (tagEngine) tagEngine.textContent = 'H.264 // MP4';
        } else {
            statusText.textContent = '← → NAWIGACJA • ESC ZAMKNIJ';
            if (tagEngine) tagEngine.textContent = 'FULL-RES RENDER';
        }
    }

    renderThumbnails();

    const prevBtn = document.querySelector('.lb-nav.prev');
    const nextBtn = document.querySelector('.lb-nav.next');
    if (prevBtn && nextBtn) {
        const showNav = currentGroup.length > 1;
        prevBtn.style.display = showNav ? 'flex' : 'none';
        nextBtn.style.display = showNav ? 'flex' : 'none';
    }

    const content = document.querySelector('.lightbox-content');
    if (!content) return;
    content.innerHTML = '';

    setLoader(30);

    if (item.type === 'image') {
        const img = document.createElement('img');
        img.src = item.url;
        img.alt = '';
        img.onload = () => setLoader(100);
        img.onerror = () => setLoader(null);
        content.appendChild(img);
    } else if (item.type === 'video') {
        const video = document.createElement('video');
        video.src = item.url;
        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;
        video.oncanplay = () => setLoader(100);
        content.appendChild(video);
    } else if (item.type === 'model3d') {
        const viewer = document.createElement('model-viewer');
        viewer.src = item.url;
        if (item.hdr) viewer.setAttribute('environment-image', item.hdr);
        viewer.setAttribute('camera-controls', '');
        viewer.setAttribute('auto-rotate', '');
        viewer.setAttribute('shadow-intensity', '1.2');
        viewer.setAttribute('interaction-prompt', 'none');
        viewer.addEventListener('progress', e => {
            const p = Math.round((e.detail.totalProgress || 0) * 100);
            setLoader(p);
        });
        viewer.addEventListener('load', () => setLoader(100));
        content.appendChild(viewer);
    }
}

function renderThumbnails() {
    const wrap = document.getElementById('lb-thumbnails-wrap');
    const container = document.getElementById('lb-thumbnails');
    if (!wrap || !container) return;

    if (currentGroup.length <= 1) {
        wrap.style.display = 'none';
        container.innerHTML = '';
        return;
    }

    wrap.style.display = 'flex';
    container.innerHTML = '';

    currentGroup.forEach((it, idx) => {
        const thumb = document.createElement('button');
        thumb.type = 'button';
        thumb.className = 'lb-thumb' + (idx === currentGroupIndex ? ' active' : '');
        thumb.onclick = () => selectThumb(idx);

        if (it.type === 'video') {
            thumb.innerHTML = '<span class="lb-thumb-tag">VID</span>';
        } else if (it.type === 'model3d') {
            thumb.innerHTML = '<span class="lb-thumb-tag">3D</span>';
        } else {
            const img = document.createElement('img');
            img.src = it.thumb || it.url;
            img.alt = '';
            thumb.appendChild(img);
        }
        container.appendChild(thumb);
    });
}

function toggleLightboxFullscreen() {
    const lb = document.getElementById('lightbox');
    if (!lb) return;
    if (!document.fullscreenElement) {
        lb.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen().catch(() => {});
    }
}

const lb = document.getElementById('lightbox');
if (lb) {
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
}

document.addEventListener('keydown', e => {
    const el = document.getElementById('lightbox');
    if (!el || !el.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') changePhoto(-1);
    if (e.key === 'ArrowRight') changePhoto(1);
});
