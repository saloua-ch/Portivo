import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as storage from "../api/storage";
import { useLanguage } from "../context/LanguageContext";
import ContainerVisual3D from "../components/ContainerVisual3D";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import {
  ArrowLeft,
  AlertCircle,
  Package,
  FileText,
  CheckCircle,
  Clock,
  ClipboardList,
  Trash2,
  MapPin,
  Calendar,
  Layers,
  User,
  Ship,
  Anchor,
  Navigation,
  PackageCheck,
} from "lucide-react";

/* ── Google Fonts Loader ── */
if (typeof document !== "undefined" && !document.getElementById("pvd-gf")) {
  const l = document.createElement("link");
  l.id = "pvd-gf";
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap";
  document.head.appendChild(l);
}

const MONO = "'IBM Plex Mono', monospace";

/* ── Timeline: 4 physical container steps ──
   1. departed    — Départ du port d'origine
   2. in_transit  — En transit (no date field)
   3. arrived     — Arrivée au port de destination
   4. unloaded    — Date de dépotage
   This timeline tracks the CONTAINER only. It is intentionally decoupled
   from groupage delivery status (see handleDeliveryChange) — one groupage
   being delivered does not affect other groupages, and does not imply the
   container itself has arrived or been unloaded. */
const STEP_CODE_KEYS = {
  departed: "containerDetail.defaultStepDeparted",
  in_transit: "containerDetail.defaultStepInTransit",
  arrived: "containerDetail.defaultStepArrived",
  unloaded: "containerDetail.defaultStepUnloaded", // Date de dépotage
};

const STEP_ICONS = {
  departed: Ship,
  in_transit: Navigation,
  arrived: Anchor,
  unloaded: PackageCheck,
};

function getStatusConfig(t) {
  return {
    in_transit: {
      label: t("containers.inTransit"),
      color: "#185FA5",
      bg: "#E6F1FB",
      accent: "#185FA5",
    },
    customs: {
      label: t("containers.customs"),
      color: "#854F0B",
      bg: "#FAEEDA",
      accent: "#C9912B",
    },
    arriving_soon: {
      label: t("containers.arrivingSoon"),
      color: "#3B6D11",
      bg: "#EAF3DE",
      accent: "#2F7E6C",
    },
    delivered: {
      label: t("containers.delivered"),
      color: "#444441",
      bg: "#F1EFE8",
      accent: "#6E7F87",
    },
  };
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateShort(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function toInputDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

function normalizeTimeline(existingTimeline = []) {
  const cleaned = Array.isArray(existingTimeline) ? existingTimeline : [];
  const requiredSteps = ["departed", "in_transit", "arrived", "unloaded"];

  return requiredSteps.map((stepKey, index) => {
    const existing = cleaned.find((item) => item.step === stepKey);
    if (existing) return existing;

    return {
      step: stepKey,
      date: null,
      done: index === 0,
      current: index === 1,
    };
  });
}

function stepLabel(stepKey, t) {
  const translationKey = STEP_CODE_KEYS[stepKey];
  if (translationKey && typeof t === "function") {
    const translated = t(translationKey);
    if (translated && translated !== translationKey) return translated;
  }

  switch (stepKey) {
    case "departed":
      return "Départ du port d'origine";
    case "in_transit":
      return "En transit";
    case "arrived":
      return "Arrivée au port de destination";
    case "unloaded":
      return "Date de dépotage";
    default:
      return stepKey;
  }
}

function getDefaultTimeline(t) {
  return [
    { step: "departed", date: null, done: true },
    { step: "in_transit", date: null, current: true },
    { step: "arrived", date: null, done: false },
    { step: "unloaded", date: null, done: false }, // Date de dépotage
  ];
}

// Updated grid track template for wide, breathing columns
const TABLE_GRID_COLUMNS =
  "170px 190px 150px 160px 130px 135px 135px 105px 105px 105px 120px 120px 210px 100px";

/* ── Journey illustration ──
   A small animated scene: origin port (crane) → open sea (ship carrying
   the groupages) → destination port → warehouse ("magasin"). The ship's
   position and the warehouse's highlight animate based on which step is
   current, so the drawing tells the same story as the timeline below it. */
function ContainerJourneyIllustration({ timeline }) {
  const currentIdx = timeline.findIndex((s) => s.current);
  const lastDoneIdx = timeline.reduce(
    (acc, s, i) => (s.done ? i : acc),
    -1
  );
  const activeIdx = currentIdx !== -1 ? currentIdx : Math.max(lastDoneIdx, 0);

  const SHIP_X = [30, 300, 560, 560];
  const shipX = SHIP_X[activeIdx] ?? SHIP_X[0];
  const craneActive = activeIdx === 0;
  const atSea = activeIdx === 1;
  const unloading = activeIdx === 3;

  return (
    <svg
      viewBox="0 0 800 200"
      style={{ width: "100%", height: "auto", display: "block" }}
      role="img"
      aria-label="Container journey illustration"
    >
      <rect x="0" y="0" width="800" height="200" fill="#F3EFE7" />

      {/* sea band */}
      <rect x="0" y="132" width="800" height="52" fill="#D3E7E0" />
      <g style={{ opacity: 0.55 }}>
        <path
          className="pvd-wave"
          d="M-100 142 Q -50 137 0 142 T 100 142 T 200 142 T 300 142 T 400 142 T 500 142 T 600 142 T 700 142 T 800 142 T 900 142"
          stroke="#9AC4B7"
          strokeWidth="2"
          fill="none"
        />
        <path
          className="pvd-wave"
          style={{ animationDelay: "-2.4s", animationDuration: "8s" }}
          d="M-100 154 Q -50 149 0 154 T 100 154 T 200 154 T 300 154 T 400 154 T 500 154 T 600 154 T 700 154 T 800 154 T 900 154"
          stroke="#B5D8CE"
          strokeWidth="2"
          fill="none"
        />
      </g>

      {/* origin port */}
      <g>
        <rect x="0" y="122" width="86" height="14" fill="#0B2A3D" />
        <rect x="18" y="34" width="5" height="88" fill="#304B58" />
        <rect x="18" y="34" width="52" height="5" fill="#304B58" />
        <rect
          x="55"
          y="39"
          width="3"
          height={craneActive ? "34" : "16"}
          fill="#C9912B"
          style={{ transition: "height .6s ease" }}
        />
        {craneActive && (
          <rect
            x="48"
            y="72"
            width="17"
            height="13"
            rx="2"
            fill="#D6492F"
            style={{ transition: "opacity .4s ease" }}
          />
        )}
        <text
          x="6"
          y="196"
          fontFamily="'IBM Plex Mono', monospace"
          fontSize="9"
          fill="#8A9AA3"
          letterSpacing="0.08em"
        >
          ORIGINE
        </text>
      </g>

      {/* destination port + warehouse */}
      <g>
        <rect x="700" y="122" width="100" height="14" fill="#0B2A3D" />
        <polygon
          points="712,66 752,42 792,66"
          fill={unloading ? "#245F52" : "#B7C2C6"}
          style={{ transition: "fill .5s ease" }}
        />
        <rect
          x="717"
          y="66"
          width="70"
          height="56"
          fill={unloading ? "#2F7E6C" : "#C7CDC9"}
          style={{ transition: "fill .5s ease" }}
        />
        <rect x="742" y="94" width="20" height="28" fill="#F3EFE7" />
        {unloading && (
          <rect x="746" y="108" width="4" height="14" fill="#854F0B" />
        )}
        <text
          x="716"
          y="196"
          fontFamily="'IBM Plex Mono', monospace"
          fontSize="9"
          fill="#8A9AA3"
          letterSpacing="0.08em"
        >
          MAGASIN
        </text>
      </g>

      {/* ship, slides between the four stage positions */}
      <g
        style={{
          transform: `translateX(${shipX}px)`,
          transition: "transform .9s cubic-bezier(.4,0,.2,1)",
        }}
      >
        <path d="M0 142 L112 142 L101 158 L11 158 Z" fill="#0B2A3D" />
        <rect x="10" y="120" width="21" height="19" fill="#D6492F" />
        <rect x="33" y="120" width="21" height="19" fill="#C9912B" />
        <rect x="56" y="120" width="21" height="19" fill="#2F7E6C" />
        <rect x="10" y="99" width="21" height="18" fill="#185FA5" />
        <rect x="33" y="99" width="21" height="18" fill="#D6492F" />
        {atSea && (
          <>
            <circle
              className="pvd-ship-wake"
              cx="-8"
              cy="153"
              r="3"
              fill="#9AC4B7"
            />
            <circle
              className="pvd-ship-wake"
              cx="-18"
              cy="150"
              r="2"
              fill="#9AC4B7"
              style={{ animationDelay: "-0.6s" }}
            />
          </>
        )}
      </g>

      {/* stage markers along the water */}
      {SHIP_X.map((x, i) => (
        <circle
          key={i}
          cx={x + 56}
          cy={172}
          r={i <= activeIdx ? 4 : 3}
          fill={i <= activeIdx ? "#2F7E6C" : "rgba(11,42,61,.18)"}
          style={{ transition: "fill .4s ease" }}
        />
      ))}
    </svg>
  );
}

export default function ContainerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState("groupages");
  const [container, setContainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingIdx, setSavingIdx] = useState(null);
  const [savingTimeline, setSavingTimeline] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load(isInitial = false) {
      if (isInitial) setLoading(true);

      try {
        const data = await storage.getContainer(id);
        if (data) {
          data.timeline = normalizeTimeline(data.timeline);
          setContainer(data);
        }
      } catch (err) {
        console.error("Failed to load container data:", err);
      } finally {
        if (isInitial) setLoading(false);
      }
    }

    load(true);

    const unsubscribe = storage.onChange(() => load(false));
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [id, storage]);

  // Toggling one groupage's delivery status only ever touches that groupage.
  // It never cascades to other groupages, and never touches container.status
  // or the container timeline — a groupage being delivered doesn't mean the
  // container itself has arrived or been unloaded.
  async function handleDeliveryChange(index, delivered) {
    if (!container) return;
    const updatedGroupages = container.groupages.map((g, i) =>
      i === index ? { ...g, delivered } : g
    );

    setSavingIdx(index);
    try {
      await storage.updateContainer(container.id, {
        groupages: updatedGroupages,
      });
    } catch (err) {
      console.error("Failed to update delivery status", err);
      alert(t("containerDetail.errDeliverySave"));
    } finally {
      setSavingIdx(null);
    }
  }

  async function persistTimeline(patch) {
    if (!container) return;
    setSavingTimeline(true);
    try {
      await storage.updateContainer(container.id, patch);
    } catch (err) {
      console.error("Failed to update timeline", err);
      alert(t("containerDetail.errTimelineSave"));
    } finally {
      setSavingTimeline(false);
    }
  }

  // Advancing the timeline only ever touches the timeline itself — it no
  // longer marks groupages as delivered or changes container.status.
  function handleTimelineAdvance(index) {
    const base = container.timeline?.length
      ? container.timeline
      : getDefaultTimeline(t);
    const updated = base.map((step, i) => ({
      ...step,
      done: i < index,
      current: i === index,
    }));

    persistTimeline({ timeline: updated });
  }

  function handleTimelineDateChange(index, value) {
    const base = container.timeline?.length
      ? container.timeline
      : getDefaultTimeline(t);
    const updated = base.map((step, i) =>
      i === index ? { ...step, date: value || null } : step
    );
    persistTimeline({ timeline: updated });
  }

  async function handleDelete() {
    if (!container) return;
    if (
      !window.confirm(
        `${t("containerDetail.confirmDelete")} ${container.number}?`
      )
    )
      return;
    setDeleting(true);
    try {
      await storage.deleteContainer(container.id);
      navigate("/containers");
    } catch (err) {
      console.error("Failed to delete container", err);
      alert(t("containerDetail.errDeleteFailed"));
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <LoadingState label={t("containerDetail.loading")} />
      </div>
    );
  }

  if (!container) {
    return (
      <div
        style={{
          textAlign: "center",
          paddingTop: 80,
          color: "#6E7F87",
          fontFamily: "'IBM Plex Sans', sans-serif",
        }}
      >
        <p style={{ fontSize: 16 }}>{t("containerDetail.notFound")}</p>
        <button
          onClick={() => navigate("/containers")}
          style={{
            marginTop: 16,
            padding: "8px 20px",
            border: "1px solid rgba(11,42,61,0.22)",
            background: "#fff",
            cursor: "pointer",
            fontSize: 13,
            borderRadius: 6,
          }}
        >
          {t("containerDetail.backToContainers")}
        </button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(t);
  const cfg = statusConfig[container.status] || statusConfig.in_transit;
  const accentHex = container.needsAttention ? "#D6492F" : cfg.accent;
  const groupages = container.groupages?.length ? container.groupages : [];
  const timeline = container.timeline?.length
    ? container.timeline
    : getDefaultTimeline(t);

  const tabs = [
    { key: "groupages", label: t("containerDetail.tabGroupages"), icon: Layers },
    { key: "timeline", label: t("containerDetail.tabTimeline"), icon: Clock },
    {
      key: "documents",
      label: t("containerDetail.tabDocuments"),
      icon: FileText,
      isLink: true,
    },
  ];

  const statusStripCells = [
    {
      val: cfg.label,
      label: t("containerDetail.statusCurrent"),
      color: cfg.accent,
    },
    {
      val: container.needsAttention
        ? t("containerDetail.yes")
        : t("containerDetail.no"),
      label: t("containerDetail.statusAttention"),
      color: container.needsAttention ? "#D6492F" : "#2F7E6C",
    },
    {
      val: groupages.length,
      label: t("containerDetail.statusGroupages"),
      color: "#2F7E6C",
    },
    {
      val: formatDateShort(container.eta),
      label: t("containerDetail.statusEta"),
      color: "#C9912B",
    },
  ];

  return (
    <>
      <style>{`
        .pvd-back, .pvd-delete {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          font-family: ${MONO};
          font-size: 0.72rem;
          cursor: pointer;
          transition: background .15s ease;
        }
        .pvd-back {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: #DCE6EA;
        }
        .pvd-back:hover { background: rgba(255,255,255,0.18); }
        .pvd-delete {
          background: rgba(214,73,47,0.15);
          border: 1px solid rgba(214,73,47,0.3);
          color: #f0b8a8;
        }
        .pvd-delete:hover { background: rgba(214,73,47,0.28); }
        .pvd-tab {
          display: inline-flex;
          align-items: center;
          padding: 14px 20px;
          border: none;
          background: transparent;
          font-family: ${MONO};
          font-size: 0.75rem;
          color: #6E7F87;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all .15s ease;
        }
        .pvd-tab.on {
          color: #0B2A3D;
          border-bottom-color: #0B2A3D;
          font-weight: 600;
        }
        .pvd-groupage-row:hover {
          background: #EFEBE2 !important;
        }
        @keyframes pvd-wave-drift {
          from { transform: translateX(0); }
          to { transform: translateX(-100px); }
        }
        .pvd-wave {
          animation: pvd-wave-drift 6s linear infinite;
        }
        @keyframes pvd-wake-fade {
          0% { opacity: 0.7; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(-24px); }
        }
        .pvd-ship-wake {
          animation: pvd-wake-fade 1.6s ease-out infinite;
        }
        .pvd-timeline-progress-track {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: rgba(11,42,61,0.09);
          overflow: hidden;
          margin-bottom: 30px;
        }
        .pvd-timeline-progress-fill {
          height: 100%;
          border-radius: 3px;
          background: linear-gradient(90deg, #2F7E6C, #3B9B85);
          transition: width .5s ease;
        }
        .pvd-timeline-node {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 6px 10px 32px 6px;
          margin-left: -6px;
          border-radius: 10px;
          cursor: pointer;
          transition: background .15s ease;
        }
        .pvd-timeline-node:hover {
          background: rgba(11,42,61,0.035);
        }
        .pvd-timeline-node:last-child { padding-bottom: 6px; }
        .pvd-timeline-line {
          position: absolute;
          left: 25px;
          top: 46px;
          bottom: 0;
          width: 2px;
          background: rgba(11,42,61,0.15);
        }
        .pvd-timeline-node.done .pvd-timeline-line {
          background: #2F7E6C;
        }
        .pvd-timeline-node:last-child .pvd-timeline-line { display: none; }
        .pvd-timeline-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background .2s ease, color .2s ease, transform .2s ease, box-shadow .2s ease;
        }
        .pvd-timeline-node:hover .pvd-timeline-icon-wrap {
          transform: scale(1.08);
        }
        .pvd-timeline-node.current .pvd-timeline-icon-wrap {
          box-shadow: 0 0 0 4px rgba(201,145,43,0.18);
        }
        .pvd-timeline-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 20px;
          font-family: ${MONO};
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          flex-shrink: 0;
        }
        .pvd-timeline-date-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 9px;
          margin-top: 8px;
          border-radius: 7px;
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(11,42,61,0.14);
          width: fit-content;
        }
        .pvd-timeline-date-pill input[type="date"] {
          font-family: ${MONO};
          font-size: 0.7rem;
          border: none;
          background: transparent;
          color: #304B58;
          padding: 0;
          width: 108px;
        }
        .pvd-timeline-date-pill input[type="date"]:focus {
          outline: none;
        }
      `}</style>

      <div
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          background: "#ECE7DA",
          color: "#1C2B33",
          minHeight: "100vh",
        }}
      >
        {/* ── Hero ── */}
        <div
          style={{
            position: "relative",
            height: 480,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            background: "#0B2A3D",
          }}
        >
          <img
            loading="eager"
            fetchPriority="high"
            src="/images/container-detail.avif"
            alt="Shipping container close-up"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 40%",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(8,32,48,.1) 0%, rgba(8,32,48,.35) 50%, rgba(8,32,48,.94) 100%)",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 2,
              padding: "0 clamp(24px,5vw,48px) 36px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 22,
              }}
            >
              <button className="pvd-back" onClick={() => navigate(-1)}>
                <ArrowLeft size={13} aria-hidden="true" /> {t("nav.containers")}
              </button>
              <button
                className="pvd-delete"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 size={13} aria-hidden="true" />{" "}
                {deleting
                  ? t("containerDetail.deletingEllipsis")
                  : t("containerDetail.deleteContainer")}
              </button>
            </div>

            <p
              style={{
                fontFamily: MONO,
                fontSize: "0.68rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#9DB5C0",
                margin: "0 0 12px",
              }}
            >
              {t("containerDetail.eyebrowLabel")} · {container.carrier}
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 24,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h1
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontWeight: 600,
                    fontSize: "clamp(2.2rem,5vw,3.6rem)",
                    letterSpacing: "-0.02em",
                    color: "#DCE6EA",
                    lineHeight: 1,
                    margin: "0 0 14px",
                  }}
                >
                  {container.number}
                </h1>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      fontFamily: MONO,
                      fontSize: "0.78rem",
                      color: "#C7E0D8",
                    }}
                  >
                    <MapPin size={13} />
                    {container.origin} <span style={{ opacity: 0.5 }}>→</span>{" "}
                    {container.destination}
                  </span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      fontFamily: MONO,
                      fontSize: "0.78rem",
                      color: "#C7E0D8",
                    }}
                  >
                    <Calendar size={13} />
                    ETA {formatDate(container.eta)}
                  </span>
                  {container.agent && (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        fontFamily: MONO,
                        fontSize: "0.78rem",
                        color: "#C7E0D8",
                      }}
                    >
                      <User size={13} />
                      {container.agent}
                    </span>
                  )}
                  {container.metadata?.size && (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        fontFamily: MONO,
                        fontSize: "0.78rem",
                        color: "#C7E0D8",
                      }}
                    >
                      <Package size={13} />
                      {container.metadata.size}' {t("addEntry.containerSize")}
                    </span>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 16px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,.1)",
                  border: `1px solid ${accentHex}55`,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: accentHex,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: "0.72rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#DCE6EA",
                    fontWeight: 600,
                  }}
                >
                  {cfg.label}
                </span>
              </div>
            </div>

            {container.needsAttention && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 18,
                  background: "rgba(214,73,47,0.16)",
                  border: "1px solid rgba(214,73,47,0.35)",
                  padding: "8px 16px",
                  borderRadius: 8,
                  color: "#f0b8a8",
                  fontFamily: MONO,
                  fontSize: "0.7rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                <AlertCircle size={14} aria-hidden="true" />
                {container.attentionReason}
              </div>
            )}
          </div>
        </div>

        {/* ── Status Strip ── */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            borderBottom: "1px solid rgba(11,42,61,0.18)",
          }}
        >
          {statusStripCells.map(({ val, label, color }, i) => (
            <div
              key={label}
              style={{
                flex: "1 1 140px",
                padding: "18px 28px",
                borderLeft: `3px solid ${color}`,
                borderRight:
                  i === statusStripCells.length - 1
                    ? "none"
                    : "1px solid rgba(11,42,61,0.12)",
                background: "#E2DCCB",
              }}
            >
              <div
                style={{
                  fontFamily: MONO,
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  lineHeight: 1.2,
                  color,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {val}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontFamily: MONO,
                  fontSize: "0.6rem",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "#6E7F87",
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Detail Strip ── */}
        {(container.natureMarchandise && container.natureMarchandise !== "—") ||
        container.embarquementDate ||
        container.magasinageDate ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px 28px",
              padding: "16px clamp(24px,5vw,48px)",
              background: "#E6F1FB",
              borderBottom: "1px solid rgba(24,95,165,0.18)",
            }}
          >
            {container.natureMarchandise &&
              container.natureMarchandise !== "—" && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    fontFamily: MONO,
                    fontSize: "0.72rem",
                    color: "#0e4980",
                  }}
                >
                  <ClipboardList size={13} /> {t("addEntry.natureMarchandise")}:{" "}
                  {container.natureMarchandise}
                </span>
              )}
            {container.embarquementDate && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontFamily: MONO,
                  fontSize: "0.72rem",
                  color: "#0e4980",
                }}
              >
                <Calendar size={13} /> {t("addEntry.dateEmbarquement")}:{" "}
                {formatDate(container.embarquementDate)}
              </span>
            )}
            {container.magasinageDate && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontFamily: MONO,
                  fontSize: "0.72rem",
                  color: "#0e4980",
                }}
              >
                <Calendar size={13} /> {t("addEntry.dateMagasinage")}:{" "}
                {formatDate(container.magasinageDate)}
              </span>
            )}
          </div>
        ) : null}

        {/* ── Tabs ── */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid rgba(11,42,61,0.18)",
            background: "#ECE7DA",
            padding: "0 clamp(24px,5vw,48px)",
          }}
        >
          {tabs.map(({ key, label, icon: Icon, isLink }) => (
            <button
              key={key}
              className={`pvd-tab${activeTab === key ? " on" : ""}`}
              onClick={() =>
                isLink
                  ? navigate(`/containers/${container.id}/documents`)
                  : setActiveTab(key)
              }
            >
              <Icon size={14} style={{ marginRight: 7 }} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div
          style={{
            padding: "36px clamp(24px, 4vw, 56px) 64px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* ── GROUPAGES TAB ── */}
          {activeTab === "groupages" && (
            <>
              <div style={{ marginBottom: 30 }}>
                <p
                  style={{
                    fontFamily: MONO,
                    fontSize: "0.66rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#6E7F87",
                    margin: "0 0 12px",
                  }}
                >
                  {t("addEntry.loadingDiagramTitle")}
                </p>

                <div
                  style={{
                    width: "100%",
                    height: 230,
                    overflow: "hidden",
                    borderRadius: 10,
                    background: "#E8E2D4",
                    border: "1px solid rgba(11,42,61,0.10)",
                  }}
                >
                  <ContainerVisual3D
                    sizeFeet={container.metadata?.size || "20"}
                    groupages={groupages.map((g, i) => ({
                      ...g,
                      id: i,
                    }))}
                    t={t}
                  />
                </div>
              </div>

              {groupages.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title={t("containerDetail.noGroupages")}
                />
              ) : (
                <div style={{ width: "100%", minWidth: 0 }}>
                  <div
                    style={{
                      width: "100%",
                      overflowX: "auto",
                      overflowY: "hidden",
                      border: "1px solid rgba(11,42,61,0.16)",
                      borderRadius: 12,
                      background: "#F3EFE7",
                      boxShadow: "0 2px 10px rgba(11,42,61,0.035)",
                      WebkitOverflowScrolling: "touch",
                    }}
                  >
                    <div style={{ width: "max-content", minWidth: "100%" }}>
                      {/* Table Header */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: TABLE_GRID_COLUMNS,
                          minHeight: 64,
                          alignItems: "center",
                          background: "#E8E2D4",
                          borderBottom: "1px solid rgba(11,42,61,0.14)",
                          padding: "0 18px",
                          boxSizing: "border-box",
                          fontFamily: MONO,
                          fontSize: "0.57rem",
                          lineHeight: 1.45,
                          letterSpacing: "0.13em",
                          textTransform: "uppercase",
                          color: "#6E7F87",
                        }}
                      >
                        <div>{t("containerDetail.colSupplier")}</div>
                        <div style={{ color: "#0B2A3D", fontWeight: 700 }}>
                          {t("containerDetail.colClient")}
                        </div>
                        <div>{t("addEntry.clientRef")}</div>
                        <div>{t("addEntry.shipperName")}</div>
                        <div>Booking</div>
                        <div>{t("addEntry.bookingDate")}</div>
                        <div>{t("addEntry.pickupDate")}</div>
                        <div>{t("addEntry.poids")}</div>
                        <div>{t("addEntry.colis")}</div>
                        <div>{t("addEntry.volumeLabel")}</div>
                        <div>{t("addEntry.achat")}</div>
                        <div>{t("addEntry.vente")}</div>
                        <div>{t("containerDetail.colDelivery")}</div>
                        <div>{t("containerDetail.colDocs")}</div>
                      </div>

                      {/* Table Body */}
                      <div>
                        {groupages.map((g, i) => {
                          const saving = savingIdx === i;
                          const docCount = g.documents?.length ?? 0;

                          return (
                            <div
                              key={i}
                              className="pvd-groupage-row"
                              onClick={() =>
                                navigate(
                                  `/containers/${container.id}/documents?g=${i}`
                                )
                              }
                              title={t("containerDetail.viewDocsTitle")}
                              style={{
                                display: "grid",
                                gridTemplateColumns: TABLE_GRID_COLUMNS,
                                minHeight: 78,
                                alignItems: "center",
                                padding: "0 18px",
                                boxSizing: "border-box",
                                background: "#F7F4EE",
                                borderBottom:
                                  i < groupages.length - 1
                                    ? "1px solid rgba(11,42,61,0.09)"
                                    : "none",
                                cursor: "pointer",
                                transition: "background .16s ease",
                              }}
                            >
                              {/* Supplier */}
                              <div
                                style={{
                                  minWidth: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 9,
                                  paddingRight: 16,
                                  boxSizing: "border-box",
                                }}
                              >
                                <div
                                  style={{
                                    width: 28,
                                    height: 28,
                                    flexShrink: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: 6,
                                    background: "rgba(11,42,61,0.055)",
                                    color: "#526872",
                                  }}
                                >
                                  <Package size={13} />
                                </div>
                                <span
                                  style={{
                                    minWidth: 0,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    fontFamily: MONO,
                                    fontSize: "0.70rem",
                                    fontWeight: 500,
                                    color: "#304B58",
                                  }}
                                >
                                  {g.supplier || "—"}
                                </span>
                              </div>

                              {/* Client */}
                              <div
                                style={{
                                  minWidth: 0,
                                  marginRight: 14,
                                  padding: "10px 12px",
                                  borderRadius: 7,
                                  background: "#E8F1F8",
                                  boxSizing: "border-box",
                                }}
                              >
                                <span
                                  style={{
                                    display: "block",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    fontFamily: "'IBM Plex Sans', sans-serif",
                                    fontSize: "0.78rem",
                                    fontWeight: 700,
                                    color: "#0B2A3D",
                                  }}
                                >
                                  {g.client || "—"}
                                </span>
                              </div>

                              {/* Reference */}
                              <div
                                style={{
                                  minWidth: 0,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  paddingRight: 14,
                                  fontFamily: MONO,
                                  fontSize: "0.69rem",
                                  color: "#526872",
                                }}
                              >
                                {g.clientRef || g.reference || "—"}
                              </div>

                              {/* Shipper */}
                              <div
                                style={{
                                  minWidth: 0,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  paddingRight: 14,
                                  fontSize: "0.74rem",
                                  color: "#526872",
                                }}
                              >
                                {g.shipperName || g.shipper || "—"}
                              </div>

                              {/* Booking */}
                              <div
                                style={{
                                  fontFamily: MONO,
                                  fontSize: "0.69rem",
                                  color: "#526872",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {g.bookingNumber || g.booking || "—"}
                              </div>

                              {/* Booking Date */}
                              <div
                                style={{
                                  fontFamily: MONO,
                                  fontSize: "0.68rem",
                                  color: "#526872",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {formatDate(g.bookingDate)}
                              </div>

                              {/* Pickup Date */}
                              <div
                                style={{
                                  fontFamily: MONO,
                                  fontSize: "0.68rem",
                                  color: "#526872",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {formatDate(g.pickupDate)}
                              </div>

                              {/* Weight */}
                              <div
                                style={{
                                  fontFamily: MONO,
                                  fontSize: "0.68rem",
                                  color: "#526872",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {g.weight ? `${g.weight} kg` : "—"}
                              </div>

                              {/* Packages */}
                              <div
                                style={{
                                  fontFamily: MONO,
                                  fontSize: "0.68rem",
                                  color: "#526872",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {g.packages ?? g.colis ?? "—"}
                              </div>

                              {/* Volume */}
                              <div
                                style={{
                                  fontFamily: MONO,
                                  fontSize: "0.68rem",
                                  color: "#526872",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {g.volume ? `${g.volume} m³` : "—"}
                              </div>

                              {/* Purchase Price */}
                              <div
                                style={{
                                  fontFamily: MONO,
                                  fontSize: "0.68rem",
                                  color: "#526872",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {g.achat ? `${g.achat} €` : "—"}
                              </div>

                              {/* Selling Price */}
                              <div
                                style={{
                                  fontFamily: MONO,
                                  fontSize: "0.68rem",
                                  color: "#526872",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {g.vente ? `${g.vente} €` : "—"}
                              </div>

                              {/* Delivery Toggle Checkbox — per-groupage only */}
                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  paddingRight: 12,
                                }}
                              >
                                <label
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    cursor: saving ? "wait" : "pointer",
                                    fontFamily: MONO,
                                    fontSize: "0.68rem",
                                    color: g.delivered ? "#2F7E6C" : "#6E7F87",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={!!g.delivered}
                                    disabled={saving}
                                    onChange={(e) =>
                                      handleDeliveryChange(i, e.target.checked)
                                    }
                                  />
                                  {g.delivered
                                    ? t("containers.delivered")
                                    : t("containers.pending")}
                                </label>
                              </div>

                              {/* Docs Count Indicator */}
                              <div
                                style={{
                                  fontFamily: MONO,
                                  fontSize: "0.7rem",
                                  color: docCount > 0 ? "#185FA5" : "#A0AAB0",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <FileText size={12} />
                                {docCount}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── TIMELINE TAB ── */}
          {activeTab === "timeline" && (
            <div style={{ maxWidth: 920, margin: "0 auto" }}>
              <div
                style={{
                  border: "1px solid rgba(11,42,61,0.12)",
                  borderRadius: 14,
                  overflow: "hidden",
                  marginBottom: 34,
                  background: "#F3EFE7",
                }}
              >
                <ContainerJourneyIllustration timeline={timeline} />
              </div>

              <div style={{ maxWidth: 560, margin: "0 auto" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 14,
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <p
                    style={{
                      fontFamily: MONO,
                      fontSize: "0.68rem",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "#6E7F87",
                      margin: 0,
                    }}
                  >
                    {typeof t === "function"
                      ? t("containerDetail.timelineTitle")
                      : "CHRONOLOGIE DU CONTENEUR"}
                  </p>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      color: "#2F7E6C",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {timeline.filter((s) => s.done).length}/{timeline.length}
                  </span>
                </div>

                <div className="pvd-timeline-progress-track">
                  <div
                    className="pvd-timeline-progress-fill"
                    style={{
                      width: `${
                        (timeline.filter((s) => s.done).length /
                          timeline.length) *
                        100
                      }%`,
                    }}
                  />
                </div>

                <div>
                  {timeline.map((stepObj, idx) => {
                    const isDone = stepObj.done;
                    const isCurrent = stepObj.current;
                    const showDateInput = stepObj.step !== "in_transit";
                    const Icon = STEP_ICONS[stepObj.step] || Clock;

                    const iconBg = isDone
                      ? "#2F7E6C"
                      : isCurrent
                      ? "#C9912B"
                      : "#D3CDC0";

                    return (
                      <div
                        key={stepObj.step || idx}
                        className={`pvd-timeline-node${
                          isDone ? " done" : ""
                        }${isCurrent ? " current" : ""}`}
                        onClick={() => handleTimelineAdvance(idx)}
                      >
                        <div className="pvd-timeline-line" />

                        <div
                          className="pvd-timeline-icon-wrap"
                          style={{ background: iconBg, color: "#fff" }}
                        >
                          {isDone ? (
                            <CheckCircle size={18} />
                          ) : (
                            <Icon size={18} />
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0, paddingTop: 8 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "'IBM Plex Sans', sans-serif",
                                fontSize: "0.88rem",
                                fontWeight: isCurrent || isDone ? 600 : 500,
                                color:
                                  isDone || isCurrent ? "#0B2A3D" : "#6E7F87",
                              }}
                            >
                              {stepLabel(stepObj.step, t)}
                            </span>

                            {isCurrent && (
                              <span
                                className="pvd-timeline-badge"
                                style={{
                                  background: "rgba(201,145,43,0.16)",
                                  color: "#854F0B",
                                }}
                              >
                                <Clock size={10} />
                                {t("containerDetail.current") || "En cours"}
                              </span>
                            )}
                          </div>

                          {showDateInput && (
                            <div
                              className="pvd-timeline-date-pill"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Calendar
                                size={12}
                                style={{ color: "#6E7F87" }}
                              />
                              <input
                                type="date"
                                value={toInputDate(stepObj.date)}
                                disabled={savingTimeline}
                                onChange={(e) =>
                                  handleTimelineDateChange(
                                    idx,
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}