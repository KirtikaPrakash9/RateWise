"use strict";

const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = path.join(__dirname, "../../data/rates.db");

const router = express.Router();

/**
 * GET /trend?currency=INR&provider=wise&days=14
 * Returns historical daily average rates.
 */
router.get("/", (req, res) => {
  const currency = (req.query.currency || "INR").toUpperCase();
  const providerKey = req.query.provider || null;
  const days = Math.min(parseInt(req.query.days, 10) || 14, 90);

  // If DB does not exist yet, return empty trend
  let rows = [];
  try {
    const db = new Database(DB_PATH, { readonly: true });
    let stmt;
    if (providerKey) {
      stmt = db.prepare(`
        SELECT date, AVG(rate) as avg_rate, MIN(rate) as min_rate, MAX(rate) as max_rate
        FROM rates
        WHERE currency = ? AND provider_key = ?
          AND date >= date('now', '-' || ? || ' days')
        GROUP BY date
        ORDER BY date ASC
      `);
      rows = stmt.all(currency, providerKey, days);
    } else {
      stmt = db.prepare(`
        SELECT date, AVG(rate) as avg_rate, MIN(rate) as min_rate, MAX(rate) as max_rate
        FROM rates
        WHERE currency = ?
          AND date >= date('now', '-' || ? || ' days')
        GROUP BY date
        ORDER BY date ASC
      `);
      rows = stmt.all(currency, days);
    }
    db.close();
  } catch {
    // DB not yet created – return empty trend gracefully
  }

  res.json({ currency, provider: providerKey, days, trend: rows });
});

module.exports = router;
