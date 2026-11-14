/**
 * Africa on the Ground - Client-Side Method RAG & Instant Navigator
 * Runs 100% locally in the browser with zero external calls, zero tracking and zero latency.
 */
(() => {
  const KNOWLEDGE_BASE = [
    {
      id: "syllabus",
      keywords: ["university", "syllabus", "course", "higher education", "teach", "professors", "curriculum", "students", "academic", "degree", "scuola", "università", "corso", "docenti", "insegnamento", "didattica"],
      question: "Is Africa on the Ground suitable for my university or high-school syllabus?",
      answer: "Yes, specifically designed for it. AOTG is engineered for undergraduate and graduate courses in African Studies, Global History, Post-Colonial Studies, International Relations, and Cultural Anthropology. It moves beyond static textbooks with an active-learning framework: primary source analysis, comparative demographic datasets, spatial connection tracing, and formative assessment tools—all operating under a zero-tracking privacy architecture.",
      sectionId: "purpose",
      sectionTitle: "Epistemological framework and pedagogical purpose",
      url: "#sec-purpose",
      tags: ["Higher Education", "Syllabus", "Pedagogy"]
    },
    {
      id: "fair-knowledge",
      keywords: ["fair knowledge", "pay", "compensation", "money", "contributors", "locals", "honoraria", "remuneration", "benefit", "social mission", "compenso", "pagamento", "etica", "solidarietà"],
      question: "How does the Fair Knowledge model compensate local African contributors?",
      answer: "AOTG operates as a Benefit Enterprise that rejects extractive knowledge practices. A dedicated percentage (15–20% of gross margin) of institutional university subscriptions is allocated to our Fair Knowledge Fund. This fund pays fair honoraria to local African researchers, writers, and community fact-checkers who review notes or document local histories. Additionally, every commercial partnership in the Global North funds free, offline-ready educational packages for schools and libraries across African partner nations.",
      sectionId: "sustainability-and-social-mission",
      sectionTitle: "Benefit governance, social mission, and Fair Knowledge",
      url: "#sec-sustainability-and-social-mission",
      tags: ["Benefit Enterprise", "Fair Knowledge", "Impact"]
    },
    {
      id: "privacy",
      keywords: ["privacy", "cookies", "tracking", "gdpr", "analytics", "data", "collect", "telemetry", "surveillance", "dati", "cookie", "tracciamento", "sicurezza"],
      question: "Do you track student activity, set cookies, or collect personal data?",
      answer: "Zero tracking. The platform sets exactly 0 cookies, runs 0 analytics scripts, and loads 0 remote assets from third-party CDNs. It is compiled as a static site that can run completely offline. The contribution interface operates client-side in the user's browser, sending nothing over the network until the user explicitly sends an email or message. It is 100% compliant with GDPR and institutional academic privacy policies.",
      sectionId: "what-this-site-collects",
      sectionTitle: "Digital ethics, data sovereignty, and technical architecture",
      url: "#sec-what-this-site-collects",
      tags: ["Privacy", "Zero Tracking", "GDPR"]
    },
    {
      id: "difference-wiki",
      keywords: ["wikipedia", "textbook", "different", "difference", "comparison", "sources", "how is this different", "perché", "differenza", "manuale"],
      question: "How is Africa on the Ground different from Wikipedia or standard textbooks?",
      answer: "Three key structural differences: 1) Dual-Layer Architecture: Wikipedia merges facts and interpretations into a single compromise text; AOTG strictly separates verified academic/archival citations from subjective local lived experiences. 2) Explicit Historiographical Gaps: AOTG formally declares what is missing or unverified rather than generalizing. 3) Ethical Orality & Compensation: Local contributors are credited, respected as autonomous moral authors, and compensated through our benefit model.",
      sectionId: "the-record",
      sectionTitle: "The historiographical record and source taxonomy",
      url: "#sec-the-record",
      tags: ["Historiography", "Source Criticism", "Dual-Layer"]
    },
    {
      id: "contradiction",
      keywords: ["disagree", "contradict", "dispute", "wrong", "conflict", "clash", "difference", "oral vs written", "contraddizione", "discrepanza", "memoria"],
      question: "What happens when a local voice contradicts the published historical record?",
      answer: "Neither layer overwrites or silences the other. When a local community memory contests published academic historiography, AOTG preserves the dialectical tension. The documented record is modified only if verifiable archival, epigraphic, or primary sources are found; meanwhile, the local voice remains fully visible in the voices layer to document how history is lived and negotiated on the ground.",
      sectionId: "when-a-note-disagrees-with-the-record",
      sectionTitle: "Epistemic boundaries and historiographical disputes",
      url: "#sec-when-a-note-disagrees-with-the-record",
      tags: ["Oral History", "Disputes", "Dialectics"]
    },
    {
      id: "travel-guide",
      keywords: ["travel", "tourism", "hotel", "restaurant", "trip", "visit", "guide", "guida", "turismo", "viaggio", "vacanza", "albergo"],
      question: "Can I use Africa on the Ground as a travel guide?",
      answer: "No. AOTG is explicitly not a tourist or commercial travel guide. It contains no hotel, restaurant, or flight listings, and avoids commercial ratings. Its focus is cultural, historical, artistic, and geographic education. However, conscious travelers seeking in-depth contextual understanding of heritage sites, rock art, foodways, and regional histories will find deeply verified insights absent from mass-market guidebooks.",
      sectionId: "purpose",
      sectionTitle: "Epistemological framework and pedagogical purpose",
      url: "#sec-purpose",
      tags: ["Scope", "Not Tourism", "Cultural Focus"]
    },
    {
      id: "pilot-program",
      keywords: ["pilot", "trial", "60-day", "join", "adopt", "apply", "test", "demo", "free", "university pilot", "pilota", "sperimentazione", "gratuito"],
      question: "How can our university, school, or NGO join the 60-day complimentary pilot?",
      answer: "We offer selected university courses and educational institutions an all-inclusive 60-day trial covering full platform access for up to 150 students, 3 curated curriculum tracks (Beyond the Map, Pre-colonial Polities, Heritage & Living Art), and seminar toolkits. To request an onboarding walkthrough, visit our Education page or contact our curatorial team directly.",
      sectionId: "sustainability-and-social-mission",
      sectionTitle: "Education & Social Mission",
      url: "../education/index.html#pilot",
      tags: ["Pilot Program", "Adoption", "60 Days"]
    },
    {
      id: "curatorship-governance",
      keywords: ["who", "laura tonsi", "curator", "governance", "team", "founder", "bologna", "responsibility", "chi", "curatore", "fondatrice", "responsabile"],
      question: "Who curates Africa on the Ground and takes editorial responsibility?",
      answer: "AOTG was conceived and is curated by Laura Tonsi, a graduate researcher in Governance and Policies for Digital Innovation at the University of Bologna with research focus on cyber-physical risks, information integrity, and counter-disinformation. The project maintains radical methodological transparency: all schemas, code, and source data are publicly versioned on GitHub.",
      sectionId: "who-makes-this",
      sectionTitle: "Curatorship and institutional governance",
      url: "#sec-who-makes-this",
      tags: ["Governance", "Curatorship", "Accountability"]
    },
    {
      id: "sources-verification",
      keywords: ["sources", "verification", "check", "fact-checking", "tier", "primary", "academic", "unesco", "verificare", "fonti", "controllo"],
      question: "How are sources verified and categorized?",
      answer: "Sources follow a strict 5-tier evidentiary hierarchy: Institutional, Academic, Primary, Press, and Encyclopedia. Sources marked 'verified' have been individually read and confirmed against primary documents. Encyclopedia entries (including Wikipedia) are catalogued as 'to-verify' and serve only as preliminary discovery tools. Unverifiable claims are not estimated—they are formally recorded in the 'What is not yet known' (gaps) section.",
      sectionId: "the-record",
      sectionTitle: "The historiographical record and source taxonomy",
      url: "#sec-the-record",
      tags: ["Evidentiary Tiers", "Source Criticism", "Verification"]
    },
    {
      id: "removal-forgetting",
      keywords: ["remove", "deletion", "takedown", "right to be forgotten", "privacy", "erase", "cancellazione", "rimozione", "oblio", "ritiro"],
      question: "Can a contributor request their note to be removed or deleted?",
      answer: "Yes, at any time without conditions. In adherence to moral copyright and the right to be forgotten, any contributor can request the immediate takedown of their submission. Upon request, Git commit history containing the note is also rewritten to expunge the record completely.",
      sectionId: "removing-a-note",
      sectionTitle: "Right of revocation and data erasure",
      url: "#sec-removing-a-note",
      tags: ["Takedown", "Moral Rights", "Data Erasure"]
    }
  ];

  function tokenize(str) {
    return str.toLowerCase().replace(/[^\w\sàèéìòù]/g, " ").split(/\s+/).filter((w) => w.length > 2);
  }

  function scoreItem(item, queryTokens) {
    let score = 0;
    const qTokens = tokenize(item.question);
    const aTokens = tokenize(item.answer);
    const kwTokens = item.keywords.flatMap(tokenize);

    for (const qt of queryTokens) {
      if (item.keywords.some((k) => k.toLowerCase().includes(qt))) score += 15;
      if (kwTokens.includes(qt)) score += 10;
      if (qTokens.includes(qt)) score += 8;
      if (aTokens.includes(qt)) score += 3;
      if (item.tags.some((t) => t.toLowerCase().includes(qt))) score += 6;
    }
    return score;
  }

  function findBestMatches(query) {
    const tokens = tokenize(query);
    if (!tokens.length) return [];

    const scored = KNOWLEDGE_BASE.map((item) => ({
      item,
      score: scoreItem(item, tokens)
    })).filter((x) => x.score > 0);

    scored.sort((a, b) => b.score - a.score);
    return scored.map((x) => x.item);
  }

  function renderResult(item, totalMatches, currentQuery) {
    const out = document.getElementById("rag-result");
    if (!out) return;

    if (!item) {
      out.hidden = false;
      out.innerHTML = `
        <div class="rag-card rag-empty">
          <p class="rag-empty-msg">No exact protocol match found for “<em>${escapeHtml(currentQuery)}</em>”.</p>
          <p class="fine">Try asking about <strong>universities</strong>, <strong>privacy</strong>, <strong>Fair Knowledge</strong>, <strong>Wikipedia</strong>, or <strong>sources</strong>, or click one of the quick queries above.</p>
        </div>
      `;
      return;
    }

    out.hidden = false;
    out.innerHTML = `
      <div class="rag-card" role="region" aria-labelledby="rag-q-h">
        <div class="rag-card-top">
          <span class="rag-tag">${escapeHtml(item.tags.join(" · "))}</span>
          <span class="rag-verified">✓ Verified Epistemic Protocol</span>
        </div>
        <h3 id="rag-q-h" class="rag-card-q">${escapeHtml(item.question)}</h3>
        <p class="rag-card-a">${escapeHtml(item.answer)}</p>
        <div class="rag-card-foot">
          <a class="rag-link" href="${escapeHtml(item.url)}">
            <span>Read complete protocol in <strong>${escapeHtml(item.sectionTitle)}</strong></span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>
      </div>
    `;
    out.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[m]));
  }

  document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("rag-input");
    const clearBtn = document.getElementById("rag-clear");
    const chips = document.querySelectorAll(".rag-chip");
    const resultBox = document.getElementById("rag-result");

    if (!input) return;

    function handleQuery(q) {
      const trimmed = q.trim();
      if (clearBtn) clearBtn.hidden = !trimmed;
      if (!trimmed) {
        if (resultBox) resultBox.hidden = true;
        return;
      }
      const matches = findBestMatches(trimmed);
      renderResult(matches[0] || null, matches.length, trimmed);
    }

    input.addEventListener("input", (e) => {
      handleQuery(e.target.value);
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        input.value = "";
        clearBtn.hidden = true;
        if (resultBox) resultBox.hidden = true;
        input.focus();
      });
    }

    chips.forEach((btn) => {
      btn.addEventListener("click", () => {
        const q = btn.getAttribute("data-q") || btn.textContent.trim();
        input.value = q;
        handleQuery(q);
      });
    });
  });
})();
