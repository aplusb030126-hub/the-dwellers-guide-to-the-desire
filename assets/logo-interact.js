/* ───────── intro logo: hover a room (a letter of TDGTD) and it widens ─────────
   The other rooms give up width to make space. Only floor and wall lengths change: furniture, windows
   and doors keep their size and stay attached to the wall they stand against (a bed stays on its wall,
   a shelf on its partition); free-standing pieces (a table with its chairs) stay at the same relative
   spot in the room. */
(function () {
  var root = document.getElementById('tdgtd-intro'); if (!root) return;
  var img = root.querySelector('img.tdgtd-svg'); if (!img) return;
  var B0 = [57, 256.5, 457.5, 653.5, 860.5, 1053];   // room edges (outer walls + the four partitions)
  var GROW = 1.38, SNAP = 28;                          // how much a room widens · how close counts as "against a wall"
  var PY = 140, V_UP = 30, V_DN = -28, v = 0, vgoal = 0; // G room: the inner wall line and how far it slides
  var items = [], anchors = [[], [], [], [], []], svg, vb, r = [1, 1, 1, 1, 1], goal = [1, 1, 1, 1, 1], B = B0.slice(), raf = 0, hot = -1;

  fetch(img.getAttribute('src')).then(function (x) { return x.text(); }).then(function (t) {
    svg = document.importNode(new DOMParser().parseFromString(t, 'image/svg+xml').documentElement, true);
    svg.removeAttribute('width'); svg.setAttribute('class', 'tdgtd-svg'); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', img.getAttribute('alt') || 'TDGTD');
    img.replaceWith(svg);
    var v = svg.getAttribute('viewBox').split(/\s+/).map(Number); vb = { x: v[0], y: v[1], w: v[2], h: v[3] };
    requestAnimationFrame(collect);
  });

  function cls(el) {
    var tag = el.tagName.toLowerCase(), fill = (el.getAttribute('fill') || '').toLowerCase(), st = (el.getAttribute('stroke') || '').toLowerCase();
    if (tag === 'polygon') return 'poly';
    if (tag === 'rect' && fill === '#111111') return 'wall';
    if (tag === 'rect' && fill === '#000') return 'open';
    if (tag === 'line' && st === '#111111') return 'wline';
    if ((tag === 'path' && (fill === '#ffffff' || st === '#111111')) || (tag === 'line' && st === '#444444')) return 'door';
    return 'furn';
  }
  function roomOf(x) { for (var i = 0; i < 5; i++) if (x < B0[i + 1]) return i; return 4; }

  // ── where things go ──
  function prop(x) { var i = roomOf(x); return B[i] + (x - B0[i]) * r[i]; }
  function anchorNow(a) { return a.edge >= 0 ? B[a.edge] : prop(a.x); }
  function nearest(l, rr, snap) { // the wall a span [l, rr] stands against, if any
    var i = roomOf((l + rr) / 2), best = null, bd = snap || SNAP;
    anchors[i].forEach(function (a) { var d = a.x <= l ? l - a.x : a.x >= rr ? a.x - rr : 0; if (d <= bd) { bd = d; best = a; } });
    return best;
  }
  function shiftOf(l, rr) { var a = nearest(l, rr); return a ? anchorNow(a) - a.x : prop((l + rr) / 2) - (l + rr) / 2; }
  function pt(x) { var a = nearest(x, x, 40); return a ? x + anchorNow(a) - a.x : prop(x); }

  function collect() {
    var sr = svg.getBoundingClientRect(); if (!sr.width) return setTimeout(collect, 300);
    var u = vb.w / sr.width, list = [];
    for (var i = 0; i < 5; i++) { anchors[i].push({ x: B0[i], edge: i }); anchors[i].push({ x: B0[i + 1], edge: i + 1 }); }
    function add(el) {
      if (el.tagName.toLowerCase() === 'rect' && +el.getAttribute('width') >= 1000) return; // mask base
      var c = cls(el), it = { el: el, c: c };
      if (c === 'wall' || c === 'open') {
        it.x = +el.getAttribute('x'); it.w = +el.getAttribute('width'); it.h = +el.getAttribute('height'); it.y = +el.getAttribute('y');
        if (c === 'wall' && it.x > 545 && it.x < 553 && it.y >= PY - 1 && it.y + it.h <= 180) it.vmove = 1; // the bathroom's ㄷ wall
        if (c === 'wall' && it.w <= 12 && it.h > 30) { // a standing wall: partitions are room edges, the rest are anchors inside a room
          var cx = it.x + it.w / 2, onEdge = B0.some(function (e) { return Math.abs(e - cx) < 2; });
          if (!onEdge) anchors[roomOf(cx)].push({ x: cx, edge: -1 });
        }
      }
      else if (c === 'wline') { it.x1 = +el.getAttribute('x1'); it.x2 = +el.getAttribute('x2'); }
      else if (c === 'poly') { it.pts = el.getAttribute('points').trim().split(/[\s,]+/).map(Number); }
      else {
        var b = el.getBoundingClientRect();
        if (!b.width && !b.height) return;
        it.l = vb.x + (b.left - sr.left) * u; it.r = vb.x + (b.right - sr.left) * u;
        it.t = vb.y + (b.top - sr.top) * u; it.b = vb.y + (b.bottom - sr.top) * u;
        if (it.r < B0[0] - 20 || it.l > B0[5] + 20) return;
        it.tf = el.getAttribute('transform') || '';
      }
      list.push(it);
    }
    [].forEach.call(svg.querySelectorAll('mask rect'), add);
    [].forEach.call(svg.children, function (el) {
      var tag = el.tagName.toLowerCase();
      if (tag === 'defs') return;
      if (tag === 'g' && el.getAttribute('mask')) { [].forEach.call(el.children, add); return; }
      add(el);
    });
    // pieces that touch (or nearly — a table and its chairs) move as one
    ['furn', 'door'].forEach(function (kind) {
      var g = list.filter(function (i) { return i.c === kind; }), tol = kind === 'door' ? 3 : 4, par = g.map(function (_, i) { return i; });
      function f(i) { while (par[i] !== i) i = par[i] = par[par[i]]; return i; }
      for (var i = 0; i < g.length; i++) for (var j = i + 1; j < g.length; j++) {
        var a = g[i], b = g[j];
        if (a.l - tol <= b.r && b.l - tol <= a.r && a.t - tol <= b.b && b.t - tol <= a.b) par[f(i)] = f(j);
      }
      var box = {};
      g.forEach(function (it, i) { var k = f(i), q = box[k] = box[k] || { l: 1e9, r: -1e9, t: 1e9, b: -1e9 };
        q.l = Math.min(q.l, it.l); q.r = Math.max(q.r, it.r); q.t = Math.min(q.t, it.t); q.b = Math.max(q.b, it.b); it.k = q; });
      if (kind === 'furn') g.forEach(function (it) {
        var q = it.k, cx = (q.l + q.r) / 2;
        if (roomOf(cx) !== 2) return;
        if (q.t >= PY + 3 && q.l >= 549 && q.b <= 181) { it.vmove = 1; if (q.l > 615) it.vtop = 1; } // the basin hangs on the top wall               // bath + basin ride with the wall
        else if (q.b <= PY - 20 && q.t > 66 && q.r - q.l > 40) it.vfade = 1;      // the dining table and its chairs
        else if (q.t >= 178 && q.l >= 585 && q.r <= 620 && q.b <= 198) it.vgone = 1; // washer pair: no room once the bath comes down
      });
    });
    items = list;
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerleave', function () { setV(0); setHot(-1); });
  }

  function move(e) {
    if (parseFloat(getComputedStyle(svg).opacity) < .5) return setHot(-1);
    var sr = svg.getBoundingClientRect(), x = vb.x + (e.clientX - sr.left) * vb.w / sr.width;
    if (x < B[0] || x > B[5]) { setV(0); return setHot(-1); }
    for (var i = 0; i < 5; i++) if (x < B[i + 1]) {
      var y = vb.y + (e.clientY - sr.top) * vb.h / sr.height;
      setV(i === 2 ? (y < PY + v ? V_UP : V_DN) : 0);
      return setHot(i);
    }
  }
  function setHot(i) {
    if (i === hot) return; hot = i;
    var T = B0[5] - B0[0];
    for (var k = 0; k < 5; k++) goal[k] = i < 0 ? 1 : k === i ? GROW : (T - (B0[i + 1] - B0[i]) * GROW) / (T - (B0[i + 1] - B0[i]));
    if (!raf) raf = requestAnimationFrame(step);
  }
  function setV(t) { if (t === vgoal) return; vgoal = t; if (!raf) raf = requestAnimationFrame(step); }
  var last = 0;
  function step(now) {
    raf = 0; var moving = false;
    var dt = last ? Math.min((now - last) / 1000, .25) : 1 / 60; last = now; var e = 1 - Math.exp(-dt * 7.5);
    var dv = vgoal - v; if (Math.abs(dv) > .05) { v += dv * e; moving = true; } else v = vgoal;
    for (var k = 0; k < 5; k++) { var d = goal[k] - r[k]; if (Math.abs(d) > .0008) { r[k] += d * e; moving = true; } else r[k] = goal[k]; }
    B[0] = B0[0]; for (k = 0; k < 5; k++) B[k + 1] = B[k] + (B0[k + 1] - B0[k]) * r[k];
    draw();
    if (moving) raf = requestAnimationFrame(step); else last = 0;
  }
  function draw() {
    items.forEach(function (it) {
      var el = it.el;
      if (it.c === 'wall' && it.w > 12) { // long walls stretch: each end follows what it meets
        var a = pt(it.x), b = pt(it.x + it.w); el.setAttribute('x', a.toFixed(2)); el.setAttribute('width', Math.max(0, b - a).toFixed(2));
      }
      if (it.vmove && it.c === 'wall') {
        // pushed down: the whole bathroom moves. pulled up: only its top wall rises (the side wall grows to meet it)
        var down = Math.max(v, 0);
        if (it.y < PY + 2 && it.w > 20) el.setAttribute('y', (it.y + v).toFixed(2));
        else if (it.w <= 12) { el.setAttribute('y', (it.y + v).toFixed(2)); el.setAttribute('height', (it.h - Math.min(v, 0)).toFixed(2)); }
        else el.setAttribute('y', (it.y + down).toFixed(2));
      }
      if (it.c === 'wall' && it.w > 12) {
      } else if (it.c === 'wall' || it.c === 'open') { // standing walls, windows, door gaps: same size, moved
        el.setAttribute('x', (it.x + shiftOf(it.x, it.x + it.w)).toFixed(2));
      } else if (it.c === 'wline') {
        var s = shiftOf(Math.min(it.x1, it.x2), Math.max(it.x1, it.x2));
        el.setAttribute('x1', (it.x1 + s).toFixed(2)); el.setAttribute('x2', (it.x2 + s).toFixed(2));
      } else if (it.c === 'poly') {
        var o = []; for (var i = 0; i < it.pts.length; i += 2) o.push(pt(it.pts[i]).toFixed(2) + ',' + it.pts[i + 1]);
        el.setAttribute('points', o.join(' '));
      } else {
        el.setAttribute('transform', 'translate(' + shiftOf(it.k.l, it.k.r).toFixed(2) + ',' + (it.vtop ? v : it.vmove ? Math.max(v, 0) : it.vfade ? Math.max(v, 0) * .4 : 0).toFixed(2) + ') ' + it.tf);
        if (it.vgone) el.setAttribute('opacity', Math.max(0, 1 - Math.max(0, v) / 16).toFixed(3));
        if (it.vfade) { var o = Math.max(0, 1 - Math.max(0, -v) / 26); el.setAttribute('opacity', o.toFixed(3)); }
      }
    });
  }
})();
