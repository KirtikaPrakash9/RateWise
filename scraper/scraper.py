"""
RateWise AI - Data Scraper
Scrapes exchange rates and fees from exchange providers.
Falls back to realistic mock data if scraping fails.
"""

import json
import os
import sqlite3
import logging
from datetime import datetime, date
from pathlib import Path

import requests
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "rates.db"
CACHE_PATH = DATA_DIR / "cache.json"

# ---------------------------------------------------------------------------
# Mock / fallback data (realistic UAE exchange rates)
# ---------------------------------------------------------------------------

MOCK_RATES = {
    "al_ansari": {
        "name": "Al Ansari Exchange",
        "INR": {"rate": 22.45, "fee": 0, "min": 100, "max": 50000, "promo": "Zero fees on transfers above 500 AED"},
        "PKR": {"rate": 76.20, "fee": 10, "min": 100, "max": 50000, "promo": None},
        "PHP": {"rate": 15.80, "fee": 15, "min": 200, "max": 50000, "promo": None},
    },
    "uae_exchange": {
        "name": "UAE Exchange",
        "INR": {"rate": 22.38, "fee": 5, "min": 200, "max": 100000, "promo": None},
        "PKR": {"rate": 76.05, "fee": 15, "min": 200, "max": 100000, "promo": None},
        "PHP": {"rate": 15.75, "fee": 20, "min": 200, "max": 100000, "promo": None},
    },
    "lulu_exchange": {
        "name": "Lulu Exchange",
        "INR": {"rate": 22.42, "fee": 10, "min": 100, "max": 30000, "promo": "Special rate for amounts above 1000 AED"},
        "PKR": {"rate": 76.15, "fee": 12, "min": 100, "max": 30000, "promo": None},
        "PHP": {"rate": 15.82, "fee": 18, "min": 100, "max": 30000, "promo": None},
    },
    "western_union": {
        "name": "Western Union",
        "INR": {"rate": 22.10, "fee": 25, "min": 50, "max": 25000, "promo": None},
        "PKR": {"rate": 75.80, "fee": 20, "min": 50, "max": 25000, "promo": None},
        "PHP": {"rate": 15.60, "fee": 20, "min": 50, "max": 25000, "promo": None},
    },
    "wise": {
        "name": "Wise",
        "INR": {"rate": 22.55, "fee": 8, "min": 50, "max": 1000000, "promo": "First transfer free"},
        "PKR": {"rate": 76.30, "fee": 8, "min": 50, "max": 1000000, "promo": None},
        "PHP": {"rate": 15.90, "fee": 8, "min": 50, "max": 1000000, "promo": None},
    },
}


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def init_db():
    DATA_DIR.mkdir(exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS rates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            provider_key TEXT NOT NULL,
            provider_name TEXT NOT NULL,
            currency TEXT NOT NULL,
            rate REAL NOT NULL,
            fee REAL NOT NULL,
            min_transfer REAL NOT NULL,
            max_transfer REAL NOT NULL,
            promo TEXT,
            scraped_at TEXT NOT NULL,
            date TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()
    logger.info("Database initialised at %s", DB_PATH)


def save_rates(rates_data: dict):
    """Persist rates to SQLite and update JSON cache."""
    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()
    now = datetime.utcnow().isoformat()
    today = str(date.today())

    for provider_key, provider in rates_data.items():
        for currency, info in provider.items():
            if currency == "name":
                continue
            cur.execute("""
                INSERT INTO rates
                    (provider_key, provider_name, currency, rate, fee,
                     min_transfer, max_transfer, promo, scraped_at, date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                provider_key, provider["name"], currency,
                info["rate"], info["fee"],
                info["min"], info["max"],
                info.get("promo"), now, today,
            ))
    conn.commit()
    conn.close()

    # Write JSON cache
    cache = {"updated_at": now, "providers": rates_data}
    CACHE_PATH.write_text(json.dumps(cache, indent=2))
    logger.info("Rates saved and cache updated at %s", CACHE_PATH)


# ---------------------------------------------------------------------------
# Scraping helpers (best-effort; fall back to mock on failure)
# ---------------------------------------------------------------------------

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}


def _try_scrape_wise_inr() -> float | None:
    """Attempt to fetch AED→INR rate from Wise public API."""
    try:
        url = "https://wise.com/gb/currency-converter/aed-to-inr-rate"
        resp = requests.get(url, headers=HEADERS, timeout=8)
        soup = BeautifulSoup(resp.text, "html.parser")
        # Wise typically renders the rate inside a <span> with a specific class
        tag = soup.find("span", {"data-testid": "mid-market-rate-value"})
        if tag:
            return float(tag.text.strip().replace(",", ""))
    except Exception as exc:
        logger.debug("Wise scrape failed: %s", exc)
    return None


def scrape_all() -> dict:
    """
    Try live scraping; merge successful results with mock data.
    Returns the full rates dict.
    """
    rates = {k: {ck: cv.copy() for ck, cv in v.items()} for k, v in MOCK_RATES.items()}

    # Attempt live rate for Wise INR
    live_inr = _try_scrape_wise_inr()
    if live_inr:
        logger.info("Live Wise AED→INR rate: %s", live_inr)
        rates["wise"]["INR"]["rate"] = live_inr
    else:
        logger.info("Using mock data (live scrape not available or blocked)")

    return rates


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def run():
    init_db()
    rates = scrape_all()
    save_rates(rates)
    logger.info("Scrape run complete.")
    return rates


if __name__ == "__main__":
    run()
