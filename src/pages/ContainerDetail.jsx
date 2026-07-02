import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import * as storage from "../api/storage";
import {
  ArrowLeft, AlertCircle, Package, FileText,
  CheckCircle, Clock, ClipboardList,
  MapPin, Calendar, Layers, CalendarClock,
} from "lucide-react";

/* ── Google Fonts ── */
if (typeof document !== "undefined" && !document.getElementById("pvd-gf")) {
  const l = document.createElement("link");
  l.id = "pvd-gf"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap";
  document.head.appendChild(l);
}

const statusConfig = {
  in_transit:    { label: "In transit",    color: "#185FA5", bg: "#E6F1FB", accent: "#185FA5" },
  customs:       { label: "In customs",    color: "#854F0B", bg: "#FAEEDA", accent: "#C9912B" },
  arriving_soon: { label: "Arriving soon", color: "#3B6D11", bg: "#EAF3DE", accent: "#2F7E6C" },
  delivered:     { label: "Delivered",     color: "#444441", bg: "#F1EFE8", accent: "#6E7F87" },
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function formatDateShort(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
// "2026-07-18" style timeline dates → "2026-07-18" for <input type="date">
function toInputDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

const DEFAULT_TIMELINE = [
  { step: "Departed origin port", date: null, done: true    },
  { step: "In transit",           date: null, current: true },
  { step: "Arrived destination",  date: null, done: false   },
];

const MONO = "'IBM Plex Mono', monospace";

export default function ContainerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("groupages");
  const [container, setContainer] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [savingIdx, setSavingIdx] = useState(null); // index of groupage row currently saving
  const [savingTimeline, setSavingTimeline] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await storage.getContainer(id);
      setContainer(data);
      setLoading(false);
    }
    load();
    // reload if data changes elsewhere (e.g. updateContainer called)
    const unsubscribe = storage.onChange(() => load());
    return unsubscribe;
  }, [id]);

  // Edits the delivery status of one groupage, persists it, and keeps the
  // container's overall status honest: if every groupage ends up delivered,
  // the container becomes "delivered" too; if one is reverted afterwards,
  // it's backed off "delivered" since that's no longer true.
  async function handleDeliveryChange(index, delivered) {
    if (!container) return;
    const updatedGroupages = container.groupages.map((g, i) =>
      i === index ? { ...g, delivered } : g
    );
    const allDelivered = updatedGroupages.length > 0 && updatedGroupages.every(g => g.delivered);
    const patch = { groupages: updatedGroupages };
    if (allDelivered && container.status !== "delivered") {
      patch.status = "delivered";
    } else if (!allDelivered && container.status === "delivered") {
      patch.status = "arriving_soon";
    }
    setSavingIdx(index);
    try {
      await storage.updateContainer(container.id, patch);
      // storage.onChange (subscribed above) reloads the container, so local
      // state will reflect the persisted value once the write completes.
    } catch (err) {
      console.error("Failed to update delivery status", err);
      alert("Couldn't save the delivery status — please try again.");
    } finally {
      setSavingIdx(null);
    }
  }

  // ── Timeline editing ──
  // Clicking a step marks every step before it "done" and that step
  // "current" — i.e. moves the container's progress to that point.
  async function persistTimeline(timeline) {
    if (!container) return;
    setSavingTimeline(true);
    try {
      await storage.updateContainer(container.id, { timeline });
    } catch (err) {
      console.error("Failed to update timeline", err);
      alert("Couldn't save the timeline — please try again.");
    } finally {
      setSavingTimeline(false);
    }
  }

  function handleTimelineAdvance(index) {
    const base = container.timeline?.length ? container.timeline : DEFAULT_TIMELINE;
    const updated = base.map((step, i) => ({
      ...step,
      done: i < index,
      current: i === index,
    }));
    persistTimeline(updated);
  }

  function handleTimelineDateChange(index, value) {
    const base = container.timeline?.length ? container.timeline : DEFAULT_TIMELINE;
    const updated = base.map((step, i) => i === index ? { ...step, date: value || null } : step);
    persistTimeline(updated);
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", paddingTop: 80, color: "#6E7F87", fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <p style={{ fontSize: 14 }}>Loading container…</p>
      </div>
    );
  }

  if (!container) {
    return (
      <div style={{ textAlign: "center", paddingTop: 80, color: "#6E7F87", fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <p style={{ fontSize: 16 }}>Container not found.</p>
        <button
          onClick={() => navigate("/containers")}
          style={{ marginTop: 16, padding: "8px 20px", border: "1px solid rgba(11,42,61,0.22)", background: "#fff", cursor: "pointer", fontSize: 13, borderRadius: 6 }}
        >
          Back to containers
        </button>
      </div>
    );
  }

  const cfg        = statusConfig[container.status] || statusConfig.in_transit;
  const accentHex  = container.needsAttention ? "#D6492F" : cfg.accent;
  const groupages  = container.groupages?.length ? container.groupages : [];

  const tabs = [
    { key: "groupages", label: "Groupages", icon: Layers      },
    { key: "timeline",  label: "Timeline",  icon: Clock       },
    { key: "documents", label: "Documents", icon: FileText, isLink: true },
  ];

  const statusStripCells = [
    { val: cfg.label,                                label: "Current status",  color: cfg.accent  },
    { val: container.needsAttention ? "Yes" : "No", label: "Needs attention", color: container.needsAttention ? "#D6492F" : "#2F7E6C" },
    { val: groupages.length,                         label: "Groupages",       color: "#2F7E6C"   },
    { val: formatDateShort(container.eta),           label: "ETA",             color: "#C9912B"   },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: "#ECE7DA", color: "#1C2B33", minHeight: "100vh" }}>

        {/* ── Hero ── */}
        <div style={{ position: "relative", height: 480, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <img
            src="https://images.unsplash.com/photo-1750593481405-876be1140853?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=1600&q=80&auto=format&fit=crop"
            alt="Shipping container close-up"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,32,48,.1) 0%, rgba(8,32,48,.35) 50%, rgba(8,32,48,.94) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "rgba(11,42,61,.12)" }} />

          <div style={{ position: "relative", zIndex: 2, padding: "0 clamp(24px,5vw,48px) 36px" }}>
            <button className="pvd-back" onClick={() => navigate(-1)}>
              <ArrowLeft size={13} aria-hidden="true" /> Containers
            </button>

            <p style={{ fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#9DB5C0", margin: "0 0 12px" }}>
              Container detail · {container.carrier}
            </p>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
              <div>
                <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "clamp(2.2rem,5vw,3.6rem)", letterSpacing: "-0.02em", color: "#DCE6EA", lineHeight: 1, margin: "0 0 14px" }}>
                  {container.number}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: MONO, fontSize: "0.78rem", color: "#C7E0D8" }}>
                    <MapPin size={13} />
                    {container.origin} <span style={{ opacity: .5 }}>→</span> {container.destination}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: MONO, fontSize: "0.78rem", color: "#C7E0D8" }}>
                    <Calendar size={13} />
                    ETA {formatDate(container.eta)}
                  </span>
                </div>
              </div>

              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "9px 16px", borderRadius: 8,
                background: "rgba(255,255,255,.1)", border: `1px solid ${accentHex}55`,
                flexShrink: 0,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: accentHex, flexShrink: 0 }} />
                <span style={{ fontFamily: MONO, fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#DCE6EA", fontWeight: 600 }}>
                  {cfg.label}
                </span>
              </div>
            </div>

            {container.needsAttention && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8, marginTop: 18,
                background: "rgba(214,73,47,0.16)", border: "1px solid rgba(214,73,47,0.35)",
                padding: "8px 16px", borderRadius: 8, color: "#f0b8a8",
                fontFamily: MONO, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
                <AlertCircle size={14} aria-hidden="true" />
                {container.attentionReason}
              </div>
            )}
          </div>
        </div>

        {/* ── Status strip ── */}
        <div style={{ display: "flex", flexWrap: "wrap", borderBottom: "1px solid rgba(11,42,61,0.18)" }}>
          {statusStripCells.map(({ val, label, color }, i) => (
            <div key={label} style={{
              flex: "1 1 140px", padding: "18px 28px",
              borderLeft: `3px solid ${color}`,
              borderRight: i === statusStripCells.length - 1 ? "none" : "1px solid rgba(11,42,61,0.12)",
              background: "#E2DCCB",
            }}>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: "1.1rem", lineHeight: 1.2, color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {val}
              </div>
              <div style={{ marginTop: 4, fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#6E7F87" }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(11,42,61,0.18)", background: "#ECE7DA", padding: "0 clamp(24px,5vw,48px)" }}>
          {tabs.map(({ key, label, icon: Icon, isLink }) => (
            <button
              key={key}
              className={`pvd-tab${activeTab === key ? " on" : ""}`}
              onClick={() => isLink ? navigate(`/containers/${container.id}/documents`) : setActiveTab(key)}
            >
              <Icon size={14} style={{ marginRight: 7 }} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "36px clamp(24px,5vw,48px) 64px", maxWidth: 1100 }}>

          {/* GROUPAGES */}
          {activeTab === "groupages" && (
            groupages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#6E7F87", fontFamily: MONO, fontSize: 12 }}>
                No groupages recorded for this container.
              </div>
            ) : (
              <>
                <div style={{
                  display: "grid", gridTemplateColumns: "2fr 2fr 1.2fr 150px 90px",
                  padding: "11px 20px", background: "#E2DCCB",
                  border: "1px solid rgba(11,42,61,0.18)", borderBottom: "none",
                  borderRadius: "10px 10px 0 0",
                  fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#6E7F87",
                }}>
                  <span>Supplier</span><span>Client</span><span>Reference</span><span>Delivery</span><span>Docs</span>
                </div>
                <div style={{ border: "1px solid rgba(11,42,61,0.18)", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
                  {groupages.map((g, i) => {
                    const saving = savingIdx === i;
                    const docCount = g.documents?.length ?? 0;
                    return (
                      <div
                        key={i}
                        className="pvd-row"
                        onClick={() => navigate(`/containers/${container.id}/documents?g=${i}`)}
                        title="View this groupage's documents"
                        style={{
                          display: "grid", gridTemplateColumns: "2fr 2fr 1.2fr 150px 90px",
                          padding: "15px 20px", alignItems: "center", background: "#ECE7DA",
                          borderBottom: i < groupages.length - 1 ? "1px solid rgba(11,42,61,0.1)" : "none",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(11,42,61,0.06)", color: "#0B2A3D", flexShrink: 0 }}>
                            <Package size={13} />
                          </div>
                          <span style={{ fontFamily: MONO, fontSize: "0.8rem", fontWeight: 500, color: "#0B2A3D" }}>{g.supplier}</span>
                        </div>
                        <span style={{ fontSize: "0.8rem", color: "#6E7F87" }}>{g.client || "—"}</span>
                        <span style={{ fontFamily: MONO, fontSize: "0.75rem", color: "#6E7F87", letterSpacing: "0.04em" }}>{g.reference || g.vente || g.achat || "—"}</span>

                        {/* Delivery status — editable, options only (Pending / Delivered).
                            stopPropagation so picking a status doesn't also navigate. */}
                        <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {g.delivered ? <CheckCircle size={13} color="#3B6D11" /> : <Clock size={13} color="#854F0B" />}
                          <select
                            value={g.delivered ? "delivered" : "pending"}
                            disabled={saving}
                            onChange={e => handleDeliveryChange(i, e.target.value === "delivered")}
                            className="pvd-delivery-select"
                            style={{
                              fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase",
                              padding: "5px 10px", borderRadius: 20, fontWeight: 600, width: "fit-content",
                              background: g.delivered ? "#EAF3DE" : "#FAEEDA", color: g.delivered ? "#3B6D11" : "#854F0B",
                              border: "none", cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1,
                            }}
                            aria-label={`Delivery status for ${g.supplier}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </div>

                        {/* Docs affordance */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#6E7F87" }}>
                          <FileText size={13} />
                          <span style={{ fontFamily: MONO, fontSize: "0.68rem" }}>{docCount}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )
          )}

          {/* TIMELINE */}
          {activeTab === "timeline" && (
            <>
              <p style={{ fontFamily: MONO, fontSize: "0.66rem", letterSpacing: "0.08em", color: "#6E7F87", marginBottom: 14 }}>
                Click a step to make it the current stage — everything before it is marked done. Set a date on any step too.
              </p>
              <div style={{ display: "flex", flexDirection: "column", border: "1px solid rgba(11,42,61,0.18)", borderRadius: 10, overflow: "hidden", opacity: savingTimeline ? 0.7 : 1 }}>
                {(container.timeline?.length ? container.timeline : DEFAULT_TIMELINE).map((step, i, arr) => {
                  const isLast     = i === arr.length - 1;
                  const dotColor   = step.done ? "#2F7E6C" : step.current ? "#854F0B" : "#D3D1C7";
                  const lineColor  = step.done ? "#2F7E6C" : "#e0ddd4";
                  const dim        = !step.done && !step.current;
                  return (
                    <div
                      key={i}
                      onClick={() => !savingTimeline && handleTimelineAdvance(i)}
                      className="pvd-timeline-row"
                      style={{ display: "flex", borderBottom: isLast ? "none" : "1px solid rgba(11,42,61,0.1)", cursor: savingTimeline ? "default" : "pointer" }}
                    >
                      <div style={{ width: 60, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0", background: "#E2DCCB", borderRight: "1px solid rgba(11,42,61,0.12)", position: "relative" }}>
                        <div style={{ width: 14, height: 14, borderRadius: "50%", flexShrink: 0, zIndex: 1, background: dotColor, boxShadow: step.current ? `0 0 0 4px ${dotColor}25` : "none" }} />
                        {!isLast && <div style={{ position: "absolute", top: 34, bottom: 0, left: "50%", width: 1, transform: "translateX(-50%)", background: lineColor }} />}
                      </div>
                      <div style={{ flex: 1, padding: "18px 24px", background: "#ECE7DA", opacity: dim ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontFamily: MONO, fontSize: "0.82rem", fontWeight: 600, color: "#0B2A3D", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                            {step.done    && <CheckCircle  size={14} color="#2F7E6C" />}
                            {step.current && <ClipboardList size={14} color="#854F0B" />}
                            {step.step}
                            {step.current && (
                              <span style={{ fontFamily: MONO, fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 20, fontWeight: 600, background: "#FAEEDA", color: "#854F0B" }}>
                                Current
                              </span>
                            )}
                          </div>
                          <div style={{ fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.08em", color: "#6E7F87" }}>
                            {step.date ? formatDate(step.date) : "Date TBD"}
                          </div>
                        </div>
                        <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <CalendarClock size={13} color="#6E7F87" />
                          <input
                            type="date"
                            value={toInputDate(step.date)}
                            disabled={savingTimeline}
                            onChange={e => handleTimelineDateChange(i, e.target.value)}
                            className="pvd-date-input"
                            style={{
                              fontFamily: MONO, fontSize: "0.7rem", color: "#0B2A3D",
                              border: "1px solid rgba(11,42,61,0.18)", borderRadius: 6,
                              padding: "5px 8px", background: "#fff", cursor: savingTimeline ? "default" : "pointer",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}

const CSS = `
.pvd-back {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: 'IBM Plex Mono', monospace; font-size: 0.65rem;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: #9DB5C0; background: none; border: none; cursor: pointer;
  margin-bottom: 22px; padding: 0; transition: color .15s;
}
.pvd-back:hover { color: #DCE6EA; }
.pvd-tab {
  display: flex; align-items: center;
  font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem;
  letter-spacing: 0.14em; text-transform: uppercase; color: #6E7F87;
  background: none; border: none; border-bottom: 2px solid transparent;
  cursor: pointer; padding: 14px 4px 13px; margin-right: 28px;
  transition: color .15s, border-color .15s;
}
.pvd-tab:hover { color: #0B2A3D; }
.pvd-tab.on { color: #0B2A3D; border-bottom-color: #0B2A3D; }
.pvd-row { transition: background .15s; }
.pvd-row:hover { background: #E8E3D5 !important; }
.pvd-docbtn { transition: background .15s; }
.pvd-docbtn:hover { background: #E2DCCB; }
.pvd-delivery-select { -webkit-appearance: none; appearance: none; }
.pvd-delivery-select:focus { outline: 2px solid rgba(11,42,61,0.3); outline-offset: 1px; }
.pvd-timeline-row:hover { background: #E8E3D5; }
.pvd-timeline-row:hover > div:last-child { background: #E8E3D5 !important; }
.pvd-date-input:focus { outline: 2px solid rgba(11,42,61,0.3); outline-offset: 1px; }
`;
