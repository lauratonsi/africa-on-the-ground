// Elementi interattivi delle storie. Miglioramento progressivo: senza JavaScript la pagina si legge lo stesso
// (le domande mostrano la risposta in un riquadro apribile, la cronologia mostra tutte le voci).
(function () {
  // ---------- domande con risposta immediata ----------
  document.querySelectorAll(".check").forEach(function (box) {
    var answer = box.getAttribute("data-answer");
    var opts = Array.prototype.map.call(box.querySelectorAll(".check-opts li"), function (li) { return li.textContent; });
    var fbSrc = box.querySelector(".check-fb");
    var nojs = box.querySelector(".check-nojs");
    var list = box.querySelector(".check-opts");
    if (!list || !fbSrc || !opts.length) return;
    if (nojs) nojs.hidden = true;
    var fb = document.createElement("div");
    fb.className = "check-result"; fb.setAttribute("role", "status"); fb.setAttribute("aria-live", "polite");
    var group = document.createElement("div");
    group.className = "check-btns"; group.setAttribute("role", "group");
    var q = box.querySelector(".check-q");
    if (q) { if (!q.id) q.id = "cq-" + Math.random().toString(36).slice(2, 8); group.setAttribute("aria-labelledby", q.id); }
    opts.forEach(function (text) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "check-opt"; b.textContent = text;
      b.addEventListener("click", function () {
        var right = text === answer;
        group.querySelectorAll("button").forEach(function (x) {
          x.disabled = true;
          if (x.textContent === answer) x.classList.add("is-right");
          else if (x === b) x.classList.add("is-wrong");
        });
        fb.innerHTML = '<strong>' + (right ? "Yes. " : "Not quite. ") + '</strong>' + fbSrc.innerHTML;
        fb.hidden = false;
      });
      group.appendChild(b);
    });
    fb.hidden = true;
    list.replaceWith(group);
    group.after(fb);
  });

  // ---------- cronologia con filtri ----------
  document.querySelectorAll("ol.timeline[data-tags]").forEach(function (ol) {
    var tags;
    try { tags = JSON.parse(ol.getAttribute("data-tags")); } catch (e) { return; }
    if (!tags || !tags.length) return;
    var bar = document.createElement("div");
    bar.className = "tl-filter"; bar.setAttribute("role", "group"); bar.setAttribute("aria-label", "Filter the timeline");
    var items = ol.querySelectorAll("li");
    var live = document.createElement("p");
    live.className = "tl-live"; live.setAttribute("role", "status"); live.setAttribute("aria-live", "polite");
    function show(id) {
      var n = 0;
      items.forEach(function (li) {
        var on = id === "all" || li.getAttribute("data-tag") === id;
        li.hidden = !on; if (on) n++;
      });
      bar.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-id") === id ? "true" : "false"); });
      live.textContent = n + (n === 1 ? " event shown" : " events shown");
    }
    [{ id: "all", label: "All" }].concat(tags).forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "tl-chip"; b.setAttribute("data-id", t.id); b.textContent = t.label;
      b.addEventListener("click", function () { show(t.id); });
      bar.appendChild(b);
    });
    ol.before(bar); ol.after(live);
    show("all");
  });
})();
