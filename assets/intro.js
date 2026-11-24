(function () {
  var root = document.getElementById('tdgtd-intro');
  if (!root) return;
  var logo = root.querySelector('.tdgtd-logo');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 6x8 pixel glyphs
  var G = {
    T: ['111111', '111111', '001100', '001100', '001100', '001100', '001100', '001100'],
    D: ['111110', '111111', '110011', '110011', '110011', '110011', '111111', '111110'],
    G: ['011111', '111111', '110000', '110000', '110111', '110011', '111111', '011111']
  };
  var WORD = 'TDGTD';

  // seeded random so the layout is stable between loads
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function rr(a, b) { return a + (b - a) * rnd(); }

  // each tile = one room floor plan
  function texture(dark) {
    var S = 128, c = document.createElement('canvas'); c.width = c.height = S;
    var x = c.getContext('2d');
    var sh = Math.round(rr(214, 230)), paper = 'rgb(' + sh + ',' + sh + ',' + (sh - 2) + ')';
    var ink = 'rgba(26,26,26,.92)', thin = 'rgba(26,26,26,.7)', wall = ink, lab = 'rgba(26,26,26,.75)';
    if (dark) { paper = '#151515'; wall = '#222221'; ink = 'rgba(205,205,202,.9)'; thin = 'rgba(205,205,202,.8)'; lab = 'rgba(205,205,202,.7)'; }
    x.fillStyle = paper; x.fillRect(0, 0, S, S);

    // room box
    var w = rr(6, 9);
    var L = 0, T = 0, R = S, B = S;
    var notch = false; // square rooms only, walls run to the tile edge
    var nx = rr(0.45, 0.65), ny = rr(0.45, 0.65), corner = Math.floor(rnd() * 4);
    var ncx = L + (R - L) * nx, ncy = T + (B - T) * ny;
    function outline(off, keep) {
      var l = L + off, t = T + off, r = R - off, b = B - off;
      if (!keep) x.beginPath();
      if (!notch) { x.rect(l, t, r - l, b - t); return; }
      var q;
      if (corner === 0) { var cx = ncx + off, cy = ncy + off; q = [[cx, t], [r, t], [r, b], [l, b], [l, cy], [cx, cy]]; }
      if (corner === 1) { var cx = ncx - off, cy = ncy + off; q = [[l, t], [cx, t], [cx, cy], [r, cy], [r, b], [l, b]]; }
      if (corner === 2) { var cx = ncx - off, cy = ncy - off; q = [[l, t], [r, t], [r, cy], [cx, cy], [cx, b], [l, b]]; }
      if (corner === 3) { var cx = ncx + off, cy = ncy - off; q = [[l, t], [r, t], [r, b], [cx, b], [cx, cy], [l, cy]]; }
      x.moveTo(q[0][0], q[0][1]); for (var k = 1; k < q.length; k++) x.lineTo(q[k][0], q[k][1]); x.closePath();
    }
    x.fillStyle = wall; outline(0); x.fill();
    x.fillStyle = paper; outline(w); x.fill();
    var il = L + w, it = T + w, ir = R - w, ib = B - w;
    var walls = [0, 1, 2, 3]; // 0 top 1 right 2 bottom 3 left
    function startNotched(side) { return notch && ((corner === 0 && (side === 0 || side === 3)) || (corner === 1 && side === 1) || (corner === 3 && side === 2)); }
    function wallSpan(side, at, len) {
      if (startNotched(side)) at = ((side % 2 === 0 ? R - L : B - T) - 4) - at - len;
      if (side === 0) return [L + 2 + at, T - 1, len, w + 2];
      if (side === 2) return [L + 2 + at, B - w - 1, len, w + 2];
      if (side === 1) return [R - w - 1, T + 2 + at, w + 2, len];
      return [L - 1, T + 2 + at, w + 2, len];
    }
    // door
    var ds = walls.splice(Math.floor(rnd() * 4), 1)[0];
    var span = (ds % 2 === 0 ? R - L : B - T) - 4;
    if (notch) span *= 0.4;
    var dl = rr(20, 28), da = rr(w + 2, Math.max(w + 3, span - dl - w - 2));
    var dr = wallSpan(ds, da, dl);
    x.fillStyle = paper; x.fillRect(dr[0], dr[1], dr[2], dr[3]);
    x.strokeStyle = thin; x.lineWidth = 1;
    var hx, hy, a0;
    var flip = rnd() < 0.5;
    if (ds === 0) { hx = flip ? dr[0] : dr[0] + dl; hy = it; a0 = Math.PI / 2; }
    if (ds === 2) { hx = flip ? dr[0] : dr[0] + dl; hy = ib; a0 = -Math.PI / 2; }
    if (ds === 1) { hx = ir; hy = flip ? dr[1] : dr[1] + dl; a0 = Math.PI; }
    if (ds === 3) { hx = il; hy = flip ? dr[1] : dr[1] + dl; a0 = 0; }
    var dir = (ds === 0 || ds === 2) ? (flip ? 0 : Math.PI) : (flip ? Math.PI / 2 : -Math.PI / 2);
    x.beginPath(); x.moveTo(hx, hy); x.lineTo(hx + Math.cos(a0) * dl, hy + Math.sin(a0) * dl); x.stroke();
    x.beginPath(); x.arc(hx, hy, dl, Math.min(a0, dir), Math.max(a0, dir)); 
    if (Math.abs(a0 - dir) > Math.PI) { x.beginPath(); x.arc(hx, hy, dl, Math.max(a0, dir), Math.min(a0, dir) + 2 * Math.PI); }
    x.lineWidth = 0.6; x.stroke();
    // window(s)
    var nw = rnd() < 0.7 ? 1 : 2;
    for (var wi = 0; wi < nw && walls.length; wi++) {
      var ws = walls.splice(Math.floor(rnd() * walls.length), 1)[0];
      var wsp = (ws % 2 === 0 ? R - L : B - T) - 4; if (notch) wsp *= 0.4;
      var wl = rr(18, Math.min(40, wsp - 12)), wa = rr(6, Math.max(7, wsp - wl - 6));
      var r2 = wallSpan(ws, wa, wl);
      x.fillStyle = paper; x.fillRect(r2[0], r2[1] + (ws % 2 ? 0 : 1), r2[2], r2[3] - (ws % 2 ? 0 : 2));
      x.strokeStyle = thin; x.lineWidth = 0.7;
      for (var f = 0; f < 3; f++) {
        x.beginPath();
        if (ws % 2 === 0) { var yy = r2[1] + 1 + f * (r2[3] - 2) / 2; x.moveTo(r2[0], yy); x.lineTo(r2[0] + r2[2], yy); }
        else { var xx = r2[0] + 1 + f * (r2[2] - 2) / 2; x.moveTo(xx, r2[1]); x.lineTo(xx, r2[1] + r2[3]); }
        x.stroke();
      }
    }

    // furniture
    x.strokeStyle = ink; x.lineWidth = 1;
    var fw = ir - il, fh = ib - it, pad = 6;
    var types = ['bed', 'dining', 'sofa', 'bath', 'kitchen', 'desk', 'stair', 'closet', 'twin', 'empty'];
    var type = types[Math.floor(rnd() * types.length)];
    function R_(a, b, c2, d) { x.strokeRect(Math.round(a) + .5, Math.round(b) + .5, Math.round(c2), Math.round(d)); }
    var ax = rnd() < 0.5 ? il + pad : ir - pad, ay = rnd() < 0.5 ? it + pad : ib - pad;
    if (notch) {
      ax = (corner === 0 || corner === 3) ? ir - pad : il + pad;
      ay = (corner === 0 || corner === 1) ? ib - pad : it + pad;
      if (type !== 'bed' && type !== 'twin' && type !== 'empty') type = ['bed', 'twin', 'empty'][Math.floor(rnd() * 3)];
    }
    function anchor(wd, ht) { return [ax < il + fw / 2 ? ax : ax - wd, ay < it + fh / 2 ? ay : ay - ht]; }
    var label = '';
    if (type === 'bed' || type === 'twin') {
      var n = type === 'twin' ? 2 : 1, bw = n === 2 ? rr(16, 20) : rr(30, 38), bh = rr(40, 50);
      for (var bi = 0; bi < n; bi++) {
        var p0 = anchor(bw, bh); var bx = p0[0] + (ax < il + fw / 2 ? 1 : -1) * bi * (bw + 6);
        R_(bx, p0[1], bw, bh);
        var top = ay < it + fh / 2;
        R_(bx + 3, top ? p0[1] + 3 : p0[1] + bh - 11, bw - 6, 8);
        x.beginPath(); x.moveTo(bx, top ? p0[1] + bh * 0.45 : p0[1] + bh * 0.55); x.lineTo(bx + bw, top ? p0[1] + bh * 0.62 : p0[1] + bh * 0.38); x.stroke();
      }
      label = 'BED';
    } else if (type === 'dining') {
      var cx2 = il + fw / 2 + rr(-6, 6), cy2 = it + fh / 2 + rr(-6, 6);
      if (rnd() < 0.5) { var rad = rr(12, 16); x.beginPath(); x.arc(cx2, cy2, rad, 0, 7); x.stroke();
        for (var ci = 0; ci < 4; ci++) { var ang = ci * Math.PI / 2 + Math.PI / 4; R_(cx2 + Math.cos(ang) * (rad + 7) - 4, cy2 + Math.sin(ang) * (rad + 7) - 4, 8, 8); } }
      else { var tw = rr(30, 40), th = rr(18, 22); R_(cx2 - tw / 2, cy2 - th / 2, tw, th);
        for (var cj = 0; cj < 3; cj++) { R_(cx2 - tw / 2 + 2 + cj * (tw - 4) / 3 + 1, cy2 - th / 2 - 9, 8, 7); R_(cx2 - tw / 2 + 2 + cj * (tw - 4) / 3 + 1, cy2 + th / 2 + 2, 8, 7); } }
      label = 'DINING';
    } else if (type === 'sofa') {
      var sw = rr(40, 54), sd = 14, p1 = anchor(sw, sd);
      R_(p1[0], p1[1], sw, sd); R_(p1[0] + 4, p1[1] + 4, sw - 8, sd - 4);
      R_(il + fw / 2 - 11, it + fh / 2 - 6, 22, 12);
      label = 'LIVING';
    } else if (type === 'bath') {
      var tw2 = rr(20, 24), th2 = rr(40, 48), p2 = anchor(tw2, th2);
      x.beginPath(); x.roundRect ? x.roundRect(p2[0], p2[1], tw2, th2, 4) : x.rect(p2[0], p2[1], tw2, th2); x.stroke();
      x.beginPath(); x.roundRect ? x.roundRect(p2[0] + 3, p2[1] + 3, tw2 - 6, th2 - 6, 8) : x.rect(p2[0] + 3, p2[1] + 3, tw2 - 6, th2 - 6); x.stroke();
      var ox = ax < il + fw / 2 ? ir - pad - 14 : il + pad;
      R_(ox, it + fh / 2 - 5, 14, 6); x.beginPath(); x.ellipse(ox + 7, it + fh / 2 + 7, 6, 8, 0, 0, 7); x.stroke();
      label = 'BATH';
    } else if (type === 'kitchen') {
      var d = 12; x.beginPath();
      R_(il, it, fw, d); R_(il, it + d, d, fh * 0.6);
      x.beginPath(); x.arc(il + fw * 0.6, it + d / 2, 3.5, 0, 7); x.stroke();
      for (var k2 = 0; k2 < 4; k2++) { x.beginPath(); x.arc(il + fw * 0.25 + (k2 % 2) * 7, it + 3 + Math.floor(k2 / 2) * 6, 2, 0, 7); x.stroke(); }
      R_(il + fw / 2 - 8, it + fh / 2, 26, 14);
      label = 'KITCHEN';
    } else if (type === 'desk') {
      var dw = rr(34, 44), p3 = anchor(dw, 14); R_(p3[0], p3[1], dw, 14);
      x.beginPath(); x.arc(p3[0] + dw / 2, ay < it + fh / 2 ? p3[1] + 22 : p3[1] - 8, 6, 0, 7); x.stroke();
      R_(ax < il + fw / 2 ? ir - pad - 10 : il + pad, it + pad, 10, fh - 2 * pad);
      label = 'STUDY';
    } else if (type === 'stair') {
      var sx0 = il + fw * 0.2, swd = fw * 0.42, n2 = 9, step = (fh - 12) / n2;
      for (var st = 0; st <= n2; st++) { x.beginPath(); x.moveTo(sx0, it + 6 + st * step); x.lineTo(sx0 + swd, it + 6 + st * step); x.stroke(); }
      R_(sx0, it + 6, swd, fh - 12);
      x.beginPath(); x.moveTo(sx0 + swd / 2, ib - 8); x.lineTo(sx0 + swd / 2, it + 10); x.lineTo(sx0 + swd / 2 - 3, it + 15); x.stroke();
      label = 'STAIR';
    } else if (type === 'closet') {
      var cw2 = 12; var leftSide = rnd() < 0.5; var cx3 = leftSide ? il : ir - cw2;
      R_(cx3, it, cw2, fh); x.beginPath(); x.moveTo(cx3, it); x.lineTo(cx3 + cw2, ib); x.moveTo(cx3 + cw2, it); x.lineTo(cx3, ib); x.stroke();
      label = 'DRESS';
    } else label = 'ROOM';
    // label
    x.fillStyle = lab; x.font = '7px monospace';
    var area = (rr(6, 22)).toFixed(1);
    var lx = il + fw / 2 - 14 + rr(-6, 6), ly = it + fh / 2 + rr(14, 22);
    if (ly > ib - 4) ly = it + 12;
    if (notch) { lx = (corner === 0 || corner === 3) ? ncx + 4 : il + 4; ly = (corner === 0 || corner === 1) ? ncy + 14 : it + 12; }
    x.fillText(label, lx, ly); x.fillText(area + 'm²', lx, ly + 8);
    return c.toDataURL('image/png');
  }

  // frames
  var cells = [];
  var svgNS = 'http://www.w3.org/2000/svg';
  WORD.split('').forEach(function (ch, li) {
    var cell = document.createElement('div'); cell.className = 'tdgtd-cell';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'tdgtd-frame'); svg.setAttribute('viewBox', '0 0 120 160');
    svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
    var h = '';
    for (var i = 1; i < 6; i++) h += '<line class="g" x1="' + i * 20 + '" y1="0" x2="' + i * 20 + '" y2="160"/>';
    for (var j = 1; j < 8; j++) h += '<line class="g" x1="0" y1="' + j * 20 + '" x2="120" y2="' + j * 20 + '"/>';
    h += '<rect class="b" x="0" y="0" width="120" height="160"/>';
    // dimension line under each letter
    h += '<line class="d" x1="0" y1="168" x2="120" y2="168"/><line class="d" x1="0" y1="164" x2="0" y2="172"/><line class="d" x1="120" y1="164" x2="120" y2="172"/>';
    if (li === 0) h += '<line class="d" x1="-8" y1="0" x2="-8" y2="160"/><line class="d" x1="-12" y1="0" x2="-4" y2="0"/><line class="d" x1="-12" y1="160" x2="-4" y2="160"/>';
    svg.innerHTML = h;
    cell.appendChild(svg);
    logo.appendChild(cell);
    cells.push({ el: cell, ch: ch });
  });
  var layer = document.createElement('div'); layer.className = 'tdgtd-tiles'; logo.appendChild(layer);

  // tiles
  var tiles = [];
  cells.forEach(function (c, li) {
    G[c.ch].forEach(function (row, ry) {
      row.split('').forEach(function (b, cx) {
        if (b !== '1') return;
        tiles.push({ li: li, cx: cx, ry: ry, real: true });
      });
    });
  });
  var decoys = Math.round(tiles.length * 0.6);
  for (var d = 0; d < decoys; d++) tiles.push({ real: false });

  tiles.forEach(function (tl) {
    var el = document.createElement('div'); el.className = 'tdgtd-tile';
    var sd = seed; var light = texture(false); var after = seed; seed = sd;
    var darkImg = texture(true); seed = after; // same room, inverted palette
    el.style.backgroundImage = 'url(' + light + ')';
    var inv = document.createElement('i'); inv.className = 'tdgtd-inv'; inv.style.backgroundImage = 'url(' + darkImg + ')'; el.appendChild(inv); tl.inv = inv;
    tl.el = el; layer.appendChild(el);
    var gx = (rnd() + rnd() + rnd()) / 3 - 0.5, gy = (rnd() + rnd() + rnd()) / 3 - 0.5;
    tl.sx = 0.5 + gx * 2.5;          // wide horizontal band, a little denser in the middle
    tl.sy = 0.5 + gy * 2.2;          // much shallower vertically
    tl.sr = rr(-35, 35); tl.ss = rr(0.55, 1.05);
    tl.fr = rr(-4, 4); tl.fdx = rr(-0.05, 0.05); tl.fdy = rr(-0.05, 0.05);
    tl.delay = rr(250, 1700); tl.dur = rr(1500, 2500);
    tl.dx = rr(-0.12, 0.12); tl.dy = rr(-0.3, 0.3); // decoy drift
  });

  function geom() {
    var lb = logo.getBoundingClientRect();
    var cb = cells[0].el.getBoundingClientRect();
    var gap = cells.length > 1 ? cells[1].el.getBoundingClientRect().left - cb.right : 0;
    return { W: lb.width, H: cb.height, cw: cb.width, gap: gap, px: cb.width / 6 };
  }

  function place(tl, g) {
    var size = g.px * 0.97;
    tl.el.style.width = tl.el.style.height = size + 'px';
    if (tl.real) {
      tl.fx = tl.li * (g.cw + g.gap) + tl.cx * g.px + (g.px - size) / 2 + tl.fdx * size;
      tl.fy = tl.ry * g.px + (g.px - size) / 2 + tl.fdy * size;
      tl.gx = tl.li * (g.cw + g.gap) + tl.cx * g.px + (g.px - size) / 2; // perfectly aligned slot
      tl.gy = tl.ry * g.px + (g.px - size) / 2;
      tl.gs = g.px / size;
    }
    tl.x0 = tl.sx * g.W; tl.y0 = tl.sy * g.H;
  }

  function finalState(g) {
    tiles.forEach(function (tl) {
      place(tl, g);
      if (tl.real) { tl.el.style.transform = 'translate(' + tl.fx + 'px,' + tl.fy + 'px) rotate(' + tl.fr + 'deg)'; tl.el.style.opacity = '1'; }
      else tl.el.style.opacity = '0';
    });
  }

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  var g = null;
  tiles.forEach(function (tl) {
    tl.op = rr(0.22, 0.42);   // faint at first, full strength once assembled
    tl.d = rr(0, 0.3);          // when this tile starts moving (0..1 of scroll progress)
    tl.span = rr(0.35, 0.45);    // how long it takes
    tl.cxo = rr(-0.25, 0.25); tl.cyo = rr(-0.25, 0.25); // curve bend
  });

  function layout() {
    g = geom();
    tiles.forEach(function (tl) {
      place(tl, g);
      if (!tl.real) { tl.fx = tl.x0 + tl.dx * g.W; tl.fy = tl.y0 + tl.dy * g.H; }
      tl.mx = (tl.x0 + tl.fx) / 2 + tl.cxo * g.W * 0.3;
      tl.my = (tl.y0 + tl.fy) / 2 + tl.cyo * g.H;
    });
  }

  var lastP = -1;
  function render(p) {
    if (Math.abs(p - lastP) < 0.00003) return; lastP = p;
    var snap = ease(clamp((p - 0.78) / 0.14)); // final straighten-up after the loose assembly
    tiles.forEach(function (tl) {
      var t = ease(clamp((p - tl.d) / tl.span));
      var u = 1 - t;
      var x = u * u * tl.x0 + 2 * u * t * tl.mx + t * t * tl.fx;
      var y = u * u * tl.y0 + 2 * u * t * tl.my + t * t * tl.fy;
      var r, sc, o;
      if (tl.real) {
        r = tl.sr + (tl.fr - tl.sr) * t; sc = tl.ss + (1 - tl.ss) * t; o = tl.op + (1 - tl.op) * t;
        if (snap > 0) { x += (tl.gx - x) * snap; y += (tl.gy - y) * snap; r *= 1 - snap; sc += (tl.gs - sc) * snap; }
        tl.inv.style.opacity = clamp((snap - 0.55) / 0.45);
      }
      else { r = tl.sr + 40 * t; sc = tl.ss * (1 - 0.3 * t); o = tl.op * 0.8 * (1 - clamp(t * 1.4)); }
      tl.el.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + r + 'deg) scale(' + sc + ')';
      tl.el.style.opacity = o;
    });
    var lq = clamp(p / 0.3), lead = 1 - lq * lq * (3 - 2 * lq); // eased: the question drifts off softly, no linear start/stop
    root.style.setProperty('--lead', lead.toFixed(3));
    root.style.setProperty('--lift', ((1 - lead) * 40).toFixed(1) + 'px');
    logo.style.setProperty('--frame', clamp((p - 0.58) / 0.2).toFixed(3));
    root.classList.toggle('is-done', p > 0.9);
  }

  function progress() {
    if (window.__introP != null) return window.__introP; // autoplay: exact progress, no scrolling
    if (reduce) return 1;
    var r = root.getBoundingClientRect();
    var total = r.height - window.innerHeight * 2.8; // then 100vh hold on the finished logo, then 80vh crossfade into the trend sheet
    return total > 0 ? clamp(-r.top / total) : 1;
  }

  (function loop() { if (window.__introP != null && g) render(window.__introP); requestAnimationFrame(loop); })();
  var ticking = false;
  // the paper's mouse reveal stays off until the intro title has scrolled away
  function gate() { window.__tdgtdIntro = root.getBoundingClientRect().bottom > window.innerHeight * 0.35; }
  gate();
  function onScroll() {
    gate();
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; render(progress()); });
  }

  function start() {
    layout();
    root.classList.add('is-on');
    render(progress());
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  window.addEventListener('resize', function () { gate(); if (!g) return; layout(); lastP = -1; render(progress()); });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { requestAnimationFrame(start); });
  else requestAnimationFrame(start);
})();
