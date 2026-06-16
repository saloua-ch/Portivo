import { useNavigate } from "react-router-dom";
import { containers } from "../data/mockData";
import {
  AlertCircle, AlertTriangle, Ship, ClipboardList,
  Anchor, CheckCircle, Search as SearchIcon, ArrowUpDown,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";

/* ── Google Fonts ── */
if (typeof document !== "undefined" && !document.getElementById("pvc-gf")) {
  const l = document.createElement("link");
  l.id = "pvc-gf"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap";
  document.head.appendChild(l);
}

/* ── Status config ── */
const STATUS = {
  in_transit:    { label: "In transit",    color: "#2F7E6C", bg: "#C7E0D8", pip: "#2F7E6C", Icon: Ship },
  customs:       { label: "In customs",    color: "#8a620d", bg: "#F0DDB3", pip: "#C9912B", Icon: ClipboardList },
  arriving_soon: { label: "Arriving soon", color: "#0e4980", bg: "#B5D4F4", pip: "#185FA5", Icon: Anchor },
  delivered:     { label: "Delivered",     color: "#2F7E6C", bg: "#C7E0D8", pip: "#2F7E6C", Icon: CheckCircle },
};

const FILTERS = [
  { key: "all",           label: "All" },
  { key: "attention",     label: "Needs attention", flag: true },
  { key: "in_transit",    label: "In transit" },
  { key: "customs",       label: "In customs" },
  { key: "arriving_soon", label: "Arriving soon" },
  { key: "delivered",     label: "Delivered" },
];

/* ── Helpers ── */
function diffDays(str) {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((new Date(str) - t) / 86400000);
}
function fmtShort(str) {
  return new Date(str).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function etaLabel(str) {
  const d = diffDays(str);
  if (d < 0) return "Overdue";
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  return fmtShort(str);
}

/* ── Isometric container yard SVG ── */
function ContainerYard() {
  return (
    <svg viewBox="0 0 420 260" width="420" height="260" aria-hidden="true" style={{ display: "block", opacity: 0.9 }}>

      {/* Ground plane */}
      <polygon points="0,200 210,130 420,200 210,260" fill="#082030" />

      {/* === ROW A: left stack — 2 containers === */}
      {/* A1 bottom — teal (in transit) */}
      <g transform="translate(30,90)">
        <polygon points="0,20 60,-10 120,20 60,50" fill="#1a5c4a" />
        <polygon points="0,20 0,65 60,80 60,50" fill="#0d3d30" />
        <polygon points="120,20 120,65 60,80 60,50" fill="#164f3e" />
        <line x1="0" y1="35" x2="60" y2="63" stroke="#091f18" strokeWidth="0.8" />
        <line x1="0" y1="50" x2="60" y2="72" stroke="#091f18" strokeWidth="0.8" />
        <line x1="120" y1="35" x2="60" y2="63" stroke="#102d24" strokeWidth="0.8" />
        <line x1="120" y1="50" x2="60" y2="72" stroke="#102d24" strokeWidth="0.8" />
        <line x1="90" y1="30" x2="90" y2="72" stroke="#102d24" strokeWidth="1.2" />
        <line x1="90" y1="51" x2="120" y2="45" stroke="#102d24" strokeWidth="0.8" />
      </g>
      {/* A2 top — amber (customs) */}
      <g transform="translate(30,55)">
        <polygon points="0,20 60,-10 120,20 60,50" fill="#7a5810" />
        <polygon points="0,20 0,55 60,70 60,50" fill="#4d3808" />
        <polygon points="120,20 120,55 60,70 60,50" fill="#63470a" />
        <line x1="0" y1="35" x2="60" y2="55" stroke="#2d2005" strokeWidth="0.8" />
        <line x1="0" y1="48" x2="60" y2="65" stroke="#2d2005" strokeWidth="0.8" />
        <line x1="120" y1="35" x2="60" y2="55" stroke="#3d2a07" strokeWidth="0.8" />
        <line x1="90" y1="28" x2="90" y2="66" stroke="#3d2a07" strokeWidth="1.2" />
      </g>

      {/* === ROW B: center — 4 stacked === */}
      {/* B1 bottom — red (attention) */}
      <g transform="translate(150,110)">
        <polygon points="0,20 60,-10 120,20 60,50" fill="#7a2318" />
        <polygon points="0,20 0,65 60,80 60,50" fill="#4d160f" />
        <polygon points="120,20 120,65 60,80 60,50" fill="#631d13" />
        <line x1="0" y1="35" x2="60" y2="63" stroke="#2d0c09" strokeWidth="0.8" />
        <line x1="0" y1="50" x2="60" y2="72" stroke="#2d0c09" strokeWidth="0.8" />
        <line x1="120" y1="35" x2="60" y2="63" stroke="#3d100c" strokeWidth="0.8" />
        <line x1="120" y1="50" x2="60" y2="72" stroke="#3d100c" strokeWidth="0.8" />
        <line x1="90" y1="30" x2="90" y2="72" stroke="#3d100c" strokeWidth="1.2" />
      </g>
      {/* B2 */}
      <g transform="translate(150,75)">
        <polygon points="0,20 60,-10 120,20 60,50" fill="#1a5c4a" />
        <polygon points="0,20 0,58 60,73 60,50" fill="#0d3d30" />
        <polygon points="120,20 120,58 60,73 60,50" fill="#164f3e" />
        <line x1="0" y1="35" x2="60" y2="57" stroke="#091f18" strokeWidth="0.8" />
        <line x1="0" y1="50" x2="60" y2="68" stroke="#091f18" strokeWidth="0.8" />
        <line x1="120" y1="35" x2="60" y2="57" stroke="#102d24" strokeWidth="0.8" />
        <line x1="90" y1="28" x2="90" y2="68" stroke="#102d24" strokeWidth="1.2" />
      </g>
      {/* B3 */}
      <g transform="translate(150,40)">
        <polygon points="0,20 60,-10 120,20 60,50" fill="#7a5810" />
        <polygon points="0,20 0,58 60,73 60,50" fill="#4d3808" />
        <polygon points="120,20 120,58 60,73 60,50" fill="#63470a" />
        <line x1="0" y1="35" x2="60" y2="57" stroke="#2d2005" strokeWidth="0.8" />
        <line x1="120" y1="35" x2="60" y2="57" stroke="#3d2a07" strokeWidth="0.8" />
        <line x1="90" y1="28" x2="90" y2="68" stroke="#3d2a07" strokeWidth="1.2" />
      </g>
      {/* B4 top */}
      <g transform="translate(150,8)">
        <polygon points="0,20 60,-10 120,20 60,50" fill="#184f41" />
        <polygon points="0,20 0,55 60,68 60,50" fill="#0b3229" />
        <polygon points="120,20 120,55 60,68 60,50" fill="#134437" />
        <line x1="90" y1="28" x2="90" y2="65" stroke="#0a2820" strokeWidth="1.2" />
      </g>

      {/* === ROW C: right — 2 containers === */}
      {/* C1 bottom — blue (arriving) */}
      <g transform="translate(270,130)">
        <polygon points="0,20 60,-10 120,20 60,50" fill="#1e3a6e" />
        <polygon points="0,20 0,65 60,80 60,50" fill="#122547" />
        <polygon points="120,20 120,65 60,80 60,50" fill="#192f5c" />
        <line x1="0" y1="35" x2="60" y2="63" stroke="#0b1830" strokeWidth="0.8" />
        <line x1="0" y1="50" x2="60" y2="72" stroke="#0b1830" strokeWidth="0.8" />
        <line x1="120" y1="35" x2="60" y2="63" stroke="#101f3d" strokeWidth="0.8" />
        <line x1="90" y1="30" x2="90" y2="72" stroke="#101f3d" strokeWidth="1.2" />
      </g>
      {/* C2 top — teal */}
      <g transform="translate(270,95)">
        <polygon points="0,20 60,-10 120,20 60,50" fill="#1a5c4a" />
        <polygon points="0,20 0,58 60,73 60,50" fill="#0d3d30" />
        <polygon points="120,20 120,58 60,73 60,50" fill="#164f3e" />
        <line x1="0" y1="35" x2="60" y2="57" stroke="#091f18" strokeWidth="0.8" />
        <line x1="120" y1="35" x2="60" y2="57" stroke="#102d24" strokeWidth="0.8" />
        <line x1="90" y1="28" x2="90" y2="68" stroke="#102d24" strokeWidth="1.2" />
      </g>

      {/* === Crane structure === */}
      <g opacity="0.5">
        <line x1="385" y1="50" x2="385" y2="230" stroke="#18435A" strokeWidth="3" />
        <line x1="410" y1="70" x2="410" y2="230" stroke="#18435A" strokeWidth="3" />
        <line x1="340" y1="50" x2="420" y2="50" stroke="#18435A" strokeWidth="4" />
        <line x1="340" y1="58" x2="420" y2="58" stroke="#18435A" strokeWidth="1.5" />
        <line x1="360" y1="54" x2="348" y2="120" stroke="#18435A" strokeWidth="1" strokeDasharray="3 4" />
        <line x1="380" y1="54" x2="368" y2="120" stroke="#18435A" strokeWidth="1" strokeDasharray="3 4" />
        <rect x="340" y="120" width="36" height="6" fill="#18435A" rx="1" />
        <line x1="385" y1="50" x2="410" y2="100" stroke="#18435A" strokeWidth="1.5" />
        <line x1="410" y1="50" x2="385" y2="100" stroke="#18435A" strokeWidth="1.5" />
        <line x1="397" y1="100" x2="397" y2="230" stroke="#18435A" strokeWidth="2" />
      </g>

      {/* Foreground partial container */}
      <g transform="translate(60,168)">
        <polygon points="0,16 90,-14 150,8 60,38" fill="#7a2318" />
        <polygon points="0,16 0,46 60,60 60,38" fill="#4d160f" />
        <polygon points="150,8 150,38 60,60 60,38" fill="#631d13" />
        <line x1="0" y1="30" x2="60" y2="52" stroke="#2d0c09" strokeWidth="0.8" />
        <line x1="150" y1="22" x2="60" y2="52" stroke="#3d100c" strokeWidth="0.8" />
        <line x1="112" y1="21" x2="112" y2="51" stroke="#3d100c" strokeWidth="1.2" />
      </g>

      {/* Legend */}
      <g fontFamily="IBM Plex Mono" fontSize="10" letterSpacing="1.5" fill="#6F8B9C">
        <circle cx="16" cy="240" r="4" fill="#2F7E6C" />
        <text x="26" y="244">IN TRANSIT</text>
        <circle cx="110" cy="240" r="4" fill="#C9912B" />
        <text x="120" y="244">CUSTOMS</text>
        <circle cx="194" cy="240" r="4" fill="#7a2318" />
        <text x="204" y="244">ATTENTION</text>
        <circle cx="293" cy="240" r="4" fill="#1e3a6e" />
        <text x="303" y="244">ARRIVING</text>
      </g>
    </svg>
  );
}

/* ── Main component ── */
export default function Containers() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");
  const [query, setQuery]               = useState("");
  const [sortAsc, setSortAsc]           = useState(true);
  const [syncTime, setSyncTime]         = useState("");

  useEffect(() => {
    setSyncTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
  }, []);

  /* counts */
  const counts = useMemo(() => {
    const c = { all: containers.length, attention: 0, in_transit: 0, customs: 0, arriving_soon: 0, delivered: 0 };
    containers.forEach(item => {
      if (item.needsAttention) c.attention++;
      if (c[item.status] !== undefined) c[item.status]++;
    });
    return c;
  }, []);

  /* filtered list */
  const filtered = useMemo(() => {
    let list = [...containers];
    if (activeFilter === "attention") list = list.filter(c => c.needsAttention);
    else if (activeFilter !== "all")  list = list.filter(c => c.status === activeFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(c =>
        [c.number, c.carrier, c.origin, c.destination].some(v => v.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => sortAsc
      ? new Date(a.eta) - new Date(b.eta)
      : new Date(b.eta) - new Date(a.eta)
    );
    return list;
  }, [activeFilter, query, sortAsc]);

  const ledgerCells = [
    { n: containers.length, label: "On file",    accent: "#2F7E6C" },
    { n: counts.in_transit, label: "In transit", accent: "#2F7E6C" },
    { n: counts.customs,    label: "Customs",    accent: "#C9912B" },
    { n: counts.attention,  label: "Attention",  accent: "#D6492F" },
    { n: counts.arriving_soon, label: "Arriving", accent: "#185FA5" },
  ];

  return (
    <div style={ROOT}>
      <style>{CSS}</style>

      {/* ── Hero ── */}
      <div style={HERO}>
        <div style={HERO_INNER}>
          <div style={HERO_TEXT}>
            <p style={EYEBROW}>Tunis–Goulette terminal · Fleet manifest</p>
            <h1 style={H1}>Containers</h1>
            <p style={HERO_SUB}>Every unit in the fleet — in transit, clearing customs, or delivered.</p>
          </div>
          <div style={HERO_MAP}>
            <ContainerYard />
          </div>
        </div>
      </div>

      {/* ── Ledger strip ── */}
      <div style={LEDGER}>
        {ledgerCells.map(({ n, label, accent }) => (
          <div key={label} style={{ ...LEDGER_CELL, borderLeftColor: accent }}>
            <div style={{ ...LEDGER_NUM, color: accent }}>{String(n).padStart(2, "0")}</div>
            <div style={LEDGER_LABEL}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Body ── */}
      <div style={BODY}>

        {/* Toolbar */}
        <div style={TOOLBAR}>
          <div style={SRCH}>
            <SearchIcon size={14} color="#6E7F87" aria-hidden="true" />
            <input
              style={SRCH_INPUT}
              type="text"
              placeholder="Container number, carrier, route…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label="Search containers"
            />
          </div>
          <div style={TOTAL_LABEL}>
            {filtered.length} container{filtered.length !== 1 ? "s" : ""}
          </div>
          <button style={SORT_BTN} onClick={() => setSortAsc(v => !v)}>
            <ArrowUpDown size={13} aria-hidden="true" />
            ETA {sortAsc ? "↑" : "↓"}
          </button>
        </div>

        {/* Filters */}
        <div style={FILT_ROW} role="tablist">
          {FILTERS.map(({ key, label, flag }) => {
            const on = activeFilter === key;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={on}
                className={`pvc-filter${flag ? " flag" : ""}${on ? " on" : ""}`}
                onClick={() => setActiveFilter(key)}
              >
                {label}
                <span className={`pvc-badge${flag ? " flag" : ""}`}>{counts[key] ?? 0}</span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={EMPTY}>
            <Ship size={26} style={{ marginBottom: 10, opacity: 0.35 }} aria-hidden="true" />
            <p>No containers match this filter.</p>
          </div>
        ) : (
          <div style={GRID}>
            {filtered.map(c => {
              const cfg = STATUS[c.status] || STATUS.in_transit;
              const ca  = c.needsAttention ? "#D6492F" : cfg.color;
              const ov  = diffDays(c.eta) < 0;
              return (
                <div
                  key={c.id}
                  className="pvc-card"
                  onClick={() => navigate(`/containers/${c.id}`)}
                  style={{ borderLeftColor: ca }}
                >
                  {/* Stamp header */}
                  <div style={CARD_HEAD}>
                    <div style={{ ...STAMP, borderColor: ca, color: ca }}>
                      <span style={STAMP_NUM}>{c.number}</span>
                    </div>
                    {c.needsAttention && (
                      <AlertCircle size={14} color="#D6492F" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                    )}
                  </div>

                  {/* Body */}
                  <div style={CARD_BODY}>
                    <div style={ROUTE}>
                      <span>{c.origin}</span>
                      <span style={RARR}>→</span>
                      <span>{c.destination}</span>
                    </div>
                    <p style={CARRIER}>{c.carrier}</p>
                    {c.needsAttention && (
                      <div style={ALERT_ROW}>
                        <AlertTriangle size={12} aria-hidden="true" />
                        {c.attentionReason}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div style={CARD_FOOT}>
                    <span style={{ ...TAG, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    <div style={{ ...ETA_ROW, color: ov ? "#D6492F" : "#6E7F87" }}>
                      <span style={{ ...PIP, background: ov ? "#D6492F" : cfg.pip }} />
                      {etaLabel(c.eta)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filtered.length > 0 && (
          <p style={FOOTER}>
            {filtered.length} container{filtered.length !== 1 ? "s" : ""} shown
            &nbsp;·&nbsp; eta {sortAsc ? "ascending" : "descending"}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Inline style objects ── */
const ROOT = { fontFamily: "'IBM Plex Sans', sans-serif", background: "#ECE7DA", color: "#1C2B33", minHeight: "100vh" };
const HERO = { background: "#0B2A3D", position: "relative", overflow: "hidden", padding: "0 48px" };
const HERO_INNER = { display: "flex", alignItems: "stretch", minHeight: 280, gap: 0 };
const HERO_TEXT = { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "44px 0", zIndex: 2 };
const EYEBROW = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#6F8B9C", margin: "0 0 14px" };
const H1 = { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "clamp(2.6rem, 5vw, 4rem)", letterSpacing: "-0.02em", color: "#DCE6EA", lineHeight: 0.95, margin: "0 0 14px" };
const HERO_SUB = { fontSize: "0.83rem", color: "#6F8B9C", maxWidth: "30ch", lineHeight: 1.6, margin: 0 };
const HERO_MAP = { width: "clamp(260px,35vw,420px)", flexShrink: 0, display: "flex", alignItems: "flex-end", justifyContent: "center" };
const LEDGER = { display: "flex", flexWrap: "wrap", borderBottom: "1px solid rgba(11,42,61,0.18)" };
const LEDGER_CELL = { flex: "1 1 120px", padding: "18px 28px", borderRight: "1px solid rgba(11,42,61,0.12)", borderLeft: "3px solid", background: "#E2DCCB" };
const LEDGER_NUM = { fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: "clamp(1.4rem,2.8vw,2.1rem)", lineHeight: 1 };
const LEDGER_LABEL = { marginTop: 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#6E7F87" };
const BODY = { padding: "36px clamp(24px,5vw,48px) 64px" };
const TOOLBAR = { display: "flex", alignItems: "center", border: "1px solid rgba(11,42,61,0.18)", background: "#E2DCCB" };
const SRCH = { display: "flex", alignItems: "center", gap: 10, flex: 1, padding: "12px 16px", borderRight: "1px solid rgba(11,42,61,0.14)", color: "#6E7F87" };
const SRCH_INPUT = { flex: 1, border: "none", background: "none", outline: "none", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.8rem", color: "#1C2B33" };
const TOTAL_LABEL = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6E7F87", padding: "12px 20px", borderRight: "1px solid rgba(11,42,61,0.14)", whiteSpace: "nowrap" };
const SORT_BTN = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", letterSpacing: "0.06em", background: "none", border: "none", cursor: "pointer", padding: "12px 16px", color: "#6E7F87", display: "flex", alignItems: "center", gap: 5 };
const FILT_ROW = { display: "flex", flexWrap: "wrap", border: "1px solid rgba(11,42,61,0.18)", borderTop: "none", background: "#ECE7DA", marginBottom: 28 };
const GRID = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 1, background: "rgba(11,42,61,0.16)", border: "1px solid rgba(11,42,61,0.18)" };
const CARD_HEAD = { padding: "13px 15px 10px", borderBottom: "1px solid rgba(11,42,61,0.09)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 };
const STAMP = { display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid", padding: "4px 8px" };
const STAMP_NUM = { fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.04em" };
const CARD_BODY = { padding: "11px 15px" };
const ROUTE = { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "0.95rem", color: "#0B2A3D", display: "flex", alignItems: "baseline", gap: 7, marginBottom: 3 };
const RARR = { color: "#6E7F87", fontWeight: 400, fontSize: "0.82rem" };
const CARRIER = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6E7F87", margin: 0 };
const ALERT_ROW = { display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem", color: "#D6492F", borderTop: "1px solid rgba(214,73,47,0.14)", padding: "7px 0 0", marginTop: 7 };
const CARD_FOOT = { marginTop: "auto", padding: "9px 15px", borderTop: "1px solid rgba(11,42,61,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" };
const TAG = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 7px", borderRadius: 2, fontWeight: 600 };
const ETA_ROW = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.62rem", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 4 };
const PIP = { width: 5, height: 5, borderRadius: "50%", flexShrink: 0, display: "inline-block" };
const EMPTY = { textAlign: "center", padding: "56px 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.8rem", color: "#6E7F87", border: "1px solid rgba(11,42,61,0.12)", display: "flex", flexDirection: "column", alignItems: "center" };
const FOOTER = { textAlign: "center", marginTop: 18, fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.66rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6E7F87" };

/* ── CSS (only for filter/card hover — can't do with inline styles) ── */
const CSS = `
.pvc-filter {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.66rem; letter-spacing: 0.12em; text-transform: uppercase;
  color: #6E7F87; background: none; border: none;
  border-right: 1px solid rgba(11,42,61,0.1);
  cursor: pointer; padding: 10px 15px;
  display: flex; align-items: center; gap: 6px;
  transition: color .15s, background .15s; white-space: nowrap;
}
.pvc-filter:last-child { border-right: none; }
.pvc-filter:hover { color: #0B2A3D; background: #E2DCCB; }
.pvc-filter.on { color: #0B2A3D; background: #E2DCCB; box-shadow: inset 0 -2px 0 #0B2A3D; }
.pvc-filter.flag.on { box-shadow: inset 0 -2px 0 #D6492F; }
.pvc-badge {
  font-family: 'IBM Plex Mono', monospace; font-size: 0.56rem; font-weight: 700;
  padding: 1px 5px; border-radius: 2px;
  background: rgba(11,42,61,0.08); color: #6E7F87;
}
.pvc-badge.flag { background: #F8DDD5; color: #D6492F; }
.pvc-filter.on .pvc-badge { background: rgba(11,42,61,0.14); color: #0B2A3D; }
.pvc-filter.flag.on .pvc-badge { background: #F8DDD5; color: #D6492F; }
.pvc-card {
  background: #ECE7DA; cursor: pointer;
  display: flex; flex-direction: column;
  border-left: 4px solid #2F7E6C;
  transition: background .18s, transform .15s;
  position: relative;
}
.pvc-card:hover { background: #F0EBD8; transform: translateY(-3px); z-index: 1; }
@media (max-width: 720px) {
  .pvc-hero-inner { flex-direction: column; }
  .pvc-hero-map { width: 100%; justify-content: center; }
}
`;
