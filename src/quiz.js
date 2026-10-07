// Quiz: domande tratte dalle storie e dai dati del sito. Non salva nulla: niente cookie, niente localStorage, niente invii.
// Il punteggio esiste solo finché la pagina è aperta.
(function () {
  var dataEl = document.getElementById("quiz-data");
  var start = document.getElementById("quiz-start"), play = document.getElementById("quiz-play");
  if (!dataEl || !start || !play) return;
  var D = JSON.parse(dataEl.textContent);
  var $ = function (tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

  function shuffle(a) { var b = a.slice(); for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = b[i]; b[i] = b[j]; b[j] = t; } return b; }

  // Un giro: 8 domande del tema scelto. Con "a bit of everything" si prende da ogni tema a turno.
  function round(topic) {
    var pool = D.questions.filter(function (q) { return topic === "mixed" || q.t === topic; });
    if (topic !== "mixed") return shuffle(pool).slice(0, D.rounds);
    var by = {};
    shuffle(pool).forEach(function (q) { (by[q.t] = by[q.t] || []).push(q); });
    var keys = shuffle(Object.keys(by)), out = [];
    while (out.length < D.rounds && keys.some(function (k) { return by[k].length; })) {
      keys.forEach(function (k) { if (out.length < D.rounds && by[k].length) out.push(by[k].pop()); });
    }
    return shuffle(out);
  }

  var qs = [], i = 0, score = 0, topic = "mixed";

  function sourceLine(q) {
    var p = $("p", "quiz-src");
    p.appendChild(document.createTextNode(q.c.length > 1 ? "Sources: " : "Source: "));
    q.c.forEach(function (id, k) {
      var s = D.sources[id]; if (!s) return;
      if (k) p.appendChild(document.createTextNode("; "));
      var a = $("a", null, s.publisher + ", " + s.title); a.href = s.url; a.target = "_blank"; a.rel = "noopener noreferrer";
      p.appendChild(a);
      var tag = $("span", "quiz-tier" + (s.weak ? " chk" : ""), s.tier + (s.status ? ", " + s.status : ""));
      p.appendChild(document.createTextNode(" ")); p.appendChild(tag);
    });
    return p;
  }

  function showStart() {
    play.hidden = true; start.hidden = false; play.replaceChildren();
    var first = start.querySelector("button"); if (first) first.focus({ preventScroll: true });
  }

  function ask() {
    var q = qs[i];
    play.replaceChildren();
    var head = $("p", "quiz-count", "Question " + (i + 1) + " of " + qs.length);
    var h = $("h3", "quiz-q", q.q); h.id = "quiz-q"; h.tabIndex = -1;
    var list = $("div", "quiz-opts"); list.setAttribute("role", "group"); list.setAttribute("aria-labelledby", "quiz-q");
    var fb = $("div", "quiz-fb"); fb.setAttribute("aria-live", "polite");
    var answered = false;
    shuffle(q.o).forEach(function (opt) {
      var b = $("button", "quiz-opt", opt); b.type = "button";
      b.addEventListener("click", function () {
        if (answered) return; answered = true;
        var right = opt === q.a;
        if (right) score++;
        Array.prototype.forEach.call(list.children, function (x) {
          x.disabled = true;
          if (x.textContent === q.a) { x.classList.add("right"); x.appendChild($("span", "quiz-mark", " Correct answer")); }
          else if (x === b) { x.classList.add("wrong"); x.appendChild($("span", "quiz-mark", " Your answer")); }
        });
        fb.appendChild($("p", "quiz-verdict " + (right ? "ok" : "no"), right ? "Correct." : "Not quite."));
        fb.appendChild($("p", "quiz-why", q.e));
        fb.appendChild(sourceLine(q));
        if (q.s) { var r = $("p", "quiz-story"); var a = $("a", null, "Read the story"); a.href = q.s; r.appendChild(a); fb.appendChild(r); }
        var next = $("button", "btn quiz-next", i + 1 < qs.length ? "Next question" : "See the result"); next.type = "button";
        next.addEventListener("click", function () { i++; if (i < qs.length) ask(); else finish(); });
        fb.appendChild(next); next.focus();
      });
      list.appendChild(b);
    });
    play.appendChild(head); play.appendChild(h); play.appendChild(list); play.appendChild(fb);
    h.focus({ preventScroll: true });
  }

  function finish() {
    play.replaceChildren();
    var h = $("h3", "quiz-q", "You got " + score + " of " + qs.length); h.tabIndex = -1;
    var msg = score === qs.length ? "Every answer right." : score >= qs.length / 2 ? "A good round. The explanation under each answer is worth a second look." : "Nothing is lost by this: each answer came with its source, and the stories tell the whole account.";
    var again = $("button", "btn", "Play this topic again"); again.type = "button"; again.addEventListener("click", function () { begin(topic); });
    var other = $("button", "btn btn-alt", "Choose another topic"); other.type = "button"; other.addEventListener("click", showStart);
    var row = $("div", "actions"); row.appendChild(again); row.appendChild(other);
    play.appendChild(h); play.appendChild($("p", "quiz-why", msg)); play.appendChild(row);
    h.focus({ preventScroll: true });
  }

  function begin(t) {
    topic = t; qs = round(t); i = 0; score = 0;
    start.hidden = true; play.hidden = false; ask();
  }

  start.hidden = false;
  start.addEventListener("click", function (e) { var b = e.target.closest("button[data-topic]"); if (b) begin(b.getAttribute("data-topic")); });
})();
