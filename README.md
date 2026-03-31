# RateWise AI 💸

RateWise AI is an intelligent, ultra-lightweight web platform designed to help migrant workers in the UAE maximize the value of every remittance.

> **"Google Maps, but for money transfers"** — enter an AED amount, instantly know the best way to send it home.

---

## Features

- 📊 **Real-time rate comparison** across Al Ansari, UAE Exchange, Lulu Exchange, Western Union & Wise
- 🤖 **AI recommendation** — SEND NOW or WAIT based on rate trends
- 🌐 **Multilingual** — English, Hindi, Urdu, Tagalog, Arabic
- 📱 **PWA / offline support** — works on low-end devices, last-known rates cached offline
- ⚡ **<200 ms API responses** with in-memory caching

---

## Project Structure

```
/ratewise-ai
  /scraper
    scraper.py        # Scrapes exchange rates (falls back to mock data)
    scheduler.py      # Daily cron runner
  /backend
    server.js         # Express.js API server
    routes/           # rates, calculate, best-option, trend, recommendation
    controllers/      # ratesController (cache + calculation logic)
  /frontend
    index.html        # Single-page UI
    styles.css        # Minimal mobile-first stylesheet
    app.js            # Vanilla JS app (no framework)
    manifest.json     # PWA manifest
    sw.js             # Service worker for offline support
  /ml
    predictor.py      # scikit-learn trend prediction engine
  /data
    rates.db          # SQLite (auto-created by scraper)
    cache.json        # JSON cache (auto-created by scraper)
  .env.example
  requirements.txt
  README.md
```

---

## Quick Start

### 1 — Backend

```bash
cd backend
cp ../.env.example .env
npm install
npm start
# Server listens on http://localhost:3000
```

### 2 — Data (Python scraper)

```bash
pip install -r requirements.txt
cd scraper
python scraper.py       # run once
python scheduler.py     # run daily at 06:00 UTC
```

### 3 — Frontend

Serve the `frontend/` folder with any static server, or just open `index.html` in a browser (set `API_BASE` in `app.js` to match your backend URL).

```bash
npx serve frontend
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/health` | Health check |
| `GET`  | `/rates` | All latest rates |
| `GET`  | `/rates/:currency` | Rates for INR / PKR / PHP |
| `POST` | `/calculate` | Compare all providers for an amount |
| `GET`  | `/best-option` | Single best provider |
| `GET`  | `/trend` | Historical daily rate trend |
| `GET`  | `/recommendation` | AI send-now/wait recommendation |

**POST /calculate** body:
```json
{ "amount_aed": 1000, "currency": "INR" }
```

---

## Supported Currencies

| Code | Country |
|------|---------|
| INR  | India 🇮🇳 |
| PKR  | Pakistan 🇵🇰 |
| PHP  | Philippines 🇵🇭 |

---

## Environment Variables

Copy `.env.example` to `.env` and adjust:

```
PORT=3000
NODE_ENV=development
```
