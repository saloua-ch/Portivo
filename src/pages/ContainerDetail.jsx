import { useParams, useNavigate } from "react-router-dom";
import { containers } from "../data/mockData";
import { useState } from "react";
import {
  ArrowLeft, AlertCircle, Ship, ClipboardList, Anchor,
  CheckCircle, Circle, Clock, Package, FileText
} from "lucide-react";

const statusConfig = {
  in_transit:    { label: "In transit",    color: "#185FA5", bg: "#E6F1FB" },
  customs:       { label: "In customs",    color: "#854F0B", bg: "#FAEEDA" },
  arriving_soon: { label: "Arriving soon", color: "#3B6D11", bg: "#EAF3DE" },
  delivered:     { label: "Delivered",     color: "#444441", bg: "#F1EFE8" },
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric"
  });
}

export default function ContainerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("groupages");

  const container = containers.find(c => c.id === id);

  if (!container) {
    return (
      <div style={{ textAlign: "center", paddingTop: 80, color: "#8892b0" }}>
        <p style={{ fontSize: 16 }}>Container not found.</p>
        <button
          onClick={() => navigate("/containers")}
          style={{
            marginTop: 16, padding: "8px 20px", borderRadius: 8,
            border: "0.5px solid #e0e0e0", background: "#fff",
            cursor: "pointer", fontSize: 13
          }}
        >
          Back to containers
        </button>
      </div>
    );
  }

  const cfg = statusConfig[container.status] || statusConfig.in_transit;
  const tabs = ["groupages", "timeline", "documents"];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          color: "#8892b0", fontSize: 13, padding: 0, marginBottom: 20,
        }}
      >
        <ArrowLeft size={15} />
        Back
      </button>

      {/* Header card */}
      <div style={{
        background: "#fff",
        border: `0.5px solid #e0e0e0`,
        borderLeft: `4px solid ${container.needsAttention ? "#e24b4a" : cfg.color}`,
        borderRadius: 12,
        padding: "24px 28px",
        marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>

          {/* Left: title + attention */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontSize: 20, fontWeight: 500, margin: 0, color: "#1a1f36" }}>
                {container.number}
              </h1>
              <span style={{
                fontSize: 11, padding: "3px 10px", borderRadius: 20,
                background: cfg.bg, color: cfg.color, fontWeight: 500,
              }}>
                {cfg.label}
              </span>
            </div>

            {container.needsAttention && (
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                fontSize: 13, color: "#A32D2D", marginBottom: 12,
              }}>
                <AlertCircle size={14} />
                {container.attentionReason}
              </div>
            )}

            {/* Meta row */}
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {[
                { label: "Origin",      value: container.origin },
                { label: "Destination", value: container.destination },
                { label: "Carrier",     value: container.carrier },
                { label: "ETA",         value: formatDate(container.eta) },
                { label: "Groupages",   value: container.groupages.length },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontSize: 11, color: "#8892b0", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>
                    {label}
                  </p>
                  <p style={{ fontSize: 14, color: "#1a1f36", margin: 0, fontWeight: 500 }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 0,
        borderBottom: "0.5px solid #e0e0e0",
        marginBottom: 24,
      }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 24px",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid #1a1f36" : "2px solid transparent",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: activeTab === tab ? 500 : 400,
              color: activeTab === tab ? "#1a1f36" : "#8892b0",
              textTransform: "capitalize",
              transition: "all 0.15s",
              marginBottom: "-1px",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── GROUPAGES TAB ── */}
      {activeTab === "groupages" && (
        <div style={{
          background: "#fff",
          border: "0.5px solid #e0e0e0",
          borderRadius: 12,
          overflow: "hidden",
        }}>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1.5fr 1fr 120px",
            padding: "12px 20px",
            borderBottom: "0.5px solid #e0e0e0",
            fontSize: 11, fontWeight: 500,
            color: "#8892b0", textTransform: "uppercase",
            letterSpacing: "0.06em", background: "#fafafa",
          }}>
            <span>Supplier</span>
            <span>Client</span>
            <span>Reference</span>
            <span>Delivery</span>
          </div>

          {container.groupages.map((g, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1.5fr 1.5fr 1fr 120px",
                padding: "14px 20px",
                borderBottom: i < container.groupages.length - 1 ? "0.5px solid #f0f0f0" : "none",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 6,
                  background: "#E6F1FB", color: "#185FA5",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Package size={14} />
                </div>
                <span style={{ fontSize: 13, color: "#1a1f36" }}>{g.supplier}</span>
              </div>
              <span style={{ fontSize: 13, color: "#1a1f36" }}>{g.client}</span>
              <span style={{ fontSize: 13, color: "#8892b0", fontFamily: "monospace" }}>{g.reference}</span>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 11, padding: "3px 10px", borderRadius: 20,
                fontWeight: 500, width: "fit-content",
                background: g.delivered ? "#EAF3DE" : "#F1EFE8",
                color: g.delivered ? "#3B6D11" : "#5F5E5A",
              }}>
                {g.delivered ? <CheckCircle size={11} /> : <Clock size={11} />}
                {g.delivered ? "Delivered" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── TIMELINE TAB ── */}
      {activeTab === "timeline" && (
        <div style={{
          background: "#fff",
          border: "0.5px solid #e0e0e0",
          borderRadius: 12,
          padding: "28px 32px",
        }}>
          {container.timeline.map((step, i) => {
            const isLast = i === container.timeline.length - 1;
            const dotColor = step.done ? "#1D9E75" : step.current ? "#185FA5" : "#D3D1C7";
            const lineColor = step.done ? "#1D9E75" : "#e0e0e0";

            return (
              <div key={i} style={{ display: "flex", gap: 16 }}>
                {/* Dot + line */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: dotColor,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: 2,
                    border: step.current ? `3px solid #E6F1FB` : "none",
                    boxSizing: "border-box",
                  }}>
                    {step.done && <CheckCircle size={12} color="#fff" />}
                    {step.current && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                    {!step.done && !step.current && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#B4B2A9" }} />}
                  </div>
                  {!isLast && (
                    <div style={{
                      width: 2, flex: 1, minHeight: 32,
                      background: lineColor,
                      margin: "4px 0",
                      borderRadius: 2,
                    }} />
                  )}
                </div>

                {/* Step info */}
                <div style={{ paddingBottom: isLast ? 0 : 28, flex: 1 }}>
                  <p style={{
                    fontSize: 14,
                    fontWeight: step.current ? 500 : 400,
                    color: step.done ? "#1a1f36" : step.current ? "#185FA5" : "#8892b0",
                    margin: "0 0 2px",
                  }}>
                    {step.step}
                    {step.current && (
                      <span style={{
                        marginLeft: 8, fontSize: 11,
                        padding: "2px 8px", borderRadius: 20,
                        background: "#E6F1FB", color: "#185FA5", fontWeight: 500,
                      }}>
                        Current
                      </span>
                    )}
                  </p>
                  <p style={{ fontSize: 12, color: "#b0b8cc", margin: 0 }}>
                    {step.date ? formatDate(step.date) : "Date TBD"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── DOCUMENTS TAB ── */}
      {activeTab === "documents" && (
        <div style={{
          background: "#fff",
          border: "0.5px solid #e0e0e0",
          borderRadius: 12,
          overflow: "hidden",
        }}>
          {[
            { name: "Bill of Lading", type: "BL", available: !container.needsAttention },
            { name: "Packing List",   type: "PL", available: true },
            { name: "Commercial Invoice", type: "INV", available: true },
            { name: "Customs Declaration", type: "CD", available: false },
          ].map((doc, i, arr) => (
            <div
              key={doc.name}
              style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "16px 20px",
                borderBottom: i < arr.length - 1 ? "0.5px solid #f0f0f0" : "none",
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: doc.available ? "#EAF3DE" : "#FCEBEB",
                color: doc.available ? "#3B6D11" : "#A32D2D",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <FileText size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 2px", color: "#1a1f36" }}>
                  {doc.name}
                </p>
                <p style={{ fontSize: 12, color: "#8892b0", margin: 0 }}>
                  {doc.available ? "Document available" : "Missing — action required"}
                </p>
              </div>
              {doc.available ? (
                <button style={{
                  padding: "6px 16px", borderRadius: 8,
                  border: "0.5px solid #e0e0e0", background: "#fff",
                  cursor: "pointer", fontSize: 13, color: "#1a1f36",
                }}>
                  View
                </button>
              ) : (
                <span style={{
                  fontSize: 11, padding: "4px 10px", borderRadius: 20,
                  background: "#FCEBEB", color: "#A32D2D", fontWeight: 500,
                }}>
                  Missing
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}