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

  // ---------- home: zoom della mappa sulle regioni ----------
  var regions = $("regions"), bigmap = document.querySelector(".map-continent");
  if (regions && bigmap) {
    regions.hidden = false;
    var cur = bigmap.getAttribute("viewBox").split(" ").map(Number);
    var full = cur.slice();
    var pins = all(".map-continent .pin").map(function (a) {
      var m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(a.getAttribute("transform") || "");
      return { a: a, x: m ? +m[1] : 0, y: m ? +m[2] : 0, near: [] };
    });
    // i pin hanno una misura fissa in unità di mappa: li riduciamo quando si ingrandisce, così a una certa
    // scala i luoghi vicini si separano. Due pin che si toccano alla scala corrente formano un gruppo.
    var PIN = 26;
    var mark = function () {
      var k = Math.max(cur[2] / full[2], 0.08), lim = PIN * k;
      pins.forEach(function (p) { p.near = []; });
      pins.forEach(function (p, i) { for (var j = i + 1; j < pins.length; j++) {
        var q = pins[j]; if (Math.hypot(p.x - q.x, p.y - q.y) < lim) { p.near.push(q); q.near.push(p); }
      } });
      pins.forEach(function (p) { p.a.classList.toggle("clu", p.near.length > 0); p.a.setAttribute("data-near", p.near.length); });
    };
    var setVB = function (v) {
      bigmap.setAttribute("viewBox", v.map(function (n) { return n.toFixed(1); }).join(" ")); cur = v;
      var kk = Math.max(v[2] / full[2], 0.08); bigmap.style.setProperty("--k", kk.toFixed(3));
      bigmap.setAttribute("data-lod", kk > 0.55 ? "0" : kk > 0.3 ? "1" : "2"); mark();
    };
    var group = function (p) {
      var seen = [p], todo = [p];
      while (todo.length) todo.pop().near.forEach(function (q) { if (seen.indexOf(q) < 0) { seen.push(q); todo.push(q); } });
      return seen;
    };
    var goTo = function (to) {
      var from = cur.slice();
      if (window.Motion && document.documentElement.classList.contains("m-ok")) {
        Motion.animate(0, 1, { duration: 0.8, ease: [0.22, 1, 0.36, 1], onUpdate: function (t) {
          setVB([0, 1, 2, 3].map(function (i) { return from[i] + (to[i] - from[i]) * t; }));
        } });
        // rete di sicurezza: a fine animazione il riquadro è comunque quello richiesto
        clearTimeout(bigmap._t); bigmap._t = setTimeout(function () { setVB(to); }, 1000);
      } else setVB(to);
    };
    // toccare un pin che ne ha altri addosso ingrandisce sul gruppo, invece di aprire la scheda
    pins.forEach(function (p) {
      p.a.addEventListener("click", function (e) {
        if (!p.near.length) return;
        e.preventDefault(); e.stopImmediatePropagation();
        var g = group(p), xs = g.map(function (q) { return q.x; }), ys = g.map(function (q) { return q.y; }), dmin = 1e9;
        g.forEach(function (q) { q.near.forEach(function (r) { dmin = Math.min(dmin, Math.hypot(q.x - r.x, q.y - r.y)); }); });
        var bw = Math.max.apply(null, xs) - Math.min.apply(null, xs), bh = Math.max.apply(null, ys) - Math.min.apply(null, ys);
        var W = Math.min(full[2], Math.max(full[2] * dmin / PIN * 0.8, Math.max(bw, bh * full[2] / full[3]) * 2 + 40, 100)), H = W * full[3] / full[2];
        var cx = (Math.max.apply(null, xs) + Math.min.apply(null, xs)) / 2, cy = (Math.max.apply(null, ys) + Math.min.apply(null, ys)) / 2;
        goTo([Math.max(0, Math.min(full[2] - W, cx - W / 2)), Math.max(0, Math.min(full[3] - H, cy - H / 2)), W, H]);
        if (window.hideMapCard) window.hideMapCard();
      }, true);
    });
    mark();
    regions.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-vb]"); if (!b) return;
      all("button", regions).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      var to = b.getAttribute("data-vb").split(" ").map(Number);
      goTo(to);
      all("button", regions).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    });
  }

  // ---------- home: scheda con foto al passaggio sui pin ----------
  var card = $("mapcard");
  if (card && bigmap) {
    var box = bigmap.parentNode, cimg = card.querySelector("img"), cb = card.querySelector("b"), cs = card.querySelector("span"), cgo = card.querySelector(".mapcard-go");
    var touch = window.matchMedia("(hover: none)").matches, shownFor = null;
    var hideCard = function () { card.hidden = true; shownFor = null; };
    var showCard = function (pin) {
      shownFor = pin;
      cb.textContent = pin.getAttribute("data-name"); var nr = +pin.getAttribute("data-near") || 0; cs.textContent = pin.getAttribute("data-meta") + (nr ? " · " + nr + " more close by, click to zoom" : "");
      var src = pin.getAttribute("data-img");
      if (src) { cimg.src = src; cimg.hidden = false; } else { cimg.removeAttribute("src"); cimg.hidden = true; }
      cgo.href = pin.getAttribute("href");
      card.hidden = false;
      var br = box.getBoundingClientRect(), pr = pin.getBoundingClientRect(), w = card.offsetWidth, h = card.offsetHeight;
      var x = pr.left + pr.width / 2 - br.left - w / 2, y = pr.top - br.top - h - 14;
      if (y < 6) y = pr.bottom - br.top + 14;
      card.style.left = Math.max(6, Math.min(x, br.width - w - 6)) + "px"; card.style.top = Math.max(6, y) + "px";
    };
    all(".map-continent .pin").forEach(function (pin) {
      ["mouseenter", "focus"].forEach(function (ev) { pin.addEventListener(ev, function () { if (!touch) showCard(pin); }); });
      ["mouseleave", "blur"].forEach(function (ev) { pin.addEventListener(ev, function () { if (!touch) hideCard(); }); });
      // sui telefoni il primo tocco mostra la scheda, il secondo (sul pulsante) apre la pagina
      pin.addEventListener("click", function (e) { if (touch && shownFor !== pin) { e.preventDefault(); showCard(pin); } });
    });
    if (touch) { card.classList.add("touch"); document.addEventListener("click", function (e) { if (!card.contains(e.target) && !e.target.closest(".map-continent .pin")) hideCard(); }); }
    window.hideMapCard = hideCard;
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") hideCard(); });
  }



  // ---------- schede (tab): una sezione alla volta, con indirizzo diretto a ciascuna ----------
  // Senza JavaScript le sezioni restano tutte una sotto l'altra. Un indirizzo con #id apre la scheda che lo contiene.
  all("[data-tabs]").forEach(function (box) {
    var panels = all(":scope > [data-tab]", box);
    if (panels.length < 2) return;
    var bar = document.createElement("div"); bar.className = "tabbar"; bar.setAttribute("role", "tablist");
    var btns = panels.map(function (p, i) {
      var b = document.createElement("button"); b.type = "button"; b.setAttribute("role", "tab");
      b.id = "tab-" + p.id; b.setAttribute("aria-controls", p.id); b.textContent = p.getAttribute("data-tab-label");
      b.addEventListener("click", function () { show(i, true); });
      b.addEventListener("keydown", function (e) {
        var n = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? panels.length - 1 : -1;
        if (n < 0) return; e.preventDefault(); n = (n + panels.length) % panels.length; show(n, true); btns[n].focus();
      });
      bar.appendChild(b); p.setAttribute("role", "tabpanel"); p.setAttribute("aria-labelledby", b.id);
      return b;
    });
    box.insertBefore(bar, box.firstChild);
    function show(i, push) {
      panels.forEach(function (p, k) { p.hidden = k !== i; btns[k].setAttribute("aria-selected", k === i ? "true" : "false"); btns[k].tabIndex = k === i ? 0 : -1; });
      if (push && history.replaceState) history.replaceState(null, "", "#" + panels[i].id);
    }
    function fromHash() {
      var id = decodeURIComponent(location.hash.slice(1)); if (!id) return false;
      var t = document.getElementById(id); if (!t) return false;
      var i = panels.findIndex(function (p) { return p === t || p.contains(t); });
      if (i < 0) return false; show(i, false); return true;
    }
    if (!fromHash()) show(0, false);
    window.addEventListener("hashchange", function () { if (fromHash()) { var t = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (t && t.scrollIntoView) t.scrollIntoView(); } });
  });

  // ---------- anteprime: una lista lunga mostra le prime voci e un pulsante per le altre ----------
  all("[data-fold]").forEach(function (box) {
    var n = parseInt(box.getAttribute("data-fold"), 10) || 8;
    var items = all(box.getAttribute("data-fold-item") || ".srow", box);
    if (items.length <= n + 1) return;
    var what = box.getAttribute("data-fold-what") || "items";
    var btn = document.createElement("button"); btn.type = "button"; btn.className = "fbtn fold-btn";
    var open = false;
    function paint() {
      items.forEach(function (it, k) { it.hidden = !open && k >= n; });
      btn.textContent = open ? "Show fewer " + what : "Show all " + items.length + " " + what;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    }
    btn.addEventListener("click", function () { open = !open; paint(); });
    box.classList.add("folded"); box.appendChild(btn); paint();
  });

  // ---------- pagina Society: filtro per subregione e confronto tra due paesi ----------
  var mk = function (tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  var cmpSub = $("cmp-sub");
  if (cmpSub) {
    $("cmp-tools").hidden = false;
    cmpSub.addEventListener("change", function () {
      var v = cmpSub.value;
      all("#religion .srow").forEach(function (r) { var s = r.getAttribute("data-sub"); r.hidden = v !== "all" && s !== v && s !== ""; });
    });
  }
  var cmpEl = $("cmpdata"), pa = $("pair-a"), pb = $("pair-b"), pout = $("pair-out");
  if (cmpEl && pa && pb && pout) {
    var cd = JSON.parse(cmpEl.textContent);
    $("pair-pick").hidden = false;
    var isos = Object.keys(cd);
    pa.value = cd.ETH ? "ETH" : isos[0]; pb.value = cd.SEN ? "SEN" : isos[1];
    var drawPair = function () {
      var a = cd[pa.value], b = cd[pb.value], t = mk("table", "pairtab");
      t.appendChild(mk("caption", "sr", a.name + " compared with " + b.name));
      var hr = mk("tr"); hr.appendChild(mk("td")); [a, b].forEach(function (x) { hr.appendChild(mk("th", null, x.name)); });
      var th = mk("thead"); th.appendChild(hr); t.appendChild(th);
      var tb = mk("tbody");
      [["Capital", "capital"], ["Subregion", "sub"], ["Population", "population"], ["Area, km²", "area"], ["People per km²", "density"], ["Government", "government"], ["Languages", "languages"], ["Religions", "religions"]].forEach(function (r) {
        var tr = mk("tr"); tr.appendChild(mk("th", null, r[0])); tr.firstChild.setAttribute("scope", "row");
        tr.appendChild(mk("td", null, a[r[1]])); tr.appendChild(mk("td", null, b[r[1]])); tb.appendChild(tr);
      });
      t.appendChild(tb); pout.replaceChildren(t);
    };
    pa.addEventListener("change", drawPair); pb.addEventListener("change", drawPair); drawPair();
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
    // Regional blocs: si sceglie un blocco e i paesi membri si accendono.
    var picks = all("button[data-bloc-pick]", wrap);
    function pickBloc(id) {
      picks.forEach(function (x) { x.setAttribute("aria-pressed", x.getAttribute("data-bloc-pick") === id ? "true" : "false"); });
      all("[data-bloc-card]", wrap).forEach(function (c) { c.hidden = c.getAttribute("data-bloc-card") !== id; });
      all("[data-blocs]", wrap).forEach(function (c) { c.classList.toggle("in", (" " + c.getAttribute("data-blocs") + " ").indexOf(" " + id + " ") >= 0); });
      wrap.setAttribute("data-bloc", id);
    }
    picks.forEach(function (x) { x.addEventListener("click", function () { pickBloc(x.getAttribute("data-bloc-pick")); }); });
    var on = picks.filter(function (x) { return x.getAttribute("aria-pressed") === "true"; })[0] || picks[0];
    if (on) pickBloc(on.getAttribute("data-bloc-pick"));
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

  // ---------- selezione di un paese: mappa, isole, tabella e scheda restano allineate ----------
  var cdataEl = $("cdata"), detail = $("detail");
  var data = cdataEl ? JSON.parse(cdataEl.textContent) : null;
  if (data && detail) {
    var targets = all(".cmap .c[data-iso], .isle[data-iso]");
    var svg = document.querySelector(".cmap");
    var rowOf = {};
    rows.forEach(function (tr) { rowOf[tr.getAttribute("data-iso")] = tr; });
    var el = function (tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
    var NS = "http://www.w3.org/2000/svg";

    var showHint = function () {
      detail.hidden = false; detail.replaceChildren();
      detail.appendChild(el("p", "detail-hint", "Select a country on the map, or a row in the table, to see its figures."));
    };
    var clear = function () {
      current = null;
      targets.forEach(function (t) { t.classList.remove("sel"); t.setAttribute("aria-pressed", "false"); });
      rows.forEach(function (tr) { tr.classList.remove("sel"); });
      var old = svg && svg.querySelector(".selring"); if (old) old.remove();
      showHint();
      if (history.replaceState) history.replaceState(null, "", location.pathname + location.search);
    };
    var current = null, fromHash = false;
    var select = function (iso, scroll) {
      var d = data[iso]; if (!d) return;
      if (current === iso) { clear(); return; }
      current = iso;
      targets.forEach(function (t) { var on = t.getAttribute("data-iso") === iso; t.classList.toggle("sel", on); t.setAttribute("aria-pressed", on ? "true" : "false"); });
      rows.forEach(function (tr) { tr.classList.toggle("sel", tr.getAttribute("data-iso") === iso); });
      // un contorno sovrapposto, così si vede per intero anche se confina con paesi disegnati dopo
      var old = svg && svg.querySelector(".selring"); if (old) old.remove();
      var path = svg && svg.querySelector('.c[data-iso="' + iso + '"]');
      if (path) { var ring = document.createElementNS(NS, "path"); ring.setAttribute("d", path.getAttribute("d")); ring.setAttribute("class", "selring"); ring.setAttribute("fill-rule", "evenodd"); svg.insertBefore(ring, svg.querySelector(".caps")); }
      // scheda
      detail.hidden = false; detail.replaceChildren();
      detail.appendChild(el("h3", null, d.name));
      detail.appendChild(el("p", "detail-cap", "Capital: " + d.capital + " · " + d.sub));
      var dl = el("dl", "detail-dl");
      [["Population", d.population + " (" + d.popShare + " of Africa)"], ["Area", d.area + " km²"], ["People per km²", d.density]].forEach(function (r) {
        var w = el("div"); w.appendChild(el("dt", null, r[0])); w.appendChild(el("dd", null, r[1])); dl.appendChild(w);
      });
      detail.appendChild(dl);
      var pdl = el("dl", "detail-dl detail-prof");
      [["Government", d.government], ["Languages", d.languages], ["African languages named", d.tongues], ["Religions", d.religions], ["Regional blocs", d.blocs]].forEach(function (r) {
        if (!r[1]) return; var w = el("div"); w.appendChild(el("dt", null, r[0])); w.appendChild(el("dd", null, r[1])); pdl.appendChild(w);
      });
      detail.appendChild(pdl);
      detail.appendChild(el("p", "detail-rank", "Rank of " + d.n + ": #" + d.rankPop + " by population, #" + d.rankArea + " by area, #" + d.rankDen + " by density."));
      if (d.voices) { var vb = el("div", "detail-voices"); var vh = el("h4", null, "Notes from people who know " + d.name); vb.appendChild(vh); vb.insertAdjacentHTML("beforeend", d.voices); detail.appendChild(vb); }
      var pg = el("a", "detail-card", "Open the page of " + d.name); pg.href = d.page; detail.appendChild(pg);
      d.cards.forEach(function (c) { var a = el("a", "detail-card", "Place card: " + c.name); a.href = c.href; detail.appendChild(a); });
      var b = el("button", "detail-clear", "Clear selection"); b.type = "button"; b.addEventListener("click", clear); detail.appendChild(b);
      if (history.replaceState) history.replaceState(null, "", "#c-" + iso);
      // dalla tabella o da un indirizzo con #c-XXX si torna alla mappa, dove si vede la scheda
      if (scroll === "map") { var mp = $("map"); if (mp) mp.scrollIntoView({ block: "start", behavior: scroll === "map" && fromHash ? "auto" : "smooth" }); }
      else if (scroll && window.matchMedia("(max-width: 920px)").matches) detail.scrollIntoView({ block: "nearest", behavior: "smooth" });
    };

    targets.forEach(function (t) {
      t.addEventListener("click", function () { select(t.getAttribute("data-iso"), true); });
      t.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(t.getAttribute("data-iso"), true); } });
    });
    rows.forEach(function (tr) {
      tr.addEventListener("click", function (e) { if (e.target.closest("a")) return; select(tr.getAttribute("data-iso"), "map"); });
      tr.addEventListener("keydown", function (e) { if (e.target === tr && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); select(tr.getAttribute("data-iso"), "map"); } });
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && current) clear(); });

    var m = /^#c-([A-Z]{3})$/.exec(location.hash);
    if (m && data[m[1]]) { fromHash = true; select(m[1], "map"); fromHash = false; } else showHint();
  }
})();
