/**
 * Portivo — Add Entry page
 * Place at: src/pages/AddEntry.jsx
 *
 * Manual data-entry form for new containers, replacing the pen-and-paper
 * Excel workflow. Mirrors the real structure used at Genmar: one container
 * number, one internal agent, an ETA, and a repeatable list of groupages
 * (supplier + client + optional achat/vente prices) — exactly matching how
 * rows stack underneath a container number in their existing spreadsheets.
 *
 * Hero treatment mirrors the Arrivals page: full-bleed Unsplash photo,
 * gradient + navy tint overlay, Fraunces heading, mono eyebrow.
 *
 * Dependencies already in your project:
 *   - lucide-react
 *   - react-router-dom
 *
 * NOTE: AGENTS list below is mock data — replace with your real employee/
 * broker list. This page does not yet persist to a shared backend; submitting
 * shows a success state and logs the entry shape to the console. Wire up
 * your data layer (API call, mockData mutation, etc.) where marked.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Trash2, Package, User, Calendar,
  CheckCircle, ArrowLeft, AlertCircle, Building2, Anchor, Ship,
} from "lucide-react";

const MONO = "'IBM Plex Mono', monospace";

/* ── Google Fonts ── */
if (typeof document !== "undefined" && !document.getElementById("pva-gf")) {
  const l = document.createElement("link");
  l.id = "pva-gf"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap";
  document.head.appendChild(l);
}

/* ── Suggestion lists — free-text fields nudge toward these, but any value can be typed ── */
const AGENTS = [
  "Salwa Ben Ali",
  "Karim Trabelsi",
  "Nadia Mansour",
  "Walid Cherif",
  "Amel Jendoubi",
];

const ORIGIN_PORTS = [
  "Shanghai", "Ningbo", "Shenzhen", "Qingdao", "Guangzhou", "Hong Kong",
  "Singapore", "Busan", "Rotterdam", "Antwerp", "Hamburg", "Genoa",
  "Valencia", "Barcelona", "Marseille", "Piraeus", "Istanbul", "Alexandria",
  "Casablanca", "Algiers",
];

const ARRIVAL_PORTS = [
  "Tunis-Goulette", "Rades", "Sfax", "Bizerte", "Sousse", "Gabes",
  "Zarzis", "Tunis-Carthage",
];

const CARRIERS = [
  "MSC", "Maersk", "CMA CGM", "Hapag-Lloyd", "COSCO", "Evergreen",
  "ONE (Ocean Network Express)", "Yang Ming", "HMM", "ZIM",
  "Wan Hai Lines", "PIL (Pacific International Lines)",
];

let groupageIdCounter = 0;
function newGroupage() {
  groupageIdCounter += 1;
  return { id: groupageIdCounter, supplier: "", client: "", achat: "", vente: "" };
}

/* ── Autocomplete input — free text with a filtered suggestion dropdown ── */
function AutocompleteInput({ value, onChange, options, placeholder, icon: Icon, error }) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const query = value.trim().toLowerCase();
  const matches = query
    ? options.filter(o => o.toLowerCase().includes(query)).slice(0, 6)
    : options.slice(0, 6);

  const choose = (val) => {
    onChange(val);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight(h => Math.min(h + 1, matches.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") { if (matches[highlight]) { e.preventDefault(); choose(matches[highlight]); } }
    else if (e.key === "Escape") { setOpen(false); }
  };

  return (
    <div style={AC_WRAP}>
      <div style={SELECT_WRAP}>
        {Icon && <Icon size={14} style={SELECT_ICON} />}
        <input
          type="text"
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true); setHighlight(0); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          style={{ ...SELECT, paddingLeft: Icon ? 38 : 14, ...(error ? INPUT_ERROR : {}) }}
          className="pva-input"
        />
      </div>
      {open && matches.length > 0 && (
        <ul style={AC_LIST} role="listbox">
          {matches.map((m, i) => (
            <li
              key={m}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={() => choose(m)}
              onMouseEnter={() => setHighlight(i)}
              style={{ ...AC_ITEM, ...(i === highlight ? AC_ITEM_ACTIVE : {}) }}
            >
              {m}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Hero — mirrors the Arrivals page hero treatment ── */
function Hero() {
  return (
    <div style={HERO_WRAP}>
      {/* Photo — Unsplash */}
      <img
        src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=468&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="Container terminal"
        style={HERO_IMG}
      />
      {/* Gradient overlay — lighter so more of the photo shows through */}
      <div style={HERO_GRADIENT} />
      {/* Navy tint */}
      <div style={HERO_TINT} />

      {/* Photo credit */}
      <span style={HERO_CREDIT}>Photo: Unsplash</span>

      {/* Text */}
      <div style={HERO_TEXT}>
        <p style={EYEBROW}>Tunis-Goulette terminal · Manual entry</p>
        <h1 style={H1}>Add a container</h1>
        <p style={SUB}>
          Enter a container exactly as it would appear in your tracking sheet —
          one container, its agent, expected dates, and every groupage inside it.
        </p>
      </div>

      {/* Back button sits over the photo, like the old in-header version */}
      <button className="pva-back" onClick={() => window.history.back()} style={HERO_BACK}>
        <ArrowLeft size={13} aria-hidden="true" /> Back
      </button>
    </div>
  );
}

export default function AddEntry() {
  const navigate = useNavigate();

  const [containerNumber, setContainerNumber] = useState("");
  const [agent, setAgent] = useState("");
  const [origin, setOrigin] = useState("");
  const [arrivalPort, setArrivalPort] = useState("");
  const [carrier, setCarrier] = useState("");
  const [eta, setEta] = useState("");
  const [etd, setEtd] = useState("");
  const [groupages, setGroupages] = useState([newGroupage()]);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const updateGroupage = (id, field, value) => {
    setGroupages(gs => gs.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const addGroupage = () => {
    setGroupages(gs => [...gs, newGroupage()]);
  };

  const removeGroupage = (id) => {
    setGroupages(gs => gs.length > 1 ? gs.filter(g => g.id !== id) : gs);
  };

  const validate = () => {
    const e = {};
    if (!containerNumber.trim()) e.containerNumber = "Container number is required";
    if (!agent.trim()) e.agent = "Enter the responsible agent";
    if (!arrivalPort.trim()) e.arrivalPort = "Arrival port is required";
    if (!eta) e.eta = "Expected arrival date is required";
    const hasAtLeastOneGroupage = groupages.some(g => g.supplier.trim() && g.client.trim());
    if (!hasAtLeastOneGroupage) e.groupages = "Add at least one groupage with a supplier and client";
    return e;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const eValidation = validate();
    setErrors(eValidation);
    if (Object.keys(eValidation).length > 0) return;

    const entry = {
      number: containerNumber.trim(),
      agent: agent.trim(),
      origin: origin || "—",
      destination: arrivalPort.trim(),
      carrier: carrier.trim() || "—",
      status: "in_transit",
      eta,
      etd: etd || null,
      needsAttention: false,
      lastVerified: null,
      groupages: groupages
        .filter(g => g.supplier.trim() && g.client.trim())
        .map(({ id, ...rest }) => rest),
    };

    // TODO: replace with your real persistence layer
    // e.g. POST to an API, or push into your mockData/containers store
    console.log("New container entry:", entry);

    setSubmitted(true);
  };

  const resetForm = () => {
    setContainerNumber("");
    setAgent("");
    setOrigin("");
    setArrivalPort("");
    setCarrier("");
    setEta("");
    setEtd("");
    setGroupages([newGroupage()]);
    setErrors({});
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div style={ROOT}>
        <style>{CSS}</style>
        <div style={SUCCESS_WRAP}>
          <div style={SUCCESS_ICON}><CheckCircle size={28} /></div>
          <h1 style={SUCCESS_H1}>Container added</h1>
          <p style={SUCCESS_SUB}>
            <span style={{ fontFamily: MONO, fontWeight: 600, color: "#1C2B33" }}>{containerNumber}</span>
            {" "}has been saved with {groupages.filter(g => g.supplier.trim() && g.client.trim()).length} groupage
            {groupages.filter(g => g.supplier.trim() && g.client.trim()).length !== 1 ? "s" : ""}.
          </p>
          <div style={SUCCESS_ACTIONS}>
            <button className="pva-btn-secondary" onClick={resetForm}>Add another container</button>
            <button className="pva-btn-primary" onClick={() => navigate("/containers")}>View containers</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={ROOT}>
      <style>{CSS}</style>

      <Hero />

      <form onSubmit={handleSubmit} style={FORM_WRAP}>

        {/* ── Container details card ── */}
        <div style={CARD}>
          <div style={CARD_HEAD}>
            <Package size={15} style={{ color: "#2F7E6C" }} />
            <span style={CARD_TITLE}>Container details</span>
          </div>

          <div style={CARD_BODY}>
            <div style={FIELD_ROW_3} className="pva-field-row-3">
              <div style={FIELD}>
                <label style={LABEL}>Container number <span style={REQUIRED}>*</span></label>
                <input
                  type="text"
                  value={containerNumber}
                  onChange={e => setContainerNumber(e.target.value)}
                  placeholder="e.g. CCH15 CAAU9219350"
                  style={{ ...INPUT, ...(errors.containerNumber ? INPUT_ERROR : {}) }}
                  className="pva-input"
                />
                {errors.containerNumber && <span style={ERROR_TEXT}>{errors.containerNumber}</span>}
              </div>

              <div style={FIELD}>
                <label style={LABEL}>Agent <span style={REQUIRED}>*</span></label>
                <AutocompleteInput
                  value={agent}
                  onChange={setAgent}
                  options={AGENTS}
                  placeholder="Type agent name…"
                  icon={User}
                  error={errors.agent}
                />
                {errors.agent && <span style={ERROR_TEXT}>{errors.agent}</span>}
              </div>

              <div style={FIELD}>
                <label style={LABEL}>Shipping line</label>
                <AutocompleteInput
                  value={carrier}
                  onChange={setCarrier}
                  options={CARRIERS}
                  placeholder="Type carrier name…"
                  icon={Ship}
                />
              </div>
            </div>

            <div style={FIELD_ROW_3} className="pva-field-row-3">
              <div style={FIELD}>
                <label style={LABEL}>Origin port</label>
                <AutocompleteInput
                  value={origin}
                  onChange={setOrigin}
                  options={ORIGIN_PORTS}
                  placeholder="Type origin port…"
                  icon={Building2}
                />
              </div>

              <div style={FIELD}>
                <label style={LABEL}>Arrival port <span style={REQUIRED}>*</span></label>
                <AutocompleteInput
                  value={arrivalPort}
                  onChange={setArrivalPort}
                  options={ARRIVAL_PORTS}
                  placeholder="Type arrival port…"
                  icon={Anchor}
                  error={errors.arrivalPort}
                />
                {errors.arrivalPort && <span style={ERROR_TEXT}>{errors.arrivalPort}</span>}
              </div>

              <div style={FIELD}>
                <label style={LABEL}>Expected arrival (ETA) <span style={REQUIRED}>*</span></label>
                <div style={SELECT_WRAP}>
                  <Calendar size={14} style={SELECT_ICON} />
                  <input
                    type="date"
                    value={eta}
                    onChange={e => setEta(e.target.value)}
                    style={{ ...SELECT, ...(errors.eta ? INPUT_ERROR : {}) }}
                    className="pva-input"
                  />
                </div>
                {errors.eta && <span style={ERROR_TEXT}>{errors.eta}</span>}
              </div>
            </div>

            <div style={FIELD_ROW_3} className="pva-field-row-3">
              <div style={FIELD}>
                <label style={LABEL}>
                  Expected departure (ETD)
                  <span style={OPTIONAL_TAG}>optional</span>
                </label>
                <div style={SELECT_WRAP}>
                  <Calendar size={14} style={SELECT_ICON} />
                  <input
                    type="date"
                    value={etd}
                    onChange={e => setEtd(e.target.value)}
                    style={SELECT}
                    className="pva-input"
                  />
                </div>
                <span style={HELP_TEXT}>Used to remind you to confirm the ship has left as agreed.</span>
              </div>
              <div style={FIELD} />
              <div style={FIELD} />
            </div>
          </div>
        </div>

        {/* ── Groupages card ── */}
        <div style={CARD}>
          <div style={CARD_HEAD}>
            <Package size={15} style={{ color: "#185FA5" }} />
            <span style={CARD_TITLE}>Groupages in this container</span>
            <span style={CARD_COUNT}>{groupages.length}</span>
          </div>

          {errors.groupages && (
            <div style={GROUPAGE_ERROR_BANNER}>
              <AlertCircle size={14} /> {errors.groupages}
            </div>
          )}

          <div style={GROUPAGE_LIST}>
            {groupages.map((g, i) => (
              <div key={g.id} style={GROUPAGE_ROW}>
                <div style={GROUPAGE_NUM}>{String(i + 1).padStart(2, "0")}</div>

                <div style={GROUPAGE_FIELDS} className="pva-groupage-fields">
                  <input
                    type="text"
                    value={g.supplier}
                    onChange={e => updateGroupage(g.id, "supplier", e.target.value)}
                    placeholder="Supplier (fournisseur)"
                    style={GROUPAGE_INPUT}
                    className="pva-input"
                  />
                  <input
                    type="text"
                    value={g.client}
                    onChange={e => updateGroupage(g.id, "client", e.target.value)}
                    placeholder="Client"
                    style={GROUPAGE_INPUT}
                    className="pva-input"
                  />
                  <input
                    type="text"
                    value={g.achat}
                    onChange={e => updateGroupage(g.id, "achat", e.target.value)}
                    placeholder="Achat (optional)"
                    style={{ ...GROUPAGE_INPUT, ...GROUPAGE_INPUT_SM }}
                    className="pva-input"
                  />
                  <input
                    type="text"
                    value={g.vente}
                    onChange={e => updateGroupage(g.id, "vente", e.target.value)}
                    placeholder="Vente (optional)"
                    style={{ ...GROUPAGE_INPUT, ...GROUPAGE_INPUT_SM }}
                    className="pva-input"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeGroupage(g.id)}
                  className="pva-remove-btn"
                  disabled={groupages.length === 1}
                  aria-label="Remove groupage"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <button type="button" onClick={addGroupage} className="pva-add-btn">
            <Plus size={15} /> Add groupage
          </button>
        </div>

        {/* ── Submit row ── */}
        <div style={SUBMIT_ROW}>
          <button type="button" className="pva-btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="pva-btn-primary">
            Save container
          </button>
        </div>

      </form>
    </div>
  );
}

/* ── Inline style objects ── */
const ROOT = { fontFamily: "'IBM Plex Sans', sans-serif", background: "#ECE7DA", color: "#1C2B33", minHeight: "100vh" };

/* Hero — mirrors the Arrivals page Hero exactly (560px, photo + gradient + tint) */
const HERO_WRAP = { position: "relative", height: 560, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end" };
const HERO_IMG = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%" };
const HERO_GRADIENT = { position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,32,48,.05) 0%, rgba(8,32,48,.25) 55%, rgba(8,32,48,.92) 100%)" };
const HERO_TINT = { position: "absolute", inset: 0, background: "rgba(11,42,61,.1)" };
const HERO_CREDIT = { position: "absolute", bottom: 16, right: 16, zIndex: 3, fontFamily: MONO, fontSize: 9, letterSpacing: ".1em", color: "rgba(255,255,255,.28)", textTransform: "uppercase" };
const HERO_TEXT = { position: "relative", zIndex: 2, padding: "0 clamp(24px,5vw,48px) 40px" };
const HERO_BACK = { position: "absolute", top: 28, left: "clamp(24px,5vw,48px)", zIndex: 3, margin: 0 };

const EYEBROW = { fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C7E0D8", margin: "0 0 14px" };
const H1 = { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "clamp(2.4rem,5vw,4rem)", letterSpacing: "-0.02em", color: "#DCE6EA", lineHeight: 0.95, margin: "0 0 12px" };
const SUB = { fontFamily: "'Fraunces', serif", fontWeight: 300, fontSize: "clamp(.85rem,1.5vw,1.05rem)", color: "rgba(220,230,234,.7)", maxWidth: "56ch", lineHeight: 1.55, margin: 0 };

const FORM_WRAP = { maxWidth: 1180, margin: "0 auto", padding: "36px clamp(24px,5vw,48px) 80px" };

const CARD = { background: "#fff", border: "1px solid rgba(11,42,61,0.14)", borderRadius: 12, marginBottom: 24, overflow: "hidden" };
const CARD_HEAD = { display: "flex", alignItems: "center", gap: 9, padding: "16px 22px", borderBottom: "1px solid rgba(11,42,61,0.1)", background: "#FAF8F2" };
const CARD_TITLE = { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "1rem", color: "#0B2A3D" };
const CARD_COUNT = { marginLeft: "auto", fontFamily: MONO, fontSize: "0.7rem", fontWeight: 700, color: "#185FA5", background: "#E6F1FB", padding: "3px 9px", borderRadius: 20 };
const CARD_BODY = { padding: "22px" };

const FIELD_ROW = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 };
const FIELD_ROW_3 = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, marginBottom: 18 };
const FIELD = { display: "flex", flexDirection: "column", gap: 6 };
const LABEL = { fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "#6E7F87", display: "flex", alignItems: "center", gap: 6 };
const REQUIRED = { color: "#D6492F" };
const OPTIONAL_TAG = { fontFamily: MONO, fontSize: "0.58rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "#A8A39A", background: "rgba(11,42,61,0.06)", padding: "2px 7px", borderRadius: 10, marginLeft: 6 };
const HELP_TEXT = { fontSize: "0.72rem", color: "#A8A39A", lineHeight: 1.4 };

const INPUT = { width: "100%", padding: "11px 14px", fontSize: "0.9rem", border: "1px solid rgba(11,42,61,0.18)", borderRadius: 8, background: "#fff", color: "#1C2B33", fontFamily: "'IBM Plex Sans', sans-serif", outline: "none" };
const INPUT_ERROR = { borderColor: "#D6492F", background: "#FFF7F5" };
const ERROR_TEXT = { fontSize: "0.72rem", color: "#D6492F", fontFamily: MONO };

const SELECT_WRAP = { position: "relative", display: "flex", alignItems: "center" };
const SELECT_ICON = { position: "absolute", left: 14, color: "#6E7F87", pointerEvents: "none" };
const SELECT_CHEVRON = { position: "absolute", right: 14, color: "#6E7F87", pointerEvents: "none" };
const SELECT = { width: "100%", padding: "11px 14px 11px 38px", fontSize: "0.9rem", border: "1px solid rgba(11,42,61,0.18)", borderRadius: 8, background: "#fff", color: "#1C2B33", fontFamily: "'IBM Plex Sans', sans-serif", outline: "none", appearance: "none", cursor: "pointer" };

const AC_WRAP = { position: "relative" };
const AC_LIST = { position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 20, margin: 0, padding: 4, listStyle: "none", background: "#fff", border: "1px solid rgba(11,42,61,0.18)", borderRadius: 8, boxShadow: "0 8px 24px rgba(11,42,61,0.12)", maxHeight: 220, overflowY: "auto" };
const AC_ITEM = { padding: "9px 12px", fontSize: "0.85rem", color: "#1C2B33", borderRadius: 6, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif" };
const AC_ITEM_ACTIVE = { background: "rgba(24,95,165,0.08)", color: "#0B2A3D" };

const GROUPAGE_ERROR_BANNER = { display: "flex", alignItems: "center", gap: 8, margin: "16px 22px 0", padding: "10px 14px", background: "#FAEEDA", border: "1px solid rgba(201,145,43,0.35)", borderRadius: 8, color: "#854F0B", fontSize: "0.78rem" };
const GROUPAGE_LIST = { padding: "18px 22px 6px" };
const GROUPAGE_ROW = { display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 };
const GROUPAGE_NUM = { fontFamily: MONO, fontSize: "0.72rem", fontWeight: 700, color: "#A8A39A", padding: "12px 0 0", flexShrink: 0, width: 20 };
const GROUPAGE_FIELDS = { flex: 1, display: "grid", gridTemplateColumns: "1.6fr 1.6fr 1fr 1fr", gap: 10 };
const GROUPAGE_INPUT = { width: "100%", padding: "10px 12px", fontSize: "0.84rem", border: "1px solid rgba(11,42,61,0.16)", borderRadius: 7, background: "#FAF8F2", color: "#1C2B33", fontFamily: "'IBM Plex Sans', sans-serif", outline: "none" };
const GROUPAGE_INPUT_SM = { fontFamily: MONO, fontSize: "0.8rem" };

const SUBMIT_ROW = { display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 };

const SUCCESS_WRAP = { maxWidth: 480, margin: "0 auto", padding: "120px 24px", textAlign: "center" };
const SUCCESS_ICON = { width: 56, height: 56, borderRadius: "50%", background: "#EAF3DE", color: "#3B6D11", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" };
const SUCCESS_H1 = { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "1.6rem", color: "#0B2A3D", marginBottom: 10 };
const SUCCESS_SUB = { fontSize: "0.9rem", color: "#6E7F87", lineHeight: 1.6, marginBottom: 28 };
const SUCCESS_ACTIONS = { display: "flex", gap: 12, justifyContent: "center" };

/* ── CSS for hover/focus states + buttons ── */
const CSS = `
.pva-back {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: 'IBM Plex Mono', monospace; font-size: 0.65rem;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: rgba(220,230,234,0.85); background: rgba(11,42,61,0.35);
  border: 1px solid rgba(255,255,255,0.18); cursor: pointer;
  padding: 8px 14px; border-radius: 6px; transition: background .15s, color .15s;
}
.pva-back:hover { background: rgba(11,42,61,0.55); color: #DCE6EA; }

.pva-input:focus, .pva-select:focus {
  border-color: #185FA5 !important;
  box-shadow: 0 0 0 3px rgba(24,95,165,0.12);
}

.pva-add-btn {
  display: flex; align-items: center; gap: 7px;
  margin: 4px 22px 20px; padding: 10px 16px;
  background: none; border: 1.5px dashed rgba(47,126,108,0.4);
  border-radius: 8px; color: #2F7E6C; cursor: pointer;
  font-family: 'IBM Plex Sans', sans-serif; font-size: 0.82rem; font-weight: 500;
  transition: background .15s, border-color .15s;
  width: calc(100% - 44px);
  justify-content: center;
}
.pva-add-btn:hover { background: rgba(47,126,108,0.06); border-color: rgba(47,126,108,0.7); }

.pva-remove-btn {
  flex-shrink: 0; padding: 10px; margin-top: 1px;
  background: none; border: none; cursor: pointer;
  color: #C2BDB1; border-radius: 7px; transition: background .15s, color .15s;
}
.pva-remove-btn:hover:not(:disabled) { background: rgba(214,73,47,0.08); color: #D6492F; }
.pva-remove-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.pva-btn-primary {
  padding: 12px 26px; border-radius: 8px; border: none;
  background: #0B2A3D; color: #DCE6EA; font-weight: 600;
  font-family: 'IBM Plex Sans', sans-serif; font-size: 0.88rem;
  cursor: pointer; transition: background .15s;
}
.pva-btn-primary:hover { background: #163d54; }

.pva-btn-secondary {
  padding: 12px 22px; border-radius: 8px;
  border: 1px solid rgba(11,42,61,0.22); background: #fff;
  color: #1C2B33; font-family: 'IBM Plex Sans', sans-serif; font-size: 0.88rem;
  cursor: pointer; transition: background .15s;
}
.pva-btn-secondary:hover { background: #F1EFE8; }

@media (max-width: 900px) {
  .pva-field-row-3 { grid-template-columns: 1fr 1fr !important; }
}

@media (max-width: 640px) {
  .pva-groupage-fields { grid-template-columns: 1fr !important; }
  .pva-field-row-3 { grid-template-columns: 1fr !important; }
}
`;
