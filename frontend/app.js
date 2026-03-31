/* ================================================================
   RateWise AI – Frontend App (Vanilla JS, zero dependencies)
   ================================================================ */

"use strict";

// ── Configuration ────────────────────────────────────────────────
const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? "http://localhost:3000"
  : "/api"; // adjust for your production deployment

const CACHE_KEY = "ratewise_last_rates";
const CACHE_TS_KEY = "ratewise_cache_ts";

// ── i18n ─────────────────────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    hero_title: "Send Money Smarter",
    hero_sub: "Compare real-time rates & fees. Know exactly how much your family receives.",
    label_amount: "Amount (AED)",
    label_currency: "Send to",
    btn_check: "Check Best Option",
    label_best: "🏆 Best Option",
    label_compare: "All Providers",
    label_trend: "Rate Trend (14 days)",
    label_alert: "🔔 Rate Alert",
    alert_desc: "Get notified when your target rate is reached.",
    btn_alert: "Set Alert",
    offline_msg: "⚠️ You're offline. Showing last cached rates.",
    footer_disclaimer: "Rates are indicative. Always verify with the provider before transferring.",
    send_now: "Send Now",
    wait: "Wait",
    fee: "Fee",
    rate: "Rate",
    received: "Received",
    confidence: "Confidence",
  },
  hi: {
    hero_title: "समझदारी से पैसे भेजें",
    hero_sub: "असली दरें और शुल्क तुलना करें। जानिए परिवार को कितना मिलेगा।",
    label_amount: "राशि (AED)",
    label_currency: "भेजें",
    btn_check: "सर्वोत्तम विकल्प जांचें",
    label_best: "🏆 सर्वोत्तम विकल्प",
    label_compare: "सभी प्रदाता",
    label_trend: "दर प्रवृत्ति (14 दिन)",
    label_alert: "🔔 दर अलर्ट",
    alert_desc: "जब आपकी लक्ष्य दर पहुंचे तो सूचित करें।",
    btn_alert: "अलर्ट सेट करें",
    offline_msg: "⚠️ आप ऑफ़लाइन हैं। अंतिम कैश दरें दिखाई जा रही हैं।",
    footer_disclaimer: "दरें सांकेतिक हैं। स्थानांतरण से पहले प्रदाता से सत्यापित करें।",
    send_now: "अभी भेजें",
    wait: "प्रतीक्षा करें",
    fee: "शुल्क",
    rate: "दर",
    received: "प्राप्त",
    confidence: "विश्वास",
  },
  ur: {
    hero_title: "ذہانت سے پیسے بھیجیں",
    hero_sub: "حقیقی شرحیں اور فیس کا موازنہ کریں۔ جانیں کہ خاندان کو کتنا ملے گا۔",
    label_amount: "رقم (AED)",
    label_currency: "بھیجیں",
    btn_check: "بہترین آپشن چیک کریں",
    label_best: "🏆 بہترین آپشن",
    label_compare: "تمام فراہم کنندگان",
    label_trend: "شرح رجحان (14 دن)",
    label_alert: "🔔 شرح الرٹ",
    alert_desc: "جب آپ کی ہدف شرح پہنچے تو مطلع کریں۔",
    btn_alert: "الرٹ سیٹ کریں",
    offline_msg: "⚠️ آپ آف لائن ہیں۔ آخری کیشڈ شرحیں دکھائی جا رہی ہیں۔",
    footer_disclaimer: "شرحیں اشارہ ہیں۔ منتقلی سے پہلے فراہم کنندہ سے تصدیق کریں۔",
    send_now: "ابھی بھیجیں",
    wait: "انتظار کریں",
    fee: "فیس",
    rate: "شرح",
    received: "وصول",
    confidence: "اعتماد",
  },
  tl: {
    hero_title: "Mag-padala ng Pera nang Mas Matalino",
    hero_sub: "Ikumpara ang mga rate at bayarin. Malaman kung magkano ang matatanggap ng pamilya.",
    label_amount: "Halaga (AED)",
    label_currency: "Ipadala sa",
    btn_check: "Hanapin ang Pinakamahusay",
    label_best: "🏆 Pinakamahusay",
    label_compare: "Lahat ng Provider",
    label_trend: "Trend ng Rate (14 araw)",
    label_alert: "🔔 Alerto sa Rate",
    alert_desc: "Abisuhan kapag naabot ang iyong target na rate.",
    btn_alert: "Itakda ang Alerto",
    offline_msg: "⚠️ Naka-offline ka. Nagpapakita ng huling mga naka-cache na rate.",
    footer_disclaimer: "Ang mga rate ay nagbibigay-kaalaman lamang. Kumpirmahin sa provider bago mag-transfer.",
    send_now: "Ipadala Ngayon",
    wait: "Maghintay",
    fee: "Bayarin",
    rate: "Rate",
    received: "Matatanggap",
    confidence: "Kumpiyansa",
  },
  ar: {
    hero_title: "أرسل الأموال بذكاء",
    hero_sub: "قارن الأسعار الحقيقية والرسوم. اعرف كم سيستلم عائلتك بالضبط.",
    label_amount: "المبلغ (درهم)",
    label_currency: "إرسال إلى",
    btn_check: "ابحث عن أفضل خيار",
    label_best: "🏆 أفضل خيار",
    label_compare: "جميع مزودي الخدمة",
    label_trend: "اتجاه السعر (14 يومًا)",
    label_alert: "🔔 تنبيه السعر",
    alert_desc: "احصل على إشعار عند الوصول إلى السعر المستهدف.",
    btn_alert: "ضبط التنبيه",
    offline_msg: "⚠️ أنت غير متصل. عرض آخر الأسعار المحفوظة.",
    footer_disclaimer: "الأسعار استرشادية. تحقق دائمًا من مزود الخدمة قبل التحويل.",
    send_now: "أرسل الآن",
    wait: "انتظر",
    fee: "رسوم",
    rate: "سعر",
    received: "المُستلَم",
    confidence: "الثقة",
  },
};

let currentLang = "en";

function t(key) {
  return (TRANSLATIONS[currentLang] || TRANSLATIONS.en)[key] || key;
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  // RTL languages
  document.documentElement.dir = ["ar", "ur"].includes(currentLang) ? "rtl" : "ltr";
}

// ── DOM Helpers ──────────────────────────────────────────────────
const $  = (id) => document.getElementById(id);
const show = (id) => $(id).classList.remove("hidden");
const hide = (id) => $(id).classList.add("hidden");

function formatNumber(n, currency) {
  return new Intl.NumberFormat(currentLang === "ar" ? "ar-AE" : "en-AE", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(n) + " " + currency;
}

// ── API ──────────────────────────────────────────────────────────
async function apiFetch(path) {
  const resp = await fetch(API_BASE + path, { signal: AbortSignal.timeout(8000) });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

// ── Offline support ──────────────────────────────────────────────
function saveToLocalCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(CACHE_TS_KEY, Date.now());
  } catch { /* storage full */ }
}
function loadFromLocalCache(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

// ── Mini canvas chart ────────────────────────────────────────────
function drawTrendChart(canvas, dataPoints) {
  const ctx = canvas.getContext("2d");
  const W = canvas.offsetWidth || 300;
  const H = canvas.height;
  canvas.width = W;
  ctx.clearRect(0, 0, W, H);

  if (!dataPoints.length) {
    ctx.fillStyle = "#6b7280";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No historical data yet", W / 2, H / 2);
    return;
  }

  const vals = dataPoints.map((d) => d.avg_rate);
  const min  = Math.min(...vals) * 0.9995;
  const max  = Math.max(...vals) * 1.0005;
  const range = max - min || 1;

  const pad = { top: 10, bottom: 20, left: 10, right: 10 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const xOf = (i) => pad.left + (i / (vals.length - 1 || 1)) * plotW;
  const yOf = (v) => pad.top + plotH - ((v - min) / range) * plotH;

  // Area fill
  ctx.beginPath();
  ctx.moveTo(xOf(0), yOf(vals[0]));
  vals.forEach((v, i) => ctx.lineTo(xOf(i), yOf(v)));
  ctx.lineTo(xOf(vals.length - 1), H - pad.bottom);
  ctx.lineTo(xOf(0), H - pad.bottom);
  ctx.closePath();
  ctx.fillStyle = "rgba(26, 115, 232, 0.12)";
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = "#1a73e8";
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.moveTo(xOf(0), yOf(vals[0]));
  vals.forEach((v, i) => ctx.lineTo(xOf(i), yOf(v)));
  ctx.stroke();

  // End dot
  const lastX = xOf(vals.length - 1);
  const lastY = yOf(vals[vals.length - 1]);
  ctx.beginPath();
  ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#1a73e8";
  ctx.fill();

  // Last label
  ctx.fillStyle = "#1a73e8";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(vals[vals.length - 1].toFixed(2), lastX, lastY - 7);
}

// ── HTML escaping helper (prevents XSS) ─────────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


async function checkRates() {
  const rawAmount = $("amountInput").value;
  const amount    = parseFloat(rawAmount);
  const currency  = $("currencySelect").value;

  if (!amount || amount <= 0) {
    alert("Please enter a valid amount.");
    return;
  }

  const btn = $("checkBtn");
  btn.classList.add("loading");
  btn.disabled = true;
  btn.textContent = "…";

  try {
    // Parallel fetch: calculate + recommendation + trend
    const [calcData, recData, trendData] = await Promise.allSettled([
      fetch(`${API_BASE}/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_aed: amount, currency }),
        signal: AbortSignal.timeout(8000),
      }).then((r) => r.ok ? r.json() : null).catch(() => null),
      apiFetch(`/recommendation?currency=${currency}`).catch(() => null),
      apiFetch(`/trend?currency=${currency}&days=14`).catch(() => null),
    ]);

    const calc = calcData.status === "fulfilled" ? calcData.value : null;
    const rec  = recData.status  === "fulfilled" ? recData.value  : null;
    const trend= trendData.status=== "fulfilled" ? trendData.value: null;

    if (calc) {
      saveToLocalCache(CACHE_KEY, { calc, rec, trend, amount, currency });
      renderResults(calc, rec, trend, amount, currency);
      hide("offlineBanner");
    } else {
      // Try local cache
      const cached = loadFromLocalCache(CACHE_KEY);
      if (cached) {
        renderResults(cached.calc, cached.rec, cached.trend, amount, currency);
        show("offlineBanner");
      } else {
        alert("Unable to fetch rates. Please check your connection.");
      }
    }
  } finally {
    btn.classList.remove("loading");
    btn.disabled = false;
    btn.textContent = t("btn_check");
  }
}

function renderResults(calc, rec, trend, amount, currency) {
  // Best result
  const best = calc.results[0];
  $("bestProvider").textContent  = best.provider;
  $("bestAmount").textContent    = formatNumber(best.received_amount, currency);
  $("bestDetails").textContent   =
    `${t("rate")}: ${best.rate} · ${t("fee")}: ${best.fee} AED · Effective: ${best.effective_rate}`;
  show("bestResultSection");

  // Recommendation
  if (rec) {
    const badge   = $("recommendationBadge");
    const isSend  = rec.recommendation === "SEND NOW";
    badge.className = "recommendation-badge " + (isSend ? "send-now" : "wait");
    badge.innerHTML = `
      <span class="rec-icon">${isSend ? "🚀" : "⏳"}</span>
      <span class="rec-text">
        <div class="rec-title">${esc(t(isSend ? "send_now" : "wait"))}</div>
        <div class="rec-reason">${esc(rec.reason)}</div>
      </span>
      <span class="rec-confidence">${esc(String(rec.confidence))}%</span>
    `;
    show("recommendationSection");
  }

  // Comparison table
  const table = $("comparisonTable");
  table.innerHTML = "";
  calc.results.forEach((r) => {
    const div = document.createElement("div");
    div.className = `provider-row ${esc(r.tag)}`;
    div.innerHTML = `
      <div class="prov-left">
        <span class="prov-name">${esc(r.provider)}</span>
        <span class="prov-fee">${esc(t("fee"))}: ${esc(r.fee)} AED</span>
        ${r.promo ? `<span class="prov-promo">✨ ${esc(r.promo)}</span>` : ""}
      </div>
      <div class="prov-right">
        <div class="prov-amount">${esc(formatNumber(r.received_amount, currency))}</div>
        <div class="prov-rate">${esc(t("rate"))}: ${esc(r.rate)}</div>
        <span class="prov-tag tag-${esc(r.tag)}">${r.tag === "best" ? "🏆 " + esc(r.tag) : esc(r.tag)}</span>
      </div>
    `;
    table.appendChild(div);
  });
  show("comparisonSection");

  // Trend chart
  if (trend && trend.trend) {
    const canvas = $("trendChart");
    drawTrendChart(canvas, trend.trend);
    $("trendNote").textContent = trend.trend.length
      ? `${trend.trend.length} data point(s) available`
      : "No historical data yet — run the scraper daily to build a trend.";
    show("trendSection");
  }

  // Updated footer
  $("lastUpdated").textContent = `Last updated: ${new Date().toLocaleString()}`;
}

// ── Alert form ───────────────────────────────────────────────────
function setupAlert() {
  const rate  = parseFloat($("targetRate").value);
  const email = $("alertEmail").value.trim();
  const msg   = $("alertMsg");

  if (!rate || rate <= 0 || !email.includes("@")) {
    msg.className = "alert-msg error";
    msg.textContent = "Please enter a valid rate and email address.";
    show("alertMsg");
    return;
  }

  // Store in localStorage (in production this would call a backend endpoint)
  const alerts = JSON.parse(localStorage.getItem("ratewise_alerts") || "[]");
  alerts.push({ rate, email, currency: $("currencySelect").value, created: Date.now() });
  localStorage.setItem("ratewise_alerts", JSON.stringify(alerts));

  msg.className = "alert-msg success";
  msg.textContent = `✅ Alert set! We'll notify ${email} when the rate reaches ${rate}.`;
  show("alertMsg");
  $("targetRate").value = "";
  $("alertEmail").value = "";
}

// ── Offline detection ────────────────────────────────────────────
window.addEventListener("offline", () => show("offlineBanner"));
window.addEventListener("online",  () => hide("offlineBanner"));
if (!navigator.onLine) show("offlineBanner");

// ── Event listeners ──────────────────────────────────────────────
$("checkBtn").addEventListener("click", checkRates);
$("alertBtn").addEventListener("click", setupAlert);
$("amountInput").addEventListener("keydown", (e) => { if (e.key === "Enter") checkRates(); });

$("langSwitcher").addEventListener("click", (e) => {
  const btn = e.target.closest(".lang-btn");
  if (!btn) return;
  currentLang = btn.dataset.lang;
  document.querySelectorAll(".lang-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  applyTranslations();
});

// ── PWA Service Worker ───────────────────────────────────────────
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

// ── Init ─────────────────────────────────────────────────────────
applyTranslations();
