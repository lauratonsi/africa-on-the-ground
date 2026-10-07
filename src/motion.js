// Movimento del sito, con Motion (vedi docs/metodo-editoriale.md, sezione Dipendenze).
// Miglioramento progressivo: senza JavaScript, o con "riduci movimento" attivo, la pagina resta ferma e completa.
// Regole: solo transform e opacità; ogni elemento nascosto in attesa di un'animazione ha una rete di sicurezza.
(function () {
  if (!window.Motion) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var M = Motion, animate = M.animate, inView = M.inView, stagger = M.stagger, scroll = M.scroll;
  var OUT = [0.22, 1, 0.36, 1];
  var hidden = [];
  var all = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  // Si nasconde solo ciò che sta sotto la prima schermata: ciò che si vede subito non lampeggia.
  var below = function (el) { return el.getBoundingClientRect().top > window.innerHeight * 0.9; };
  var hide = function (el, prop) { if (!below(el)) return false; el.style[prop || "opacity"] = prop === "transform" ? "scaleX(0)" : "0"; hidden.push(el); return true; };

  // ---------- entrata del titolo (home, pagine interne, schede) ----------
  var heroText = all(".scape-text > *, .phero-text > *");
  if (heroText.length) {
    animate(heroText, { opacity: [0, 1], transform: ["translateY(24px)", "translateY(0px)"] },
      { duration: 0.95, delay: stagger(0.12, { startDelay: 0.1 }), ease: OUT });
  }

  // ---------- paesaggio: strati che scorrono a velocità diverse ----------
  var hero = all(".scape-hero")[0];
  if (hero) {
    var layers = all(".px", hero), text = all(".scape-text", hero)[0];
    scroll(function (p) {
      for (var i = 0; i < layers.length; i++) layers[i].style.transform = "translateY(" + (layers[i].getAttribute("data-px") * p).toFixed(1) + "px)";
      if (text) text.style.transform = "translateY(" + (-44 * p).toFixed(1) + "px)";
    }, { target: hero, offset: ["start start", "end start"] });
  }
  // foto della scheda: scorre un po' più piano della pagina
  var phero = all(".phero")[0], pimg = phero && all(".phero-img img", phero)[0];
  if (pimg) {
    scroll(function (p) { pimg.style.transform = "translateY(" + (70 * p).toFixed(1) + "px) scale(1.14)"; }, { target: phero, offset: ["start start", "end start"] });
  }

  // ---------- schede dei luoghi: entrano una dopo l'altra ----------
  var cards = all(".places > li"), anyBelow = false;
  cards.forEach(function (el) { if (hide(el)) anyBelow = true; });
  if (anyBelow) inView(".places", function (list) {
    animate(all(":scope > li", list), { opacity: [0, 1], transform: ["translateY(26px)", "translateY(0px)"] },
      { duration: 0.75, delay: stagger(0.09), ease: OUT });
  }, { amount: 0.15 });

  // ---------- i due soli: salgono come un'alba ----------
  var suns = all(".suns .sun");
  if (suns.length) {
    suns.forEach(function (el) { hide(el); });
    inView(".suns", function () {
      animate(suns, { opacity: [0, 1], transform: ["translateY(40px) scale(.9)", "translateY(0px) scale(1)"] },
        { duration: 1.1, delay: stagger(0.18), ease: OUT });
    }, { amount: 0.25 });
  }

  // ---------- mappa dell'Africa: i contorni si disegnano, poi compaiono i pin ----------
  var cm = all(".map-continent")[0];
  if (cm) {
    var lands = all(".land", cm);
    lands.forEach(function (pth) { pth.setAttribute("pathLength", "1"); pth.style.strokeDasharray = "1"; pth.style.strokeDashoffset = "1"; pth.style.fillOpacity = "0"; });
    hidden.push.apply(hidden, []);
    inView(cm, function () {
      cm.classList.add("in");
      animate(lands, { strokeDashoffset: [1, 0], fillOpacity: [0, 1] }, { duration: 1.8, delay: stagger(0.018), ease: "easeInOut" });
    }, { amount: 0.25 });
    // rete di sicurezza: se l'animazione non parte, la mappa torna intera
    setTimeout(function () { lands.forEach(function (pth) { if (pth.style.strokeDashoffset === "1") { pth.style.strokeDashoffset = "0"; pth.style.fillOpacity = "1"; } }); cm.classList.add("in"); }, 7000);
  }

  // ---------- titoli di sezione ----------
  all("main section h2").forEach(function (el) {
    if (el.closest(".places") || el.closest(".suns")) return;
    if (!hide(el)) return;
    inView(el, function () { animate(el, { opacity: [0, 1], transform: ["translateY(16px)", "translateY(0px)"] }, { duration: 0.65, ease: OUT }); }, { amount: 0.4 });
  });

  // ---------- pagina Countries: numeri che contano, barre che crescono, mappa che si accende ----------
  all(".kpi").forEach(function (box) {
    var kv = all(".kv", box)[0]; if (!kv) return;
    var m = kv.textContent.match(/^([\d.,]+)(.*)$/); if (!m) return;
    var final = kv.textContent, target = parseFloat(m[1].replace(/,/g, "")), dec = (m[1].split(".")[1] || "").length;
    if (!isFinite(target)) return;
    inView(box, function () {
      animate(0, target, { duration: 1.4, ease: "easeOut", onUpdate: function (v) {
        kv.textContent = v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + m[2];
      }, onComplete: function () { kv.textContent = final; } });
      return function () {};
    }, { amount: 0.6 });
  });
  all(".bars, .paired").forEach(function (box) {
    var fills = all(".bfill", box); if (!fills.length) return;
    fills.forEach(function (f) { f.style.transformOrigin = "left center"; });
    var did = false; fills.forEach(function (f) { if (hide(f, "transform")) did = true; });
    if (did) inView(box, function () {
      animate(fills, { transform: ["scaleX(0)", "scaleX(1)"] }, { duration: 0.95, delay: stagger(0.045), ease: OUT });
    }, { amount: 0.2 });
  });
  var cmap = all(".cmap")[0];
  if (cmap) {
    var land = all(".c", cmap);
    if (below(cmap)) { land.forEach(function (p) { p.style.opacity = "0"; hidden.push(p); }); inView(cmap, function () {
      animate(land, { opacity: [0, 1] }, { duration: 0.6, delay: stagger(0.014), ease: "easeOut" });
    }, { amount: 0.2 }); }
  }
  all(".sc").forEach(function (sc) {
    var dots = all(".dot", sc); if (!dots.length || !below(sc)) return;
    dots.forEach(function (d) { d.style.opacity = "0"; hidden.push(d); });
    inView(sc, function () { animate(dots, { opacity: [0, 1] }, { duration: 0.5, delay: stagger(0.02), ease: "easeOut" }); }, { amount: 0.2 });
  });

  // Rete di sicurezza: se per qualunque motivo un'animazione non parte, dopo 3 secondi tutto torna visibile.
  setTimeout(function () {
    hidden.forEach(function (el) {
      if (getComputedStyle(el).opacity < 0.99 || /scaleX\(0\)/.test(el.style.transform)) { el.style.opacity = ""; el.style.transform = ""; }
    });
  }, 6000);
})();
