/* Hajiya Bilkisu Musa Orphanage Home — site interactions.
   Existing page scripts retained in original order. */

/*
 * PaceFetch Frontend — Production
 * Fetches live predictions from the secure PaceFetch backend.
 */

const API_ENDPOINT = "/api/predictions";

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getConfidenceClass(probability) {
    const value = Number(probability);
    if (value >= 80) return "strong";
    if (value >= 70) return "medium";
    if (value >= 50) return "amber";
    return "red";
}

function normalizePrediction(item) {
    if (!item || typeof item !== "object") return null;

    return {
        id: item.id ?? item.fixtureId ?? item.fixture_id ?? null,
        league: item.league ?? item.leagueName ?? "Unknown League",
        country: item.country ?? item.countryName ?? "",
        home: item.home ?? item.homeTeam ?? item.home_team ?? "Home",
        away: item.away ?? item.awayTeam ?? item.away_team ?? "Away",
        time: item.time ?? item.kickoff ?? item.kickoffTime ?? "",
        market: item.market ?? item.prediction ?? item.betType ?? "Prediction",
        selection: item.selection ?? item.pick ?? item.value ?? "",
        probability: Number(item.probability ?? item.confidence ?? item.percent ?? 0)
    };
}

function createPredictionCard(prediction) {
    const confidenceClass = getConfidenceClass(prediction.probability);

    const leagueText = prediction.country
        ? `${escapeHTML(prediction.country)} · ${escapeHTML(prediction.league)}`
        : escapeHTML(prediction.league);

    return `
        <article class="prediction-card">
            <div class="match-meta">
                <span class="league-name">${leagueText}</span>
                <span>${escapeHTML(prediction.time)}</span>
            </div>

            <div class="teams">
                <div class="team">
                    <span>${escapeHTML(prediction.home)}</span>
                    <span class="team-score">—</span>
                </div>
                <div class="team">
                    <span>${escapeHTML(prediction.away)}</span>
                    <span class="team-score">—</span>
                </div>
            </div>

            <div class="prediction-main">
                <div class="prediction-selection">
                    <div>
                        <div class="market-name">${escapeHTML(prediction.market)}</div>
                        <div class="selection">${escapeHTML(prediction.selection)}</div>
                    </div>
                    <div class="confidence ${confidenceClass}">
                        ${Number.isFinite(prediction.probability) ? `${prediction.probability}%` : "—"}
                    </div>
                </div>
            </div>
        </article>
    `;
}

function renderTodayPredictions(predictions) {
    const container =
        document.getElementById("todayPredictions") ||
        document.getElementById("homeGrid");

    if (!container) return;

    const list = Array.isArray(predictions) ? predictions : [];

    container.innerHTML = list.slice(0, 6).map(createPredictionCard).join("");

    const empty = document.getElementById("homeEmpty");
    if (empty) empty.classList.toggle("hidden", list.length !== 0);

    const counter = document.getElementById("predictionCount");
    if (counter) counter.textContent = list.length;
}

function renderStats(predictions, apiData) {
    const list = Array.isArray(predictions) ? predictions : [];

    const upcoming = document.getElementById("upcomingStat");
    const qualifying = document.getElementById("qualifyingStat");
    const highest = document.getElementById("highestStat");

    if (upcoming) {
        const value = apiData?.summary?.upcomingFixtures;
        upcoming.textContent =
            Number.isFinite(Number(value)) ? Number(value) : list.length;
    }

    if (qualifying) {
        qualifying.textContent =
            list.filter(item => Number(item.probability) >= 50).length;
    }

    if (highest) {
        const highestProbability = list.length
            ? Math.max(...list.map(item => Number(item.probability) || 0))
            : 0;

        highest.textContent =
            highestProbability ? `${highestProbability}%` : "—";
    }
}

function renderHomeDate(apiData) {
    const element = document.getElementById("homeDate");
    if (!element) return;

    if (apiData?.date) {
        element.textContent =
            `Updated for ${apiData.date} · Nigeria time`;
        return;
    }

    element.textContent =
        `Updated ${new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        })}`;
}

function setupPredictionSearch(predictions) {
    const search = document.getElementById("homeSearch");
    const container =
        document.getElementById("homeGrid") ||
        document.getElementById("todayPredictions");

    if (!search || !container) return;

    search.addEventListener("input", () => {
        const query = search.value.trim().toLowerCase();

        const filtered = predictions.filter(prediction => {
            const searchable = [
                prediction.home,
                prediction.away,
                prediction.league,
                prediction.country,
                prediction.market,
                prediction.selection
            ].join(" ").toLowerCase();

            return searchable.includes(query);
        });

        container.innerHTML =
            filtered.slice(0, 6).map(createPredictionCard).join("");

        const empty = document.getElementById("homeEmpty");
        if (empty) empty.classList.toggle("hidden", filtered.length !== 0);
    });
}

/* Fixed mobile dropdown: index.html uses #menuButton and #mobileNav. */
function setupMobileMenu() {
    const button = document.getElementById("menuButton");
    const nav = document.getElementById("mobileNav");

    if (!button || !nav) return;

    function closeMenu() {
        nav.classList.remove("open");
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-label", "Open navigation");
        button.textContent = "☰";
    }

    function toggleMenu() {
        const isOpen = nav.classList.toggle("open");
        button.setAttribute("aria-expanded", String(isOpen));
        button.setAttribute(
            "aria-label",
            isOpen ? "Close navigation" : "Open navigation"
        );
        button.textContent = isOpen ? "✕" : "☰";
    }

    button.addEventListener("click", toggleMenu);

    nav.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", event => {
        if (!nav.contains(event.target) && !button.contains(event.target)) {
            closeMenu();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeMenu();
    });
}

async function fetchPredictions() {
    try {
        const response = await fetch(`${API_ENDPOINT}?t=${Date.now()}`, {
            method: "GET",
            cache: "no-store",
            headers: { Accept: "application/json" }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data?.error ||
                data?.message ||
                `Request failed with HTTP ${response.status}`
            );
        }

        if (data.success === false) {
            throw new Error(
                data.error ||
                data.message ||
                "Prediction service returned an error."
            );
        }

        const rawPredictions =
            Array.isArray(data.predictions) ? data.predictions : [];

        const predictions =
            rawPredictions.map(normalizePrediction).filter(Boolean);

        renderTodayPredictions(predictions);
        renderStats(predictions, data);
        renderHomeDate(data);
        setupPredictionSearch(predictions);

        return predictions;

    } catch (error) {
        console.error("PaceFetch prediction fetch failed:", error);

        const container =
            document.getElementById("homeGrid") ||
            document.getElementById("todayPredictions");

        if (container) {
            container.innerHTML = `
                <div class="state-box error">
                    <div class="state-text">
                        Unable to load today's predictions.
                    </div>
                    <button type="button" class="retry-button" id="retryPredictions">
                        Try Again
                    </button>
                </div>
            `;

            const retry = document.getElementById("retryPredictions");
            if (retry) {
                retry.addEventListener(
                    "click",
                    () => window.location.reload()
                );
            }
        }

        return [];
    }
}

async function initPaceFetch() {
    setupMobileMenu();
    await fetchPredictions();
}

document.addEventListener("DOMContentLoaded", initPaceFetch);

/* --- Next site script --- */
(function () {
  function setupThemeToggle() {
    const button = document.getElementById('themeToggle');
    if (!button) return;
    const symbol = button.querySelector('.theme-symbol') || button;
    let saved = null;
    try { saved = localStorage.getItem('cen-theme'); } catch (e) {}
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    function applyTheme(dark) {
      document.body.classList.toggle('dark', dark);
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
      button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      button.setAttribute('title', dark ? 'Switch to light mode' : 'Switch to dark mode');
      symbol.textContent = dark ? '☀️' : '🌙';
      try { localStorage.setItem('cen-theme', dark ? 'dark' : 'light'); } catch (e) {}
    }
    applyTheme(saved ? saved === 'dark' : prefersDark);
    button.addEventListener('click', function () { applyTheme(!document.body.classList.contains('dark')); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupThemeToggle);
  else setupThemeToggle();
})();

/* --- Next site script --- */
(function(){function setupSiteMenu(){const button=document.getElementById('menuToggle'),menu=document.getElementById('siteMenu'),close=document.getElementById('menuClose'),backdrop=document.getElementById('menuBackdrop');if(!button||!menu)return;function open(){menu.hidden=false;if(backdrop)backdrop.hidden=false;button.setAttribute('aria-expanded','true');button.setAttribute('aria-label','Close menu')}function shut(){menu.hidden=true;if(backdrop)backdrop.hidden=true;button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','Open menu')}button.addEventListener('click',()=>menu.hidden?open():shut());if(close)close.addEventListener('click',shut);if(backdrop)backdrop.addEventListener('click',shut);menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',shut));document.addEventListener('keydown',e=>{if(e.key==='Escape')shut()})}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setupSiteMenu);else setupSiteMenu()})();

/* Expand/collapse label for the full biography. */
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".biography-more").forEach(function (details) {
    var label = details.querySelector(".read-more-label");
    if (!label) return;
    function updateLabel() { label.textContent = details.open ? "Read less" : "Read more"; }
    details.addEventListener("toggle", updateLabel);
    updateLabel();
  });
});
