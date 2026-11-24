/* ───────── intro: square word-tiles gather and fill the plan's footprint ─────────
   The area inside the TDGTD plan is cut into a grid of squares; each square carries one tiny search.
   On scroll the squares drift in from all over the screen, lock into the grid, and the drawn plan
   then fades in over them. */
(function () {
  var root = document.getElementById('tdgtd-intro');
  if (!root) return;
  var logo = root.querySelector('.tdgtd-logo'), svgImg = root.querySelector('.tdgtd-svg');
  if (!logo || !svgImg) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { root.style.setProperty('--logo', '1'); return; }

  var VB = { x: 48, y: 22, w: 1014, h: 228 }, CELL = 19.1; // grid step in drawing units (10 rows over the plan's depth)
  var seed = 31; function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  var pool = ['혼자 사는 법', '방음', '방해금지 모드', '팔로워', '떡상하는 법', '혹시 몰라서', '원클릭 결제', '코리빙',
    '외로움', '우리 동네 치안', '잠적하는 법', '잊혀질 권리', '타이니하우스', '차박', '패닉룸', '미니멀리즘', '랜선 집들이',
    '재택근무', '조용한 퇴사', '제3의 장소', '셀프스토리지', '오프그리드', '사생활', '소속감', '도피', '안전', '인정 욕구', '소유',
    '은둔형 외톨이', '감성 인테리어', '방꾸미기', '사회적 배터리', '벙커 매매', '스마트 도어벨', '셰어하우스', '원룸',
    '홈오피스', '노이즈캔슬링', '드레스룸', '방 안의 방', '벽 없는 집', '문이 많은 집', '나선형 집', '중정',
    '창문 하나', '복도', '계단', '방마다 카메라', '암막 커튼', '수면 캡슐', '옥탑방', '다락방', '공유주방', '고요',
    '따로 또 같이', '집', '살다'];
  for (var sh = pool.length - 1; sh > 0; sh--) { var r0 = (sh * 7919) % (sh + 1), tmp = pool[sh]; pool[sh] = pool[r0]; pool[r0] = tmp; }

  var layer = document.createElement('div'); layer.className = 'tdgtd-words'; layer.setAttribute('aria-hidden', 'true');
  logo.appendChild(layer);
  var poly = [], cells = [], built = false, lastP = -1;

  function inside(x, y) { // even-odd point in polygon
    var c = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var a = poly[i], b = poly[j];
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  }

  fetch('./assets/tdgtd-logo.svg').then(function (r) { return r.text(); }).then(function (txt) {
    var pg = new DOMParser().parseFromString(txt, 'image/svg+xml').querySelector('polygon');
    if (!pg) return;
    var n = pg.getAttribute('points').trim().split(/[\s,]+/).map(Number);
    for (var i = 0; i + 1 < n.length; i += 2) poly.push([n[i], n[i + 1]]);
    build(); render(progress(), true);
  });

  // the desire words are always set in black (they flicker back to light now and then)
  var KEY = {}; ['사생활', '소속감', '도피', '안전', '인정 욕구', '소유', '외로움', '잠적하는 법',
    '방 안의 방', '잊혀질 권리', '방해금지 모드', '패닉룸']
    .forEach(function (w) { KEY[w] = 1; });
  var meas = document.createElement('canvas').getContext('2d');
  function gs() { return (rnd() + rnd() + rnd() - 1.5) / 1.5; }
  var builtW = 0, builtFont = false;
  function build(force) {
    var lg = root.querySelector('.tdgtd-svg'), W = lg ? lg.getBoundingClientRect().width : 0; if (!W || !poly.length) return;
    if (built && !force && Math.abs(W - builtW) < 1 && document.fonts && document.fonts.status === 'loaded') { if (builtFont) return; }
    var k = W / VB.w, fs = Math.max(12, 15.2 * k), font = '300 ' + fs.toFixed(2) + 'px "Noto Sans KR", sans-serif';
    meas.font = font;
    var padX = fs * .42, th = fs * 1.5, gap = Math.max(2, fs * .3);
    var xs = poly.map(function (p) { return p[0]; }), ys = poly.map(function (p) { return p[1]; });
    var x0 = Math.min.apply(0, xs), x1 = Math.max.apply(0, xs), y0 = Math.min.apply(0, ys), y1 = Math.max.apply(0, ys);
    var rows = Math.max(1, Math.round((y1 - y0) * k / (th + gap))), pitch = (y1 - y0) / rows;
    layer.innerHTML = ''; cells = []; seed = 31;
    layer.style.font = font; layer.style.setProperty('--th', th.toFixed(1) + 'px'); layer.style.setProperty('--px', padX.toFixed(1) + 'px');
    var lb = logo.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight, qi = Math.floor(rnd() * pool.length);
    for (var r = 0; r < rows; r++) {
      qi += 3 + Math.floor(rnd() * 17); // rows don't repeat the same run of words
      var yc = y0 + (r + .5) * pitch, ya = yc - pitch * .42, yb = yc + pitch * .42;
      // inside-runs of this row band
      var runs = [], st = -1;
      for (var x = x0; x <= x1 + .5; x += .5) {
        var ok = x <= x1 && inside(x, ya) && inside(x, yb);
        if (ok && st < 0) st = x;
        if (!ok && st >= 0) { runs.push([st + .8, x - .8]); st = -1; }
      }
      runs.forEach(function (run) {
        var len = (run[1] - run[0]) * k, row = [], used = 0, tries = 0;
        while (tries < pool.length) {
          var q = pool[qi % pool.length], w = meas.measureText(q).width + padX * 2;
          if (used + (row.length ? gap : 0) + w <= len) { row.push({ q: q, w: w }); used += (row.length > 1 ? gap : 0) + w; qi++; tries = 0; }
          else { qi++; tries++; if (len - used < fs * 2.4) break; }
        }
        if (!row.length) return;
        var extra = row.length > 1 ? (len - used) / (row.length - 1) : 0, at = run[0] * k - VB.x * k + (row.length > 1 ? 0 : (len - used) / 2);
        row.forEach(function (it) {
          if (rnd() < .05) { at += it.w + gap + extra; return; } // leave some slots empty — a lighter field
          var el = document.createElement('span'); el.textContent = it.q;
          if (KEY[it.q]) { el.className = 'inv'; el.style.animationDuration = (4 + rnd() * 5).toFixed(2) + 's'; el.style.animationDelay = (-rnd() * 4).toFixed(2) + 's'; }
          layer.appendChild(el);
          cells.push({ el: el, tx: at + it.w / 2, ty: (yc - VB.y) * k,
            // start close to home: a loose drift around the logo, swept in left to right
            sx: at + it.w / 2 + gs() * W * .8, sy: (yc - VB.y) * k + gs() * vh * .62, sr: 0, ss: .78 + rnd() * .18,
            d: rnd() * .3, span: .32 + rnd() * .2, cx: gs() * 340, cy: gs() * 230,
            vx: gs() * 260, vy: gs() * 120, wob: gs() * 70, ph: rnd() * 6.28 });
          at += it.w + gap + extra;
        });
      });
    }
    built = true; lastP = -1; builtW = W; builtFont = !document.fonts || document.fonts.status === 'loaded'; window.__introWordsReady = true;
  }

  function progress() {
    if (window.__introP != null) return window.__introP; // autoplay hands over an exact, unrounded progress
    var r = root.getBoundingClientRect(), total = r.height - window.innerHeight * 2.8;
    return total > 0 ? clamp(-r.top / total) : 1;
  }

  // gather 0.04–0.6 · squares straighten into the grid 0.5–0.62 · plan fades in 0.52–0.72 · squares fade 0.6–0.8
  function render(p, force) {
    if (!built || (!force && Math.abs(p - lastP) < .00003)) return; lastP = p;
    var g = clamp((p - .04) / .56), snap = ease(clamp((p - .5) / .12)), out = clamp((p - .6) / .1);
    root.style.setProperty('--logo', ease(clamp((p - .58) / .13)).toFixed(3));
    cells.forEach(function (q) {
      var t = ease(clamp((g - q.d) / q.span)), u = 1 - t;
      var mx = (q.sx + q.tx) / 2 + q.cx, my = (q.sy + q.ty) / 2 + q.cy;
      var x = u * u * q.sx + 2 * u * t * mx + t * t * q.tx;
      var y = u * u * q.sy + 2 * u * t * my + t * t * q.ty;
      var rot = q.sr * (1 - t) * (1 - snap), sc = q.ss + (1 - q.ss) * Math.max(t, snap);
      x += (q.tx - x) * snap; y += (q.ty - y) * snap;
      q.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%) rotate(' + rot.toFixed(1) + 'deg) scale(' + sc.toFixed(3) + ')';
      q.el.style.opacity = ((.22 + .78 * t) * (1 - out)).toFixed(3);
    });
  }

  (function loop() { if (window.__introP != null) render(window.__introP); requestAnimationFrame(loop); })();
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; render(progress()); });
  }, { passive: true });
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { build(true); render(progress(), true); }, 150); });
  if (document.fonts && document.fonts.load) document.fonts.load('300 10px "Noto Sans KR"', '가나다').then(function () { if (poly.length) { build(); render(progress(), true); } }, function () {});
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (poly.length) { build(); render(progress(), true); } });
})();
