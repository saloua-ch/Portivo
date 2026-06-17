/**
 * Portivo — Search page
 * Drop-in replacement for Search.jsx
 * Place at: src/pages/Search.jsx
 *
 * Dependencies already in your project:
 *   - lucide-react      (icons)
 *   - ../data/mockData  (historicalShipments)
 */

import { useState } from "react";
import { historicalShipments } from "../data/mockData";
import { Search as SearchIcon, Package, ChevronDown } from "lucide-react";

const MONO = "'IBM Plex Mono', monospace";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    day: "numeric", month: "short", year: "numeric",
  });
}

function highlight(text, query) {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} style={{ background: "#FAEEDA", color: "#854F0B", borderRadius: 3, padding: "0 2px" }}>{part}</mark>
      : part
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ClientGroup({ client, shipments, query }) {
  const [expanded, setExpanded] = useState(true);
  const initials = client.slice(0, 2).toUpperCase();

  return (
    <div style={{
      background: "#E2DCCB",
      border: "1px solid rgba(11,42,61,.14)",
      borderRadius: 4,
      overflow: "hidden",
      marginBottom: 14,
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "15px 20px", cursor: "pointer",
          background: "rgba(11,42,61,.03)",
          borderBottom: expanded ? "1px solid rgba(11,42,61,.08)" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 6, flexShrink: 0,
            background: "#C7E0D8", color: "#085041",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: MONO, fontSize: 13, fontWeight: 700,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1C2B33", marginBottom: 1 }}>
              {highlight(client, query)}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase", color: "#6E7F87" }}>
              {shipments.length} shipment{shipments.length > 1 ? "s" : ""} found
            </div>
          </div>
        </div>
        <ChevronDown
          size={18}
          style={{ color: "#6E7F87", transition: "transform .15s", transform: expanded ? "none" : "rotate(-90deg)" }}
        />
      </div>

      {/* Rows */}
      {expanded && shipments.map((s, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1.6fr 1fr 1fr",
            padding: "13px 20px",
            alignItems: "center",
            borderBottom: i < shipments.length - 1 ? "1px solid rgba(11,42,61,.06)" : "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Package size={14} style={{ color: "#6E7F87", flexShrink: 0 }} />
            <span style={{ fontFamily: MONO, fontSize: 12.5, color: "#1C2B33", letterSpacing: ".02em" }}>
              {highlight(s.container, query)}
            </span>
          </div>
          <span style={{ fontSize: 12.5, color: "#6E7F87" }}>
            {highlight(s.supplier, query)}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 12, color: "#6E7F87" }}>
            {highlight(s.reference, query)}
          </span>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: "#A8A39A" }}>
              {formatDate(s.date)}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: "#C2BDB1", marginTop: 2 }}>
              {s.year}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Hero() {
  return (
    <div style={{ position: "relative", height: 560, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      {/* Photo */}
      <img
        src="https://plus.unsplash.com/premium_photo-1673139386894-9ea986a89050?q=80&w=1600&auto=format&fit=crop"
        alt="Shipping documents and records"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }}
      />
      {/* Gradient overlay — lighter so more of the photo shows through */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,32,48,.05) 0%, rgba(8,32,48,.25) 55%, rgba(8,32,48,.92) 100%)" }} />
      {/* Navy tint */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(11,42,61,.1)" }} />

      {/* Text */}
      <div style={{ position: "relative", zIndex: 2, padding: "0 52px" }}>
        <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: "#C7E0D8", marginBottom: 10 }}>
          Historical records · Tunis-Goulette
        </p>
        <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: "clamp(2.2rem,4.5vw,3.6rem)", lineHeight: .95, letterSpacing: "-.02em", color: "#DCE6EA", marginBottom: 10 }}>
          Search
        </h1>
        <p style={{ fontFamily: "'Fraunces',serif", fontWeight: 300, fontSize: "clamp(.85rem,1.4vw,1rem)", color: "rgba(220,230,234,.68)", maxWidth: "48ch", lineHeight: 1.55 }}>
          Search across every shipment ever imported — by client, supplier, container, or reference.
        </p>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap');
        .pv-search-root * { box-sizing: border-box; margin: 0; padding: 0; }
        .pv-search-root { font-family:'IBM Plex Sans',sans-serif; background:#ECE7DA; -webkit-font-smoothing:antialiased; color:#1C2B33; }
        .pv-search-input::placeholder { color: #A8A39A; }
        @media(max-width:640px){ .pv-search-body { padding: 0 20px 40px !important; } }
      `}</style>

      <div className="pv-search-root">
        <Hero />

        <div className="pv-search-body" style={{ padding: "0 52px 56px", maxWidth: 980, margin: "0 auto" }}>

          {/* Floating search bar — overlaps hero/body boundary */}
          <div style={{ position: "relative", marginTop: -28, marginBottom: 36, zIndex: 5 }}>
            <div style={{
              position: "relative", background: "#fff",
              border: "1px solid rgba(11,42,61,.16)", borderRadius: 10,
              boxShadow: "0 8px 24px rgba(11,42,61,.12)",
              display: "flex", alignItems: "center",
            }}>
              <span style={{ paddingLeft: 20, color: "#6E7F87", display: "flex", alignItems: "center", flexShrink: 0 }}>
                <SearchIcon size={19} />
              </span>
              <input
                className="pv-search-input"
                type="text"
                placeholder="Type a client name, supplier, container number, or reference…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
                style={{
                  flex: 1, border: "none", outline: "none", background: "transparent",
                  padding: "18px 16px", fontSize: 15, color: "#1C2B33",
                  fontFamily: "'IBM Plex Sans',sans-serif",
                }}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  style={{
                    paddingRight: 18, color: "#6E7F87", background: "none", border: "none",
                    cursor: "pointer", fontSize: 20, lineHeight: 1, flexShrink: 0,
                  }}
                >
                  ×
                </button>
              )}
            </div>

            {/* Meta row */}
            {hasQuery && grouped.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, padding: "0 4px" }}>
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "#6E7F87" }}>
                  {results.length} shipment{results.length !== 1 ? "s" : ""} across {grouped.length} client{grouped.length !== 1 ? "s" : ""}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "#6E7F87" }}>
                  Showing all matches
                </span>
              </div>
            )}
          </div>

          {/* Column headers */}
          {grouped.length > 0 && (
            <div style={{
              display: "grid", gridTemplateColumns: "1.6fr 1.6fr 1fr 1fr",
              padding: "0 20px 10px",
              fontFamily: MONO, fontSize: 9, fontWeight: 600,
              letterSpacing: ".14em", textTransform: "uppercase", color: "#6E7F87",
              borderBottom: "1px solid rgba(11,42,61,.1)", marginBottom: 6,
            }}>
              <span>Container</span>
              <span>Supplier</span>
              <span>Reference</span>
              <span style={{ textAlign: "right" }}>Date</span>
            </div>
          )}

          {/* Results */}
          {grouped.map(([client, shipments]) => (
            <ClientGroup key={client} client={client} shipments={shipments} query={query} />
          ))}

          {/* Idle state */}
          {!hasQuery && (
            <div style={{ textAlign: "center", padding: "72px 20px", color: "#6E7F87" }}>
              <SearchIcon size={38} style={{ color: "#C2BDB1", marginBottom: 16 }} />
              <p style={{ fontFamily: "'Fraunces',serif", fontSize: 17, color: "#1C2B33", marginBottom: 6, fontWeight: 500 }}>
                Start typing to search
              </p>
              <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".04em", color: "#6E7F87" }}>
                Searches across {historicalShipments.length} shipments in your history
              </p>
            </div>
          )}

          {/* No results */}
          {hasQuery && grouped.length === 0 && (
            <div style={{ textAlign: "center", padding: "72px 20px", color: "#6E7F87" }}>
              <p style={{ fontFamily: "'Fraunces',serif", fontSize: 17, color: "#1C2B33", marginBottom: 6, fontWeight: 500 }}>
                No results for "{query}"
              </p>
              <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".04em", color: "#6E7F87" }}>
                Try a client name, container number, or reference code
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}