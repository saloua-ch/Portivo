import { useNavigate } from "react-router-dom";
import { containers } from "../data/mockData";
import {
  AlertCircle, AlertTriangle, Ship, ClipboardList, Anchor,
  CheckCircle, Search as SearchIcon,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";

/* ─── Status config ─────────────────────────────────────────────────────── */
const statusConfig = {
  in_transit: {
    label: "In transit",
    color: "var(--teal)", bg: "var(--teal-soft)",
    Icon: Ship,
  },
  customs: {
    label: "In customs",
    color: "var(--amber)", bg: "var(--amber-soft)",
    Icon: ClipboardList,
  },
  arriving_soon: {
    label: "Arriving soon",
    color: "var(--teal)", bg: "var(--teal-soft)",
    Icon: Anchor,
  },
  delivered: {
    label: "Delivered",
    color: "var(--teal)", bg: "var(--teal-soft)",
    Icon: CheckCircle,
  },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "attention", label: "Needs attention" },
  { key: "in_transit", label: "In transit" },
  { key: "customs", label: "In customs" },
  { key: "arriving_soon", label: "Arriving soon" },
  { key: "delivered", label: "Delivered" },
];

/* ─── Main component ────────────────────────────────────────────────────── */
export default function Containers() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [syncTime, setSyncTime] = useState("");

  useEffect(() => {
    setSyncTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
  }, []);

  const counts = useMemo(() => {
    const c = { all: containers.length, attention: 0, in_transit: 0, customs: 0, arriving_soon: 0, delivered: 0 };
    containers.forEach(item => {
      if (item.needsAttention) c.attention++;
      if (c[item.status] !== undefined) c[item.status]++;
    });
    return c;
  }, []);

  const filtered = useMemo(() => {
    let list = containers;

    if (activeFilter === "attention") list = list.filter(c => c.needsAttention);
    else if (activeFilter !== "all") list = list.filter(c => c.status === activeFilter);

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(c =>
        c.number.toLowerCase().includes(q) ||
        c.carrier.toLowerCase().includes(q) ||
        c.origin.toLowerCase().includes(q) ||
        c.destination.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeFilter, query]);

  return (
    <div className="pv-containers">
      <style>{CSS}</style>

      {/* ── Header ── */}
      <div className="pv-header">
        <div>
          <p className="pv-eyebrow">Port operations</p>
          <h1 className="pv-h1">Containers</h1>
          <p className="pv-subtitle">
            {containers.length} container{containers.length !== 1 ? "s" : ""} on file
            {counts.attention > 0 && (
              <> &middot; <span className="pv-subtitle-flag">{counts.attention} need{counts.attention === 1 ? "s" : ""} attention</span></>
            )}
          </p>
        </div>
        <div className="pv-sync">
          <p className="pv-sync-label">Last synced</p>
          <p className="pv-sync-time">{syncTime}</p>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="pv-search">
        <SearchIcon size={15} aria-hidden="true" />
        <input
          type="text"
          placeholder="Search by container number, carrier, or route&hellip;"
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Search containers"
        />
      </div>

      {/* ── Filters ── */}
      <div className="pv-filters" role="tablist">
        {FILTERS.map(({ key, label }) => {
          const isActive = activeFilter === key;
          const count = counts[key];
          return (
            <button
              key={key}
              role="tab"
              aria-selected={isActive}
              className={`pv-filter ${isActive ? "is-active" : ""} ${key === "attention" ? "is-flag" : ""}`}
              onClick={() => setActiveFilter(key)}
            >
              {label}
              <span className="pv-filter-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Manifest grid ── */}
      {filtered.length === 0 ? (
        <div className="pv-empty">
          <Ship size={28} aria-hidden="true" />
          <p>No containers match this filter.</p>
        </div>
      ) : (
        <div className="pv-grid">
          {filtered.map(container => {
            const cfg = statusConfig[container.status] || statusConfig.in_transit;
            const Icon = cfg.Icon;
            const accentColor = container.needsAttention ? "var(--coral)" : cfg.color;

            return (
              <div
                key={container.id}
                className="pv-manifest-card"
                onClick={() => navigate(`/containers/${container.id}`)}
                style={{ "--card-accent": accentColor }}
              >
                {/* Stamp header */}
                <div className="pv-stamp-row">
                  <div className="pv-stamp">
                    <span className="pv-stamp-icon"><Icon size={14} /></span>
                    <span className="pv-stamp-number">{container.number}</span>
                  </div>
                  {container.needsAttention && (
                    <AlertCircle size={15} className="pv-icon-coral" aria-hidden="true" />
                  )}
                </div>

                {/* Route */}
                <p className="pv-route">
                  <span className="pv-route-port">{container.origin}</span>
                  <span className="pv-route-arrow">&rarr;</span>
                  <span className="pv-route-port">{container.destination}</span>
                </p>
                <p className="pv-carrier">{container.carrier}</p>

                {container.needsAttention && (
                  <div className="pv-attention">
                    <AlertTriangle size={12} aria-hidden="true" />
                    {container.attentionReason}
                  </div>
                )}

                {/* Footer row */}
                <div className="pv-card-footer">
                  <span className="pv-tag" style={{ "--tag-color": cfg.color, "--tag-bg": cfg.bg }}>
                    {cfg.label}
                  </span>
                  <span className="pv-groupages">
                    {container.groupages.length} groupage{container.groupages.length > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {filtered.length > 0 && (
        <p className="pv-footer">
          {filtered.length} container{filtered.length !== 1 ? "s" : ""} shown
        </p>
      )}
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap');

.pv-containers{
  --ink: #0B2A3D;
  --paper: #ECE7DA;
  --paper-2: #E2DCCB;
  --text-on-paper: #1C2B33;
  --text-muted: #6E7F87;
  --coral: #D6492F;
  --coral-soft: #F8DDD5;
  --amber: #C9912B;
  --amber-soft: #F0DDB3;
  --teal: #2F7E6C;
  --teal-soft: #C7E0D8;
  --display: 'Fraunces', serif;
  --body: 'IBM Plex Sans', sans-serif;
  --mono: 'IBM Plex Mono', monospace;

  max-width: 1180px;
  margin: 0 auto;
  padding-bottom: 48px;
  font-family: var(--body);
  color: var(--text-on-paper);
}

.pv-containers *{ box-sizing: border-box; }

/* ── Header ── */
.pv-header{
  display:flex; justify-content:space-between; align-items:flex-start;
  margin-bottom: 28px; padding-bottom: 20px;
  border-bottom: 1px solid rgba(11,42,61,0.14);
}
.pv-eyebrow{
  font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--text-muted); margin: 0 0 10px;
}
.pv-h1{
  font-family: var(--display); font-weight: 600; font-size: 2.4rem;
  letter-spacing: -0.01em; color: var(--ink); margin: 0 0 6px; line-height: 1.05;
}
.pv-subtitle{ font-size: 0.85rem; color: var(--text-muted); margin: 0; }
.pv-subtitle-flag{ color: var(--coral); font-weight: 600; }
.pv-sync{ text-align: right; flex-shrink: 0; }
.pv-sync-label{
  font-family: var(--mono); font-size: 0.65rem; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--text-muted); margin: 0 0 4px;
}
.pv-sync-time{
  font-family: var(--mono); font-size: 0.95rem; font-weight: 500;
  color: var(--ink); margin: 0;
}

/* ── Search ── */
.pv-search{
  display: flex; align-items: center; gap: 10px;
  background: var(--paper-2);
  border: 1px solid rgba(11,42,61,0.14);
  padding: 12px 16px;
  margin-bottom: 18px;
  color: var(--text-muted);
}
.pv-search input{
  flex: 1; border: none; background: none; outline: none;
  font-family: var(--mono); font-size: 0.82rem; color: var(--ink);
}
.pv-search input::placeholder{ color: var(--text-muted); }

/* ── Filters ── */
.pv-filters{
  display: flex; gap: 22px; flex-wrap: wrap; margin-bottom: 28px;
  border-bottom: 1px solid rgba(11,42,61,0.14);
}
.pv-filter{
  font-family: var(--mono); font-size: 0.72rem; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--text-muted);
  background: none; border: none; cursor: pointer;
  padding: 10px 2px 12px; position: relative;
  display: flex; align-items: center; gap: 7px;
  transition: color 0.15s;
}
.pv-filter:hover{ color: var(--ink); }
.pv-filter.is-active{ color: var(--ink); }
.pv-filter.is-active::after{
  content: ""; position: absolute; left: 0; right: 0; bottom: -1px;
  height: 2px; background: var(--ink);
}
.pv-filter.is-active.is-flag::after{ background: var(--coral); }
.pv-filter-count{
  font-family: var(--mono); font-size: 0.62rem; font-weight: 700;
  padding: 1px 6px; border-radius: 2px;
  background: rgba(11,42,61,0.08); color: var(--text-muted);
}
.pv-filter.is-flag .pv-filter-count{ background: var(--coral-soft); color: var(--coral); }
.pv-filter.is-active .pv-filter-count{ color: var(--ink); background: rgba(11,42,61,0.12); }
.pv-filter.is-active.is-flag .pv-filter-count{ color: var(--coral); background: var(--coral-soft); }

/* ── Empty state ── */
.pv-empty{
  text-align: center; padding: 64px 0; color: var(--text-muted);
  font-family: var(--mono); font-size: 0.85rem;
}
.pv-empty svg{ margin-bottom: 12px; opacity: 0.5; }

/* ── Manifest grid ── */
.pv-grid{
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1px;
  background: rgba(11,42,61,0.14);
  border: 1px solid rgba(11,42,61,0.14);
}

.pv-manifest-card{
  background: var(--paper);
  padding: 18px;
  cursor: pointer;
  border-left: 4px solid var(--card-accent, var(--ink));
  display: flex; flex-direction: column; gap: 10px;
  transition: background 0.15s, transform 0.12s;
}
.pv-manifest-card:hover{ background: #F5F1E6; transform: translateY(-2px); }

.pv-stamp-row{
  display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;
}
.pv-stamp{
  display: inline-flex; align-items: center; gap: 8px;
  border: 1px solid var(--card-accent, var(--ink));
  padding: 5px 10px;
  color: var(--card-accent, var(--ink));
}
.pv-stamp-icon{ display: flex; align-items: center; }
.pv-stamp-number{
  font-family: var(--mono); font-weight: 700; font-size: 0.85rem;
  letter-spacing: 0.06em;
}
.pv-icon-coral{ color: var(--coral); flex-shrink: 0; margin-top: 4px; }

.pv-route{
  display: flex; align-items: baseline; gap: 8px;
  font-family: var(--display); font-weight: 600; font-size: 1.05rem;
  color: var(--ink); margin: 0;
}
.pv-route-arrow{ color: var(--text-muted); font-weight: 400; font-size: 0.9rem; }
.pv-carrier{
  font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--text-muted); margin: -4px 0 0;
}

.pv-attention{
  display: flex; align-items: center; gap: 6px;
  font-size: 0.78rem; color: var(--coral);
  border-top: 1px solid rgba(214,73,47,0.18);
  padding-top: 8px;
}

.pv-card-footer{
  display: flex; justify-content: space-between; align-items: center;
  margin-top: auto; padding-top: 6px;
}
.pv-tag{
  font-family: var(--mono); font-size: 0.62rem; letter-spacing: 0.1em;
  text-transform: uppercase; padding: 3px 9px; border-radius: 2px;
  font-weight: 600;
  background: var(--tag-bg, rgba(11,42,61,0.06));
  color: var(--tag-color, var(--ink));
}
.pv-groupages{ font-family: var(--mono); font-size: 0.68rem; color: var(--text-muted); }

/* ── Footer ── */
.pv-footer{
  text-align: center; padding-top: 20px;
  font-family: var(--mono); font-size: 0.7rem;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--text-muted);
}

/* ── Responsive ── */
@media (max-width: 640px){
  .pv-header{ flex-direction: column; gap: 12px; }
  .pv-sync{ text-align: left; }
  .pv-grid{ grid-template-columns: 1fr; }
}
`;
