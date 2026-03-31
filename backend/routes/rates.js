"use strict";

const express = require("express");
const { loadRates } = require("../controllers/ratesController");

const router = express.Router();

/**
 * GET /rates
 * Returns all latest rates for all providers and currencies.
 */
router.get("/", (req, res) => {
  const data = loadRates();
  res.json({
    updated_at: data.updated_at,
    source: data.source,
    providers: data.providers,
  });
});

/**
 * GET /rates/:currency
 * Returns rates for a specific currency (INR, PKR, PHP).
 */
router.get("/:currency", (req, res) => {
  const currency = req.params.currency.toUpperCase();
  const allowed = ["INR", "PKR", "PHP"];
  if (!allowed.includes(currency)) {
    return res.status(400).json({ error: "Unsupported currency. Use INR, PKR, or PHP." });
  }

  const { providers, updated_at, source } = loadRates();
  const result = {};
  for (const [key, provider] of Object.entries(providers)) {
    if (provider[currency]) {
      result[key] = {
        name: provider.name,
        ...provider[currency],
      };
    }
  }

  res.json({ currency, updated_at, source, rates: result });
});

module.exports = router;
