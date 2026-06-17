/**
 * Portivo — Add Entry page
 * New file: src/pages/AddEntry.jsx
 *
 * Manual data-entry form for new containers, replacing the pen-and-paper
 * Excel workflow. Mirrors the real structure used at Genmar: one container
 * number, one internal agent, an ETA, and a repeatable list of groupages
 * (supplier + client + optional achat/vente prices) — exactly matching how
 * rows stack underneath a container number in their existing spreadsheets.
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
  Plus, Trash2, ChevronDown, Package, User, Calendar,
  CheckCircle, ArrowLeft, AlertCircle, Building2,
} from "lucide-react";

const MONO = "'IBM Plex Mono', monospace";

/* ── Google Fonts ── */
if (typeof document !== "undefined" && !document.getElementById("pva-gf")) {
  const l = document.createElement("link");
  l.id = "pva-gf"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap";
  document.head.appendChild(l);
}

/* ── Mock agent list — replace with real Genmar employees/brokers ── */
const AGENTS = [
  "Salwa Ben Ali",
  "Karim Trabelsi",
  "Nadia Mansour",
  "Walid Cherif",
  "Amel Jendoubi",
];

const ORIGIN_PORTS = [
  "Shanghai", "Ningbo", "Shenzhen", "Qingdao", "Guangzhou", "Hong Kong",
];

let groupageIdCounter = 0;
function newGroupage() {
  groupageIdCounter += 1;
  return { id: groupageIdCounter, supplier: "", client: "", achat: "", vente: "" };
}

export default function AddEntry() {
  const navigate = useNavigate();

  const [containerNumber, setContainerNumber] = useState("");
  const [agent, setAgent] = useState("");
  const [origin, setOrigin] = useState("");
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
    if (!agent) e.agent = "Select the responsible agent";
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
      agent,
      origin: origin || "—",
      destination: "Tunis-Goulette",
      carrier: "—",
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

      {/* ── Header ── */}
      <div style={HEADER}>
        <div style={HEADER_INNER}>
          <button className="pva-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={13} aria-hidden="true" /> Back
          </button>
          <p style={EYEBROW}>Tunis-Goulette terminal · Manual entry</p>
          <h1 style={H1}>Add a container</h1>
          <p style={SUB}>
            Enter a container exactly as it would appear in your tracking sheet —
            one container, its agent, expected dates, and every groupage inside it.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={FORM_WRAP}>

        {/* ── Container details card ── */}
        <div style={CARD}>
          <div style={CARD_HEAD}>
            <Package size={15} style={{ color: "#2F7E6C" }} />
            <span style={CARD_TITLE}>Container details</span>
          </div>

          <div style={CARD_BODY}>
            <div style={FIELD_ROW}>
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
                <div style={SELECT_WRAP}>
                  <User size={14} style={SELECT_ICON} />
                  <select
                    value={agent}
                    onChange={e => setAgent(e.target.value)}
                    style={{ ...SELECT, ...(errors.agent ? INPUT_ERROR : {}) }}
                    className="pva-select"
                  >
                    <option value="">Select agent…</option>
                    {AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <ChevronDown size={14} style={SELECT_CHEVRON} />
                </div>
                {errors.agent && <span style={ERROR_TEXT}>{errors.agent}</span>}
              </div>
            </div>

            <div style={FIELD_ROW}>
              <div style={FIELD}>
                <label style={LABEL}>Origin port</label>
                <div style={SELECT_WRAP}>
                  <Building2 size={14} style={SELECT_ICON} />
                  <select
                    value={origin}
                    onChange={e => setOrigin(e.target.value)}
                    style={SELECT}
                    className="pva-select"
                  >
                    <option value="">Select origin…</option>
                    {ORIGIN_PORTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <ChevronDown size={14} style={SELECT_CHEVRON} />
                </div>
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

            <div style={FIELD_ROW}>
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
const HEADER = { background: "#0B2A3D", padding: "0 clamp(24px,5vw,48px)" };
const HEADER_INNER = { maxWidth: 760, padding: "40px 0 36px" };
const EYEBROW = { fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#6F8B9C", margin: "0 0 14px" };
const H1 = { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "clamp(2rem,4vw,2.8rem)", letterSpacing: "-0.02em", color: "#DCE6EA", lineHeight: 1, margin: "0 0 12px" };
const SUB = { fontSize: "0.85rem", color: "#9DB5C0", maxWidth: "56ch", lineHeight: 1.6, margin: 0 };

const FORM_WRAP = { maxWidth: 760, margin: "0 auto", padding: "36px clamp(24px,5vw,48px) 80px" };

const CARD = { background: "#fff", border: "1px solid rgba(11,42,61,0.14)", borderRadius: 12, marginBottom: 24, overflow: "hidden" };
const CARD_HEAD = { display: "flex", alignItems: "center", gap: 9, padding: "16px 22px", borderBottom: "1px solid rgba(11,42,61,0.1)", background: "#FAF8F2" };
const CARD_TITLE = { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "1rem", color: "#0B2A3D" };
const CARD_COUNT = { marginLeft: "auto", fontFamily: MONO, fontSize: "0.7rem", fontWeight: 700, color: "#185FA5", background: "#E6F1FB", padding: "3px 9px", borderRadius: 20 };
const CARD_BODY = { padding: "22px" };

const FIELD_ROW = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 };
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
  color: #6F8B9C; background: none; border: none; cursor: pointer;
  margin-bottom: 18px; padding: 0; transition: color .15s;
}
.pva-back:hover { color: #DCE6EA; }

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

@media (max-width: 640px) {
  .pva-groupage-fields { grid-template-columns: 1fr !important; }
}
`;
