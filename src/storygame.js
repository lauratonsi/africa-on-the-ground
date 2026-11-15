// Gioco "Di quale storia è?": una frase presa dai punti chiave delle storie e quattro storie possibili.
// Il punteggio e la serie vivono solo nella pagina: nessun cookie, nessun localStorage, nessun invio.
(function () {
  var box = document.getElementById("sgame"), raw = document.getElementById("sgame-data");
  if (!box || !raw) return;
  var D; try { D = JSON.parse(raw.textContent); } catch (e) { return; }
  var ROUNDS = 6;
  var $ = function (tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  function shuffle(a) { var b = a.slice(); for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = b[i]; b[i] = b[j]; b[j] = t; } return b; }
  var titles = {}; D.items.forEach(function (it) { titles[it.s] = it.n; });
  var slugs = Object.keys(titles);
  var round, score, streak, best, qs;
  function start() {
    var seen = {}, pool = shuffle(D.items).filter(function (it) { if (seen[it.s]) return false; seen[it.s] = 1; return true; });
    qs = pool.slice(0, ROUNDS); round = 0; score = 0; streak = 0; best = 0; ask();
  }
  function ask() {
    box.replaceChildren();
    var q = qs[round];
    var head = $("p", "sg-head", "Round " + (round + 1) + " of " + ROUNDS + " · score " + score + (streak > 1 ? " · streak " + streak : ""));
    var h = $("p", "sg-q", q.t); h.tabIndex = -1;
    var others = shuffle(slugs.filter(function (s) { return s !== q.s; })).slice(0, 3);
    var opts = shuffle(others.concat([q.s]));
    var list = $("div", "sg-opts"); list.setAttribute("role", "group");
    var fb = $("div", "sg-fb"); fb.setAttribute("role", "status"); fb.setAttribute("aria-live", "polite");
    var done = false;
    opts.forEach(function (s) {
      var b = $("button", "check-opt", titles[s]); b.type = "button";
      b.addEventListener("click", function () {
        if (done) return; done = true;
        var right = s === q.s;
        if (right) { score++; streak++; if (streak > best) best = streak; } else streak = 0;
        Array.prototype.forEach.call(list.children, function (x) { x.disabled = true; if (x.textContent === titles[q.s]) x.classList.add("right"); else if (x === b) x.classList.add("wrong"); });
        fb.appendChild($("p", "quiz-verdict " + (right ? "ok" : "no"), right ? (streak > 1 ? "Yes. Streak of " + streak + "." : "Yes.") : "Not this one."));
        var a = $("a", null, "Read “" + titles[q.s] + "”"); a.href = D.base + "stories/" + q.s + "/index.html";
        var p = $("p", "quiz-story"); p.appendChild(a); fb.appendChild(p);
        var next = $("button", "btn", round + 1 < ROUNDS ? "Next round" : "See the result"); next.type = "button";
        next.addEventListener("click", function () { round++; if (round < ROUNDS) ask(); else finish(); });
        fb.appendChild(next); next.focus();
      });
      list.appendChild(b);
    });
    box.appendChild(head); box.appendChild(h); box.appendChild(list); box.appendChild(fb);
    h.focus({ preventScroll: true });
  }
  function finish() {
    box.replaceChildren();
    var msg = score === ROUNDS ? "Perfect round." : score >= ROUNDS - 2 ? "Strong round." : "A start: the stories will fill the gaps.";
    box.appendChild($("p", "sg-q", "You got " + score + " of " + ROUNDS + ". Best streak: " + best + ". " + msg));
    box.appendChild($("p", "note-small", "Nothing is saved: the score disappears when you leave the page."));
    var again = $("button", "btn", "Play again"); again.type = "button"; again.addEventListener("click", start); box.appendChild(again);
    again.focus();
  }
  var startBtn = $("button", "btn", "Start a round"); startBtn.type = "button"; startBtn.addEventListener("click", start);
  box.appendChild(startBtn); box.hidden = false;
})();
