/* ───────── plan cloud: plans still being drawn ─────────
   Faint squares blink in and out around the newest cloud, as if sheets were being generated. */
(function () {
  var css = '.cn-layer{position:absolute;inset:0;pointer-events:none;overflow:hidden}' +
    '.cn-sq{position:absolute;left:0;top:0;background:#7a7a7a;opacity:0;animation:cn-blink var(--dur,3.2s) steps(1) forwards}' +
    '@keyframes cn-blink{0%{opacity:0}8%{opacity:1}14%{opacity:0}22%{opacity:1}30%{opacity:0}40%{opacity:1}52%{opacity:0}64%{opacity:1}78%{opacity:0}88%{opacity:1}100%{opacity:0}}' +
    '@media (prefers-reduced-motion:reduce){.cn-layer{display:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var stage, S, layer, sqs = [], seed = 1;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function gauss() { return (rnd() + rnd() + rnd() - 1.5) * 1.15; }

  function wait() {
    stage = document.querySelector('.cloud-stage'); S = window.__cloud;
    if (!stage || !S || !S.centers || !S.centers.length) return setTimeout(wait, 300);
    layer = document.createElement('div'); layer.className = 'cn-layer';
    var tip = stage.querySelector('.cloud-tip');
    stage.insertBefore(layer, tip || null); // under the tooltip and the search list
    seed = Math.floor(Math.random() * 1e6) + 1;
    setInterval(spawn, 620);
    loop();
  }

  function spawn() {
    if (!S.active || document.hidden || sqs.length > 9) return;
    // mostly around the "just now" cloud, sometimes anywhere
    // only around the "just now" cloud — where the next plans land
    var pos, tries = 0;
    do { pos = S.centers[0].clone(); pos.x += gauss() * 2; pos.y += gauss() * 2; pos.z += gauss() * 1.2; tries++; }
    while (tries < 12 && sqs.some(function (o) { return o.pos.distanceTo(pos) < 1.05; })); // keep them apart
    if (tries >= 12) return;
    var el = document.createElement('i'); el.className = 'cn-sq';
    var dur = 4.2 + rnd() * 2.4;
    el.style.setProperty('--dur', dur.toFixed(2) + 's');
    layer.appendChild(el);
    var sq = { el: el, pos: pos, s: 0.24 + rnd() * 0.187 };
    sqs.push(sq);
    setTimeout(function () { el.remove(); sqs.splice(sqs.indexOf(sq), 1); }, dur * 1000 + 50);
  }

  function loop() {
    requestAnimationFrame(loop);
    if (!S.active || !sqs.length) return;
    var cam = S.camera, t = Math.tan(cam.fov * Math.PI / 360);
    sqs.forEach(function (q) {
      var v = q.pos.clone().applyMatrix4(S.group.matrixWorld);
      var d = -v.clone().applyMatrix4(cam.matrixWorldInverse).z;
      var p = S.project(v);
      if (d < 0.8 || !p.front) { q.el.style.visibility = 'hidden'; return; }
      var hh = 0.5 * q.s / (d * t) * (S.h / 2), hw = hh;
      q.el.style.visibility = '';
      q.el.style.width = (hw * 2).toFixed(1) + 'px'; q.el.style.height = (hh * 2).toFixed(1) + 'px';
      q.el.style.transform = 'translate3d(' + (p.x - hw).toFixed(1) + 'px,' + (p.y - hh).toFixed(1) + 'px,0)';
    });
  }

  wait();
})();
