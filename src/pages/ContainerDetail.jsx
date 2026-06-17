import { useParams, useNavigate } from "react-router-dom";
import { containers } from "../data/mockData";
import { useState } from "react";
import {
  ArrowLeft, AlertCircle, AlertTriangle, Package, FileText,
  Receipt, FileCheck2, CheckCircle, Clock, ClipboardList,
} from "lucide-react";

/* ── Google Fonts ── */
if (typeof document !== "undefined" && !document.getElementById("pvd-gf")) {
  const l = document.createElement("link");
  l.id = "pvd-gf"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap";
  document.head.appendChild(l);
}

const statusConfig = {
  in_transit:    { label: "In transit",    color: "#185FA5", bg: "#E6F1FB" },
  customs:       { label: "In customs",    color: "#854F0B", bg: "#FAEEDA" },
  arriving_soon: { label: "Arriving soon", color: "#3B6D11", bg: "#EAF3DE" },
  delivered:     { label: "Delivered",     color: "#444441", bg: "#F1EFE8" },
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function formatDateShort(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/* ── Isometric container illustration ── */
function ContainerIllustration({ carrier, number, accentColor }) {
  return (
    <svg viewBox="0 0 320 200" width="100%" height="auto" style={{ display: "block", maxWidth: 320 }} aria-hidden="true">
      <polygon points="40,80 200,20 320,80 200,135" fill="#1a4a6e" />
      <polygon points="40,80 40,165 200,210 200,135" fill="#0d2e46" />
      <polygon points="320,80 320,165 200,210 200,135" fill="#163d5c" />
      <line x1="40" y1="105" x2="200" y2="163" stroke="#0a2030" strokeWidth="1.2" />
      <line x1="40" y1="128" x2="200" y2="185" stroke="#0a2030" strokeWidth="1.2" />
      <line x1="40" y1="150" x2="200" y2="200" stroke="#0a2030" strokeWidth="1.2" />
      <line x1="320" y1="105" x2="200" y2="163" stroke="#0e2d43" strokeWidth="1.2" />
      <line x1="320" y1="128" x2="200" y2="185" stroke="#0e2d43" strokeWidth="1.2" />
      <line x1="120" y1="53" x2="120" y2="107" stroke="#0f304a" strokeWidth="1" />
      <line x1="200" y1="20" x2="200" y2="135" stroke="#0f304a" strokeWidth="1" />
      <line x1="280" y1="53" x2="280" y2="107" stroke="#0f304a" strokeWidth="1" />
      <line x1="270" y1="87" x2="270" y2="168" stroke="#0d2535" strokeWidth="2" />
      <line x1="270" y1="125" x2="320" y2="110" stroke="#0d2535" strokeWidth="1.2" />
      <text x="175" y="65" textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="9" letterSpacing="4" fill="#4a8ab5" opacity="0.9">
        {carrier?.toUpperCase()}
      </text>
      <rect x="80" y="78" width="80" height="8" fill="#E87722" opacity="0.85" />
      <text x="120" y="145" textAnchor="middle" fontFamily="IBM Plex Mono" fontWeight="700" fontSize="11" letterSpacing="2" fill="#3a7ab0">
        {number}
      </text>
      <ellipse cx="180" cy="208" rx="130" ry="12" fill="#082030" opacity="0.35" />
      <circle cx="52" cy="82" r="5" fill={accentColor} opacity="0.9" />
      <circle cx="52" cy="82" r="5" fill="none" stroke={accentColor} strokeWidth="1.5" opacity="0.4">
        <animate attributeName="r" values="5;11;5" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0;0.4" dur="2.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/* ── Background watermark containers ── */
function HeroWatermark() {
  return (
    <svg style={{ position: "absolute", right: 0, bottom: 0, opacity: 0.07, pointerEvents: "none" }} viewBox="0 0 500 300" width="500" height="300" aria-hidden="true">
      <g transform="translate(60,60)">
        <polygon points="0,30 120,-20 240,30 120,80" fill="#DCE6EA" />
        <polygon points="0,30 0,130 120,160 120,80" fill="#6F8B9C" />
        <polygon points="240,30 240,130 120,160 120,80" fill="#9DB5C0" />
        <line x1="0" y1="65" x2="120" y2="120" stroke="#0B2A3D" strokeWidth="1.5" />
        <line x1="0" y1="100" x2="120" y2="143" stroke="#0B2A3D" strokeWidth="1.5" />
        <line x1="240" y1="65" x2="120" y2="120" stroke="#0B2A3D" strokeWidth="1.5" />
        <line x1="180" y1="55" x2="180" y2="147" stroke="#0B2A3D" strokeWidth="2" />
        <line x1="180" y1="105" x2="240" y2="88" stroke="#0B2A3D" strokeWidth="1.2" />
      </g>
      <g transform="translate(200,20)">
        <polygon points="0,30 120,-20 240,30 120,80" fill="#DCE6EA" />
        <polygon points="0,30 0,120 120,150 120,80" fill="#6F8B9C" />
        <polygon points="240,30 240,120 120,150 120,80" fill="#9DB5C0" />
        <line x1="0" y1="62" x2="120" y2="110" stroke="#0B2A3D" strokeWidth="1.5" />
        <line x1="180" y1="52" x2="180" y2="137" stroke="#0B2A3D" strokeWidth="2" />
      </g>
    </svg>
  );
}

/* ── Mock groupage / document data ── */
const MOCK_GROUPAGES = [
  { supplier: "Samsung Display", client: "MediaTech GmbH", reference: "REF-2025-0441", delivered: true },
  { supplier: "LG Chem Ltd",     client: "Volker Industries", reference: "REF-2025-0442", delivered: false },
  { supplier: "Hyundai Steel",   client: "Rheinmetall AG",   reference: "REF-2025-0443", delivered: false },
];

const MOCK_DOCS = [
  { name: "Bill of Lading",        Icon: FileText,     available: false },
  { name: "Packing List",          Icon: FileText,     available: true },
  { name: "Commercial Invoice",    Icon: Receipt,       available: true },
  { name: "Customs Declaration",   Icon: FileCheck2,    available: false },
];

export default function ContainerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("groupages");

  const container = containers.find(c => c.id === id);

  if (!container) {
    return (
      <div style={NOT_FOUND_WRAP}>
        <p style={{ fontSize: 16 }}>Container not found.</p>
        <button onClick={() => navigate("/containers")} style={NOT_FOUND_BTN}>
          Back to containers
        </button>
      </div>
    );
  }

  const cfg = statusConfig[container.status] || statusConfig.in_transit;
  const accentHex = container.needsAttention ? "#D6492F" : cfg.color;
  const groupages = container.groupages?.length ? MOCK_GROUPAGES.slice(0, container.groupages.length) : MOCK_GROUPAGES;

  const tabs = [
    { key: "groupages", label: "Groupages" },
    { key: "timeline",  label: "Timeline" },
    { key: "documents", label: "Documents" },
  ];

  const statusStripCells = [
    { val: cfg.label, label: "Current status", color: cfg.color },
    { val: container.needsAttention ? "Yes" : "No", label: "Needs attention", color: container.needsAttention ? "#D6492F" : "#2F7E6C" },
    { val: container.groupages.length, label: "Groupages", color: "#2F7E6C" },
    { val: formatDateShort(container.eta), label: "ETA", color: "#2F7E6C" },
    { val: `${container.origin} → ${container.destination}`, label: "Route", color: "#0B2A3D" },
  ];

  return (
    <div style={ROOT}>
      <style>{CSS}</style>

      {/* ── Hero ── */}
      <div style={HERO}>
        <HeroWatermark />
        <div style={HERO_GRID}>
          <div style={HERO_LEFT}>
            <button className="pvd-back" onClick={() => navigate(-1)}>
              <ArrowLeft size={13} aria-hidden="true" /> Containers
            </button>
            <p style={EYEBROW}>Container detail · {container.carrier}</p>
            <h1 style={HERO_NUM}>{container.number}</h1>
            <p style={HERO_ROUTE}>
              <b style={ROUTE_B}>{container.origin}</b>
              <span style={{ opacity: 0.5, margin: "0 6px" }}>→</span>
              <b style={ROUTE_B}>{container.destination}</b>
              <span style={{ opacity: 0.35, margin: "0 10px" }}>·</span>
              ETA <b style={ROUTE_B}>{formatDate(container.eta)}</b>
            </p>
            {container.needsAttention && (
              <div style={ATTN_BAR}>
                <AlertCircle size={14} aria-hidden="true" />
                {container.attentionReason}
              </div>
            )}
          </div>
          <div style={HERO_RIGHT}>
            <ContainerIllustration carrier={container.carrier} number={container.number} accentColor={accentHex} />
          </div>
        </div>
      </div>

      {/* ── Status strip ── */}
      <div style={STATUS_STRIP}>
        {statusStripCells.map(({ val, label, color }, i) => (
          <div key={label} style={{ ...SS_CELL, borderLeftColor: color, borderRight: i === statusStripCells.length - 1 ? "none" : STATUS_STRIP_BORDER }}>
            <div style={{ ...SS_VAL, color }}>{val}</div>
            <div style={SS_LBL}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={TABS_ROW}>
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            className={`pvd-tab${activeTab === key ? " on" : ""}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Body ── */}
      <div style={BODY}>

        {/* GROUPAGES */}
        {activeTab === "groupages" && (
          <>
            <div style={TABLE_HEAD}>
              <span>Supplier</span><span>Client</span><span>Reference</span><span>Delivery</span>
            </div>
            <div style={TABLE_BODY_WRAP}>
              {groupages.map((g, i) => (
                <div key={i} className="pvd-row" style={{ ...TABLE_ROW, borderBottom: i < groupages.length - 1 ? "1px solid rgba(11,42,61,0.1)" : "none" }}>
                  <div style={SUPPLIER_CHIP}>
                    <div style={SUPPLIER_ICON}><Package size={13} /></div>
                    <span style={CELL_MAIN}>{g.supplier}</span>
                  </div>
                  <span style={CELL_MUTED}>{g.client}</span>
                  <span style={CELL_REF}>{g.reference}</span>
                  <span style={{ ...STATUS_CHIP, background: g.delivered ? "#EAF3DE" : "#FAEEDA", color: g.delivered ? "#3B6D11" : "#854F0B" }}>
                    {g.delivered ? <CheckCircle size={11} /> : <Clock size={11} />}
                    {g.delivered ? "Delivered" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* TIMELINE */}
        {activeTab === "timeline" && (
          <div style={TIMELINE_WRAP}>
            {(container.timeline || DEFAULT_TIMELINE).map((step, i, arr) => {
              const isLast = i === arr.length - 1;
              const dotColor = step.done ? "#2F7E6C" : step.current ? "#854F0B" : "#D3D1C7";
              const lineColor = step.done ? "#2F7E6C" : "#e0ddd4";
              const dim = !step.done && !step.current;
              return (
                <div key={i} style={{ ...TL_ITEM, borderBottom: isLast ? "none" : "1px solid rgba(11,42,61,0.1)" }}>
                  <div style={TL_MARKER}>
                    <div style={{ ...TL_DOT, background: dotColor }} />
                    {!isLast && <div style={{ ...TL_LINE, background: lineColor }} />}
                  </div>
                  <div style={{ ...TL_CONTENT, opacity: dim ? 0.5 : 1 }}>
                    <div style={TL_STEP}>
                      {step.done && <CheckCircle size={14} color="#2F7E6C" aria-hidden="true" />}
                      {step.current && <ClipboardList size={14} color="#854F0B" aria-hidden="true" />}
                      {step.step}
                      {step.current && <span style={TL_BADGE}>Current</span>}
                    </div>
                    <div style={TL_DATE}>{step.date ? formatDate(step.date) : "Date TBD"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* DOCUMENTS */}
        {activeTab === "documents" && (
          <div style={DOC_LIST}>
            {MOCK_DOCS.map(({ name, Icon, available }, i, arr) => (
              <div key={name} className="pvd-row" style={{ ...DOC_ROW, borderBottom: i < arr.length - 1 ? "1px solid rgba(11,42,61,0.1)" : "none" }}>
                <div style={{ ...DOC_ICON, color: available ? "#2F7E6C" : "#D6492F", borderColor: available ? "rgba(47,126,108,0.3)" : "rgba(214,73,47,0.3)" }}>
                  <Icon size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={DOC_NAME}>{name}</div>
                  <div style={DOC_SUB}>{available ? "Document available" : "Missing — action required"}</div>
                </div>
                {available ? (
                  <button className="pvd-docbtn" style={DOC_BTN}>View →</button>
                ) : (
                  <span style={DOC_MISSING}>Missing</span>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

const DEFAULT_TIMELINE = [
  { step: "Departed origin port", date: null, done: true },
  { step: "In transit",           date: null, current: true },
  { step: "Arrived destination",  date: null, done: false },
];

/* ── Inline style objects ── */
const ROOT = { fontFamily: "'IBM Plex Sans', sans-serif", background: "#ECE7DA", color: "#1C2B33", minHeight: "100vh" };
const HERO = { background: "#0B2A3D", position: "relative", overflow: "hidden", padding: "0 clamp(24px,5vw,48px)", minHeight: 280, display: "flex", flexDirection: "column", justifyContent: "flex-end" };
const HERO_GRID = { display: "flex", alignItems: "flex-end", gap: 0, width: "100%", position: "relative", zIndex: 2 };
const HERO_LEFT = { flex: 1, padding: "40px 0 36px", minWidth: 0 };
const HERO_RIGHT = { width: 320, flexShrink: 0, display: "flex", alignItems: "flex-end", justifyContent: "center" };
const EYEBROW = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#6F8B9C", margin: "0 0 10px" };
const HERO_NUM = { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "clamp(2rem,4vw,3.2rem)", letterSpacing: "-0.02em", color: "#DCE6EA", lineHeight: 1, margin: "0 0 12px" };
const HERO_ROUTE = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.78rem", letterSpacing: "0.06em", color: "#6F8B9C", margin: "0 0 20px" };
const ROUTE_B = { color: "#DCE6EA", fontWeight: 500 };
const ATTN_BAR = { display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(214,73,47,0.12)", border: "1px solid rgba(214,73,47,0.25)", padding: "7px 14px", color: "#D6492F", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase" };
const STATUS_STRIP_BORDER = "1px solid rgba(11,42,61,0.12)";
const STATUS_STRIP = { display: "flex", flexWrap: "wrap", borderBottom: "1px solid rgba(11,42,61,0.18)" };
const SS_CELL = { flex: "1 1 140px", padding: "16px 28px", borderLeft: "3px solid", background: "#E2DCCB" };
const SS_VAL = { fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: "1.05rem", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const SS_LBL = { marginTop: 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#6E7F87" };
const TABS_ROW = { display: "flex", borderBottom: "1px solid rgba(11,42,61,0.18)", background: "#ECE7DA", padding: "0 clamp(24px,5vw,48px)" };
const BODY = { padding: "36px clamp(24px,5vw,48px) 64px" };
const TABLE_HEAD = { display: "grid", gridTemplateColumns: "2fr 2fr 1.2fr 110px", padding: "10px 20px", background: "#E2DCCB", border: "1px solid rgba(11,42,61,0.18)", borderBottom: "none", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#6E7F87" };
const TABLE_BODY_WRAP = { border: "1px solid rgba(11,42,61,0.18)" };
const TABLE_ROW = { display: "grid", gridTemplateColumns: "2fr 2fr 1.2fr 110px", padding: "14px 20px", alignItems: "center", background: "#ECE7DA" };
const SUPPLIER_CHIP = { display: "inline-flex", alignItems: "center", gap: 8 };
const SUPPLIER_ICON = { width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(11,42,61,0.18)", color: "#0B2A3D", flexShrink: 0 };
const CELL_MAIN = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.8rem", fontWeight: 500, color: "#0B2A3D" };
const CELL_MUTED = { fontSize: "0.8rem", color: "#6E7F87" };
const CELL_REF = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem", color: "#6E7F87", letterSpacing: "0.04em" };
const STATUS_CHIP = { display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 9px", fontWeight: 600, width: "fit-content" };
const TIMELINE_WRAP = { display: "flex", flexDirection: "column", border: "1px solid rgba(11,42,61,0.18)" };
const TL_ITEM = { display: "flex" };
const TL_MARKER = { width: 60, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0", background: "#E2DCCB", borderRight: "1px solid rgba(11,42,61,0.12)", position: "relative" };
const TL_DOT = { width: 14, height: 14, borderRadius: "50%", flexShrink: 0, zIndex: 1 };
const TL_LINE = { position: "absolute", top: 34, bottom: 0, left: "50%", width: 1, transform: "translateX(-50%)" };
const TL_CONTENT = { flex: 1, padding: "18px 24px", background: "#ECE7DA" };
const TL_STEP = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.8rem", fontWeight: 600, color: "#0B2A3D", marginBottom: 3, display: "flex", alignItems: "center", gap: 8 };
const TL_DATE = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", letterSpacing: "0.08em", color: "#6E7F87" };
const TL_BADGE = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", fontWeight: 600, background: "#FAEEDA", color: "#854F0B" };
const DOC_LIST = { border: "1px solid rgba(11,42,61,0.18)" };
const DOC_ROW = { display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: "#ECE7DA" };
const DOC_ICON = { width: 40, height: 40, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid" };
const DOC_NAME = { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "0.95rem", color: "#0B2A3D", marginBottom: 2 };
const DOC_SUB = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.08em", color: "#6E7F87" };
const DOC_BTN = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "7px 14px", background: "none", border: "1px solid rgba(11,42,61,0.22)", cursor: "pointer", color: "#0B2A3D" };
const DOC_MISSING = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "5px 10px", background: "#F8DDD5", color: "#D6492F", fontWeight: 700 };
const NOT_FOUND_WRAP = { textAlign: "center", paddingTop: 80, color: "#6E7F87", fontFamily: "'IBM Plex Sans', sans-serif" };
const NOT_FOUND_BTN = { marginTop: 16, padding: "8px 20px", border: "1px solid rgba(11,42,61,0.22)", background: "#fff", cursor: "pointer", fontSize: 13 };

/* ── CSS for hover states (can't do inline) ── */
const CSS = `
.pvd-back {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: 'IBM Plex Mono', monospace; font-size: 0.65rem;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: #6F8B9C; background: none; border: none; cursor: pointer;
  margin-bottom: 20px; padding: 0; transition: color .15s;
}
.pvd-back:hover { color: #DCE6EA; }
.pvd-tab {
  font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem;
  letter-spacing: 0.14em; text-transform: uppercase; color: #6E7F87;
  background: none; border: none; border-bottom: 2px solid transparent;
  cursor: pointer; padding: 14px 4px 13px; margin-right: 28px;
  transition: color .15s, border-color .15s;
}
.pvd-tab:hover { color: #0B2A3D; }
.pvd-tab.on { color: #0B2A3D; border-bottom-color: #0B2A3D; }
.pvd-row:hover { background: #E8E3D5 !important; }
.pvd-docbtn:hover { background: #E2DCCB; }
@media (max-width: 720px) {
  .pvd-hero-grid { flex-direction: column; }
}
`;
