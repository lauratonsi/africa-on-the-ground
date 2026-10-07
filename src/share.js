// Modulo "Add your voice" di schede, storie e pagine dei paesi.
// Importante: questo script NON invia nulla dal sito. Compone un messaggio nel browser e apre l'app di chi scrive
// (WhatsApp, email, Signal, GitHub) con il testo già pronto: è la persona a decidere se mandarlo.
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

  var kind = $("sh-kind"), q = $("sh-q"), fieldsBox = $("sh-fields"), text = $("sh-text"), count = $("sh-count");
  var nameEl = $("sh-name"), rel = $("sh-rel"), lang = $("sh-lang"), consent = $("sh-consent");
  var actions = $("sh-actions"), status = $("sh-status"), nojs = $("share-nojs"), choose = $("sh-target");

  if (nojs) nojs.hidden = true;
  openBtn.hidden = false;
  openBtn.addEventListener("click", function () {
    var open = form.hidden;
    form.hidden = !open;
    openBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) (choose || kind).focus();
  });

  function curKind() { return cfg.kinds.filter(function (x) { return x.id === kind.value; })[0]; }

  // Un campo per ogni domanda specifica del tipo di contributo scelto.
  function drawFields() {
    var k = curKind();
    q.textContent = (k ? k.question : "") + (k && k.id === "fix" ? " The project reads corrections but does not publish them as a voice." : "");
    fieldsBox.replaceChildren();
    ((k && k.fields) || []).forEach(function (f) {
      var label = document.createElement("label");
      label.setAttribute("for", "sh-f-" + f.id);
      label.appendChild(document.createTextNode(f.label + " "));
      var opt = document.createElement("span"); opt.className = "opt"; opt.textContent = "(optional)"; label.appendChild(opt);
      var input;
      if (f.type === "select") {
        input = document.createElement("select");
        var none = document.createElement("option"); none.value = ""; none.textContent = "Choose"; input.appendChild(none);
        f.options.forEach(function (o) { var op = document.createElement("option"); op.value = o.id; op.textContent = o.label; input.appendChild(op); });
      } else {
        input = document.createElement("input"); input.type = "text"; input.maxLength = f.max || 100; input.autocomplete = "off";
      }
      input.id = "sh-f-" + f.id; input.setAttribute("data-field", f.id);
      label.appendChild(input);
      fieldsBox.appendChild(label);
    });
  }
  kind.addEventListener("change", drawFields); drawFields();
  text.addEventListener("input", function () { count.textContent = String(text.value.length); });

  function say(msg, err) { status.textContent = msg; status.className = "share-status" + (err ? " err" : ""); }

  function target() {
    if (!choose) return cfg.target;
    var c = (cfg.choices || []).filter(function (x) { return x.id === choose.value; })[0];
    return { type: cfg.target.type, id: choose.value, name: c ? c.name : choose.value };
  }

  function read() {
    var fields = {};
    Array.prototype.forEach.call(fieldsBox.querySelectorAll("[data-field]"), function (el) {
      var v = el.value.replace(/\s+/g, " ").trim();
      if (v) fields[el.getAttribute("data-field")] = v;
    });
    return {
      kind: kind.value, text: text.value.trim(), fields: fields,
      name: nameEl.value.replace(/\s+/g, " ").trim(), relation: rel.value, lang: lang.value, consent: consent.checked
    };
  }
  // Controlli prima di comporre il messaggio. Rispecchiano quelli di `npm run check`.
  function problem(d) {
    if (d.text.length < 10) return "Write at least a sentence.";
    if (d.text.length > 1200) return "The note is longer than 1,200 characters.";
    var vals = [d.text, d.name].concat(Object.keys(d.fields).map(function (k) { return d.fields[k]; }));
    if (vals.some(function (v) { return EMAIL.test(v) || PHONE.test(v); })) {
      return "Please remove email addresses and phone numbers from the note, the name and the answers. The site never publishes contact details.";
    }
    if (!d.consent) return "Tick the box to say you agree to publication.";
    return "";
  }

  function build(d) {
    var t = target();
    var lines = [
      "Note for " + t.name + " (Africa on the Ground)",
      "",
      "[AOTG-NOTE v1]",
      t.type + ": " + t.id,
      "kind: " + d.kind
    ];
    if (d.name) lines.push("name: " + d.name);
    if (d.relation) lines.push("relation: " + d.relation);
    Object.keys(d.fields).forEach(function (k) { lines.push("field." + k + ": " + d.fields[k]); });
    lines.push("lang: " + d.lang, "consent: yes", "---", d.text, "---",
      "I agree that this note may be published on the site, with the name and connection above. " +
      "I remain the author and may ask for it to be removed. " +
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
    var msg = build(d), t = target();
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
      window.location.href = "mailto:" + c.value + "?subject=" + encodeURIComponent("Note for " + t.name) + "&body=" + encodeURIComponent(msg);
      say("Your email app is opening with your message ready. Press send there to share it.");
    } else if (c.type === "github") {
      window.open("https://github.com/" + c.value + "/issues/new?title=" + encodeURIComponent("Note for " + t.name) + "&body=" + encodeURIComponent(msg), "_blank", "noopener");
      say("GitHub is opening with your message ready. " + cfg.repoNote);
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
  cfg.channels.forEach(function (c) {
    button(c.id, c.type === "email" ? "Send by email" : c.type === "github" ? "Send on GitHub (public)" : "Send with " + c.label, "share-send");
  });
  button("copy", "Copy the message", "share-copy");

  form.addEventListener("submit", function (e) { e.preventDefault(); });
})();
