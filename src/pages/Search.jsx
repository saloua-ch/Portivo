import { useState } from "react";
import { historicalShipments } from "../data/mockData";
import { Search as SearchIcon, Package, ChevronDown, ChevronUp } from "lucide-react";

function groupByEntity(results) {
  const groups = {};
  results.forEach(s => {
    const key = s.client;
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  });
  return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function highlight(text, query) {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} style={{ background: "#FAEEDA", color: "#854F0B", borderRadius: 3, padding: "0 2px" }}>{part}</mark>
      : part
  );
}

function ClientGroup({ client, shipments, query }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div style={{
      background: "#fff",
      border: "0.5px solid #e0e0e0",
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 12,
    }}>
      {/* Group header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px",
          cursor: "pointer",
          borderBottom: expanded ? "0.5px solid #f0f0f0" : "none",
          background: "#fafafa",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "#E6F1FB", color: "#185FA5",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 500, flexShrink: 0,
          }}>
            {client.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: "#1a1f36" }}>
              {highlight(client, query)}
            </p>
            <p style={{ fontSize: 12, color: "#8892b0", margin: 0 }}>
              {shipments.length} shipment{shipments.length > 1 ? "s" : ""} found
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} color="#8892b0" /> : <ChevronDown size={16} color="#8892b0" />}
      </div>

      {/* Shipment rows */}
      {expanded && shipments.map((s, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr",
            padding: "13px 20px",
            borderBottom: i < shipments.length - 1 ? "0.5px solid #f0f0f0" : "none",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Package size={14} color="#8892b0" />
            <span style={{ fontSize: 13, color: "#1a1f36", fontFamily: "monospace" }}>
              {highlight(s.container, query)}
            </span>
          </div>
          <span style={{ fontSize: 13, color: "#8892b0" }}>
            {highlight(s.supplier, query)}
          </span>
          <span style={{ fontSize: 13, color: "#8892b0", fontFamily: "monospace" }}>
            {highlight(s.reference, query)}
          </span>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 12, color: "#b0b8cc" }}>
              {formatDate(s.date)}
            </span>
            <p style={{ fontSize: 11, margin: "2px 0 0", color: "#D3D1C7" }}>
              {s.year}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Search() {
  const [query, setQuery] = useState("");

  const results = query.trim().length < 2
    ? []
    : historicalShipments.filter(s =>
        [s.client, s.supplier, s.container, s.reference].some(
          field => field.toLowerCase().includes(query.toLowerCase())
        )
      );

  const grouped = groupByEntity(results);
  const hasQuery = query.trim().length >= 2;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 4px", color: "#1a1f36" }}>
          Historical search
        </h1>
        <p style={{ fontSize: 14, color: "#8892b0", margin: 0 }}>
          Search across every shipment ever imported — by client, supplier, container, or reference.
        </p>
      </div>

      {/* Search input */}
      <div style={{ position: "relative", marginBottom: 32 }}>
        <SearchIcon
          size={18}
          color="#8892b0"
          style={{
            position: "absolute", left: 16,
            top: "50%", transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        />
        <input
          type="text"
          placeholder="Type a client name, supplier, container number, or reference..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "14px 16px 14px 48px",
            border: "0.5px solid #e0e0e0",
            borderRadius: 10, fontSize: 15,
            color: "#1a1f36", background: "#fff",
            outline: "none", boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            style={{
              position: "absolute", right: 14,
              top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none",
              cursor: "pointer", color: "#8892b0", fontSize: 18,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Column headers (only when results exist) */}
      {grouped.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr",
          padding: "0 20px 8px",
          fontSize: 11, fontWeight: 500,
          color: "#b0b8cc", textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}>
          <span>Container</span>
          <span>Supplier</span>
          <span>Reference</span>
          <span style={{ textAlign: "right" }}>Date</span>
        </div>
      )}

      {/* Results */}
      {grouped.map(([client, shipments]) => (
        <ClientGroup
          key={client}
          client={client}
          shipments={shipments}
          query={query}
        />
      ))}

      {/* States */}
      {!hasQuery && (
        <div style={{
          textAlign: "center", padding: "64px 0",
          color: "#b0b8cc",
        }}>
          <SearchIcon size={36} color="#D3D1C7" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 15, margin: "0 0 6px", color: "#8892b0" }}>
            Start typing to search
          </p>
          <p style={{ fontSize: 13, margin: 0 }}>
            Searches across {historicalShipments.length} shipments in your history
          </p>
        </div>
      )}

      {hasQuery && grouped.length === 0 && (
        <div style={{
          textAlign: "center", padding: "64px 0",
          color: "#b0b8cc",
        }}>
          <p style={{ fontSize: 15, margin: "0 0 6px", color: "#8892b0" }}>
            No results for "{query}"
          </p>
          <p style={{ fontSize: 13, margin: 0 }}>
            Try a client name, container number, or reference code
          </p>
        </div>
      )}

      {hasQuery && grouped.length > 0 && (
        <p style={{
          textAlign: "center", paddingTop: 8,
          color: "#b0b8cc", fontSize: 13
        }}>
          {results.length} shipment{results.length > 1 ? "s" : ""} across {grouped.length} client{grouped.length > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}