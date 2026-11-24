/* intro: plays by itself — the question, then the words gather into the plan — and waits for a click to begin */
(function () {
  var root = document.getElementById('tdgtd-intro'); if (!root) return;
  var sub = root.querySelector('.tdgtd-sub');
  var hint = document.createElement('p'); hint.className = 'tdgtd-click'; hint.textContent = 'click plan to continue';
  if (sub) sub.appendChild(hint);
  var veil = document.createElement('div'); veil.className = 'tdgtd-veil'; document.body.appendChild(veil);
  var GATE = .93, open = false, going = false, playing = false, floor = false;
  function gateY() { var top = root.getBoundingClientRect().top + scrollY; return top + (root.offsetHeight - innerHeight * 2.8) * GATE; }
  function atGate() { return !open && scrollY >= gateY() - 4; }
  function sync() { root.classList.toggle('is-gated', atGate()); }
  addEventListener('scroll', function () {
    var g = gateY();
    if (open && !going && scrollY < g - innerHeight * .5) open = false; // came back up: the gate closes again
    if (!open) { if (scrollY > g) window.scrollTo(0, g); }
    if (floor && !going && scrollY < g) window.scrollTo(0, g); // once the logo is in place there is no way back up
    sync();
  }, { passive: true });
  function held() { return playing || atGate(); }
  function atFloor() { return floor && scrollY <= gateY() + 2; }
  addEventListener('wheel', function (e) { if (playing || (atGate() && e.deltaY > 0) || (atFloor() && e.deltaY < 0)) e.preventDefault(); }, { passive: false });
  addEventListener('touchmove', function (e) { if (held()) e.preventDefault(); }, { passive: false });
  addEventListener('keydown', function (e) {
    if (playing && /^(ArrowDown|ArrowUp|PageDown|PageUp|Home|End| )$/.test(e.key)) { e.preventDefault(); return; }
    if (atFloor() && /^(ArrowUp|PageUp|Home)$/.test(e.key)) { e.preventDefault(); return; }
    if (atGate() && /^(ArrowDown|PageDown|End| )$/.test(e.key)) { e.preventDefault(); if (e.key === ' ') go(); }
    if (atGate() && e.key === 'Enter') go();
  });
  function go() {
    if (open) return; open = true; going = true; root.classList.remove('is-gated');
    // first the plan lifts into an isometric model on white; the next click carries on to the archive
    var lg = root.querySelector('svg.tdgtd-svg');
    if (window.__tdgtdIso && lg && window.__tdgtdIso.open(lg, onward)) return;
    onward();
  }
  function onward() {
    going = true;
    // fade the page out, jump to the next screen, fade it back in
    veil.style.transition = 'opacity .55s ease'; veil.style.opacity = '1';
    setTimeout(function () { going = false; }, 1500);
    setTimeout(function () {
      var st = document.querySelector('.strata'), tr = !st && document.querySelector('.trend'), c = document.querySelector('.cloud'), top = st ? st.getBoundingClientRect().top + scrollY : tr ? root.getBoundingClientRect().top + scrollY + root.offsetHeight - innerHeight : c ? c.getBoundingClientRect().top + scrollY + innerHeight * .45 : gateY() + innerHeight * 1.3; // next: the strata, bottom plane first
      // the next screen starts hidden and slightly small, then fades in while easing up to full size
      var stg = st && st.querySelector('.st-stage');
      if (stg) { stg.style.transition = 'none'; stg.style.opacity = '0'; stg.style.transform = 'scale(.92)'; void stg.offsetWidth; }
      document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, top);
      if (window.__tdgtdIso) window.__tdgtdIso.hide();
      setTimeout(function () { (function () {             // a timer, not frames: starts on time even while the page is busy
        if (stg) {
          veil.style.transition = 'opacity .35s ease'; veil.style.opacity = '0';
          stg.style.transition = 'opacity 1.3s ease, transform 1.8s cubic-bezier(.2,.7,.2,1)'; stg.style.opacity = '1'; stg.style.transform = 'scale(1)';
          setTimeout(function () { stg.style.transition = ''; stg.style.transform = ''; stg.style.opacity = ''; }, 1900);
        } else { veil.style.transition = 'opacity .9s ease'; veil.style.opacity = '0'; }
        if (st && window.__strataEnter) window.__strataEnter(); // overview first, then into the bottom plane
      })(); }, 40);
    }, 600);
  }
  // only a click inside the plan itself (its floor outline) carries on
  function inPlan(e) {
    var svg = root.querySelector('svg.tdgtd-svg'), pg = svg && svg.querySelector('polygon');
    if (!pg || !pg.getScreenCTM) return false;
    var m = pg.getScreenCTM(); if (!m) return false;
    var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; pt = pt.matrixTransform(m.inverse());
    return pg.isPointInFill ? pg.isPointInFill(pt) : true;
  }
  addEventListener('click', function (e) {
    if (!atGate() || !inPlan(e)) return;
    go();
  });
  addEventListener('mousemove', function (e) { if (atGate()) root.classList.toggle('over-plan', inPlan(e)); }, { passive: true });
  // autoplay: glide the intro from the top to the gate by itself
  function autoplay() {
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.style.scrollBehavior = 'auto';
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    if (reduce) { window.scrollTo(0, gateY()); floor = true; root.classList.add('sub-on'); sync(); return; }
    playing = true; root.classList.add('is-playing');
    // paced like an unhurried scroll: the words take their time gathering, then the plan settles in
    // words settled (.45) → short hold → plan fades in (.58–.71) → tagline → gate
    var t0 = 0, KEYS = [[0, 0], [6500, .45], [7250, .58], [8900, .71], [9550, .76], [11410, .93]], DUR = 11410;
    // monotone cubic through the keys: speed changes smoothly, never stops between them
    var M = (function () {
      var n = KEYS.length, d = [], m = [];
      for (var i = 0; i < n - 1; i++) d.push((KEYS[i + 1][1] - KEYS[i][1]) / (KEYS[i + 1][0] - KEYS[i][0]));
      m[0] = 0; m[n - 1] = 0;
      for (i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : 2 / (1 / d[i - 1] + 1 / d[i]);
      return m;
    })();
    function at(ms) {
      for (var i = 1; i < KEYS.length; i++) if (ms <= KEYS[i][0]) {
        var a = KEYS[i - 1], b = KEYS[i], h = b[0] - a[0], u = (ms - a[0]) / h, u2 = u * u, u3 = u2 * u;
        return (2 * u3 - 3 * u2 + 1) * a[1] + (u3 - 2 * u2 + u) * h * M[i - 1] + (-2 * u3 + 3 * u2) * b[1] + (u3 - u2) * h * M[i];
      }
      return KEYS[KEYS.length - 1][1];
    }
    (function tick(now) {
      if (!t0) t0 = now;
      var k = Math.min(1, (now - t0) / DUR);
      // KEYS are in intro progress; the gate sits at GATE of that progress
      var pr = at(now - t0); window.__introP = Math.min(pr, GATE);
      // the page itself stays put while playing (no per-frame scrolling, so nothing else re-lays out)
      if (pr >= .74) root.classList.add('sub-on'); // the tagline follows once the plan has settled
      if (k < 1) requestAnimationFrame(tick);
      else { window.scrollTo(0, gateY()); window.__introP = null; playing = false; floor = true; root.classList.remove('is-playing'); sync(); }
    })(performance.now());
    requestAnimationFrame(function f(n) { if (!t0) t0 = n; });
  }
  var started = false;
  // wait until the page has settled (fonts in, word tiles built, heavy first frames done) so the play is smooth
  function start() {
    if (started) return; started = true;
    window.scrollTo(0, 0);
    var t0 = performance.now();
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () {
      (function ready() {
        if (!window.__introWordsReady && performance.now() - t0 < 4000) return setTimeout(ready, 80);
        // two calm frames, then the question holds for a moment before the words move
        requestAnimationFrame(function () { requestAnimationFrame(function () { setTimeout(autoplay, 1300); }); });
      })();
    });
  }
  if (document.readyState === 'complete') start(); else addEventListener('load', start);
  sync();
})();
