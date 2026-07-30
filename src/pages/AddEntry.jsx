/**
 * Portivo — Add Entry page
 * Wired to storage.addContainer so new containers persist and other pages refresh.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as storage from "../api/storage";
import { useLanguage } from "../context/LanguageContext";
import {
  Plus, Trash2, Package, User, Calendar,
  CheckCircle, ArrowLeft, AlertCircle, Building2, Anchor, Ship,
  Weight, Boxes, FileSignature,
} from "lucide-react";

const MONO = "'IBM Plex Mono', monospace";

const CONTAINER_NUMBER_RE = /^\d{4}[A-Za-z]{7}$/;

if (typeof document !== "undefined" && !document.getElementById("pva-gf")) {
  const l = document.createElement("link");
  l.id = "pva-gf"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap";
  document.head.appendChild(l);
}

const AGENTS = ["Salwa Ben Ali","Karim Trabelsi","Nadia Mansour","Walid Cherif","Amel Jendoubi"];
const SHIPPERS = ["Genmar Shipping","Med Freight Lines","Atlas Cargo Services"];
const ORIGIN_PORTS = ["Shanghai","Ningbo","Shenzhen","Qingdao","Guangzhou","Hong Kong","Singapore","Busan","Rotterdam","Antwerp","Hamburg","Genoa","Valencia","Barcelona","Marseille","Piraeus","Istanbul","Alexandria","Casablanca","Algiers","Ambarli","Alexandrie"];
const ARRIVAL_PORTS = ["Tunis-Goulette","Rades","Sfax","Bizerte","Sousse","Gabes","Zarzis","Tunis-Carthage"];
const CARRIERS = ["MSC","Maersk","CMA CGM","Hapag-Lloyd","COSCO","Evergreen","ONE (Ocean Network Express)","Yang Ming","HMM","ZIM","Wan Hai Lines","PIL (Pacific International Lines)","AKKON","MEDKON","MESSINA"];
const NATURE_MARCHANDISE_OPTIONS = ["Textile","Électroménager","Pièces détachées","Produits alimentaires","Matériaux de construction","Meubles","Produits chimiques","Divers"];

let groupageIdCounter = 0;
function newGroupage() {
  groupageIdCounter += 1;
  return { id: groupageIdCounter, shipper: "", bookingDate: "", clientRef: "", supplier: "", client: "", pickupDate: "", weight: "", packages: "", achat: "", vente: "" };
}

function isValidTNDAmount(value) {
  if (!value.trim()) return true;
  return /^\d+([.,]\d{1,3})?$/.test(value.trim());
}

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

/* ── Autocomplete input ── */
function AutocompleteInput({ value, onChange, options, placeholder, icon: Icon, error }) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const query = value.trim().toLowerCase();
  const matches = query ? options.filter(o => o.toLowerCase().includes(query)).slice(0, 6) : options.slice(0, 6);
  const choose = (val) => { onChange(val); setOpen(false); };
  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === "ArrowDown")  { e.preventDefault(); setHighlight(h => Math.min(h + 1, matches.length - 1)); }
    else if (e.key === "ArrowUp")   { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") { if (matches[highlight]) { e.preventDefault(); choose(matches[highlight]); } }
    else if (e.key === "Escape") { setOpen(false); }
  };
  return (
    <div style={AC_WRAP}>
      <div style={SELECT_WRAP}>
        {Icon && <Icon size={14} style={SELECT_ICON} />}
        <input type="text" value={value} onChange={e => { onChange(e.target.value); setOpen(true); setHighlight(0); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 120)} onKeyDown={handleKeyDown} placeholder={placeholder} autoComplete="off" style={{ ...SELECT, paddingLeft: Icon ? 38 : 14, ...(error ? INPUT_ERROR : {}) }} className="pva-input" />
      </div>
      {open && matches.length > 0 && (
        <ul style={AC_LIST} role="listbox">
          {matches.map((m, i) => (
            <li key={m} role="option" aria-selected={i === highlight} onMouseDown={() => choose(m)} onMouseEnter={() => setHighlight(i)} style={{ ...AC_ITEM, ...(i === highlight ? AC_ITEM_ACTIVE : {}) }}>{m}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Hero ── */
function Hero({ t }) {
  return (
    <div style={HERO_WRAP}>
      <img src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=1600&auto=format&fit=crop" alt="Container terminal" style={HERO_IMG} />
      <div style={HERO_GRADIENT} />
      <div style={HERO_TINT} />
      <span style={HERO_CREDIT}>Photo: Unsplash</span>
      <div style={HERO_TEXT}>
        <p style={EYEBROW}>{t('addEntry.heroEyebrow')}</p>
        <h1 style={H1}>{t('addEntry.heroTitle')}</h1>
        <p style={SUB}>{t('addEntry.heroSubtitle')}</p>
      </div>
      <button className="pva-back" onClick={() => window.history.back()} style={HERO_BACK}>
        <ArrowLeft size={13} aria-hidden="true" /> {t('addEntry.back')}
      </button>
    </div>
  );
}

/* ── Recap row (used on the confirmation screen) ── */
function RecapRow({ label, value }) {
  return (
    <div style={RECAP_ROW}>
      <span style={RECAP_LABEL}>{label}</span>
      <span style={RECAP_VALUE}>{value || "—"}</span>
    </div>
  );
}

export default function AddEntry() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [containerNumber, setContainerNumber]   = useState("");
  const [agent, setAgent]                       = useState("");
  const [origin, setOrigin]                     = useState("");
  const [arrivalPort, setArrivalPort]           = useState("");
  const [carrier, setCarrier]                   = useState("");
  const [natureMarchandise, setNatureMarchandise] = useState("");
  const [embarquementDate, setEmbarquementDate] = useState("");
  const [eta, setEta]                           = useState("");
  const [magasinageDate, setMagasinageDate]     = useState("");
  const [groupages, setGroupages]               = useState([newGroupage()]);
  const [submitted, setSubmitted]               = useState(false);
  const [savedContainer, setSavedContainer]     = useState(null);
  const [errors, setErrors]                     = useState({});
  const [busy, setBusy]                         = useState(false);
  const [saveError, setSaveError]               = useState("");

  const updateGroupage = (id, field, value) => setGroupages(gs => gs.map(g => g.id === id ? { ...g, [field]: value } : g));
  const addGroupage    = () => setGroupages(gs => [...gs, newGroupage()]);
  const removeGroupage = (id) => setGroupages(gs => gs.length > 1 ? gs.filter(g => g.id !== id) : gs);

  const validate = () => {
    const e = {};
    const trimmedNumber = containerNumber.trim();
    if (!trimmedNumber) e.containerNumber = t('addEntry.errContainerNumberRequired');
    else if (!CONTAINER_NUMBER_RE.test(trimmedNumber.replace(/\s+/g, ""))) e.containerNumber = t('addEntry.errContainerNumberFormat');
    if (!agent.trim()) e.agent = t('addEntry.errAgentRequired');
    if (!arrivalPort) e.arrivalPort = t('addEntry.errPodRequired');
    else if (origin.trim() && arrivalPort.trim().toLowerCase() === origin.trim().toLowerCase()) e.arrivalPort = t('addEntry.errPodSameAsPol');
    if (!eta) e.eta = t('addEntry.errEtaRequired');
    if (embarquementDate && eta && new Date(embarquementDate) >= new Date(eta)) e.embarquementDate = t('addEntry.errEmbarquementBeforeEta');
    if (embarquementDate && magasinageDate && new Date(embarquementDate) >= new Date(magasinageDate)) e.magasinageDate = t('addEntry.errMagasinageAfterEmbarquement');
    if (magasinageDate && eta && new Date(magasinageDate) > new Date(eta)) e.magasinageDate = e.magasinageDate || t('addEntry.errMagasinageBeforeEta');
    const hasAtLeastOneGroupage = groupages.some(g => g.supplier.trim() && g.client.trim());
    if (!hasAtLeastOneGroupage) e.groupages = t('addEntry.errGroupagesRequired');
    const groupageErrors = {};
    groupages.forEach(g => {
      const gErr = {};
      if (g.bookingDate && g.pickupDate && new Date(g.bookingDate) >= new Date(g.pickupDate)) gErr.pickupDate = t('addEntry.errPickupAfterBooking');
      if (!isValidTNDAmount(g.achat)) gErr.achat = t('addEntry.errAchatFormat');
      if (!isValidTNDAmount(g.vente)) gErr.vente = t('addEntry.errVenteFormat');
      if (Object.keys(gErr).length > 0) groupageErrors[g.id] = gErr;
    });
    if (Object.keys(groupageErrors).length > 0) { e.groupageFields = groupageErrors; e.groupages = e.groupages || t('addEntry.errGroupagesFixHighlighted'); }
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const eValidation = validate();
    setErrors(eValidation);
    if (Object.keys(eValidation).length > 0) return;

    setBusy(true);
    setSaveError("");

    try {
      const saved = await storage.addContainer({
        number: containerNumber.trim(),
        agent: agent.trim(),
        origin: origin || "—",
        destination: arrivalPort,
        carrier: carrier.trim() || "—",
        natureMarchandise: natureMarchandise || "—",
        status: "in_transit",
        embarquementDate: embarquementDate || null,
        eta,
        magasinageDate: magasinageDate || null,
        needsAttention: false,
        groupages: groupages
          .filter(g => g.supplier.trim() && g.client.trim())
          .map(({ id, ...rest }) => rest),
        timeline: [
          { step: "Departed origin port", date: embarquementDate || null, done: !!embarquementDate },
          { step: "In transit",           date: null, current: true  },
          { step: "Arrived destination",  date: null, done: false    },
        ],
      });

      setSavedContainer(saved);
      setSubmitted(true);
    } catch (err) {
      // storage throws if container number already exists
      setSaveError(err.message || t('addEntry.errSaveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const resetForm = () => {
    setContainerNumber(""); setAgent(""); setOrigin(""); setArrivalPort("");
    setCarrier(""); setNatureMarchandise(""); setEmbarquementDate(""); setEta(""); setMagasinageDate(""); setGroupages([newGroupage()]);
    setErrors({}); setSubmitted(false); setSavedContainer(null); setSaveError("");
  };

  const validGroupageCount = groupages.filter(g => g.supplier.trim() && g.client.trim()).length;

  /* ── Success / confirmation screen ── */
  if (submitted && savedContainer) {
    const savedGroupages = savedContainer.groupages || [];
    return (
      <div style={ROOT}>
        <style>{CSS}</style>
        <div style={SUCCESS_WRAP}>
          <div style={SUCCESS_ICON}><CheckCircle size={28} /></div>
          <h1 style={SUCCESS_H1}>{t('addEntry.successTitle')}</h1>
          <p style={SUCCESS_SUB}>
            <span style={{ fontFamily: MONO, fontWeight: 600, color: "#1C2B33" }}>{savedContainer.number}</span>
            {" "}{t('addEntry.successSaved')} {validGroupageCount} {validGroupageCount !== 1 ? t('addEntry.successGroupagePlural') : t('addEntry.successGroupageSingular')}. {t('addEntry.successRecorded')}
          </p>

          {/* Recap card — container details */}
          <div style={RECAP_CARD}>
            <div style={RECAP_CARD_HEAD}>
              <Package size={14} style={{ color: "#2F7E6C" }} />
              <span style={RECAP_CARD_TITLE}>{t('addEntry.recapContainerDetailsTitle')}</span>
            </div>
            <div style={RECAP_CARD_BODY}>
              <RecapRow label={t('addEntry.recapContainerNumber')} value={<span style={{ fontFamily: MONO }}>{savedContainer.number}</span>} />
              <RecapRow label={t('addEntry.recapAgent')} value={agent} />
              <RecapRow label={t('addEntry.recapShippingLine')} value={carrier} />
              <RecapRow label={t('addEntry.recapPol')} value={origin} />
              <RecapRow label={t('addEntry.recapPod')} value={arrivalPort} />
              <RecapRow label={t('addEntry.recapNature')} value={natureMarchandise} />
              <RecapRow label={t('addEntry.recapEmbarquement')} value={formatDate(embarquementDate)} />
              <RecapRow label={t('addEntry.recapEta')} value={formatDate(eta)} />
              <RecapRow label={t('addEntry.recapMagasinage')} value={formatDate(magasinageDate)} />
            </div>
          </div>

          {/* Recap card — groupages */}
          {savedGroupages.length > 0 && (
            <div style={RECAP_CARD}>
              <div style={RECAP_CARD_HEAD}>
                <Package size={14} style={{ color: "#185FA5" }} />
                <span style={RECAP_CARD_TITLE}>{t('addEntry.recapGroupagesTitle')} ({savedGroupages.length})</span>
              </div>
              <div style={RECAP_CARD_BODY}>
                {savedGroupages.map((g, i) => (
                  <div key={i} style={RECAP_GROUPAGE}>
                    <span style={RECAP_GROUPAGE_BADGE}>{String(i + 1).padStart(2, "0")}</span>
                    <div style={RECAP_GROUPAGE_GRID}>
                      <RecapRow label={t('addEntry.recapFournisseur')} value={g.supplier} />
                      <RecapRow label={t('addEntry.recapClient')} value={g.client} />
                      <RecapRow label={t('addEntry.recapClientRef')} value={g.clientRef} />
                      <RecapRow label={t('addEntry.recapPoids')} value={g.weight ? `${g.weight} kg` : ""} />
                      <RecapRow label={t('addEntry.recapColis')} value={g.packages} />
                      <RecapRow label={t('addEntry.recapAchat')} value={g.achat ? `${g.achat} TND` : ""} />
                      <RecapRow label={t('addEntry.recapVente')} value={g.vente ? `${g.vente} TND` : ""} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={SUCCESS_ACTIONS}>
            <button className="pva-btn-secondary" onClick={resetForm}>{t('addEntry.addAnother')}</button>
            <button className="pva-btn-primary" onClick={() => navigate(`/containers/${savedContainer.id}`)}>{t('addEntry.viewContainer')}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={ROOT}>
      <style>{CSS}</style>
      <Hero t={t} />

      <form onSubmit={handleSubmit} style={FORM_WRAP}>

        {/* ── Container details ── */}
        <div style={CARD}>
          <div style={CARD_HEAD}>
            <Package size={15} style={{ color: "#2F7E6C" }} />
            <span style={CARD_TITLE}>{t('addEntry.containerDetailsTitle')}</span>
          </div>
          <div style={CARD_BODY}>

            <div style={FIELD_ROW_3} className="pva-field-row-3">
              <div style={FIELD}>
                <label style={LABEL}>{t('addEntry.containerNumber')} <span style={REQUIRED}>*</span></label>
                <input type="text" value={containerNumber} onChange={e => setContainerNumber(e.target.value)} placeholder={t('addEntry.containerNumberPlaceholder')} style={{ ...INPUT, ...(errors.containerNumber ? INPUT_ERROR : {}) }} className="pva-input" />
                {errors.containerNumber && <span style={ERROR_TEXT}>{errors.containerNumber}</span>}
              </div>
              <div style={FIELD}>
                <label style={LABEL}>{t('addEntry.agent')} <span style={REQUIRED}>*</span></label>
                <AutocompleteInput value={agent} onChange={setAgent} options={AGENTS} placeholder={t('addEntry.agentPlaceholder')} icon={User} error={errors.agent} />
                {errors.agent && <span style={ERROR_TEXT}>{errors.agent}</span>}
              </div>
              <div style={FIELD}>
                <label style={LABEL}>{t('addEntry.shippingLine')}</label>
                <AutocompleteInput value={carrier} onChange={setCarrier} options={CARRIERS} placeholder={t('addEntry.shippingLinePlaceholder')} icon={Ship} />
              </div>
            </div>

            <div style={FIELD_ROW_3} className="pva-field-row-3">
              <div style={FIELD}>
                <label style={LABEL}>{t('addEntry.pol')}</label>
                <AutocompleteInput value={origin} onChange={setOrigin} options={ORIGIN_PORTS} placeholder={t('addEntry.polPlaceholder')} icon={Building2} />
              </div>
              <div style={FIELD}>
                <label style={LABEL}>{t('addEntry.pod')} <span style={REQUIRED}>*</span></label>
                <div style={SELECT_WRAP}>
                  <Anchor size={14} style={SELECT_ICON} />
                  <select value={arrivalPort} onChange={e => setArrivalPort(e.target.value)} style={{ ...SELECT, ...(errors.arrivalPort ? INPUT_ERROR : {}) }} className="pva-input">
                    <option value="">{t('addEntry.podSelectPlaceholder')}</option>
                    {ARRIVAL_PORTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                {errors.arrivalPort && <span style={ERROR_TEXT}>{errors.arrivalPort}</span>}
              </div>
              <div style={FIELD}>
                <label style={LABEL}>{t('addEntry.dateEmbarquement')}</label>
                <div style={SELECT_WRAP}>
                  <Calendar size={14} style={SELECT_ICON} />
                  <input type="date" value={embarquementDate} onChange={e => setEmbarquementDate(e.target.value)} style={{ ...SELECT, ...(errors.embarquementDate ? INPUT_ERROR : {}) }} className="pva-input" />
                </div>
                {errors.embarquementDate && <span style={ERROR_TEXT}>{errors.embarquementDate}</span>}
                <span style={HELP_TEXT}>{t('addEntry.dateEmbarquementHelp')}</span>
              </div>
            </div>

            <div style={FIELD_ROW_3} className="pva-field-row-3">
              <div style={FIELD}>
                <label style={LABEL}>{t('addEntry.eta')} <span style={REQUIRED}>*</span></label>
                <div style={SELECT_WRAP}>
                  <Calendar size={14} style={SELECT_ICON} />
                  <input type="date" value={eta} onChange={e => setEta(e.target.value)} style={{ ...SELECT, ...(errors.eta ? INPUT_ERROR : {}) }} className="pva-input" />
                </div>
                {errors.eta && <span style={ERROR_TEXT}>{errors.eta}</span>}
                <span style={HELP_TEXT}>{t('addEntry.etaHelp')}</span>
              </div>
              <div style={FIELD}>
                <label style={LABEL}>{t('addEntry.dateMagasinage')} <span style={OPTIONAL_TAG}>{t('addEntry.optional')}</span></label>
                <div style={SELECT_WRAP}>
                  <Calendar size={14} style={SELECT_ICON} />
                  <input type="date" value={magasinageDate} onChange={e => setMagasinageDate(e.target.value)} style={{ ...SELECT, ...(errors.magasinageDate ? INPUT_ERROR : {}) }} className="pva-input" />
                </div>
                {errors.magasinageDate && <span style={ERROR_TEXT}>{errors.magasinageDate}</span>}
                <span style={HELP_TEXT}>{t('addEntry.dateMagasinageHelp')}</span>
              </div>
              <div style={FIELD}>
                <label style={LABEL}>{t('addEntry.natureMarchandise')}</label>
                <select value={natureMarchandise} onChange={e => setNatureMarchandise(e.target.value)} style={SELECT} className="pva-input">
                  <option value="">{t('addEntry.natureMarchandiseSelectPlaceholder')}</option>
                  {NATURE_MARCHANDISE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            {/* Save error from storage (e.g. duplicate number) */}
            {saveError && (
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:"#FBEAE4", border:"1px solid rgba(214,73,47,.3)", borderRadius:8, color:"#a13a26", fontSize:"0.8rem", marginTop:8 }}>
                <AlertCircle size={14} /> {saveError}
              </div>
            )}

          </div>
        </div>

        {/* ── Groupages ── */}
        <div style={CARD}>
          <div style={CARD_HEAD}>
            <Package size={15} style={{ color: "#185FA5" }} />
            <span style={CARD_TITLE}>{t('addEntry.groupagesTitle')}</span>
            <span style={CARD_COUNT}>{groupages.length}</span>
          </div>

          {errors.groupages && (
            <div style={GROUPAGE_ERROR_BANNER}><AlertCircle size={14} /> {errors.groupages}</div>
          )}

          <div style={GROUPAGE_LIST}>
            {groupages.map((g, i) => (
              <div key={g.id} style={GROUPAGE_CARD}>
                <div style={GROUPAGE_CARD_HEAD}>
                  <span style={GROUPAGE_NUM_BADGE}>{String(i + 1).padStart(2, "0")}</span>
                  <button type="button" onClick={() => removeGroupage(g.id)} className="pva-remove-btn" disabled={groupages.length === 1} aria-label="Remove groupage"><Trash2 size={15} /></button>
                </div>

                {/* Row 1 */}
                <div style={GROUPAGE_SUBROW} className="pva-groupage-fields">
                  <div style={GFIELD}>
                    <label style={GLABEL}><Package size={11} /> {t('addEntry.fournisseur')} <span style={REQUIRED}>*</span></label>
                    <input type="text" value={g.supplier} onChange={e => updateGroupage(g.id, "supplier", e.target.value)} placeholder={t('addEntry.fournisseurPlaceholder')} style={GROUPAGE_INPUT} className="pva-input" />
                  </div>
                  <div style={GFIELD}>
                    <label style={GLABEL}><User size={11} /> {t('addEntry.client')} <span style={REQUIRED}>*</span></label>
                    <input type="text" value={g.client} onChange={e => updateGroupage(g.id, "client", e.target.value)} placeholder={t('addEntry.clientPlaceholder')} style={GROUPAGE_INPUT} className="pva-input" />
                  </div>
                  <div style={GFIELD}>
                    <label style={GLABEL}><FileSignature size={11} /> {t('addEntry.clientRef')}</label>
                    <input type="text" value={g.clientRef} onChange={e => updateGroupage(g.id, "clientRef", e.target.value)} placeholder={t('addEntry.clientRefPlaceholder')} style={{ ...GROUPAGE_INPUT, fontFamily: MONO }} className="pva-input" />
                  </div>
                </div>

                {/* Row 2 */}
                <div style={GROUPAGE_SUBROW} className="pva-groupage-fields">
                  <div style={GFIELD}>
                    <label style={GLABEL}><Ship size={11} /> {t('addEntry.shipperName')}</label>
                    <input type="text" list="pva-shippers" value={g.shipper} onChange={e => updateGroupage(g.id, "shipper", e.target.value)} placeholder={t('addEntry.shipperPlaceholder')} style={GROUPAGE_INPUT} className="pva-input" />
                  </div>
                  <div style={GFIELD}>
                    <label style={GLABEL}><Calendar size={11} /> {t('addEntry.bookingDate')}</label>
                    <input type="date" value={g.bookingDate} onChange={e => updateGroupage(g.id, "bookingDate", e.target.value)} style={GROUPAGE_INPUT} className="pva-input" />
                  </div>
                  <div style={GFIELD}>
                    <label style={GLABEL}><Calendar size={11} /> {t('addEntry.pickupDate')}</label>
                    <input type="date" value={g.pickupDate} onChange={e => updateGroupage(g.id, "pickupDate", e.target.value)} style={{ ...GROUPAGE_INPUT, ...(errors.groupageFields?.[g.id]?.pickupDate ? INPUT_ERROR : {}) }} className="pva-input" />
                    {errors.groupageFields?.[g.id]?.pickupDate && <span style={GROUPAGE_ERROR_TEXT}>{errors.groupageFields[g.id].pickupDate}</span>}
                  </div>
                </div>

                {/* Row 3 */}
                <div style={GROUPAGE_SUBROW_4} className="pva-groupage-fields-4">
                  <div style={GFIELD}>
                    <label style={GLABEL}><Weight size={11} /> {t('addEntry.poids')}</label>
                    <input type="text" value={g.weight} onChange={e => updateGroupage(g.id, "weight", e.target.value)} placeholder={t('addEntry.poidsPlaceholder')} style={{ ...GROUPAGE_INPUT, fontFamily: MONO }} className="pva-input" />
                  </div>
                  <div style={GFIELD}>
                    <label style={GLABEL}><Boxes size={11} /> {t('addEntry.colis')}</label>
                    <input type="text" value={g.packages} onChange={e => updateGroupage(g.id, "packages", e.target.value)} placeholder={t('addEntry.colisPlaceholder')} style={{ ...GROUPAGE_INPUT, fontFamily: MONO }} className="pva-input" />
                  </div>
                  <div style={GFIELD}>
                    <label style={GLABEL}>{t('addEntry.achat')} <span style={OPTIONAL_TAG_SM}>{t('addEntry.optional')}</span></label>
                    <div style={SELECT_WRAP}>
                      <input type="text" value={g.achat} onChange={e => updateGroupage(g.id, "achat", e.target.value)} placeholder="—" style={{ ...GROUPAGE_INPUT, fontFamily: MONO, paddingRight: 42, ...(errors.groupageFields?.[g.id]?.achat ? INPUT_ERROR : {}) }} className="pva-input" />
                      <span style={CURRENCY_SUFFIX}>TND</span>
                    </div>
                    {errors.groupageFields?.[g.id]?.achat && <span style={GROUPAGE_ERROR_TEXT}>{errors.groupageFields[g.id].achat}</span>}
                  </div>
                  <div style={GFIELD}>
                    <label style={GLABEL}>{t('addEntry.vente')} <span style={OPTIONAL_TAG_SM}>{t('addEntry.optional')}</span></label>
                    <div style={SELECT_WRAP}>
                      <input type="text" value={g.vente} onChange={e => updateGroupage(g.id, "vente", e.target.value)} placeholder="—" style={{ ...GROUPAGE_INPUT, fontFamily: MONO, paddingRight: 42, ...(errors.groupageFields?.[g.id]?.vente ? INPUT_ERROR : {}) }} className="pva-input" />
                      <span style={CURRENCY_SUFFIX}>TND</span>
                    </div>
                    {errors.groupageFields?.[g.id]?.vente && <span style={GROUPAGE_ERROR_TEXT}>{errors.groupageFields[g.id].vente}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <datalist id="pva-shippers">{SHIPPERS.map(s => <option key={s} value={s} />)}</datalist>

          <button type="button" onClick={addGroupage} className="pva-add-btn">
            <Plus size={15} /> {t('addEntry.addGroupage')}
          </button>
        </div>

        {/* ── Submit ── */}
        <div style={SUBMIT_ROW}>
          <button type="button" className="pva-btn-secondary" onClick={() => navigate(-1)}>{t('addEntry.cancel')}</button>
          <button type="submit" className="pva-btn-primary" disabled={busy}>
            {busy ? t('addEntry.saving') : t('addEntry.save')}
          </button>
        </div>

      </form>
    </div>
  );
}

/* ── Styles ── */
const ROOT         = { fontFamily: "'IBM Plex Sans', sans-serif", background: "#ECE7DA", color: "#1C2B33", minHeight: "100vh" };
const HERO_WRAP    = { position: "relative", height: 560, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end" };
const HERO_IMG     = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%" };
const HERO_GRADIENT= { position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,32,48,.05) 0%, rgba(8,32,48,.25) 55%, rgba(8,32,48,.92) 100%)" };
const HERO_TINT    = { position: "absolute", inset: 0, background: "rgba(11,42,61,.1)" };
const HERO_CREDIT  = { position: "absolute", bottom: 16, right: 16, zIndex: 3, fontFamily: MONO, fontSize: 9, letterSpacing: ".1em", color: "rgba(255,255,255,.28)", textTransform: "uppercase" };
const HERO_TEXT    = { position: "relative", zIndex: 2, padding: "0 clamp(24px,5vw,48px) 40px" };
const HERO_BACK    = { position: "absolute", top: 28, left: "clamp(24px,5vw,48px)", zIndex: 3, margin: 0 };
const EYEBROW      = { fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C7E0D8", margin: "0 0 14px" };
const H1           = { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "clamp(2.4rem,5vw,4rem)", letterSpacing: "-0.02em", color: "#DCE6EA", lineHeight: 0.95, margin: "0 0 12px" };
const SUB          = { fontFamily: "'Fraunces', serif", fontWeight: 300, fontSize: "clamp(.85rem,1.5vw,1.05rem)", color: "rgba(220,230,234,.7)", maxWidth: "56ch", lineHeight: 1.55, margin: 0 };
const FORM_WRAP    = { maxWidth: 1180, margin: "0 auto", padding: "36px clamp(24px,5vw,48px) 80px" };
const CARD         = { background: "#fff", border: "1px solid rgba(11,42,61,0.14)", borderRadius: 12, marginBottom: 24, overflow: "hidden" };
const CARD_HEAD    = { display: "flex", alignItems: "center", gap: 9, padding: "16px 22px", borderBottom: "1px solid rgba(11,42,61,0.1)", background: "#FAF8F2" };
const CARD_TITLE   = { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "1rem", color: "#0B2A3D" };
const CARD_COUNT   = { marginLeft: "auto", fontFamily: MONO, fontSize: "0.7rem", fontWeight: 700, color: "#185FA5", background: "#E6F1FB", padding: "3px 9px", borderRadius: 20 };
const CARD_BODY    = { padding: "22px" };
const FIELD_ROW_3  = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, marginBottom: 18 };
const FIELD        = { display: "flex", flexDirection: "column", gap: 6 };
const LABEL        = { fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "#6E7F87", display: "flex", alignItems: "center", gap: 6 };
const REQUIRED     = { color: "#D6492F" };
const OPTIONAL_TAG = { fontFamily: MONO, fontSize: "0.58rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "#A8A39A", background: "rgba(11,42,61,0.06)", padding: "2px 7px", borderRadius: 10, marginLeft: 6 };
const OPTIONAL_TAG_SM = { ...OPTIONAL_TAG, fontSize: "0.54rem" };
const HELP_TEXT    = { fontSize: "0.72rem", color: "#A8A39A", lineHeight: 1.4 };
const INPUT        = { width: "100%", padding: "11px 14px", fontSize: "0.9rem", border: "1px solid rgba(11,42,61,0.18)", borderRadius: 8, background: "#fff", color: "#1C2B33", fontFamily: "'IBM Plex Sans', sans-serif", outline: "none" };
const INPUT_ERROR  = { borderColor: "#D6492F", background: "#FFF7F5" };
const ERROR_TEXT   = { fontSize: "0.72rem", color: "#D6492F", fontFamily: MONO };
const SELECT_WRAP  = { position: "relative", display: "flex", alignItems: "center" };
const SELECT_ICON  = { position: "absolute", left: 14, color: "#6E7F87", pointerEvents: "none" };
const SELECT       = { width: "100%", padding: "11px 14px 11px 38px", fontSize: "0.9rem", border: "1px solid rgba(11,42,61,0.18)", borderRadius: 8, background: "#fff", color: "#1C2B33", fontFamily: "'IBM Plex Sans', sans-serif", outline: "none", appearance: "none", cursor: "pointer" };
const AC_WRAP      = { position: "relative" };
const AC_LIST      = { position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 20, margin: 0, padding: 4, listStyle: "none", background: "#fff", border: "1px solid rgba(11,42,61,0.18)", borderRadius: 8, boxShadow: "0 8px 24px rgba(11,42,61,0.12)", maxHeight: 220, overflowY: "auto" };
const AC_ITEM      = { padding: "9px 12px", fontSize: "0.85rem", color: "#1C2B33", borderRadius: 6, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif" };
const AC_ITEM_ACTIVE = { background: "rgba(24,95,165,0.08)", color: "#0B2A3D" };
const GROUPAGE_ERROR_BANNER = { display: "flex", alignItems: "center", gap: 8, margin: "16px 22px 0", padding: "10px 14px", background: "#FAEEDA", border: "1px solid rgba(201,145,43,0.35)", borderRadius: 8, color: "#854F0B", fontSize: "0.78rem" };
const GROUPAGE_LIST       = { padding: "18px 22px 6px" };
const GROUPAGE_CARD       = { border: "1px solid rgba(11,42,61,0.12)", borderRadius: 10, background: "#FAF8F2", padding: "14px 16px", marginBottom: 14 };
const GROUPAGE_CARD_HEAD  = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 };
const GROUPAGE_NUM_BADGE  = { fontFamily: MONO, fontSize: "0.68rem", fontWeight: 700, color: "#185FA5", background: "#E6F1FB", padding: "3px 10px", borderRadius: 20 };
const GROUPAGE_SUBROW     = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 };
const GROUPAGE_SUBROW_4   = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 };
const GFIELD              = { display: "flex", flexDirection: "column", gap: 4 };
const GLABEL              = { fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.04em", textTransform: "uppercase", color: "#8a8680", display: "flex", alignItems: "center", gap: 5 };
const GROUPAGE_INPUT      = { width: "100%", padding: "9px 11px", fontSize: "0.82rem", border: "1px solid rgba(11,42,61,0.16)", borderRadius: 6, background: "#fff", color: "#1C2B33", fontFamily: "'IBM Plex Sans', sans-serif", outline: "none" };
const GROUPAGE_ERROR_TEXT = { fontSize: "0.66rem", color: "#D6492F", fontFamily: MONO };
const CURRENCY_SUFFIX     = { position: "absolute", right: 11, color: "#A8A39A", fontFamily: MONO, fontSize: "0.66rem", letterSpacing: "0.04em", pointerEvents: "none" };
const SUBMIT_ROW          = { display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 };
const SUCCESS_WRAP        = { maxWidth: 620, margin: "0 auto", padding: "80px 24px 100px", textAlign: "center" };
const SUCCESS_ICON        = { width: 56, height: 56, borderRadius: "50%", background: "#EAF3DE", color: "#3B6D11", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" };
const SUCCESS_H1          = { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "1.6rem", color: "#0B2A3D", marginBottom: 10 };
const SUCCESS_SUB         = { fontSize: "0.9rem", color: "#6E7F87", lineHeight: 1.6, marginBottom: 28 };
const SUCCESS_ACTIONS     = { display: "flex", gap: 12, justifyContent: "center", marginTop: 8 };

/* Recap card styles (confirmation screen) */
const RECAP_CARD       = { background: "#fff", border: "1px solid rgba(11,42,61,0.14)", borderRadius: 12, marginBottom: 18, overflow: "hidden", textAlign: "left" };
const RECAP_CARD_HEAD  = { display: "flex", alignItems: "center", gap: 8, padding: "13px 18px", borderBottom: "1px solid rgba(11,42,61,0.1)", background: "#FAF8F2" };
const RECAP_CARD_TITLE = { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "0.92rem", color: "#0B2A3D" };
const RECAP_CARD_BODY  = { padding: "6px 18px 12px" };
const RECAP_ROW        = { display: "flex", justifyContent: "space-between", gap: 12, padding: "7px 0", borderBottom: "1px solid rgba(11,42,61,0.06)" };
const RECAP_LABEL      = { fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.04em", textTransform: "uppercase", color: "#8a8680" };
const RECAP_VALUE      = { fontSize: "0.85rem", color: "#1C2B33", fontWeight: 500, textAlign: "right" };
const RECAP_GROUPAGE      = { display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(11,42,61,0.08)" };
const RECAP_GROUPAGE_BADGE = { flexShrink: 0, fontFamily: MONO, fontSize: "0.68rem", fontWeight: 700, color: "#185FA5", background: "#E6F1FB", padding: "3px 9px", borderRadius: 20, height: "fit-content" };
const RECAP_GROUPAGE_GRID = { flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 20 };

const CSS = `
.pva-back { display: inline-flex; align-items: center; gap: 6px; font-family: 'IBM Plex Mono', monospace; font-size: 0.65rem; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(220,230,234,0.85); background: rgba(11,42,61,0.35); border: 1px solid rgba(255,255,255,0.18); cursor: pointer; padding: 8px 14px; border-radius: 6px; transition: background .15s, color .15s; }
.pva-back:hover { background: rgba(11,42,61,0.55); color: #DCE6EA; }
.pva-input:focus { border-color: #185FA5 !important; box-shadow: 0 0 0 3px rgba(24,95,165,0.12); }
.pva-add-btn { display: flex; align-items: center; gap: 7px; margin: 4px 22px 20px; padding: 10px 16px; background: none; border: 1.5px dashed rgba(47,126,108,0.4); border-radius: 8px; color: #2F7E6C; cursor: pointer; font-family: 'IBM Plex Sans', sans-serif; font-size: 0.82rem; font-weight: 500; transition: background .15s, border-color .15s; width: calc(100% - 44px); justify-content: center; }
.pva-add-btn:hover { background: rgba(47,126,108,0.06); border-color: rgba(47,126,108,0.7); }
.pva-remove-btn { flex-shrink: 0; padding: 7px; background: none; border: none; cursor: pointer; color: #C2BDB1; border-radius: 7px; transition: background .15s, color .15s; }
.pva-remove-btn:hover:not(:disabled) { background: rgba(214,73,47,0.08); color: #D6492F; }
.pva-remove-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.pva-btn-primary { padding: 12px 26px; border-radius: 8px; border: none; background: #0B2A3D; color: #DCE6EA; font-weight: 600; font-family: 'IBM Plex Sans', sans-serif; font-size: 0.88rem; cursor: pointer; transition: background .15s; }
.pva-btn-primary:hover:not(:disabled) { background: #163d54; }
.pva-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.pva-btn-secondary { padding: 12px 22px; border-radius: 8px; border: 1px solid rgba(11,42,61,0.22); background: #fff; color: #1C2B33; font-family: 'IBM Plex Sans', sans-serif; font-size: 0.88rem; cursor: pointer; transition: background .15s; }
.pva-btn-secondary:hover { background: #F1EFE8; }
@media (max-width: 900px) { .pva-field-row-3 { grid-template-columns: 1fr 1fr !important; } .pva-groupage-fields-4 { grid-template-columns: 1fr 1fr !important; } }
@media (max-width: 640px) { .pva-groupage-fields { grid-template-columns: 1fr !important; } .pva-groupage-fields-4 { grid-template-columns: 1fr !important; } .pva-field-row-3 { grid-template-columns: 1fr !important; } }
`;