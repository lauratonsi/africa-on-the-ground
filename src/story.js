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
        box.setAttribute("data-result", right ? "right" : "wrong");
        var sec = box.closest(".checks");
        if (sec) {
          var all = sec.querySelectorAll(".check"), done = sec.querySelectorAll(".check[data-result]");
          var score = sec.querySelector(".check-score");
          if (score && all.length === done.length) {
            var ok = sec.querySelectorAll('.check[data-result="right"]').length;
            score.textContent = "You got " + ok + " of " + all.length + " right. Nothing is saved: the score disappears when you leave the page.";
            score.hidden = false;
          }
        }
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

  // ---------- stima con cursore ----------
  document.querySelectorAll(".estimate").forEach(function (box) {
    var min = +box.getAttribute("data-min"), max = +box.getAttribute("data-max"), step = +box.getAttribute("data-step") || 1;
    var ans = +box.getAttribute("data-answer"), unit = box.getAttribute("data-unit") || "", dec = +box.getAttribute("data-dec") || 0;
    var fbSrc = box.querySelector(".est-fb"), nojs = box.querySelector(".est-nojs");
    if (!fbSrc) return;
    if (nojs) nojs.hidden = true;
    var fmt = function (n) { return n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + unit; };
    var id = "est-" + Math.random().toString(36).slice(2, 7);
    var wrap = document.createElement("div"); wrap.className = "est-ui";
    var input = document.createElement("input");
    input.type = "range"; input.min = min; input.max = max; input.step = step; input.id = id;
    input.value = String(Math.round((min + max) / 2 / step) * step);
    input.setAttribute("aria-label", "Your guess, from " + fmt(min) + " to " + fmt(max));
    var out = document.createElement("output"); out.className = "est-out"; out.setAttribute("for", id); out.textContent = fmt(+input.value);
    input.addEventListener("input", function () { out.textContent = fmt(+input.value); });
    var btn = document.createElement("button"); btn.type = "button"; btn.className = "est-btn"; btn.textContent = "Lock in my guess";
    var res = document.createElement("div"); res.className = "est-result"; res.setAttribute("role", "status"); res.setAttribute("aria-live", "polite"); res.hidden = true;
    btn.addEventListener("click", function () {
      var g = +input.value; input.disabled = true; btn.disabled = true;
      var pos = function (v) { return Math.max(0, Math.min(100, (v - min) / (max - min) * 100)); };
      var diff = Math.abs(g - ans);
      var verdict = diff === 0 ? "Spot on." : diff <= (max - min) * 0.05 ? "Very close." : diff <= (max - min) * 0.2 ? "In the right area." : "Quite far off, and that is common.";
      res.innerHTML = '<div class="est-track" aria-hidden="true"><span class="est-mark guess" style="left:' + pos(g) + '%"></span><span class="est-mark real" style="left:' + pos(ans) + '%"></span></div>' +
        '<p><strong>' + verdict + '</strong> You guessed ' + fmt(g) + '; the answer is ' + fmt(ans) + ' (off by ' + fmt(diff) + ').</p><p>' + fbSrc.innerHTML.replace(/^<strong>[^<]*<\/strong>\s*/, "") + '</p>';
      res.hidden = false;
    });
    wrap.appendChild(input); wrap.appendChild(out); wrap.appendChild(btn);
    box.appendChild(wrap); box.appendChild(res);
  });

  // ---------- ordina gli eventi ----------
  document.querySelectorAll(".order").forEach(function (box) {
    var items;
    try { items = JSON.parse(box.getAttribute("data-items")); } catch (e) { return; }
    var nojs = box.querySelector(".est-nojs"); if (nojs) nojs.hidden = true;
    var order = items.map(function (_, i) { return i; });
    do { for (var i = order.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = order[i]; order[i] = order[j]; order[j] = t; } }
    while (order.every(function (v, i) { return v === i; }));
    var list = document.createElement("ol"); list.className = "order-list";
    var res = document.createElement("div"); res.className = "est-result"; res.setAttribute("role", "status"); res.setAttribute("aria-live", "polite"); res.hidden = true;
    var score = document.createElement("p"); score.className = "game-score"; score.setAttribute("role", "status"); score.setAttribute("aria-live", "polite");
    var checked = false;
    function render(focusIdx, focusDir) {
      list.innerHTML = "";
      order.forEach(function (idx, pos) {
        var li = document.createElement("li"); li.className = "order-item";
        if (checked) li.classList.add(idx === pos ? "is-right" : "is-wrong");
        var label = document.createElement("span"); label.className = "order-label"; label.textContent = items[idx].label;
        li.appendChild(label);
        if (checked) { var info = document.createElement("span"); info.className = "order-info"; info.innerHTML = items[idx].html; li.appendChild(info); }
        else {
          var up = document.createElement("button"), down = document.createElement("button");
          up.type = down.type = "button"; up.className = down.className = "order-btn";
          up.textContent = "↑"; down.textContent = "↓";
          up.setAttribute("aria-label", "Move up: " + items[idx].label); down.setAttribute("aria-label", "Move down: " + items[idx].label);
          up.disabled = pos === 0; down.disabled = pos === order.length - 1;
          up.addEventListener("click", function () { move(pos, -1); });
          down.addEventListener("click", function () { move(pos, 1); });
          var ctl = document.createElement("span"); ctl.className = "order-ctl"; ctl.appendChild(up); ctl.appendChild(down); li.appendChild(ctl);
        }
        list.appendChild(li);
      });
      if (focusIdx != null) {
        var target = list.children[focusIdx]; if (target) { var b = target.querySelectorAll("button")[focusDir > 0 ? 1 : 0]; if (b && !b.disabled) b.focus(); else { var any = target.querySelector("button:not(:disabled)"); if (any) any.focus(); } }
      }
    }
    function move(pos, d) { var n = pos + d; if (n < 0 || n >= order.length) return; var t = order[pos]; order[pos] = order[n]; order[n] = t; render(n, d); }
    var btn = document.createElement("button"); btn.type = "button"; btn.className = "est-btn"; btn.textContent = "Check my order";
    btn.addEventListener("click", function () {
      checked = true; btn.disabled = true; render();
      var ok = order.filter(function (v, i) { return v === i; }).length;
      score.textContent = "Score: " + (ok * 100) + " / " + (order.length * 100) + " points";
      res.textContent = ok === order.length ? "All " + ok + " in the right place." : ok + " of " + order.length + " in the right place. The correct order is in the list below.";
      if (ok !== order.length) {
        var right = document.createElement("ol"); right.className = "order-correct";
        items.forEach(function (it) { var li = document.createElement("li"); li.innerHTML = it.html; right.appendChild(li); });
        res.appendChild(right);
      }
      res.hidden = false;
    });
    score.textContent = "0 / " + (order.length * 100) + " points · move the stops, then check your order";
    render(); box.appendChild(score); box.appendChild(list); box.appendChild(btn); box.appendChild(res);
  });

  // ---------- grafici: scegli quali righe mostrare ----------
  document.querySelectorAll(".story-chart").forEach(function (fig) {
    var rows = fig.querySelectorAll(".srow, .brow");
    if (rows.length < 4) return;
    var bar = document.createElement("div"); bar.className = "tl-filter"; bar.setAttribute("role", "group"); bar.setAttribute("aria-label", "Choose which rows to show");
    var chips = [];
    rows.forEach(function (row) {
      var name = row.querySelector(".bname"); if (!name) return;
      var b = document.createElement("button"); b.type = "button"; b.className = "tl-chip"; b.textContent = name.textContent; b.setAttribute("aria-pressed", "true");
      b.addEventListener("click", function () { var on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", on ? "true" : "false"); row.hidden = !on; });
      chips.push(b); bar.appendChild(b);
    });
    var reset = document.createElement("button"); reset.type = "button"; reset.className = "tl-chip"; reset.textContent = "Show all";
    reset.addEventListener("click", function () { chips.forEach(function (c) { c.setAttribute("aria-pressed", "true"); }); rows.forEach(function (r) { r.hidden = false; }); });
    bar.appendChild(reset);
    var first = fig.querySelector(".vlegend, .sbars, .bars"); if (first) first.before(bar);
  });

  // ---------- tabelle ordinabili e filtrabili ----------
  document.querySelectorAll(".dt").forEach(function (box) {
    var table = box.querySelector("table"); if (!table) return;
    var tbody = table.tBodies[0], rows = Array.prototype.slice.call(tbody.rows);
    var ths = table.tHead.rows[0].cells, status = document.createElement("p");
    status.className = "tl-live"; status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite");
    var sortIdx = -1, dir = 1;
    Array.prototype.forEach.call(ths, function (th, idx) {
      var label = th.textContent, b = document.createElement("button"); b.type = "button"; b.className = "dt-sort"; b.textContent = label;
      th.textContent = ""; th.appendChild(b); th.setAttribute("aria-sort", "none");
      b.addEventListener("click", function () {
        dir = sortIdx === idx ? -dir : 1; sortIdx = idx;
        var num = th.getAttribute("data-type") === "number";
        rows.sort(function (a, c) {
          var x = idx === 0 ? a.cells[0].textContent : a.cells[idx].getAttribute("data-v"), y = idx === 0 ? c.cells[0].textContent : c.cells[idx].getAttribute("data-v");
          if (num) { x = x === "" ? -Infinity : +x; y = y === "" ? -Infinity : +y; return (x - y) * dir; }
          return String(x).localeCompare(String(y)) * dir;
        });
        rows.forEach(function (r) { tbody.appendChild(r); });
        Array.prototype.forEach.call(ths, function (h, k) { h.setAttribute("aria-sort", k === idx ? (dir === 1 ? "ascending" : "descending") : "none"); });
        status.textContent = "Sorted by " + label + ", " + (dir === 1 ? "ascending" : "descending") + ".";
        b.focus();
      });
    });
    if (box.getAttribute("data-filterable") === "yes") {
      var lab = document.createElement("label"); lab.className = "dt-filter"; lab.textContent = "Filter by name ";
      var inp = document.createElement("input"); inp.type = "search"; inp.className = "dt-input";
      inp.addEventListener("input", function () {
        var q = inp.value.trim().toLowerCase(), n = 0;
        rows.forEach(function (r) { var on = !q || r.cells[0].textContent.toLowerCase().indexOf(q) !== -1; r.hidden = !on; if (on) n++; });
        status.textContent = n + (n === 1 ? " row shown" : " rows shown");
      });
      lab.appendChild(inp); box.querySelector(".dt-wrap").before(lab);
    }
    box.querySelector(".dt-wrap").after(status);
  });

  // ---------- barra di lettura ----------
  var bar = document.querySelector(".read-progress span");
  if (bar) {
    var tick = false;
    var upd = function () { tick = false; var h = document.documentElement.scrollHeight - window.innerHeight; bar.style.width = (h > 0 ? Math.min(100, window.scrollY / h * 100) : 0) + "%"; };
    window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  // ---------- percorso di lettura: lo stato è nell'indirizzo (?trail=<id>&step=<n>), non viene salvato da nessuna parte ----------
  (function () {
    var bar = document.getElementById("trail-bar"), raw = document.getElementById("trail-data");
    if (!bar || !raw) return;
    var q = new URLSearchParams(location.search), id = q.get("trail"), n = parseInt(q.get("step"), 10);
    var T; try { T = JSON.parse(raw.textContent); } catch (e) { return; }
    var t = T.filter(function (x) { return x.id === id; })[0];
    if (!t || !(n >= 1 && n <= t.steps.length) || t.steps[n - 1].slug !== location.pathname.split("/").slice(-2)[0]) return;
    var base = "../../stories/";
    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    var top = el("p", "trail-title", "Trail: " + t.title + " · stop " + n + " of " + t.steps.length);
    var dots = el("ol", "trail-dots"); dots.setAttribute("aria-label", "Trail progress");
    t.steps.forEach(function (st, i) {
      var li = el("li", i + 1 < n ? "done" : i + 1 === n ? "now" : "", ""); li.setAttribute("aria-label", "Stop " + (i + 1) + ": " + st.title + (i + 1 < n ? " (done)" : i + 1 === n ? " (you are here)" : ""));
      dots.appendChild(li);
    });
    bar.appendChild(top); bar.appendChild(dots);
    var nav = el("p", "trail-nav");
    if (n > 1) { var a = el("a", null, "← " + t.steps[n - 2].title); a.href = "../" + t.steps[n - 2].slug + "/index.html?trail=" + id + "&step=" + (n - 1); nav.appendChild(a); }
    if (n < t.steps.length) { var b = el("a", "btn", "Next stop: " + t.steps[n].title); b.href = "../" + t.steps[n].slug + "/index.html?trail=" + id + "&step=" + (n + 1); nav.appendChild(b); bar.appendChild(el("p", "trail-why", t.steps[n].why)); }
    bar.hidden = false;
    // in fondo alla storia: il passo successivo, o la chiusura del percorso
    var art = document.querySelector("article.story");
    if (art) {
      var end = el("aside", "trail-end"); end.setAttribute("aria-label", "Trail");
      if (n < t.steps.length) { end.appendChild(el("h2", null, "Next on this trail")); end.appendChild(el("p", null, t.steps[n].why)); }
      else { end.appendChild(el("h2", null, "Trail complete")); end.appendChild(el("p", null, "You read all " + t.steps.length + " stops of “" + t.title + "”. Nothing is saved; your next step is the quiz.")); var qz = el("a", "btn", "Try the quiz"); qz.href = "../../quiz/index.html"; end.appendChild(qz); }
      end.appendChild(nav.cloneNode(true));
      art.appendChild(end);
    }
    bar.appendChild(nav);
  })();
})();
