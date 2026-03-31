"use strict";

const fs = require("fs");
const path = require("path");
const NodeCache = require("node-cache");

const CACHE_PATH = path.join(__dirname, "../../data/cache.json");
const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour in-memory cache

// ---------------------------------------------------------------------------
// Mock / fallback rates (mirrors scraper/scraper.py MOCK_RATES)
// ---------------------------------------------------------------------------
const MOCK_RATES = {
  al_ansari: {
    name: "Al Ansari Exchange",
    INR: { rate: 22.45, fee: 0, min: 100, max: 50000, promo: "Zero fees on transfers above 500 AED" },
    PKR: { rate: 76.20, fee: 10, min: 100, max: 50000, promo: null },
    PHP: { rate: 15.80, fee: 15, min: 200, max: 50000, promo: null },
  },
  uae_exchange: {
    name: "UAE Exchange",
    INR: { rate: 22.38, fee: 5, min: 200, max: 100000, promo: null },
    PKR: { rate: 76.05, fee: 15, min: 200, max: 100000, promo: null },
    PHP: { rate: 15.75, fee: 20, min: 200, max: 100000, promo: null },
  },
  lulu_exchange: {
    name: "Lulu Exchange",
    INR: { rate: 22.42, fee: 10, min: 100, max: 30000, promo: "Special rate for amounts above 1000 AED" },
    PKR: { rate: 76.15, fee: 12, min: 100, max: 30000, promo: null },
    PHP: { rate: 15.82, fee: 18, min: 100, max: 30000, promo: null },
  },
  western_union: {
    name: "Western Union",
    INR: { rate: 22.10, fee: 25, min: 50, max: 25000, promo: null },
    PKR: { rate: 75.80, fee: 20, min: 50, max: 25000, promo: null },
    PHP: { rate: 15.60, fee: 20, min: 50, max: 25000, promo: null },
  },
  wise: {
    name: "Wise",
    INR: { rate: 22.55, fee: 8, min: 50, max: 1000000, promo: "First transfer free" },
    PKR: { rate: 76.30, fee: 8, min: 50, max: 1000000, promo: null },
    PHP: { rate: 15.90, fee: 8, min: 50, max: 1000000, promo: null },
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Load rates from JSON cache file; fall back to mock if unavailable.
 */
function loadRates() {
  const cached = cache.get("rates");
  if (cached) return cached;

  let data;
  if (fs.existsSync(CACHE_PATH)) {
    try {
      const raw = fs.readFileSync(CACHE_PATH, "utf8");
      const parsed = JSON.parse(raw);
      data = { providers: parsed.providers, updated_at: parsed.updated_at, source: "file" };
    } catch {
      data = { providers: MOCK_RATES, updated_at: new Date().toISOString(), source: "mock" };
    }
  } else {
    data = { providers: MOCK_RATES, updated_at: new Date().toISOString(), source: "mock" };
  }

  cache.set("rates", data);
  return data;
}

/**
 * Calculate the received amount for a given amount/provider/currency.
 * Returns null if the provider or currency is not found.
 */
function calculate(amountAED, currency, providerKey) {
  const { providers } = loadRates();
  const provider = providers[providerKey];
  if (!provider) return null;

  const info = provider[currency];
  if (!info) return null;

  const netAmount = amountAED - info.fee;
  if (netAmount <= 0) return { error: "Amount is too small to cover the fee." };

  const receivedAmount = parseFloat((netAmount * info.rate).toFixed(2));
  const effectiveRate = parseFloat((receivedAmount / amountAED).toFixed(4));

  return {
    provider: provider.name,
    provider_key: providerKey,
    send_amount: amountAED,
    currency,
    rate: info.rate,
    fee: info.fee,
    received_amount: receivedAmount,
    effective_rate: effectiveRate,
    promo: info.promo || null,
  };
}

module.exports = { loadRates, calculate, cache };
