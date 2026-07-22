import React from "react";
import { Link } from "react-router-dom";
import { geoEqualEarth, geoPath, geoGraticule } from "d3-geo";
import { feature } from "topojson-client";
import { Ship, Plane } from "lucide-react";
import worldTopology from "world-atlas/countries-110m.json";

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
 * and lucide-react for the boat/plane glyphs. Requires:
 *   npm install d3-geo topojson-client world-atlas lucide-react
 */

const WIDTH = 1440;
const HEIGHT = 900;

// One shared projection + path generator for the whole map. Centered
// roughly on the Mediterranean so Tunis sits near the visual middle
// while Asia, the Americas, and Australia remain visible for context.
const projection = geoEqualEarth()
  .rotate([-12, -6, 0])
  .scale(205)
  .translate([WIDTH / 2, HEIGHT / 2]);

const pathGenerator = geoPath(projection);
const graticuleLines = geoGraticule()();

// world-atlas ships a TopoJSON topology; convert its one object
// ("countries") into GeoJSON features once, at module load.
const countries = feature(
  worldTopology,
  worldTopology.objects.countries
).features;

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
const TUNIS = [10.18, 36.81];
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

/**
 * Animates a marker's projected [x, y] position along the straight
 * line from `from` to TUNIS (interpolated in lon/lat space, then
 * projected — a reasonable approximation at this scale), looping.
 * Deliberately does NOT rotate the icon — ship and plane glyphs stay
 * upright at all times, which reads cleanly and avoids the
 * "tumbling" artifacts that icon-rotation-along-a-path can produce.
 * Respects prefers-reduced-motion.
 */
function useRoutePosition(from, to, duration, offset) {
  const [t, setT] = React.useState(() => (offset % duration) / duration);
  const frameRef = React.useRef();
  const startRef = React.useRef(null);

  React.useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) return undefined;

    const tick = (now) => {
      if (startRef.current === null) startRef.current = now - offset * 1000;
      const elapsed = now - startRef.current;
      const cycleMs = duration * 1000;
      const progress = ((elapsed % cycleMs) + cycleMs) % cycleMs / cycleMs;
      setT(progress);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [duration, offset]);

  const lon = from[0] + (to[0] - from[0]) * t;
  const lat = from[1] + (to[1] - from[1]) * t;
  return projection([lon, lat]);
}

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
  {
    berth: "Berth 06 — Add entry",
    accent: "slate",
    Icon: IconPlus,
    title: "Add entry",
    description:
      "Log a new shipment by hand — container number, route, carrier, and status — straight into the manifest.",
    status: "Manual log entry",
    href: "/AddEntry",
  },
  {
    berth: "Berth 07 — Archives",
    accent: "slate",
    Icon: IconArchive ,
    title: "Archives",
    description:
      "Browse the full historical record — every container on file, grouped by arrival month, searchable by year.",
    status: "Historical record",
    href: "/Archives",
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
            <Link to="/arrivals">Arrivals</Link>
            <Link to="/containers">Containers</Link>
            <Link to="/search">Search</Link>
            <Link to="/import">Import</Link>
            <Link to="/analytics">Analytics</Link>
            <Link to="/AddEntry">Add Entry</Link>
            <Link to="/Archives">Archives</Link>
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