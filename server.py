import requests as r
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__, static_folder="static")

KALSHI_BASE = "https://external-api.kalshi.com/trade-api/v2"
KALSHI_SERIES = {
    "game": "KXWCGAME",
    "group_win": "KXWCGROUPWIN",
    "tournament_winner": "KXMENWORLDCUP",
}


@app.route("/")
def index():
    return send_from_directory("static", "index.html")


@app.route("/api/kalshi/markets")
def kalshi_markets():
    series = request.args.get("series_ticker", "")
    status = request.args.get("status", "")
    event_ticker = request.args.get("event_ticker", "")
    limit = request.args.get("limit", "200")
    cursor = request.args.get("cursor", "")

    params = {"limit": limit}
    if series:
        params["series_ticker"] = series
    if status:
        params["status"] = status
    if event_ticker:
        params["event_ticker"] = event_ticker
    if cursor:
        params["cursor"] = cursor

    try:
        resp = r.get(f"{KALSHI_BASE}/markets", params=params, timeout=10)
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 502


@app.route("/api/kalshi/markets/<ticker>")
def kalshi_market(ticker):
    try:
        resp = r.get(f"{KALSHI_BASE}/markets/{ticker}", timeout=10)
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 502


@app.route("/api/kalshi/orderbook/<ticker>")
def kalshi_orderbook(ticker):
    try:
        resp = r.get(f"{KALSHI_BASE}/markets/{ticker}/orderbook", timeout=10)
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 502


ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world"


@app.route("/api/espn/scoreboard")
def espn_scoreboard():
    dates = request.args.get("dates", "")
    params = {}
    if dates:
        params["dates"] = dates
    try:
        resp = r.get(f"{ESPN_BASE}/scoreboard", params=params, timeout=10)
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 502


@app.route("/api/espn/standings")
def espn_standings():
    try:
        resp = r.get(
            "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings",
            timeout=10,
        )
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 502


@app.route("/api/espn/summary")
def espn_summary():
    event_id = request.args.get("event", "")
    if not event_id:
        return jsonify({"error": "event param required"}), 400
    try:
        resp = r.get(f"{ESPN_BASE}/summary", params={"event": event_id}, timeout=10)
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 502


import time

_card_cache = {"data": {}, "ts": 0}
_ranking_cache = {"data": {}, "ts": 0}

FIFA_FDCP_API = "https://api.fifa.com/api/v3"


@app.route("/api/fifa/rankings")
def fifa_rankings():
    now = time.time()
    if now - _ranking_cache["ts"] < 300 and _ranking_cache["data"]:
        return jsonify(_ranking_cache["data"])

    try:
        resp = r.get(
            f"{FIFA_FDCP_API}/rankings/",
            params={"gender": 1, "count": 200, "language": "en"},
            headers={
                "User-Agent": "Mozilla/5.0",
                "Referer": "https://inside.fifa.com/",
                "Origin": "https://inside.fifa.com",
            },
            timeout=10,
        )
        data = resp.json()
        results = data.get("Results", [])
        rankings = {}
        for entry in results:
            names = entry.get("TeamName", [])
            name = names[0]["Description"] if names else entry.get("IdCountry", "")
            rankings[name] = {
                "rank": entry.get("Rank"),
                "points": entry.get("DecimalTotalPoints"),
                "prevRank": entry.get("PrevRank"),
                "movement": entry.get("RankingMovement"),
                "confederation": entry.get("ConfederationName"),
                "countryCode": entry.get("IdCountry"),
            }
        _ranking_cache["data"] = rankings
        _ranking_cache["ts"] = now
        return jsonify(rankings)
    except Exception as e:
        if _ranking_cache["data"]:
            return jsonify(_ranking_cache["data"])
        return jsonify({"error": str(e)}), 502


@app.route("/api/espn/cards")
def espn_cards():
    now = time.time()
    if now - _card_cache["ts"] < 120 and _card_cache["data"]:
        return jsonify(_card_cache["data"])

    try:
        sb = r.get(
            f"{ESPN_BASE}/scoreboard",
            params={"dates": "20260611-20260720"},
            timeout=10,
        ).json()

        finished_ids = []
        for ev in sb.get("events", []):
            comp = ev["competitions"][0]
            st = comp["status"]["type"]["name"]
            if st in ("STATUS_FULL_TIME", "STATUS_FINAL"):
                finished_ids.append(ev["id"])

        cards = {}
        for eid in finished_ids:
            try:
                data = r.get(
                    f"{ESPN_BASE}/summary",
                    params={"event": eid},
                    timeout=8,
                ).json()
                for t in data.get("boxscore", {}).get("teams", []):
                    name = t["team"]["displayName"]
                    stats = {s["name"]: s["displayValue"] for s in t.get("statistics", [])}
                    if name not in cards:
                        cards[name] = {"yellow": 0, "red": 0}
                    cards[name]["yellow"] += int(stats.get("yellowCards", 0))
                    cards[name]["red"] += int(stats.get("redCards", 0))
            except Exception:
                continue

        _card_cache["data"] = cards
        _card_cache["ts"] = now
        return jsonify(cards)
    except Exception as e:
        return jsonify({"error": str(e)}), 502


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5050))
    debug = os.environ.get("FLASK_DEBUG", "1") == "1"
    app.run(debug=debug, host="0.0.0.0", port=port)
