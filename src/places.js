// Filtri della pagina Places: ricerca, tipo, stato e regione. Miglioramento progressivo:
// senza JavaScript l'elenco è completo e i pulsanti delle regioni restano link alle sezioni.
(function () {
  var tools = document.getElementById("pi-tools"), jump = document.getElementById("pi-jump");
  if (!tools || !jump) return;
  var q = document.getElementById("pi-q"), count = document.getElementById("pi-count"), empty = document.getElementById("pi-empty");
  var rows = Array.prototype.slice.call(document.querySelectorAll(".pgroup li"));
  var groups = Array.prototype.slice.call(document.querySelectorAll(".pgroup"));
  var total = rows.length;
  var links = Array.prototype.slice.call(jump.querySelectorAll("a"));
  var suffix = /drafts included/.test(count.textContent) ? " (drafts included)" : "";
  var state = { type: "all", status: "all", region: "all", text: "" };
  tools.hidden = false;

  function apply() {
    var text = state.text.trim().toLowerCase(), shown = 0;
    rows.forEach(function (li) {
      var region = li.closest(".pgroup").id.replace("r-", "");
      var on = (state.type === "all" || li.getAttribute("data-type") === state.type) &&
        (state.status === "all" || li.getAttribute("data-status") === state.status) &&
        (state.region === "all" || region === state.region) &&
        (!text || li.getAttribute("data-q").indexOf(text) !== -1);
      li.hidden = !on; if (on) shown++;
    });
    groups.forEach(function (g) { g.hidden = !g.querySelector("li:not([hidden])"); });
    // i numeri delle regioni seguono gli altri filtri (non quello di regione)
    links.forEach(function (a) {
      var id = a.getAttribute("data-region"), k = 0;
      rows.forEach(function (li) {
        if (li.closest(".pgroup").id !== "r-" + id) return;
        if ((state.type === "all" || li.getAttribute("data-type") === state.type) &&
            (state.status === "all" || li.getAttribute("data-status") === state.status) &&
            (!text || li.getAttribute("data-q").indexOf(text) !== -1)) k++;
      });
      var n = a.querySelector(".n"); if (n) n.textContent = k;
    });
    var filtered = shown !== total;
    count.textContent = filtered ? shown + " of " + total + " cards" : total + (total === 1 ? " card" : " cards") + " in " + groups.length + (groups.length === 1 ? " region" : " regions") + suffix + ".";
    empty.hidden = shown !== 0;
  }

  Array.prototype.forEach.call(tools.querySelectorAll(".filters"), function (box) {
    var key = box.getAttribute("data-group");
    box.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      Array.prototype.forEach.call(box.querySelectorAll("button"), function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      state[key] = b.getAttribute("data-" + key); apply();
    });
  });

  // Regioni: con JavaScript i link diventano filtri; un secondo clic sulla stessa regione li toglie.
  links.forEach(function (a) { a.setAttribute("role", "button"); a.setAttribute("aria-pressed", "false"); });
  jump.addEventListener("click", function (e) {
    var a = e.target.closest("a[data-region]"); if (!a) return;
    e.preventDefault();
    var id = a.getAttribute("data-region");
    state.region = state.region === id ? "all" : id;
    links.forEach(function (x) { x.setAttribute("aria-pressed", x.getAttribute("data-region") === state.region ? "true" : "false"); });
    apply();
  });

  jump.addEventListener("keydown", function (e) { if (e.key === " " && e.target.matches("a[data-region]")) { e.preventDefault(); e.target.click(); } });
  q.addEventListener("input", function () { state.text = q.value; apply(); });
  document.getElementById("pi-reset").addEventListener("click", function () {
    state = { type: "all", status: "all", region: "all", text: "" }; q.value = "";
    Array.prototype.forEach.call(tools.querySelectorAll(".filters"), function (box) {
      Array.prototype.forEach.call(box.querySelectorAll("button"), function (x, i) { x.setAttribute("aria-pressed", i === 0 ? "true" : "false"); });
    });
    links.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
    apply(); q.focus();
  });
})();
