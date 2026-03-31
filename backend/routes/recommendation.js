"use strict";

const express = require("express");
const path = require("path");
const { loadRates, calculate, cache } = require("../controllers/ratesController");

const router = express.Router();

// ---------------------------------------------------------------------------
// Simple in-process ML-like recommendation using recent rate data
// ---------------------------------------------------------------------------

/**
 * Returns SEND NOW / WAIT based on where today's rate sits relative to
 * a rolling mock window.  In production the Python ML service would be
 * called here via a child process or HTTP.
 */
function buildRecommendation(currency) {
  const { providers } = loadRates();

  // Gather all provider rates for this currency
  const rates = Object.values(providers)
    .map((p) => p[currency]?.rate)
    .filter(Boolean);

  if (!rates.length) {
    return {
      recommendation: "SEND NOW",
      confidence: 50,
      reason: "Unable to determine trend. Current rates appear competitive.",
    };
  }

  const avg = rates.reduce((s, r) => s + r, 0) / rates.length;
  const max = Math.max(...rates);
  const min = Math.min(...rates);
  const spread = ((max - min) / avg) * 100;

  // Simple heuristic: if best rate is well above average it's a good day
  if (max >= avg * 1.002) {
    return {
      recommendation: "SEND NOW",
      confidence: 72,
      reason: `Today's best rate (${max.toFixed(4)}) is above the provider average (${avg.toFixed(4)}). A good time to send.`,
      best_rate: max,
      avg_rate: parseFloat(avg.toFixed(4)),
      spread_pct: parseFloat(spread.toFixed(2)),
    };
  }

  return {
    recommendation: "WAIT",
    confidence: 60,
    reason: `Rates are currently below the recent average. Waiting a day may yield a better deal.`,
    best_rate: max,
    avg_rate: parseFloat(avg.toFixed(4)),
    spread_pct: parseFloat(spread.toFixed(2)),
  };
}

/**
 * GET /recommendation?currency=INR
 */
router.get("/", (req, res) => {
  const currency = (req.query.currency || "INR").toUpperCase();
  const allowed = ["INR", "PKR", "PHP"];
  if (!allowed.includes(currency)) {
    return res.status(400).json({ error: "Unsupported currency." });
  }

  const cacheKey = `rec_${currency}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  const result = { currency, ...buildRecommendation(currency) };
  cache.set(cacheKey, result, 1800); // cache 30 min
  res.json(result);
});

module.exports = router;
