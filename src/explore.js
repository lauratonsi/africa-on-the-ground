// Esplora i collegamenti tra Paesi, capitali, luoghi e storie, e gioca a unire due punti. Nulla viene salvato né inviato.
(function () {
  var el = document.getElementById("graphdata"), ui = document.getElementById("ex-ui");
  if (!el || !ui) return;
  var G; try { G = JSON.parse(el.textContent); } catch (e) { return; }
  var N = {}, adj = {};
  G.nodes.forEach(function (n) { N[n.id] = n; adj[n.id] = []; });
  G.edges.forEach(function (e) { if (N[e[0]] && N[e[1]] && adj[e[0]].indexOf(e[1]) < 0) { adj[e[0]].push(e[1]); adj[e[1]].push(e[0]); } });
  var TYPES = [["country", "Countries"], ["capital", "Capitals"], ["place", "Places"], ["story", "Stories"], ["bloc", "Regional blocs"]];
  var LABEL = { country: "Country", capital: "Capital", place: "Place", story: "Story", bloc: "Regional bloc" };
  var COLOR = { country: "var(--viz-1)", capital: "var(--viz-2)", place: "var(--viz-3)", story: "var(--viz-4)", bloc: "var(--viz-5)" };
  var h = function (tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  var pick = document.getElementById("ex-pick"), svg = document.getElementById("ex-svg"), card = document.getElementById("ex-card"), lists = document.getElementById("ex-lists"), back = document.getElementById("ex-back");
  var cur = null, hist = [], game = null;
  ui.hidden = false;
  TYPES.forEach(function (t) {
    var g = document.createElement("optgroup"); g.label = t[1];
    G.nodes.filter(function (n) { return n.t === t[0] && adj[n.id].length; }).sort(function (a, b) { return a.l.localeCompare(b.l); }).forEach(function (n) { var o = document.createElement("option"); o.value = n.id; o.textContent = n.l; g.appendChild(o); });
    if (g.children.length) pick.appendChild(g);
  });
  function go(id, fromHist) {
    if (!N[id]) return;
    if (!fromHist && cur) hist.push(cur);
    cur = id; pick.value = id; back.disabled = !hist.length;
    var n = N[id], nb = adj[id].map(function (x) { return N[x]; });
    card.innerHTML = "";
    card.appendChild(h("p", "ex-type", LABEL[n.t]));
    card.appendChild(h("h3", "", n.l));
    var a = h("a", "btn-link", "Open this page"); a.href = n.h; card.appendChild(a);
    card.appendChild(h("p", "fine", nb.length + (nb.length === 1 ? " connection" : " connections")));
    // svg radiale
    svg.innerHTML = "";
    var ns = "http://www.w3.org/2000/svg", R = 190, shown = nb.slice(0, 28);
    function mk(tag, at) { var e = document.createElementNS(ns, tag); for (var k in at) e.setAttribute(k, at[k]); return e; }
    shown.forEach(function (m, i) {
      var ang = i / shown.length * Math.PI * 2 - Math.PI / 2, x = Math.cos(ang) * R, y = Math.sin(ang) * R * 0.8;
      svg.appendChild(mk("line", { x1: 0, y1: 0, x2: x, y2: y, stroke: "var(--line)", "stroke-width": 1.5 }));
      var g = mk("g", { transform: "translate(" + x + "," + y + ")", class: "ex-node", tabindex: "-1" });
      g.appendChild(mk("circle", { r: 9, fill: COLOR[m.t] }));
      var tx = mk("text", { y: y < 0 ? -14 : 22, "text-anchor": "middle", class: "ex-lab" }); tx.textContent = m.l.length > 22 ? m.l.slice(0, 21) + "…" : m.l; g.appendChild(tx);
      g.addEventListener("click", function () { step(m.id); });
      svg.appendChild(g);
    });
    var c0 = mk("circle", { r: 18, fill: COLOR[n.t], stroke: "var(--surface)", "stroke-width": 4 }); svg.appendChild(c0);
    var t0 = mk("text", { y: 36, "text-anchor": "middle", class: "ex-lab ex-lab-c" }); t0.textContent = n.l.length > 30 ? n.l.slice(0, 29) + "…" : n.l; svg.appendChild(t0);
    // elenchi accessibili
    lists.innerHTML = "";
    TYPES.forEach(function (t) {
      var items = nb.filter(function (m) { return m.t === t[0]; }); if (!items.length) return;
      var box = h("section", "ex-group"); box.appendChild(h("h3", "", t[1] + " (" + items.length + ")"));
      var ul = h("ul", "ex-chips");
      items.sort(function (a, b) { return a.l.localeCompare(b.l); }).forEach(function (m) {
        var li = h("li"); var b = h("button", "ex-chip", m.l); b.type = "button"; b.style.setProperty("--chip", COLOR[m.t]); b.addEventListener("click", function () { step(m.id); }); li.appendChild(b); ul.appendChild(li);
      });
      box.appendChild(ul); lists.appendChild(box);
    });
    if (game && !game.done) check();
  }
  function step(id) { if (game && !game.done) game.steps++; go(id); }
  back.addEventListener("click", function () { if (hist.length) { if (game && !game.done) game.steps++; go(hist.pop(), true); } });
  pick.addEventListener("change", function () { go(pick.value); });
  document.getElementById("ex-random").addEventListener("click", function () { var pool = G.nodes.filter(function (n) { return adj[n.id].length > 2; }); go(pool[Math.floor(Math.random() * pool.length)].id); });
  // distanza e percorso più breve
  function bfs(a, b) {
    var prev = {}; prev[a] = null; var q = [a];
    while (q.length) { var x = q.shift(); if (x === b) break; adj[x].forEach(function (y) { if (!(y in prev)) { prev[y] = x; q.push(y); } }); }
    if (!(b in prev)) return null; var path = [], c = b; while (c) { path.unshift(c); c = prev[c]; } return path;
  }
  // gioco: unisci due punti
  var gbox = document.getElementById("ex-game"), gq = document.getElementById("exg-q"), gs = document.getElementById("exg-score");
  var rounds = 0, totalOver = 0;
  function newGame() {
    var pool = G.nodes.filter(function (n) { return (n.t === "story" || n.t === "place" || n.t === "country" || n.t === "capital") && adj[n.id].length; });
    var a, b, p, tries = 0;
    do { a = pool[Math.floor(Math.random() * pool.length)]; b = pool[Math.floor(Math.random() * pool.length)]; p = a === b ? null : bfs(a.id, b.id); tries++; } while ((!p || p.length < 3 || p.length > 5) && tries < 400);
    if (!p) return;
    game = { start: a.id, target: b.id, best: p.length - 1, path: p, steps: 0, done: false };
    hist = []; cur = null; go(a.id);
    gq.innerHTML = "";
    gq.appendChild(h("p", "game-q", "Start at " + a.l + " and reach " + b.l + " by following links, in as few steps as you can."));
    gq.appendChild(h("p", "game-fb", "Use the buttons or the circles below to move. Target: " + b.l + " (" + LABEL[b.t].toLowerCase() + ")."));
    var nb = h("button", "est-btn", "New thread"); nb.type = "button"; nb.addEventListener("click", newGame); gq.appendChild(nb);
    gs.textContent = "Steps 0";
  }
  function check() {
    gs.textContent = "Steps " + game.steps;
    if (cur === game.target) {
      game.done = true; rounds++; totalOver += game.steps - game.best;
      var names = game.path.map(function (id) { return N[id].l; }).join(" → ");
      gq.appendChild(h("p", "game-fb", (game.steps === game.best ? "Shortest route! " : "You arrived in " + game.steps + " steps; the shortest is " + game.best + ". ") + names));
      gs.textContent = "Steps " + game.steps + " · best possible " + game.best + " · rounds " + rounds;
    }
  }
  gbox.hidden = false; newGame();
})();
