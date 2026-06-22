/**
 * Portivo — Arrivals page
 * Place at: src/pages/Arrivals.jsx
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as storage from "../api/storage";
import { setAlerts } from "../state/alerts";
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

function dayLabel(dateStr) {
  const d = diffDays(dateStr);
  if (d < 0)   return "Overdue";
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  return new Date(dateStr).toLocaleDateString("en-GB", { weekday: "long" });
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

function getFollowUp(container, verifiedMap) {
  if (container.status === "delivered") return null;
  const etdDays = container.etd ? diffDays(container.etd) : null;
  const etaDays = diffDays(container.eta);
  const etdVerified = verifiedMap[`${container.id}-etd`];
  const etaVerified = verifiedMap[`${container.id}-eta`];
  if (etdDays !== null && etdDays <= 0 && !etdVerified) {
    return { type: "etd", days: etdDays, date: container.etd };
  }
  if (etaDays <= 0 && !etaVerified) {
    return { type: "eta", days: etaDays, date: container.eta };
  }
  return null;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS = {
  in_transit:    { label: "In transit",    color: "#2F7E6C", bg: "#C7E0D8", textColor: "#085041", Icon: Ship          },
  customs:       { label: "In customs",    color: "#C9912B", bg: "#F0DDB3", textColor: "#854F0B", Icon: ClipboardList  },
  arriving_soon: { label: "Arriving soon", color: "#2F7E6C", bg: "#C7E0D8", textColor: "#085041", Icon: Anchor        },
  delivered:     { label: "Delivered",     color: "#2F7E6C", bg: "#C7E0D8", textColor: "#085041", Icon: CheckCircle   },
};

const MONO = "'IBM Plex Mono', monospace";

// ─── ETA pill ─────────────────────────────────────────────────────────────────

function ETAPill({ dateStr }) {
  const d = diffDays(dateStr);
  const base = {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "4px 11px", borderRadius: 4,
    fontFamily: MONO, fontSize: 10, fontWeight: 600,
    letterSpacing: ".06em", textTransform: "uppercase", flexShrink: 0,
  };
  if (d < 0)   return <span style={{ ...base, background: "#F8DDD5", color: "#D6492F"      }}><Clock  size={10} />Overdue</span>;
  if (d === 0) return <span style={{ ...base, background: "#FAEEDA", color: "#854F0B"      }}><Clock  size={10} />Today</span>;
  if (d === 1) return <span style={{ ...base, background: "#C7E0D8", color: "#085041"      }}><Anchor size={10} />Tomorrow</span>;
  if (d <= 4)  return <span style={{ ...base, background: "#C7E0D8", color: "#085041"      }}><Clock  size={10} />{d}d</span>;
  return        <span style={{ ...base, background: "rgba(11,42,61,.08)", color: "#0B2A3D" }}><Clock  size={10} />{d}d</span>;
}

// ─── Arrival card ─────────────────────────────────────────────────────────────

function ArrivalCard({ container, onClick }) {
  const [hovered, setHovered] = useState(false);
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
              Needs attention
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
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".18em", color: "#6E7F87", whiteSpace: "nowrap" }}>
          {dayLabel(date)}
        </span>
        <span style={{ fontSize: 10, color: "rgba(11,42,61,.25)" }}>·</span>
        <span style={{ fontFamily: MONO, fontSize: 10, color: "#6E7F87" }}>{shortDate(date)}</span>
        <div style={{ flex: 1, height: 1, background: "rgba(11,42,61,.12)" }} />
        <span style={{ fontFamily: MONO, fontSize: 10, color: "#6E7F87", whiteSpace: "nowrap" }}>
          {items.length} container{items.length > 1 ? "s" : ""}
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

function FollowUpBanner({ container, followUp, onVerify, onClick }) {
  const isOverdue = followUp.days < 0;
  const dateLabel = followUp.type === "etd" ? "departure" : "arrival";
  const verb = followUp.type === "etd" ? "left" : "arrived";
  const message = isOverdue
    ? `Expected ${dateLabel} was ${Math.abs(followUp.days)} day${Math.abs(followUp.days) !== 1 ? "s" : ""} ago — confirm it has ${verb} and email the agent.`
    : `Expected ${dateLabel} is today — confirm it has ${verb} and email the agent.`;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 18px", marginBottom: 10,
      background: isOverdue ? "#FBEAE4" : "#FAEEDA",
      border: `1px solid ${isOverdue ? "rgba(214,73,47,.28)" : "rgba(201,145,43,.3)"}`,
      borderRadius: 8,
    }}>
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
        style={{
          display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
          padding: "8px 14px", borderRadius: 7, border: "none", cursor: "pointer",
          background: "#0B2A3D", color: "#DCE6EA",
          fontFamily: MONO, fontSize: 10.5, letterSpacing: ".06em", textTransform: "uppercase", fontWeight: 600,
        }}
      >
        <CheckCircle size={13} /> Mark confirmed
      </button>
    </div>
  );
}

function VerifiedNote({ entry }) {
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
        {entry.label} confirmed by <b>{entry.by}</b> · {entry.when}
      </span>
    </div>
  );
}

function FollowUpSection({ items, verifiedMap, recentlyVerified, onVerify, onClick }) {
  if (items.length === 0 && recentlyVerified.length === 0) return null;
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <AlertCircle size={14} style={{ color: items.length > 0 ? "#D6492F" : "#2F7E6C" }} />
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#1C2B33", fontWeight: 600 }}>
          Needs follow-up
        </span>
        {items.length > 0 && (
          <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 2, background: "#F8DDD5", color: "#D6492F" }}>
            {items.length}
          </span>
        )}
      </div>
      {items.map(({ container, followUp }) => (
        <FollowUpBanner
          key={`${container.id}-${followUp.type}`}
          container={container}
          followUp={followUp}
          onVerify={onVerify}
          onClick={() => onClick(container.id)}
        />
      ))}
      {recentlyVerified.map(entry => (
        <VerifiedNote key={`${entry.id}-${entry.type}`} entry={entry} />
      ))}
    </div>
  );
}

function Hero({ weekCount, customsCount, overdueCount }) {
  const kpis = [
    { val: pad(weekCount),    label: "Arriving this week", accent: "#2F7E6C"                              },
    { val: pad(customsCount), label: "Awaiting customs",   accent: "#C9912B"                              },
    { val: pad(overdueCount), label: "Past ETA",           accent: overdueCount > 0 ? "#D6492F" : "#2F7E6C" },
  ];
  return (
    <div style={{ position: "relative", height: 560, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <img
        src="https://images.unsplash.com/photo-1595587637401-83ff822bd63e?q=80&w=901&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=1600&q=80&auto=format&fit=crop"
        alt="Container ships at port"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 35%" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,32,48,.05) 0%, rgba(8,32,48,.25) 55%, rgba(8,32,48,.92) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(11,42,61,.1)" }} />
      <span style={{ position: "absolute", bottom: 100, right: 16, zIndex: 3, fontFamily: MONO, fontSize: 9, letterSpacing: ".1em", color: "rgba(255,255,255,.28)", textTransform: "uppercase" }}>
        Photo: Unsplash
      </span>
      <div style={{ position: "relative", zIndex: 2, padding: "0 44px" }}>
        <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: "#C7E0D8", marginBottom: 10 }}>
          Port operations · Tunis-Goulette
        </p>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "clamp(2.4rem,5vw,4rem)", lineHeight: .95, letterSpacing: "-.02em", color: "#DCE6EA", marginBottom: 10 }}>
          Arrivals
        </h1>
        <p style={{ fontFamily: "'Fraunces', serif", fontWeight: 300, fontSize: "clamp(.85rem,1.5vw,1.05rem)", color: "rgba(220,230,234,.68)", maxWidth: "44ch", lineHeight: 1.55 }}>
          Every inbound container, sorted by ETA — from open ocean to berth.
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
  const [containers, setContainers] = useState([]);  // ← now state, not a static import
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState("this_week");
  const [syncTime, setSyncTime]     = useState("");
  const [verifiedMap, setVerifiedMap]         = useState({});
  const [recentlyVerified, setRecentlyVerified] = useState([]);

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

  const handleVerify = (containerId, type) => {
    const container = containers.find(c => c.id === containerId);
    const key = `${containerId}-${type}`;
    setVerifiedMap(m => ({ ...m, [key]: true }));
    setRecentlyVerified(list => [
      {
        id: containerId,
        type,
        number: container.number,
        label: type === "etd" ? "Departure" : "Arrival",
        by: "You",
        when: new Date().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
      },
      ...list,
    ]);
  };

  const followUps = containers
    .map(container => ({ container, followUp: getFollowUp(container, verifiedMap) }))
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
            ? (followUp.days < 0 ? `Departure overdue by ${Math.abs(followUp.days)}d` : "Departure due today")
            : (followUp.days < 0 ? `Arrival overdue by ${Math.abs(followUp.days)}d`   : "Arrival due today"),
      })),
    });
  }, [followUps]);

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
    { key: "this_week", label: "This week", count: weekCount,     danger: false },
    { key: "next_week", label: "Next week", count: nextWeekCount, danger: false },
    { key: "overdue",   label: "Overdue",   count: overdueCount,  danger: true  },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap');
        .pv-arr-root * { box-sizing: border-box; margin: 0; padding: 0; }
        .pv-arr-root { font-family:'IBM Plex Sans',sans-serif; background:#ECE7DA; -webkit-font-smoothing:antialiased; color:#1C2B33; }
        @media(max-width:640px){ .pv-arr-body { padding: 24px 20px !important; } }
      `}</style>

      <div className="pv-arr-root">
        <Hero weekCount={weekCount} customsCount={customsCount} overdueCount={overdueCount} />

        <div className="pv-arr-body" style={{ padding: "36px 44px", maxWidth: 1200, margin: "0 auto" }}>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "#6E7F87" }}>
              {loading ? "Loading…" : `Last synced · ${syncTime}`}
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
            verifiedMap={verifiedMap}
            recentlyVerified={recentlyVerified}
            onVerify={handleVerify}
            onClick={id => navigate(`/containers/${id}`)}
          />

          {loading ? (
            <div style={{ textAlign: "center", padding: "56px 0", color: "#6E7F87" }}>
              <Ship size={28} style={{ opacity: .4, margin: "0 auto 12px", display: "block" }} />
              <p style={{ fontFamily: MONO, fontSize: 12 }}>Loading containers…</p>
            </div>
          ) : grouped.length === 0 ? (
            <div style={{ textAlign: "center", padding: "56px 0", color: "#6E7F87" }}>
              <Ship size={28} style={{ opacity: .4, margin: "0 auto 12px", display: "block" }} />
              <p style={{ fontFamily: MONO, fontSize: 12 }}>No containers for this period.</p>
            </div>
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
              {filtered.length} container{filtered.length !== 1 ? "s" : ""} in this period
            </p>
          )}

        </div>
      </div>
    </>
  );
}
