// Solo per la home. Senza JavaScript la pagina funziona lo stesso: la mappa ha link veri e l'elenco mostra tutto.
// Fa due cose: filtra per tipo di luogo e mette in evidenza insieme il segnaposto e la scheda sotto il cursore.
(function () {
  var filters = document.getElementById("filters");
  var list = document.getElementById("placelist");
  var count = document.getElementById("pcount");
  if (!list) return;

  var items = Array.prototype.slice.call(list.children);
  var pins = Array.prototype.slice.call(document.querySelectorAll(".map .pin"));

  function show(type) {
    var shown = 0;
    items.forEach(function (li) {
      var on = type === "all" || li.getAttribute("data-type") === type;
      li.hidden = !on;
      if (on) shown++;
    });
    pins.forEach(function (a) {
      var on = type === "all" || a.getAttribute("data-type") === type;
      a.classList.toggle("off", !on);
    });
    if (count) count.textContent = type === "all" ? "" : shown + " of " + items.length;
  }

  if (filters) {
    filters.hidden = false;
    filters.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-filter]");
      if (!b) return;
      Array.prototype.forEach.call(filters.querySelectorAll("button"), function (x) {
        x.setAttribute("aria-pressed", x === b ? "true" : "false");
      });
      show(b.getAttribute("data-filter"));
    });
  }

  function mark(slug, on) {
    pins.forEach(function (a) { if (a.getAttribute("data-slug") === slug) a.classList.toggle("hl", on); });
    items.forEach(function (li) { if (li.getAttribute("data-slug") === slug) li.classList.toggle("hl", on); });
  }
  [].concat(pins, items).forEach(function (el) {
    var slug = el.getAttribute("data-slug");
    ["mouseenter", "focusin"].forEach(function (ev) { el.addEventListener(ev, function () { mark(slug, true); }); });
    ["mouseleave", "focusout"].forEach(function (ev) { el.addEventListener(ev, function () { mark(slug, false); }); });
  });
})();
