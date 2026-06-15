import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

/**
 * Portivo — Analytics page
 *
 * Matches Home.jsx design system exactly:
 * - Same dark ink hero header with animated map background
 * - Same topbar brand + nav + sync indicator
 * - Paper body below
 *
 * Place at: src/pages/Analytics.jsx
 * Rendered at "/analytics".
 */

const IconShip = (props) => (
  <svg viewBox="0 0 24 24" className="icon" {...props}>
    <g stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 16h18l-2 4H5l-2-4Z" />
      <path d="M6 16V9h8l3 4" />
      <path d="M10 9V4h2v5" />
      <path d="M2 20c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0" />
    </g>
  </svg>
);

const IconChart = (props) => (
  <svg viewBox="0 0 24 24" className="icon" {...props}>
    <g stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10" /><path d="M11 20V4" /><path d="M18 20v-7" /><path d="M2 20h20" />
    </g>
  </svg>
);

const IconTrend = (props) => (
  <svg viewBox="0 0 24 24" className="icon" {...props}>
    <g stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 7l-8.5 8.5-5-5L2 17" /><path d="M16 7h6v6" />
    </g>
  </svg>
);

const IconClock = (props) => (
  <svg viewBox="0 0 24 24" className="icon" {...props}>
    <g stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
    </g>
  </svg>
);

const IconCheck = (props) => (
  <svg viewBox="0 0 24 24" className="icon" {...props}>
    <g stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </g>
  </svg>
);

const SHIP_PATH = "M-8,-5 9,0 -8,5 -3,0Z";
const LANES = [
  { id: "an-lane-shanghai", d: "M20,80 C 360,50 680,120 900,220", color: "var(--teal)", dur: "28s", begin: "0s" },
  { id: "an-lane-genoa",    d: "M20,220 C 360,200 680,210 900,220", color: "var(--amber)", dur: "36s", begin: "-10s" },
  { id: "an-lane-valencia", d: "M20,340 C 360,310 680,260 900,220", color: "var(--coral)", dur: "32s", begin: "-18s" },
];

const monthlyVolume = [
  { month: "Jan", count: 4 },
  { month: "Feb", count: 6 },
  { month: "Mar", count: 5 },
  { month: "Apr", count: 8 },
  { month: "May", count: 7 },
  { month: "Jun", count: 12 },
];

const topClients = [
  { name: "Medina Trading Co.", shipments: 5 },
  { name: "Ben Salem Imports", shipments: 3 },
  { name: "Carthage Logistics", shipments: 2 },
  { name: "Sfax Industrial",   shipments: 1 },
  { name: "Gulf Link SARL",    shipments: 1 },
];

const statusBreakdown = [
  { label: "In transit",       count: 6, color: "var(--teal)",  bg: "var(--teal-soft)" },
  { label: "In customs",       count: 2, color: "var(--amber)", bg: "var(--amber-soft)" },
  { label: "Arriving soon",    count: 3, color: "var(--ink)",   bg: "var(--paper-2)" },
  { label: "Needs attention",  count: 2, color: "var(--coral)", bg: "var(--coral-soft)" },
];

const totalActive = statusBreakdown.reduce((s, r) => s + r.count, 0);
const maxVol      = Math.max(...monthlyVolume.map(m => m.count));
const maxClient   = topClients[0].shipments;

function BarChart() {
  return (
    <div className="chart-bars">
      {monthlyVolume.map((m, i) => {
        const isLast = i === monthlyVolume.length - 1;
        const pct = (m.count / maxVol) * 100;
        return (
          <div className="bar-col" key={m.month}>
            <span className={`bar-val ${isLast ? "current" : ""}`}>{m.count}</span>
            <div className="bar-track">
              <div
                className={`bar-fill ${isLast ? "current" : ""}`}
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className={`bar-label ${isLast ? "current" : ""}`}>{m.month}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Analytics() {
  return (
    <div className="portivo-root">
      <style>{CSS}</style>

      {/* ── HERO HEADER ── */}
      <section className="an-hero">
        <svg
          className="an-hero-bg"
          viewBox="0 0 960 440"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect width="960" height="440" fill="var(--ink)" />

          {/* grid */}
          <g stroke="var(--ink-line)" strokeWidth="1" opacity="0.4">
            {[80, 160, 240, 320, 400].map(y => (
              <line key={y} x1="0" y1={y} x2="960" y2={y} />
            ))}
            {[120, 240, 360, 480, 600, 720, 840].map(x => (
              <line key={x} x1={x} y1="0" x2={x} y2="440" />
            ))}
          </g>

          {/* depth rings around Tunis endpoint */}
          <g fill="none" stroke="var(--ink-line)" strokeWidth="1" opacity="0.5">
            <ellipse cx="900" cy="220" rx="80"  ry="60"  transform="rotate(-10 900 220)" />
            <ellipse cx="900" cy="220" rx="160" ry="120" transform="rotate(-10 900 220)" />
            <ellipse cx="900" cy="220" rx="260" ry="195" transform="rotate(-10 900 220)" />
          </g>

          {/* compass */}
          <g transform="translate(880,60)" stroke="var(--text-on-ink-muted)" fill="none" strokeWidth="1">
            <circle r="30" opacity="0.4" />
            <line x1="0" y1="-38" x2="0" y2="38" opacity="0.4" />
            <line x1="-38" y1="0" x2="38" y2="0" opacity="0.4" />
            <path d="M0,-28 L4,0 L0,28 L-4,0 Z" fill="var(--text-on-ink-muted)" opacity="0.55" stroke="none" />
          </g>
          <text x="880" y="20" textAnchor="middle" fill="var(--text-on-ink-muted)"
            fontFamily="IBM Plex Mono" fontSize="11" letterSpacing="3" opacity="0.7">N</text>

          {/* lanes */}
          {LANES.map(l => (
            <path key={l.id} id={l.id} d={l.d}
              fill="none" stroke={l.color} strokeWidth="1.5"
              strokeDasharray="2 8" opacity="0.5" />
          ))}

          {/* origin labels */}
          <g fontFamily="IBM Plex Mono" fontSize="11" letterSpacing="3" fill="var(--text-on-ink-muted)">
            <text x="18" y="72">SHANGHAI</text>
            <text x="18" y="212">GENOA</text>
            <text x="18" y="332">VALENCIA</text>
          </g>

          {/* Tunis marker */}
          <g transform="translate(900,220)">
            <circle className="tunis-ring" r="5" fill="var(--coral)" opacity="0.5" />
            <circle r="5" fill="var(--coral)" />
            <text x="13" y="-9" fontFamily="IBM Plex Mono" fontSize="12" letterSpacing="3" fill="var(--text-on-ink)">TUNIS</text>
            <text x="13" y="5"  fontFamily="IBM Plex Mono" fontSize="9"  letterSpacing="2" fill="var(--text-on-ink-muted)">36.8°N 10.3°E</text>
          </g>

          {/* ships */}
          <g className="ship-anim">
            {LANES.map(l => (
              <path className="ship" d={SHIP_PATH} key={l.id}>
                <animateMotion dur={l.dur} repeatCount="indefinite" rotate="auto" begin={l.begin}>
                  <mpath href={`#${l.id}`} />
                </animateMotion>
              </path>
            ))}
          </g>
        </svg>

        {/* topbar — identical pattern to Home */}
        <div className="hero-topbar">
          <Link to="/" className="brand">Portivo</Link>
          <nav>
            <Link to="/arrivals">Arrivals</Link>
            <Link to="/containers">Containers</Link>
            <Link to="/search">Search</Link>
            <Link to="/import">Import</Link>
            <Link to="/analytics" className="nav-active">Analytics</Link>
          </nav>
          <span className="sync">
            <span className="sync-dot" />
            Synced 11:51
          </span>
        </div>

        {/* page title inside hero */}
        <div className="an-hero-content">
          <p className="eyebrow reveal" style={{ animationDelay: ".05s" }}>
            Tunis–Goulette terminal · Fleet performance
          </p>
          <h1 className="reveal" style={{ animationDelay: ".15s" }}>Analytics</h1>
          <p className="tagline reveal" style={{ animationDelay: ".3s" }}>
            Volumes, lanes, and turnaround times — see which routes are{" "}
            <em>speeding up</em>, and which are slipping.
          </p>
        </div>

        <div className="hero-scroll">
          <span>Report</span>
          <span className="line" />
        </div>
      </section>

      {/* ── LEDGER STRIP ── */}
      <section className="ledger" aria-label="Fleet summary">
        {[
          { num: "12", label: "Containers on file", variant: "" },
          { num: "08", label: "Active — in transit or customs", variant: "" },
          { num: "03", label: "Delivered this month", variant: "good" },
          { num: "24d", label: "Avg. transit time", variant: "note" },
        ].map(item => (
          <div className={`ledger-item ${item.variant}`} key={item.label}>
            <div className="num">{item.num}</div>
            <div className="label">{item.label}</div>
          </div>
        ))}
      </section>

      {/* ── BODY ── */}
      <div className="an-body">

        {/* ── ROW 1: bar chart + clients ── */}
        <div className="an-row">

          {/* Monthly volume */}
          <div className="an-card an-card--wide">
            <div className="an-card-head">
              <div>
                <p className="an-card-title">Monthly volume</p>
                <p className="an-card-sub">Containers handled per month, 2026</p>
              </div>
              <IconChart style={{ width: 22, height: 22, color: "var(--teal)" }} />
            </div>
            <BarChart />
            <div className="an-legend-row">
              {LANES.map((l, i) => (
                <span className="an-legend-item" key={i} style={{ "--dot": l.color }}>
                  {["Shanghai", "Genoa", "Valencia"][i]}
                </span>
              ))}
            </div>
          </div>

          {/* Top clients */}
          <div className="an-card">
            <div className="an-card-head">
              <div>
                <p className="an-card-title">Top clients</p>
                <p className="an-card-sub">By number of shipments</p>
              </div>
              <IconTrend style={{ width: 22, height: 22, color: "var(--amber)" }} />
            </div>
            <div className="an-clients">
              {topClients.map((c, i) => {
                const pct = Math.round((c.shipments / maxClient) * 100);
                return (
                  <div className="client-row" key={c.name}>
                    <div className="client-meta">
                      <span className="client-rank">{String(i + 1).padStart(2, "0")}</span>
                      <span className="client-name">{c.name}</span>
                      <span className="client-count">{c.shipments}</span>
                    </div>
                    <div className="client-track">
                      <div className="client-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── ROW 2: status snapshot ── */}
        <div className="an-card an-card--full">
          <div className="an-card-head">
            <div>
              <p className="an-card-title">Operations snapshot</p>
              <p className="an-card-sub">Live breakdown of all active containers</p>
            </div>
            <IconShip style={{ width: 22, height: 22, color: "var(--ink)" }} />
          </div>

          {/* segmented bar */}
          <div className="snapshot-bar">
            {statusBreakdown.map(s => (
              <div
                key={s.label}
                className="snapshot-seg"
                style={{ flex: s.count, background: s.color }}
                title={s.label}
              />
            ))}
          </div>

          {/* status tiles */}
          <div className="snapshot-grid">
            {statusBreakdown.map(s => (
              <div className="snapshot-tile" key={s.label} style={{ "--tile-bg": s.bg, "--tile-col": s.color }}>
                <div className="snap-num">{String(s.count).padStart(2, "0")}</div>
                <div className="snap-label">{s.label}</div>
                <div className="snap-pct">{Math.round((s.count / totalActive) * 100)}% of active</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── ROW 3: lane performance ── */}
        <div className="an-card an-card--full">
          <div className="an-card-head">
            <div>
              <p className="an-card-title">Lane performance</p>
              <p className="an-card-sub">Average days in transit per active route</p>
            </div>
            <IconClock style={{ width: 22, height: 22, color: "var(--coral)" }} />
          </div>
          <div className="lanes-table">
            {[
              { origin: "Shanghai", dest: "Tunis–Goulette", avg: 28, prev: 31, dot: "var(--teal)" },
              { origin: "Genoa",    dest: "Tunis–Goulette", avg: 6,  prev: 7,  dot: "var(--amber)" },
              { origin: "Valencia", dest: "Tunis–Goulette", avg: 9,  prev: 9,  dot: "var(--coral)" },
            ].map(lane => {
              const delta = lane.avg - lane.prev;
              const improved = delta < 0;
              const same = delta === 0;
              return (
                <div className="lane-row" key={lane.origin}>
                  <span className="lane-dot" style={{ background: lane.dot }} />
                  <span className="lane-origin">{lane.origin}</span>
                  <span className="lane-arrow">→</span>
                  <span className="lane-dest">{lane.dest}</span>
                  <div className="lane-track">
                    <div className="lane-fill" style={{ width: `${(lane.avg / 35) * 100}%`, background: lane.dot }} />
                  </div>
                  <span className="lane-avg">{lane.avg}d</span>
                  <span className={`lane-delta ${improved ? "good" : same ? "neutral" : "note"}`}>
                    {same ? "—" : `${improved ? "▼" : "▲"} ${Math.abs(delta)}d`}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="lane-footnote">↑ slower than prior period · ↓ faster than prior period</p>
        </div>

      </div>

      {/* ── FOOTER ── */}
      <footer>
        <span className="brand">Portivo</span>
        <span className="coords">Tunis–Goulette · 36.8°N 10.3°E · Port operations, charted</span>
      </footer>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap');

.portivo-root{
  --ink: #0B2A3D;
  --ink-deep: #082030;
  --ink-line: #18435A;
  --paper: #ECE7DA;
  --paper-2: #E2DCCB;
  --text-on-paper: #1C2B33;
  --text-muted: #6E7F87;
  --text-on-ink: #DCE6EA;
  --text-on-ink-muted: #6F8B9C;
  --coral: #D6492F;
  --coral-soft: #F2C7BB;
  --amber: #C9912B;
  --amber-soft: #F0DDB3;
  --teal: #2F7E6C;
  --teal-soft: #C7E0D8;
  --display: 'Fraunces', serif;
  --body: 'IBM Plex Sans', sans-serif;
  --mono: 'IBM Plex Mono', monospace;
  font-family: var(--body);
  background: var(--paper);
  color: var(--text-on-paper);
  -webkit-font-smoothing: antialiased;
}

.portivo-root *{ margin:0; padding:0; box-sizing:border-box; }
.portivo-root a{ color:inherit; text-decoration:none; }

/* ---- HERO ---- */
.portivo-root .an-hero{
  position:relative;
  min-height:clamp(380px, 55vh, 500px);
  background:var(--ink);
  overflow:hidden;
  display:flex;
  flex-direction:column;
}

.portivo-root .an-hero-bg{
  position:absolute;
  inset:0; width:100%; height:100%;
}

/* topbar — identical to Home */
.portivo-root .hero-topbar{
  position:relative;
  z-index:2;
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:32px clamp(24px, 5vw, 64px);
  font-family:var(--mono);
  font-size:0.75rem;
  letter-spacing:0.18em;
  text-transform:uppercase;
  color:var(--text-on-ink-muted);
}

.portivo-root .hero-topbar .brand{
  font-family:var(--display);
  font-size:1.1rem;
  font-weight:600;
  letter-spacing:0.04em;
  color:var(--text-on-ink);
  text-transform:none;
}

.portivo-root .hero-topbar nav{
  display:flex;
  gap:clamp(16px, 3vw, 40px);
}

.portivo-root .hero-topbar nav a{
  color:var(--text-on-ink-muted);
  transition:color .2s ease;
}
.portivo-root .hero-topbar nav a:hover{ color:var(--text-on-ink); }
.portivo-root .hero-topbar nav a.nav-active{
  color:var(--text-on-ink);
  border-bottom:1px solid var(--teal);
  padding-bottom:2px;
}

.portivo-root .hero-topbar .sync{
  display:flex; align-items:center; gap:8px;
}
.portivo-root .sync-dot{
  width:6px; height:6px; border-radius:50%;
  background:var(--teal-soft); flex-shrink:0;
}
@media (prefers-reduced-motion:no-preference){
  .portivo-root .sync-dot{ animation:portivo-blink 2.4s ease-in-out infinite; }
}
@keyframes portivo-blink{ 0%,100%{opacity:1} 50%{opacity:.25} }

/* hero content */
.portivo-root .an-hero-content{
  position:relative;
  z-index:2;
  flex:1;
  display:flex;
  flex-direction:column;
  justify-content:center;
  padding:0 clamp(24px, 5vw, 64px) 64px;
  max-width:760px;
}

.portivo-root .eyebrow{
  font-family:var(--mono);
  font-size:0.75rem;
  letter-spacing:0.22em;
  text-transform:uppercase;
  color:var(--teal-soft);
  margin-bottom:20px;
}

.portivo-root .an-hero-content h1{
  font-family:var(--display);
  font-weight:600;
  font-size:clamp(2.8rem, 8vw, 5.5rem);
  line-height:0.95;
  letter-spacing:-0.02em;
  color:var(--text-on-ink);
  margin-bottom:22px;
}

.portivo-root .an-hero-content .tagline{
  font-family:var(--display);
  font-weight:300;
  font-size:clamp(1rem, 2vw, 1.35rem);
  line-height:1.5;
  color:var(--text-on-ink);
  max-width:38ch;
}
.portivo-root .an-hero-content .tagline em{
  font-style:italic;
  font-weight:400;
  color:var(--amber-soft);
}

.portivo-root .hero-scroll{
  position:relative;
  z-index:2;
  align-self:center;
  margin-bottom:24px;
  font-family:var(--mono);
  font-size:0.7rem;
  letter-spacing:0.2em;
  text-transform:uppercase;
  color:var(--text-on-ink-muted);
  display:flex; flex-direction:column; align-items:center; gap:10px;
}
.portivo-root .hero-scroll .line{
  width:1px; height:32px;
  background:linear-gradient(to bottom, var(--text-on-ink-muted), transparent);
}

/* ship animations */
.portivo-root .ship{ fill:var(--text-on-ink); }
@media (prefers-reduced-motion:reduce){
  .portivo-root .ship-anim{ display:none; }
}
@media (prefers-reduced-motion:no-preference){
  .portivo-root .tunis-ring{
    animation:portivo-pulse 3.2s ease-out infinite;
    transform-origin:center; transform-box:fill-box;
  }
}
@keyframes portivo-pulse{
  0%{ transform:scale(.5); opacity:.7; }
  100%{ transform:scale(2.4); opacity:0; }
}

/* reveal */
@media (prefers-reduced-motion:no-preference){
  .portivo-root .reveal{
    animation:portivo-rise 0.9s cubic-bezier(.22,.61,.36,1) both;
  }
  @keyframes portivo-rise{
    from{ opacity:0; transform:translateY(16px); }
    to{   opacity:1; transform:translateY(0); }
  }
}

/* ---- LEDGER ---- */
.portivo-root .ledger{
  background:var(--paper-2);
  border-top:1px solid var(--ink);
  border-bottom:1px solid rgba(11,42,61,0.12);
  display:flex; flex-wrap:wrap;
}
.portivo-root .ledger-item{
  flex:1 1 180px;
  padding:24px clamp(20px,4vw,48px);
  border-right:1px solid rgba(11,42,61,0.12);
}
.portivo-root .ledger-item:last-child{ border-right:none; }
.portivo-root .ledger-item .num{
  font-family:var(--mono);
  font-weight:700;
  font-size:clamp(1.6rem,3.5vw,2.4rem);
  color:var(--ink); line-height:1;
}
.portivo-root .ledger-item .label{
  margin-top:6px;
  font-family:var(--mono);
  font-size:0.68rem;
  letter-spacing:0.16em;
  text-transform:uppercase;
  color:var(--text-muted);
}
.portivo-root .ledger-item.note .num{ color:var(--amber); }
.portivo-root .ledger-item.good .num{ color:var(--teal); }

/* ---- BODY ---- */
.portivo-root .an-body{
  padding:72px clamp(24px,5vw,64px) 96px;
  max-width:1280px;
  margin:0 auto;
  display:flex;
  flex-direction:column;
  gap:20px;
}

/* row of cards */
.portivo-root .an-row{
  display:grid;
  grid-template-columns:1.6fr 1fr;
  gap:20px;
}

/* card */
.portivo-root .an-card{
  background:var(--paper-2);
  border:1px solid rgba(11,42,61,0.14);
  padding:32px 30px 28px;
}
.portivo-root .an-card--wide{}
.portivo-root .an-card--full{ width:100%; }

.portivo-root .an-card-head{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  margin-bottom:28px;
  padding-bottom:20px;
  border-bottom:1px solid rgba(11,42,61,0.1);
}
.portivo-root .an-card-title{
  font-family:var(--display);
  font-weight:500;
  font-size:1.25rem;
  letter-spacing:-0.01em;
  color:var(--text-on-paper);
  margin-bottom:4px;
}
.portivo-root .an-card-sub{
  font-family:var(--mono);
  font-size:0.7rem;
  letter-spacing:0.1em;
  text-transform:uppercase;
  color:var(--text-muted);
}
.portivo-root .an-card .icon{
  width:22px; height:22px; flex-shrink:0;
}

/* ---- BAR CHART ---- */
.portivo-root .chart-bars{
  display:flex;
  align-items:flex-end;
  gap:10px;
  height:180px;
  margin-bottom:20px;
}

.portivo-root .bar-col{
  flex:1;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:6px;
  height:100%;
  justify-content:flex-end;
}

.portivo-root .bar-val{
  font-family:var(--mono);
  font-size:0.7rem;
  color:var(--text-muted);
  font-weight:400;
}
.portivo-root .bar-val.current{
  color:var(--teal);
  font-weight:700;
}

.portivo-root .bar-track{
  width:100%;
  flex:1;
  display:flex;
  align-items:flex-end;
}

.portivo-root .bar-fill{
  width:100%;
  background:rgba(11,42,61,0.12);
  border-radius:2px 2px 0 0;
  transition:height .4s ease;
}
.portivo-root .bar-fill.current{
  background:var(--teal);
}

.portivo-root .bar-label{
  font-family:var(--mono);
  font-size:0.68rem;
  letter-spacing:0.1em;
  text-transform:uppercase;
  color:var(--text-muted);
}
.portivo-root .bar-label.current{
  color:var(--teal);
  font-weight:500;
}

/* lane legend */
.portivo-root .an-legend-row{
  display:flex; gap:20px; flex-wrap:wrap;
}
.portivo-root .an-legend-item{
  font-family:var(--mono);
  font-size:0.68rem;
  letter-spacing:0.12em;
  text-transform:uppercase;
  color:var(--text-muted);
  display:flex; align-items:center; gap:7px;
}
.portivo-root .an-legend-item::before{
  content:"";
  display:inline-block;
  width:22px; height:1px;
  background:var(--dot);
}

/* ---- TOP CLIENTS ---- */
.portivo-root .an-clients{
  display:flex; flex-direction:column; gap:18px;
}
.portivo-root .client-row{}
.portivo-root .client-meta{
  display:flex; align-items:center; gap:10px; margin-bottom:7px;
}
.portivo-root .client-rank{
  font-family:var(--mono);
  font-size:0.7rem;
  font-weight:700;
  color:var(--text-muted);
  flex-shrink:0;
}
.portivo-root .client-name{
  font-family:var(--body);
  font-size:0.88rem;
  color:var(--text-on-paper);
  flex:1;
}
.portivo-root .client-count{
  font-family:var(--mono);
  font-size:0.75rem;
  font-weight:700;
  color:var(--ink);
}
.portivo-root .client-track{
  height:3px;
  background:rgba(11,42,61,0.1);
  border-radius:2px;
  overflow:hidden;
}
.portivo-root .client-fill{
  height:100%;
  background:var(--ink);
  border-radius:2px;
}

/* ---- SNAPSHOT ---- */
.portivo-root .snapshot-bar{
  display:flex;
  height:8px;
  border-radius:2px;
  overflow:hidden;
  gap:2px;
  margin-bottom:24px;
}
.portivo-root .snapshot-seg{ border-radius:0; transition:flex .3s ease; }

.portivo-root .snapshot-grid{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:12px;
}
.portivo-root .snapshot-tile{
  padding:20px 18px;
  background:var(--tile-bg, var(--paper));
  border:1px solid rgba(11,42,61,0.08);
}
.portivo-root .snap-num{
  font-family:var(--mono);
  font-size:2rem;
  font-weight:700;
  color:var(--tile-col, var(--ink));
  line-height:1;
  margin-bottom:6px;
}
.portivo-root .snap-label{
  font-family:var(--mono);
  font-size:0.68rem;
  letter-spacing:0.14em;
  text-transform:uppercase;
  color:var(--tile-col, var(--ink));
  margin-bottom:8px;
}
.portivo-root .snap-pct{
  font-family:var(--mono);
  font-size:0.65rem;
  letter-spacing:0.1em;
  text-transform:uppercase;
  color:var(--tile-col, var(--ink));
  opacity:0.6;
}

/* ---- LANE PERFORMANCE ---- */
.portivo-root .lanes-table{
  display:flex; flex-direction:column; gap:20px;
  margin-bottom:16px;
}
.portivo-root .lane-row{
  display:grid;
  grid-template-columns:10px 90px 20px 1fr 200px 44px 60px;
  align-items:center;
  gap:12px;
}
.portivo-root .lane-dot{
  width:8px; height:8px; border-radius:50%; flex-shrink:0;
}
.portivo-root .lane-origin{
  font-family:var(--mono);
  font-size:0.75rem;
  letter-spacing:0.1em;
  text-transform:uppercase;
  color:var(--text-on-paper);
  font-weight:500;
}
.portivo-root .lane-arrow{
  font-family:var(--mono);
  font-size:0.75rem;
  color:var(--text-muted);
  text-align:center;
}
.portivo-root .lane-dest{
  font-family:var(--mono);
  font-size:0.7rem;
  letter-spacing:0.08em;
  text-transform:uppercase;
  color:var(--text-muted);
}
.portivo-root .lane-track{
  height:3px;
  background:rgba(11,42,61,0.1);
  border-radius:2px;
  overflow:hidden;
}
.portivo-root .lane-fill{
  height:100%;
  border-radius:2px;
  transition:width .4s ease;
}
.portivo-root .lane-avg{
  font-family:var(--mono);
  font-size:0.8rem;
  font-weight:700;
  color:var(--ink);
  text-align:right;
}
.portivo-root .lane-delta{
  font-family:var(--mono);
  font-size:0.7rem;
  letter-spacing:0.06em;
  text-align:right;
}
.portivo-root .lane-delta.good{ color:var(--teal); }
.portivo-root .lane-delta.note{ color:var(--coral); }
.portivo-root .lane-delta.neutral{ color:var(--text-muted); }

.portivo-root .lane-footnote{
  font-family:var(--mono);
  font-size:0.65rem;
  letter-spacing:0.1em;
  text-transform:uppercase;
  color:var(--text-muted);
}

/* ---- FOOTER ---- */
.portivo-root footer{
  background:var(--ink);
  color:var(--text-on-ink-muted);
  padding:48px clamp(24px,5vw,64px);
  display:flex;
  justify-content:space-between;
  align-items:center;
  flex-wrap:wrap;
  gap:20px;
  font-family:var(--mono);
  font-size:0.75rem;
  letter-spacing:0.1em;
}
.portivo-root footer .brand{
  font-family:var(--display);
  font-size:1rem;
  color:var(--text-on-ink);
  letter-spacing:0.04em;
}
.portivo-root footer .coords{ text-transform:uppercase; }

/* ---- RESPONSIVE ---- */
@media (max-width:860px){
  .portivo-root .an-row{ grid-template-columns:1fr; }
  .portivo-root .snapshot-grid{ grid-template-columns:repeat(2,1fr); }
  .portivo-root .lane-row{
    grid-template-columns:10px 80px 16px 1fr 100px 40px 50px;
    gap:8px;
  }
}
@media (max-width:640px){
  .portivo-root .hero-topbar nav{ display:none; }
  .portivo-root .ledger{ flex-direction:column; }
  .portivo-root .ledger-item{ border-right:none; border-bottom:1px solid rgba(11,42,61,0.12); }
  .portivo-root .ledger-item:last-child{ border-bottom:none; }
  .portivo-root .snapshot-grid{ grid-template-columns:1fr 1fr; }
  .portivo-root .lane-row{
    grid-template-columns:10px 1fr 40px 50px;
    grid-template-rows:auto auto;
  }
  .portivo-root .lane-arrow,
  .portivo-root .lane-dest,
  .portivo-root .lane-track{ display:none; }
}
`;
