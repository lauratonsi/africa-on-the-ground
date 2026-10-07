// Movimento del sito, con Motion (vedi docs/metodo-editoriale.md, sezione Dipendenze).
// Miglioramento progressivo: senza JavaScript, o con "riduci movimento" attivo, la pagina resta ferma e completa.
(function () {
  if (!window.Motion) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var hidden = [];
  var animate = Motion.animate, inView = Motion.inView, stagger = Motion.stagger;

  // Schede dei luoghi: entrano una dopo l'altra quando compaiono.
  var cards = document.querySelectorAll(".places > li");
  // Si nasconde solo ciò che sta sotto la prima schermata: ciò che si vede subito non lampeggia.
  var below = function (el) { return el.getBoundingClientRect().top > window.innerHeight * 0.9; };
  var anyBelow = false;
  cards.forEach(function (el) { if (below(el)) { el.style.opacity = "0"; hidden.push(el); anyBelow = true; } });
  if (anyBelow) inView(".places", function (list) {
    animate(list.querySelectorAll(":scope > li"), { opacity: [0, 1], y: [24, 0] },
      { duration: 0.7, delay: stagger(0.08), ease: [0.22, 1, 0.36, 1] });
  }, { amount: 0.15 });

  // Sezioni e blocchi di testo: una dissolvenza leggera.
  document.querySelectorAll("main section h2, .kpis > *").forEach(function (el) {
    if (el.closest(".places")) return;
    if (!below(el)) return;
    el.style.opacity = "0"; hidden.push(el);
    inView(el, function () {
      animate(el, { opacity: [0, 1], y: [14, 0] }, { duration: 0.6, ease: [0.22, 1, 0.36, 1] });
    }, { amount: 0.4 });
  });

  // Rete di sicurezza: se per qualunque motivo un'animazione non parte, dopo 3 secondi tutto torna visibile.
  setTimeout(function () {
    hidden.forEach(function (el) { if (getComputedStyle(el).opacity < 0.99) { el.style.opacity = ""; el.style.transform = ""; } });
  }, 3000);
})();
