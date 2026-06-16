/**
 * Portivo — Analytics page
 * Drop-in replacement for Analytics.jsx
 *
 * Requires: npm install chart.js react-chartjs-2
 *
 * Fonts — add to your index.html or global CSS:
 * @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap');
 */

import { useEffect, useRef } from "react";
import {
  Chart,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
} from "chart.js";

Chart.register(
  BarElement, LineElement, PointElement, ArcElement,
  CategoryScale, LinearScale, Filler, Tooltip
);

// ─── Palette ────────────────────────────────────────────────────────────────

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

// ─── Data ────────────────────────────────────────────────────────────────────

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const VOLUMES = [4, 6, 5, 8, 7, 12];
const TREND   = [31, 29, 30, 28, 27, 24];

const STATUSES = [
  { label: "In transit",      count: 6, color: C.teal,  bg: C.teals  },
  { label: "In customs",      count: 2, color: C.amber, bg: C.ambers },
  { label: "Arriving soon",   count: 3, color: C.ink,   bg: C.paper  },
  { label: "Needs attention", count: 2, color: C.coral, bg: C.corals },
];
const TOTAL_ACTIVE = STATUSES.reduce((a, s) => a + s.count, 0);

const LANES = [
  { orig: "Shanghai", avg: 28, prev: 31, color: C.teal  },
  { orig: "Genoa",    avg: 6,  prev: 7,  color: C.amber },
  { orig: "Valencia", avg: 9,  prev: 9,  color: C.coral },
];

const EVENTS = [
  { type: "ship",   color: C.teal,  bg: C.teals,  title: "MSCU7654321 cleared customs",    sub: "Valencia → Tunis · ETA 2 days",  time: "14:22"  },
  { type: "alert",  color: C.coral, bg: C.corals, title: "CMAU1234567 delayed in transit",  sub: "Shanghai → Tunis · +4d slippage", time: "11:05"  },
  { type: "check",  color: C.teal,  bg: C.teals,  title: "HLCU8823001 delivered",           sub: "Genoa → Tunis · On time",         time: "09:47"  },
  { type: "import", color: C.amber, bg: C.ambers, title: "8 containers imported",            sub: "containers_juin_2026.xlsx",        time: "Jun 1"  },
  { type: "clock",  color: C.ink,   bg: C.paper,  title: "TRLU5512044 entering customs",    sub: "Shanghai → Tunis · Day 27",       time: "May 31" },
];

const KPI_STRIP = [
  { label: "Containers on file",  val: "28",  delta: "↑ 4 this month",   dir: "up",  accent: C.teal  },
  { label: "Avg. transit time",   val: "24d", delta: "↓ 3d vs last month", dir: "up", accent: C.amber },
  { label: "Customs delays",      val: "02",  delta: "↑ 1 vs last month", dir: "dn",  accent: C.coral },
  { label: "Delivered this month",val: "07",  delta: "↑ 2 vs prior",      dir: "up",  accent: C.tonInk},
];

// ─── Inline SVG icons ────────────────────────────────────────────────────────

const Icons = {
  bar: (
    <svg viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10"/><path d="M11 20V4"/><path d="M18 20v-7"/><path d="M2 20h20"/>
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke={C.coral} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
    </svg>
  ),
  trend: (
    <svg viewBox="0 0 24 24" fill="none" stroke={C.amber} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 7l-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>
    </svg>
  ),
  line: (
    <svg viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-6"/>
    </svg>
  ),
  file: (
    <svg viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  // event icons
  ship: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 16h18l-2 4H5l-2-4Z"/><path d="M6 16V9h8l3 4"/><path d="M10 9V4h2v5"/>
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  import: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  clockSm: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
    </svg>
  ),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useChart(id, config) {
  const ref = useRef(null);
  const instance = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (instance.current) instance.current.destroy();
    instance.current = new Chart(ref.current, config);
    return () => instance.current?.destroy();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
}

function IconBadge({ children, bg }) {
  return (
    <div style={{
      width: 34, height: 34, borderRadius: 6, flexShrink: 0,
      background: bg, display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ width: 17, height: 17 }}>{children}</div>
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: "#E2DCCB", border: "1px solid rgba(11,42,61,.14)",
      padding: "30px 28px 26px", ...style,
    }}>
      {children}
    </div>
  );
}

function CardHead({ title, sub, icon }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      marginBottom: 22, paddingBottom: 18, borderBottom: "1px solid rgba(11,42,61,.1)",
    }}>
      <div>
        <p style={{ fontFamily: "'Fraunces',serif", fontWeight: 500, fontSize: "1.15rem", letterSpacing: "-.01em", color: "#1C2B33", marginBottom: 3 }}>{title}</p>
        <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: C.muted }}>{sub}</p>
      </div>
      {icon}
    </div>
  );
}

// ─── Chart components ─────────────────────────────────────────────────────────

function BarChartCard() {
  const ref = useChart("bar", {
    type: "bar",
    data: {
      labels: MONTHS,
      datasets: [{
        data: VOLUMES,
        backgroundColor: MONTHS.map((_, i) => i === 5 ? C.teal : "rgba(11,42,61,.13)"),
        borderColor:      MONTHS.map((_, i) => i === 5 ? C.teal : "rgba(11,42,61,.2)"),
        borderWidth: 1, borderRadius: 2,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.raw} containers` } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10, family: "'IBM Plex Mono',monospace" }, color: C.muted } },
        y: { grid: { color: "rgba(11,42,61,.06)" }, ticks: { font: { size: 10, family: "'IBM Plex Mono',monospace" }, color: C.muted, stepSize: 2 }, border: { display: false } },
      },
    },
  });
  return (
    <Card>
      <CardHead title="Monthly volume" sub="Containers handled per month, 2026" icon={<IconBadge bg="rgba(47,126,108,.12)">{Icons.bar}</IconBadge>} />
      <div style={{ height: 190, position: "relative" }}><canvas ref={ref} /></div>
    </Card>
  );
}

function DonutCard() {
  const ref = useChart("donut", {
    type: "doughnut",
    data: {
      labels: STATUSES.map(s => s.label),
      datasets: [{ data: STATUSES.map(s => s.count), backgroundColor: STATUSES.map(s => s.color), borderWidth: 3, borderColor: "#E2DCCB", hoverOffset: 4 }],
    },
    options: {
      responsive: false, cutout: "68%",
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.label}: ${c.raw}` } } },
    },
  });
  return (
    <Card>
      <CardHead title="Fleet status" sub="Active containers breakdown" icon={<IconBadge bg="rgba(214,73,47,.12)">{Icons.clock}</IconBadge>} />
      <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 24, alignItems: "center" }}>
        <div style={{ position: "relative", width: 150, height: 150 }}>
          <canvas ref={ref} width={150} height={150} style={{ width: 150, height: 150 }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 26, fontWeight: 700, color: C.ink, lineHeight: 1 }}>{TOTAL_ACTIVE}</span>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", color: C.muted, marginTop: 3 }}>Active</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {STATUSES.map(s => {
            const pct = Math.round((s.count / TOTAL_ACTIVE) * 100);
            return (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: ".07em", textTransform: "uppercase", color: "#1C2B33", flex: 1 }}>{s.label}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, fontWeight: 700, color: C.ink }}>{s.count}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: C.muted }}>{pct}%</span>
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
  const thStyle = { fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: C.muted };
  const grid = "12px 100px 1fr 54px 64px";
  return (
    <Card style={{ width: "100%" }}>
      <CardHead title="Lane performance" sub="Average days in transit · vs prior period" icon={<IconBadge bg="rgba(201,145,43,.12)">{Icons.trend}</IconBadge>} />
      <div style={{ display: "grid", gridTemplateColumns: grid, gap: 14, alignItems: "center", paddingBottom: 12, borderBottom: "1px solid rgba(11,42,61,.1)", marginBottom: 4 }}>
        <span /><span style={thStyle}>Origin</span><span style={thStyle}>Progress</span>
        <span style={{ ...thStyle, textAlign: "right" }}>Avg</span>
        <span style={{ ...thStyle, textAlign: "right" }}>Δ Period</span>
      </div>
      {LANES.map(l => {
        const d = l.avg - l.prev;
        const cls = d < 0 ? C.teal : d > 0 ? C.coral : C.muted;
        const sym = d < 0 ? `↓ ${Math.abs(d)}d` : d > 0 ? `↑ ${d}d` : "—";
        return (
          <div key={l.orig} style={{ display: "grid", gridTemplateColumns: grid, gap: 14, alignItems: "center", padding: "13px 0", borderBottom: "1px solid rgba(11,42,61,.06)" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 500, letterSpacing: ".08em", textTransform: "uppercase", color: "#1C2B33" }}>{l.orig}</span>
            <div style={{ height: 4, background: "rgba(11,42,61,.09)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(l.avg / 35) * 100}%`, background: l.color, borderRadius: 2 }} />
            </div>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 700, color: C.ink, textAlign: "right" }}>{l.avg}d</span>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: cls, textAlign: "right" }}>{sym}</span>
          </div>
        );
      })}
    </Card>
  );
}

function TrendCard() {
  const ref = useChart("trend", {
    type: "line",
    data: {
      labels: MONTHS,
      datasets: [{
        label: "Avg transit (days)", data: TREND,
        borderColor: C.teal, borderWidth: 2,
        pointBackgroundColor: C.teal, pointRadius: 3, pointHoverRadius: 5,
        fill: true,
        backgroundColor: ctx => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 170);
          g.addColorStop(0, C.teal + "35"); g.addColorStop(1, C.teal + "00"); return g;
        },
        tension: .35,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.raw} days avg` } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10, family: "'IBM Plex Mono',monospace" }, color: C.muted } },
        y: { grid: { color: "rgba(11,42,61,.06)" }, ticks: { font: { size: 10, family: "'IBM Plex Mono',monospace" }, color: C.muted }, border: { display: false }, reverse: true, min: 20, max: 36 },
      },
    },
  });
  return (
    <Card>
      <CardHead title="Transit trend" sub="6-month rolling average (days)" icon={<IconBadge bg="rgba(11,42,61,.08)">{Icons.line}</IconBadge>} />
      <div style={{ height: 170, position: "relative" }}><canvas ref={ref} /></div>
    </Card>
  );
}

function ActivityCard() {
  const eventIcon = { ship: Icons.ship, alert: Icons.alert, check: Icons.check, import: Icons.import, clock: Icons.clockSm };
  return (
    <Card>
      <CardHead title="Recent activity" sub="Last 5 fleet events" icon={<IconBadge bg="rgba(47,126,108,.12)">{Icons.file}</IconBadge>} />
      <div>
        {EVENTS.map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", borderBottom: i < EVENTS.length - 1 ? "1px solid rgba(11,42,61,.06)" : "none" }}>
            <div style={{ width: 30, height: 30, borderRadius: 6, background: e.bg, color: e.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <div style={{ width: 13, height: 13 }}>{eventIcon[e.type]}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: "#1C2B33", marginBottom: 2 }}>{e.title}</div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: ".06em", color: C.muted }}>{e.sub}</div>
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: C.muted, flexShrink: 0, marginTop: 2 }}>{e.time}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <div style={{ position: "relative", height: 480, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      {/* Photo */}
      <img
        src="https://images.unsplash.com/photo-1494961104209-3c223057bd26?w=1400&q=80&auto=format&fit=crop"
        alt="Aerial view of a container port terminal"
        onError={e => { e.target.src = "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=1400&q=80&auto=format&fit=crop"; }}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%", display: "block" }}
      />
      {/* Overlays */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,32,48,.35) 0%, rgba(8,32,48,.55) 40%, rgba(8,32,48,.82) 75%, rgba(8,32,48,.97) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(11,42,61,.28)" }} />

      {/* Photo credit */}
      <span style={{ position: "absolute", bottom: 100, right: 16, zIndex: 3, fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: ".1em", color: "rgba(255,255,255,.3)", textTransform: "uppercase" }}>
        Photo: Unsplash
      </span>

      {/* Text content */}
      <div style={{ position: "relative", zIndex: 2, padding: "0 52px 0" }}>
        <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: "#C7E0D8", marginBottom: 14 }}>
          Tunis–Goulette Terminal · Fleet Performance
        </p>
        <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: "clamp(2.8rem,6vw,4.8rem)", lineHeight: .95, letterSpacing: "-.02em", color: "#DCE6EA", marginBottom: 14 }}>
          Analytics
        </h1>
        <p style={{ fontFamily: "'Fraunces',serif", fontWeight: 300, fontSize: "clamp(.9rem,1.6vw,1.15rem)", lineHeight: 1.55, color: "rgba(220,230,234,.75)", maxWidth: "44ch" }}>
          Live metrics from every active route — volumes, transit times, and customs delays in one view.
        </p>
      </div>

      {/* KPI strip */}
      <div style={{ position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: "repeat(4,1fr)", marginTop: 32, borderTop: "1px solid rgba(255,255,255,.12)" }}>
        {KPI_STRIP.map((k, i) => (
          <div key={i} style={{ padding: "20px 28px 24px", borderRight: i < 3 ? "1px solid rgba(255,255,255,.1)" : "none", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 2, background: k.accent }} />
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(111,139,156,.85)", marginBottom: 5 }}>{k.label}</div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 700, color: "#DCE6EA", lineHeight: 1, marginBottom: 3 }}>{k.val}</div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: ".06em", color: k.dir === "up" ? "#4dcca0" : "#e07060" }}>{k.delta}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Analytics() {
  const row2 = { display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap');
        .an-root { font-family:'IBM Plex Sans',sans-serif; background:#ECE7DA; -webkit-font-smoothing:antialiased; }
        .an-root * { box-sizing:border-box; margin:0; padding:0; }
        @media(max-width:860px){.an-row2{grid-template-columns:1fr!important}}
      `}</style>

      <div className="an-root">
        <Hero />

        {/* Body */}
        <div style={{ padding: "48px 52px", maxWidth: 1300, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="an-row2" style={row2}>
            <BarChartCard />
            <DonutCard />
          </div>

          <LaneCard />

          <div className="an-row2" style={row2}>
            <TrendCard />
            <ActivityCard />
          </div>
        </div>

        {/* Footer */}
        <footer style={{
          background: C.ink, color: "#6F8B9C",
          padding: "36px 52px", display: "flex", justifyContent: "space-between",
          alignItems: "center", flexWrap: "wrap", gap: 16,
          fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: ".1em",
        }}>
          <span style={{ fontFamily: "'Fraunces',serif", fontSize: ".95rem", color: "#DCE6EA", letterSpacing: ".04em" }}>Portivo</span>
          <span style={{ textTransform: "uppercase" }}>Tunis–Goulette · 36.8°N 10.3°E · Fleet analytics</span>
        </footer>
      </div>
    </>
  );
}
