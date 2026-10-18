let currentGroup = [];
let currentGroupIndex = 0;
let lbTouchStartX = 0;
let lbTouchStartY = 0;
let progressInterval = null;
let currentProgress = 0;
let lbProjects = [];
let lbProjectIndex = -1;
let lastRailPid = null;

function startLoader() {
    const bar = document.getElementById('lb-progress-bar');
    if (!bar) return;
    clearInterval(progressInterval);
    currentProgress = 14;
    bar.style.opacity = '1';
    bar.style.transition = 'width 0.35s cubic-bezier(0.1, 0.7, 0.1, 1), opacity 0.25s ease';
    bar.style.width = currentProgress + '%';
    progressInterval = setInterval(() => {
        if (currentProgress < 75) {
            currentProgress += (75 - currentProgress) * 0.08;
            bar.style.width = currentProgress.toFixed(1) + '%';
        }
    }, 140);
}

function completeLoader() {
    clearInterval(progressInterval);
    const bar = document.getElementById('lb-progress-bar');
    if (!bar) return;
    bar.style.transition = 'width 0.22s ease-out, opacity 0.3s ease';
    bar.style.width = '100%';
    setTimeout(() => {
        bar.style.opacity = '0';
        setTimeout(() => {
            bar.style.width = '0%';
        }, 300);
    }, 220);
}

function resetLoader() {
    clearInterval(progressInterval);
    const bar = document.getElementById('lb-progress-bar');
    if (!bar) return;
    bar.style.opacity = '0';
    bar.style.width = '0%';
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
    lastRailPid = null;
    const content = document.querySelector('.lightbox-content');
    if (content) content.innerHTML = '';
    resetLoader();
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

    const pid = (item.parentId !== null && item.parentId !== undefined) ? item.parentId : item.id;
    syncRail(pid);

    const counter = document.getElementById('lb-counter');
    if (counter) {
        counter.textContent = currentGroup.length > 1 ? `${currentGroupIndex + 1} / ${currentGroup.length}` : '1 / 1';
    }

    const badge = document.getElementById('lb-badge');
    if (badge) {
        badge.textContent = item.category || (item.type === 'model3d' ? '3D MODEL' : (item.type === 'video' ? 'ANIMACJA' : 'WIZUALIZACJA'));
    }

    const cluster = document.getElementById('lb-status-cluster');
    const statusText = document.getElementById('lb-status-text');
    const tagEngine = document.getElementById('lb-tag-engine');

    if (item.type === 'model3d') {
        if (cluster) cluster.style.display = 'inline-flex';
        if (statusText) statusText.style.display = 'none';
        if (tagEngine) tagEngine.textContent = 'WEBGL // 3D';
    } else {
        if (cluster) cluster.style.display = 'none';
        if (statusText) {
            statusText.style.display = 'inline-flex';
            statusText.textContent = item.type === 'video' ? 'ODTWARZANIE WIDEO' : '← → ZDJĘCIA • ↑ ↓ PROJEKTY • ESC ZAMKNIJ';
        }
        if (tagEngine) tagEngine.textContent = item.type === 'video' ? 'H.264 // MP4' : 'FULL-RES RENDER';
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

    startLoader();

    if (item.type === 'image') {
        const img = document.createElement('img');
        img.src = item.url;
        img.alt = '';
        img.onload = () => completeLoader();
        img.onerror = () => resetLoader();
        content.appendChild(img);
    } else if (item.type === 'video') {
        const video = document.createElement('video');
        video.src = item.url;
        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;
        video.oncanplay = () => completeLoader();
        content.appendChild(video);
    } else if (item.type === 'model3d') {
        const wf = document.createElement('div');
        wf.className = 'lb-wireframe-loader';
        wf.id = 'lb-wireframe-loader';
        wf.innerHTML = '<div class="lb-wireframe-cube"><div class="lb-cube-face"></div><div class="lb-cube-face"></div><div class="lb-cube-face"></div></div><span class="lb-wireframe-text">ŁADOWANIE SIATKI GEOMETRII...</span>';
        content.appendChild(wf);

        const viewer = document.createElement('model-viewer');
        viewer.src = item.url;
        if (item.hdr) viewer.setAttribute('environment-image', item.hdr);
        viewer.setAttribute('camera-controls', '');
        viewer.setAttribute('auto-rotate', '');
        viewer.setAttribute('shadow-intensity', '1.2');
        viewer.setAttribute('interaction-prompt', 'none');
        viewer.style.opacity = '0';
        viewer.style.transition = 'opacity 0.4s ease';

        viewer.addEventListener('progress', e => {
            const p = Math.round((e.detail.totalProgress || 0) * 100);
            if (p > currentProgress) {
                currentProgress = p;
                const bar = document.getElementById('lb-progress-bar');
                if (bar) bar.style.width = p + '%';
            }
        });

        viewer.addEventListener('load', () => {
            completeLoader();
            const w = document.getElementById('lb-wireframe-loader');
            if (w) {
                w.style.opacity = '0';
                setTimeout(() => w.remove(), 350);
            }
            viewer.style.opacity = '1';
        });

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
        const curItem = currentGroup[currentGroupIndex];
        if (curItem && curItem.type === 'model3d') return;
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
            if (Math.abs(diffY) > 70) {
                if (lbProjects.length > 1) changeProject(diffY > 0 ? 1 : -1);
                else if (diffY > 0) closeLightbox();
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
    if (e.key === 'ArrowUp') { e.preventDefault(); changeProject(-1); }
    if (e.key === 'ArrowDown') { e.preventDefault(); changeProject(1); }
});

// ---------- przełączanie projektów (panel po prawej) ----------
function collectProjects() {
    const nodes = Array.from(document.querySelectorAll('[data-lb-id]'))
        .filter(el => el.style.display !== 'none');
    lbProjects = nodes.map(el => ({
        id: Number(el.dataset.lbId),
        kind: el.dataset.lbKind || 'item',
        title: el.dataset.lbTitle || '',
        meta: el.dataset.lbMeta || '',
        thumb: el.dataset.lbThumb || '',
        type: el.dataset.lbType || 'image',
        count: Number(el.dataset.lbCount || 1)
    }));
}

function openProject(p) {
    if (!window.mediaItems || !p) return false;
    let group;
    if (p.kind === 'album') {
        group = window.mediaItems.filter(i => i.parentId === p.id);
    } else {
        const it = window.mediaItems.find(i => i.id === p.id);
        group = it ? [it] : [];
    }
    if (!group.length) return false;
    currentGroup = group;
    currentGroupIndex = 0;
    renderActiveItem();
    return true;
}

function changeProject(dir) {
    if (lbProjects.length < 2) return;
    let idx = lbProjectIndex;
    for (let n = 0; n < lbProjects.length; n++) {
        idx = (idx + dir + lbProjects.length) % lbProjects.length;
        if (openProject(lbProjects[idx])) return;
    }
}

function syncRail(pid) {
    const lbEl = document.getElementById('lightbox');
    const rail = document.getElementById('lb-rail-list');
    if (!lbEl || !rail) return;

    if (lastRailPid === null) collectProjects();
    if (pid === lastRailPid) return;
    lastRailPid = pid;

    lbProjectIndex = lbProjects.findIndex(p => p.id === pid);
    if (lbProjects.length < 2 || lbProjectIndex < 0) {
        lbEl.classList.remove('has-rail');
        rail.innerHTML = '';
        return;
    }
    lbEl.classList.add('has-rail');

    const en = document.documentElement.lang === 'en';
    const countEl = document.getElementById('lb-rail-count');
    if (countEl) countEl.textContent = (lbProjectIndex + 1) + ' / ' + lbProjects.length;

    rail.innerHTML = '';
    lbProjects.forEach((p, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'lb-proj' + (i === lbProjectIndex ? ' active' : '');
        btn.onclick = () => { if (i !== lbProjectIndex) openProject(p); };

        const th = document.createElement('div');
        th.className = 'lb-proj-thumb';
        const tagText = p.type === 'video' ? 'VID' : (p.type === 'model3d' ? '3D' : '');
        const showTag = () => {
            const tag = document.createElement('span');
            tag.className = 'lb-thumb-tag';
            tag.textContent = tagText || '•';
            th.appendChild(tag);
        };
        if (p.thumb) {
            const img = document.createElement('img');
            img.src = p.thumb;
            img.alt = '';
            img.loading = 'lazy';
            img.onerror = () => { img.remove(); showTag(); };
            th.appendChild(img);
        } else {
            showTag();
        }

        const info = document.createElement('div');
        info.className = 'lb-proj-info';
        const title = document.createElement('div');
        title.className = 'lb-proj-title';
        title.textContent = p.title || ((en ? 'Project ' : 'Projekt ') + (i + 1));
        const meta = document.createElement('div');
        meta.className = 'lb-proj-meta';
        const parts = [];
        if (p.meta) parts.push(p.meta);
        if (p.count > 1) parts.push((en ? 'Series ' : 'Seria ') + p.count);
        meta.textContent = parts.join(' · ');
        info.appendChild(title);
        if (parts.length) info.appendChild(meta);

        btn.appendChild(th);
        btn.appendChild(info);
        rail.appendChild(btn);
    });

    const act = rail.querySelector('.active');
    if (act) rail.scrollTop = act.offsetTop - (rail.clientHeight - act.offsetHeight) / 2;
}
