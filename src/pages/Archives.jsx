import { useNavigate } from "react-router-dom";
import {
  Archive, Ship, CheckCircle, ClipboardList, Anchor,
  AlertCircle, AlertTriangle, ChevronDown, ChevronRight,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import * as storage from "../api/storage";

/* ── Google Fonts (same as Containers) ── */
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

/* ── Helpers ── */
function fmtShort(str) {
  return new Date(str).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function monthKey(str) {
  const d = new Date(str);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(key) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}
function monthShort(key) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString("en-GB", { month: "short" }).toUpperCase();
}
function yearOf(key) {
  return key.split("-")[0];
}

/* ── Year options: current year down to 2000 ── */
const THIS_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = ["All", ...Array.from(
  { length: THIS_YEAR - 1999 },
  (_, i) => String(THIS_YEAR - i)
)];

/* ── Main component ── */
export default function Archives() {
  const navigate = useNavigate();
  const [containers, setContainers] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [collapsed, setCollapsed]   = useState({});  // monthKey → bool
  const [selectedYear, setSelectedYear] = useState("All");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const list = await storage.getContainers();
      setContainers(list);
      setLoading(false);
    }
    load();
    const unsub = storage.onChange(() => load());
    return unsub;
  }, []);

  /* Group by month (ETA), sorted newest → oldest, filtered by year */
  const groups = useMemo(() => {
    const map = {};
    containers.forEach(c => {
      if (selectedYear !== "All" && String(new Date(c.eta).getFullYear()) !== selectedYear) return;
      const k = monthKey(c.eta);
      if (!map[k]) map[k] = [];
      map[k].push(c);
    });
    // Sort containers within each month by ETA desc
    Object.values(map).forEach(arr =>
      arr.sort((a, b) => new Date(b.eta) - new Date(a.eta))
    );
    // Sort months newest first
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [containers, selectedYear]);

  /* Years that actually have data — for dimming empty year buttons */
  const yearsWithData = useMemo(() => {
    const s = new Set();
    containers.forEach(c => s.add(String(new Date(c.eta).getFullYear())));
    return s;
  }, [containers]);

  /* Ledger totals — scoped to filtered view */
  const totals = useMemo(() => {
    const allInView = groups.flatMap(([, items]) => items);
    const t = { months: groups.length, containers: allInView.length, delivered: 0, attention: 0 };
    allInView.forEach(c => {
      if (c.status === "delivered") t.delivered++;
      if (c.needsAttention) t.attention++;
    });
    return t;
  }, [groups]);

  const ledgerCells = [
    { n: totals.months,     label: "Months on file", accent: "#2F7E6C" },
    { n: totals.containers, label: "Total units",    accent: "#2F7E6C" },
    { n: totals.delivered,  label: "Delivered",      accent: "#185FA5" },
    { n: totals.attention,  label: "Had issues",     accent: "#D6492F" },
  ];

  function toggle(key) {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div style={ROOT}>
      <style>{CSS}</style>

      {/* ── Hero ── */}
      <div style={HERO}>
        <img
          src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1200&auto=format&fit=crop"
          alt="Aerial view of a port terminal at dusk"
          style={HERO_PHOTO}
        />
        <div style={HERO_GRADIENT} />
        <div style={HERO_TINT} />
        <span style={HERO_CREDIT}>Photo: Unsplash</span>

        <div style={HERO_CONTENT}>
          <p style={EYEBROW}>Tunis–Goulette terminal · Historical record</p>
          <h1 style={H1}>Archives</h1>
          <p style={HERO_SUB}>All containers on file, grouped by arrival month. Click any row to open the full container record.</p>
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

      {/* ── Year selector ── */}
      <div style={YEAR_SEL_WRAP}>
        <div style={YEAR_SEL_SCROLL}>
          {YEAR_OPTIONS.map(yr => {
            const on = selectedYear === yr;
            const hasData = yr === "All" || yearsWithData.has(yr);
            return (
              <button
                key={yr}
                className={`arc-yr${on ? " on" : ""}${!hasData ? " dim" : ""}`}
                onClick={() => setSelectedYear(yr)}
                title={!hasData ? "No containers in this year" : undefined}
              >
                {yr}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={BODY}>

        {loading ? (
          <div style={EMPTY}>
            <Archive size={26} style={{ marginBottom: 10, opacity: 0.35 }} />
            <p>Loading archive…</p>
          </div>
        ) : groups.length === 0 ? (
          <div style={EMPTY}>
            <Archive size={26} style={{ marginBottom: 10, opacity: 0.35 }} />
            <p>{selectedYear === "All" ? "No containers on file yet." : `No containers found for ${selectedYear}.`}</p>
          </div>
        ) : (
          <div style={TIMELINE}>
            {groups.map(([key, items], gi) => {
              const isOpen = !collapsed[key];
              const prevYear = gi > 0 ? yearOf(groups[gi - 1][0]) : null;
              const thisYear = yearOf(key);
              const showYearDivider = prevYear && prevYear !== thisYear;

              return (
                <div key={key}>
                  {/* Year divider */}
                  {showYearDivider && (
                    <div style={YEAR_DIV}>
                      <div style={YEAR_LINE} />
                      <span style={YEAR_BADGE}>{thisYear}</span>
                      <div style={YEAR_LINE} />
                    </div>
                  )}

                  {/* Month accordion header */}
                  <div
                    className="arc-month-header"
                    onClick={() => toggle(key)}
                    role="button"
                    aria-expanded={isOpen}
                    tabIndex={0}
                    onKeyDown={e => (e.key === "Enter" || e.key === " ") && toggle(key)}
                  >
                    {/* Month stamp */}
                    <div style={MONTH_STAMP}>
                      <div style={MONTH_MON}>{monthShort(key)}</div>
                      <div style={MONTH_YR}>{thisYear}</div>
                    </div>

                    <div style={MONTH_META}>
                      <span style={MONTH_TITLE}>{monthLabel(key)}</span>
                      <div style={MONTH_PILLS}>
                        <span style={PILL_UNIT}>{items.length} unit{items.length !== 1 ? "s" : ""}</span>
                        {items.filter(c => c.needsAttention).length > 0 && (
                          <span style={PILL_ALERT}>
                            <AlertCircle size={9} />
                            {items.filter(c => c.needsAttention).length} flagged
                          </span>
                        )}
                        {items.filter(c => c.status === "delivered").length > 0 && (
                          <span style={PILL_DONE}>
                            <CheckCircle size={9} />
                            {items.filter(c => c.status === "delivered").length} delivered
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={CHEV}>
                      {isOpen
                        ? <ChevronDown size={14} color="#6E7F87" />
                        : <ChevronRight size={14} color="#6E7F87" />}
                    </div>
                  </div>

                  {/* Container rows */}
                  {isOpen && (
                    <div style={ROWS_WRAP}>
                      {items.map((c, idx) => {
                        const cfg = STATUS[c.status] || STATUS.in_transit;
                        const ca  = c.needsAttention ? "#D6492F" : cfg.color;
                        return (
                          <div
                            key={c.id}
                            className="arc-row"
                            onClick={() => navigate(`/containers/${c.id}`)}
                            style={{ borderLeftColor: ca }}
                          >
                            {/* Index tick */}
                            <div style={ROW_IDX}>
                              {String(idx + 1).padStart(2, "0")}
                            </div>

                            {/* Container number */}
                            <div style={{ ...ROW_NUM, color: ca }}>{c.number}</div>

                            {/* Route */}
                            <div style={ROW_ROUTE}>
                              <span style={ROW_PORT}>{c.origin}</span>
                              <span style={ROW_RARR}>→</span>
                              <span style={ROW_PORT}>{c.destination}</span>
                            </div>

                            {/* Carrier */}
                            <div style={ROW_CARRIER}>{c.carrier}</div>

                            {/* ETA */}
                            <div style={ROW_ETA}>
                              <span style={{ ...PIP, background: c.needsAttention ? "#D6492F" : cfg.pip }} />
                              {fmtShort(c.eta)}
                            </div>

                            {/* Status tag */}
                            <span style={{ ...TAG, background: cfg.bg, color: cfg.color }}>
                              {cfg.label}
                            </span>

                            {/* Attention flag */}
                            {c.needsAttention && (
                              <div style={ROW_FLAG} title={c.attentionReason}>
                                <AlertTriangle size={12} color="#D6492F" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && groups.length > 0 && (
          <p style={FOOTER}>
            {totals.containers} container{totals.containers !== 1 ? "s" : ""}
            &nbsp;across&nbsp;
            {totals.months} month{totals.months !== 1 ? "s" : ""}
            &nbsp;·&nbsp; Tunis–Goulette terminal
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Inline styles ── */
const ROOT = { fontFamily: "'IBM Plex Sans', sans-serif", background: "#ECE7DA", color: "#1C2B33", minHeight: "100vh" };

const HERO = { position: "relative", height: 480, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end" };
const HERO_PHOTO = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 60%" };
const HERO_GRADIENT = { position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,32,48,.05) 0%, rgba(8,32,48,.25) 55%, rgba(8,32,48,.92) 100%)" };
const HERO_TINT = { position: "absolute", inset: 0, background: "rgba(11,42,61,.1)" };
const HERO_CREDIT = { position: "absolute", bottom: 100, right: 16, zIndex: 3, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.1em", color: "rgba(255,255,255,.28)", textTransform: "uppercase" };
const HERO_CONTENT = { position: "relative", zIndex: 2, padding: "0 44px 40px" };
const EYEBROW = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C7E0D8", margin: "0 0 14px" };
const H1 = { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "clamp(2.6rem, 5vw, 4rem)", letterSpacing: "-0.02em", color: "#DCE6EA", lineHeight: 0.95, margin: "0 0 14px" };
const HERO_SUB = { fontSize: "0.83rem", color: "rgba(220,230,234,.7)", maxWidth: "44ch", lineHeight: 1.6, margin: 0 };
const BODY = { padding: "36px clamp(24px,5vw,48px) 64px" };
const LEDGER = { display: "flex", flexWrap: "wrap", borderBottom: "1px solid rgba(11,42,61,0.18)" };
const LEDGER_CELL = { flex: "1 1 120px", padding: "18px 28px", borderRight: "1px solid rgba(11,42,61,0.12)", borderLeft: "3px solid", background: "#E2DCCB" };
const LEDGER_NUM = { fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: "clamp(1.4rem,2.8vw,2.1rem)", lineHeight: 1 };
const LEDGER_LABEL = { marginTop: 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#6E7F87" };

const YEAR_SEL_WRAP = { background: "#E2DCCB", borderBottom: "1px solid rgba(11,42,61,0.18)", overflowX: "auto" };
const YEAR_SEL_SCROLL = { display: "flex", minWidth: "max-content" };



const TIMELINE = { display: "flex", flexDirection: "column", gap: 0, border: "1px solid rgba(11,42,61,0.18)" };

/* Year divider */
const YEAR_DIV = { display: "flex", alignItems: "center", gap: 14, padding: "10px 0", background: "#ECE7DA" };
const YEAR_LINE = { flex: 1, height: 1, background: "rgba(11,42,61,0.15)" };
const YEAR_BADGE = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.62rem", letterSpacing: "0.2em", color: "#6E7F87", textTransform: "uppercase", flexShrink: 0 };

/* Month header */
const MONTH_STAMP = { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 54, flexShrink: 0, borderRight: "1px solid rgba(11,42,61,0.12)", padding: "0 10px" };
const MONTH_MON = { fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.14em", color: "#0B2A3D" };
const MONTH_YR = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.55rem", color: "#6E7F87", letterSpacing: "0.08em" };
const MONTH_META = { flex: 1, padding: "0 16px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 5 };
const MONTH_TITLE = { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "1rem", color: "#0B2A3D" };
const MONTH_PILLS = { display: "flex", gap: 6, flexWrap: "wrap" };
const PILL_BASE = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.08em", padding: "2px 7px", borderRadius: 2, display: "flex", alignItems: "center", gap: 4 };
const PILL_UNIT = { ...PILL_BASE, background: "rgba(11,42,61,0.08)", color: "#6E7F87" };
const PILL_ALERT = { ...PILL_BASE, background: "#F8DDD5", color: "#D6492F" };
const PILL_DONE = { ...PILL_BASE, background: "#C7E0D8", color: "#2F7E6C" };
const CHEV = { padding: "0 18px", flexShrink: 0, display: "flex", alignItems: "center" };

/* Container rows */
const ROWS_WRAP = { borderTop: "1px solid rgba(11,42,61,0.1)" };

const ROW_IDX = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.58rem", color: "rgba(11,42,61,0.3)", letterSpacing: "0.06em", width: 28, flexShrink: 0, paddingLeft: 14 };
const ROW_NUM = { fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.06em", width: 110, flexShrink: 0 };
const ROW_ROUTE = { display: "flex", alignItems: "baseline", gap: 5, flex: 1, minWidth: 0 };
const ROW_PORT = { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "0.88rem", color: "#0B2A3D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const ROW_RARR = { color: "#6E7F87", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", flexShrink: 0 };
const ROW_CARRIER = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6E7F87", width: 130, flexShrink: 0, display: "none" };
const ROW_ETA = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.62rem", color: "#6E7F87", display: "flex", alignItems: "center", gap: 5, width: 72, flexShrink: 0, letterSpacing: "0.04em" };
const ROW_FLAG = { display: "flex", alignItems: "center", paddingRight: 4, flexShrink: 0 };

const TAG = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.56rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 7px", borderRadius: 2, fontWeight: 600, flexShrink: 0 };
const PIP = { width: 5, height: 5, borderRadius: "50%", flexShrink: 0, display: "inline-block" };

const EMPTY = { textAlign: "center", padding: "56px 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.8rem", color: "#6E7F87", border: "1px solid rgba(11,42,61,0.12)", display: "flex", flexDirection: "column", alignItems: "center" };
const FOOTER = { textAlign: "center", marginTop: 18, fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.66rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6E7F87" };

const CSS = `
.arc-yr {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.66rem; letter-spacing: 0.12em;
  color: #6E7F87; background: none; border: none;
  border-right: 1px solid rgba(11,42,61,0.1);
  cursor: pointer; padding: 10px 14px;
  transition: color .15s, background .15s; white-space: nowrap;
}
.arc-yr:hover { color: #0B2A3D; background: #D9D2BF; }
.arc-yr.on { color: #0B2A3D; background: #E2DCCB; box-shadow: inset 0 -2px 0 #0B2A3D; font-weight: 700; }
.arc-yr.dim { opacity: 0.35; }
.arc-yr.dim:hover { opacity: 0.6; }

.arc-month-header {
  display: flex;
  align-items: center;
  padding: 14px 0;
  cursor: pointer;
  background: #E2DCCB;
  border-bottom: 1px solid rgba(11,42,61,0.12);
  user-select: none;
  transition: background .15s;
  min-height: 64px;
}
.arc-month-header:hover {
  background: #D9D2BF;
}
.arc-month-header:focus-visible {
  outline: 2px solid #185FA5;
  outline-offset: -2px;
}

.arc-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 18px 10px 0;
  border-bottom: 1px solid rgba(11,42,61,0.07);
  border-left: 3px solid #2F7E6C;
  background: #ECE7DA;
  cursor: pointer;
  transition: background .14s;
}
.arc-row:last-child { border-bottom: none; }
.arc-row:hover { background: #F0EBD8; }

@media (min-width: 640px) {
  .arc-row-carrier { display: block !important; }
}
`;
