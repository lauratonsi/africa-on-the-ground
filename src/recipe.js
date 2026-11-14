// Ricette interattive. Senza JavaScript la ricetta resta leggibile con le quantità di base.
// Qui: porzioni che scalano le quantità, passi da spuntare, timer opzionale. Nulla viene salvato né inviato.
(function () {
  function fmt(n) {
    var r = Math.round(n * 100) / 100;
    if (r >= 10) r = Math.round(r * 10) / 10;
    if (r >= 100) r = Math.round(r);
    return String(r);
  }
  document.querySelectorAll(".recipe").forEach(function (box) {
    var base = +box.getAttribute("data-base") || 1, now = base;
    var kicker = box.querySelector(".rc-serv-k"), numEl = box.querySelector(".rc-serv-n");
    var ings = box.querySelectorAll(".rc-ing li"), steps = box.querySelectorAll(".rc-steps li");
    // stepper porzioni
    var ctl = document.createElement("div"); ctl.className = "rc-ctl"; ctl.setAttribute("role", "group"); ctl.setAttribute("aria-label", "Number of servings");
    var minus = document.createElement("button"), plus = document.createElement("button"), reset = document.createElement("button");
    [minus, plus, reset].forEach(function (b) { b.type = "button"; b.className = "rc-btn"; });
    minus.textContent = "−"; plus.textContent = "+"; reset.textContent = "Reset";
    minus.setAttribute("aria-label", "Fewer servings"); plus.setAttribute("aria-label", "More servings");
    ctl.appendChild(minus); ctl.appendChild(plus); ctl.appendChild(reset);
    var live = document.createElement("span"); live.className = "sr-only"; live.setAttribute("role", "status"); live.setAttribute("aria-live", "polite");
    kicker.after(ctl); ctl.after(live);
    function render() {
      numEl.textContent = now;
      ings.forEach(function (li) {
        var a = li.getAttribute("data-amount"); if (a == null) return;
        var u = li.getAttribute("data-unit");
        li.querySelector(".rc-amt").textContent = fmt(+a * now / base) + (u ? " " + u : "");
      });
      minus.disabled = now <= 1; plus.disabled = now >= 24; reset.disabled = now === base;
      live.textContent = "Quantities for " + now + (now === 1 ? " serving" : " servings");
    }
    minus.addEventListener("click", function () { if (now > 1) { now--; render(); } });
    plus.addEventListener("click", function () { if (now < 24) { now++; render(); } });
    reset.addEventListener("click", function () { now = base; render(); });
    render();
    // passi: spunta e timer
    steps.forEach(function (li, i) {
      var id = "rs-" + Math.random().toString(36).slice(2, 7) + i;
      var cb = document.createElement("input"); cb.type = "checkbox"; cb.id = id; cb.className = "rc-check";
      var label = document.createElement("label"); label.setAttribute("for", id); label.className = "rc-steptext";
      while (li.firstChild) label.appendChild(li.firstChild);
      li.appendChild(cb); li.appendChild(label);
      cb.addEventListener("change", function () { li.classList.toggle("is-done", cb.checked); });
      var min = +li.getAttribute("data-min");
      if (min) {
        var t = document.createElement("button"); t.type = "button"; t.className = "rc-btn rc-timer"; t.textContent = "Start " + min + " min timer";
        var out = document.createElement("span"); out.className = "rc-clock"; out.setAttribute("role", "timer");
        var iv = null, left = 0;
        function show() { var m = Math.floor(left / 60), s = left % 60; out.textContent = m + ":" + (s < 10 ? "0" : "") + s; }
        t.addEventListener("click", function () {
          if (iv) { clearInterval(iv); iv = null; t.textContent = "Start " + min + " min timer"; out.textContent = ""; return; }
          left = min * 60; show(); t.textContent = "Stop timer";
          iv = setInterval(function () {
            left--; show();
            if (left <= 0) { clearInterval(iv); iv = null; t.textContent = "Start " + min + " min timer"; out.textContent = "Time is up"; out.setAttribute("aria-live", "assertive"); }
          }, 1000);
        });
        li.appendChild(t); li.appendChild(out);
      }
    });
  });
})();
