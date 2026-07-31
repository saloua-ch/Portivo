import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Ship, Plane, Globe } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import * as storage from "../api/storage";
import {
  WIDTH, HEIGHT, projection, pathGenerator, countries, graticuleLines,
  TUNIS, useRoutePosition,
} from "../lib/worldMap";

/**
 * Portivo — maritime port-operations landing page
 *
 * Place at: src/pages/Home.jsx
 * Rendered at "/" as a full-screen route (no Sidebar/AppShell).
 *
 * Hero map uses d3-geo directly (no react-simple-maps — that package
 * ships a "browser" field pointing at a UMD bundle with stray
 * require() interop code that breaks under Vite's dev server; d3-geo
 * and topojson-client are clean ES modules with no such issue) to
 * project real world geography from the world-atlas topojson package,
 * and lucide-react for the boat/plane glyphs. Projection/topology setup
 * lives in lib/worldMap.js, shared with Analytics' lane map. Requires:
 *   npm install d3-geo topojson-client world-atlas lucide-react
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

const IconPlus = (props) => (
  <svg viewBox="0 0 24 24" className="icon" {...props}>
    <g
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </g>
  </svg>
);
const IconArchive = (props) => (
  <svg viewBox="0 0 24 24" className="icon" {...props}>
    <g
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3.5" width="18" height="5" rx="1" />
      <path d="M4.5 8.5V19a1.5 1.5 0 0 0 1.5 1.5h12A1.5 1.5 0 0 0 19.5 19V8.5" />
      <path d="M9.5 12.5h5" />
    </g>
  </svg>
);

/* ---- real-world coordinates as [longitude, latitude] ---- */
const CITIES = {
  shanghai: [121.47, 31.23],
  genoa: [8.93, 44.41],
  valencia: [-0.38, 39.47],
  rome: [12.5, 41.9],
  istanbul: [28.98, 41.01],
};

const ROUTES = [
  { id: "shanghai", vehicle: "boat", from: CITIES.shanghai, color: "var(--teal)", duration: 34, offset: 0 },
  { id: "genoa", vehicle: "boat", from: CITIES.genoa, color: "var(--amber)", duration: 16, offset: 5 },
  { id: "valencia", vehicle: "boat", from: CITIES.valencia, color: "var(--coral)", duration: 17, offset: 10 },
  { id: "rome", vehicle: "plane", from: CITIES.rome, color: "var(--teal-soft)", duration: 9, offset: 2 },
  { id: "istanbul", vehicle: "plane", from: CITIES.istanbul, color: "var(--amber-soft)", duration: 10, offset: 6 },
];

function RouteVehicle({ from, to, duration, offset, color, vehicle }) {
  const [x, y] = useRoutePosition(from, to, duration, offset);
  const Icon = vehicle === "plane" ? Plane : Ship;
  const size = vehicle === "plane" ? 20 : 22;

  return (
    <g className="vehicle-icon" transform={`translate(${x}, ${y})`}>
      <Icon x={-size / 2} y={-size / 2} width={size} height={size} color={color} strokeWidth={1.75} />
    </g>
  );
}

function getPortsOfCall(t) {
  return [
    {
      berth: t("home.berth1"),
      accent: "teal",
      Icon: IconShip,
      title: t("nav.arrivals"),
      description: t("home.descArrivals"),
      status: t("home.statusArrivals"),
      href: "/arrivals",
    },
    {
      berth: t("home.berth2"),
      accent: "amber",
      Icon: IconBox,
      title: t("nav.containers"),
      description: t("home.descContainers"),
      status: t("home.statusContainers"),
      href: "/containers",
    },
    {
      berth: t("home.berth3"),
      accent: "ink",
      Icon: IconSearch,
      title: t("nav.search"),
      description: t("home.descSearch"),
      status: t("home.statusSearch"),
      href: "/search",
    },
    {
      berth: t("home.berth4"),
      accent: "coral",
      Icon: IconUpload,
      title: t("nav.import"),
      description: t("home.descImport"),
      status: t("home.statusImport"),
      href: "/import",
    },
    {
      berth: t("home.berth5"),
      accent: "teal",
      Icon: IconChart,
      title: t("nav.analytics"),
      description: t("home.descAnalytics"),
      status: t("home.statusAnalytics"),
      href: "/analytics",
    },
    {
      berth: t("home.berth6"),
      accent: "slate",
      Icon: IconPlus,
      title: t("nav.addEntry"),
      description: t("home.descAddEntry"),
      status: t("home.statusAddEntry"),
      href: "/AddEntry",
    },
    {
      berth: t("home.berth7"),
      accent: "slate",
      Icon: IconArchive,
      title: t("nav.archives"),
      description: t("home.descArchives"),
      status: t("home.statusArchives"),
      href: "/Archives",
    },
  ];
}

function pad(n) { return String(n).padStart(2, "0"); }

function diffDays(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = Math.round((new Date(dateStr) - today) / 86400000);
  return Number.isFinite(d) ? d : null;
}

/* Same definitions as Arrivals.jsx, so the homepage headline numbers
 * always agree with what you'd see if you clicked through. */
function computeLedgerItems(containers, t) {
  const weekCount = containers.filter(c => { const d = diffDays(c.eta); return d != null && d >= 0 && d <= 7; }).length;
  const customsCount = containers.filter(c => c.status === "customs").length;
  const overdueCount = containers.filter(c => { const d = diffDays(c.eta); return d != null && d < 0 && c.status !== "delivered"; }).length;
  const shipmentsCount = containers.reduce((a, c) => a + (c.groupages?.length || 0), 0);

  return [
    { num: pad(weekCount), label: t("arrivals.kpiArrivingWeek"), variant: "" },
    { num: pad(customsCount), label: t("arrivals.kpiAwaitingCustoms"), variant: "note" },
    { num: pad(overdueCount), label: t("arrivals.kpiPastEta"), variant: overdueCount > 0 ? "danger" : "good" },
    { num: pad(shipmentsCount), suffix: t("home.ledgerLoggedSuffix"), label: t("home.ledgerShipmentsOnRecord"), variant: "" },
  ];
}

export default function Home() {
  const { t, language, toggleLanguage } = useLanguage();
  const PORTS_OF_CALL = getPortsOfCall(t);

  const [containers, setContainers] = useState([]);
  useEffect(() => {
    let mounted = true;
    function load() {
      storage.getContainers().then(list => { if (mounted) setContainers(list); }).catch(() => {});
    }
    load();
    const unsubscribe = storage.onChange(load);
    return () => { mounted = false; unsubscribe(); };
  }, []);
  const LEDGER_ITEMS = computeLedgerItems(containers, t);

  return (
    <div className="portivo-root">
      <style>{CSS}</style>

      <section className="hero">
        <div className="hero-map">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <g className="graticule">
              <path d={pathGenerator(graticuleLines)} />
            </g>

            <g className="land">
              {countries.map((country, i) => (
                <path key={country.id ?? i} d={pathGenerator(country)} />
              ))}
            </g>

            {ROUTES.map((route) => {
              const line = {
                type: "LineString",
                coordinates: [route.from, TUNIS],
              };
              return (
                <path
                  key={route.id}
                  d={pathGenerator(line)}
                  fill="none"
                  stroke={route.color}
                  strokeWidth={1.4}
                  strokeDasharray="1 6"
                  strokeLinecap="round"
                  opacity={0.55}
                />
              );
            })}

            {(() => {
              const [tx, ty] = projection(TUNIS);
              return (
                <g transform={`translate(${tx}, ${ty})`}>
                  <circle className="tunis-ring" r={5} fill="var(--coral)" opacity={0.5} />
                  <circle r={5} fill="var(--coral)" />
                </g>
              );
            })()}

            {ROUTES.map((route) => (
              <RouteVehicle
                key={route.id}
                from={route.from}
                to={TUNIS}
                duration={route.duration}
                offset={route.offset}
                color={route.color}
                vehicle={route.vehicle}
              />
            ))}
          </svg>
        </div>

        <div className="hero-scrim" aria-hidden="true" />

        <div className="hero-topbar">
          <span className="brand">Portivo</span>
          <nav>
            <Link to="/arrivals">{t("nav.arrivals")}</Link>
            <Link to="/containers">{t("nav.containers")}</Link>
            <Link to="/search">{t("nav.search")}</Link>
            <Link to="/import">{t("nav.import")}</Link>
            <Link to="/analytics">{t("nav.analytics")}</Link>
            <Link to="/AddEntry">{t("nav.addEntry")}</Link>
            <Link to="/Archives">{t("nav.archives")}</Link>
          </nav>
          <span className="hero-topbar-right">
            <button
              type="button"
              className="lang-toggle"
              onClick={toggleLanguage}
              aria-label="Change language"
              title={t("topnav.language")}
            >
              <Globe size={13} />
              {language.toUpperCase()}
            </button>
            <span className="sync">
              <span className="sync-dot" />
              {t("home.syncedPrefix")} 11:51
            </span>
          </span>
        </div>

        <div className="hero-content">
          <p className="eyebrow reveal" style={{ animationDelay: ".05s" }}>
            {t("home.heroEyebrow")}
          </p>
          <h1 className="reveal" style={{ animationDelay: ".15s" }}>
            Portivo
          </h1>
          <p className="tagline reveal" style={{ animationDelay: ".3s" }}>
            {t("home.taglinePrefix")} <em>{t("home.taglineEmphasis")}</em> {t("home.taglineSuffix")}
          </p>
          <a className="hero-cta reveal" style={{ animationDelay: ".45s" }} href="#calls">
            {t("home.heroCta")} &rarr;
          </a>
        </div>

        <div className="hero-scroll">
          <span>{t("home.scrollLog")}</span>
          <span className="line" />
        </div>
      </section>

      <section className="ledger" aria-label={t("home.todaysSummary")}>
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
          <h2>{t("home.portsOfCallTitle")}</h2>
          <p>{t("home.portsOfCallSubtitle")}</p>
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
        <span className="coords">{t("home.footerCoords")}</span>
      </footer>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap');

.portivo-root{
  --ink: #0B2A3D;
  --ink-deep: #082030;
  --ink-line: rgba(111,139,156,0.22);
  --land: #E4D9B4;
  --land-hover: #EFE6C6;
  --land-line: #8A9CA8;
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

.portivo-root .hero-map{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
}
.portivo-root .hero-map svg{
  width:100%;
  height:100%;
  display:block;
}

.portivo-root .land path{
  fill: var(--land);
  stroke: var(--land-line);
  stroke-width: 0.6;
  transition: fill 0.2s ease;
}
.portivo-root .land path:hover{ fill: var(--land-hover); }

.portivo-root .graticule path{
  fill: none;
  stroke: var(--ink-line);
  stroke-width: 0.6;
}

.portivo-root .vehicle-icon{
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.5));
}

@media (prefers-reduced-motion: no-preference){
  .portivo-root .tunis-ring{ animation:portivo-pulse 3.2s ease-out infinite; transform-origin:center; transform-box:fill-box; }
}
@keyframes portivo-pulse{
  0%{ transform:scale(0.6); opacity:0.7; }
  100%{ transform:scale(3.2); opacity:0; }
}

.portivo-root .hero-scrim{
  position:absolute;
  top:0; left:0; right:0;
  height:220px;
  background:linear-gradient(to bottom, rgba(8,32,48,0.85) 0%, rgba(8,32,48,0.4) 55%, rgba(8,32,48,0) 100%);
  z-index:1;
  pointer-events:none;
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

.portivo-root .hero-topbar-right{
  display:flex;
  align-items:center;
  gap:18px;
}

.portivo-root .lang-toggle{
  display:flex;
  align-items:center;
  gap:6px;
  padding:6px 10px;
  border-radius:7px;
  border:1px solid rgba(255,255,255,0.14);
  background:rgba(255,255,255,0.05);
  color:var(--text-on-ink-muted);
  cursor:pointer;
  font-family:var(--mono);
  font-size:0.7rem;
  letter-spacing:0.1em;
  text-transform:uppercase;
  transition:background .15s, color .15s, border-color .15s;
}
.portivo-root .lang-toggle:hover{
  background:rgba(255,255,255,0.1);
  color:var(--text-on-ink);
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
.portivo-root .ledger-item.danger .num{ color:var(--coral); }

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
.portivo-root .call-card.c-slate{ --card-accent:#5B6E78; }

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