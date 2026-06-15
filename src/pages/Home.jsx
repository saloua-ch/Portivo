import React from "react";
import { Link } from "react-router-dom";

/**
 * Portivo — maritime port-operations landing page
 *
 * Self-contained component: inline <style> block + inline SVG icons.
 * Loads Fraunces / IBM Plex Sans / IBM Plex Mono from Google Fonts.
 *
 * Place at: src/pages/Home.jsx
 * Rendered at "/" as a full-screen route (no Sidebar/AppShell).
 *
 * Nav links and "Ports of call" cards route via react-router-dom <Link>.
 * The hero CTA and "Log" scroll indicator stay as in-page <a href="#calls">
 * anchors since they jump to a section on this same page.
 */

const IconShip = (props) => (
  <svg viewBox="0 0 24 24" className="icon" {...props}>
    <g
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 16h18l-2 4H5l-2-4Z" />
      <path d="M6 16V9h8l3 4" />
      <path d="M10 9V4h2v5" />
      <path d="M2 20c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0" />
    </g>
  </svg>
);

const IconBox = (props) => (
  <svg viewBox="0 0 24 24" className="icon" {...props}>
    <g
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3 21 7.5 12 12 3 7.5Z" />
      <path d="M3 7.5V17l9 4.5 9-4.5V7.5" />
      <path d="M12 12v9.5" />
    </g>
  </svg>
);

const IconSearch = (props) => (
  <svg viewBox="0 0 24 24" className="icon" {...props}>
    <g
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.3-4.3" />
    </g>
  </svg>
);

const IconUpload = (props) => (
  <svg viewBox="0 0 24 24" className="icon" {...props}>
    <g
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
      <path d="M12 14V3" />
      <path d="M7 8l5-5 5 5" />
    </g>
  </svg>
);

const IconChart = (props) => (
  <svg viewBox="0 0 24 24" className="icon" {...props}>
    <g
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 20V10" />
      <path d="M11 20V4" />
      <path d="M18 20v-7" />
      <path d="M2 20h20" />
    </g>
  </svg>
);

const SHIP_PATH = "M-8,-5 9,0 -8,5 -3,0Z";

const LANES = [
  { id: "lane-shanghai", d: "M20,140 C 360,90 760,220 1150,480", color: "var(--teal)", dur: "26s", begin: "0s" },
  { id: "lane-genoa", d: "M20,470 C 360,420 760,440 1150,480", color: "var(--amber)", dur: "34s", begin: "-8s" },
  { id: "lane-valencia", d: "M20,700 C 360,660 760,560 1150,480", color: "var(--coral)", dur: "30s", begin: "-14s" },
];

const PORTS_OF_CALL = [
  {
    berth: "Berth 01 — Arrivals",
    accent: "teal",
    Icon: IconShip,
    title: "Arrivals",
    description:
      "Every container sorted by estimated arrival, grouped by day, with the ones needing attention surfaced first.",
    status: "3 due this week",
    href: "/arrivals",
  },
  {
    berth: "Berth 02 — Containers",
    accent: "amber",
    Icon: IconBox,
    title: "Containers",
    description:
      "The full fleet at a glance — in transit, in customs, or delivered, with documents and groupages attached.",
    status: "2 flagged",
    href: "/containers",
  },
  {
    berth: "Berth 03 — Search",
    accent: "ink",
    Icon: IconSearch,
    title: "Search",
    description:
      "Look up any shipment ever logged — by client, supplier, container number, or reference.",
    status: "5 records indexed",
    href: "/search",
  },
  {
    berth: "Berth 04 — Import",
    accent: "coral",
    Icon: IconUpload,
    title: "Import",
    description:
      "Bring in new manifests and booking confirmations, and Portivo will slot them straight into the log.",
    status: "Ready for upload",
    href: "/import",
  },
  {
    berth: "Berth 05 — Analytics",
    accent: "teal",
    Icon: IconChart,
    title: "Analytics",
    description:
      "Volumes, lanes, and turnaround times over time — see which routes are speeding up, and which are slipping.",
    status: "Updated weekly",
    href: "/analytics",
  },
];

const LEDGER_ITEMS = [
  { num: "03", label: "Arriving this week", variant: "" },
  { num: "01", label: "Awaiting customs", variant: "note" },
  { num: "00", label: "Past ETA", variant: "good" },
  { num: "05", suffix: "/ logged", label: "Shipments on record", variant: "" },
];

export default function Home() {
  return (
    <div className="portivo-root">
      <style>{CSS}</style>

      <section className="hero">
        <svg
          className="hero-chart"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect width="1440" height="900" fill="var(--ink)" />

          {/* lat/long grid */}
          <g stroke="var(--ink-line)" strokeWidth="1" opacity="0.45">
            <line x1="0" y1="120" x2="1440" y2="120" />
            <line x1="0" y1="240" x2="1440" y2="240" />
            <line x1="0" y1="360" x2="1440" y2="360" />
            <line x1="0" y1="480" x2="1440" y2="480" />
            <line x1="0" y1="600" x2="1440" y2="600" />
            <line x1="0" y1="720" x2="1440" y2="720" />
            <line x1="0" y1="840" x2="1440" y2="840" />
            <line x1="160" y1="0" x2="160" y2="900" />
            <line x1="400" y1="0" x2="400" y2="900" />
            <line x1="640" y1="0" x2="640" y2="900" />
            <line x1="880" y1="0" x2="880" y2="900" />
            <line x1="1120" y1="0" x2="1120" y2="900" />
            <line x1="1360" y1="0" x2="1360" y2="900" />
          </g>

          {/* depth contours around Tunis */}
          <g fill="none" stroke="var(--ink-line)" strokeWidth="1.2" opacity="0.6">
            <ellipse cx="1150" cy="480" rx="140" ry="105" transform="rotate(-12 1150 480)" />
            <ellipse cx="1150" cy="480" rx="270" ry="205" transform="rotate(-12 1150 480)" />
            <ellipse cx="1150" cy="480" rx="430" ry="330" transform="rotate(-12 1150 480)" />
            <ellipse cx="1150" cy="480" rx="620" ry="475" transform="rotate(-12 1150 480)" /></g>

          {/* compass rose */}
          <g transform="translate(1300,110)" stroke="var(--text-on-ink-muted)" fill="none" strokeWidth="1">
            <circle r="46" opacity="0.5" />
            <circle r="30" opacity="0.35" />
            <line x1="0" y1="-58" x2="0" y2="58" opacity="0.5" />
            <line x1="-58" y1="0" x2="58" y2="0" opacity="0.5" />
            <path d="M0,-46 L6,0 L0,46 L-6,0 Z" fill="var(--text-on-ink-muted)" opacity="0.6" stroke="none" />
          </g>
          <text
            x="1300"
            y="38"
            textAnchor="middle"
            fill="var(--text-on-ink-muted)"
            fontFamily="IBM Plex Mono"
            fontSize="13"
            letterSpacing="3"
            opacity="0.7"
          >
            N
          </text>

          {/* shipping lanes */}
          {LANES.map((lane) => (
            <path
              key={lane.id}
              id={lane.id}
              d={lane.d}
              fill="none"
              stroke={lane.color}
              strokeWidth="1.5"
              strokeDasharray="2 8"
              opacity="0.55"
            />
          ))}

          {/* port labels */}
          <g fontFamily="IBM Plex Mono" fontSize="13" letterSpacing="3" fill="var(--text-on-ink-muted)">
            <text x="20" y="124">SHANGHAI</text>
            <text x="20" y="454">GENOA</text>
            <text x="20" y="684">VALENCIA</text>
          </g>

          {/* Tunis marker */}
          <g transform="translate(1150,480)">
            <circle className="tunis-ring" r="6" fill="var(--coral)" opacity="0.5" />
            <circle r="6" fill="var(--coral)" />
            <text x="16" y="-12" fontFamily="IBM Plex Mono" fontSize="15" letterSpacing="4" fill="var(--text-on-ink)">
              TUNIS
            </text>
            <text x="16" y="8" fontFamily="IBM Plex Mono" fontSize="11" letterSpacing="2" fill="var(--text-on-ink-muted)">
              36.8°N 10.3°E
            </text>
          </g>

          {/* ships */}
          <g className="ship-anim">
            {LANES.map((lane) => (
              <path className="ship" d={SHIP_PATH} key={lane.id}>
                <animateMotion dur={lane.dur} repeatCount="indefinite" rotate="auto" begin={lane.begin}>
                  <mpath href={`#${lane.id}`} />
                </animateMotion>
              </path>
            ))}
          </g>
        </svg>

        <div className="hero-topbar">
          <span className="brand">Portivo</span>
          <nav>
            <Link to="/arrivals">Arrivals</Link>
            <Link to="/containers">Containers</Link>
            <Link to="/search">Search</Link>
            <Link to="/import">Import</Link>
            <Link to="/analytics">Analytics</Link>
          </nav>
          <span className="sync">
            <span className="sync-dot" />
            Synced 11:51
          </span>
        </div>

        <div className="hero-content">
          <p className="eyebrow reveal" style={{ animationDelay: ".05s" }}>
            Tunis–Goulette terminal · Port operations
          </p>
          <h1 className="reveal" style={{ animationDelay: ".15s" }}>
            Portivo
          </h1>
          <p className="tagline reveal" style={{ animationDelay: ".3s" }}>
            Every container <em>charted</em> from the moment it leaves port, until the moment it
            clears yours.
          </p>
          <a className="hero-cta reveal" style={{ animationDelay: ".45s" }} href="#calls">
            View today&rsquo;s arrivals &rarr;
          </a>
        </div>

        <div className="hero-scroll">
          <span>Log</span>
          <span className="line" />
        </div>
      </section>

      <section className="ledger" aria-label="Today's summary">
        {LEDGER_ITEMS.map((item) => (
          <div className={`ledger-item ${item.variant}`} key={item.label}>
            <div className="num">
              {item.num}
              {item.suffix && <span>{item.suffix}</span>}
            </div>
            <div className="label">{item.label}</div>
          </div>
        ))}
      </section>

      <section className="calls" id="calls">
        <div className="calls-head">
          <h2>Ports of call</h2>
          <p>Five berths, one terminal. Everything you track in Portivo, in one line of sight.</p>
        </div>

        <div className="calls-grid">
          {PORTS_OF_CALL.map(({ berth, accent, Icon, title, description, status, href }, i) => (
            <Link
              className={`call-card c-${accent} reveal`}
              to={href}
              key={title}
              style={{ animationDelay: `${0.05 + i * 0.05}s` }}
            >
              <span className="berth">{berth}</span>
              <Icon />
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="status">{status}</span>
            </Link>
          ))}
        </div>
      </section>

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
.portivo-root html{ scroll-behavior:smooth; }

/* ---------- HERO ---------- */
.portivo-root .hero{
  position:relative;
  min-height:clamp(640px, 100vh, 900px);
  background:var(--ink);
  overflow:hidden;
  display:flex;
  flex-direction:column;
}

.portivo-root .hero-chart{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
}

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
.portivo-root .hero-topbar nav a:focus-visible{
  outline:1px solid var(--teal-soft);
  outline-offset:4px;
}

.portivo-root .hero-topbar .sync{
  display:flex;
  align-items:center;
  gap:8px;
}

.portivo-root .sync-dot{
  width:6px; height:6px; border-radius:50%;
  background:var(--teal-soft);
  flex-shrink:0;
}
@media (prefers-reduced-motion: no-preference){
  .portivo-root .sync-dot{ animation:portivo-blink 2.4s ease-in-out infinite; }
}
@keyframes portivo-blink{ 0%,100%{ opacity:1; } 50%{ opacity:0.25; } }

.portivo-root .hero-content{
  position:relative;
  z-index:2;
  flex:1;
  display:flex;
  flex-direction:column;
  justify-content:center;
  align-items:flex-start;
  padding:0 clamp(24px, 5vw, 64px) 96px;
  max-width:880px;
}

.portivo-root .eyebrow{
  font-family:var(--mono);
  font-size:0.75rem;
  letter-spacing:0.22em;
  text-transform:uppercase;
  color:var(--teal-soft);
  margin-bottom:24px;
}

.portivo-root .hero-content h1{
  font-family:var(--display);
  font-weight:600;
  font-size:clamp(3.4rem, 11vw, 7.5rem);
  line-height:0.95;
  letter-spacing:-0.02em;
  color:var(--text-on-ink);
  margin-bottom:28px;
}

.portivo-root .hero-content .tagline{
  font-family:var(--display);
  font-weight:300;
  font-size:clamp(1.2rem, 2.4vw, 1.7rem);
  line-height:1.5;
  color:var(--text-on-ink);
  max-width:34ch;
  margin-bottom:36px;
}

.portivo-root .hero-content .tagline em{
  font-style:italic;
  font-weight:400;
  color:var(--amber-soft);
}

.portivo-root .hero-cta{
  display:inline-flex;
  align-items:center;
  gap:12px;
  font-family:var(--mono);
  font-size:0.8rem;
  letter-spacing:0.12em;
  text-transform:uppercase;
  color:var(--ink);
  background:var(--text-on-ink);
  border:1px solid var(--text-on-ink);
  padding:14px 26px;
  border-radius:2px;
  width:fit-content;
  transition:background .2s ease, color .2s ease, transform .2s ease;
}
.portivo-root .hero-cta:hover{
  background:transparent;
  color:var(--text-on-ink);
  transform:translateX(4px);
}
.portivo-root .hero-cta:focus-visible{
  outline:2px solid var(--teal-soft);
  outline-offset:4px;
}

.portivo-root .hero-scroll{
  position:relative;
  z-index:2;
  align-self:center;
  margin-bottom:28px;
  font-family:var(--mono);
  font-size:0.7rem;
  letter-spacing:0.2em;
  text-transform:uppercase;
  color:var(--text-on-ink-muted);
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:10px;
}
.portivo-root .hero-scroll .line{
  width:1px; height:36px;
  background:linear-gradient(to bottom, var(--text-on-ink-muted), transparent);
}

/* ship glyphs */
.portivo-root .ship{ fill:var(--text-on-ink); }
@media (prefers-reduced-motion: reduce){
  .portivo-root .ship-anim{ display:none; }
}
@media (prefers-reduced-motion: no-preference){
  .portivo-root .tunis-ring{ animation:portivo-pulse 3.2s ease-out infinite; transform-origin:center; transform-box:fill-box; }
}
@keyframes portivo-pulse{
  0%{ transform:scale(0.5); opacity:0.7; }
  100%{ transform:scale(2.6); opacity:0; }
}

/* ---------- LEDGER ---------- */
.portivo-root .ledger{
  background:var(--paper-2);
  border-top:1px solid var(--ink);
  border-bottom:1px solid rgba(11,42,61,0.12);
  display:flex;
  flex-wrap:wrap;
}

.portivo-root .ledger-item{
  flex:1 1 200px;
  padding:28px clamp(20px, 4vw, 48px);
  border-right:1px solid rgba(11,42,61,0.12);
}
.portivo-root .ledger-item:last-child{ border-right:none; }

.portivo-root .ledger-item .num{
  font-family:var(--mono);
  font-weight:700;
  font-size:clamp(1.8rem, 4vw, 2.6rem);
  color:var(--ink);
  line-height:1;
}
.portivo-root .ledger-item .num span{
  font-size:0.55em;
  font-weight:400;
  color:var(--text-muted);
  margin-left:2px;
}
.portivo-root .ledger-item .label{
  margin-top:8px;
  font-family:var(--mono);
  font-size:0.7rem;
  letter-spacing:0.16em;
  text-transform:uppercase;
  color:var(--text-muted);
}
.portivo-root .ledger-item.note .num{ color:var(--amber); }
.portivo-root .ledger-item.good .num{ color:var(--teal); }

/* ---------- PORTS OF CALL ---------- */
.portivo-root .calls{
  padding:96px clamp(24px, 5vw, 64px) 110px;
  max-width:1320px;
  margin:0 auto;
}

.portivo-root .calls-head{
  display:flex;
  justify-content:space-between;
  align-items:flex-end;
  flex-wrap:wrap;
  gap:24px;
  margin-bottom:56px;
  border-bottom:1px solid rgba(11,42,61,0.18);
  padding-bottom:24px;
}

.portivo-root .calls-head h2{
  font-family:var(--display);
  font-weight:500;
  font-size:clamp(2rem, 4vw, 3rem);
  letter-spacing:-0.01em;
}

.portivo-root .calls-head p{
  font-family:var(--mono);
  font-size:0.8rem;
  letter-spacing:0.08em;
  color:var(--text-muted);
  max-width:32ch;
}

.portivo-root .calls-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit, minmax(250px, 1fr));
  gap:1px;
  background:rgba(11,42,61,0.18);
  border:1px solid rgba(11,42,61,0.18);
}

.portivo-root .call-card{
  position:relative;
  background:var(--paper);
  padding:32px 28px 28px;
  display:flex;
  flex-direction:column;
  gap:18px;
  min-height:240px;
  transition:background .25s ease, transform .25s ease;
}

.portivo-root .call-card:hover{
  background:#F5F1E6;
  transform:translateY(-4px);
}
.portivo-root .call-card:focus-visible{
  outline:2px solid var(--ink);
  outline-offset:-2px;
}

.portivo-root .call-card .berth{
  font-family:var(--mono);
  font-size:0.7rem;
  letter-spacing:0.2em;
  text-transform:uppercase;
  color:var(--text-muted);
}

.portivo-root .call-card .icon{
  width:34px; height:34px;
  color:var(--card-accent, var(--ink));
}

.portivo-root .call-card h3{
  font-family:var(--display);
  font-weight:600;
  font-size:1.4rem;
  letter-spacing:-0.01em;
}

.portivo-root .call-card p{
  font-size:0.9rem;
  line-height:1.55;
  color:var(--text-muted);
  flex:1;
}

.portivo-root .call-card .status{
  align-self:flex-start;
  font-family:var(--mono);
  font-size:0.7rem;
  letter-spacing:0.14em;
  text-transform:uppercase;
  padding:6px 12px;
  border:1px solid var(--card-accent, var(--ink));
  color:var(--card-accent, var(--ink));
  border-radius:2px;
}

.portivo-root .call-card.c-teal{ --card-accent:var(--teal); }
.portivo-root .call-card.c-coral{ --card-accent:var(--coral); }
.portivo-root .call-card.c-amber{ --card-accent:var(--amber); }
.portivo-root .call-card.c-ink{ --card-accent:var(--ink); }

/* ---------- FOOTER ---------- */
.portivo-root footer{
  background:var(--ink);
  color:var(--text-on-ink-muted);
  padding:48px clamp(24px, 5vw, 64px);
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

/* ---------- RESPONSIVE ---------- */
@media (max-width: 720px){
  .portivo-root .hero-topbar nav{ display:none; }
  .portivo-root .ledger{ flex-direction:column; }
  .portivo-root .ledger-item{ border-right:none; border-bottom:1px solid rgba(11,42,61,0.12); }
  .portivo-root .ledger-item:last-child{ border-bottom:none; }
  .portivo-root .calls{ padding-top:64px; padding-bottom:72px; }
}

/* page-load reveal */
@media (prefers-reduced-motion: no-preference){
  .portivo-root .reveal{
    animation:portivo-rise 0.9s cubic-bezier(.22,.61,.36,1) both;
  }
  @keyframes portivo-rise{
    from{ opacity:0; transform:translateY(18px); }
    to{ opacity:1; transform:translateY(0); }
  }
}
`;
