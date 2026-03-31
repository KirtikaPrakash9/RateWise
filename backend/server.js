"use strict";

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");
const ratesRouter = require("./routes/rates");
const calculateRouter = require("./routes/calculate");
const recommendationRouter = require("./routes/recommendation");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Basic rate limiter: max 120 req / minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ── Routes ────────────────────────────────────────────────────────────────
app.use("/rates", ratesRouter);
app.use("/calculate", calculateRouter);
app.use("/best-option", require("./routes/bestOption"));
app.use("/trend", require("./routes/trend"));
app.use("/recommendation", recommendationRouter);

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// 404 handler
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`RateWise AI backend running on port ${PORT}`);
});

module.exports = app;
