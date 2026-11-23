(function () {
    var hd = document.querySelector('.g'), src = document.querySelector('main');
    if (!hd || !src || !window.ResizeObserver) return;
  
    var stage = document.createElement('div'), strips = [], docTop = 0, raf = 0, timer = 0;
    stage.className = 'lens';
    stage.setAttribute('aria-hidden', 'true');
    hd.insertBefore(stage, hd.firstChild);
  
    function num(n) {
      return parseFloat(getComputedStyle(hd).getPropertyValue(n));
    }
  
    function profile(H) {
      var Mc = num('--lens-mag') || 1.3,
        Ms = Mc * (1 + (num('--lens-barrel') || 0)),
        B = Math.round(num('--lens-bevel') || 0),
        S = Math.round(num('--lens-shoulder') || 0),
        C = Math.max(0, H - 2 * (B + S)),
        Mb = num('--lens-bevel-mag'),
        rest = H / 2 - S / Ms - C / 2 / Mc;
      if (!Mb) Mb = (B && rest > 0) ? B / rest : 1;
      var F = H / 2 - (B / Mb + S / Ms + C / 2 / Mc), y = 0, M = [Mb, Ms, Mc, Ms, Mb];
      return [B, S, C, S, B].map(function (h, i) {
        var z = { y: y, h: h, M: M[i], F: F };
        y += h;
        F += h / M[i];
        return z;
      }).filter(function (z) { return z.h > 0; });
    }
  
    function build() {
      var H = hd.clientHeight, r = src.getBoundingClientRect();
      docTop = r.top + window.scrollY;
      stage.textContent = '';
      strips = profile(H).map(function (p) {
        var s = document.createElement('div'), m = document.createElement('div'), c = src.cloneNode(true);
        c.removeAttribute('id');
        c.querySelectorAll('[id],[name]').forEach(function (n) {
          n.removeAttribute('id');
          n.removeAttribute('name');
        });
        var a = src.querySelectorAll('input,textarea,select'), z = c.querySelectorAll('input,textarea,select');
        a.forEach(function (n, i) { z[i].value = n.value; });
        s.className = 'lens__s';
        s.style.cssText = 'top:' + p.y + 'px;height:' + p.h + 'px';
        m.className = 'lens__m';
        m.style.cssText = 'left:' + r.left + 'px;width:' + r.width + 'px';
        m.inert = true;
        m.appendChild(c);
        s.appendChild(m);
        stage.appendChild(s);
        return { m: m, p: p };
      });
      paint();
    }
  
    function paint() {
      var s = window.scrollY - docTop;
      strips.forEach(function (e) {
        e.m.style.transform = 'translate3d(0,' + (-e.p.M * (s + e.p.F)).toFixed(2) + 'px,0) scaleY(' + e.p.M + ')';
      });
    }
  
    function later() {
      clearTimeout(timer);
      timer = setTimeout(build, 120);
    }
  
    addEventListener('scroll', function () {
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; paint(); });
    }, { passive: true });
  
    new ResizeObserver(later).observe(src);
    new ResizeObserver(later).observe(hd);
    new MutationObserver(later).observe(src, { childList: true, subtree: true, characterData: true });
    src.addEventListener('input', later);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
  
    window.ViewIsLens = { rebuild: build };
  })();