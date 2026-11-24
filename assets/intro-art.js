/* the intro keeps the artifact's look (gray paper, round About button) while it is on screen; the rest of the site keeps its own theme */
(function () {
  var root = document.getElementById('tdgtd-intro'); if (!root) return;
  var html = document.documentElement;
  function sync() {
    var end = root.getBoundingClientRect().top + scrollY + root.offsetHeight - innerHeight;
    html.classList.toggle('intro-art-on', scrollY < end - 2);
  }
  addEventListener('scroll', sync, { passive: true });
  addEventListener('resize', sync);
  sync();
})();
