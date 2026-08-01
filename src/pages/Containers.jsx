import { useNavigate } from "react-router-dom";
import {
  AlertCircle, AlertTriangle, Ship, ClipboardList,
  Anchor, CheckCircle, Search as SearchIcon, ArrowUpDown, Trash2, X,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import * as storage from "../api/storage";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import { useLanguage } from "../context/LanguageContext";

/* ── Google Fonts ── */
if (typeof document !== "undefined" && !document.getElementById("pvc-gf")) {
  const l = document.createElement("link");
  l.id = "pvc-gf"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap";
  document.head.appendChild(l);
}

/* ── Status config (colors/icons only — labels are resolved via t() at render time) ── */
const STATUS = {
  in_transit:    { labelKey: "inTransit",    color: "#2F7E6C", bg: "#C7E0D8", pip: "#2F7E6C", Icon: Ship },
  customs:       { labelKey: "customs",      color: "#8a620d", bg: "#F0DDB3", pip: "#C9912B", Icon: ClipboardList },
  arriving_soon: { labelKey: "arrivingSoon", color: "#0e4980", bg: "#B5D4F4", pip: "#185FA5", Icon: Anchor },
  delivered:     { labelKey: "delivered",    color: "#2F7E6C", bg: "#C7E0D8", pip: "#2F7E6C", Icon: CheckCircle },
};

// Order shown in the per-card status dropdown
const STATUS_OPTIONS = ["in_transit", "arriving_soon", "customs", "delivered"];

// Filter bar config — labelKey maps to a containers.filterXxx translation key
const FILTERS = [
  { key: "all",           labelKey: "filterAll" },
  { key: "attention",     labelKey: "filterAttention", flag: true },
  { key: "in_transit",    labelKey: "filterInTransit" },
  { key: "customs",       labelKey: "filterCustoms" },
  { key: "arriving_soon", labelKey: "filterArrivingSoon" },
  { key: "delivered",     labelKey: "filterDelivered" },
];

/* ── Helpers ── */
function diffDays(str) {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((new Date(str) - t) / 86400000);
}
function fmtShort(str) {
  return new Date(str).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function etaLabel(str, t) {
  const d = diffDays(str);
  if (d < 0) return t('containers.overdue');
  if (d === 0) return t('containers.today');
  if (d === 1) return t('containers.tomorrow');
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
  const [deletingId, setDeletingId]     = useState(null); // container id currently being deleted (single-card cross)
  const [selectedIds, setSelectedIds]   = useState(() => new Set());
  const [bulkStatus, setBulkStatus]     = useState("in_transit");
  const [bulkBusy, setBulkBusy]         = useState(false);

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
      alert(t('containers.statusUpdateFailed'));
    } finally {
      setSavingId(null);
    }
  }

  async function handleSingleDelete(containerId, number) {
    if (!window.confirm(`${t('containerDetail.confirmDelete')} ${number}?`)) return;
    setDeletingId(containerId);
    try {
      await storage.deleteContainer(containerId);
      setSelectedIds(prev => { const n = new Set(prev); n.delete(containerId); return n; });
    } catch (err) {
      console.error("Failed to delete container", err);
      alert(t('containers.singleDeleteFailed'));
    } finally {
      setDeletingId(null);
    }
  }

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  // Sequential on purpose — same reasoning as Arrivals' bulk confirm: a
  // handful of writes at a time is gentler on the backend, and keeps the
  // "applying…" state simple to reason about than a Promise.all race.
  async function handleBulkStatusApply() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setBulkBusy(true);
    let hadError = false;
    for (const id of ids) {
      try {
        await storage.updateContainer(id, { status: bulkStatus });
      } catch (err) {
        console.error("Bulk status update failed", err);
        hadError = true;
      }
    }
    setBulkBusy(false);
    setSelectedIds(new Set());
    if (hadError) alert(t('containers.statusUpdateFailed'));
  }

  async function handleBulkDelete() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (!window.confirm(t('containers.confirmBulkDelete').replace('{n}', ids.length))) return;
    setBulkBusy(true);
    let hadError = false;
    for (const id of ids) {
      try {
        await storage.deleteContainer(id);
      } catch (err) {
        console.error("Bulk delete failed", err);
        hadError = true;
      }
    }
    setBulkBusy(false);
    setSelectedIds(new Set());
    if (hadError) alert(t('containers.deleteFailed'));
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
    { n: containers.length,     label: t('containers.onFile'),    accent: "#2F7E6C" },
    { n: counts.in_transit,     label: t('containers.inTransit'), accent: "#2F7E6C" },
    { n: counts.customs,        label: t('containers.customs'),   accent: "#C9912B" },
    { n: counts.attention,      label: t('containers.attention'), accent: "#D6492F" },
    { n: counts.arriving_soon,  label: t('containers.arriving'),  accent: "#185FA5" },
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
          <p style={EYEBROW}>{t('containers.heroEyebrow')}</p>
          <h1 style={H1}>{t('containers.title')}</h1>
          <p style={HERO_SUB}>{t('containers.heroSubtitle')}</p>
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
            {loading
              ? t('common.loading')
              : `${filtered.length} ${filtered.length !== 1 ? t('containers.containerPlural') : t('containers.containerSingular')}`}
          </div>
          <button style={SORT_BTN} onClick={() => setSortAsc(v => !v)}>
            <ArrowUpDown size={13} aria-hidden="true" />
            {t('containers.eta')} {sortAsc ? "↑" : "↓"}
          </button>
          <button
            style={{ ...SORT_BTN, borderLeft: "1px solid rgba(11,42,61,0.14)" }}
            onClick={() => setSelectedIds(
              selectedIds.size === filtered.length
                ? new Set()
                : new Set(filtered.map(c => c.id))
            )}
          >
            {selectedIds.size === filtered.length && filtered.length > 0
              ? t('containers.clearSelection')
              : t('containers.selectAllVisible')}
          </button>
        </div>

        {/* Filters */}
        <div style={FILT_ROW} role="tablist">
          {FILTERS.map(({ key, labelKey, flag }) => {
            const on = activeFilter === key;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={on}
                className={`pvc-filter${flag ? " flag" : ""}${on ? " on" : ""}`}
                onClick={() => setActiveFilter(key)}
              >
                {t(`containers.${labelKey}`)}
                <span className={`pvc-badge${flag ? " flag" : ""}`}>{counts[key] ?? 0}</span>
              </button>
            );
          })}
        </div>

        {/* Bulk actions — appears once at least one card is selected */}
        {selectedIds.size > 0 && (
          <div style={BULK_BAR}>
            <span style={BULK_COUNT}>{t('containers.nSelected').replace('{n}', selectedIds.size)}</span>
            <button className="pvc-link-btn" onClick={() => setSelectedIds(new Set())}>
              {t('containers.clearSelection')}
            </button>
            <div style={{ flex: 1 }} />
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={BULK_LABEL}>{t('containers.setStatusTo')}</span>
              <select
                value={bulkStatus}
                onChange={e => setBulkStatus(e.target.value)}
                disabled={bulkBusy}
                className="pvc-status-select"
                style={{ ...TAG, background: "#fff", color: "#1C2B33", border: "1px solid rgba(11,42,61,0.18)", padding: "6px 10px" }}
              >
                {STATUS_OPTIONS.map(key => (
                  <option key={key} value={key}>{t(`containers.${STATUS[key].labelKey}`)}</option>
                ))}
              </select>
            </label>
            <button
              onClick={handleBulkStatusApply}
              disabled={bulkBusy}
              style={BULK_APPLY_BTN}
            >
              {bulkBusy ? t('common.loading') : t('containers.applyToSelected').replace('{n}', selectedIds.size)}
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkBusy}
              style={BULK_DELETE_BTN}
            >
              <Trash2 size={13} aria-hidden="true" />
              {t('containers.deleteSelected').replace('{n}', selectedIds.size)}
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <LoadingState label={t('common.loading')} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Ship} title={t('containers.noMatch')} />
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
                  <button
                    type="button"
                    className="pvc-delete-cross"
                    onClick={e => { e.stopPropagation(); handleSingleDelete(c.id, c.number); }}
                    disabled={deletingId === c.id}
                    title={t('containerDetail.deleteContainer')}
                    aria-label={`${t('containerDetail.deleteContainer')} ${c.number}`}
                  >
                    <X size={12} />
                  </button>

                  <div style={CARD_HEAD}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        onClick={e => e.stopPropagation()}
                        aria-label={`${t('arrivals.selectItem')} ${c.number}`}
                        style={{ width: 14, height: 14, flexShrink: 0, cursor: "pointer", accentColor: "#0B2A3D" }}
                      />
                      <div style={{ ...STAMP, borderColor: ca, color: ca }}>
                        <span style={STAMP_NUM}>{c.number}</span>
                      </div>
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
                        aria-label={`${t('containers.statusFor')} ${c.number}`}
                      >
                        {STATUS_OPTIONS.map(key => (
                          <option key={key} value={key}>{t(`containers.${STATUS[key].labelKey}`)}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ ...ETA_ROW, color: ov ? "#D6492F" : "#6E7F87" }}>
                      <span style={{ ...PIP, background: ov ? "#D6492F" : cfg.pip }} />
                      {etaLabel(c.eta, t)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <p style={FOOTER}>
            {filtered.length} {filtered.length !== 1 ? t('containers.containerPlural') : t('containers.containerSingular')} {t('containers.shown')}
            &nbsp;·&nbsp; {t('containers.sync')} {syncTime}
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
const BULK_BAR = { display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", padding: "12px 16px", marginTop: -28, marginBottom: 20, background: "#E6F1FB", border: "1px solid rgba(24,95,165,0.25)", borderRadius: 8 };
const BULK_COUNT = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", fontWeight: 700, color: "#0B2A3D" };
const BULK_LABEL = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.64rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6E7F87" };
const BULK_APPLY_BTN = { display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 7, border: "none", cursor: "pointer", background: "#0B2A3D", color: "#DCE6EA", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.7rem", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 };
const BULK_DELETE_BTN = { display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 7, border: "1px solid rgba(214,73,47,0.4)", cursor: "pointer", background: "#fff", color: "#D6492F", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.7rem", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 };
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
.pvc-delete-cross {
  position: absolute; top: -8px; right: -8px; z-index: 2;
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: #fff; border: 1.5px solid rgba(214,73,47,0.4);
  color: #D6492F; cursor: pointer; padding: 0;
  opacity: 0; transform: scale(0.85);
  transition: opacity .15s, transform .15s, background .15s, border-color .15s, color .15s;
  box-shadow: 0 2px 6px rgba(11,42,61,0.15);
}
.pvc-card:hover .pvc-delete-cross { opacity: 1; transform: scale(1); }
.pvc-delete-cross:hover:not(:disabled) { background: #D6492F; color: #fff; border-color: #D6492F; }
.pvc-delete-cross:disabled { opacity: 0.5 !important; cursor: default; }
.pvc-status-select { -webkit-appearance: none; appearance: none; }
.pvc-status-select:focus { outline: 2px solid rgba(11,42,61,0.3); outline-offset: 1px; }
.pvc-link-btn { background: none; border: none; padding: 0; cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 0.68rem; color: #185FA5; }
.pvc-link-btn:hover { text-decoration: underline; }
`;