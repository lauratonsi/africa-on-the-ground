// Ricette interattive. Senza JavaScript la ricetta resta leggibile con le quantità di base.
// Qui: porzioni che scalano le quantità (con frazioni leggibili), ingredienti e passi da spuntare,
// barra di avanzamento, timer per passo e modalità "cucina" un passo alla volta. Nulla viene salvato né inviato.
(function () {
  var FR = [[0.25, "¼"], [1 / 3, "⅓"], [0.5, "½"], [2 / 3, "⅔"], [0.75, "¾"]];
  var SPOON = /^(tbsp|tsp|tablespoons?|teaspoons?|cups?|large|medium|small|pinch(es)?|cloves?|pieces?|)$/i;
  function fmt(n, unit) {
    if (SPOON.test(unit || "") && n < 20) {
      // cucchiai, tazze e pezzi: la frazione da cucina più vicina (¼, ⅓, ½, ⅔, ¾)
      var whole = Math.floor(n), rest = n - whole, best = [0, ""], d = rest;
      FR.concat([[1, ""]]).forEach(function (f) { if (Math.abs(rest - f[0]) < d) { d = Math.abs(rest - f[0]); best = f; } });
      if (best[0] === 1) return String(whole + 1);
      if (!best[1]) return String(whole || "¼");
      return (whole ? whole + " " : "") + best[1];
    }
    if (/^(g|ml)$/i.test(unit || "") && n >= 20) return String(Math.round(n / 5) * 5);
    var r = Math.round(n * 100) / 100;
    if (r >= 10) r = Math.round(r * 10) / 10;
    if (r >= 100) r = Math.round(r / 5) * 5;
    return String(r);
  }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function clock(sec) { var m = Math.floor(sec / 60), s = sec % 60; return m + ":" + (s < 10 ? "0" : "") + s; }

  document.querySelectorAll(".recipe").forEach(function (box, bi) {
    var base = +box.getAttribute("data-base") || 1, now = base;
    var kicker = box.querySelector(".rc-serv-k"), numEl = box.querySelector(".rc-serv-n");
    var ings = Array.prototype.slice.call(box.querySelectorAll(".rc-ing li"));
    var steps = Array.prototype.slice.call(box.querySelectorAll(".rc-steps li"));
    var title = (box.querySelector(".chart-title") || {}).textContent || "Recipe";

    // ---------- porzioni ----------
    var ctl = el("div", "rc-ctl"); ctl.setAttribute("role", "group"); ctl.setAttribute("aria-label", "Number of servings");
    var minus = el("button", "rc-btn", "−"), plus = el("button", "rc-btn", "+"), reset = el("button", "rc-btn", "Reset");
    [minus, plus, reset].forEach(function (b) { b.type = "button"; });
    minus.setAttribute("aria-label", "Fewer servings"); plus.setAttribute("aria-label", "More servings");
    ctl.appendChild(minus); ctl.appendChild(plus); ctl.appendChild(reset);
    var live = el("span", "sr-only"); live.setAttribute("role", "status"); live.setAttribute("aria-live", "polite");
    var cookBtn = el("button", "btn rc-cook-btn", "Cook step by step"); cookBtn.type = "button";
    kicker.after(ctl); ctl.after(live); ctl.appendChild(cookBtn);
    function render() {
      numEl.textContent = now;
      ings.forEach(function (li) {
        var a = li.getAttribute("data-amount"); if (a == null) return;
        var u = li.getAttribute("data-unit");
        li.querySelector(".rc-amt").textContent = fmt(+a * now / base, u) + (u ? " " + u : "");
      });
      minus.disabled = now <= 1; plus.disabled = now >= 24; reset.disabled = now === base;
      live.textContent = "Quantities for " + now + (now === 1 ? " serving" : " servings");
    }
    minus.addEventListener("click", function () { if (now > 1) { now--; render(); } });
    plus.addEventListener("click", function () { if (now < 24) { now++; render(); } });
    reset.addEventListener("click", function () { now = base; render(); });
    render();

    // ---------- avanzamento ----------
    var prog = el("div", "rc-prog"); prog.setAttribute("aria-hidden", "true");
    var bar = el("span"); prog.appendChild(bar);
    var progTxt = el("p", "rc-prog-t"); progTxt.setAttribute("role", "status"); progTxt.setAttribute("aria-live", "polite");
    var stepsH = box.querySelector(".rc-col-steps .rc-h");
    if (stepsH) { stepsH.after(prog); prog.after(progTxt); }
    function progress() {
      var done = steps.filter(function (li) { return li.classList.contains("is-done"); }).length;
      bar.style.width = (steps.length ? done / steps.length * 100 : 0) + "%";
      progTxt.textContent = done === steps.length && done ? "All steps done. Enjoy the meal." : done + " of " + steps.length + " steps done";
    }

    // ---------- ingredienti da spuntare ----------
    var ingTxt = el("p", "rc-prog-t");
    var ingH = box.querySelector(".rc-col-ing .rc-h"); if (ingH) ingH.after(ingTxt);
    function ingCount() {
      var got = ings.filter(function (li) { return li.classList.contains("is-done"); }).length;
      ingTxt.textContent = got === ings.length ? "Everything is ready." : got + " of " + ings.length + " ready";
    }
    ings.forEach(function (li, i) {
      var id = "ri-" + bi + "-" + i;
      var cb = el("input", "rc-check"); cb.type = "checkbox"; cb.id = id;
      var label = el("label", "rc-steptext"); label.setAttribute("for", id);
      while (li.firstChild) label.appendChild(li.firstChild);
      li.appendChild(cb); li.appendChild(label);
      cb.addEventListener("change", function () { li.classList.toggle("is-done", cb.checked); ingCount(); });
    });
    ingCount();

    // ---------- passi: spunta e timer ----------
    var timers = [];
    steps.forEach(function (li, i) {
      var id = "rs-" + bi + "-" + i;
      var cb = el("input", "rc-check"); cb.type = "checkbox"; cb.id = id;
      var label = el("label", "rc-steptext"); label.setAttribute("for", id);
      while (li.firstChild) label.appendChild(li.firstChild);
      li.appendChild(cb); li.appendChild(label);
      li._text = label.textContent.replace(/\s*\(\d+ min\)\s*$/, "");
      li._cb = cb;
      cb.addEventListener("change", function () { li.classList.toggle("is-done", cb.checked); progress(); });
      var min = +li.getAttribute("data-min");
      if (!min) return;
      var t = el("button", "rc-btn rc-timer", "Start " + min + " min timer"); t.type = "button";
      var out = el("span", "rc-clock"); out.setAttribute("role", "timer");
      var T = { left: 0, iv: null, min: min, outs: [out], btns: [t] };
      T.paint = function () {
        T.outs.forEach(function (o) { o.textContent = T.iv ? clock(T.left) : (T.left === -1 ? "Time is up" : ""); });
        T.btns.forEach(function (b) { b.textContent = T.iv ? "Stop timer" : "Start " + min + " min timer"; });
      };
      T.toggle = function () {
        if (T.iv) { clearInterval(T.iv); T.iv = null; T.left = 0; T.paint(); return; }
        T.left = min * 60;
        T.iv = setInterval(function () {
          T.left--;
          if (T.left <= 0) {
            clearInterval(T.iv); T.iv = null; T.left = -1;
            T.outs.forEach(function (o) { o.setAttribute("aria-live", "assertive"); });
            if (navigator.vibrate) { try { navigator.vibrate([200, 100, 200]); } catch (e) {} }
          }
          T.paint();
        }, 1000);
        T.paint();
      };
      t.addEventListener("click", T.toggle);
      timers[i] = T;
      li.appendChild(t); li.appendChild(out);
    });
    progress();

    // ---------- modalità cucina: un passo alla volta ----------
    var dlg = null, at = 0, lock = null;
    function wake(on) {
      if (on && navigator.wakeLock && navigator.wakeLock.request) { navigator.wakeLock.request("screen").then(function (l) { lock = l; }).catch(function () {}); }
      if (!on && lock) { try { lock.release(); } catch (e) {} lock = null; }
    }
    function build() {
      dlg = el("div", "rc-cook"); dlg.setAttribute("role", "dialog"); dlg.setAttribute("aria-modal", "true"); dlg.setAttribute("aria-label", title + ": cook step by step"); dlg.hidden = true;
      dlg.innerHTML = '<div class="rc-cook-in"><div class="rc-cook-top"><p class="rc-cook-k"></p><button type="button" class="rc-btn rc-cook-x">Close</button></div><div class="rc-prog" aria-hidden="true"><span></span></div><p class="rc-cook-step" tabindex="-1"></p><div class="rc-cook-timer"></div><label class="rc-cook-done"><input type="checkbox" class="rc-check"> Done with this step</label><div class="rc-cook-nav"><button type="button" class="rc-btn rc-cook-prev">← Previous</button><button type="button" class="btn rc-cook-next">Next step →</button></div><p class="note-small">The screen stays on while this is open, if your browser allows it. Nothing is saved.</p></div>';
      document.body.appendChild(dlg);
      dlg.querySelector(".rc-cook-x").addEventListener("click", close);
      dlg.querySelector(".rc-cook-prev").addEventListener("click", function () { if (at > 0) { at--; show(); } });
      dlg.querySelector(".rc-cook-next").addEventListener("click", function () {
        var li = steps[at]; if (!li._cb.checked) { li._cb.checked = true; li.classList.add("is-done"); progress(); }
        if (at < steps.length - 1) { at++; show(); } else close();
      });
      dlg.querySelector(".rc-cook-done input").addEventListener("change", function (e) { var li = steps[at]; li._cb.checked = e.target.checked; li.classList.toggle("is-done", e.target.checked); progress(); show(); });
      dlg.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { e.preventDefault(); close(); }
        if (e.key === "Tab") { // focus resta nel riquadro
          var f = dlg.querySelectorAll("button, input"); var first = f[0], last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      });
    }
    function show() {
      var li = steps[at];
      dlg.querySelector(".rc-cook-k").textContent = "Step " + (at + 1) + " of " + steps.length;
      dlg.querySelector(".rc-cook-in > .rc-prog span").style.width = ((at + 1) / steps.length * 100) + "%";
      var st = dlg.querySelector(".rc-cook-step"); st.textContent = li._text;
      var tw = dlg.querySelector(".rc-cook-timer"); tw.replaceChildren();
      var T = timers[at];
      if (T) {
        var b = el("button", "btn rc-cook-tbtn"); b.type = "button"; var o = el("span", "rc-cook-clock"); o.setAttribute("role", "timer");
        b.addEventListener("click", T.toggle);
        T.btns = [T.btns[0], b]; T.outs = [T.outs[0], o]; T.paint();
        tw.appendChild(b); tw.appendChild(o);
      }
      dlg.querySelector(".rc-cook-done input").checked = li._cb.checked;
      dlg.querySelector(".rc-cook-prev").disabled = at === 0;
      dlg.querySelector(".rc-cook-next").textContent = at < steps.length - 1 ? "Next step →" : "Finish";
      st.focus();
    }
    var opener = null;
    function open() {
      if (!dlg) build();
      opener = document.activeElement;
      at = steps.findIndex(function (li) { return !li._cb.checked; }); if (at < 0) at = 0;
      dlg.hidden = false; document.documentElement.classList.add("rc-cook-open"); wake(true); show();
    }
    function close() {
      dlg.hidden = true; document.documentElement.classList.remove("rc-cook-open"); wake(false);
      timers.forEach(function (T) { if (T) { T.btns = [T.btns[0]]; T.outs = [T.outs[0]]; } });
      if (opener) opener.focus();
    }
    if (steps.length) cookBtn.addEventListener("click", open); else cookBtn.hidden = true;
  });
})();
