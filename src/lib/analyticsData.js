// Pure data-shaping helpers for the Analytics page. No React, no Chart.js —
// just turning raw containers / import history into the numbers the charts
// need. Kept separate from Analytics.jsx so the math can be read (and
// tested) without wading through JSX.

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function avg(nums) {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** Last `n` months as {key, date}, oldest first, ending with the current month. */
function lastNMonths(n, now = new Date()) {
  const months = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: monthKey(d), date: d });
  }
  return months;
}

/** Transit duration in days (etd → eta) for a container, or null if either date is missing/invalid. */
function transitDays(container) {
  const etd = parseDate(container.etd);
  const eta = parseDate(container.eta);
  if (!etd || !eta) return null;
  const d = daysBetween(etd, eta);
  return d >= 0 ? d : null;
}

// ─── KPIs ───────────────────────────────────────────────────────────────────

export function computeKpis(containers, now = new Date()) {
  const thisMonth = monthKey(now);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = monthKey(lastMonthDate);

  const containersOnFile = containers.length;
  const createdThisMonth = containers.filter(c => {
    const d = parseDate(c.created_at);
    return d && monthKey(d) === thisMonth;
  }).length;

  // Avg transit: last 30 days (by ETD) vs the 30 days before that.
  const cutoff30 = new Date(now); cutoff30.setDate(cutoff30.getDate() - 30);
  const cutoff60 = new Date(now); cutoff60.setDate(cutoff60.getDate() - 60);

  const allDurations = containers.map(transitDays).filter(d => d != null);
  const recentDurations = containers
    .filter(c => { const d = parseDate(c.etd); return d && d >= cutoff30; })
    .map(transitDays).filter(d => d != null);
  const priorDurations = containers
    .filter(c => { const d = parseDate(c.etd); return d && d >= cutoff60 && d < cutoff30; })
    .map(transitDays).filter(d => d != null);

  const avgTransitDays = avg(allDurations);
  const recentAvg = avg(recentDurations);
  const priorAvg = avg(priorDurations);
  const avgTransitDelta = (recentAvg != null && priorAvg != null) ? Math.round(recentAvg - priorAvg) : null;

  const customsCount = containers.filter(c => c.status === "customs").length;

  const deliveredThisMonth = containers.filter(c => {
    const d = parseDate(c.updated_at);
    return c.status === "delivered" && d && monthKey(d) === thisMonth;
  }).length;
  const deliveredLastMonth = containers.filter(c => {
    const d = parseDate(c.updated_at);
    return c.status === "delivered" && d && monthKey(d) === lastMonth;
  }).length;

  return {
    containersOnFile,
    createdThisMonth,
    avgTransitDays: avgTransitDays != null ? Math.round(avgTransitDays) : null,
    avgTransitDelta,
    customsCount,
    deliveredThisMonth,
    deliveredDelta: deliveredThisMonth - deliveredLastMonth,
  };
}

// ─── Monthly volume (bar) ───────────────────────────────────────────────────

export function computeMonthlyVolume(containers, now = new Date(), months = 6) {
  const buckets = lastNMonths(months, now);
  return buckets.map(({ key, date }) => ({
    key,
    date,
    count: containers.filter(c => {
      const d = parseDate(c.eta);
      return d && monthKey(d) === key;
    }).length,
  }));
}

// ─── Fleet status breakdown (donut) ─────────────────────────────────────────

export function computeStatusBreakdown(containers) {
  const order = ["in_transit", "customs", "arriving_soon", "delivered"];
  return order.map(status => ({
    status,
    count: containers.filter(c => c.status === status).length,
  }));
}

// ─── Lane performance ───────────────────────────────────────────────────────

export function computeLanePerformance(containers, now = new Date(), maxLanes = 4) {
  const cutoff30 = new Date(now); cutoff30.setDate(cutoff30.getDate() - 30);
  const cutoff60 = new Date(now); cutoff60.setDate(cutoff60.getDate() - 60);

  const origins = [...new Set(containers.map(c => (c.origin || "").trim()).filter(Boolean))];

  const lanes = origins.map(origin => {
    const inLane = containers.filter(c => (c.origin || "").trim() === origin);
    const durations = inLane.map(transitDays).filter(d => d != null);
    const avgDays = avg(durations);

    const recent = inLane
      .filter(c => { const d = parseDate(c.etd); return d && d >= cutoff30; })
      .map(transitDays).filter(d => d != null);
    const prior = inLane
      .filter(c => { const d = parseDate(c.etd); return d && d >= cutoff60 && d < cutoff30; })
      .map(transitDays).filter(d => d != null);
    const recentAvg = avg(recent);
    const priorAvg = avg(prior);

    return {
      origin,
      count: inLane.length,
      avgDays: avgDays != null ? Math.round(avgDays) : null,
      deltaDays: (recentAvg != null && priorAvg != null) ? Math.round(recentAvg - priorAvg) : null,
    };
  });

  return lanes
    .filter(l => l.avgDays != null)
    .sort((a, b) => b.count - a.count)
    .slice(0, maxLanes);
}

// ─── Transit trend (line) ───────────────────────────────────────────────────

export function computeTransitTrend(containers, now = new Date(), months = 6) {
  const buckets = lastNMonths(months, now);
  return buckets.map(({ key, date }) => {
    const inMonth = containers.filter(c => {
      const d = parseDate(c.etd);
      return d && monthKey(d) === key;
    });
    const durations = inMonth.map(transitDays).filter(d => d != null);
    const a = avg(durations);
    return { key, date, avgDays: a != null ? Math.round(a) : null };
  });
}

// ─── Recent activity ────────────────────────────────────────────────────────

function describeContainerEvent(c) {
  if (c.status === "delivered")   return { kind: "delivered" };
  if (c.status === "customs")     return { kind: "customs" };
  if (c.needsAttention)           return { kind: "attention" };
  if (c.status === "arriving_soon") return { kind: "arriving_soon" };
  return { kind: "in_transit" };
}

/** Merges recent container updates with import history into one timeline,
 * newest first, capped at `limit`. Returns raw data — Analytics.jsx maps
 * each entry to translated text at render time. */
export function computeRecentActivity(containers, importHistory, limit = 5) {
  const containerEvents = containers
    .map(c => {
      const at = parseDate(c.updated_at) || parseDate(c.created_at);
      if (!at) return null;
      return { source: "container", at, container: c, ...describeContainerEvent(c) };
    })
    .filter(Boolean);

  const importEvents = importHistory
    .map(h => {
      const at = parseDate((h.at || "").replace(" ", "T")) || parseDate(h.inserted_at);
      if (!at) return null;
      return { source: "import", at, history: h, kind: "import" };
    })
    .filter(Boolean);

  return [...containerEvents, ...importEvents]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, limit);
}
