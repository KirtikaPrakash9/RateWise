"""
RateWise AI - ML Prediction Engine
Recommends SEND NOW or WAIT based on historical rate trends.
Uses lightweight linear regression (scikit-learn).
"""

import json
import sqlite3
import logging
from datetime import date, timedelta
from pathlib import Path

import numpy as np

try:
    from sklearn.linear_model import LinearRegression
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "data" / "rates.db"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _fetch_history(provider_key: str, currency: str, days: int = 14) -> list[float]:
    """Return the last `days` daily closing rates from the DB."""
    if not DB_PATH.exists():
        return []
    since = str(date.today() - timedelta(days=days))
    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()
    cur.execute("""
        SELECT date, AVG(rate) as avg_rate
        FROM rates
        WHERE provider_key = ? AND currency = ? AND date >= ?
        GROUP BY date
        ORDER BY date ASC
    """, (provider_key, currency, since))
    rows = cur.fetchall()
    conn.close()
    return [r[1] for r in rows]


def _trend_recommendation(rates: list[float]) -> dict:
    """Derive a recommendation from a list of historical rates."""
    if len(rates) < 3:
        return {
            "recommendation": "SEND NOW",
            "confidence": 50,
            "reason": "Not enough historical data to make a prediction. Current rates are competitive.",
        }

    x = np.arange(len(rates)).reshape(-1, 1)
    y = np.array(rates)

    if SKLEARN_AVAILABLE:
        model = LinearRegression().fit(x, y)
        slope = model.coef_[0]
    else:
        # Manual least-squares fallback
        slope = float(np.polyfit(x.flatten(), y, 1)[0])

    pct_change = (slope / (y.mean() or 1)) * 100

    latest = rates[-1]
    avg = float(y.mean())
    volatility = float(y.std())

    if pct_change > 0.05:
        recommendation = "WAIT"
        confidence = min(90, int(60 + abs(pct_change) * 500))
        reason = f"Rates are trending upward (+{pct_change:.2f}% per day). Waiting may get you a better deal."
    elif pct_change < -0.05:
        recommendation = "SEND NOW"
        confidence = min(90, int(60 + abs(pct_change) * 500))
        reason = f"Rates are trending downward ({pct_change:.2f}% per day). Send now to lock in today's rate."
    elif latest >= avg:
        recommendation = "SEND NOW"
        confidence = 65
        reason = "Today's rate is at or above the recent average. A good time to send."
    else:
        recommendation = "WAIT"
        confidence = 55
        reason = "Today's rate is slightly below the recent average. Rates may recover shortly."

    return {
        "recommendation": recommendation,
        "confidence": confidence,
        "reason": reason,
        "latest_rate": round(latest, 4),
        "avg_rate": round(avg, 4),
        "volatility": round(volatility, 4),
        "slope": round(slope, 6),
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def predict(provider_key: str, currency: str) -> dict:
    """Return a recommendation for the given provider + currency pair."""
    history = _fetch_history(provider_key, currency)
    return _trend_recommendation(history)


def predict_best_currency(currency: str) -> dict:
    """Return a market-wide recommendation by averaging across all providers."""
    all_rates: list[float] = []
    for provider_key in ["al_ansari", "uae_exchange", "lulu_exchange", "wise"]:
        all_rates.extend(_fetch_history(provider_key, currency))

    return _trend_recommendation(sorted(all_rates) if all_rates else [])


if __name__ == "__main__":
    result = predict_best_currency("INR")
    print(json.dumps(result, indent=2))
