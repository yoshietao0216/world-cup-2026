const TEAM_TO_KALSHI = {
  "Mexico": "MEX", "South Africa": "RSA", "Korea Republic": "KOR", "Czechia": "CZE",
  "Canada": "CAN", "Bosnia and Herzegovina": "BIH", "United States": "USA", "Paraguay": "PAR",
  "Haiti": "HTI", "Scotland": "SCO", "Brazil": "BRA", "Morocco": "MAR",
  "Australia": "AUS", "Türkiye": "TUR", "Qatar": "QAT", "Switzerland": "SUI",
  "Côte d'Ivoire": "CIV", "Ecuador": "ECU", "Germany": "GER", "Curaçao": "CUW",
  "Netherlands": "NED", "Japan": "JPN", "Sweden": "SWE", "Tunisia": "TUN",
  "Belgium": "BEL", "Egypt": "EGY", "IR Iran": "IRI", "New Zealand": "NZL",
  "Spain": "ESP", "Cabo Verde": "CPV", "Saudi Arabia": "KSA", "Uruguay": "URU",
  "France": "FRA", "Senegal": "SEN", "Iraq": "IRQ", "Norway": "NOR",
  "Argentina": "ARG", "Algeria": "DZA", "Austria": "AUT", "Jordan": "JOR",
  "Portugal": "POR", "Congo DR": "COD", "Uzbekistan": "UZB", "Colombia": "COL",
  "England": "ENG", "Croatia": "CRO", "Ghana": "GHA", "Panama": "PAN",
};

const TEAM_FLAGS = {
  "Mexico": "🇲🇽", "South Africa": "🇿🇦", "Korea Republic": "🇰🇷", "Czechia": "🇨🇿",
  "Canada": "🇨🇦", "Bosnia and Herzegovina": "🇧🇦", "United States": "🇺🇸", "Paraguay": "🇵🇾",
  "Haiti": "🇭🇹", "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Brazil": "🇧🇷", "Morocco": "🇲🇦",
  "Australia": "🇦🇺", "Türkiye": "🇹🇷", "Qatar": "🇶🇦", "Switzerland": "🇨🇭",
  "Côte d'Ivoire": "🇨🇮", "Ecuador": "🇪🇨", "Germany": "🇩🇪", "Curaçao": "🇨🇼",
  "Netherlands": "🇳🇱", "Japan": "🇯🇵", "Sweden": "🇸🇪", "Tunisia": "🇹🇳",
  "Belgium": "🇧🇪", "Egypt": "🇪🇬", "IR Iran": "🇮🇷", "New Zealand": "🇳🇿",
  "Spain": "🇪🇸", "Cabo Verde": "🇨🇻", "Saudi Arabia": "🇸🇦", "Uruguay": "🇺🇾",
  "France": "🇫🇷", "Senegal": "🇸🇳", "Iraq": "🇮🇶", "Norway": "🇳🇴",
  "Argentina": "🇦🇷", "Algeria": "🇩🇿", "Austria": "🇦🇹", "Jordan": "🇯🇴",
  "Portugal": "🇵🇹", "Congo DR": "🇨🇩", "Uzbekistan": "🇺🇿", "Colombia": "🇨🇴",
  "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Croatia": "🇭🇷", "Ghana": "🇬🇭", "Panama": "🇵🇦",
};

const GROUP_TEAMS = {
  A: ["Mexico", "South Africa", "Korea Republic", "Czechia"],
  B: ["Canada", "Bosnia and Herzegovina", "Qatar", "Switzerland"],
  C: ["Haiti", "Scotland", "Brazil", "Morocco"],
  D: ["United States", "Paraguay", "Australia", "Türkiye"],
  E: ["Côte d'Ivoire", "Ecuador", "Germany", "Curaçao"],
  F: ["Netherlands", "Japan", "Sweden", "Tunisia"],
  G: ["Belgium", "Egypt", "IR Iran", "New Zealand"],
  H: ["Spain", "Cabo Verde", "Saudi Arabia", "Uruguay"],
  I: ["France", "Senegal", "Iraq", "Norway"],
  J: ["Argentina", "Algeria", "Austria", "Jordan"],
  K: ["Portugal", "Congo DR", "Uzbekistan", "Colombia"],
  L: ["England", "Croatia", "Ghana", "Panama"],
};

const KNOCKOUT_STAGES = [
  { key: "round-of-32", label: "Round of 32", count: 16 },
  { key: "round-of-16", label: "Round of 16", count: 8 },
  { key: "quarter-finals", label: "Quarter-Finals", count: 4 },
  { key: "semi-finals", label: "Semi-Finals", count: 2 },
  { key: "third-place", label: "3rd Place", count: 1 },
  { key: "final", label: "Final", count: 1 },
];

let fifaRankings = {};
let advanceSortByGroup = false;

let fixturesData = [];
let groupWinMarkets = {};
let groupQualMarkets = {};
let gameMarkets = {};
let winnerMarkets = [];
let espnEvents = {};
let espnStandings = [];
let teamCards = {};
let pollInterval = null;
const matchDataLookup = {};

function escapeAttr(s) {
  return s.replace(/&/g, "&amp;").replace(/'/g, "&#39;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function flag(team) { return TEAM_FLAGS[team] || "🏳️"; }
function kalshiCode(team) { return TEAM_TO_KALSHI[team] || team.substring(0, 3).toUpperCase(); }
function ordinal(n) { const s = ["th","st","nd","rd"]; return n + (s[(n%100-20)%10] || s[n%100] || s[0]); }

const FIFA_NAME_MAP = {
  "United States": "USA", "Côte d'Ivoire": "Côte d'Ivoire", "Curaçao": "Curaçao",
  "Türkiye": "Türkiye", "Cabo Verde": "Cabo Verde",
};

function fifaRank(team) {
  const mapped = FIFA_NAME_MAP[team];
  if (mapped && fifaRankings[mapped]) return fifaRankings[mapped].rank;
  const entry = fifaRankings[team];
  if (entry) return entry.rank;
  const norm = team.toLowerCase().replace(/[^a-z]/g, "");
  for (const [k, v] of Object.entries(fifaRankings)) {
    const kn = k.toLowerCase().replace(/[^a-z]/g, "");
    if (norm.length >= 5 && kn.length >= 5 && (kn.includes(norm) || norm.includes(kn))) return v.rank;
    if (kn === norm) return v.rank;
  }
  return null;
}

async function loadFifaRankings() {
  try {
    fifaRankings = await fetchJSON("/api/fifa/rankings");
  } catch (e) {
    console.error("Failed to load FIFA rankings:", e);
  }
}

function getCards(team) {
  if (teamCards[team]) return teamCards[team];
  const norm = team.toLowerCase().replace(/[^a-z]/g, "");
  for (const [k, v] of Object.entries(teamCards)) {
    const kn = k.toLowerCase().replace(/[^a-z]/g, "");
    if (norm.length >= 5 && kn.length >= 5 && (kn.includes(norm) || norm.includes(kn))) return v;
    if (kn === norm) return v;
  }
  return null;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function priceClass(val) {
  const n = parseFloat(val);
  if (n >= 0.50) return "high";
  if (n >= 0.15) return "medium";
  return "low";
}

function formatPrice(dollars) {
  const n = parseFloat(dollars);
  if (isNaN(n)) return "—";
  return `${Math.round(n * 100)}¢`;
}

function formatPct(dollars) {
  const n = parseFloat(dollars);
  if (isNaN(n)) return "—";
  return `${Math.round(n * 100)}%`;
}

async function fetchJSON(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

async function fetchAllKalshiPages(baseUrl) {
  let all = [];
  let cursor = "";
  for (let i = 0; i < 10; i++) {
    const sep = baseUrl.includes("?") ? "&" : "?";
    const url = cursor ? `${baseUrl}${sep}cursor=${encodeURIComponent(cursor)}` : baseUrl;
    const data = await fetchJSON(url);
    all = all.concat(data.markets || []);
    cursor = data.cursor;
    if (!cursor) break;
  }
  return all;
}

async function loadFixtures() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch("https://www.thestatsapi.com/world-cup/data/fixtures.json", { signal: controller.signal });
    clearTimeout(timeout);
    const data = await resp.json();
    fixturesData = data.fixtures || [];
  } catch {
    fixturesData = generateFallbackFixtures();
  }
}

function generateFallbackFixtures() {
  const fixtures = [];
  let matchNum = 1;
  const startDate = new Date("2026-06-11");

  for (const [group, teams] of Object.entries(GROUP_TEAMS)) {
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + matchNum % 17);
        fixtures.push({
          matchNumber: matchNum++,
          date: d.toISOString().split("T")[0],
          kickoffUtc: d.toISOString(),
          stage: "group-stage",
          group,
          homeTeam: teams[i],
          awayTeam: teams[j],
          stadium: "TBD",
          hostCity: "tbd",
        });
      }
    }
  }

  KNOCKOUT_STAGES.forEach(stage => {
    for (let i = 0; i < stage.count; i++) {
      fixtures.push({
        matchNumber: matchNum++,
        date: "2026-07-01",
        kickoffUtc: "2026-07-01T00:00:00Z",
        stage: stage.key,
        group: null,
        homeTeam: `Winner Match ${matchNum - 20 + i}`,
        awayTeam: `Winner Match ${matchNum - 19 + i}`,
        stadium: "TBD",
        hostCity: "tbd",
      });
    }
  });

  return fixtures;
}

async function loadGroupWinMarkets() {
  try {
    const markets = await fetchAllKalshiPages("/api/kalshi/markets?series_ticker=KXWCGROUPWIN&limit=200");
    markets.forEach(m => { groupWinMarkets[m.ticker] = m; });
  } catch (e) {
    console.error("Failed to load group win markets:", e);
  }
}

async function loadGroupQualMarkets() {
  try {
    const markets = await fetchAllKalshiPages("/api/kalshi/markets?series_ticker=KXWCGROUPQUAL&limit=200");
    markets.forEach(m => { groupQualMarkets[m.ticker] = m; });
  } catch (e) {
    console.error("Failed to load group qualification markets:", e);
  }
}

async function loadEspnScoreboard() {
  try {
    const data = await fetchJSON("/api/espn/scoreboard?dates=20260611-20260720");
    for (const ev of data.events || []) {
      const comp = ev.competitions[0];
      const teams = comp.competitors;
      const home = teams.find(t => t.homeAway === "home");
      const away = teams.find(t => t.homeAway === "away");
      if (!home || !away) continue;
      const key = `${home.team.displayName}_${away.team.displayName}`.toLowerCase().replace(/\s+/g, "");
      espnEvents[key] = {
        id: ev.id,
        homeScore: home.score,
        awayScore: away.score,
        homeName: home.team.displayName,
        awayName: away.team.displayName,
        status: comp.status.type.name,
        statusDetail: comp.status.type.detail || comp.status.type.shortDetail || "",
        clock: comp.status.displayClock || "",
        period: comp.status.period || 0,
      };
      espnEvents[ev.id] = espnEvents[key];
    }
  } catch (e) {
    console.error("Failed to load ESPN scoreboard:", e);
  }
}

const TEAM_ALIASES = {
  "korea republic": "korea", "south korea": "korea",
  "ir iran": "iran",
  "congo dr": "drcongo", "dr congo": "drcongo",
  "cabo verde": "capeverde", "cape verde": "capeverde",
  "cote divoire": "ivorycoast", "ctedivoire": "ivorycoast",
  "ivory coast": "ivorycoast",
  "turkiye": "turkey", "trkiye": "turkey",
  "bosnia and herzegovina": "bosnia", "bosnia  herzegovina": "bosnia",
  "united states": "usa",
  "curacao": "curacao", "curaao": "curacao",
};

function teamNorm(s) {
  let n = s.toLowerCase().replace(/[^a-z ]/g, "").trim();
  if (TEAM_ALIASES[n]) return TEAM_ALIASES[n];
  n = n.replace(/\s+/g, "");
  if (TEAM_ALIASES[n]) return TEAM_ALIASES[n];
  return n;
}

function teamsMatch(a, b) {
  const na = teamNorm(a);
  const nb = teamNorm(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

function findEspnEvent(home, away) {
  for (const [, ev] of Object.entries(espnEvents)) {
    if (!ev.homeName) continue;
    if ((teamsMatch(ev.homeName, home) && teamsMatch(ev.awayName, away)) ||
        (teamsMatch(ev.homeName, away) && teamsMatch(ev.awayName, home))) return ev;
  }
  return null;
}

async function loadTeamCards() {
  try {
    teamCards = await fetchJSON("/api/espn/cards");
  } catch (e) {
    console.error("Failed to load card data:", e);
  }
}

async function loadEspnStandings() {
  try {
    const data = await fetchJSON("/api/espn/standings");
    espnStandings = [];
    for (const group of data.children || []) {
      const groupName = group.name || "";
      const groupLetter = groupName.replace("Group ", "");
      const entries = (group.standings?.entries || []).map(entry => {
        const stats = {};
        for (const s of entry.stats || []) stats[s.name] = s.value ?? s.displayValue ?? 0;
        return {
          team: entry.team.displayName,
          teamLogo: entry.team.logos?.[0]?.href || "",
          group: groupLetter,
          groupName,
          rank: stats.rank || 0,
          points: stats.points || 0,
          gamesPlayed: stats.gamesPlayed || 0,
          wins: stats.wins || 0,
          draws: stats.ties || 0,
          losses: stats.losses || 0,
          goalsFor: stats.pointsFor || 0,
          goalsAgainst: stats.pointsAgainst || 0,
          goalDiff: stats.pointDifferential || 0,
          advanced: stats.advanced || 0,
        };
      });
      entries.sort((a, b) => a.rank - b.rank);
      espnStandings.push({ group: groupLetter, groupName, entries });
    }
  } catch (e) {
    console.error("Failed to load ESPN standings:", e);
  }
}

async function loadGameMarkets() {
  try {
    const markets = await fetchAllKalshiPages("/api/kalshi/markets?series_ticker=KXWCGAME&limit=200");
    markets.forEach(m => { gameMarkets[m.ticker] = m; });
  } catch (e) {
    console.error("Failed to load game markets:", e);
  }
}

async function loadWinnerMarkets() {
  try {
    const markets = await fetchAllKalshiPages("/api/kalshi/markets?series_ticker=KXMENWORLDCUP&limit=200");
    winnerMarkets = markets.sort((a, b) => parseFloat(b.last_price_dollars) - parseFloat(a.last_price_dollars));
  } catch (e) {
    console.error("Failed to load winner markets:", e);
  }
}

function buildEventTicker(fixture) {
  if (!fixture) return null;
  const home = kalshiCode(fixture.homeTeam || fixture.home);
  const away = kalshiCode(fixture.awayTeam || fixture.away);
  if (!home || !away) return null;

  const dateStr = fixture.date;
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  const monthNames = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const month = monthNames[parseInt(parts[1], 10) - 1];
  const day = parts[2];
  return `KXWCGAME-26${month}${day}${home}${away}`;
}

function findGameMarketsForFixture(fixture) {
  const home = kalshiCode(fixture.homeTeam || fixture.home);
  const away = kalshiCode(fixture.awayTeam || fixture.away);

  const eventTicker = buildEventTicker(fixture);
  if (eventTicker) {
    const byEvent = Object.values(gameMarkets).filter(m => m.event_ticker === eventTicker);
    if (byEvent.length > 0) return byEvent;
    const reversed = eventTicker.replace(`${home}${away}`, `${away}${home}`);
    const byReversed = Object.values(gameMarkets).filter(m => m.event_ticker === reversed);
    if (byReversed.length > 0) return byReversed;
  }

  const results = [];
  for (const [, m] of Object.entries(gameMarkets)) {
    if (m.event_ticker && m.event_ticker.includes(home) && m.event_ticker.includes(away)) {
      results.push(m);
    }
  }
  return results;
}

function renderGroupStage() {
  const container = document.getElementById("groups-view");
  const groupFixtures = fixturesData.filter(f => f.stage === "group-stage");

  let html = '<div class="groups-grid">';
  for (const [group, teams] of Object.entries(GROUP_TEAMS)) {
    const gFixtures = groupFixtures.filter(f => f.group === group);
    const groupEvent = `KXWCGROUPWIN-26${group}`;
    const qualEvent = `KXWCGROUPQUAL-26${group}`;
    const groupMarketsList = Object.values(groupWinMarkets).filter(m => m.event_ticker === groupEvent);
    const qualMarketsList = Object.values(groupQualMarkets).filter(m => m.event_ticker === qualEvent);
    const settled = groupMarketsList.some(m => m.status === "finalized" && m.result === "yes");

    html += `<div class="group-card">`;
    html += `<div class="group-header"><span>Group ${group}</span>`;
    if (settled) html += `<span class="settled-badge">SETTLED</span>`;
    html += `</div>`;

    html += `<div class="group-standings"><table><tr><th>Team</th><th>Advance</th><th>Win Group</th></tr>`;
    const sortedTeams = [...teams].sort((a, b) => {
      const aq = qualMarketsList.find(m => m.yes_sub_title === a || m.subtitle === a);
      const bq = qualMarketsList.find(m => m.yes_sub_title === b || m.subtitle === b);
      const ap = aq ? parseFloat(aq.last_price_dollars) : 0;
      const bp = bq ? parseFloat(bq.last_price_dollars) : 0;
      return bp - ap;
    });

    for (const team of sortedTeams) {
      const market = groupMarketsList.find(m => m.yes_sub_title === team || m.subtitle === team);
      const qualMarket = qualMarketsList.find(m => m.yes_sub_title === team || m.subtitle === team);
      const price = market ? market.last_price_dollars : null;
      const qualPrice = qualMarket ? qualMarket.last_price_dollars : null;
      const isWinner = market && market.result === "yes";
      const isQualified = qualMarket && qualMarket.result === "yes";
      const isEliminated = qualMarket && qualMarket.result === "no";
      html += `<tr${isQualified ? ' style="background:rgba(34,197,94,0.08)"' : isEliminated ? ' style="opacity:0.5"' : ""}>`;
      html += `<td class="team-name"><span class="flag">${flag(team)}</span>${team}</td>`;

      html += `<td>`;
      if (isQualified) {
        html += `<span class="kalshi-price high">QUAL</span>`;
      } else if (isEliminated) {
        html += `<span class="kalshi-price low">OUT</span>`;
      } else if (qualPrice) {
        html += `<span class="kalshi-price ${priceClass(qualPrice)}">${formatPct(qualPrice)}</span>`;
      } else {
        html += `<span class="kalshi-price low">—</span>`;
      }
      html += `</td>`;

      html += `<td>`;
      if (isWinner) {
        html += `<span class="kalshi-price high">WON</span>`;
      } else if (market && market.result === "no") {
        html += `<span class="kalshi-price low">—</span>`;
      } else if (price) {
        html += `<span class="kalshi-price ${priceClass(price)}">${formatPct(price)}</span>`;
      } else {
        html += `<span class="kalshi-price low">—</span>`;
      }
      html += `</td></tr>`;
    }
    html += `</table></div>`;

    html += `<div class="group-matches"><div class="group-matches-title">Matches</div>`;
    for (const f of gFixtures) {
      const markets = findGameMarketsForFixture(f);
      const isSettled = markets.some(m => m.status === "finalized");
      const isActive = markets.some(m => m.status === "active");
      let statusLabel = "Upcoming";
      let statusClass = "upcoming";
      if (isSettled) { statusLabel = "Final"; statusClass = "finished"; }
      else if (isActive) { statusLabel = "Open"; statusClass = "upcoming"; }

      const mData = { matchNumber: f.matchNumber, home: f.homeTeam, away: f.awayTeam, date: f.date, kickoff: f.kickoffUtc, stadium: f.stadium, group: f.group, stage: f.stage };
      matchDataLookup[f.matchNumber] = mData;
      html += `<div class="match-row" data-match-id="${f.matchNumber}">`;
      html += `<span class="match-date">${formatDate(f.kickoffUtc)}</span>`;
      html += `<span class="match-teams"><span>${flag(f.homeTeam)} ${f.homeTeam}</span><span class="vs">vs</span><span>${f.awayTeam} ${flag(f.awayTeam)}</span></span>`;
      html += `<span class="match-status ${statusClass}">${statusLabel}</span>`;
      html += `</div>`;
    }
    html += `</div></div>`;
  }
  html += `</div>`;
  html += `<div class="refresh-info">Prices refresh every 30 seconds &bull; Click any match for live Kalshi market prices</div>`;
  container.innerHTML = html;

  container.querySelectorAll(".match-row").forEach(row => {
    row.addEventListener("click", () => {
      const data = matchDataLookup[row.dataset.matchId];
      if (data) openMatchModal(data);
    });
  });
}

function renderKnockout() {
  const container = document.getElementById("knockout-view");
  const koFixtures = fixturesData.filter(f => f.stage !== "group-stage");

  let html = '<div class="knockout-container"><div class="knockout-rounds">';
  for (const stage of KNOCKOUT_STAGES) {
    const stageFixtures = koFixtures.filter(f => f.stage === stage.key);
    html += `<div class="knockout-round">`;
    html += `<div class="round-title">${stage.label}</div>`;

    if (stageFixtures.length === 0) {
      html += `<div style="text-align:center;color:var(--text-dim);font-size:13px;padding:20px;">TBD</div>`;
    }

    for (const f of stageFixtures) {
      const isPlaceholder = f.homeTeam.startsWith("Winner") || f.homeTeam.startsWith("Loser") || f.homeTeam.startsWith("1") || f.homeTeam.startsWith("2") || f.homeTeam.startsWith("Runner");
      const homeFlag = isPlaceholder ? "🏳️" : flag(f.homeTeam);
      const awayIsPlaceholder = f.awayTeam.startsWith("Winner") || f.awayTeam.startsWith("Loser") || f.awayTeam.startsWith("1") || f.awayTeam.startsWith("2") || f.awayTeam.startsWith("Runner");
      const awayFlag = awayIsPlaceholder ? "🏳️" : flag(f.awayTeam);

      const homeLabel = f.homeTeam.length > 18 ? f.homeTeam.substring(0, 16) + "…" : f.homeTeam;
      const awayLabel = f.awayTeam.length > 18 ? f.awayTeam.substring(0, 16) + "…" : f.awayTeam;

      const mData = { matchNumber: f.matchNumber, home: f.homeTeam, away: f.awayTeam, date: f.date, kickoff: f.kickoffUtc, stadium: f.stadium, stage: f.stage };
      matchDataLookup[f.matchNumber] = mData;
      html += `<div class="knockout-match" data-match-id="${f.matchNumber}">`;
      html += `<div class="ko-team"><span class="team-label">${homeFlag} ${homeLabel}</span></div>`;
      html += `<div class="ko-team"><span class="team-label">${awayFlag} ${awayLabel}</span></div>`;
      html += `</div>`;
    }
    html += `</div>`;
  }
  html += `</div></div>`;
  html += `<div class="refresh-info">Click any match for live Kalshi market prices</div>`;
  container.innerHTML = html;

  container.querySelectorAll(".knockout-match").forEach(el => {
    el.addEventListener("click", () => {
      const data = matchDataLookup[el.dataset.matchId];
      if (data) openMatchModal(data);
    });
  });
}

function renderWinner() {
  const container = document.getElementById("winner-view");

  if (winnerMarkets.length === 0) {
    container.innerHTML = `<div class="loading-spinner">Loading tournament winner markets</div>`;
    return;
  }

  let html = '<h2 style="text-align:center;margin-bottom:20px;font-size:20px;">Tournament Winner Odds</h2>';
  html += '<div class="winner-grid">';
  for (const m of winnerMarkets) {
    const team = m.yes_sub_title || m.subtitle || m.ticker.split("-").pop();
    const price = parseFloat(m.last_price_dollars);
    let cls = "bottom";
    if (price >= 0.10) cls = "top";
    else if (price >= 0.03) cls = "mid";

    const isWinner = m.result === "yes";
    html += `<div class="winner-card"${isWinner ? ' style="border-color:var(--green)"' : ""}>`;
    html += `<div class="team-info"><div class="name">${flag(team) || ""} ${team}</div>`;
    html += `<div class="odds">Vol: $${Number(m.volume_fp).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div></div>`;
    if (isWinner) {
      html += `<div class="price-tag top">WINNER</div>`;
    } else if (m.result === "no") {
      html += `<div class="price-tag bottom">OUT</div>`;
    } else {
      html += `<div class="price-tag ${cls}">${formatPct(m.last_price_dollars)}</div>`;
    }
    html += `</div>`;
  }
  html += `</div>`;
  html += `<div class="refresh-info">Prices refresh every 30 seconds</div>`;
  container.innerHTML = html;
}

function renderThirdPlace() {
  const container = document.getElementById("thirdplace-view");

  if (espnStandings.length === 0) {
    container.innerHTML = `<div class="loading-spinner">Loading standings data</div>`;
    return;
  }

  const allTeams = [];
  const groupFixtures = fixturesData.filter(f => f.stage === "group-stage");

  for (const g of espnStandings) {
    const qualEvent = `KXWCGROUPQUAL-26${g.group}`;
    const qualMarkets = Object.values(groupQualMarkets).filter(m => m.event_ticker === qualEvent);

    for (const entry of g.entries) {
      const findMarket = (markets) => markets.find(m => {
        const sub = m.yes_sub_title || m.subtitle || "";
        return teamsMatch(sub, entry.team);
      });

      const qualMarket = findMarket(qualMarkets);
      const advanceProb = qualMarket ? parseFloat(qualMarket.last_price_dollars) : null;
      const isQualified = qualMarket && qualMarket.result === "yes";
      const isEliminated = qualMarket && qualMarket.result === "no";

      const remaining = groupFixtures.filter(f => {
        const espn = findEspnEvent(f.homeTeam, f.awayTeam);
        const isPlayed = espn && (espn.status === "STATUS_FULL_TIME" || espn.status === "STATUS_FINAL");
        return !isPlayed && f.group === g.group &&
          (teamsMatch(f.homeTeam, entry.team) || teamsMatch(f.awayTeam, entry.team));
      });

      const cards = getCards(entry.team);
      const totalCards = cards ? (cards.yellow + cards.red * 3) : 0;
      const rank = fifaRank(entry.team);

      allTeams.push({
        ...entry,
        advanceProb,
        isQualified,
        isEliminated,
        remainingMatches: remaining,
        cardData: cards,
        totalCards,
        fifaRank: rank,
      });
    }
  }

  const tiebreak = (a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    if (a.totalCards !== b.totalCards) return a.totalCards - b.totalCards;
    const aFifa = a.fifaRank || 999;
    const bFifa = b.fifaRank || 999;
    return aFifa - bFifa;
  };

  if (advanceSortByGroup) {
    allTeams.sort((a, b) => {
      if (a.group !== b.group) return a.group.localeCompare(b.group);
      return tiebreak(a, b);
    });
  } else {
    allTeams.sort(tiebreak);
  }

  const qualified = allTeams.filter(t => t.isQualified).length;
  const eliminated = allTeams.filter(t => t.isEliminated).length;

  let html = `<h2 style="text-align:center;margin-bottom:8px;font-size:20px;">Advance Possibility</h2>`;
  html += `<p style="text-align:center;color:var(--text-dim);font-size:13px;margin-bottom:16px;">All 48 teams sorted by tiebreaker order: Points &rarr; Goal Difference &rarr; Goals For &rarr; Fair Play (Cards) &rarr; FIFA Ranking</p>`;
  html += `<div style="text-align:center;margin-bottom:20px;">
    <button id="sort-group-toggle" class="sort-toggle-btn ${advanceSortByGroup ? "active" : ""}">
      ${advanceSortByGroup ? "✓ " : ""}Group by Group
    </button>
    <span style="font-size:13px;color:var(--text-dim);margin-left:12px;">${qualified} qualified &bull; ${eliminated} eliminated &bull; ${48 - qualified - eliminated} in contention</span>
  </div>`;

  html += `<div class="third-place-table"><table>`;
  html += `<thead><tr>
    <th>#</th><th>Team</th><th>Group</th><th>Pos</th>
    <th>Pts</th><th>GD</th><th>GF</th><th>Cards</th><th>FIFA</th>
    <th>Advance %</th><th>Remaining</th>
  </tr></thead><tbody>`;

  let lastGroup = "";
  allTeams.forEach((t, i) => {
    if (advanceSortByGroup && t.group !== lastGroup) {
      if (lastGroup) html += `<tr class="group-divider"><td colspan="11"></td></tr>`;
      lastGroup = t.group;
    }
    const rowClass = t.isQualified ? "row-qualified" : t.isEliminated ? "row-eliminated" : "";
    html += `<tr class="${rowClass}">`;
    html += `<td class="rank-col">${i + 1}</td>`;
    html += `<td class="team-name"><span class="flag">${flag(t.team)}</span>${t.team}</td>`;
    html += `<td class="group-col">Grp ${t.group}</td>`;
    html += `<td><span class="current-rank rank-${t.rank}">${ordinal(t.rank)}</span></td>`;
    html += `<td class="pts-col">${t.points}</td>`;
    html += `<td class="${t.goalDiff > 0 ? "gd-pos" : t.goalDiff < 0 ? "gd-neg" : ""}">${t.goalDiff > 0 ? "+" : ""}${t.goalDiff}</td>`;
    html += `<td>${t.goalsFor}</td>`;
    html += `<td class="cards-col">${t.cardData ? `<span class="yc">${t.cardData.yellow}</span>${t.cardData.red ? ` <span class="rc">${t.cardData.red}</span>` : ""}` : "—"}</td>`;
    html += `<td class="fifa-col">${t.fifaRank || "—"}</td>`;

    html += `<td>`;
    if (t.isQualified) {
      html += `<span class="kalshi-price high">QUAL</span>`;
    } else if (t.isEliminated) {
      html += `<span class="kalshi-price low">OUT</span>`;
    } else if (t.advanceProb !== null) {
      html += `<span class="kalshi-price ${priceClass(t.advanceProb)}">${formatPct(t.advanceProb)}</span>`;
    } else {
      html += `<span class="kalshi-price low">—</span>`;
    }
    html += `</td>`;

    html += `<td class="next-match-col">`;
    if (t.remainingMatches.length > 0) {
      const parts = t.remainingMatches.map(m => {
        const opp = teamsMatch(m.homeTeam, t.team) ? m.awayTeam : m.homeTeam;
        return `${flag(opp)} ${opp}`;
      });
      html += `<span class="next-match-info">${parts.join(", ")}</span>`;
    } else {
      html += `<span style="color:var(--text-dim)">Done</span>`;
    }
    html += `</td>`;
    html += `</tr>`;
  });

  html += `</tbody></table></div>`;
  html += `<div class="refresh-info">Sorted by: ${advanceSortByGroup ? "Group &rarr; " : ""}Pts &rarr; GD &rarr; GF &rarr; Cards &rarr; FIFA Ranking &bull; Data refreshes every 30 seconds</div>`;
  container.innerHTML = html;

  document.getElementById("sort-group-toggle").addEventListener("click", () => {
    advanceSortByGroup = !advanceSortByGroup;
    renderThirdPlace();
  });
}

async function openMatchModal(matchData) {
  const modal = document.getElementById("match-modal");
  const body = document.getElementById("modal-body");
  modal.classList.remove("hidden");

  const stageLabel = matchData.stage === "group-stage" ? `Group ${matchData.group}` :
    matchData.stage.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const espn = findEspnEvent(matchData.home, matchData.away);
  let scoreHtml = "";
  if (espn && (espn.status === "STATUS_FULL_TIME" || espn.status === "STATUS_IN_PROGRESS" || espn.status === "STATUS_HALFTIME" || espn.status === "STATUS_SECOND_HALF" || espn.status === "STATUS_FIRST_HALF")) {
    const statusText = espn.status === "STATUS_FULL_TIME" ? "Full Time" :
      espn.status === "STATUS_HALFTIME" ? "Half Time" : `Live ${espn.clock}`;
    const statusCls = espn.status === "STATUS_FULL_TIME" ? "finished" : "live";
    scoreHtml = `
      <div class="modal-score">
        <span class="score-num">${espn.homeScore}</span>
        <span class="score-sep">-</span>
        <span class="score-num">${espn.awayScore}</span>
      </div>
      <div class="match-status ${statusCls}" style="display:inline-block;margin-top:6px;">${statusText}</div>
    `;
  }

  body.innerHTML = `
    <div class="modal-match-header">
      <div class="match-label">${stageLabel} &bull; Match #${matchData.matchNumber}</div>
      <div class="modal-teams">
        <div class="modal-team">
          <span class="flag-large">${flag(matchData.home)}</span>
          <span class="name">${matchData.home}</span>
        </div>
        <div class="modal-vs">${scoreHtml || "VS"}</div>
        <div class="modal-team">
          <span class="flag-large">${flag(matchData.away)}</span>
          <span class="name">${matchData.away}</span>
        </div>
      </div>
      <div class="modal-match-info">
        ${formatDate(matchData.kickoff)} &bull; ${formatTime(matchData.kickoff)} &bull; ${matchData.stadium || "TBD"}
      </div>
    </div>
    <div id="match-stats-section">
      <div class="loading-spinner">Loading match data</div>
    </div>
    <div class="market-prices">
      <h3>Kalshi Market Prices</h3>
      <div class="loading-spinner">Loading live prices</div>
    </div>
  `;

  const statsPromise = loadMatchStats(matchData, espn);
  const pricesPromise = loadMatchPrices(matchData);
  await Promise.all([statsPromise, pricesPromise]);
}

async function loadMatchStats(matchData, espn) {
  const statsSection = document.getElementById("match-stats-section");
  if (!statsSection) return;

  if (!espn || !espn.id) {
    statsSection.innerHTML = "";
    return;
  }

  if (espn.status !== "STATUS_FULL_TIME" && espn.status !== "STATUS_IN_PROGRESS" && espn.status !== "STATUS_HALFTIME" && espn.status !== "STATUS_SECOND_HALF" && espn.status !== "STATUS_FIRST_HALF") {
    statsSection.innerHTML = "";
    return;
  }

  try {
    const data = await fetchJSON(`/api/espn/summary?event=${espn.id}`);
    const box = data.boxscore;
    if (!box || !box.teams || box.teams.length < 2) {
      statsSection.innerHTML = "";
      return;
    }

    const homeTeam = box.teams.find(t => {
      const comp = data.header?.competitions?.[0]?.competitors?.find(c => c.homeAway === "home");
      return comp && t.team.id === comp.team?.id;
    }) || box.teams[0];
    const awayTeam = box.teams.find(t => t !== homeTeam) || box.teams[1];

    const statNames = [
      { key: "possessionPct", label: "Possession %", suffix: "%" },
      { key: "totalShots", label: "Total Shots" },
      { key: "shotsOnTarget", label: "Shots on Target" },
      { key: "wonCorners", label: "Corners" },
      { key: "foulsCommitted", label: "Fouls" },
      { key: "offsides", label: "Offsides" },
      { key: "yellowCards", label: "Yellow Cards" },
      { key: "redCards", label: "Red Cards" },
      { key: "saves", label: "Saves" },
      { key: "totalPasses", label: "Passes" },
      { key: "passPct", label: "Pass Accuracy", suffix: "%", multiply: 100 },
    ];

    const getStat = (team, key) => {
      const s = (team.statistics || []).find(st => st.name === key);
      return s ? s.displayValue : null;
    };

    let html = `<div class="stats-section"><h3>Match Statistics</h3><div class="stats-bars">`;
    for (const stat of statNames) {
      let homeVal = getStat(homeTeam, stat.key);
      let awayVal = getStat(awayTeam, stat.key);
      if (homeVal === null && awayVal === null) continue;
      homeVal = homeVal || "0";
      awayVal = awayVal || "0";

      let hNum = parseFloat(homeVal);
      let aNum = parseFloat(awayVal);
      if (stat.multiply) { hNum = Math.round(hNum * stat.multiply); aNum = Math.round(aNum * stat.multiply); }
      const total = hNum + aNum || 1;
      const hPct = Math.round((hNum / total) * 100);
      const aPct = 100 - hPct;
      const displayH = stat.multiply ? `${hNum}${stat.suffix || ""}` : `${homeVal}${stat.suffix || ""}`;
      const displayA = stat.multiply ? `${aNum}${stat.suffix || ""}` : `${awayVal}${stat.suffix || ""}`;

      html += `
        <div class="stat-row">
          <span class="stat-val home">${displayH}</span>
          <div class="stat-bar-container">
            <div class="stat-label">${stat.label}</div>
            <div class="stat-bar">
              <div class="bar-home" style="width:${hPct}%"></div>
              <div class="bar-away" style="width:${aPct}%"></div>
            </div>
          </div>
          <span class="stat-val away">${displayA}</span>
        </div>`;
    }
    html += `</div></div>`;

    const events = data.keyEvents || [];
    const goals = events.filter(e => {
      const t = (e.type?.text || "").toLowerCase();
      return t.includes("goal") && !t.includes("missed");
    });
    if (goals.length > 0) {
      html += `<div class="stats-section"><h3>Goals</h3><div class="goal-list">`;
      for (const g of goals) {
        const clock = g.clock?.displayValue || "";
        const team = g.team?.displayName || "";
        const scorer = g.participants?.[0]?.athlete?.displayName || "Unknown";
        const type = g.type?.text || "";
        const isPenalty = type.toLowerCase().includes("penalty");
        html += `<div class="goal-item">
          <span class="goal-time">${clock}</span>
          <span class="goal-scorer">${scorer}${isPenalty ? " (pen)" : ""}</span>
          <span class="goal-team">${flag(team)} ${team}</span>
        </div>`;
      }
      html += `</div></div>`;
    }

    statsSection.innerHTML = html;
  } catch (e) {
    console.error("Failed to load ESPN stats:", e);
    statsSection.innerHTML = "";
  }
}

async function loadMatchPrices(matchData) {
  const pricesContainer = document.querySelector(".market-prices");
  if (!pricesContainer) return;

  const markets = findGameMarketsForFixture(matchData);

  if (markets.length === 0) {
    const homeCode = kalshiCode(matchData.home);
    const awayCode = kalshiCode(matchData.away);
    try {
      const ticker1 = buildEventTicker(matchData);
      const ticker2 = ticker1 ? ticker1.replace(`${homeCode}${awayCode}`, `${awayCode}${homeCode}`) : null;
      const tryTickers = [ticker1, ticker2].filter(Boolean);

      for (const eventTicker of tryTickers) {
        try {
          const data = await fetchJSON(`/api/kalshi/markets?event_ticker=${eventTicker}&limit=10`);
          if (data.markets && data.markets.length > 0) {
            data.markets.forEach(m => { gameMarkets[m.ticker] = m; });
            renderMatchPrices(pricesContainer, matchData, data.markets);
            return;
          }
        } catch { /* try next */ }
      }
    } catch { /* ignore */ }

    pricesContainer.innerHTML = `
      <h3>Kalshi Market Prices</h3>
      <div style="text-align:center;color:var(--text-dim);font-size:13px;padding:20px;">
        No market data available for this match yet.<br>
        Markets may open closer to the match date.
      </div>
    `;
    return;
  }

  renderMatchPrices(pricesContainer, matchData, markets);
}

function renderMatchPrices(container, matchData, markets) {
  const homeCode = kalshiCode(matchData.home);
  const awayCode = kalshiCode(matchData.away);

  let homeMarket = markets.find(m => m.ticker.endsWith(`-${homeCode}`));
  let awayMarket = markets.find(m => m.ticker.endsWith(`-${awayCode}`));
  let tieMarket = markets.find(m => m.ticker.endsWith("-TIE"));

  let html = `<h3>Kalshi Market Prices</h3><div class="price-cards">`;

  html += renderPriceCard(matchData.home, homeMarket, "home-win");
  html += renderPriceCard("Draw", tieMarket, "tie-card");
  html += renderPriceCard(matchData.away, awayMarket, "away-win");

  html += `</div>`;

  const settled = markets.some(m => m.status === "finalized");
  if (settled) {
    let resultText = "";
    if (homeMarket && homeMarket.result === "yes") resultText = `${matchData.home} won`;
    else if (awayMarket && awayMarket.result === "yes") resultText = `${matchData.away} won`;
    else if (tieMarket && tieMarket.result === "yes") resultText = "Match ended in a draw";

    if (resultText) {
      html += `<div style="text-align:center;margin-top:16px;padding:12px;background:rgba(34,197,94,0.1);border-radius:8px;color:var(--green);font-weight:700;">
        ${resultText}
      </div>`;
    }
  }

  const vol = markets.reduce((sum, m) => sum + parseFloat(m.volume_fp || 0), 0);
  html += `<div style="text-align:center;margin-top:12px;font-size:12px;color:var(--text-dim);">
    Total Volume: $${vol.toLocaleString(undefined, { maximumFractionDigits: 0 })}
    &bull; Based on 90 min + stoppage time (no extra time / penalties)
  </div>`;

  container.innerHTML = html;
}

function renderPriceCard(label, market, cssClass) {
  if (!market) {
    return `<div class="price-card ${cssClass}">
      <div class="outcome">${label}</div>
      <div class="price neutral">—</div>
      <div class="bid-ask">No data</div>
    </div>`;
  }

  const price = parseFloat(market.last_price_dollars);
  const pricePct = Math.round(price * 100);
  let colorClass = "neutral";
  if (price >= 0.5) colorClass = "up";
  else if (price <= 0.15) colorClass = "down";

  const isSettled = market.status === "finalized";
  const won = market.result === "yes";

  const bid = market.yes_bid_dollars ? formatPrice(market.yes_bid_dollars) : "—";
  const ask = market.yes_ask_dollars ? formatPrice(market.yes_ask_dollars) : "—";

  return `<div class="price-card ${cssClass}"${won ? ' style="background:rgba(34,197,94,0.12);border-color:var(--green)"' : ""}>
    <div class="outcome">${label}${won ? " ✓" : ""}</div>
    <div class="price ${isSettled ? (won ? "up" : "down") : colorClass}">${isSettled ? (won ? "100%" : "0%") : pricePct + "%"}</div>
    <div class="bid-ask">${isSettled ? (won ? "SETTLED YES" : "SETTLED NO") : `Bid ${bid} / Ask ${ask}`}</div>
    <div class="volume">Vol: $${Number(market.volume_fp || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
  </div>`;
}

function setupNav() {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
      document.getElementById(`${btn.dataset.view}-view`).classList.add("active");
    });
  });
}

function setupModal() {
  const modal = document.getElementById("match-modal");
  modal.querySelector(".modal-backdrop").addEventListener("click", () => modal.classList.add("hidden"));
  modal.querySelector(".modal-close").addEventListener("click", () => modal.classList.add("hidden"));
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") modal.classList.add("hidden");
  });
}

function renderLive() {
  const container = document.getElementById("live-view");
  const now = new Date();

  const liveMatches = [];
  const upcomingMatches = [];
  const recentMatches = [];

  for (const f of fixturesData) {
    if (f.stage !== "group-stage" && f.homeTeam.startsWith("Winner")) continue;
    const espn = findEspnEvent(f.homeTeam, f.awayTeam);
    if (espn) {
      if (espn.status === "STATUS_IN_PROGRESS" || espn.status === "STATUS_HALFTIME" ||
          espn.status === "STATUS_FIRST_HALF" || espn.status === "STATUS_SECOND_HALF") {
        liveMatches.push({ fixture: f, espn });
        continue;
      } else if (espn.status === "STATUS_FULL_TIME" || espn.status === "STATUS_FINAL") {
        recentMatches.push({ fixture: f, espn });
        continue;
      }
    }
    const kickoff = new Date(f.kickoffUtc);
    if (kickoff >= new Date(now.getTime() - 3 * 60 * 60 * 1000)) {
      upcomingMatches.push({ fixture: f, kickoff });
    }
  }

  upcomingMatches.sort((a, b) => a.kickoff - b.kickoff);
  recentMatches.sort((a, b) => {
    const aDate = new Date(a.fixture.kickoffUtc);
    const bDate = new Date(b.fixture.kickoffUtc);
    return bDate - aDate;
  });

  let html = "";

  if (liveMatches.length > 0) {
    html += `<div class="live-section"><h2 class="live-section-title"><span class="live-dot"></span> Live Now</h2>`;
    html += `<div class="live-matches-grid">`;
    for (const { fixture: f, espn } of liveMatches) {
      const statusText = espn.status === "STATUS_HALFTIME" ? "HT" : espn.clock || "LIVE";
      const stageLabel = f.stage === "group-stage" ? `Group ${f.group}` : f.stage.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      const mData = { matchNumber: f.matchNumber, home: f.homeTeam, away: f.awayTeam, date: f.date, kickoff: f.kickoffUtc, stadium: f.stadium, group: f.group, stage: f.stage };
      matchDataLookup[f.matchNumber] = mData;
      html += `<div class="live-match-card" data-match-id="${f.matchNumber}">`;
      html += `<div class="live-match-stage">${stageLabel}</div>`;
      html += `<div class="live-match-body">`;
      html += `<div class="live-team"><span class="flag-med">${flag(f.homeTeam)}</span><span class="live-team-name">${f.homeTeam}</span><span class="live-score">${espn.homeScore}</span></div>`;
      html += `<div class="live-team"><span class="flag-med">${flag(f.awayTeam)}</span><span class="live-team-name">${f.awayTeam}</span><span class="live-score">${espn.awayScore}</span></div>`;
      html += `</div>`;
      html += `<div class="live-match-footer"><span class="match-status live">${statusText}</span><span class="live-stadium">${f.stadium || ""}</span></div>`;
      html += `</div>`;
    }
    html += `</div></div>`;
  }

  if (upcomingMatches.length > 0) {
    const showUpcoming = upcomingMatches.slice(0, 8);
    html += `<div class="live-section"><h2 class="live-section-title">Upcoming</h2>`;
    html += `<div class="live-matches-grid">`;
    for (const { fixture: f, kickoff } of showUpcoming) {
      const stageLabel = f.stage === "group-stage" ? `Group ${f.group}` : f.stage.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      const markets = findGameMarketsForFixture(f);
      const homeMarket = markets.find(m => m.ticker.endsWith(`-${kalshiCode(f.homeTeam)}`));
      const awayMarket = markets.find(m => m.ticker.endsWith(`-${kalshiCode(f.awayTeam)}`));
      const mData = { matchNumber: f.matchNumber, home: f.homeTeam, away: f.awayTeam, date: f.date, kickoff: f.kickoffUtc, stadium: f.stadium, group: f.group, stage: f.stage };
      matchDataLookup[f.matchNumber] = mData;
      html += `<div class="live-match-card upcoming-card" data-match-id="${f.matchNumber}">`;
      html += `<div class="live-match-stage">${stageLabel} &bull; ${formatDate(f.kickoffUtc)}</div>`;
      html += `<div class="live-match-body">`;
      html += `<div class="live-team"><span class="flag-med">${flag(f.homeTeam)}</span><span class="live-team-name">${f.homeTeam}</span>`;
      if (homeMarket) html += `<span class="live-odds ${priceClass(homeMarket.last_price_dollars)}">${formatPct(homeMarket.last_price_dollars)}</span>`;
      html += `</div>`;
      html += `<div class="live-team"><span class="flag-med">${flag(f.awayTeam)}</span><span class="live-team-name">${f.awayTeam}</span>`;
      if (awayMarket) html += `<span class="live-odds ${priceClass(awayMarket.last_price_dollars)}">${formatPct(awayMarket.last_price_dollars)}</span>`;
      html += `</div>`;
      html += `</div>`;
      html += `<div class="live-match-footer"><span class="match-status upcoming">${formatTime(f.kickoffUtc)}</span><span class="live-stadium">${f.stadium || ""}</span></div>`;
      html += `</div>`;
    }
    html += `</div></div>`;
  }

  if (recentMatches.length > 0) {
    const showRecent = recentMatches.slice(0, 8);
    html += `<div class="live-section"><h2 class="live-section-title">Recent Results</h2>`;
    html += `<div class="live-matches-grid">`;
    for (const { fixture: f, espn } of showRecent) {
      const stageLabel = f.stage === "group-stage" ? `Group ${f.group}` : f.stage.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      const mData = { matchNumber: f.matchNumber, home: f.homeTeam, away: f.awayTeam, date: f.date, kickoff: f.kickoffUtc, stadium: f.stadium, group: f.group, stage: f.stage };
      matchDataLookup[f.matchNumber] = mData;
      html += `<div class="live-match-card finished-card" data-match-id="${f.matchNumber}">`;
      html += `<div class="live-match-stage">${stageLabel} &bull; ${formatDate(f.kickoffUtc)}</div>`;
      html += `<div class="live-match-body">`;
      html += `<div class="live-team"><span class="flag-med">${flag(f.homeTeam)}</span><span class="live-team-name">${f.homeTeam}</span><span class="live-score">${espn.homeScore}</span></div>`;
      html += `<div class="live-team"><span class="flag-med">${flag(f.awayTeam)}</span><span class="live-team-name">${f.awayTeam}</span><span class="live-score">${espn.awayScore}</span></div>`;
      html += `</div>`;
      html += `<div class="live-match-footer"><span class="match-status finished">FT</span><span class="live-stadium">${f.stadium || ""}</span></div>`;
      html += `</div>`;
    }
    html += `</div></div>`;
  }

  if (!html) {
    html = `<div style="text-align:center;padding:60px 20px;color:var(--text-dim);">
      <div style="font-size:48px;margin-bottom:16px;">⚽</div>
      <h2 style="font-size:20px;color:var(--text);margin-bottom:8px;">No Live Matches Right Now</h2>
      <p>Check the Group Stage tab for upcoming fixtures and market prices.</p>
    </div>`;
  }

  html += `<div class="refresh-info">Updates every 30 seconds &bull; Click any match for details</div>`;
  container.innerHTML = html;

  container.querySelectorAll(".live-match-card").forEach(el => {
    el.addEventListener("click", () => {
      const data = matchDataLookup[el.dataset.matchId];
      if (data) openMatchModal(data);
    });
  });
}

function renderSearch() {
  const container = document.getElementById("search-view");
  const allTeams = Object.keys(TEAM_FLAGS);

  container.innerHTML = `
    <div class="search-container">
      <div class="search-input-wrap">
        <input type="text" id="team-search-input" class="team-search-input" placeholder="Search for a country (e.g. fra, arg, usa)..." autocomplete="off">
        <div id="search-suggestions" class="search-suggestions hidden"></div>
      </div>
      <div id="team-results"></div>
    </div>
  `;

  const input = document.getElementById("team-search-input");
  const suggestions = document.getElementById("search-suggestions");
  const results = document.getElementById("team-results");

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    if (q.length === 0) {
      suggestions.classList.add("hidden");
      return;
    }

    const matches = allTeams.filter(t => {
      const name = t.toLowerCase();
      const code = (TEAM_TO_KALSHI[t] || "").toLowerCase();
      return name.startsWith(q) || name.includes(q) || code.startsWith(q) || teamNorm(t).startsWith(q);
    });

    if (matches.length === 0) {
      suggestions.innerHTML = `<div class="suggestion-item disabled">No teams found</div>`;
      suggestions.classList.remove("hidden");
      return;
    }

    suggestions.innerHTML = matches.map(t =>
      `<div class="suggestion-item" data-team="${escapeAttr(t)}">${flag(t)} ${t} <span class="suggestion-code">${TEAM_TO_KALSHI[t] || ""}</span></div>`
    ).join("");
    suggestions.classList.remove("hidden");

    suggestions.querySelectorAll(".suggestion-item[data-team]").forEach(el => {
      el.addEventListener("click", () => {
        input.value = el.dataset.team;
        suggestions.classList.add("hidden");
        renderTeamMatches(el.dataset.team, results);
      });
    });
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const q = input.value.trim().toLowerCase();
      const match = allTeams.find(t => {
        const name = t.toLowerCase();
        const code = (TEAM_TO_KALSHI[t] || "").toLowerCase();
        return name === q || code === q || name.startsWith(q);
      });
      if (match) {
        input.value = match;
        suggestions.classList.add("hidden");
        renderTeamMatches(match, results);
      }
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-input-wrap")) {
      suggestions.classList.add("hidden");
    }
  });
}

function renderTeamMatches(team, container) {
  const teamFixtures = fixturesData.filter(f =>
    teamsMatch(f.homeTeam, team) || teamsMatch(f.awayTeam, team)
  );

  if (teamFixtures.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-dim);">No matches found for ${flag(team)} ${team}</div>`;
    return;
  }

  const rank = fifaRank(team);
  const cards = getCards(team);
  const groupEntry = Object.entries(GROUP_TEAMS).find(([, teams]) => teams.includes(team));
  const group = groupEntry ? groupEntry[0] : null;

  let html = `<div class="team-header-card">`;
  html += `<div class="team-header-info">`;
  html += `<span class="team-header-flag">${flag(team)}</span>`;
  html += `<div><h2 class="team-header-name">${team}</h2>`;
  html += `<div class="team-header-meta">`;
  if (group) html += `Group ${group}`;
  if (rank) html += `${group ? " &bull; " : ""}FIFA Rank: ${ordinal(rank)}`;
  if (cards) html += ` &bull; Cards: <span class="yc">${cards.yellow}Y</span>${cards.red ? ` <span class="rc">${cards.red}R</span>` : ""}`;
  html += `</div></div></div></div>`;

  teamFixtures.sort((a, b) => new Date(a.kickoffUtc) - new Date(b.kickoffUtc));

  html += `<div class="team-matches-list">`;
  for (const f of teamFixtures) {
    const isHome = teamsMatch(f.homeTeam, team);
    const opponent = isHome ? f.awayTeam : f.homeTeam;
    const espn = findEspnEvent(f.homeTeam, f.awayTeam);
    const stageLabel = f.stage === "group-stage" ? `Group ${f.group}` : f.stage.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    let statusHtml = "";
    let scoreHtml = "";
    if (espn && (espn.status === "STATUS_FULL_TIME" || espn.status === "STATUS_FINAL")) {
      const teamScore = isHome ? espn.homeScore : espn.awayScore;
      const oppScore = isHome ? espn.awayScore : espn.homeScore;
      scoreHtml = `<span class="team-match-score">${teamScore} - ${oppScore}</span>`;
      const won = parseInt(teamScore) > parseInt(oppScore);
      const drew = teamScore === oppScore;
      statusHtml = `<span class="team-match-result ${won ? "win" : drew ? "draw" : "loss"}">${won ? "W" : drew ? "D" : "L"}</span>`;
    } else if (espn && (espn.status === "STATUS_IN_PROGRESS" || espn.status === "STATUS_HALFTIME")) {
      const teamScore = isHome ? espn.homeScore : espn.awayScore;
      const oppScore = isHome ? espn.awayScore : espn.homeScore;
      scoreHtml = `<span class="team-match-score">${teamScore} - ${oppScore}</span>`;
      statusHtml = `<span class="match-status live">LIVE</span>`;
    } else {
      const markets = findGameMarketsForFixture(f);
      const teamMarket = markets.find(m => m.ticker.endsWith(`-${kalshiCode(team)}`));
      if (teamMarket) {
        statusHtml = `<span class="live-odds ${priceClass(teamMarket.last_price_dollars)}">${formatPct(teamMarket.last_price_dollars)}</span>`;
      } else {
        statusHtml = `<span class="match-status upcoming">Upcoming</span>`;
      }
    }

    const mData = { matchNumber: f.matchNumber, home: f.homeTeam, away: f.awayTeam, date: f.date, kickoff: f.kickoffUtc, stadium: f.stadium, group: f.group, stage: f.stage };
    matchDataLookup[f.matchNumber] = mData;

    html += `<div class="team-match-row" data-match-id="${f.matchNumber}">`;
    html += `<div class="team-match-date">${formatDate(f.kickoffUtc)}</div>`;
    html += `<div class="team-match-stage">${stageLabel}</div>`;
    html += `<div class="team-match-opponent">${isHome ? "vs" : "@"} ${flag(opponent)} ${opponent}</div>`;
    html += `<div class="team-match-status">${scoreHtml}${statusHtml}</div>`;
    html += `</div>`;
  }
  html += `</div>`;

  container.innerHTML = html;

  container.querySelectorAll(".team-match-row").forEach(el => {
    el.addEventListener("click", () => {
      const data = matchDataLookup[el.dataset.matchId];
      if (data) openMatchModal(data);
    });
  });
}

async function refreshData() {
  await Promise.all([loadGroupWinMarkets(), loadGroupQualMarkets(), loadGameMarkets(), loadWinnerMarkets(), loadEspnScoreboard(), loadEspnStandings(), loadTeamCards(), loadFifaRankings()]);
  renderLive();
  renderGroupStage();
  renderKnockout();
  renderThirdPlace();
  renderWinner();
  renderSearch();
}

async function init() {
  setupNav();
  setupModal();

  document.getElementById("live-view").innerHTML = `<div class="loading-spinner">Loading World Cup data</div>`;

  await loadFixtures();
  if (fixturesData.length === 0) fixturesData = generateFallbackFixtures();

  try {
    await refreshData();
  } catch (e) {
    console.error("Initial data load failed:", e);
    renderLive();
    renderGroupStage();
    renderKnockout();
    renderThirdPlace();
    renderWinner();
    renderSearch();
  }

  pollInterval = setInterval(async () => {
    try {
      await Promise.all([loadGroupWinMarkets(), loadGroupQualMarkets(), loadGameMarkets(), loadWinnerMarkets(), loadEspnScoreboard(), loadEspnStandings(), loadTeamCards(), loadFifaRankings()]);
      const activeView = document.querySelector(".nav-btn.active")?.dataset.view;
      if (activeView === "live") renderLive();
      else if (activeView === "groups") renderGroupStage();
      else if (activeView === "thirdplace") renderThirdPlace();
      else if (activeView === "winner") renderWinner();
    } catch (e) {
      console.error("Refresh failed:", e);
    }
  }, 30000);
}

init();
