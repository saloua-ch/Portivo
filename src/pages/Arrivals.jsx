/**
 * Portivo — Arrivals page
 * Place at: src/pages/Arrivals.jsx
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as storage from "../api/storage";
import { setAlerts } from "../state/alerts";
import { useLanguage } from "../context/LanguageContext";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import {
  Ship, ClipboardList, Anchor, CheckCircle,
  AlertCircle, AlertTriangle, Clock, Mail,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function diffDays(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(dateStr) - today) / 86400000);
}

// Generated container ids can themselves contain hyphens (e.g.
// "CNT-mr39eelr-1ke"), so a plain "-" join would be ambiguous to read
// back — not that we ever parse it apart, but "::" keeps it unambiguous
// at a glance if this ever shows up in a debugger.
function followUpKey(containerId, type) {
  return `${containerId}::${type}`;
}

function dayLabel(dateStr, t, language) {
  const d = diffDays(dateStr);
  if (d < 0)   return t("containers.overdue");
  if (d === 0) return t("containers.today");
  if (d === 1) return t("containers.tomorrow");
  return new Date(dateStr).toLocaleDateString(language === "fr" ? "fr-FR" : "en-GB", { weekday: "long" });
}

function shortDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function groupByETA(list) {
  const g = {};
  list.forEach(c => { if (!g[c.eta]) g[c.eta] = []; g[c.eta].push(c); });
  return Object.entries(g).sort(([a], [b]) => new Date(a) - new Date(b));
}

// Follow-up status now reads directly off the persisted container fields
// (etdVerified / etaVerified) instead of local-only state, so a confirmation
// survives a page reload.
function getFollowUp(container) {
  if (container.status === "delivered") return null;
  const etdDays = container.etd ? diffDays(container.etd) : null;
  const etaDays = diffDays(container.eta);
  if (etdDays !== null && etdDays <= 0 && !container.etdVerified) {
    return { type: "etd", days: etdDays, date: container.etd };
  }
  if (etaDays <= 0 && !container.etaVerified) {
    return { type: "eta", days: etaDays, date: container.eta };
  }
  return null;
}

// ─── Status config ────────────────────────────────────────────────────────────

function getStatus(t) {
  return {
    in_transit:    { label: t("containers.inTransit"),    color: "#2F7E6C", bg: "#C7E0D8", textColor: "#085041", Icon: Ship          },
    customs:       { label: t("containers.customs"),      color: "#C9912B", bg: "#F0DDB3", textColor: "#854F0B", Icon: ClipboardList  },
    arriving_soon: { label: t("containers.arrivingSoon"), color: "#2F7E6C", bg: "#C7E0D8", textColor: "#085041", Icon: Anchor        },
    delivered:     { label: t("containers.delivered"),    color: "#2F7E6C", bg: "#C7E0D8", textColor: "#085041", Icon: CheckCircle   },
  };
}

const MONO = "'IBM Plex Mono', monospace";

// ─── ETA pill ─────────────────────────────────────────────────────────────────

function ETAPill({ dateStr }) {
  const { t } = useLanguage();
  const d = diffDays(dateStr);
  const base = {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "4px 11px", borderRadius: 4,
    fontFamily: MONO, fontSize: 10, fontWeight: 600,
    letterSpacing: ".06em", textTransform: "uppercase", flexShrink: 0,
  };
  if (d < 0)   return <span style={{ ...base, background: "#F8DDD5", color: "#D6492F"      }}><Clock  size={10} />{t("containers.overdue")}</span>;
  if (d === 0) return <span style={{ ...base, background: "#FAEEDA", color: "#854F0B"      }}><Clock  size={10} />{t("containers.today")}</span>;
  if (d === 1) return <span style={{ ...base, background: "#C7E0D8", color: "#085041"      }}><Anchor size={10} />{t("containers.tomorrow")}</span>;
  if (d <= 4)  return <span style={{ ...base, background: "#C7E0D8", color: "#085041"      }}><Clock  size={10} />{d}{t("arrivals.dayAbbrev")}</span>;
  return        <span style={{ ...base, background: "rgba(11,42,61,.08)", color: "#0B2A3D" }}><Clock  size={10} />{d}{t("arrivals.dayAbbrev")}</span>;
}

// ─── Arrival card ─────────────────────────────────────────────────────────────

function ArrivalCard({ container, onClick }) {
  const { t } = useLanguage();
  const [hovered, setHovered] = useState(false);
  const STATUS = getStatus(t);
  const cfg    = STATUS[container.status] || STATUS.in_transit;
  const Icon   = cfg.Icon;
  const accent = container.needsAttention ? "#D6492F" : cfg.color;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#F0EDE4" : "#ECE7DA",
        border: "1px solid rgba(11,42,61,.12)",
        display: "grid",
        gridTemplateColumns: "4px 1fr",
        cursor: "pointer",
        transform: hovered ? "translateX(3px)" : "translateX(0)",
        transition: "background .15s, transform .12s",
        position: "relative",
        zIndex: hovered ? 1 : 0,
        marginTop: -1,
      }}
    >
      <div style={{ background: accent }} />
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 18px" }}>
        <div style={{
          width: 40, height: 40, borderRadius: 5, flexShrink: 0,
          background: "rgba(11,42,61,.06)", color: accent,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
            <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, color: "#0B2A3D", letterSpacing: ".03em" }}>
              {container.number}
            </span>
            {container.needsAttention && (
              <AlertCircle size={13} style={{ color: "#D6492F", flexShrink: 0 }} />
            )}
          </div>
          <p style={{ fontSize: 12, color: "#6E7F87", margin: 0 }}>
            {container.origin} → {container.destination}
            <span style={{ margin: "0 6px" }}>·</span>
            {container.carrier}
          </p>
          {container.needsAttention && container.attentionReason && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5, fontSize: 11, color: "#D6492F" }}>
              <AlertTriangle size={11} style={{ flexShrink: 0 }} />
              {container.attentionReason}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
          <ETAPill dateStr={container.eta} />
          {container.needsAttention && (
            <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 2, background: "#F8DDD5", color: "#D6492F" }}>
              {t("arrivals.needsAttentionBadge")}
            </span>
          )}
          <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 2, background: cfg.bg, color: cfg.textColor }}>
            {cfg.label}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 10, color: "#6E7F87" }}>
            {container.groupages?.length ?? 0} groupage{(container.groupages?.length ?? 0) !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Day group ────────────────────────────────────────────────────────────────

function DayGroup({ date, items, onCardClick }) {
  const { t, language } = useLanguage();
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".18em", color: "#6E7F87", whiteSpace: "nowrap" }}>
          {dayLabel(date, t, language)}
        </span>
        <span style={{ fontSize: 10, color: "rgba(11,42,61,.25)" }}>·</span>
        <span style={{ fontFamily: MONO, fontSize: 10, color: "#6E7F87" }}>{shortDate(date)}</span>
        <div style={{ flex: 1, height: 1, background: "rgba(11,42,61,.12)" }} />
        <span style={{ fontFamily: MONO, fontSize: 10, color: "#6E7F87", whiteSpace: "nowrap" }}>
          {items.length} {items.length > 1 ? t("containers.containerPlural") : t("containers.containerSingular")}
        </span>
      </div>
      <div style={{ overflow: "hidden", borderRadius: 1 }}>
        {items.map(c => (
          <ArrivalCard key={c.id} container={c} onClick={() => onCardClick(c.id)} />
        ))}
      </div>
    </div>
  );
}

// ─── Follow-up banner ─────────────────────────────────────────────────────────

function FollowUpBanner({ container, followUp, onVerify, onClick, busy, selected, onToggleSelect }) {
  const { t } = useLanguage();
  const isOverdue = followUp.days < 0;
  const n = Math.abs(followUp.days);

  let message;
  if (followUp.type === "etd") {
    message = isOverdue
      ? t(n === 1 ? "arrivals.followUpEtdOverdueSingular" : "arrivals.followUpEtdOverduePlural").replace("{n}", n)
      : t("arrivals.followUpEtdToday");
  } else {
    message = isOverdue
      ? t(n === 1 ? "arrivals.followUpEtaOverdueSingular" : "arrivals.followUpEtaOverduePlural").replace("{n}", n)
      : t("arrivals.followUpEtaToday");
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 18px", marginBottom: 10,
      background: isOverdue ? "#FBEAE4" : "#FAEEDA",
      border: `1px solid ${isOverdue ? "rgba(214,73,47,.28)" : "rgba(201,145,43,.3)"}`,
      borderRadius: 8,
    }}>
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggleSelect}
        disabled={busy}
        aria-label={`${t("arrivals.selectItem")} ${container.number}`}
        style={{ width: 15, height: 15, flexShrink: 0, cursor: busy ? "default" : "pointer", accentColor: "#0B2A3D" }}
      />
      <div style={{
        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: isOverdue ? "rgba(214,73,47,.12)" : "rgba(201,145,43,.16)",
        color: isOverdue ? "#D6492F" : "#854F0B",
      }}>
        <Mail size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={onClick}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 13, color: "#1C2B33" }}>
            {container.number}
          </span>
          <span style={{ fontSize: 12.5, color: isOverdue ? "#a13a26" : "#6b4a0a" }}>
            {message}
          </span>
        </div>
      </div>
      <button
        onClick={() => onVerify(container.id, followUp.type)}
        disabled={busy}
        style={{
          display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
          padding: "8px 14px", borderRadius: 7, border: "none", cursor: busy ? "default" : "pointer",
          background: "#0B2A3D", color: "#DCE6EA", opacity: busy ? 0.6 : 1,
          fontFamily: MONO, fontSize: 10.5, letterSpacing: ".06em", textTransform: "uppercase", fontWeight: 600,
        }}
      >
        <CheckCircle size={13} /> {busy ? t("arrivals.savingEllipsis") : t("arrivals.markConfirmed")}
      </button>
    </div>
  );
}

function VerifiedNote({ entry }) {
  const { t } = useLanguage();
  const label = entry.type === "etd" ? t("arrivals.departureLabel") : t("arrivals.arrivalLabel");
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "9px 16px", marginBottom: 8,
      background: "rgba(47,126,108,.06)", border: "1px solid rgba(47,126,108,.16)",
      borderRadius: 8, fontSize: 12,
    }}>
      <CheckCircle size={13} style={{ color: "#2F7E6C", flexShrink: 0 }} />
      <span style={{ fontFamily: MONO, fontWeight: 700, color: "#1C2B33" }}>{entry.number}</span>
      <span style={{ color: "#3B6D11" }}>
        {label} {t("arrivals.confirmedByPrefix")} <b>{entry.by}</b> · {entry.when}
      </span>
    </div>
  );
}

function FollowUpSection({ items, recentlyVerified, onVerify, onVerifyMany, onClick, pendingKeys, selectedKeys, onToggleSelect, onSelectAll, onClearSelection }) {
  const { t } = useLanguage();
  if (items.length === 0 && recentlyVerified.length === 0) return null;
  const selectedCount = selectedKeys.size;
  const allSelected = items.length > 0 && selectedCount === items.length;
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <AlertCircle size={14} style={{ color: items.length > 0 ? "#D6492F" : "#2F7E6C" }} />
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#1C2B33", fontWeight: 600 }}>
          {t("arrivals.needsFollowUp")}
        </span>
        {items.length > 0 && (
          <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 2, background: "#F8DDD5", color: "#D6492F" }}>
            {items.length}
          </span>
        )}

        <div style={{ flex: 1 }} />

        {items.length > 1 && selectedCount === 0 && (
          <button type="button" onClick={onSelectAll} className="pv-arr-link-btn">
            {t("arrivals.selectAll")}
          </button>
        )}
        {selectedCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: "#6E7F87" }}>
              {t("arrivals.nSelected").replace("{n}", selectedCount)}
            </span>
            <button type="button" onClick={onClearSelection} className="pv-arr-link-btn">
              {t("arrivals.clearSelection")}
            </button>
            <button
              type="button"
              onClick={onVerifyMany}
              disabled={pendingKeys.size > 0}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 13px", borderRadius: 7, border: "none", cursor: pendingKeys.size > 0 ? "default" : "pointer",
                background: "#0B2A3D", color: "#DCE6EA", opacity: pendingKeys.size > 0 ? 0.6 : 1,
                fontFamily: MONO, fontSize: 10.5, letterSpacing: ".06em", textTransform: "uppercase", fontWeight: 600,
              }}
            >
              <CheckCircle size={13} />
              {pendingKeys.size > 0 ? t("arrivals.savingEllipsis") : t("arrivals.confirmSelected").replace("{n}", selectedCount)}
            </button>
          </div>
        )}
      </div>
      {items.map(({ container, followUp }) => {
        const key = followUpKey(container.id, followUp.type);
        return (
          <FollowUpBanner
            key={key}
            container={container}
            followUp={followUp}
            onVerify={onVerify}
            onClick={() => onClick(container.id)}
            busy={pendingKeys.has(key)}
            selected={selectedKeys.has(key)}
            onToggleSelect={() => onToggleSelect(key)}
          />
        );
      })}
      {recentlyVerified.map(entry => (
        <VerifiedNote key={`${entry.id}-${entry.type}`} entry={entry} />
      ))}
    </div>
  );
}

function Hero({ weekCount, customsCount, overdueCount }) {
  const { t } = useLanguage();
  const kpis = [
    { val: pad(weekCount),    label: t("arrivals.kpiArrivingWeek"),   accent: "#2F7E6C"                              },
    { val: pad(customsCount), label: t("arrivals.kpiAwaitingCustoms"), accent: "#C9912B"                              },
    { val: pad(overdueCount), label: t("arrivals.kpiPastEta"),         accent: overdueCount > 0 ? "#D6492F" : "#2F7E6C" },
  ];
  return (
    <div style={{ position: "relative", height: 560, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end", background: "#0B2A3D" }}>
      <img loading="eager" fetchPriority="high"
        src="/images/arrivals.avif"
        alt="Container ships at port"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 35%" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,32,48,.05) 0%, rgba(8,32,48,.25) 55%, rgba(8,32,48,.92) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(11,42,61,.1)" }} />
      <span style={{ position: "absolute", bottom: 100, right: 16, zIndex: 3, fontFamily: MONO, fontSize: 9, letterSpacing: ".1em", color: "rgba(255,255,255,.28)", textTransform: "uppercase" }}>
        {t("arrivals.heroPhotoCredit")}
      </span>
      <div style={{ position: "relative", zIndex: 2, padding: "0 44px" }}>
        <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: "#C7E0D8", marginBottom: 10 }}>
          {t("arrivals.heroEyebrow")}
        </p>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "clamp(2.4rem,5vw,4rem)", lineHeight: .95, letterSpacing: "-.02em", color: "#DCE6EA", marginBottom: 10 }}>
          {t("arrivals.title")}
        </h1>
        <p style={{ fontFamily: "'Fraunces', serif", fontWeight: 300, fontSize: "clamp(.85rem,1.5vw,1.05rem)", color: "rgba(220,230,234,.68)", maxWidth: "44ch", lineHeight: 1.55 }}>
          {t("arrivals.heroSubtitle")}
        </p>
      </div>
      <div style={{ position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: "repeat(3,1fr)", marginTop: 24, borderTop: "1px solid rgba(255,255,255,.1)" }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ padding: "16px 28px 20px", borderRight: i < 2 ? "1px solid rgba(255,255,255,.08)" : "none", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 2, background: k.accent }} />
            <div style={{ fontFamily: MONO, fontSize: "clamp(1.3rem,2.4vw,1.75rem)", fontWeight: 700, color: "#DCE6EA", lineHeight: 1, marginBottom: 3 }}>
              {k.val}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(111,139,156,.8)" }}>
              {k.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Arrivals() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [containers, setContainers] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState("this_week");
  const [syncTime, setSyncTime]     = useState("");
  const [recentlyVerified, setRecentlyVerified] = useState([]);
  const [pendingKeys, setPendingKeys] = useState(() => new Set()); // keys currently saving
  const [selectedKeys, setSelectedKeys] = useState(() => new Set()); // keys checked for bulk confirm

  // Load from storage on mount, reload on data changes
  useEffect(() => {
    async function load() {
      setLoading(true);
      const list = await storage.getContainers();
      setContainers(list);
      setLoading(false);
      setSyncTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
    }
    load();
    const unsubscribe = storage.onChange(() => load());
    return unsubscribe;
  }, []);

  // Persist one confirmation so it survives a reload — the followUp check
  // reads container.etdVerified / etaVerified, not local-only state.
  // Shared by both the single "Mark confirmed" button and the bulk action.
  const verifyOne = async (containerId, type) => {
    const container = containers.find(c => c.id === containerId);
    if (!container) return null;
    const whenIso = new Date().toISOString();
    await storage.updateContainer(containerId, {
      [`${type}Verified`]: true,
      [`${type}VerifiedBy`]: "You",
      [`${type}VerifiedAt`]: whenIso,
    });
    return {
      id: containerId,
      type,
      number: container.number,
      by: t("arrivals.youLabel"),
      when: new Date(whenIso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
    };
  };

  const handleVerify = async (containerId, type) => {
    const key = followUpKey(containerId, type);
    setPendingKeys(prev => new Set(prev).add(key));
    try {
      const entry = await verifyOne(containerId, type);
      if (entry) setRecentlyVerified(list => [entry, ...list]);
      // storage.onChange (subscribed above) will reload containers with the
      // persisted flag, so the banner disappears and stays gone on refresh.
    } catch (err) {
      console.error("Failed to save confirmation", err);
      alert(t("arrivals.errConfirmSave"));
    } finally {
      setPendingKeys(prev => { const n = new Set(prev); n.delete(key); return n; });
      setSelectedKeys(prev => { const n = new Set(prev); n.delete(key); return n; });
    }
  };

  const handleVerifyMany = async () => {
    const targets = followUps.filter(({ container, followUp }) => selectedKeys.has(followUpKey(container.id, followUp.type)));
    if (targets.length === 0) return;
    const keys = targets.map(({ container, followUp }) => followUpKey(container.id, followUp.type));
    setPendingKeys(prev => new Set([...prev, ...keys]));
    const newEntries = [];
    let hadError = false;
    // Sequential on purpose — a handful of writes at a time is gentler on
    // the backend than firing them all at once, and keeps the "Saving…"
    // state simple to reason about.
    for (const { container, followUp } of targets) {
      try {
        const entry = await verifyOne(container.id, followUp.type);
        if (entry) newEntries.push(entry);
      } catch (err) {
        console.error("Failed to save confirmation", err);
        hadError = true;
      }
    }
    if (newEntries.length > 0) setRecentlyVerified(list => [...newEntries, ...list]);
    setPendingKeys(prev => { const n = new Set(prev); keys.forEach(k => n.delete(k)); return n; });
    setSelectedKeys(new Set());
    if (hadError) alert(t("arrivals.errConfirmSave"));
  };

  const toggleSelect = (key) => {
    setSelectedKeys(prev => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key); else n.add(key);
      return n;
    });
  };

  const followUps = containers
    .map(container => ({ container, followUp: getFollowUp(container) }))
    .filter(({ followUp }) => followUp !== null)
    .sort((a, b) => a.followUp.days - b.followUp.days);

  useEffect(() => {
    setAlerts({
      count: followUps.length,
      items: followUps.map(({ container, followUp }) => ({
        id: container.id,
        number: container.number,
        type: followUp.type,
        severity: followUp.days < 0 ? "overdue" : "due_today",
        message:
          followUp.type === "etd"
            ? (followUp.days < 0 ? `${t("arrivals.alertDepartureOverdue")} ${Math.abs(followUp.days)}${t("arrivals.dayAbbrev")}` : t("arrivals.alertDepartureDueToday"))
            : (followUp.days < 0 ? `${t("arrivals.alertArrivalOverdue")} ${Math.abs(followUp.days)}${t("arrivals.dayAbbrev")}`   : t("arrivals.alertArrivalDueToday")),
      })),
    });
  }, [followUps, t]);

  const weekCount     = containers.filter(c => { const d = diffDays(c.eta); return d >= 0 && d <= 7; }).length;
  const nextWeekCount = containers.filter(c => { const d = diffDays(c.eta); return d > 7 && d <= 14; }).length;
  const customsCount  = containers.filter(c => c.status === "customs").length;
  const overdueCount  = containers.filter(c => diffDays(c.eta) < 0 && c.status !== "delivered").length;

  const filtered = containers.filter(c => {
    const d = diffDays(c.eta);
    if (activeTab === "this_week") return d >= 0 && d <= 7;
    if (activeTab === "next_week") return d > 7 && d <= 14;
    if (activeTab === "overdue")   return d < 0 && c.status !== "delivered";
    return true;
  });

  const grouped = groupByETA(filtered);

  const TABS = [
    { key: "this_week", label: t("arrivals.tabThisWeek"), count: weekCount,     danger: false },
    { key: "next_week", label: t("arrivals.tabNextWeek"), count: nextWeekCount, danger: false },
    { key: "overdue",   label: t("containers.overdue"),   count: overdueCount,  danger: true  },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap');
        .pv-arr-root * { box-sizing: border-box; margin: 0; padding: 0; }
        .pv-arr-root { font-family:'IBM Plex Sans',sans-serif; background:#ECE7DA; -webkit-font-smoothing:antialiased; color:#1C2B33; }
        .pv-arr-link-btn { background:none; border:none; padding:0; cursor:pointer; font-family:'IBM Plex Mono',monospace; font-size:10.5px; letter-spacing:.04em; color:#185FA5; text-decoration:none; }
        .pv-arr-link-btn:hover { text-decoration:underline; }
        @media(max-width:640px){ .pv-arr-body { padding: 24px 20px !important; } }
      `}</style>

      <div className="pv-arr-root">
        <Hero weekCount={weekCount} customsCount={customsCount} overdueCount={overdueCount} />

        <div className="pv-arr-body" style={{ padding: "36px 44px", maxWidth: 1200, margin: "0 auto" }}>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "#6E7F87" }}>
              {loading ? t("arrivals.loadingSync") : `${t("arrivals.lastSyncedPrefix")} ${syncTime}`}
            </span>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, marginBottom: 32, borderBottom: "1px solid rgba(11,42,61,.14)" }}>
            {TABS.map(tab => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase",
                    color: active ? "#0B2A3D" : "#6E7F87",
                    background: "none", border: "none", cursor: "pointer",
                    padding: "10px 20px 12px", position: "relative",
                    display: "flex", alignItems: "center", gap: 8,
                    transition: "color .15s",
                    borderBottom: active ? "2px solid #0B2A3D" : "2px solid transparent",
                    marginBottom: -1,
                  }}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span style={{
                      fontFamily: MONO, fontSize: 10, fontWeight: 700,
                      padding: "2px 7px", borderRadius: 2,
                      background: tab.danger ? "#F8DDD5" : "rgba(11,42,61,.1)",
                      color: tab.danger ? "#D6492F" : "#0B2A3D",
                    }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <FollowUpSection
            items={followUps}
            recentlyVerified={recentlyVerified}
            onVerify={handleVerify}
            onVerifyMany={handleVerifyMany}
            onClick={id => navigate(`/containers/${id}`)}
            pendingKeys={pendingKeys}
            selectedKeys={selectedKeys}
            onToggleSelect={toggleSelect}
            onSelectAll={() => setSelectedKeys(new Set(followUps.map(({ container, followUp }) => followUpKey(container.id, followUp.type))))}
            onClearSelection={() => setSelectedKeys(new Set())}
          />

          {loading ? (
            <LoadingState label={t("arrivals.loadingContainers")} />
          ) : grouped.length === 0 ? (
            <EmptyState icon={Ship} title={t("arrivals.noContainersPeriod")} />
          ) : (
            grouped.map(([date, items]) => (
              <DayGroup
                key={date}
                date={date}
                items={items}
                onCardClick={id => navigate(`/containers/${id}`)}
              />
            ))
          )}

          {!loading && grouped.length > 0 && (
            <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "#6E7F87", textAlign: "center", paddingTop: 20 }}>
              {filtered.length} {filtered.length !== 1 ? t("containers.containerPlural") : t("containers.containerSingular")} {t("arrivals.containersInPeriodSuffix")}
            </p>
          )}

        </div>
      </div>
    </>
  );
}