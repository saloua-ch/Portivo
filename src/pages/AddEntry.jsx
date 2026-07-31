/**
 * Portivo — Add Entry page
 * Wired to storage.addContainer so new containers persist and other pages refresh.
 *
 * A 3-step wizard (Container → Groupages → Review) with:
 *  - live field validation (errors update as you type, revealed on blur or
 *    on a failed "Continue" attempt for that step)
 *  - real ISO 6346 check-digit validation on the container number
 *    (src/lib/containerNumber.js) — shown as a soft hint, never a hard
 *    blocker, since plenty of real-world numbers won't satisfy it exactly
 *  - a live "this number already exists" check against the current fleet
 *  - a progress track with a ship marker that eases along as fields fill in
 *  - animated groupage add/remove, a duplicate-groupage shortcut
 *  - autosaved drafts (localStorage) with a restore/discard prompt
 *  - Ctrl/Cmd+Enter to continue or save
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import * as storage from "../api/storage";
import { useLanguage } from "../context/LanguageContext";
import { validateContainerNumber, normalizeContainerNumber } from "../lib/containerNumber";
import ContainerVisual3D from "../components/ContainerVisual3D";
import {
  Plus, Trash2, Package, User, Calendar,
  CheckCircle, ArrowLeft, ArrowRight, AlertCircle, AlertTriangle,
  Building2, Anchor, Ship, Weight, Boxes, FileSignature, Copy, Pencil,
} from "lucide-react";

const MONO = "'IBM Plex Mono', monospace";
const DRAFT_KEY = "pv:addentry-draft:v1";

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

const STEP_KEYS = ["container", "groupages", "review"];
const STEP0_ERROR_KEYS = ["containerNumber", "agent", "arrivalPort", "eta", "embarquementDate", "magasinageDate", "containerSize"];
const STEP1_ERROR_KEYS = ["groupages", "groupageFields"];

// Standard usable capacity in cubic meters for the two container sizes we offer.
const CAPACITY_M3 = { "20": 33, "40": 67 };

let groupageIdCounter = 0;
function newGroupage() {
  groupageIdCounter += 1;
  return { id: groupageIdCounter, shipper: "", bookingDate: "", clientRef: "", supplier: "", client: "", pickupDate: "", weight: "", packages: "", achat: "", vente: "", volume: "" };
}
function cloneGroupage(source) {
  groupageIdCounter += 1;
  return { ...source, id: groupageIdCounter };
}
function reindexGroupages(list) {
  return list.map(g => { groupageIdCounter += 1; return { ...g, id: groupageIdCounter }; });
}

function isValidTNDAmount(value) {
  if (!value.trim()) return true;
  return /^\d+([.,]\d{1,3})?$/.test(value.trim());
}

function isValidVolume(value) {
  if (!value.trim()) return true;
  return /^\d+([.,]\d{1,2})?$/.test(value.trim());
}

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

function stepHasErrors(idx, errs) {
  const keys = idx === 0 ? STEP0_ERROR_KEYS : idx === 1 ? STEP1_ERROR_KEYS : [];
  return keys.some(k => errs[k]);
}

function getFormSnapshot(s) {
  return {
    containerNumber: s.containerNumber, containerSize: s.containerSize, agent: s.agent, origin: s.origin, arrivalPort: s.arrivalPort,
    carrier: s.carrier, natureMarchandise: s.natureMarchandise, embarquementDate: s.embarquementDate,
    eta: s.eta, magasinageDate: s.magasinageDate, groupages: s.groupages, step: s.step,
  };
}
function isSnapshotEmpty(snap) {
  const hasTopLevel = snap.containerNumber || snap.containerSize || snap.agent || snap.origin || snap.arrivalPort || snap.carrier || snap.natureMarchandise || snap.embarquementDate || snap.eta || snap.magasinageDate;
  const hasGroupage = snap.groupages?.some(g => g.supplier || g.client || g.shipper || g.clientRef);
  return !hasTopLevel && !hasGroupage;
}

/* ── Autocomplete input ── */
function AutocompleteInput({ value, onChange, options, placeholder, icon: Icon, error, onFieldBlur }) {
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
        <input
          type="text" value={value}
          onChange={e => { onChange(e.target.value); setOpen(true); setHighlight(0); }}
          onFocus={() => setOpen(true)}
          onBlur={() => { setTimeout(() => setOpen(false), 120); onFieldBlur && onFieldBlur(); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder} autoComplete="off"
          style={{ ...SELECT, paddingLeft: Icon ? 38 : 14, ...(error ? INPUT_ERROR : {}) }}
          className="pva-input"
        />
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

/* ── Container number field (ISO 6346 checksum hint + live duplicate check) ── */
function ContainerNumberField({ value, onChange, onFieldBlur, error, showError, existingNumbers, t }) {
  const check = useMemo(() => validateContainerNumber(value), [value]);
  const clean = normalizeContainerNumber(value);
  const isDuplicate = Boolean(existingNumbers && clean && check.status !== "bad_format" && existingNumbers.has(clean));
  const showValidTick = !error && check.status === "valid" && !isDuplicate;

  return (
    <div style={FIELD}>
      <label style={LABEL}>{t("addEntry.containerNumber")} <span style={REQUIRED}>*</span></label>
      <div style={SELECT_WRAP}>
        <Package size={14} style={SELECT_ICON} />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value.toUpperCase())}
          onBlur={onFieldBlur}
          placeholder={t("addEntry.containerNumberPlaceholder")}
          style={{ ...INPUT, paddingLeft: 38, paddingRight: 36, fontFamily: MONO, letterSpacing: "0.03em", ...(showError && error ? INPUT_ERROR : {}) }}
          className="pva-input"
        />
        {showValidTick && <CheckCircle size={15} style={VALID_TICK} />}
      </div>
      {showError && error && <span style={ERROR_TEXT}>{error}</span>}
      {!(showError && error) && check.status === "checksum_mismatch" && (
        <span style={HINT_WARN}><AlertTriangle size={11} /> {t("addEntry.checksumMismatch")}</span>
      )}
      {!(showError && error) && isDuplicate && (
        <span style={HINT_WARN}><AlertTriangle size={11} /> {t("addEntry.liveDuplicateWarning")}</span>
      )}
    </div>
  );
}

/* ── Groupage card (animated add/remove, duplicate shortcut) ── */


function GroupageCard({ g, index, total, errors, showErrors, onUpdate, onRemove, onDuplicate, onFieldBlur, removing, t }) {
  const gErr = errors.groupageFields?.[g.id] || {};
  return (
    <div style={GROUPAGE_CARD} className={`pva-groupage-card${removing ? " removing" : ""}`}>
      <div style={GROUPAGE_CARD_HEAD}>
        <span style={GROUPAGE_NUM_BADGE}>{String(index + 1).padStart(2, "0")}</span>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" onClick={() => onDuplicate(g.id)} className="pva-dup-btn" title={t("addEntry.duplicateGroupageBtn")}>
            <Copy size={12} /> {t("addEntry.duplicateGroupageBtn")}
          </button>
          <button type="button" onClick={() => onRemove(g.id)} className="pva-remove-btn" disabled={total === 1} aria-label="Remove groupage">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Row 1 */}
      <div style={GROUPAGE_SUBROW} className="pva-groupage-fields">
        <div style={GFIELD}>
          <label style={GLABEL}><Package size={11} /> {t("addEntry.fournisseur")} <span style={REQUIRED}>*</span></label>
          <input type="text" value={g.supplier} onChange={e => onUpdate(g.id, "supplier", e.target.value)} onBlur={() => onFieldBlur(g.id, "supplier")} placeholder={t("addEntry.fournisseurPlaceholder")} style={GROUPAGE_INPUT} className="pva-input" />
        </div>
        <div style={GFIELD}>
          <label style={GLABEL}><User size={11} /> {t("addEntry.client")} <span style={REQUIRED}>*</span></label>
          <input type="text" value={g.client} onChange={e => onUpdate(g.id, "client", e.target.value)} onBlur={() => onFieldBlur(g.id, "client")} placeholder={t("addEntry.clientPlaceholder")} style={GROUPAGE_INPUT} className="pva-input" />
        </div>
        <div style={GFIELD}>
          <label style={GLABEL}><FileSignature size={11} /> {t("addEntry.clientRef")}</label>
          <input type="text" value={g.clientRef} onChange={e => onUpdate(g.id, "clientRef", e.target.value)} placeholder={t("addEntry.clientRefPlaceholder")} style={{ ...GROUPAGE_INPUT, fontFamily: MONO }} className="pva-input" />
        </div>
      </div>

      {/* Row 2 */}
      <div style={GROUPAGE_SUBROW} className="pva-groupage-fields">
        <div style={GFIELD}>
          <label style={GLABEL}><Ship size={11} /> {t("addEntry.shipperName")}</label>
          <input type="text" list="pva-shippers" value={g.shipper} onChange={e => onUpdate(g.id, "shipper", e.target.value)} placeholder={t("addEntry.shipperPlaceholder")} style={GROUPAGE_INPUT} className="pva-input" />
        </div>
        <div style={GFIELD}>
          <label style={GLABEL}><Calendar size={11} /> {t("addEntry.bookingDate")}</label>
          <input type="date" value={g.bookingDate} onChange={e => onUpdate(g.id, "bookingDate", e.target.value)} style={GROUPAGE_INPUT} className="pva-input" />
        </div>
        <div style={GFIELD}>
          <label style={GLABEL}><Calendar size={11} /> {t("addEntry.pickupDate")}</label>
          <input type="date" value={g.pickupDate} onChange={e => onUpdate(g.id, "pickupDate", e.target.value)} onBlur={() => onFieldBlur(g.id, "pickupDate")} style={{ ...GROUPAGE_INPUT, ...(showErrors && gErr.pickupDate ? INPUT_ERROR : {}) }} className="pva-input" />
          {showErrors && gErr.pickupDate && <span style={GROUPAGE_ERROR_TEXT}>{gErr.pickupDate}</span>}
        </div>
      </div>

      {/* Row 3 */}
      <div style={GROUPAGE_SUBROW_4} className="pva-groupage-fields-4">
        <div style={GFIELD}>
          <label style={GLABEL}><Weight size={11} /> {t("addEntry.poids")}</label>
          <input type="text" value={g.weight} onChange={e => onUpdate(g.id, "weight", e.target.value)} placeholder={t("addEntry.poidsPlaceholder")} style={{ ...GROUPAGE_INPUT, fontFamily: MONO }} className="pva-input" />
        </div>
        <div style={GFIELD}>
          <label style={GLABEL}><Boxes size={11} /> {t("addEntry.colis")}</label>
          <input type="text" value={g.packages} onChange={e => onUpdate(g.id, "packages", e.target.value)} placeholder={t("addEntry.colisPlaceholder")} style={{ ...GROUPAGE_INPUT, fontFamily: MONO }} className="pva-input" />
        </div>
        <div style={GFIELD}>
          <label style={GLABEL}>{t("addEntry.achat")} <span style={OPTIONAL_TAG_SM}>{t("addEntry.optional")}</span></label>
          <div style={SELECT_WRAP}>
            <input type="text" value={g.achat} onChange={e => onUpdate(g.id, "achat", e.target.value)} onBlur={() => onFieldBlur(g.id, "achat")} placeholder="—" style={{ ...GROUPAGE_INPUT, fontFamily: MONO, paddingRight: 42, ...(showErrors && gErr.achat ? INPUT_ERROR : {}) }} className="pva-input" />
            <span style={CURRENCY_SUFFIX}>TND</span>
          </div>
          {showErrors && gErr.achat && <span style={GROUPAGE_ERROR_TEXT}>{gErr.achat}</span>}
        </div>
        <div style={GFIELD}>
          <label style={GLABEL}>{t("addEntry.vente")} <span style={OPTIONAL_TAG_SM}>{t("addEntry.optional")}</span></label>
          <div style={SELECT_WRAP}>
            <input type="text" value={g.vente} onChange={e => onUpdate(g.id, "vente", e.target.value)} onBlur={() => onFieldBlur(g.id, "vente")} placeholder="—" style={{ ...GROUPAGE_INPUT, fontFamily: MONO, paddingRight: 42, ...(showErrors && gErr.vente ? INPUT_ERROR : {}) }} className="pva-input" />
            <span style={CURRENCY_SUFFIX}>TND</span>
          </div>
          {showErrors && gErr.vente && <span style={GROUPAGE_ERROR_TEXT}>{gErr.vente}</span>}
        </div>
      </div>

      {/* Row 4 — volume, highlighted since it drives the loading diagram above */}
      <div className="pva-volume-row">
        <div style={GFIELD}>
          <label style={GLABEL}><Package size={11} /> {t("addEntry.volumeLabel")} <span style={OPTIONAL_TAG_SM}>{t("addEntry.optional")}</span></label>
          <div style={SELECT_WRAP}>
            <input
              type="text" value={g.volume}
              onChange={e => onUpdate(g.id, "volume", e.target.value)}
              onBlur={() => onFieldBlur(g.id, "volume")}
              placeholder={t("addEntry.volumePlaceholder")}
              style={{ ...GROUPAGE_INPUT, fontFamily: MONO, paddingRight: 34, maxWidth: 160, ...(showErrors && gErr.volume ? INPUT_ERROR : {}) }}
              className="pva-input"
            />
            <span style={{ ...CURRENCY_SUFFIX, right: 11 }}>m³</span>
          </div>
          {showErrors && gErr.volume && <span style={GROUPAGE_ERROR_TEXT}>{gErr.volume}</span>}
        </div>
        <span className="pva-volume-hint">{t("addEntry.volumeHelp")}</span>
      </div>
    </div>
  );
}

/* ── Progress stepper with an easing ship marker ── */
function Stepper({ step, progressPct, onStepClick, t }) {
  const labels = ["addEntry.stepContainerLabel", "addEntry.stepGroupagesLabel", "addEntry.stepReviewLabel"];
  return (
    <div style={STEPPER_WRAP}>
      <div style={STEPPER_TRACK}>
        <div style={{ ...STEPPER_TRACK_FILL, width: `${progressPct}%` }} />
        <div style={{ ...STEPPER_SHIP, left: `calc(${progressPct}% - 11px)` }}><Ship size={12} /></div>
      </div>
      <div style={STEPPER_LABELS}>
        {labels.map((key, i) => (
          <button
            key={key} type="button"
            onClick={() => i <= step && onStepClick(i)}
            className={`pva-step-label${i === step ? " active" : ""}${i < step ? " done" : ""}`}
          >
            <span className="pva-step-num">{i < step ? <CheckCircle size={10} /> : i + 1}</span>
            {t(key)}
          </button>
        ))}
      </div>
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

/* ── Draft restore banner ── */
function DraftBanner({ onRestore, onDiscard, t }) {
  return (
    <div style={DRAFT_BANNER}>
      <AlertCircle size={16} style={{ color: "#185FA5", flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#0B2A3D" }}>{t('addEntry.draftFoundTitle')}</div>
        <div style={{ fontSize: "0.78rem", color: "#6E7F87" }}>{t('addEntry.draftFoundSub')}</div>
      </div>
      <button type="button" className="pva-btn-secondary" onClick={onDiscard}>{t('addEntry.discardDraft')}</button>
      <button type="button" className="pva-btn-primary" onClick={onRestore}>{t('addEntry.restoreDraft')}</button>
    </div>
  );
}

/* ── Recap row (review + success screens) ── */
function RecapRow({ label, value }) {
  return (
    <div style={RECAP_ROW}>
      <span style={RECAP_LABEL}>{label}</span>
      <span style={RECAP_VALUE}>{value || "—"}</span>
    </div>
  );
}

/* ── Review step ── */
function ReviewStep({ data, onEdit, t }) {
  const { containerNumber, containerSize, agent, origin, arrivalPort, carrier, natureMarchandise, embarquementDate, eta, magasinageDate, groupages } = data;
  const validGroupages = groupages.filter(g => g.supplier.trim() && g.client.trim());
  return (
    <div style={CARD}>
      <div style={CARD_HEAD}>
        <Package size={15} style={{ color: "#2F7E6C" }} />
        <span style={CARD_TITLE}>{t('addEntry.reviewTitle')}</span>
      </div>
      <div style={{ padding: "18px 22px 22px" }}>
        <p style={{ fontSize: "0.85rem", color: "#6E7F87", marginBottom: 18 }}>{t('addEntry.reviewSubtitle')}</p>

        <ContainerVisual3D sizeFeet={containerSize} groupages={groupages} t={t} compact />

        <div style={{ ...RECAP_CARD, marginTop: 18 }}>
          <div style={RECAP_CARD_HEAD}>
            <span style={RECAP_CARD_TITLE}>{t('addEntry.recapContainerDetailsTitle')}</span>
            <button type="button" className="pva-edit-link" onClick={() => onEdit(0)}><Pencil size={11} /> {t('addEntry.editStep')}</button>
          </div>
          <div style={RECAP_CARD_BODY}>
            <RecapRow label={t('addEntry.recapContainerNumber')} value={<span style={{ fontFamily: MONO }}>{containerNumber}</span>} />
            <RecapRow label={t('addEntry.recapSize')} value={containerSize ? `${containerSize}'` : ""} />
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

        <div style={{ ...RECAP_CARD, marginBottom: 0 }}>
          <div style={RECAP_CARD_HEAD}>
            <span style={RECAP_CARD_TITLE}>{t('addEntry.recapGroupagesTitle')} ({validGroupages.length})</span>
            <button type="button" className="pva-edit-link" onClick={() => onEdit(1)}><Pencil size={11} /> {t('addEntry.editStep')}</button>
          </div>
          <div style={RECAP_CARD_BODY}>
            {validGroupages.map((g, i) => (
              <div key={g.id ?? i} style={RECAP_GROUPAGE}>
                <span style={RECAP_GROUPAGE_BADGE}>{String(i + 1).padStart(2, "0")}</span>
                <div style={RECAP_GROUPAGE_GRID}>
                  <RecapRow label={t('addEntry.recapFournisseur')} value={g.supplier} />
                  <RecapRow label={t('addEntry.recapClient')} value={g.client} />
                  <RecapRow label={t('addEntry.recapClientRef')} value={g.clientRef} />
                  <RecapRow label={t('addEntry.recapPoids')} value={g.weight ? `${g.weight} kg` : ""} />
                  <RecapRow label={t('addEntry.recapVolume')} value={g.volume ? `${g.volume} m³` : ""} />
                  <RecapRow label={t('addEntry.recapColis')} value={g.packages} />
                  <RecapRow label={t('addEntry.recapAchat')} value={g.achat ? `${g.achat} TND` : ""} />
                  <RecapRow label={t('addEntry.recapVente')} value={g.vente ? `${g.vente} TND` : ""} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Small celebratory burst on save (restrained, brand colors) ── */
function CelebrationBurst() {
  const dots = [
    { tx: "-42px", ty: "-28px", color: "#2F7E6C" }, { tx: "42px", ty: "-28px", color: "#C9912B" },
    { tx: "-54px", ty: "10px",  color: "#D6492F" }, { tx: "54px", ty: "10px",  color: "#2F7E6C" },
    { tx: "0px",   ty: "-50px", color: "#185FA5" }, { tx: "-26px", ty: "42px", color: "#C9912B" },
    { tx: "26px",  ty: "42px",  color: "#D6492F" }, { tx: "0px",  ty: "52px", color: "#2F7E6C" },
  ];
  return (
    <div className="pva-burst" aria-hidden="true">
      {dots.map((d, i) => (
        <span key={i} style={{ left: "50%", top: "50%", background: d.color, "--tx": d.tx, "--ty": d.ty, animationDelay: `${i * 0.02}s` }} />
      ))}
    </div>
  );
}

export default function AddEntry() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [containerNumber, setContainerNumber]   = useState("");
  const [containerSize, setContainerSize]       = useState("");
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
  const [busy, setBusy]                         = useState(false);
  const [saveError, setSaveError]               = useState("");

  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState({});
  const [stepAttempted, setStepAttempted] = useState(() => new Set());
  const [removingIds, setRemovingIds] = useState(() => new Set());
  const [existingNumbers, setExistingNumbers] = useState(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const draftRef = useRef(null);
  const hasCheckedDraft = useRef(false);

  const updateGroupage = (id, field, value) => setGroupages(gs => gs.map(g => g.id === id ? { ...g, [field]: value } : g));
  const addGroupage    = () => setGroupages(gs => [...gs, newGroupage()]);
  const duplicateGroupageAt = (id) => setGroupages(gs => {
    const idx = gs.findIndex(g => g.id === id);
    if (idx === -1) return gs;
    const next = [...gs];
    next.splice(idx + 1, 0, cloneGroupage(gs[idx]));
    return next;
  });
  const removeGroupage = (id) => {
    if (groupages.length === 1) return;
    setRemovingIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      setGroupages(gs => gs.filter(g => g.id !== id));
      setRemovingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }, 240);
  };
  const markGroupageTouched = (id, field) => setTouched(prev => ({ ...prev, [`g-${id}-${field}`]: true }));
  const markTouched = (name) => setTouched(prev => ({ ...prev, [name]: true }));

  /* ── Live duplicate-number check: load the fleet's numbers once, refresh on change ── */
  useEffect(() => {
    let mounted = true;
    function load() {
      storage.getContainers().then(list => {
        if (mounted) setExistingNumbers(new Set(list.map(c => normalizeContainerNumber(c.number))));
      }).catch(() => {});
    }
    load();
    const unsubscribe = storage.onChange(load);
    return () => { mounted = false; unsubscribe(); };
  }, []);

  /* ── Draft: detect an existing one on first mount ── */
  useEffect(() => {
    if (hasCheckedDraft.current) return;
    hasCheckedDraft.current = true;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!isSnapshotEmpty(parsed)) {
        draftRef.current = parsed;
        setShowDraftBanner(true);
      }
    } catch { /* malformed draft — ignore */ }
  }, []);

  /* ── Draft: autosave, debounced ── */
  useEffect(() => {
    if (showDraftBanner) return;
    const snapshot = getFormSnapshot({ containerNumber, containerSize, agent, origin, arrivalPort, carrier, natureMarchandise, embarquementDate, eta, magasinageDate, groupages, step });
    const timer = setTimeout(() => {
      if (isSnapshotEmpty(snapshot)) localStorage.removeItem(DRAFT_KEY);
      else localStorage.setItem(DRAFT_KEY, JSON.stringify(snapshot));
    }, 500);
    return () => clearTimeout(timer);
  }, [containerNumber, containerSize, agent, origin, arrivalPort, carrier, natureMarchandise, embarquementDate, eta, magasinageDate, groupages, step, showDraftBanner]);

  function restoreDraft() {
    const d = draftRef.current;
    setShowDraftBanner(false);
    if (!d) return;
    setContainerNumber(d.containerNumber || ""); setContainerSize(d.containerSize || ""); setAgent(d.agent || ""); setOrigin(d.origin || "");
    setArrivalPort(d.arrivalPort || ""); setCarrier(d.carrier || ""); setNatureMarchandise(d.natureMarchandise || "");
    setEmbarquementDate(d.embarquementDate || ""); setEta(d.eta || ""); setMagasinageDate(d.magasinageDate || "");
    setGroupages(d.groupages?.length ? reindexGroupages(d.groupages) : [newGroupage()]);
    setStep(d.step || 0);
  }
  function discardDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setShowDraftBanner(false);
  }

  /* ── Live validation — recomputed on every change, revealed via `touched`/`stepAttempted` ── */
  const errors = useMemo(() => {
    const e = {};
    const trimmedNumber = containerNumber.trim();
    const numCheck = validateContainerNumber(trimmedNumber);
    if (!trimmedNumber) e.containerNumber = t('addEntry.errContainerNumberRequired');
    else if (numCheck.status === "bad_format" || numCheck.status === "incomplete") e.containerNumber = t('addEntry.errContainerNumberFormat');
    if (!containerSize) e.containerSize = t('addEntry.errContainerSizeRequired');
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
      if (!isValidVolume(g.volume)) gErr.volume = t('addEntry.errVolumeFormat');
      if (Object.keys(gErr).length > 0) groupageErrors[g.id] = gErr;
    });
    if (Object.keys(groupageErrors).length > 0) { e.groupageFields = groupageErrors; e.groupages = e.groupages || t('addEntry.errGroupagesFixHighlighted'); }
    return e;
  }, [containerNumber, containerSize, agent, origin, arrivalPort, eta, embarquementDate, magasinageDate, groupages, t]);

  const showErr = (name) => Boolean(touched[name] || stepAttempted.has(0));
  const groupagesTouched = stepAttempted.has(1) || Object.keys(touched).some(k => k.startsWith("g-"));

  function goNext() {
    setStepAttempted(prev => new Set(prev).add(step));
    if (!stepHasErrors(step, errors)) setStep(s => Math.min(s + 1, 2));
  }
  function goBack() { setStep(s => Math.max(s - 1, 0)); }
  function jumpToStep(i) { if (i <= step) setStep(i); }

  const handleSubmit = async (ev) => {
    if (ev?.preventDefault) ev.preventDefault();
    setStepAttempted(new Set([0, 1, 2]));
    if (stepHasErrors(0, errors)) { setStep(0); return; }
    if (stepHasErrors(1, errors)) { setStep(1); return; }

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
        // No dedicated "size" column exists yet — stored in metadata,
        // which both storage backends already pass through untouched.
        metadata: { size: containerSize },
        // Codes, not literal text — ContainerDetail translates these.
        timeline: [
          { step: "departed",   date: embarquementDate || null, done: !!embarquementDate },
          { step: "in_transit", date: null, current: true  },
          { step: "arrived",    date: null, done: false    },
        ],
      });

      localStorage.removeItem(DRAFT_KEY);
      setSavedContainer(saved);
      setSubmitted(true);
    } catch (err) {
      setSaveError(err.message || t('addEntry.errSaveFailed'));
    } finally {
      setBusy(false);
    }
  };

  /* ── Ctrl/Cmd+Enter: continue on steps 1–2, save on the review step ── */
  useEffect(() => {
    if (submitted) return;
    function handleKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (step < 2) goNext(); else handleSubmit();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, errors, submitted, containerNumber, agent, origin, arrivalPort, carrier, natureMarchandise, embarquementDate, eta, magasinageDate, groupages]);

  const resetForm = () => {
    setContainerNumber(""); setContainerSize(""); setAgent(""); setOrigin(""); setArrivalPort("");
    setCarrier(""); setNatureMarchandise(""); setEmbarquementDate(""); setEta(""); setMagasinageDate(""); setGroupages([newGroupage()]);
    setSubmitted(false); setSavedContainer(null); setSaveError("");
    setStep(0); setTouched({}); setStepAttempted(new Set());
    localStorage.removeItem(DRAFT_KEY);
  };

  const validGroupageCount = groupages.filter(g => g.supplier.trim() && g.client.trim()).length;

  /* ── Progress: how far along the current step is, for the ship marker ── */
  const stepFraction = useMemo(() => {
    if (step === 0) {
      const fields = [containerNumber.trim(), containerSize, agent.trim(), arrivalPort, eta];
      return fields.filter(Boolean).length / fields.length;
    }
    if (step === 1) return validGroupageCount > 0 ? 1 : 0;
    return 1;
  }, [step, containerNumber, containerSize, agent, arrivalPort, eta, validGroupageCount]);
  const progressPct = Math.min(100, Math.round(((step + stepFraction) / STEP_KEYS.length) * 100));

  /* ── Success / confirmation screen ── */
  if (submitted && savedContainer) {
    const savedGroupages = savedContainer.groupages || [];
    return (
      <div style={ROOT}>
        <style>{CSS}</style>
        <div style={SUCCESS_WRAP}>
          <div style={SUCCESS_ICON}>
            <CheckCircle size={28} />
            <CelebrationBurst />
          </div>
          <h1 style={SUCCESS_H1}>{t('addEntry.successTitle')}</h1>
          <p style={SUCCESS_SUB}>
            <span style={{ fontFamily: MONO, fontWeight: 600, color: "#1C2B33" }}>{savedContainer.number}</span>
            {" "}{t('addEntry.successSaved')} {validGroupageCount} {validGroupageCount !== 1 ? t('addEntry.successGroupagePlural') : t('addEntry.successGroupageSingular')}. {t('addEntry.successRecorded')}
          </p>

          <div className="pva-visual-pop">
            <ContainerVisual3D sizeFeet={containerSize} groupages={groupages} t={t} />
          </div>

          <div style={RECAP_CARD}>
            <div style={RECAP_CARD_HEAD}>
              <Package size={14} style={{ color: "#2F7E6C" }} />
              <span style={RECAP_CARD_TITLE}>{t('addEntry.recapContainerDetailsTitle')}</span>
            </div>
            <div style={RECAP_CARD_BODY}>
              <RecapRow label={t('addEntry.recapContainerNumber')} value={<span style={{ fontFamily: MONO }}>{savedContainer.number}</span>} />
              <RecapRow label={t('addEntry.recapSize')} value={containerSize ? `${containerSize}'` : ""} />
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
                      <RecapRow label={t('addEntry.recapVolume')} value={g.volume ? `${g.volume} m³` : ""} />
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

      <div style={FORM_WRAP}>
        {showDraftBanner && <DraftBanner onRestore={restoreDraft} onDiscard={discardDraft} t={t} />}

        <Stepper step={step} progressPct={progressPct} onStepClick={jumpToStep} t={t} />

        <form onSubmit={handleSubmit}>
          <div key={step} className="pva-step-panel">

            {step === 0 && (
              <div style={CARD}>
                <div style={CARD_HEAD}>
                  <Package size={15} style={{ color: "#2F7E6C" }} />
                  <span style={CARD_TITLE}>{t('addEntry.containerDetailsTitle')}</span>
                </div>
                <div style={CARD_BODY}>

                  <div className="pva-size-picker">
                    <label style={LABEL}>{t('addEntry.containerSize')} <span style={REQUIRED}>*</span></label>
                    <div className="pva-size-cards">
                      {["20", "40"].map(sz => (
                        <button
                          key={sz}
                          type="button"
                          className={`pva-size-card${containerSize === sz ? " selected" : ""}`}
                          onClick={() => { setContainerSize(sz); markTouched("containerSize"); }}
                        >
                          <span className="pva-size-card-icon" style={{ width: sz === "40" ? 58 : 30 }} />
                          <span className="pva-size-card-label">{sz === "20" ? t('addEntry.size20') : t('addEntry.size40')}</span>
                          <span className="pva-size-card-capacity">{CAPACITY_M3[sz]} m³</span>
                        </button>
                      ))}
                    </div>
                    {showErr("containerSize") && errors.containerSize && <span style={ERROR_TEXT}>{errors.containerSize}</span>}
                    {containerSize && (
                      <div className="pva-visual-pop">
                        <ContainerVisual3D sizeFeet={containerSize} groupages={groupages} t={t} compact />
                      </div>
                    )}
                  </div>

                  <div style={FIELD_ROW_3} className="pva-field-row-3">
                    <ContainerNumberField
                      value={containerNumber}
                      onChange={setContainerNumber}
                      onFieldBlur={() => markTouched("containerNumber")}
                      error={errors.containerNumber}
                      showError={showErr("containerNumber")}
                      existingNumbers={existingNumbers}
                      t={t}
                    />
                    <div style={FIELD}>
                      <label style={LABEL}>{t('addEntry.agent')} <span style={REQUIRED}>*</span></label>
                      <AutocompleteInput value={agent} onChange={setAgent} options={AGENTS} placeholder={t('addEntry.agentPlaceholder')} icon={User} error={showErr("agent") && errors.agent} onFieldBlur={() => markTouched("agent")} />
                      {showErr("agent") && errors.agent && <span style={ERROR_TEXT}>{errors.agent}</span>}
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
                        <select value={arrivalPort} onChange={e => setArrivalPort(e.target.value)} onBlur={() => markTouched("arrivalPort")} style={{ ...SELECT, ...(showErr("arrivalPort") && errors.arrivalPort ? INPUT_ERROR : {}) }} className="pva-input">
                          <option value="">{t('addEntry.podSelectPlaceholder')}</option>
                          {ARRIVAL_PORTS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      {showErr("arrivalPort") && errors.arrivalPort && <span style={ERROR_TEXT}>{errors.arrivalPort}</span>}
                    </div>
                    <div style={FIELD}>
                      <label style={LABEL}>{t('addEntry.dateEmbarquement')}</label>
                      <div style={SELECT_WRAP}>
                        <Calendar size={14} style={SELECT_ICON} />
                        <input type="date" value={embarquementDate} onChange={e => setEmbarquementDate(e.target.value)} onBlur={() => markTouched("embarquementDate")} style={{ ...SELECT, ...(showErr("embarquementDate") && errors.embarquementDate ? INPUT_ERROR : {}) }} className="pva-input" />
                      </div>
                      {showErr("embarquementDate") && errors.embarquementDate && <span style={ERROR_TEXT}>{errors.embarquementDate}</span>}
                      <span style={HELP_TEXT}>{t('addEntry.dateEmbarquementHelp')}</span>
                    </div>
                  </div>

                  <div style={FIELD_ROW_3} className="pva-field-row-3">
                    <div style={FIELD}>
                      <label style={LABEL}>{t('addEntry.eta')} <span style={REQUIRED}>*</span></label>
                      <div style={SELECT_WRAP}>
                        <Calendar size={14} style={SELECT_ICON} />
                        <input type="date" value={eta} onChange={e => setEta(e.target.value)} onBlur={() => markTouched("eta")} style={{ ...SELECT, ...(showErr("eta") && errors.eta ? INPUT_ERROR : {}) }} className="pva-input" />
                      </div>
                      {showErr("eta") && errors.eta && <span style={ERROR_TEXT}>{errors.eta}</span>}
                      <span style={HELP_TEXT}>{t('addEntry.etaHelp')}</span>
                    </div>
                    <div style={FIELD}>
                      <label style={LABEL}>{t('addEntry.dateMagasinage')} <span style={OPTIONAL_TAG}>{t('addEntry.optional')}</span></label>
                      <div style={SELECT_WRAP}>
                        <Calendar size={14} style={SELECT_ICON} />
                        <input type="date" value={magasinageDate} onChange={e => setMagasinageDate(e.target.value)} onBlur={() => markTouched("magasinageDate")} style={{ ...SELECT, ...(showErr("magasinageDate") && errors.magasinageDate ? INPUT_ERROR : {}) }} className="pva-input" />
                      </div>
                      {showErr("magasinageDate") && errors.magasinageDate && <span style={ERROR_TEXT}>{errors.magasinageDate}</span>}
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

                </div>
              </div>
            )}

            {step === 1 && (
              <div style={CARD}>
                <div style={CARD_HEAD}>
                  <Package size={15} style={{ color: "#185FA5" }} />
                  <span style={CARD_TITLE}>{t('addEntry.groupagesTitle')}</span>
                  <span style={CARD_COUNT}>{groupages.length}</span>
                </div>

                <div className="pva-loading-diagram">
                  <p style={{ ...LABEL, marginBottom: 10 }}>{t('addEntry.loadingDiagramTitle')}</p>
                  <ContainerVisual3D sizeFeet={containerSize} groupages={groupages} t={t} />
                </div>

                {groupagesTouched && errors.groupages && (
                  <div style={GROUPAGE_ERROR_BANNER}><AlertCircle size={14} /> {errors.groupages}</div>
                )}

                <div style={GROUPAGE_LIST}>
                  {groupages.map((g, i) => (
                    <GroupageCard
                      key={g.id} g={g} index={i} total={groupages.length}
                      errors={errors} showErrors={groupagesTouched}
                      onUpdate={updateGroupage} onRemove={removeGroupage}
                      onDuplicate={duplicateGroupageAt} onFieldBlur={markGroupageTouched}
                      removing={removingIds.has(g.id)} t={t}
                    />
                  ))}
                </div>

                <datalist id="pva-shippers">{SHIPPERS.map(s => <option key={s} value={s} />)}</datalist>

                <button type="button" onClick={addGroupage} className="pva-add-btn">
                  <Plus size={15} /> {t('addEntry.addGroupage')}
                </button>
              </div>
            )}

            {step === 2 && (
              <ReviewStep
                data={{ containerNumber, agent, origin, arrivalPort, carrier, natureMarchandise, embarquementDate, eta, magasinageDate, groupages }}
                onEdit={jumpToStep}
                t={t}
              />
            )}
          </div>

          {saveError && step === 2 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#FBEAE4", border: "1px solid rgba(214,73,47,.3)", borderRadius: 8, color: "#a13a26", fontSize: "0.8rem", marginTop: 16 }}>
              <AlertCircle size={14} /> {saveError}
            </div>
          )}

          <div style={SUBMIT_ROW}>
            <div>
              {step === 0 && <button type="button" className="pva-btn-secondary" onClick={() => navigate(-1)}>{t('addEntry.cancel')}</button>}
              {step > 0 && <button type="button" className="pva-btn-secondary" onClick={goBack}><ArrowLeft size={14} /> {t('addEntry.backStepButton')}</button>}
            </div>
            <div>
              {step < 2 && <button type="button" className="pva-btn-primary" onClick={goNext}>{t('addEntry.continueButton')} <ArrowRight size={14} /></button>}
              {step === 2 && <button type="submit" className="pva-btn-primary" disabled={busy}>{busy ? t('addEntry.saving') : t('addEntry.save')}</button>}
            </div>
          </div>
          <p style={KEYBOARD_HINT}>{step < 2 ? t('addEntry.keyboardHintContinue') : t('addEntry.keyboardHintSubmit')}</p>
        </form>
      </div>
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
const HINT_WARN    = { display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem", color: "#854F0B" };
const VALID_TICK   = { position: "absolute", right: 12, color: "#2F7E6C" };
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
const SUBMIT_ROW          = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 8 };
const KEYBOARD_HINT       = { fontFamily: MONO, fontSize: "0.68rem", color: "#A8A39A", textAlign: "right", marginTop: 8 };
const SUCCESS_WRAP        = { maxWidth: 620, margin: "0 auto", padding: "80px 24px 100px", textAlign: "center" };
const SUCCESS_ICON        = { position: "relative", width: 56, height: 56, borderRadius: "50%", background: "#EAF3DE", color: "#3B6D11", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" };
const SUCCESS_H1          = { fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "1.6rem", color: "#0B2A3D", marginBottom: 10 };
const SUCCESS_SUB         = { fontSize: "0.9rem", color: "#6E7F87", lineHeight: 1.6, marginBottom: 28 };
const SUCCESS_ACTIONS     = { display: "flex", gap: 12, justifyContent: "center", marginTop: 8 };

/* Stepper */
const STEPPER_WRAP       = { marginBottom: 28 };
const STEPPER_TRACK      = { position: "relative", height: 4, background: "rgba(11,42,61,0.1)", borderRadius: 2, marginBottom: 16 };
const STEPPER_TRACK_FILL = { position: "absolute", top: 0, left: 0, height: "100%", background: "#2F7E6C", borderRadius: 2, transition: "width .35s ease" };
const STEPPER_SHIP       = { position: "absolute", top: -9, width: 22, height: 22, borderRadius: "50%", background: "#0B2A3D", color: "#DCE6EA", display: "flex", alignItems: "center", justifyContent: "center", transition: "left .35s ease", boxShadow: "0 2px 6px rgba(11,42,61,.3)" };
const STEPPER_LABELS     = { display: "flex", justifyContent: "space-between" };

/* Draft banner */
const DRAFT_BANNER = { display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: "#E6F1FB", border: "1px solid rgba(24,95,165,0.25)", borderRadius: 10, marginBottom: 20 };

/* Recap / review card styles */
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
.pva-dup-btn { display: flex; align-items: center; gap: 5px; padding: 6px 10px; background: none; border: 1px solid rgba(24,95,165,0.3); border-radius: 6px; color: #185FA5; font-size: 0.7rem; cursor: pointer; transition: background .15s; white-space: nowrap; }
.pva-dup-btn:hover { background: rgba(24,95,165,0.08); }
.pva-edit-link { display: flex; align-items: center; gap: 5px; margin-left: auto; background: none; border: none; color: #185FA5; font-size: 0.74rem; cursor: pointer; font-family: 'IBM Plex Sans', sans-serif; padding: 0; }
.pva-edit-link:hover { text-decoration: underline; }
.pva-btn-primary { display: inline-flex; align-items: center; gap: 7px; padding: 12px 26px; border-radius: 8px; border: none; background: #0B2A3D; color: #DCE6EA; font-weight: 600; font-family: 'IBM Plex Sans', sans-serif; font-size: 0.88rem; cursor: pointer; transition: background .15s; }
.pva-btn-primary:hover:not(:disabled) { background: #163d54; }
.pva-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.pva-btn-secondary { display: inline-flex; align-items: center; gap: 7px; padding: 12px 22px; border-radius: 8px; border: 1px solid rgba(11,42,61,0.22); background: #fff; color: #1C2B33; font-family: 'IBM Plex Sans', sans-serif; font-size: 0.88rem; cursor: pointer; transition: background .15s; }
.pva-btn-secondary:hover { background: #F1EFE8; }

.pva-step-label { display: flex; align-items: center; gap: 6px; background: none; border: none; padding: 0; font-family: 'IBM Plex Mono', monospace; font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase; color: #A8A39A; cursor: default; }
.pva-step-label.active { color: #0B2A3D; font-weight: 700; }
.pva-step-label.done { color: #2F7E6C; cursor: pointer; }
.pva-step-num { display: flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 50%; background: rgba(11,42,61,0.08); font-size: 0.6rem; flex-shrink: 0; }
.pva-step-label.active .pva-step-num { background: #0B2A3D; color: #DCE6EA; }
.pva-step-label.done .pva-step-num { background: #2F7E6C; color: #fff; }

.pva-step-panel { animation: pva-panel-in .28s ease; }
@keyframes pva-panel-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.pva-groupage-card { animation: pva-card-in .25s ease; overflow: hidden; transition: max-height .24s ease, opacity .24s ease, margin .24s ease, padding .24s ease; max-height: 900px; }
@keyframes pva-card-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
.pva-groupage-card.removing { max-height: 0 !important; opacity: 0; margin-bottom: 0 !important; padding-top: 0 !important; padding-bottom: 0 !important; border-width: 0; }

.pva-burst { position: absolute; inset: 0; pointer-events: none; }
.pva-burst span { position: absolute; width: 6px; height: 6px; border-radius: 50%; opacity: 0; animation: pva-burst-out .7s ease-out forwards; }
@keyframes pva-burst-out { 0% { opacity: 1; transform: translate(0,0) scale(1); } 100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(.4); } }

/* Container size picker */
.pva-size-picker { margin-bottom: 22px; }
.pva-size-cards { display: flex; gap: 12px; margin-top: 8px; }
.pva-size-card { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 14px 22px; background: #fff; border: 1.5px solid rgba(11,42,61,0.16); border-radius: 10px; cursor: pointer; transition: border-color .15s, background .15s, transform .1s; font-family: 'IBM Plex Sans', sans-serif; }
.pva-size-card:hover { border-color: rgba(24,95,165,0.5); transform: translateY(-1px); }
.pva-size-card.selected { border-color: #185FA5; background: #E6F1FB; }
.pva-size-card-icon { height: 20px; background: #0B2A3D; border-radius: 3px; transition: width .2s ease; }
.pva-size-card.selected .pva-size-card-icon { background: #185FA5; }
.pva-size-card-label { font-size: 0.82rem; font-weight: 600; color: #1C2B33; }
.pva-size-card-capacity { font-family: 'IBM Plex Mono', monospace; font-size: 0.66rem; color: #6E7F87; }

/* Container loading diagram */
.pva-loading-diagram { padding: 0 22px 16px; }
.pva-container-visual { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.pva-container-visual-readout { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 12px; }
.pva-container-visual-pct { font-family: 'IBM Plex Mono', monospace; font-size: 0.78rem; font-weight: 700; }
.pva-container-visual-warn { display: flex; align-items: center; gap: 5px; font-family: 'IBM Plex Mono', monospace; font-size: 0.7rem; color: #D6492F; }
.pva-container-visual-hint { font-family: 'IBM Plex Mono', monospace; font-size: 0.7rem; color: #A8A39A; }

/* Volume field row — highlighted since it drives the diagram above */
.pva-volume-row { display: flex; align-items: flex-end; gap: 14px; margin-top: 10px; padding: 10px 12px; background: rgba(24,95,165,0.05); border: 1px dashed rgba(24,95,165,0.25); border-radius: 8px; }
.pva-volume-hint { font-size: 0.72rem; color: #6E7F87; line-height: 1.4; padding-bottom: 8px; }

/* Small entrance pop for standalone preview visuals (step 0, success screen) */
.pva-visual-pop { animation: pva-visual-pop .35s ease; margin-top: 14px; }
@keyframes pva-visual-pop { from { opacity: 0; transform: scale(.94) translateY(4px); } to { opacity: 1; transform: scale(1) translateY(0); } }

@media (max-width: 640px) { .pva-size-cards { flex-wrap: wrap; } .pva-volume-row { flex-direction: column; align-items: flex-start; } }

@media (max-width: 900px) { .pva-field-row-3 { grid-template-columns: 1fr 1fr !important; } .pva-groupage-fields-4 { grid-template-columns: 1fr 1fr !important; } }
@media (max-width: 640px) { .pva-groupage-fields { grid-template-columns: 1fr !important; } .pva-groupage-fields-4 { grid-template-columns: 1fr !important; } .pva-field-row-3 { grid-template-columns: 1fr !important; } .pva-dup-btn span { display: none; } }
`;
