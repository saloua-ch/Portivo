/**
 * Portivo — Search page
 * Place at: src/pages/Search.jsx
 *
 * Now reads live data from ../api/storage instead of the historicalShipments
 * mock. Each container's groupages are flattened into searchable "shipment"
 * rows: { client, supplier, container, reference, date }.
 *
 * Behavior: clicking the hero search bar opens a centered, contained search
 * panel as a modal overlay with a smooth fade+scale entrance and backdrop
 * blur. Typing filters results live with staggered row animations. Press
 * Escape, click the backdrop, or click "Close" to dismiss (animated out).
 */

import { useState, useRef, useEffect, useMemo } from "react";
import * as storage from "../api/storage";
import { Search as SearchIcon, Package, ChevronDown, X, Clock3, ArrowUpRight } from "lucide-react";

const MONO = "'IBM Plex Mono', monospace";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Flattens containers + their groupages into flat, searchable shipment rows.
function buildShipments(containers) {
  const rows = [];
  containers.forEach(c => {
    (c.groupages || []).forEach(g => {
      rows.push({
        client: g.client && g.client.trim() ? g.client.trim() : "Unassigned client",
        supplier: g.supplier || "—",
        container: c.number,
        reference: g.reference || g.vente || g.achat || c.ref || "—",
        date: c.eta || null,
      });
    });
  });
  return rows;
}

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
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function highlight(text, query) {
  if (!query.trim() || !text) return text;
  const parts = String(text).split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} style={{ background: "#FAEEDA", color: "#854F0B", borderRadius: 3, padding: "0 3px", fontWeight: 600 }}>{part}</mark>
      : part
  );
}

const RECENT_SEARCHES = ["Medina Trading", "MSCU7654321", "Carthage Logistics"];

// ─── Sub-components ──────────────────────────────────────────────────────────

function ClientGroup({ client, shipments, query, index }) {
  const [expanded, setExpanded] = useState(true);
  const initials = client.slice(0, 2).toUpperCase();

  return (
    <div
      className="pv-result-row"
      style={{
        background: "#fff",
        border: "1px solid rgba(11,42,61,.1)",
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: 10,
        animationDelay: `${index * 45}ms`,
        boxShadow: "0 1px 2px rgba(11,42,61,.04)",
      }}
    >
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "13px 16px", cursor: "pointer",
          transition: "background .15s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(11,42,61,.02)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 7, flexShrink: 0,
            background: "linear-gradient(135deg, #C7E0D8, #aed4c8)",
            color: "#085041",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: MONO, fontSize: 12, fontWeight: 700,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1C2B33", marginBottom: 1 }}>
              {highlight(client, query)}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".05em", color: "#6E7F87" }}>
              {shipments.length} shipment{shipments.length > 1 ? "s" : ""}
            </div>
          </div>
        </div>
        <ChevronDown
          size={16}
          style={{ color: "#A8A39A", transition: "transform .2s", transform: expanded ? "none" : "rotate(-90deg)" }}
        />
      </div>

      <div style={{
        maxHeight: expanded ? 999 : 0,
        overflow: "hidden",
        transition: "max-height .25s ease",
      }}>
        {shipments.map((s, i) => (
          <div
            key={i}
            className="pv-ship-row"
            style={{
              display: "grid",
              gridTemplateColumns: "1.6fr 1.6fr 1fr 1fr",
              padding: "11px 16px",
              alignItems: "center",
              borderTop: "1px solid rgba(11,42,61,.05)",
              transition: "background .12s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(47,126,108,.04)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Package size={12.5} style={{ color: "#6E7F87", flexShrink: 0 }} />
              <span style={{ fontFamily: MONO, fontSize: 11.5, color: "#1C2B33", letterSpacing: ".02em" }}>
                {highlight(s.container, query)}
              </span>
            </div>
            <span style={{ fontSize: 11.5, color: "#6E7F87" }}>
              {highlight(s.supplier, query)}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: "#6E7F87" }}>
              {highlight(s.reference, query)}
            </span>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: "#A8A39A" }}>
                {formatDate(s.date)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Hero (page underneath the overlay) ───────────────────────────────────────

function Hero({ onOpen, shipmentCount }) {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ position: "relative", height: 560, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <img
        src="https://plus.unsplash.com/premium_photo-1673139386894-9ea986a89050?q=80&w=1600&auto=format&fit=crop"
        alt="Shipping documents and records"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,32,48,.05) 0%, rgba(8,32,48,.25) 55%, rgba(8,32,48,.92) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(11,42,61,.1)" }} />

      <div style={{ position: "relative", zIndex: 2, padding: "0 52px 40px" }}>
        <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: "#C7E0D8", marginBottom: 10 }}>
          Historical records · Tunis-Goulette
        </p>
        <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: "clamp(2.2rem,4.5vw,3.6rem)", lineHeight: .95, letterSpacing: "-.02em", color: "#DCE6EA", marginBottom: 10 }}>
          Search
        </h1>
        <p style={{ fontFamily: "'Fraunces',serif", fontWeight: 300, fontSize: "clamp(.85rem,1.4vw,1rem)", color: "rgba(220,230,234,.68)", maxWidth: "48ch", lineHeight: 1.55, marginBottom: 28 }}>
          Search across every shipment ever imported — by client, supplier, container, or reference.
        </p>

        {/* Trigger */}
        <div
          onClick={onOpen}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            maxWidth: 760,
            cursor: "pointer",
            background: "rgba(255,255,255,.94)",
            backdropFilter: "blur(6px)",
            border: hover ? "1px solid rgba(255,255,255,.8)" : "1px solid rgba(255,255,255,.4)",
            borderRadius: 10,
            boxShadow: hover ? "0 16px 40px rgba(0,0,0,.32)" : "0 12px 32px rgba(0,0,0,.25)",
            display: "flex", alignItems: "center",
            transform: hover ? "translateY(-1px)" : "translateY(0)",
            transition: "box-shadow .2s, transform .2s, border-color .2s",
          }}
        >
          <span style={{ paddingLeft: 20, color: "#6E7F87", display: "flex", alignItems: "center", flexShrink: 0 }}>
            <SearchIcon size={19} />
          </span>
          <span style={{
            flex: 1, padding: "16px 16px", fontSize: 15, color: "#A8A39A",
            fontFamily: "'IBM Plex Sans',sans-serif",
          }}>
            Type a client name, supplier, container number, or reference…
          </span>
          <span style={{
            marginRight: 14, padding: "4px 9px", borderRadius: 6,
            background: "rgba(11,42,61,.06)", color: "#6E7F87",
            fontFamily: MONO, fontSize: 11, fontWeight: 600, letterSpacing: ".04em",
          }}>
            ⌘K
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Search overlay (modal) ────────────────────────────────────────────────────

function SearchOverlay({ query, setQuery, onClose, results, grouped, hasQuery, closing, shipmentCount }) {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className={closing ? "pv-overlay-out" : "pv-overlay-in"}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(8,20,30,.55)",
        backdropFilter: "blur(8px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "8vh 24px 24px",
        overflowY: "auto",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className={closing ? "pv-panel-out" : "pv-panel-in"}
        style={{
          width: "100%", maxWidth: 760,
          background: "#ECE7DA",
          borderRadius: 16,
          boxShadow: "0 30px 70px rgba(0,0,0,.4)",
          overflow: "hidden",
          maxHeight: "78vh",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Search field */}
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(11,42,61,.09)", flexShrink: 0 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "#fff", border: "1px solid rgba(11,42,61,.14)",
            borderRadius: 10,
            boxShadow: "0 1px 3px rgba(11,42,61,.05)",
          }}>
            <span style={{ paddingLeft: 16, color: "#6E7F87", display: "flex", alignItems: "center", flexShrink: 0 }}>
              <SearchIcon size={18} />
            </span>
            <input
              ref={inputRef}
              className="pv-search-input"
              type="text"
              placeholder="Type a client name, supplier, container number, or reference…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                flex: 1, border: "none", outline: "none", background: "transparent",
                padding: "13px 12px", fontSize: 14.5, color: "#1C2B33",
                fontFamily: "'IBM Plex Sans',sans-serif",
              }}
            />
            <button
              onClick={onClose}
              style={{
                padding: "8px 14px", display: "flex", alignItems: "center",
                background: "none", border: "none", cursor: "pointer", color: "#6E7F87",
                flexShrink: 0, borderRadius: 6, transition: "background .12s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(11,42,61,.06)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              aria-label="Close search"
            >
              <X size={17} />
            </button>
          </div>

          {hasQuery && grouped.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, padding: "0 2px" }}>
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: "#6E7F87" }}>
                {results.length} shipment{results.length !== 1 ? "s" : ""} · {grouped.length} client{grouped.length !== 1 ? "s" : ""}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: MONO, fontSize: 9.5, letterSpacing: ".06em", color: "#A8A39A" }}>
                <kbd style={KBD_STYLE}>esc</kbd> to close
              </span>
            </div>
          )}
        </div>

        {/* Results — scrollable */}
        <div style={{ overflowY: "auto", padding: "14px 18px 20px", flex: 1 }}>

          {grouped.length > 0 && (
            <div style={{
              display: "grid", gridTemplateColumns: "1.6fr 1.6fr 1fr 1fr",
              padding: "0 16px 7px",
              fontFamily: MONO, fontSize: 9, fontWeight: 600,
              letterSpacing: ".1em", textTransform: "uppercase", color: "#A8A39A",
            }}>
              <span>Container</span>
              <span>Supplier</span>
              <span>Reference</span>
              <span style={{ textAlign: "right" }}>Date</span>
            </div>
          )}

          {grouped.map(([client, shipments], i) => (
            <ClientGroup key={client} client={client} shipments={shipments} query={query} index={i} />
          ))}

          {!hasQuery && (
            <div style={{ padding: "8px 4px" }}>
              <p style={{
                fontFamily: MONO, fontSize: 9.5, letterSpacing: ".1em", textTransform: "uppercase",
                color: "#A8A39A", marginBottom: 10, paddingLeft: 4,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <Clock3 size={11} /> Recent searches
              </p>
              {RECENT_SEARCHES.map((term, i) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="pv-recent-row"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "11px 14px",
                    background: "#fff", border: "1px solid rgba(11,42,61,.08)",
                    borderRadius: 8, marginBottom: 7,
                    cursor: "pointer", textAlign: "left",
                    fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 13, color: "#1C2B33",
                    transition: "border-color .15s, background .15s",
                    animationDelay: `${i * 50}ms`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(47,126,108,.3)"; e.currentTarget.style.background = "rgba(47,126,108,.03)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(11,42,61,.08)"; e.currentTarget.style.background = "#fff"; }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <SearchIcon size={13} style={{ color: "#A8A39A" }} />
                    {term}
                  </span>
                  <ArrowUpRight size={14} style={{ color: "#C2BDB1" }} />
                </button>
              ))}

              <div style={{ textAlign: "center", marginTop: 24, color: "#A8A39A" }}>
                <p style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".04em" }}>
                  Searches across {shipmentCount} shipments in your history
                </p>
              </div>
            </div>
          )}

          {hasQuery && grouped.length === 0 && (
            <div style={{ textAlign: "center", padding: "44px 20px", color: "#6E7F87" }}>
              <p style={{ fontFamily: "'Fraunces',serif", fontSize: 16, color: "#1C2B33", marginBottom: 6, fontWeight: 500 }}>
                No results for "{query}"
              </p>
              <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".04em", color: "#6E7F87" }}>
                Try a client name, container number, or reference code
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

const KBD_STYLE = {
  fontFamily: MONO, fontSize: 9.5, padding: "1px 5px",
  background: "rgba(11,42,61,.07)", border: "1px solid rgba(11,42,61,.1)",
  borderRadius: 4, color: "#6E7F87",
};

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Search() {
  const [containers, setContainers] = useState([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  // Load real data from storage, and reload whenever it changes elsewhere
  // (new import, status edit, delivery edit, etc.)
  useEffect(() => {
    async function load() {
      const list = await storage.getContainers();
      setContainers(list);
    }
    load();
    const unsubscribe = storage.onChange(() => load());
    return unsubscribe;
  }, []);

  const shipments = useMemo(() => buildShipments(containers), [containers]);

  const results = query.trim().length < 2
    ? []
    : shipments.filter(s =>
        [s.client, s.supplier, s.container, s.reference].some(
          field => field && field.toLowerCase().includes(query.toLowerCase())
        )
      );

  const grouped = groupByEntity(results);
  const hasQuery = query.trim().length >= 2;

  const handleOpen = () => { setOpen(true); setClosing(false); };
  const handleClose = () => {
    setClosing(true);
    setTimeout(() => { setOpen(false); setClosing(false); setQuery(""); }, 180);
  };

  // Global ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (!open) handleOpen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap');
        .pv-search-root * { box-sizing: border-box; margin: 0; padding: 0; }
        .pv-search-root { font-family:'IBM Plex Sans',sans-serif; background:#ECE7DA; -webkit-font-smoothing:antialiased; color:#1C2B33; }
        .pv-search-input::placeholder { color: #A8A39A; }

        @keyframes pv-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pv-fade-out { from { opacity: 1; } to { opacity: 0; } }
        @keyframes pv-pop-in {
          from { opacity: 0; transform: translateY(14px) scale(.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pv-pop-out {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(10px) scale(.97); }
        }
        @keyframes pv-row-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .pv-overlay-in  { animation: pv-fade-in .18s ease both; }
        .pv-overlay-out { animation: pv-fade-out .16s ease both; }
        .pv-panel-in    { animation: pv-pop-in .22s cubic-bezier(.2,.8,.2,1) both; }
        .pv-panel-out   { animation: pv-pop-out .16s ease both; }
        .pv-result-row  { animation: pv-row-in .22s ease both; }
        .pv-recent-row  { animation: pv-row-in .22s ease both; }

        @media(max-width:640px){
          .pv-search-body { padding: 0 20px 40px !important; }
        }
      `}</style>

      <div className="pv-search-root">
        <Hero onOpen={handleOpen} shipmentCount={shipments.length} />
      </div>

      {open && (
        <SearchOverlay
          query={query}
          setQuery={setQuery}
          onClose={handleClose}
          results={results}
          grouped={grouped}
          hasQuery={hasQuery}
          closing={closing}
          shipmentCount={shipments.length}
        />
      )}
    </>
  );
}
