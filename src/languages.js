// Esploratore leggero: rende la lista delle lingue una sequenza di scoperte, senza nascondere il contenuto senza JavaScript.
(function () {
  var list = document.querySelector(".lang-list");
  var progress = document.getElementById("lang-progress");
  if (!list) return;
  var choices = Array.prototype.slice.call(list.querySelectorAll("[data-language-choice]"));
  var opened = new Set();
  choices.forEach(function (button) {
    button.addEventListener("click", function () {
      var detail = button.parentNode.querySelector(".lang-detail");
      var open = detail.hidden;
      detail.hidden = !open;
      button.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) opened.add(button.getAttribute("data-language-choice"));
      if (progress) progress.textContent = opened.size + " explored";
    });
  });
})();

(function () {
  var dataEl = document.getElementById("lang-game-data");
  var optionsEl = document.getElementById("lang-options");
  var questionEl = document.getElementById("lang-question");
  var feedbackEl = document.getElementById("lang-feedback");
  var nextButton = document.getElementById("lang-next");
  var scoreEl = document.getElementById("lang-score");
  if (!dataEl || !optionsEl || !questionEl || !feedbackEl || !nextButton || !scoreEl) return;
  var rounds = JSON.parse(dataEl.textContent);
  var roundIndex = 0, score = 0, current = null;
  var shuffle = function (items) { var copy = items.slice(); for (var i = copy.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var swap = copy[i]; copy[i] = copy[j]; copy[j] = swap; } return copy; };
  var allCountries = Array.from(new Set(rounds.reduce(function (all, round) { return all.concat(round.countries); }, [])));
  function updateScore() { scoreEl.textContent = score + " / " + Math.min(rounds.length, 5); }
  function startRound() {
    if (roundIndex >= 5 || !rounds.length) {
      questionEl.textContent = "Round complete.";
      optionsEl.replaceChildren();
      feedbackEl.textContent = "You scored " + score + " out of 5.";
      nextButton.hidden = true;
      return;
    }
    current = rounds[roundIndex % rounds.length];
    var answer = current.countries[Math.floor(Math.random() * current.countries.length)];
    var wrong = shuffle(allCountries.filter(function (country) { return country !== answer; })).slice(0, 2);
    current.answer = answer;
    questionEl.textContent = "Which country mentions " + current.name + "?";
    feedbackEl.textContent = "";
    nextButton.hidden = true;
    optionsEl.replaceChildren();
    shuffle([answer].concat(wrong)).forEach(function (country) {
      var button = document.createElement("button"); button.type = "button"; button.className = "lang-option"; button.textContent = country;
      button.addEventListener("click", function () {
        Array.prototype.forEach.call(optionsEl.children, function (option) { option.disabled = true; if (option.textContent === current.answer) option.classList.add("right"); });
        var explanation = document.createDocumentFragment();
        var message = country === current.answer ? "Correct. The Factbook names " + current.name + " in " + current.answer + "." : "Not quite. The Factbook names " + current.name + " in " + current.answer + ".";
        if (country === current.answer) { score++; button.classList.add("right"); } else button.classList.add("wrong");
        explanation.appendChild(document.createTextNode(message + " "));
        var source = document.createElement("a"); source.className = "lang-source"; source.href = current.source.url; source.target = "_blank"; source.rel = "noopener noreferrer"; source.textContent = "Source: " + current.source.publisher;
        explanation.appendChild(source);
        feedbackEl.replaceChildren(explanation);
        roundIndex++; updateScore(); nextButton.hidden = false; nextButton.focus();
      });
      optionsEl.appendChild(button);
    });
    updateScore();
  }
  nextButton.addEventListener("click", startRound);
  startRound();
})();