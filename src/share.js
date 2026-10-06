// Modulo "Add your voice" delle schede.
// Importante: questo script NON invia nulla dal sito. Compone un messaggio nel browser e apre l'app di chi scrive
// (WhatsApp, email, Signal) con il testo già pronto: è la persona a decidere se mandarlo.
// Il formato del messaggio ("[AOTG-NOTE v1]") è quello che legge `npm run add-note`.
(function () {
  var cfgEl = document.getElementById("share-cfg");
  var form = document.getElementById("share-form");
  var openBtn = document.getElementById("share-open");
  if (!cfgEl || !form || !openBtn) return;

  var cfg = JSON.parse(cfgEl.textContent);
  var $ = function (id) { return document.getElementById(id); };
  var EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
  var PHONE = /(?:\+?\d[\d\s().-]{7,}\d)/;

  var kind = $("sh-kind"), q = $("sh-q"), text = $("sh-text"), count = $("sh-count");
  var nameEl = $("sh-name"), rel = $("sh-rel"), lang = $("sh-lang"), consent = $("sh-consent");
  var actions = $("sh-actions"), status = $("sh-status"), nojs = $("share-nojs");

  if (nojs) nojs.hidden = true;
  openBtn.hidden = false;
  openBtn.addEventListener("click", function () {
    var open = form.hidden;
    form.hidden = !open;
    openBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) text.focus();
  });

  function syncQ() {
    var k = cfg.kinds.filter(function (x) { return x.id === kind.value; })[0];
    q.textContent = k ? k.question : "";
  }
  kind.addEventListener("change", syncQ); syncQ();
  text.addEventListener("input", function () { count.textContent = String(text.value.length); });

  function say(msg, err) { status.textContent = msg; status.className = "share-status" + (err ? " err" : ""); }

  function read() {
    return {
      kind: kind.value, text: text.value.trim(),
      name: nameEl.value.replace(/\s+/g, " ").trim(), relation: rel.value, lang: lang.value, consent: consent.checked
    };
  }
  // Controlli prima di comporre il messaggio. Rispecchiano quelli di `npm run check`.
  function problem(d) {
    if (d.text.length < 10) return "Write at least a sentence.";
    if (d.text.length > 1200) return "The note is longer than 1,200 characters.";
    if (EMAIL.test(d.text) || EMAIL.test(d.name) || PHONE.test(d.text) || PHONE.test(d.name)) {
      return "Please remove email addresses and phone numbers from the note and the name. The site never publishes contact details.";
    }
    if (!d.consent) return "Tick the box to say you agree to publication.";
    return "";
  }

  function build(d) {
    var lines = [
      "Note for " + cfg.placeName + " (Africa on the Ground)",
      "",
      "[AOTG-NOTE v1]",
      "place: " + cfg.place,
      "kind: " + d.kind
    ];
    if (d.name) lines.push("name: " + d.name);
    if (d.relation) lines.push("relation: " + d.relation);
    lines.push("lang: " + d.lang, "consent: yes", "---", d.text, "---",
      "I agree that this note may be published on the site, with the name and connection above. " +
      "I know the repository is public and that the text stays in its history even if it is later removed.");
    return lines.join("\n");
  }

  function copy(msg) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(msg);
    return new Promise(function (resolve, reject) {
      var t = document.createElement("textarea");
      t.value = msg; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select();
      try { document.execCommand("copy") ? resolve() : reject(); } catch (e) { reject(e); } finally { document.body.removeChild(t); }
    });
  }

  function send(ch) {
    var d = read(), p = problem(d);
    if (p) { say(p, true); return; }
    var msg = build(d);
    if (ch === "copy") {
      copy(msg).then(function () { say("Message copied. Paste it into a message to the person who asked you for a note."); },
        function () { say("Could not copy automatically. Select the text in the note and copy it by hand.", true); });
      return;
    }
    var c = cfg.channels.filter(function (x) { return x.id === ch; })[0];
    if (!c) return;
    if (c.type === "whatsapp") {
      window.open("https://wa.me/" + c.value + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
      say("WhatsApp is opening with your message ready. Press send there to share it.");
    } else if (c.type === "email") {
      window.location.href = "mailto:" + c.value + "?subject=" + encodeURIComponent("Note for " + cfg.placeName) + "&body=" + encodeURIComponent(msg);
      say("Your email app is opening with your message ready. Press send there to share it.");
    } else {
      // Signal e simili non accettano un testo già scritto: si copia il messaggio e si apre la conversazione.
      copy(msg).then(function () {
        window.open(c.value, "_blank", "noopener");
        say("Message copied. " + c.label + " is opening: paste the message and send it.");
      }, function () { say("Could not copy the message. Try the Copy button instead.", true); });
    }
  }

  function button(id, label, cls) {
    var b = document.createElement("button");
    b.type = "button"; b.className = cls; b.textContent = label;
    b.addEventListener("click", function () { send(id); });
    actions.appendChild(b);
  }
  cfg.channels.forEach(function (c) { button(c.id, c.type === "email" ? "Send by email" : "Send with " + c.label, "share-send"); });
  button("copy", cfg.channels.length ? "Copy the message" : "Copy the message", "share-copy");
  if (!cfg.channels.length) say("No sending channel is set up yet. You can copy the message and send it to the person who asked you for a note.");

  form.addEventListener("submit", function (e) { e.preventDefault(); });
})();
