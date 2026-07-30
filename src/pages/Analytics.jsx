/**
 * Portivo — Analytics page
 * Place at: src/pages/Analytics.jsx
 *
 * Run once: npm install chart.js
 */

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import { useLanguage } from "../context/LanguageContext";
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
  muted:  "#6E7F87",
  tonInk: "#DCE6EA",
};

function getMonths(t) {
  return [
    t("analytics.monthJan"), t("analytics.monthFeb"), t("analytics.monthMar"),
    t("analytics.monthApr"), t("analytics.monthMay"), t("analytics.monthJun"),
  ];
}
const VOLUMES = [4, 6, 5, 8, 7, 12];
const TREND   = [31, 29, 30, 28, 27, 24];

function getStatuses(t) {
  return [
    { label: t("containers.inTransit"),        count: 6, color: C.teal,  bg: C.teals  },
    { label: t("containers.customs"),           count: 2, color: C.amber, bg: C.ambers },
    { label: t("containers.arrivingSoon"),      count: 3, color: C.ink,   bg: C.paper  },
    { label: t("arrivals.needsAttentionBadge"), count: 2, color: C.coral, bg: C.corals },
  ];
}
function getTotal(statuses) { return statuses.reduce((a, s) => a + s.count, 0); }

const LANES = [
  { orig: "Shanghai", avg: 28, prev: 31, color: C.teal  },
  { orig: "Genoa",    avg: 6,  prev: 7,  color: C.amber },
  { orig: "Valencia", avg: 9,  prev: 9,  color: C.coral },
];

function getEvents(t) {
  return [
    { type: "ship",   color: C.teal,  bg: C.teals,  title: t("analytics.event1Title"), sub: t("analytics.event1Sub"), time: "14:22"  },
    { type: "alert",  color: C.coral, bg: C.corals, title: t("analytics.event2Title"), sub: t("analytics.event2Sub"), time: "11:05"  },
    { type: "check",  color: C.teal,  bg: C.teals,  title: t("analytics.event3Title"), sub: t("analytics.event3Sub"), time: "09:47"  },
    { type: "import", color: C.amber, bg: C.ambers, title: t("analytics.event4Title"), sub: "containers_juin_2026.xlsx", time: t("analytics.eventTimeJun1")  },
    { type: "clock",  color: C.ink,   bg: C.paper,  title: t("analytics.event5Title"), sub: t("analytics.event5Sub"), time: t("analytics.eventTimeMay31") },
  ];
}

function getKpis(t) {
  return [
    { label: t("analytics.kpiContainersOnFile"),   val: "28",  delta: t("analytics.kpiDelta1"), up: true,  accent: C.teal   },
    { label: t("analytics.kpiAvgTransitTime"),     val: "24d", delta: t("analytics.kpiDelta2"), up: true,  accent: C.amber  },
    { label: t("analytics.kpiCustomsDelays"),      val: "02",  delta: t("analytics.kpiDelta3"), up: false, accent: C.coral  },
    { label: t("analytics.kpiDeliveredThisMonth"), val: "07",  delta: t("analytics.kpiDelta4"), up: true,  accent: C.tonInk },
  ];
}

const MONO = "'IBM Plex Mono', monospace";
const tickFont = { size: 10, family: MONO };

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

function mono(extra) { return { fontFamily: MONO, ...extra }; }

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

function Hero() {
  const { t } = useLanguage();
  const KPIS = getKpis(t);
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
        {KPIS.map((k, i) => (
          <div key={i} style={{ padding: "18px 28px 22px", borderRight: i < 3 ? "1px solid rgba(255,255,255,.08)" : "none", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 2, background: k.accent }} />
            <div style={mono({ fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(111,139,156,.8)", marginBottom: 5 })}>{k.label}</div>
            <div style={mono({ fontSize: "clamp(1.4rem,2.8vw,1.9rem)", fontWeight: 700, color: C.tonInk, lineHeight: 1, marginBottom: 3 })}>{k.val}</div>
            <div style={mono({ fontSize: 10, color: k.up ? "#4dcca0" : "#e07060" })}>{k.delta}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarCard() {
  const { t } = useLanguage();
  const MONTHS = getMonths(t);
  const ref = useChart(() => ({
    type: "bar",
    data: {
      labels: MONTHS,
      datasets: [{
        data: VOLUMES,
        backgroundColor: VOLUMES.map((_, i) => i === VOLUMES.length - 1 ? C.teal : "rgba(11,42,61,.12)"),
        borderColor:      VOLUMES.map((_, i) => i === VOLUMES.length - 1 ? C.teal : "rgba(11,42,61,.18)"),
        borderWidth: 1, borderRadius: 2,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.raw} ${t("analytics.barTooltipSuffix")}` } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: tickFont, color: C.muted } },
        y: { grid: { color: "rgba(11,42,61,.06)" }, ticks: { font: tickFont, color: C.muted, stepSize: 2 }, border: { display: false } },
      },
    },
  }), [t]);
  return (
    <Card>
      <CardHead title={t("analytics.barCardTitle")} sub={t("analytics.barCardSub")} iconBg="rgba(47,126,108,.12)" iconEl={<IBar c={C.teal} />} />
      <div style={{ height: 190, position: "relative" }}><canvas ref={ref} /></div>
    </Card>
  );
}

function DonutCard() {
  const { t } = useLanguage();
  const STATUSES = getStatuses(t);
  const TOTAL = getTotal(STATUSES);
  const ref = useChart(() => ({
    type: "doughnut",
    data: {
      labels: STATUSES.map(s => s.label),
      datasets: [{ data: STATUSES.map(s => s.count), backgroundColor: STATUSES.map(s => s.color), borderWidth: 3, borderColor: C.paper, hoverOffset: 4 }],
    },
    options: { responsive: false, cutout: "68%", plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.label}: ${c.raw}` } } } },
  }), [t]);
  return (
    <Card>
      <CardHead title={t("analytics.donutCardTitle")} sub={t("analytics.donutCardSub")} iconBg="rgba(214,73,47,.12)" iconEl={<IClock c={C.coral} />} />
      <div style={{ display: "grid", gridTemplateColumns: "148px 1fr", gap: 22, alignItems: "center" }}>
        <div style={{ position: "relative", width: 148, height: 148, flexShrink: 0 }}>
          <canvas ref={ref} width={148} height={148} style={{ width: 148, height: 148 }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <span style={mono({ fontSize: 24, fontWeight: 700, color: C.ink, lineHeight: 1 })}>{TOTAL}</span>
            <span style={mono({ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: C.muted, marginTop: 3 })}>{t("analytics.donutActiveLabel")}</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {STATUSES.map(s => {
            const pct = Math.round((s.count / TOTAL) * 100);
            return (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
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

function LaneCard() {
  const { t } = useLanguage();
  const cols = "10px 110px 1fr 56px 66px";
  const thSt = mono({ fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: C.muted });
  return (
    <Card>
      <CardHead title={t("analytics.laneCardTitle")} sub={t("analytics.laneCardSub")} iconBg="rgba(201,145,43,.12)" iconEl={<ITrend c={C.amber} />} />
      <div style={{ display: "grid", gridTemplateColumns: cols, gap: 14, paddingBottom: 10, borderBottom: "1px solid rgba(11,42,61,.1)", marginBottom: 2 }}>
        <span /><span style={thSt}>{t("analytics.laneColOrigin")}</span><span style={thSt}>{t("analytics.laneColProgress")}</span>
        <span style={{ ...thSt, textAlign: "right" }}>{t("analytics.laneColAvg")}</span>
        <span style={{ ...thSt, textAlign: "right" }}>{t("analytics.laneColDeltaPeriod")}</span>
      </div>
      {LANES.map(l => {
        const d = l.avg - l.prev;
        const deltaColor = d < 0 ? C.teal : d > 0 ? C.coral : C.muted;
        const dAbbrev = t("arrivals.dayAbbrev");
        const deltaText  = d < 0 ? `↓ ${Math.abs(d)}${dAbbrev}` : d > 0 ? `↑ ${d}${dAbbrev}` : "—";
        return (
          <div key={l.orig} style={{ display: "grid", gridTemplateColumns: cols, gap: 14, alignItems: "center", padding: "13px 0", borderBottom: "1px solid rgba(11,42,61,.05)" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
            <span style={mono({ fontSize: 11, fontWeight: 500, letterSpacing: ".08em", textTransform: "uppercase", color: "#1C2B33" })}>{l.orig}</span>
            <div style={{ height: 4, background: "rgba(11,42,61,.09)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(l.avg / 35) * 100}%`, background: l.color, borderRadius: 2 }} />
            </div>
            <span style={mono({ fontSize: 13, fontWeight: 700, color: C.ink, textAlign: "right" })}>{l.avg}{dAbbrev}</span>
            <span style={mono({ fontSize: 10, color: deltaColor, textAlign: "right" })}>{deltaText}</span>
          </div>
        );
      })}
    </Card>
  );
}

function TrendCard() {
  const { t } = useLanguage();
  const MONTHS = getMonths(t);
  const ref = useChart(() => ({
    type: "line",
    data: {
      labels: MONTHS,
      datasets: [{
        data: TREND, borderColor: C.teal, borderWidth: 2,
        pointBackgroundColor: C.teal, pointRadius: 3, pointHoverRadius: 5,
        fill: true,
        backgroundColor: ctx => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 170);
          g.addColorStop(0, C.teal + "38"); g.addColorStop(1, C.teal + "00"); return g;
        },
        tension: .35,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.raw} ${t("analytics.trendTooltipSuffix")}` } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: tickFont, color: C.muted } },
        y: { grid: { color: "rgba(11,42,61,.06)" }, ticks: { font: tickFont, color: C.muted }, border: { display: false }, reverse: true, min: 20, max: 36 },
      },
    },
  }), [t]);
  return (
    <Card>
      <CardHead title={t("analytics.trendCardTitle")} sub={t("analytics.trendCardSub")} iconBg="rgba(11,42,61,.08)" iconEl={<ILine c={C.ink} />} />
      <div style={{ height: 170, position: "relative" }}><canvas ref={ref} /></div>
    </Card>
  );
}

function ActivityCard() {
  const { t } = useLanguage();
  const EVENTS = getEvents(t);
  return (
    <Card>
      <CardHead title={t("analytics.activityCardTitle")} sub={t("analytics.activityCardSub")} iconBg="rgba(47,126,108,.12)" iconEl={<IFile c={C.teal} />} />
      <div>
        {EVENTS.map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start", padding: "11px 0", borderBottom: i < EVENTS.length - 1 ? "1px solid rgba(11,42,61,.06)" : "none" }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: e.bg, color: e.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {EVENT_ICONS[e.type]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: "#1C2B33", marginBottom: 2 }}>{e.title}</div>
              <div style={mono({ fontSize: 9, letterSpacing: ".06em", color: C.muted })}>{e.sub}</div>
            </div>
            <div style={mono({ fontSize: 9, color: C.muted, flexShrink: 0, marginTop: 2 })}>{e.time}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function Analytics() {
  const { t } = useLanguage();
  const row2 = { display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 20 };
  return (
    <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", background: "#ECE7DA", WebkitFontSmoothing: "antialiased" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (max-width: 860px) { .an-row2 { grid-template-columns: 1fr !important; } }
      `}</style>
      <Hero />
      <div style={{ padding: "44px 52px", maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="an-row2" style={row2}>
          <BarCard />
          <DonutCard />
        </div>
        <LaneCard />
        <div className="an-row2" style={row2}>
          <TrendCard />
          <ActivityCard />
        </div>
      </div>
      <footer style={{ background: C.ink, color: "#6F8B9C", padding: "32px 52px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, fontFamily: MONO, fontSize: 10, letterSpacing: ".1em" }}>
        <span style={{ fontFamily: "'Fraunces',serif", fontSize: ".95rem", color: C.tonInk, letterSpacing: ".04em" }}>Portivo</span>
        <span style={{ textTransform: "uppercase" }}>{t("analytics.footerText")}</span>
      </footer>
    </div>
  );
}