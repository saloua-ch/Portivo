import { useNavigate } from "react-router-dom";
import { containers } from "../data/mockData";
import {
  AlertCircle, AlertTriangle, Ship, ClipboardList, Anchor,
  CheckCircle, Clock
} from "lucide-react";
import { useState, useEffect } from "react";

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

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function diffDays(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(dateStr) - today) / 86400000);
}

function formatDayLabel(dateStr) {
  const d = new Date(dateStr);
  const diff = diffDays(dateStr);
  const weekday = d.toLocaleDateString("en-GB", { weekday: "long" });
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return "Overdue";
  return weekday;
}

function formatDateShort(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric", month: "short",
  });
}

function groupByETA(list) {
  const g = {};
  list.forEach(c => { if (!g[c.eta]) g[c.eta] = []; g[c.eta].push(c); });
  return Object.entries(g).sort(([a], [b]) => new Date(a) - new Date(b));
}

/* ─── Sub-components ────────────────────────────────────────────────────── */

// Summary ledger tile — mirrors the stat strip on the Portivo home page
function LedgerTile({ value, label, variant }) {
  return (
    <div className={`pv-ledger-tile ${variant || ""}`}>
      <div className="pv-ledger-num">{String(value).padStart(2, "0")}</div>
      <div className="pv-ledger-label">{label}</div>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────────────── */
export default function Arrivals() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("this_week");
  const [hoveredId, setHoveredId] = useState(null);
  const [syncTime, setSyncTime] = useState("");

  useEffect(() => {
    setSyncTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
  }, []);

  const weekCount = containers.filter(c => { const d = diffDays(c.eta); return d >= 0 && d <= 7; }).length;
  const customsCount = containers.filter(c => c.status === "customs").length;
  const overdueCount = containers.filter(c => diffDays(c.eta) < 0 && c.status !== "delivered").length;

  const filtered = containers.filter(c => {
    const diff = diffDays(c.eta);
    if (activeTab === "this_week") return diff >= 0 && diff <= 7;
    if (activeTab === "next_week") return diff > 7 && diff <= 14;
    if (activeTab === "overdue")   return diff < 0 && c.status !== "delivered";
    return true;
  });

  const grouped = groupByETA(filtered);

  const tabs = [
    { key: "this_week", label: "This week" },
    { key: "next_week", label: "Next week" },
    { key: "overdue",   label: "Overdue", count: overdueCount, danger: true },
  ];

  return (
    <div className="pv-arrivals">
      <style>{CSS}</style>

      {/* ── Header ── */}
      <div className="pv-header">
        <div>
          <p className="pv-eyebrow">Port operations</p>
          <h1 className="pv-h1">Arrivals</h1>
          <p className="pv-subtitle">Containers sorted by estimated arrival date</p>
        </div>
        <div className="pv-sync">
          <p className="pv-sync-label">Last synced</p>
          <p className="pv-sync-time">{syncTime}</p>
        </div>
      </div>

      {/* ── Summary strip ── */}
      <div className="pv-ledger">
        <LedgerTile value={weekCount} label="Arriving this week" />
        <LedgerTile value={customsCount} label="Awaiting customs" variant="note" />
        <LedgerTile value={overdueCount} label="Past ETA" variant={overdueCount > 0 ? "flag" : "good"} />
      </div>

      {/* ── Tabs ── */}
      <div className="pv-tabs" role="tablist">
        {tabs.map(({ key, label, count }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={isActive}
              className={`pv-tab ${isActive ? "is-active" : ""}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
              {count > 0 && <span className="pv-tab-count">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* ── Container groups ── */}
      {grouped.length === 0 ? (
        <div className="pv-empty">
          <Ship size={28} aria-hidden="true" />
          <p>No containers for this period.</p>
        </div>
      ) : (
        grouped.map(([date, items]) => (
          <div key={date} className="pv-day-group">
            {/* Day rail */}
            <div className="pv-day-rail">
              <p className="pv-day-label">{formatDayLabel(date)}</p>
              <span className="pv-day-dot">&middot;</span>
              <span className="pv-day-date">{formatDateShort(date)}</span>
              <div className="pv-day-line" />
              <span className="pv-day-count">
                {items.length} container{items.length > 1 ? "s" : ""}
              </span>
            </div>

            {/* Cards */}
            <div className="pv-card-list">
              {items.map(container => {
                const cfg = statusConfig[container.status] || statusConfig.in_transit;
                const Icon = cfg.Icon;
                const isHovered = hoveredId === container.id;
                const accentColor = container.needsAttention ? "var(--coral)" : cfg.color;
                return (
                  <div
                    key={container.id}
                    className={`pv-card ${isHovered ? "is-hovered" : ""}`}
                    onClick={() => navigate(`/containers/${container.id}`)}
                    onMouseEnter={() => setHoveredId(container.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{ "--card-accent": accentColor }}
                  >
                    <div className="pv-card-bar" />

                    <div className="pv-card-body">
                      <div className="pv-card-icon">
                        <Icon size={17} />
                      </div>

                      <div className="pv-card-main">
                        <div className="pv-card-title-row">
                          <p className="pv-card-number">{container.number}</p>
                          {container.needsAttention && (
                            <AlertCircle size={13} className="pv-icon-coral" aria-hidden="true" />
                          )}
                        </div>
                        <p className="pv-card-route">
                          {container.origin} &rarr; {container.destination}
                          <span className="pv-card-dot">&middot;</span>
                          {container.carrier}
                        </p>
                        {container.needsAttention && (
                          <div className="pv-card-attention">
                            <AlertTriangle size={12} aria-hidden="true" />
                            {container.attentionReason}
                          </div>
                        )}
                      </div>

                      <div className="pv-card-right">
                        {container.needsAttention && (
                          <span className="pv-tag pv-tag-coral">Needs attention</span>
                        )}
                        <span className="pv-tag" style={{ "--tag-color": cfg.color, "--tag-bg": cfg.bg }}>
                          {cfg.label}
                        </span>
                        <span className="pv-card-groupages">
                          {container.groupages.length} groupage{container.groupages.length > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Footer */}
      {grouped.length > 0 && (
        <p className="pv-footer">
          {filtered.length} container{filtered.length > 1 ? "s" : ""} in this period
        </p>
      )}
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap');

.pv-arrivals{
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

.pv-arrivals *{ box-sizing: border-box; }

/* ── Header ── */
.pv-header{
  display:flex; justify-content:space-between; align-items:flex-start;
  margin-bottom: 32px; padding-bottom: 20px;
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
.pv-sync{ text-align: right; }
.pv-sync-label{
  font-family: var(--mono); font-size: 0.65rem; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--text-muted); margin: 0 0 4px;
}
.pv-sync-time{
  font-family: var(--mono); font-size: 0.95rem; font-weight: 500;
  color: var(--ink); margin: 0;
}

/* ── Ledger stat strip ── */
.pv-ledger{
  display: flex; flex-wrap: wrap;
  background: var(--paper-2);
  border: 1px solid rgba(11,42,61,0.14);
  margin-bottom: 28px;
}
.pv-ledger-tile{
  flex: 1 1 160px;
  padding: 18px 20px;
  border-right: 1px solid rgba(11,42,61,0.12);
  border-left: 3px solid var(--teal);
}
.pv-ledger-tile:first-child{ border-left: 3px solid var(--teal); }
.pv-ledger-tile.note{ border-left-color: var(--amber); }
.pv-ledger-tile.flag{ border-left-color: var(--coral); }
.pv-ledger-tile.good{ border-left-color: var(--teal); }
.pv-ledger-tile:last-child{ border-right: none; }
.pv-ledger-num{
  font-family: var(--mono); font-weight: 700; font-size: 1.8rem;
  color: var(--ink); line-height: 1;
}
.pv-ledger-tile.note .pv-ledger-num{ color: var(--amber); }
.pv-ledger-tile.flag .pv-ledger-num{ color: var(--coral); }
.pv-ledger-label{
  margin-top: 6px; font-family: var(--mono); font-size: 0.65rem;
  letter-spacing: 0.16em; text-transform: uppercase; color: var(--text-muted);
}

/* ── Tabs ── */
.pv-tabs{
  display: flex; gap: 24px; margin-bottom: 28px;
  border-bottom: 1px solid rgba(11,42,61,0.14);
}
.pv-tab{
  font-family: var(--mono); font-size: 0.75rem; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--text-muted);
  background: none; border: none; cursor: pointer;
  padding: 10px 2px 12px; position: relative;
  display: flex; align-items: center; gap: 8px;
  transition: color 0.15s;
}
.pv-tab:hover{ color: var(--ink); }
.pv-tab.is-active{ color: var(--ink); }
.pv-tab.is-active::after{
  content: ""; position: absolute; left: 0; right: 0; bottom: -1px;
  height: 2px; background: var(--ink);
}
.pv-tab-count{
  font-family: var(--mono); font-size: 0.65rem; font-weight: 700;
  padding: 1px 6px; border-radius: 2px;
  background: var(--coral-soft); color: var(--coral);
}

/* ── Empty state ── */
.pv-empty{
  text-align: center; padding: 64px 0; color: var(--text-muted);
  font-family: var(--mono); font-size: 0.85rem;
}
.pv-empty svg{ margin-bottom: 12px; opacity: 0.5; }

/* ── Day groups ── */
.pv-day-group{ margin-bottom: 28px; }
.pv-day-rail{
  display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
}
.pv-day-label{
  font-family: var(--mono); font-size: 0.7rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.16em; color: var(--text-muted);
  margin: 0; white-space: nowrap;
}
.pv-day-dot{ font-size: 0.7rem; color: rgba(11,42,61,0.25); }
.pv-day-date{ font-family: var(--mono); font-size: 0.7rem; color: var(--text-muted); }
.pv-day-line{ flex: 1; height: 1px; background: rgba(11,42,61,0.12); }
.pv-day-count{
  font-family: var(--mono); font-size: 0.7rem; color: var(--text-muted);
  white-space: nowrap;
}

/* ── Cards ── */
.pv-card-list{ display: flex; flex-direction: column; gap: 1px; }
.pv-card{
  background: var(--paper);
  border: 1px solid rgba(11,42,61,0.12);
  display: flex; cursor: pointer;
  transition: background 0.15s, transform 0.12s;
}
.pv-card + .pv-card{ margin-top: -1px; }
.pv-card.is-hovered{ background: #F5F1E6; transform: translateX(2px); }
.pv-card-bar{ width: 4px; background: var(--card-accent, var(--ink)); flex-shrink: 0; }
.pv-card-body{
  display: flex; align-items: center; gap: 14px;
  padding: 14px 16px; flex: 1; min-width: 0;
}
.pv-card-icon{
  width: 38px; height: 38px; border-radius: 4px;
  background: rgba(11,42,61,0.06); color: var(--card-accent, var(--ink));
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.pv-card-main{ flex: 1; min-width: 0; }
.pv-card-title-row{ display: flex; align-items: center; gap: 7px; margin-bottom: 2px; }
.pv-card-number{
  font-family: var(--mono); font-size: 0.95rem; font-weight: 600;
  color: var(--ink); margin: 0; letter-spacing: 0.02em;
}
.pv-icon-coral{ color: var(--coral); }
.pv-card-route{ font-size: 0.8rem; color: var(--text-muted); margin: 0; }
.pv-card-dot{ margin: 0 6px; }
.pv-card-attention{
  display: flex; align-items: center; gap: 5px; margin-top: 5px;
  font-size: 0.78rem; color: var(--coral);
}
.pv-card-right{
  display: flex; flex-direction: column; align-items: flex-end;
  gap: 5px; flex-shrink: 0;
}
.pv-tag{
  font-family: var(--mono); font-size: 0.65rem; letter-spacing: 0.1em;
  text-transform: uppercase; padding: 3px 9px; border-radius: 2px;
  font-weight: 600;
  background: var(--tag-bg, rgba(11,42,61,0.06));
  color: var(--tag-color, var(--ink));
}
.pv-tag-coral{ background: var(--coral-soft); color: var(--coral); }
.pv-card-groupages{ font-family: var(--mono); font-size: 0.7rem; color: var(--text-muted); }

/* ── Footer ── */
.pv-footer{
  text-align: center; padding-top: 16px;
  font-family: var(--mono); font-size: 0.7rem;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--text-muted);
}

/* ── Responsive ── */
@media (max-width: 640px){
  .pv-header{ flex-direction: column; gap: 12px; }
  .pv-sync{ text-align: left; }
  .pv-ledger{ flex-direction: column; }
  .pv-ledger-tile{ border-right: none; border-bottom: 1px solid rgba(11,42,61,0.12); }
  .pv-ledger-tile:last-child{ border-bottom: none; }
  .pv-card-right{ align-items: flex-start; }
  .pv-card-body{ flex-wrap: wrap; }
}
`;
