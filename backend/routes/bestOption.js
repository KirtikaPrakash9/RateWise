"use strict";

const express = require("express");
const { calculate, loadRates } = require("../controllers/ratesController");

const router = express.Router();

/**
 * GET /best-option?currency=INR&amount=1000
 * Returns the single best provider for the given currency and optional amount.
 */
router.get("/", (req, res) => {
  const currency = (req.query.currency || "INR").toUpperCase();
  const amount = parseFloat(req.query.amount) || 1000;

  const { providers } = loadRates();
  const results = Object.keys(providers)
    .map((key) => calculate(amount, currency, key))
    .filter(Boolean)
    .filter((r) => !r.error)
    .sort((a, b) => b.received_amount - a.received_amount);

  if (!results.length) {
    return res.status(404).json({ error: "No providers available." });
  }

  res.json({ currency, send_amount: amount, best: results[0], all: results });
});

module.exports = router;
