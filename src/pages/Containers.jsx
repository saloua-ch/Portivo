import { useNavigate } from "react-router-dom";
import {
  AlertCircle, AlertTriangle, Ship, ClipboardList,
  Anchor, CheckCircle, Search as SearchIcon, ArrowUpDown,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import * as storage from "../api/storage";
import { useLanguage } from "../context/LanguageContext";

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

// Order shown in the per-card status dropdown
const STATUS_OPTIONS = ["in_transit", "arriving_soon", "customs", "delivered"];

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

/* ── Main component ── */
export default function Containers() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [containers, setContainers] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [query, setQuery]               = useState("");
  const [sortAsc, setSortAsc]           = useState(true);
  const [syncTime, setSyncTime]         = useState("");
  const [savingId, setSavingId]         = useState(null); // container id currently saving a status change

  // Load from storage on mount, and reload whenever data changes elsewhere
  useEffect(() => {
    async function load() {
      setLoading(true);
      const list = await storage.getContainers();
      setContainers(list);
      setLoading(false);
      setSyncTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
    }
    load();
    const unsubscribe = storage.onChange(() => load()); // re-run when AddEntry/Import/status changes write
    return unsubscribe; // cleanup on unmount
  }, []);

  // Persist a status change. storage.onChange (subscribed above) reloads the
  // list once the write completes, so this survives a refresh.
  async function handleStatusChange(containerId, newStatus) {
    setSavingId(containerId);
    try {
      await storage.updateContainer(containerId, { status: newStatus });
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Couldn't save the new status — please try again.");
    } finally {
      setSavingId(null);
    }
  }

  /* counts */
  const counts = useMemo(() => {
    const c = { all: containers.length, attention: 0, in_transit: 0, customs: 0, arriving_soon: 0, delivered: 0 };
    containers.forEach(item => {
      if (item.needsAttention) c.attention++;
      if (c[item.status] !== undefined) c[item.status]++;
    });
    return c;
  }, [containers]);

  /* filtered list */
  const filtered = useMemo(() => {
    let list = [...containers];
    if (activeFilter === "attention") list = list.filter(c => c.needsAttention);
    else if (activeFilter !== "all")  list = list.filter(c => c.status === activeFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(c =>
        [c.number, c.carrier, c.origin, c.destination].some(v => v && v.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => sortAsc
      ? new Date(a.eta) - new Date(b.eta)
      : new Date(b.eta) - new Date(a.eta)
    );
    return list;
  }, [containers, activeFilter, query, sortAsc]);

  const ledgerCells = [
    { n: containers.length, label: "On file",    accent: "#2F7E6C" },
    { n: counts.in_transit, label: t('containers.inTransit'), accent: "#2F7E6C" },
    { n: counts.customs,    label: "Customs",    accent: "#C9912B" },
    { n: counts.attention,  label: "Attention",  accent: "#D6492F" },
    { n: counts.arriving_soon, label: "Arriving", accent: "#185FA5" },
  ];

  return (
    <div style={ROOT}>
      <style>{CSS}</style>

      {/* ── Hero ── */}
      <div style={HERO}>
        <img
          src="https://images.unsplash.com/photo-1583686298564-46fbffda0707?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=1600&q=80&au[...]"
          alt="Stacked shipping containers in a terminal yard"
          style={HERO_PHOTO}
        />
        <div style={HERO_GRADIENT} />
        <div style={HERO_TINT} />
        <span style={HERO_CREDIT}>Photo: Unsplash</span>

        <div style={HERO_CONTENT}>
          <p style={EYEBROW}>Tunis–Goulette terminal · Fleet manifest</p>
          <h1 style={H1}>{t('containers.title')}</h1>
          <p style={HERO_SUB}>Every unit in the fleet — in transit, clearing customs, or delivered.</p>
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
              placeholder={t('containers.search')}
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label={t('containers.search')}
            />
          </div>
          <div style={TOTAL_LABEL}>
            {loading ? t('common.loading') : `${filtered.length} ${t('containers.number')}${filtered.length !== 1 ? "s" : ""}`}
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

        {/* Loading state */}
        {loading ? (
          <div style={EMPTY}>
            <Ship size={26} style={{ marginBottom: 10, opacity: 0.35 }} />
            <p>{t('common.loading')}</p>
          </div>
        ) : filtered.length === 0 ? (
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
              const saving = savingId === c.id;
              return (
                <div
                  key={c.id}
                  className="pvc-card"
                  onClick={() => navigate(`/containers/${c.id}`)}
                  style={{ borderLeftColor: ca }}
                >
                  <div style={CARD_HEAD}>
                    <div style={{ ...STAMP, borderColor: ca, color: ca }}>
                      <span style={STAMP_NUM}>{c.number}</span>
                    </div>
                    {c.needsAttention && (
                      <AlertCircle size={14} color="#D6492F" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                    )}
                  </div>

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

                  <div style={CARD_FOOT}>
                    {/* Status — now an editable dropdown instead of a static tag.
                        Clicks/changes are stopped from bubbling so they don't
                        trigger the card's navigate-to-detail handler. */}
                    <div onClick={e => e.stopPropagation()} style={{ position: "relative" }}>
                      <select
                        value={c.status}
                        disabled={saving}
                        onChange={e => handleStatusChange(c.id, e.target.value)}
                        className="pvc-status-select"
                        style={{ ...TAG, background: cfg.bg, color: cfg.color, opacity: saving ? 0.6 : 1 }}
                        aria-label={`Status for ${c.number}`}
                      >
                        {STATUS_OPTIONS.map(key => (
                          <option key={key} value={key}>{STATUS[key].label}</option>
                        ))}
                      </select>
                    </div>
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

        {!loading && filtered.length > 0 && (
          <p style={FOOTER}>
            {filtered.length} container{filtered.length !== 1 ? "s" : ""} shown
            &nbsp;·&nbsp; sync {syncTime}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Inline style objects ── */
const ROOT = { fontFamily: "'IBM Plex Sans', sans-serif", background: "#ECE7DA", color: "#1C2B33", minHeight: "100vh" };
const HERO = { position: "relative", height: 560, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end" };
const HERO_PHOTO = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 35%" };
const HERO_GRADIENT = { position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,32,48,.05) 0%, rgba(8,32,48,.25) 55%, rgba(8,32,48,.92) 100%)" };
const HERO_TINT = { position: "absolute", inset: 0, background: "rgba(11,42,61,.1)" };
const HERO_CREDIT = { position: "absolute", bottom: 100, right: 16, zIndex: 3, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.1em", color: "rgba(255,255,255,.28)", textTransform: "uppercase" };
const HERO_CONTENT = { position: "relative", zIndex: 2, padding: "0 44px 40px" };
const EYEBROW = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C7E0D8", margin: "0 0 14px" };
const H1 = { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "clamp(2.6rem, 5vw, 4rem)", letterSpacing: "-0.02em", color: "#DCE6EA", lineHeight: 0.95, margin: "0 0 14px" };
const HERO_SUB = { fontSize: "0.83rem", color: "rgba(220,230,234,.7)", maxWidth: "34ch", lineHeight: 1.6, margin: 0 };
const LEDGER = { display: "flex", flexWrap: "wrap", borderBottom: "1px solid rgba(11,42,61,0.18)" };
const LEDGER_CELL = { flex: "1 1 120px", padding: "18px 28px", borderRight: "1px solid rgba(11,42,61,0.12)", borderLeft: "3px solid", background: "#E2DCCB" };
const LEDGER_NUM = { fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: "clamp(1.4rem,2.8vw,2.1rem)", lineHeight: 1 };
const LEDGER_LABEL = { marginTop: 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#6E7F87" };
const BODY = { padding: "36px clamp(24px,5vw,48px) 64px" };
const TOOLBAR = { display: "flex", alignItems: "center", border: "1px solid rgba(11,42,61,0.18)", background: "#E2DCCB" };
const SRCH = { display: "flex", alignItems: "center", gap: 10, flex: 1, padding: "12px 16px", borderRight: "1px solid rgba(11,42,61,0.14)", color: "#6E7F87" };
const SRCH_INPUT = { flex: 1, border: "none", background: "none", outline: "none", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.8rem", color: "#1C2B33" };
const TOTAL_LABEL = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6E7F87", padding: "12px 20px", borderRight: "1px solid rgba(11,42,61,0.14)" };
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
const TAG = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 7px", borderRadius: 2, fontWeight: 600, border: "none", cursor: "pointer" };
const ETA_ROW = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.62rem", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 4 };
const PIP = { width: 5, height: 5, borderRadius: "50%", flexShrink: 0, display: "inline-block" };
const EMPTY = { textAlign: "center", padding: "56px 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.8rem", color: "#6E7F87", border: "1px solid rgba(11,42,61,0.12)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" };
const FOOTER = { textAlign: "center", marginTop: 18, fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.66rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6E7F87" };

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
.pvc-status-select { -webkit-appearance: none; appearance: none; }
.pvc-status-select:focus { outline: 2px solid rgba(11,42,61,0.3); outline-offset: 1px; }
`;
