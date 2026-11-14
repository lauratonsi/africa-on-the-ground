// Due giochi sulla pagina Society, costruiti dai dati della pagina. Il punteggio resta nel browser e sparisce chiudendo la pagina.
(function () {
  var el = document.getElementById("gamedata");
  if (!el) return;
  var D;
  try { D = JSON.parse(el.textContent); } catch (e) { return; }
  var rnd = function (n) { return Math.floor(Math.random() * n); };
  var pick = function (a) { return a[rnd(a.length)]; };
  var shuffle = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  var h = function (tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

  // ---------- Più alto o più basso ----------
  (function () {
    var box = document.getElementById("game-hl"), q = document.getElementById("hl-q"), score = document.getElementById("hl-score");
    if (!box || !D.hl || D.hl.length < 4) return;
    box.hidden = false;
    var streak = 0, best = 0, asked = 0;
    function round() {
      q.innerHTML = "";
      var metric = pick(["christian", "muslim"]), label = metric === "christian" ? "Christian" : "Muslim";
      var a, b, tries = 0;
      do { a = pick(D.hl); b = pick(D.hl); tries++; } while ((a === b || Math.abs(a[metric] - b[metric]) < 6) && tries < 200);
      q.appendChild(h("p", "game-q", "Which country has the larger share of people counted as " + label + "?"));
      var row = h("div", "game-opts"); row.setAttribute("role", "group");
      var fb = h("div", "game-fb"); fb.setAttribute("role", "status"); fb.setAttribute("aria-live", "polite");
      [a, b].forEach(function (c) {
        var btn = h("button", "game-opt"); btn.type = "button";
        btn.appendChild(h("strong", "", c.n)); btn.appendChild(h("span", "game-sub", c.sub));
        btn.addEventListener("click", function () {
          var other = c === a ? b : a, right = c[metric] > other[metric];
          row.querySelectorAll("button").forEach(function (x) { x.disabled = true; });
          btn.classList.add(right ? "is-right" : "is-wrong");
          asked++;
          if (right) { streak++; if (streak > best) best = streak; } else streak = 0;
          fb.textContent = (right ? "Yes. " : "Not this time. ") + a.n + ": " + a[metric] + "% " + label + ", " + b.n + ": " + b[metric] + "% " + label + ".";
          score.textContent = "Streak " + streak + " · best " + best + " · answered " + asked;
          var nx = h("button", "est-btn", "Next pair"); nx.type = "button"; nx.addEventListener("click", round);
          q.appendChild(nx); nx.focus();
        });
        row.appendChild(btn);
      });
      q.appendChild(row); q.appendChild(fb);
    }
    round();
  })();

  // ---------- Indovina il paese ----------
  (function () {
    var box = document.getElementById("game-gc"), q = document.getElementById("gc-q"), score = document.getElementById("gc-score");
    if (!box || !D.gc || D.gc.length < 8) return;
    box.hidden = false;
    var total = 0, rounds = 0;
    function round() {
      q.innerHTML = "";
      var target = pick(D.gc), used = 1, answered = false;
      var near = D.gc.filter(function (c) { return c !== target && c.sub === target.sub; });
      var far = D.gc.filter(function (c) { return c !== target && c.sub !== target.sub; });
      var opts = shuffle([target].concat(shuffle(near).slice(0, 2)).concat(shuffle(far)).slice(0, 4));
      if (opts.indexOf(target) < 0) opts[0] = target;
      opts = shuffle(opts);
      q.appendChild(h("p", "game-q", "Clues get easier as you ask for more. The fewer you use, the more points you earn."));
      var clues = h("ol", "game-clues"); q.appendChild(clues);
      function showClue() { var li = h("li", "", target.clues[used - 1]); clues.appendChild(li); }
      showClue();
      var more = h("button", "rc-btn", "Another clue"); more.type = "button";
      more.addEventListener("click", function () { if (answered) return; if (used < target.clues.length) { used++; showClue(); } if (used >= target.clues.length) more.disabled = true; });
      q.appendChild(more);
      var row = h("div", "game-opts"); row.setAttribute("role", "group"); row.setAttribute("aria-label", "Which country?");
      var fb = h("div", "game-fb"); fb.setAttribute("role", "status"); fb.setAttribute("aria-live", "polite");
      opts.forEach(function (c) {
        var btn = h("button", "game-opt"); btn.type = "button"; btn.appendChild(h("strong", "", c.n));
        btn.addEventListener("click", function () {
          answered = true; more.disabled = true;
          row.querySelectorAll("button").forEach(function (x) { x.disabled = true; if (x.textContent === target.n) x.classList.add("is-right"); });
          var right = c === target, pts = right ? Math.max(1, target.clues.length - used + 1) : 0;
          if (!right) btn.classList.add("is-wrong");
          total += pts; rounds++;
          fb.textContent = right ? "Yes, " + target.n + ". You used " + used + (used === 1 ? " clue" : " clues") + " and earn " + pts + (pts === 1 ? " point." : " points.") : "It was " + target.n + ". No points this time.";
          score.textContent = "Points " + total + " over " + rounds + (rounds === 1 ? " round" : " rounds");
          var nx = h("button", "est-btn", "Next country"); nx.type = "button"; nx.addEventListener("click", round);
          q.appendChild(nx); nx.focus();
        });
        row.appendChild(btn);
      });
      q.appendChild(row); q.appendChild(fb);
    }
    round();
  })();
})();
