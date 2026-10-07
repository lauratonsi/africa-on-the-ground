// Pulsante flottante: apre un piccolo menu per saltare alle sezioni della pagina o tornare in cima.
// Miglioramento progressivo: senza JavaScript il pulsante non compare e la pagina funziona lo stesso.
(function () {
  var box = document.getElementById("fab"), btn = document.getElementById("fab-btn"), menu = document.getElementById("fab-menu");
  if (!box || !btn || !menu) return;
  var shown = false;
  function setOpen(open) {
    menu.hidden = !open;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  }
  function onScroll() {
    var want = window.scrollY > 480;
    if (want !== shown) { shown = want; box.hidden = !want; if (!want) setOpen(false); }
  }
  btn.addEventListener("click", function () {
    var open = menu.hidden;
    setOpen(open);
    if (open) { var a = menu.querySelector("a"); if (a) a.focus(); }
  });
  menu.addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (!a) return;
    if (a.hasAttribute("data-top")) { e.preventDefault(); window.scrollTo({ top: 0 }); }
    setOpen(false);
  });
  document.addEventListener("click", function (e) { if (!box.contains(e.target)) setOpen(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { setOpen(false); btn.focus(); } });
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();

// Sul telefono il menu scorre: la pagina in cui ci si trova va portata in vista.
(function () {
  var cur = document.querySelector('.top nav [aria-current]');
  var nav = cur && cur.parentNode;
  if (nav && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = Math.max(0, cur.offsetLeft - 24);
})();
