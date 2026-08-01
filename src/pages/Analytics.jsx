/**
 * Portivo — Analytics page
 * Place at: src/pages/Analytics.jsx
 *
 * All numbers here are computed from real data (containers + import
 * history via api/storage.js — Supabase when configured, localStorage
 * otherwise). See src/lib/analyticsData.js for the actual math; this
 * file is just fetching, translating, and rendering it.
 *
 * Run once: npm install chart.js
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { BarChart3 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import * as storage from "../api/storage";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import {
  computeKpis, computeMonthlyVolume, computeStatusBreakdown,
  computeLanePerformance, computeTransitTrend, computeRecentActivity,
} from "../lib/analyticsData";
import {
  pathGenerator, projection, countries, graticuleLines, TUNIS,
  PORT_COORDS, normalizePortName, useRoutePosition,
} from "../lib/worldMap";
Chart.register(...registerables);

const C = {
  ink:    "#0B2A3D",
  paper:  "#E2DCCB",
  teal:   "#2F7E6C",
  teals:  "#C7E0D8",
  amber:  "#C9912B",
  ambers: "#F0DDB3",
  coral:  "#D6492F",
  corals: "#F2C7BB",
  blue:   "#185FA5",
  blues:  "#B5D4F4",
  muted:  "#6E7F87",
  tonInk: "#DCE6EA",
};

const MONO = "'IBM Plex Mono', monospace";
const tickFont = { size: 10, family: MONO };

const MONTH_KEYS = [
  "monthJan", "monthFeb", "monthMar", "monthApr", "monthMay", "monthJun",
  "monthJul", "monthAug", "monthSep", "monthOct", "monthNov", "monthDec",
];
function monthLabel(date, t) { return t(`analytics.${MONTH_KEYS[date.getMonth()]}`); }

function pad(n) { return String(n).padStart(2, "0"); }
function mono(extra) { return { fontFamily: MONO, ...extra }; }

// ─── Real-data fetching ─────────────────────────────────────────────────────

function useAnalyticsSource() {
  const [containers, setContainers] = useState([]);
  const [importHistory, setImportHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [c, h] = await Promise.all([storage.getContainers(), storage.getImportHistory()]);
        if (!mounted) return;
        setContainers(c);
        setImportHistory(h);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    const unsubscribe = storage.onChange(() => load());
    return () => { mounted = false; unsubscribe(); };
  }, []);

  return { containers, importHistory, loading };
}

// ─── Translating the raw computed numbers into display shapes ──────────────

function buildKpis(raw, t) {
  const d = t("arrivals.dayAbbrev");

  const containersDelta = raw.createdThisMonth > 0
    ? { text: `↑ ${raw.createdThisMonth} ${t("analytics.thisMonth")}`, up: true }
    : { text: t("analytics.noNewThisMonth"), up: null };

  const avgTransitDelta = raw.avgTransitDelta != null
    ? {
        text: `${raw.avgTransitDelta < 0 ? "↓" : raw.avgTransitDelta > 0 ? "↑" : "·"} ${Math.abs(raw.avgTransitDelta)}${d} ${t("analytics.vsPrior30")}`,
        up: raw.avgTransitDelta < 0,
      }
    : { text: t("analytics.notEnoughData"), up: null };

  const deliveredDelta = raw.deliveredDelta !== 0
    ? { text: `${raw.deliveredDelta > 0 ? "↑" : "↓"} ${Math.abs(raw.deliveredDelta)} ${t("analytics.vsLastMonthCount")}`, up: raw.deliveredDelta > 0 }
    : { text: t("analytics.noChangeVsLastMonth"), up: null };

  return [
    { label: t("analytics.kpiContainersOnFile"),   val: pad(raw.containersOnFile), ...containersDelta,                        accent: C.teal   },
    { label: t("analytics.kpiAvgTransitTime"),      val: raw.avgTransitDays != null ? `${raw.avgTransitDays}${d}` : "—", ...avgTransitDelta,  accent: C.amber  },
    { label: t("analytics.kpiCustomsDelays"),       val: pad(raw.customsCount), text: t("analytics.currentlyInCustoms"), up: null, accent: C.coral  },
    { label: t("analytics.kpiDeliveredThisMonth"),  val: pad(raw.deliveredThisMonth), ...deliveredDelta,                       accent: C.tonInk },
  ];
}

const STATUS_META = {
  in_transit:    { color: C.teal,  bg: C.teals  },
  customs:       { color: C.amber, bg: C.ambers },
  arriving_soon: { color: C.ink,   bg: C.paper  },
  delivered:     { color: C.blue,  bg: C.blues  },
};
function buildStatusBreakdown(raw, t) {
  const labelKey = { in_transit: "inTransit", customs: "customs", arriving_soon: "arrivingSoon", delivered: "delivered" };
  return raw.map(s => ({ ...s, label: t(`containers.${labelKey[s.status]}`), ...STATUS_META[s.status] }));
}

const LANE_COLORS = [C.teal, C.amber, C.coral, C.blue];
function buildLanes(raw) {
  return raw.map((l, i) => ({ ...l, color: LANE_COLORS[i % LANE_COLORS.length] }));
}

function routeText(c) { return [c.origin, c.destination].filter(Boolean).join(" → "); }

function formatEventTime(date, language) {
  const now = new Date();
  const locale = language === "fr" ? "fr-FR" : "en-GB";
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

const ACTIVITY_STYLE = {
  ship:   { color: C.teal,  bg: C.teals  },
  alert:  { color: C.coral, bg: C.corals },
  check:  { color: C.teal,  bg: C.teals  },
  import: { color: C.amber, bg: C.ambers },
  clock:  { color: C.ink,   bg: C.paper  },
};

function buildActivity(raw, t, language) {
  return raw.map(entry => {
    let type, title, sub;
    if (entry.source === "import") {
      const h = entry.history;
      type = "import";
      title = t("analytics.activityImportedTitle").replace("{n}", h.ctr ?? 0);
      sub = h.filename || "";
    } else {
      const c = entry.container;
      sub = routeText(c);
      switch (entry.kind) {
        case "delivered":      type = "check"; title = `${c.number} ${t("containerDetail.deliveryDelivered").toLowerCase()}`; break;
        case "customs":        type = "alert"; title = `${c.number} ${t("analytics.activityEnteringCustoms")}`; break;
        case "attention":      type = "alert"; title = `${c.number} ${t("arrivals.needsAttentionBadge").toLowerCase()}`; break;
        case "arriving_soon":  type = "clock"; title = `${c.number} ${t("containers.arrivingSoon").toLowerCase()}`; break;
        default:                type = "ship";  title = `${c.number} ${t("containers.inTransit").toLowerCase()}`; break;
      }
    }
    return { ...ACTIVITY_STYLE[type], type, title, sub, time: formatEventTime(entry.at, language) };
  });
}

// ─── Chart hook ──────────────────────────────────────────────────────────────

function useChart(makeConfig, deps = []) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    chartRef.current = new Chart(canvasRef.current, makeConfig());
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return canvasRef;
}

// ─── Small UI primitives ─────────────────────────────────────────────────────

function Card({ children, style }) {
  return (
    <div style={{ background: C.paper, border: "1px solid rgba(11,42,61,.14)", padding: "28px 26px 24px", ...style }}>
      {children}
    </div>
  );
}

function CardHead({ title, sub, iconBg, iconEl }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid rgba(11,42,61,.1)" }}>
      <div>
        <p style={{ fontFamily: "'Fraunces',serif", fontWeight: 500, fontSize: "1.1rem", color: "#1C2B33", marginBottom: 3 }}>{title}</p>
        <p style={mono({ fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: C.muted })}>{sub}</p>
      </div>
      <div style={{ width: 32, height: 32, borderRadius: 6, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {iconEl}
      </div>
    </div>
  );
}

const SvgWrap = ({ children, color, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const IBar    = ({ c }) => <SvgWrap color={c}><path d="M4 20V10"/><path d="M11 20V4"/><path d="M18 20v-7"/><path d="M2 20h20"/></SvgWrap>;
const IClock  = ({ c }) => <SvgWrap color={c}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></SvgWrap>;
const ITrend  = ({ c }) => <SvgWrap color={c}><path d="M22 7l-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></SvgWrap>;
const ILine   = ({ c }) => <SvgWrap color={c}><path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-6"/></SvgWrap>;
const IFile   = ({ c }) => <SvgWrap color={c}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></SvgWrap>;
const IShip   = () => <SvgWrap><path d="M3 16h18l-2 4H5l-2-4Z"/><path d="M6 16V9h8l3 4"/><path d="M10 9V4h2v5"/></SvgWrap>;
const IAlert  = () => <SvgWrap><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></SvgWrap>;
const ICheck  = () => <SvgWrap><polyline points="20 6 9 17 4 12"/></SvgWrap>;
const IImport = () => <SvgWrap><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></SvgWrap>;

const EVENT_ICONS = { ship: <IShip />, alert: <IAlert />, check: <ICheck />, import: <IImport />, clock: <IClock c="currentColor" /> };

// ─── Cards ────────────────────────────────────────────────────────────────────

function Hero({ kpis }) {
  const { t } = useLanguage();
  return (
    <div style={{ position: "relative", height: 560, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <img
        src="https://plus.unsplash.com/premium_photo-1754652424539-93fd34c23b1f?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=1400&q=80&auto=format&fit=crop"
        alt="Aerial view of a container port terminal"
        onError={e => { e.target.src = "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=1400&q=80&auto=format&fit=crop"; }}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,32,48,.3) 0%, rgba(8,32,48,.6) 50%, rgba(8,32,48,.96) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(11,42,61,.25)" }} />
      <div style={{ position: "relative", zIndex: 2, padding: "0 52px" }}>
        <p style={mono({ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: C.teals, marginBottom: 12 })}>
          {t("analytics.heroEyebrow")}
        </p>
        <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: "clamp(2.6rem,6vw,4.6rem)", lineHeight: .95, letterSpacing: "-.02em", color: C.tonInk, marginBottom: 12 }}>
          {t("analytics.title")}
        </h1>
        <p style={{ fontFamily: "'Fraunces',serif", fontWeight: 300, fontSize: "clamp(.88rem,1.5vw,1.1rem)", lineHeight: 1.6, color: "rgba(220,230,234,.72)", maxWidth: "44ch" }}>
          {t("analytics.heroSubtitle")}
        </p>
      </div>
      <div style={{ position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: "repeat(4,1fr)", marginTop: 28, borderTop: "1px solid rgba(255,255,255,.1)" }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ padding: "18px 28px 22px", borderRight: i < 3 ? "1px solid rgba(255,255,255,.08)" : "none", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 2, background: k.accent }} />
            <div style={mono({ fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(111,139,156,.8)", marginBottom: 5 })}>{k.label}</div>
            <div style={mono({ fontSize: "clamp(1.4rem,2.8vw,1.9rem)", fontWeight: 700, color: C.tonInk, lineHeight: 1, marginBottom: 3 })}>{k.val}</div>
            <div style={mono({ fontSize: 10, color: k.up === true ? "#4dcca0" : k.up === false ? "#e07060" : "rgba(111,139,156,.8)" })}>{k.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarCard({ monthlyVolume }) {
  const { t } = useLanguage();
  const labels = monthlyVolume.map(m => monthLabel(m.date, t));
  const data   = monthlyVolume.map(m => m.count);
  const ref = useChart(() => ({
    type: "bar",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: data.map((_, i) => i === data.length - 1 ? C.teal : "rgba(11,42,61,.12)"),
        borderColor:      data.map((_, i) => i === data.length - 1 ? C.teal : "rgba(11,42,61,.18)"),
        borderWidth: 1, borderRadius: 2,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.raw} ${t("analytics.barTooltipSuffix")}` } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: tickFont, color: C.muted } },
        y: { beginAtZero: true, grid: { color: "rgba(11,42,61,.06)" }, ticks: { font: tickFont, color: C.muted, precision: 0 }, border: { display: false } },
      },
    },
  }), [t, JSON.stringify(data)]);
  return (
    <Card>
      <CardHead title={t("analytics.barCardTitle")} sub={t("analytics.barCardSub")} iconBg="rgba(47,126,108,.12)" iconEl={<IBar c={C.teal} />} />
      <div style={{ height: 190, position: "relative" }}><canvas ref={ref} /></div>
    </Card>
  );
}

function DonutCard({ statusBreakdown }) {
  const { t } = useLanguage();
  const total = statusBreakdown.reduce((a, s) => a + s.count, 0);
  const ref = useChart(() => ({
    type: "doughnut",
    data: {
      labels: statusBreakdown.map(s => s.label),
      datasets: [{ data: statusBreakdown.map(s => s.count), backgroundColor: statusBreakdown.map(s => s.color), borderWidth: 3, borderColor: C.paper, hoverOffset: 4 }],
    },
    options: { responsive: false, cutout: "68%", plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.label}: ${c.raw}` } } } },
  }), [t, JSON.stringify(statusBreakdown.map(s => s.count))]);
  return (
    <Card>
      <CardHead title={t("analytics.donutCardTitle")} sub={t("analytics.donutCardSub")} iconBg="rgba(214,73,47,.12)" iconEl={<IClock c={C.coral} />} />
      <div style={{ display: "grid", gridTemplateColumns: "148px 1fr", gap: 22, alignItems: "center" }}>
        <div style={{ position: "relative", width: 148, height: 148, flexShrink: 0 }}>
          <canvas ref={ref} width={148} height={148} style={{ width: 148, height: 148 }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <span style={mono({ fontSize: 24, fontWeight: 700, color: C.ink, lineHeight: 1 })}>{total}</span>
            <span style={mono({ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: C.muted, marginTop: 3 })}>{t("analytics.donutActiveLabel")}</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {statusBreakdown.map(s => {
            const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
            return (
              <div key={s.status} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={mono({ fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase", color: "#1C2B33", flex: 1 })}>{s.label}</span>
                    <span style={mono({ fontSize: 12, fontWeight: 700, color: C.ink })}>{s.count}</span>
                    <span style={mono({ fontSize: 9, color: C.muted })}>{pct}%</span>
                  </div>
                  <div style={{ height: 2, background: "rgba(11,42,61,.1)", borderRadius: 1, overflow: "hidden", marginTop: 3 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: s.color, borderRadius: 1 }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

/* ── Small moving dot animating a lane's route, reusing the shared hook ── */
function LaneRouteDot({ from, to, color, duration }) {
  const [x, y] = useRoutePosition(from, to, duration, 0);
  return <circle cx={x} cy={y} r={4} fill={color} stroke="#fff" strokeWidth={1.2} />;
}

/* ── Compact map plotting real lanes (recognized ports only) on the same
 * projection/topology used by Home's hero globe, imported from
 * lib/worldMap so both stay geographically and visually consistent. ── */
function LaneMap({ lanes }) {
  const routes = lanes
    .map(l => ({ ...l, coords: PORT_COORDS[normalizePortName(l.origin)] }))
    .filter(l => l.coords);

  if (routes.length === 0) return null;

  return (
    <div className="an-lane-map">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path d={pathGenerator(graticuleLines)} fill="none" stroke="rgba(11,42,61,.05)" strokeWidth={1} />
        {countries.map((country, i) => (
          <path key={country.id ?? i} d={pathGenerator(country)} fill="rgba(11,42,61,.055)" stroke="rgba(11,42,61,.13)" strokeWidth={0.6} />
        ))}

        {routes.map(r => (
          <path
            key={r.origin}
            d={pathGenerator({ type: "LineString", coordinates: [r.coords, TUNIS] })}
            fill="none" stroke={r.color} strokeWidth={2} strokeDasharray="1 7" strokeLinecap="round" opacity={0.75}
          />
        ))}

        {routes.map(r => {
          const [ox, oy] = projection(r.coords);
          return (
            <g key={r.origin}>
              <circle cx={ox} cy={oy} r={5} fill={r.color} opacity={0.9} />
              <LaneRouteDot from={r.coords} to={TUNIS} color={r.color} duration={10 + r.avgDays / 2} />
            </g>
          );
        })}

        {(() => {
          const [x, y] = projection(TUNIS);
          return (
            <g transform={`translate(${x}, ${y})`}>
              <circle className="an-tunis-ring" r={6} fill={C.coral} opacity={0.45} />
              <circle r={5} fill={C.coral} stroke="#fff" strokeWidth={1.5} />
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

function LaneCard({ lanes }) {
  const { t } = useLanguage();
  const cols = "10px 110px 1fr 56px 66px";
  const thSt = mono({ fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: C.muted });
  const dAbbrev = t("arrivals.dayAbbrev");
  const maxAvg = Math.max(1, ...lanes.map(l => l.avgDays));
  return (
    <Card>
      <CardHead title={t("analytics.laneCardTitle")} sub={t("analytics.laneCardSub")} iconBg="rgba(201,145,43,.12)" iconEl={<ITrend c={C.amber} />} />
      {lanes.length === 0 ? (
        <p style={mono({ fontSize: 11.5, color: C.muted, padding: "8px 0 4px" })}>{t("analytics.laneNoData")}</p>
      ) : (
        <>
          <LaneMap lanes={lanes} />
          <div style={{ display: "grid", gridTemplateColumns: cols, gap: 14, paddingBottom: 10, borderBottom: "1px solid rgba(11,42,61,.1)", marginBottom: 2 }}>
            <span /><span style={thSt}>{t("analytics.laneColOrigin")}</span><span style={thSt}>{t("analytics.laneColProgress")}</span>
            <span style={{ ...thSt, textAlign: "right" }}>{t("analytics.laneColAvg")}</span>
            <span style={{ ...thSt, textAlign: "right" }}>{t("analytics.laneColDeltaPeriod")}</span>
          </div>
          {lanes.map(l => {
            const d = l.deltaDays;
            const deltaColor = d == null ? C.muted : d < 0 ? C.teal : d > 0 ? C.coral : C.muted;
            const deltaText  = d == null ? "—" : d < 0 ? `↓ ${Math.abs(d)}${dAbbrev}` : d > 0 ? `↑ ${d}${dAbbrev}` : "—";
            return (
              <div key={l.origin} style={{ display: "grid", gridTemplateColumns: cols, gap: 14, alignItems: "center", padding: "13px 0", borderBottom: "1px solid rgba(11,42,61,.05)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                <span style={mono({ fontSize: 11, fontWeight: 500, letterSpacing: ".08em", textTransform: "uppercase", color: "#1C2B33" })}>{l.origin}</span>
                <div style={{ height: 4, background: "rgba(11,42,61,.09)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(l.avgDays / maxAvg) * 100}%`, background: l.color, borderRadius: 2 }} />
                </div>
                <span style={mono({ fontSize: 13, fontWeight: 700, color: C.ink, textAlign: "right" })}>{l.avgDays}{dAbbrev}</span>
                <span style={mono({ fontSize: 10, color: deltaColor, textAlign: "right" })}>{deltaText}</span>
              </div>
            );
          })}
        </>
      )}
    </Card>
  );
}

function TrendCard({ trend }) {
  const { t } = useLanguage();
  const labels = trend.map(m => monthLabel(m.date, t));
  const data   = trend.map(m => m.avgDays);
  const ref = useChart(() => ({
    type: "line",
    data: {
      labels,
      datasets: [{
        data, borderColor: C.teal, borderWidth: 2,
        pointBackgroundColor: C.teal, pointRadius: 3, pointHoverRadius: 5,
        fill: true, spanGaps: true,
        backgroundColor: ctx => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 170);
          g.addColorStop(0, C.teal + "38"); g.addColorStop(1, C.teal + "00"); return g;
        },
        tension: .35,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.raw == null ? t("analytics.notEnoughData") : `${c.raw} ${t("analytics.trendTooltipSuffix")}` } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: tickFont, color: C.muted } },
        y: { beginAtZero: true, grid: { color: "rgba(11,42,61,.06)" }, ticks: { font: tickFont, color: C.muted, precision: 0 }, border: { display: false } },
      },
    },
  }), [t, JSON.stringify(data)]);
  return (
    <Card>
      <CardHead title={t("analytics.trendCardTitle")} sub={t("analytics.trendCardSub")} iconBg="rgba(11,42,61,.08)" iconEl={<ILine c={C.ink} />} />
      <div style={{ height: 170, position: "relative" }}><canvas ref={ref} /></div>
    </Card>
  );
}

function ActivityCard({ activity }) {
  const { t } = useLanguage();
  return (
    <Card>
      <CardHead title={t("analytics.activityCardTitle")} sub={t("analytics.activityCardSub")} iconBg="rgba(47,126,108,.12)" iconEl={<IFile c={C.teal} />} />
      {activity.length === 0 ? (
        <p style={mono({ fontSize: 11.5, color: C.muted, padding: "8px 0 4px" })}>{t("analytics.activityNoData")}</p>
      ) : (
        <div>
          {activity.map((e, i) => (
            <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start", padding: "11px 0", borderBottom: i < activity.length - 1 ? "1px solid rgba(11,42,61,.06)" : "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: e.bg, color: e.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {EVENT_ICONS[e.type]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: "#1C2B33", marginBottom: 2 }}>{e.title}</div>
                {e.sub && <div style={mono({ fontSize: 9, letterSpacing: ".06em", color: C.muted })}>{e.sub}</div>}
              </div>
              <div style={mono({ fontSize: 9, color: C.muted, flexShrink: 0, marginTop: 2 })}>{e.time}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Analytics() {
  const { t, language } = useLanguage();
  const { containers, importHistory, loading } = useAnalyticsSource();

  const kpis             = useMemo(() => buildKpis(computeKpis(containers), t), [containers, t]);
  const monthlyVolume    = useMemo(() => computeMonthlyVolume(containers), [containers]);
  const statusBreakdown  = useMemo(() => buildStatusBreakdown(computeStatusBreakdown(containers), t), [containers, t]);
  const lanes            = useMemo(() => buildLanes(computeLanePerformance(containers)), [containers]);
  const trend            = useMemo(() => computeTransitTrend(containers), [containers]);
  const activity         = useMemo(
    () => buildActivity(computeRecentActivity(containers, importHistory), t, language),
    [containers, importHistory, t, language]
  );

  const row2 = { display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 20 };

  return (
    <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", background: "#ECE7DA", WebkitFontSmoothing: "antialiased" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (max-width: 860px) { .an-row2 { grid-template-columns: 1fr !important; } }
        .an-lane-map { width: 100%; height: 190px; margin-bottom: 16px; border-radius: 8px; overflow: hidden; background: rgba(11,42,61,.02); }
        .an-lane-map svg { width: 100%; height: 100%; display: block; }
        .an-tunis-ring { animation: an-pulse 3.2s ease-out infinite; transform-origin: center; transform-box: fill-box; }
        @keyframes an-pulse { 0% { transform: scale(0.6); opacity: 0.6; } 100% { transform: scale(3); opacity: 0; } }
      `}</style>

      <Hero kpis={kpis} />

      <div style={{ padding: "44px 52px", maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        {loading ? (
          <LoadingState label={t("analytics.loadingAnalytics")} />
        ) : containers.length === 0 ? (
          <Card style={{ padding: "8px 20px" }}>
            <EmptyState icon={BarChart3} title={t("analytics.noDataYet")} />
          </Card>
        ) : (
          <>
            <div className="an-row2" style={row2}>
              <BarCard monthlyVolume={monthlyVolume} />
              <DonutCard statusBreakdown={statusBreakdown} />
            </div>
            <LaneCard lanes={lanes} />
            <div className="an-row2" style={row2}>
              <TrendCard trend={trend} />
              <ActivityCard activity={activity} />
            </div>
          </>
        )}
      </div>

      <footer style={{ background: C.ink, color: "#6F8B9C", padding: "32px 52px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, fontFamily: MONO, fontSize: 10, letterSpacing: ".1em" }}>
        <span style={{ fontFamily: "'Fraunces',serif", fontSize: ".95rem", color: C.tonInk, letterSpacing: ".04em" }}>Portivo</span>
        <span style={{ textTransform: "uppercase" }}>{t("analytics.footerText")}</span>
      </footer>
    </div>
  );
}