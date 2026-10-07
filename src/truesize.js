// Strumento "True size": una forma (un paese, l'Unione europea) si trascina sopra l'Africa senza cambiare area.
// Questo file serve in due posti: il build lo carica per disegnare lo stato iniziale (nessun DOM, solo la matematica),
// il browser lo esegue per rendere la forma trascinabile. Nessuna libreria, nessuna richiesta esterna.
(function () {
  var RAD = Math.PI / 180;
  var A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, M = Math.sqrt(3) / 2;
  var CM = 20; // meridiano centrale della mappa: l'Africa sta al centro

  // Equal Earth (Šavrič, Patterson, Jenny 2018): conserva le aree. Da lon/lat in gradi a x/y su sfera di raggio 1.
  function project(lon, lat) {
    var l = ((lon - CM + 540) % 360) - 180;
    var th = Math.asin(M * Math.sin(lat * RAD)), t2 = th * th, t6 = t2 * t2 * t2;
    return [
      (2 * Math.sqrt(3) * l * RAD * Math.cos(th)) / (3 * (9 * A4 * t6 * t2 + 7 * A3 * t6 + 3 * A2 * t2 + A1)),
      th * (A1 + A2 * t2 + t6 * (A3 + A4 * t2))
    ];
  }
  function invert(x, y) {
    var th = y, d = 1, t2, t6;
    for (var i = 0; i < 12 && Math.abs(d) > 1e-12; i++) {
      t2 = th * th; t6 = t2 * t2 * t2;
      d = (th * (A1 + A2 * t2 + t6 * (A3 + A4 * t2)) - y) / (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2));
      th -= d;
    }
    t2 = th * th; t6 = t2 * t2 * t2;
    return [
      (3 * x * (9 * A4 * t6 * t2 + 7 * A3 * t6 + 3 * A2 * t2 + A1)) / (2 * Math.sqrt(3) * Math.cos(th)) / RAD + CM,
      Math.asin(Math.sin(th) / M) / RAD
    ];
  }

  // Sposta una forma dal suo punto di ancoraggio (lon0, lat0) al punto (lon1, lat1) ruotando la sfera, non scivolando sul
  // piano: l'area resta quella vera e il nord resta in alto nel punto di arrivo.
  function mover(anchor, target) {
    var l0 = anchor[0] * RAD, p0 = anchor[1] * RAD, l1 = target[0] * RAD, p1 = target[1] * RAD;
    var c0 = Math.cos(l0), s0 = Math.sin(l0), cp0 = Math.cos(p0), sp0 = Math.sin(p0);
    var cp1 = Math.cos(p1), sp1 = Math.sin(p1), c1 = Math.cos(l1), s1 = Math.sin(l1);
    return function (lon, lat) {
      var la = lat * RAD, lo = lon * RAD;
      var x = Math.cos(la) * Math.cos(lo), y = Math.cos(la) * Math.sin(lo), z = Math.sin(la);
      var x1 = x * c0 + y * s0, y1 = -x * s0 + y * c0;       // porta l'ancora sul meridiano 0
      var x2 = x1 * cp0 + z * sp0, z2 = -x1 * sp0 + z * cp0; // e sull'equatore
      var x3 = x2 * cp1 - z2 * sp1, z3 = x2 * sp1 + z2 * cp1; // poi alla latitudine di arrivo
      var x4 = x3 * c1 - y1 * s1, y4 = x3 * s1 + y1 * c1;     // e alla longitudine di arrivo
      return [Math.atan2(y4, x4) / RAD, Math.asin(Math.max(-1, Math.min(1, z3))) / RAD];
    };
  }

  var api = { project: project, invert: invert, mover: mover };
  if (typeof module === "object" && module.exports) { module.exports = api; return; }
  if (typeof document === "undefined") return;

  // ---------- browser ----------
  var svg = document.getElementById("ts-svg");
  var dataEl = document.getElementById("ts-data");
  if (!svg || !dataEl) return;
  var D = JSON.parse(dataEl.textContent);
  var S = D.scale, NS = "http://www.w3.org/2000/svg";
  var layer = document.getElementById("ts-layer");
  var chips = document.getElementById("ts-chips"), keys = document.getElementById("ts-keys");
  var out = document.getElementById("ts-out"), fine = document.getElementById("ts-note");
  var resetBtn = document.getElementById("ts-reset"), clearBtn = document.getElementById("ts-clear");
  var MAX = D.max;
  var shapes = {}; D.shapes.forEach(function (s) { shapes[s.id] = s; });
  var active = []; // { id, slot, target:[lon,lat], el, label }
  var drag = null;

  function fmtArea(km2) { return (km2 / 1e6).toFixed(1) + " million km²"; }
  function times(r) { return r >= 10 ? String(Math.round(r)) : r.toFixed(1); }
  function px(p) { var q = project(p[0], p[1]); return [Math.round(q[0] * S * 10) / 10, Math.round(-q[1] * S * 10) / 10]; }

  // forma + etichetta, ridisegnate quando il bersaglio cambia
  function draw(a) {
    var s = shapes[a.id], mv = mover(s.anchor, a.target), d = "";
    s.rings.forEach(function (r) {
      var p = r.map(function (c) { return px(mv(c[0], c[1])); });
      // un anello che attraversa il bordo della mappa viene scartato: succede solo ai margini estremi
      var wide = 0; for (var i = 1; i < p.length; i++) wide = Math.max(wide, Math.abs(p[i][0] - p[i - 1][0]));
      if (wide > S * 2) return;
      d += "M" + p.map(function (q) { return q[0] + "," + q[1]; }).join("L") + "Z";
    });
    a.el.setAttribute("d", d);
    var c = px(a.target);
    a.label.setAttribute("x", c[0]); a.label.setAttribute("y", c[1]);
  }

  function say() {
    if (!active.length) { out.textContent = "Nothing laid over Africa yet. Choose a country below."; return; }
    var sum = active.reduce(function (t, a) { return t + shapes[a.id].area; }, 0);
    var parts = active.map(function (a) { return shapes[a.id].label + ", " + fmtArea(shapes[a.id].area) + " (Africa is " + times(D.africa / shapes[a.id].area) + " times larger)"; });
    out.textContent = parts.join(". ") + (active.length > 1 ? ". Together: " + fmtArea(sum) + ", " + Math.round(sum / D.africa * 100) + "% of Africa's area." : ".");
  }

  function syncUi() {
    Array.prototype.forEach.call(chips.querySelectorAll("button[data-id]"), function (b) {
      var on = active.some(function (a) { return a.id === b.getAttribute("data-id"); });
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.disabled = !on && active.length >= MAX;
    });
    keys.replaceChildren();
    active.forEach(function (a) {
      var li = document.createElement("li");
      var sw = document.createElement("span"); sw.className = "ts-sw s" + a.slot;
      li.appendChild(sw); li.appendChild(document.createTextNode(shapes[a.id].label + " · " + fmtArea(shapes[a.id].area)));
      keys.appendChild(li);
    });
    clearBtn.disabled = !active.length;
    var notes = active.map(function (a) { return shapes[a.id].note ? shapes[a.id].label + ": " + shapes[a.id].note : ""; }).filter(Boolean);
    fine.textContent = notes.join(" ");
    fine.hidden = !notes.length;
    say();
  }

  function toFront(a) { layer.appendChild(a.el); layer.appendChild(a.label); }

  function svgPoint(e) {
    var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    var q = pt.matrixTransform(svg.getScreenCTM().inverse());
    return [q.x, q.y];
  }
  // Il centro non esce dalla finestra della mappa: oltre, la forma sparirebbe.
  function clampTarget(t) { return [Math.max(D.lim[0], Math.min(D.lim[2], t[0])), Math.max(D.lim[1], Math.min(D.lim[3], t[1]))]; }
  function nudge(a, dLon, dLat) { a.target = clampTarget([a.target[0] + dLon, a.target[1] + dLat]); draw(a); }

  function add(id, at) {
    if (active.length >= MAX || active.some(function (a) { return a.id === id; })) return;
    var used = active.map(function (a) { return a.slot; }), slot = 1;
    while (used.indexOf(slot) >= 0) slot++;
    var s = shapes[id];
    var el = document.createElementNS(NS, "path");
    el.setAttribute("class", "ts-shape s" + slot); el.setAttribute("tabindex", "0");
    el.setAttribute("role", "button");
    el.setAttribute("aria-roledescription", "draggable shape");
    el.setAttribute("aria-label", s.label + ", " + fmtArea(s.area) + ". Drag it, or use the arrow keys to move it.");
    var label = document.createElementNS(NS, "text"); label.setAttribute("class", "ts-name"); label.setAttribute("text-anchor", "middle");
    label.textContent = s.label.replace(/ \(.*\)$/, "");
    var n = active.length, off = [[0, 0], [-9, 9], [9, -9], [-9, -9], [9, 9]][n % 5];
    var a = { id: id, slot: slot, el: el, label: label, target: clampTarget(at || [D.home[0] + off[0], D.home[1] + off[1]]) };
    active.push(a);
    layer.appendChild(el); layer.appendChild(label);
    draw(a);
    // Su iPhone il solo touch-action non basta sempre a fermare lo scroll della pagina mentre si trascina una forma.
    ["touchstart", "touchmove"].forEach(function (t) { el.addEventListener(t, function (e) { e.preventDefault(); }, { passive: false }); });
    el.addEventListener("pointerdown", function (e) {
      if (e.button !== undefined && e.button > 0) return;
      e.preventDefault();
      var p = svgPoint(e), c = px(a.target);
      drag = { a: a, dx: p[0] - c[0], dy: p[1] - c[1] };
      el.setPointerCapture(e.pointerId); el.classList.add("grab"); toFront(a);
    });
    el.addEventListener("pointermove", function (e) {
      if (!drag || drag.a !== a) return;
      var p = svgPoint(e), g = invert((p[0] - drag.dx) / S, -(p[1] - drag.dy) / S);
      a.target = clampTarget(g); draw(a);
    });
    function end() { if (drag && drag.a === a) { drag = null; el.classList.remove("grab"); say(); } }
    el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
    el.addEventListener("keydown", function (e) {
      var k = e.key, st = e.shiftKey ? 8 : 2;
      var m = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, st], ArrowDown: [0, -st] }[k];
      if (!m) return;
      e.preventDefault(); nudge(a, m[0], m[1]); toFront(a); el.focus();
    });
    syncUi();
  }
  function remove(id) {
    var i = active.findIndex(function (a) { return a.id === id; });
    if (i < 0) return;
    active[i].el.remove(); active[i].label.remove(); active.splice(i, 1);
    syncUi();
  }

  // Con JavaScript compare la scelta; la forma iniziale disegnata dal build viene sostituita da quella interattiva.
  var seed = document.getElementById("ts-seed");
  if (seed) seed.remove();
  chips.hidden = false;
  document.getElementById("ts-nojs").hidden = true;
  chips.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-id]");
    if (!b) return;
    var id = b.getAttribute("data-id");
    if (b.getAttribute("aria-pressed") === "true") remove(id); else add(id);
  });
  resetBtn.addEventListener("click", function () {
    active.forEach(function (a, i) { var off = [[0, 0], [-9, 9], [9, -9], [-9, -9], [9, 9]][i % 5]; a.target = clampTarget([D.home[0] + off[0], D.home[1] + off[1]]); draw(a); });
    say();
  });
  clearBtn.addEventListener("click", function () { active.slice().forEach(function (a) { remove(a.id); }); });
  add(D.start);
})();
