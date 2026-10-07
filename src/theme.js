// Tema chiaro/scuro: segue il sistema ("auto"), oppure si forza con il pulsante in testata.
// Si carica nell'intestazione, prima del disegno della pagina, per evitare un lampo del tema sbagliato.
// Senza JavaScript vale il tema del sistema e il pulsante resta nascosto.
(function () {
  var root = document.documentElement, KEY = "theme";
  var ORDER = ["auto", "light", "dark"], NAME = { auto: "system", light: "light", dark: "dark" };
  // Movimento: la classe m-ok attiva le animazioni solo se la persona non ha chiesto di ridurle.
  try { if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) root.classList.add("m-ok"); } catch (e) {}
  var mode = "auto";
  try { var v = localStorage.getItem(KEY); if (v === "light" || v === "dark") mode = v; } catch (e) {}
  function apply(m) { if (m === "auto") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", m); }
  apply(mode);

  document.addEventListener("DOMContentLoaded", function () {
    var b = document.getElementById("theme");
    if (!b) return;
    b.hidden = false;
    function paint() {
      var next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
      b.setAttribute("data-mode", mode);
      b.setAttribute("aria-label", "Colour theme: " + NAME[mode] + ". Switch to " + NAME[next] + ".");
      b.title = "Theme: " + NAME[mode];
    }
    paint();
    b.addEventListener("click", function () {
      mode = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
      try { if (mode === "auto") localStorage.removeItem(KEY); else localStorage.setItem(KEY, mode); } catch (e) {}
      apply(mode); paint();
    });
  });
})();
