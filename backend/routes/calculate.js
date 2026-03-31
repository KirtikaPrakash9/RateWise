"use strict";

const express = require("express");
const { calculate, loadRates } = require("../controllers/ratesController");

const router = express.Router();

const SUPPORTED_CURRENCIES = ["INR", "PKR", "PHP"];

/**
 * POST /calculate
 * Body: { amount_aed: number, currency: string, provider?: string }
 * Returns breakdown for one provider or all providers ranked.
 */
router.post("/", (req, res) => {
  const { amount_aed, currency, provider } = req.body;

  // Validate
  const amount = parseFloat(amount_aed);
  if (!amount_aed || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: "Invalid or missing amount_aed. Must be a positive number." });
  }

  const cur = (currency || "").toUpperCase();
  if (!SUPPORTED_CURRENCIES.includes(cur)) {
    return res.status(400).json({ error: `Unsupported currency. Use one of: ${SUPPORTED_CURRENCIES.join(", ")}` });
  }

  // Single provider
  if (provider) {
    const result = calculate(amount, cur, provider.toLowerCase());
    if (!result) return res.status(404).json({ error: "Provider not found." });
    if (result.error) return res.status(400).json(result);
    return res.json(result);
  }

  // All providers ranked
  const { providers } = loadRates();
  const results = Object.keys(providers)
    .map((key) => calculate(amount, cur, key))
    .filter(Boolean)
    .filter((r) => !r.error)
    .sort((a, b) => b.received_amount - a.received_amount);

  if (!results.length) {
    return res.status(404).json({ error: "No providers available for the requested currency." });
  }

  // Tag best/ok/expensive
  const max = results[0].received_amount;
  const min = results[results.length - 1].received_amount;
  const range = max - min || 1;
  const tagged = results.map((r, i) => ({
    ...r,
    rank: i + 1,
    tag: i === 0 ? "best" : (r.received_amount - min) / range >= 0.5 ? "ok" : "expensive",
  }));

  res.json({ currency: cur, send_amount: amount, results: tagged });
});

module.exports = router;
