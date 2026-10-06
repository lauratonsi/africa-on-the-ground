// Miglioramento progressivo: senza JavaScript le pagine funzionano lo stesso.
// Home: filtro per tipo e evidenziazione scheda/segnaposto.
// Countries: interruttore della mappa, filtro per subregione, ricerca, ordinamento, tooltip.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var all = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  // ---------- tooltip condiviso ----------
  var tip = $("tip");
  function showTip(text, x, y) {
    if (!tip) return;
    tip.textContent = text; tip.hidden = false;
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var left = Math.min(Math.max(8, x - w / 2), window.innerWidth - w - 8);
    var top = y - h - 14; if (top < 8) top = y + 20;
    tip.style.left = left + window.scrollX + "px"; tip.style.top = top + window.scrollY + "px";
  }
  function hideTip() { if (tip) tip.hidden = true; }
  if (tip) {
    document.addEventListener("mouseover", function (e) { var t = e.target.closest("[data-tip]"); if (t) showTip(t.getAttribute("data-tip"), e.clientX, e.clientY); });
    document.addEventListener("mousemove", function (e) { if (!tip.hidden) { var t = e.target.closest("[data-tip]"); if (t) showTip(t.getAttribute("data-tip"), e.clientX, e.clientY); } });
    document.addEventListener("mouseout", function (e) { if (e.target.closest("[data-tip]")) hideTip(); });
    document.addEventListener("focusin", function (e) { var t = e.target.closest("[data-tip]"); if (t) { var r = t.getBoundingClientRect(); showTip(t.getAttribute("data-tip"), r.left + r.width / 2, r.top); } });
    document.addEventListener("focusout", hideTip);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") hideTip(); });
    document.addEventListener("click", function (e) { var t = e.target.closest("[data-tip]"); if (t && window.matchMedia("(hover: none)").matches) { var r = t.getBoundingClientRect(); showTip(t.getAttribute("data-tip"), r.left + r.width / 2, r.top); setTimeout(hideTip, 3500); } });
  }

  // ---------- home ----------
  var list = $("placelist");
  if (list) {
    var filters = $("filters"), count = $("pcount");
    var items = Array.prototype.slice.call(list.children);
    var pins = all(".map .pin");
    var show = function (type) {
      var shown = 0;
      items.forEach(function (li) { var on = type === "all" || li.getAttribute("data-type") === type; li.hidden = !on; if (on) shown++; });
      pins.forEach(function (a) { a.classList.toggle("off", !(type === "all" || a.getAttribute("data-type") === type)); });
      if (count) count.textContent = type === "all" ? "" : shown + " of " + items.length;
    };
    if (filters) {
      filters.hidden = false;
      filters.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-filter]"); if (!b) return;
        all("button", filters).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        show(b.getAttribute("data-filter"));
      });
    }
    var mark = function (slug, on) {
      pins.forEach(function (a) { if (a.getAttribute("data-slug") === slug) a.classList.toggle("hl", on); });
      items.forEach(function (li) { if (li.getAttribute("data-slug") === slug) li.classList.toggle("hl", on); });
    };
    [].concat(pins, items).forEach(function (el) {
      var slug = el.getAttribute("data-slug");
      ["mouseenter", "focusin"].forEach(function (ev) { el.addEventListener(ev, function () { mark(slug, true); }); });
      ["mouseleave", "focusout"].forEach(function (ev) { el.addEventListener(ev, function () { mark(slug, false); }); });
    });
  }

  // ---------- countries ----------
  var table = $("ctable");
  if (!table) return;

  var metric = $("metric"), wrap = document.querySelector(".mapwrap");
  if (metric && wrap) {
    metric.hidden = false;
    metric.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-metric]"); if (!b) return;
      all("button", metric).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      wrap.setAttribute("data-m", b.getAttribute("data-metric"));
    });
  }

  var tools = $("tools"), q = $("q"), tsub = $("tsub"), sub = $("sub"), subfilter = $("subfilter"), tcount = $("tcount");
  var rows = all("tbody tr", table);
  var state = { sub: "all", q: "" };
  function apply() {
    var n = 0;
    rows.forEach(function (tr) {
      var on = (state.sub === "all" || tr.getAttribute("data-sub") === state.sub) && (!state.q || tr.getAttribute("data-name").indexOf(state.q) >= 0);
      tr.hidden = !on; if (on) n++;
    });
    if (tcount) tcount.textContent = n === rows.length ? "" : n + " shown";
    all("[data-sub]", document.querySelector("main")).forEach(function (el) {
      if (el.tagName === "TR" || el.closest("table")) return;
      el.classList.toggle("dim", state.sub !== "all" && el.getAttribute("data-sub") !== state.sub);
    });
    if (tsub) tsub.value = state.sub; if (sub) sub.value = state.sub;
  }
  if (tools) tools.hidden = false;
  if (subfilter) subfilter.hidden = false;
  if (q) q.addEventListener("input", function () { state.q = q.value.trim().toLowerCase(); apply(); });
  [tsub, sub].forEach(function (s) { if (s) s.addEventListener("change", function () { state.sub = s.value; apply(); }); });

  // ordinamento per colonna
  var heads = all("thead th", table);
  heads.forEach(function (th, i) {
    th.tabIndex = 0; th.setAttribute("role", "columnheader"); th.style.cursor = "pointer";
    var run = function () {
      var asc = th.getAttribute("aria-sort") !== "ascending", num = th.getAttribute("data-sort") === "num";
      heads.forEach(function (h) { h.removeAttribute("aria-sort"); });
      th.setAttribute("aria-sort", asc ? "ascending" : "descending");
      var body = table.tBodies[0];
      rows.slice().sort(function (a, b) {
        var x = a.children[i].getAttribute("data-v"), y = b.children[i].getAttribute("data-v");
        var c = num ? parseFloat(x) - parseFloat(y) : x.localeCompare(y, "en");
        return asc ? c : -c;
      }).forEach(function (tr) { body.appendChild(tr); });
    };
    th.addEventListener("click", run);
    th.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); run(); } });
  });
})();
