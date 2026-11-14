// Connections explorer: visualizza i collegamenti e la modalità Thread Quest.
(function () {
  var dataEl = document.getElementById("graphdata"), ui = document.getElementById("ex-ui");
  if (!dataEl || !ui) return;
  var G; try { G = JSON.parse(dataEl.textContent); } catch (e) { return; }

  var N = {}, adj = {};
  G.nodes.forEach(function (n) { N[n.id] = n; adj[n.id] = []; });
  G.edges.forEach(function (e) {
    if (N[e[0]] && N[e[1]]) {
      if (adj[e[0]].indexOf(e[1]) < 0) adj[e[0]].push(e[1]);
      if (adj[e[1]].indexOf(e[0]) < 0) adj[e[1]].push(e[0]);
    }
  });

  var TYPES = [
    { id: "country", label: "Country", plural: "Countries", color: "var(--viz-1)", icon: '<svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10" cy="10" r="8"/><path d="M2 10h16M10 2a13 13 0 010 16M10 2a13 13 0 000 16"/></svg>' },
    { id: "capital", label: "Capital", plural: "Capitals", color: "var(--viz-2)", icon: '<svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M2 17h16v2H2zM4 9h2v6H4zm5 0h2v6H9zm5 0h2v6h-2zM10 2L2 7v1h16V7z"/></svg>' },
    { id: "place", label: "Place", plural: "Places", color: "var(--viz-3)", icon: '<svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M10 2C6.7 2 4 4.7 4 8c0 4.5 6 10 6 10s6-5.5 6-10c0-3.3-2.7-6-6-6zm0 8.5c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z"/></svg>' },
    { id: "story", label: "Story", plural: "Stories", color: "var(--viz-4)", icon: '<svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M4 3h10a2 2 0 012 2v12a1 1 0 01-1.5.8L10 15.5l-4.5 2.3A1 1 0 014 17V3z"/></svg>' },
    { id: "bloc", label: "Regional bloc", plural: "Regional blocs", color: "var(--viz-5)", icon: '<svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10" cy="5" r="3"/><circle cx="5" cy="14" r="3"/><circle cx="15" cy="14" r="3"/><path d="M8 7l-2 5M12 7l2 5M8 14h4"/></svg>' }
  ];

  var TYPE_MAP = {};
  TYPES.forEach(function (t) { TYPE_MAP[t.id] = t; });

  function h(tag, cls, txt) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (txt != null) el.textContent = txt;
    return el;
  }

  // DOM elements
  var searchInput = document.getElementById("ex-search"),
      searchClear = document.getElementById("ex-search-clear"),
      suggestions = document.getElementById("ex-suggestions"),
      card = document.getElementById("ex-card"),
      lists = document.getElementById("ex-lists"),
      filterTabs = document.getElementById("ex-filter-tabs"),
      filterWrap = document.getElementById("ex-filter-wrap"),
      trailWrap = document.getElementById("ex-trail-wrap"),
      trailNav = document.getElementById("ex-trail"),
      trailReset = document.getElementById("ex-trail-reset"),
      backBtn = document.getElementById("ex-back"),
      randomBtn = document.getElementById("ex-random"),
      modeExplore = document.getElementById("ex-mode-explore"),
      modeQuest = document.getElementById("ex-mode-quest"),
      questHud = document.getElementById("ex-quest-hud"),
      questTargets = document.getElementById("ex-quest-targets"),
      questStatus = document.getElementById("ex-quest-status"),
      questNew = document.getElementById("ex-quest-new"),
      questHint = document.getElementById("ex-quest-hint");

  var cur = null,
      trail = [], // Journey trail: [id, id, ...]
      hist = [],  // Stack for Back button
      activeFilter = null,
      mode = "explore", // "explore" or "quest"
      quest = null;

  var searchable = G.nodes.filter(function (n) { return (adj[n.id] || []).length > 0; })
    .sort(function (a, b) { return a.l.localeCompare(b.l); });

  ui.hidden = false;

  // Shortest path calculation (BFS)
  function bfs(startId, endId) {
    if (startId === endId) return [startId];
    var prev = {}, q = [startId];
    prev[startId] = null;
    while (q.length) {
      var curr = q.shift();
      if (curr === endId) break;
      var neighbors = adj[curr] || [];
      for (var i = 0; i < neighbors.length; i++) {
        var next = neighbors[i];
        if (!(next in prev)) {
          prev[next] = curr;
          q.push(next);
        }
      }
    }
    if (!(endId in prev)) return null;
    var path = [], step = endId;
    while (step) {
      path.unshift(step);
      step = prev[step];
    }
    return path;
  }

  // Search autocomplete
  function showSuggestions() {
    var query = searchInput.value.trim().toLowerCase();
    searchClear.hidden = !query;
    var matches = searchable.filter(function (n) {
      return !query || n.l.toLowerCase().indexOf(query) >= 0;
    }).slice(0, 10);

    suggestions.innerHTML = "";
    if (!matches.length) {
      var empty = h("div", "ex-suggestion-empty", "No matching items found.");
      suggestions.appendChild(empty);
      suggestions.hidden = false;
      searchInput.setAttribute("aria-expanded", "true");
      return;
    }

    matches.forEach(function (n) {
      var btn = h("button", "ex-suggestion");
      btn.type = "button";
      btn.setAttribute("role", "option");
      var tInfo = TYPE_MAP[n.t] || { label: n.t, color: "var(--viz-1)", icon: "" };
      btn.innerHTML =
        '<span class="ex-cat-badge" style="--cat-color:' + tInfo.color + '">' + tInfo.icon + '<span>' + tInfo.label + '</span></span>' +
        '<span class="ex-sug-text"><strong>' + escapeHtml(n.l) + '</strong>' + (n.s ? '<small>' + escapeHtml(n.s) + '</small>' : '') + '</span>';
      btn.addEventListener("click", function () {
        go(n.id);
        hideSuggestions();
      });
      suggestions.appendChild(btn);
    });
    suggestions.hidden = false;
    searchInput.setAttribute("aria-expanded", "true");
  }

  function hideSuggestions() {
    suggestions.hidden = true;
    searchInput.setAttribute("aria-expanded", "false");
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // Navigation
  function go(id, opts) {
    opts = opts || {};
    if (!N[id]) return;

    if (!opts.fromHist && cur) {
      hist.push(cur);
    }
    if (opts.fromTrailIndex != null) {
      trail = trail.slice(0, opts.fromTrailIndex + 1);
    } else if (!opts.fromHist) {
      trail.push(id);
    }

    cur = id;
    backBtn.disabled = !hist.length;
    searchInput.value = N[id].l;
    searchClear.hidden = false;

    renderActiveCard(id);
    renderTrail();
    renderConnections(id);

    if (mode === "quest" && quest && !quest.done) {
      questCheck();
    }
  }

  // Render the Hero Active Card
  function renderActiveCard(id) {
    var n = N[id];
    var nb = (adj[id] || []).map(function (x) { return N[x]; });
    var tInfo = TYPE_MAP[n.t] || { label: n.t, color: "var(--viz-1)", icon: "" };

    card.style.setProperty("--active-color", tInfo.color);
    card.innerHTML = "";

    var topBar = h("div", "ex-card-top");
    topBar.innerHTML =
      '<span class="ex-cat-badge is-prominent" style="--cat-color:' + tInfo.color + '">' +
        tInfo.icon + '<span>' + tInfo.label + '</span>' +
      '</span>' +
      '<span class="ex-card-pill">' + nb.length + (nb.length === 1 ? ' connection' : ' connections') + '</span>';
    card.appendChild(topBar);

    var title = h("h3", "ex-card-title", n.l);
    card.appendChild(title);

    if (n.s) {
      var sub = h("p", "ex-card-sub", n.s);
      card.appendChild(sub);
    }

    var actions = h("div", "ex-card-actions");
    actions.innerHTML =
      '<a class="ex-open-btn" href="' + n.h + '">' +
        '<span>Explore profile</span>' +
        '<svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M5 15L15 5M6 5h9v9"/></svg>' +
      '</a>';
    card.appendChild(actions);
  }

  // Render Thread Breadcrumbs Trail
  function renderTrail() {
    if (trail.length <= 1) {
      trailWrap.hidden = true;
      return;
    }
    trailWrap.hidden = false;
    trailNav.innerHTML = "";

    trail.forEach(function (nodeId, idx) {
      var node = N[nodeId];
      if (!node) return;
      var tInfo = TYPE_MAP[node.t] || { label: node.t, color: "var(--viz-1)" };
      var step = h("button", "ex-trail-step" + (nodeId === cur ? " is-current" : ""));
      step.type = "button";
      step.title = "Step " + (idx + 1) + ": " + node.l;
      step.style.setProperty("--cat-color", tInfo.color);
      step.innerHTML =
        '<span class="ex-trail-dot"></span>' +
        '<span class="ex-trail-name">' + escapeHtml(node.l) + '</span>';
      step.addEventListener("click", function () {
        if (nodeId !== cur) {
          if (mode === "quest" && quest && !quest.done) quest.steps++;
          go(nodeId, { fromTrailIndex: idx });
        }
      });
      trailNav.appendChild(step);

      if (idx < trail.length - 1) {
        var sep = h("span", "ex-trail-sep");
        sep.setAttribute("aria-hidden", "true");
        sep.innerHTML = '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3l5 5-5 5"/></svg>';
        trailNav.appendChild(sep);
      }
    });

    // Scroll to end of trail
    trailNav.scrollLeft = trailNav.scrollWidth;
  }

  // Render Connected Items
  function renderConnections(id) {
    var nb = (adj[id] || []).map(function (x) { return N[x]; });

    // Category count tabs
    var availableTypes = TYPES.filter(function (t) {
      return nb.some(function (m) { return m.t === t.id; });
    });

    filterTabs.innerHTML = "";
    var allBtn = h("button", "ex-filter-tab" + (!activeFilter ? " is-active" : ""));
    allBtn.type = "button";
    allBtn.innerHTML = 'All <span class="ex-filter-count">' + nb.length + '</span>';
    allBtn.addEventListener("click", function () {
      activeFilter = null;
      renderConnections(id);
    });
    filterTabs.appendChild(allBtn);

    availableTypes.forEach(function (t) {
      var count = nb.filter(function (m) { return m.t === t.id; }).length;
      var btn = h("button", "ex-filter-tab" + (activeFilter === t.id ? " is-active" : ""));
      btn.type = "button";
      btn.style.setProperty("--cat-color", t.color);
      btn.innerHTML = t.plural + ' <span class="ex-filter-count">' + count + '</span>';
      btn.addEventListener("click", function () {
        activeFilter = (activeFilter === t.id ? null : t.id);
        renderConnections(id);
      });
      filterTabs.appendChild(btn);
    });

    lists.innerHTML = "";
    var typesToShow = activeFilter ? [TYPE_MAP[activeFilter]] : availableTypes;

    typesToShow.forEach(function (t) {
      if (!t) return;
      var items = nb.filter(function (m) { return m.t === t.id; });
      if (!items.length) return;

      var group = h("section", "ex-group");
      group.style.setProperty("--cat-color", t.color);

      var gHead = h("div", "ex-group-header");
      gHead.innerHTML =
        '<div class="ex-group-title-wrap">' +
          '<span class="ex-cat-badge" style="--cat-color:' + t.color + '">' + t.icon + '<span>' + t.label + '</span></span>' +
          '<h4 class="ex-group-title">' + t.plural + '</h4>' +
        '</div>' +
        '<span class="ex-group-badge">' + items.length + '</span>';
      group.appendChild(gHead);

      var note = h("p", "ex-group-note",
        t.id === "country" ? "The country this content belongs or relates to." :
        t.id === "capital" ? "Capitals closely linked to this editorial record." :
        t.id === "place" ? "Heritage site or cultural place you can jump to next." :
        t.id === "story" ? "In-depth editorial story exploring this context." :
        "Regional organisation uniting this country."
      );
      group.appendChild(note);

      var grid = h("div", "ex-chips-grid");
      items.sort(function (a, b) { return a.l.localeCompare(b.l); }).forEach(function (m) {
        var isQuestTarget = (mode === "quest" && quest && !quest.done && m.id === quest.target);
        var chip = h("button", "ex-chip" + (isQuestTarget ? " is-target-hint" : ""));
        chip.type = "button";
        chip.style.setProperty("--cat-color", t.color);

        var inner =
          '<span class="ex-chip-content">' +
            '<span class="ex-chip-top">' +
              (isQuestTarget ? '<span class="ex-chip-target-flag">🎯 QUEST TARGET</span>' : '') +
              '<span class="ex-chip-name">' + escapeHtml(m.l) + '</span>' +
            '</span>' +
            (m.s ? '<span class="ex-chip-sub">' + escapeHtml(m.s) + '</span>' : '') +
          '</span>' +
          '<svg class="ex-chip-arrow" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 8h8M9 4l4 4-4 4"/></svg>';

        chip.innerHTML = inner;
        chip.addEventListener("click", function () {
          if (mode === "quest" && quest && !quest.done) {
            quest.steps++;
          }
          go(m.id);
        });
        grid.appendChild(chip);
      });

      group.appendChild(grid);
      lists.appendChild(group);
    });
  }

  // Mode switching
  modeExplore.addEventListener("click", function () {
    mode = "explore";
    modeExplore.classList.add("is-active");
    modeExplore.setAttribute("aria-selected", "true");
    modeQuest.classList.remove("is-active");
    modeQuest.setAttribute("aria-selected", "false");
    questHud.hidden = true;
    if (cur) renderConnections(cur);
  });

  modeQuest.addEventListener("click", function () {
    mode = "quest";
    modeQuest.classList.add("is-active");
    modeQuest.setAttribute("aria-selected", "true");
    modeExplore.classList.remove("is-active");
    modeExplore.setAttribute("aria-selected", "false");
    questHud.hidden = false;
    if (!quest || quest.done) {
      newQuest();
    } else {
      renderQuestHud();
      if (cur) renderConnections(cur);
    }
  });

  // Quest Logic
  function newQuest() {
    var pool = G.nodes.filter(function (n) {
      return (n.t === "story" || n.t === "place" || n.t === "country" || n.t === "capital") && (adj[n.id] || []).length > 0;
    });
    var a, b, path, tries = 0;
    do {
      a = pool[Math.floor(Math.random() * pool.length)];
      b = pool[Math.floor(Math.random() * pool.length)];
      path = (a === b) ? null : bfs(a.id, b.id);
      tries++;
    } while ((!path || path.length < 3 || path.length > 5) && tries < 500);

    if (!path) return;

    quest = {
      start: a.id,
      target: b.id,
      best: path.length - 1,
      path: path,
      steps: 0,
      done: false
    };

    hist = [];
    trail = [];
    go(a.id);
    renderQuestHud();
  }

  function renderQuestHud() {
    if (!quest) return;
    var startNode = N[quest.start];
    var targetNode = N[quest.target];
    var startT = TYPE_MAP[startNode.t];
    var targetT = TYPE_MAP[targetNode.t];

    var distPath = bfs(cur, quest.target);
    var dist = distPath ? distPath.length - 1 : "?";

    questTargets.innerHTML =
      '<div class="ex-quest-card">' +
        '<span class="ex-quest-label">Starting point</span>' +
        '<div class="ex-quest-node" style="--cat-color:' + startT.color + '">' +
          startT.icon + ' <strong>' + escapeHtml(startNode.l) + '</strong>' +
        '</div>' +
      '</div>' +
      '<div class="ex-quest-arrow">' +
        '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
      '</div>' +
      '<div class="ex-quest-card is-goal">' +
        '<span class="ex-quest-label">Target destination</span>' +
        '<div class="ex-quest-node" style="--cat-color:' + targetT.color + '">' +
          targetT.icon + ' <strong>' + escapeHtml(targetNode.l) + '</strong>' +
        '</div>' +
      '</div>';

    questStatus.innerHTML =
      '<div class="ex-quest-stats">' +
        '<span>Steps taken: <strong>' + quest.steps + '</strong></span>' +
        '<span class="ex-quest-sep">·</span>' +
        '<span>Shortest route: <strong>' + quest.best + ' steps</strong></span>' +
        '<span class="ex-quest-sep">·</span>' +
        '<span class="ex-quest-dist">Remaining distance: <strong>' + (dist === 0 ? "You arrived!" : dist + " steps away") + '</strong></span>' +
      '</div>';
  }

  function questCheck() {
    renderQuestHud();
    if (cur === quest.target) {
      quest.done = true;
      showQuestVictory();
    }
  }

  function showQuestVictory() {
    var optimalNames = quest.path.map(function (id) {
      var n = N[id];
      var t = TYPE_MAP[n.t];
      return '<span class="ex-path-pill" style="--cat-color:' + t.color + '">' + escapeHtml(n.l) + '</span>';
    }).join(' <span class="ex-path-arr">→</span> ');

    var isPerfect = (quest.steps === quest.best);
    questStatus.innerHTML =
      '<div class="ex-quest-celebrate">' +
        '<h4>' + (isPerfect ? '🌟 Perfect Route!' : '🎉 Target Reached!') + '</h4>' +
        '<p>You arrived at <strong>' + escapeHtml(N[quest.target].l) + '</strong> in <strong>' + quest.steps + '</strong> steps ' +
        (isPerfect ? '(the optimal route!)' : '(shortest possible was ' + quest.best + ' steps).') + '</p>' +
        '<div class="ex-quest-optimal-path"><strong>Shortest editorial trail:</strong><div class="ex-path-flow">' + optimalNames + '</div></div>' +
        '<button type="button" class="ex-quest-next-btn" id="ex-quest-play-again">Play next thread quest →</button>' +
      '</div>';

    var btn = document.getElementById("ex-quest-play-again");
    if (btn) btn.addEventListener("click", newQuest);
  }

  questNew.addEventListener("click", newQuest);
  questHint.addEventListener("click", function () {
    if (!quest) return;
    var optimalNames = quest.path.map(function (id) {
      var n = N[id];
      var t = TYPE_MAP[n.t];
      return '<span class="ex-path-pill" style="--cat-color:' + t.color + '">' + escapeHtml(n.l) + '</span>';
    }).join(' <span class="ex-path-arr">→</span> ');

    questStatus.innerHTML =
      '<div class="ex-quest-hint-box">' +
        '<strong>Optimal route (' + quest.best + ' steps):</strong>' +
        '<div class="ex-path-flow">' + optimalNames + '</div>' +
      '</div>';
  });

  // Controls event listeners
  backBtn.addEventListener("click", function () {
    if (hist.length) {
      if (mode === "quest" && quest && !quest.done) quest.steps++;
      var prevId = hist.pop();
      if (trail.length > 1) trail.pop();
      go(prevId, { fromHist: true });
    }
  });

  randomBtn.addEventListener("click", function () {
    var pool = G.nodes.filter(function (n) { return (adj[n.id] || []).length > 2; });
    var pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) {
      if (mode === "quest") {
        modeExplore.click();
      }
      trail = [];
      hist = [];
      go(pick.id);
    }
  });

  trailReset.addEventListener("click", function () {
    if (cur) {
      trail = [cur];
      renderTrail();
    }
  });

  // Search input events
  searchInput.addEventListener("focus", showSuggestions);
  searchInput.addEventListener("input", showSuggestions);
  searchClear.addEventListener("click", function () {
    searchInput.value = "";
    searchClear.hidden = true;
    searchInput.focus();
    showSuggestions();
  });
  searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Escape") hideSuggestions();
    if (e.key === "Enter") {
      var first = suggestions.querySelector(".ex-suggestion");
      if (first) {
        e.preventDefault();
        first.click();
      }
    }
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".ex-search-wrap")) hideSuggestions();
  });

  // Initial starting point
  var poolInit = G.nodes.filter(function (n) { return (adj[n.id] || []).length > 4; });
  var initial = poolInit.length ? poolInit[Math.floor(Math.random() * poolInit.length)] : G.nodes[0];
  if (initial) go(initial.id);
})();