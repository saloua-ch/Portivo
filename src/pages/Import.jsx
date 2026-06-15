import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  RefreshCw,
  Trash2,
  Clock,
} from "lucide-react";
import TopNav from "../components/TopNav";

// ─── Styles ────────────────────────────────────────────────────────────────

const S = {
  // Hero
  hero: {
    background: "#0f1f2e",
    padding: 0,
    position: "relative",
    overflow: "hidden",
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.12em",
    color: "#5a8fb0",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: 500,
    color: "#f0ede6",
    lineHeight: 1.1,
    marginBottom: 10,
    margin: "0 0 10px",
  },
  heroSub: {
    fontSize: 14,
    color: "#7a9ab5",
    maxWidth: 480,
    lineHeight: 1.6,
    margin: 0,
  },
  heroLegend: {
    display: "flex",
    gap: 20,
    marginTop: 20,
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#5a8fb0",
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    flexShrink: 0,
  },
  // Deco
  heroDeco: {
    position: "absolute",
    right: 40,
    top: 20,
    opacity: 0.18,
    display: "flex",
    gap: 6,
  },
  decoStack: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  // Stat bar
  statBar: {
    background: "#f0ede6",
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    borderBottom: "1px solid #d3d1c7",
  },
  statItem: {
    padding: "16px 24px",
    borderRight: "0.5px solid #d3d1c7",
  },
  statVal: {
    fontSize: 26,
    fontWeight: 500,
    color: "#1a1f36",
    lineHeight: 1,
    marginBottom: 4,
    fontVariantNumeric: "tabular-nums",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#888780",
  },
  // Body
  body: {
    background: "#f8f6f1",
    minHeight: 400,
    padding: "32px 40px",
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#888780",
    marginBottom: 14,
  },
  // Drop zone
  dropZone: (isDragging) => ({
    border: `2px dashed ${isDragging ? "#185FA5" : "#c5c2b8"}`,
    borderRadius: 14,
    padding: "48px 32px",
    textAlign: "center",
    cursor: "pointer",
    background: isDragging ? "#f0f6fd" : "#fff",
    transition: "all 0.15s",
    marginBottom: 28,
  }),
  dropIcon: (isDragging) => ({
    width: 52,
    height: 52,
    borderRadius: 12,
    background: isDragging ? "#185FA5" : "#E6F1FB",
    color: isDragging ? "#fff" : "#185FA5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 14px",
    transition: "all 0.15s",
  }),
  dropTitle: {
    fontSize: 15,
    fontWeight: 500,
    color: "#1a1f36",
    margin: "0 0 6px",
  },
  dropSub: {
    fontSize: 13,
    color: "#888780",
    margin: "0 0 16px",
  },
  dropBtn: {
    fontSize: 12,
    padding: "5px 16px",
    borderRadius: 20,
    border: "0.5px solid #d3d1c7",
    color: "#888780",
    background: "#f8f6f1",
    display: "inline-block",
  },
  // Preview
  previewBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "13px 20px",
    background: "#EAF3DE",
    border: "0.5px solid #C0DD97",
    borderRadius: "12px 12px 0 0",
  },
  previewBarLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 500,
    color: "#3B6D11",
  },
  previewBarRight: {
    display: "flex",
    gap: 14,
    fontSize: 12,
    color: "#3B6D11",
  },
  previewTable: {
    background: "#fff",
    border: "0.5px solid #d3d1c7",
    borderTop: "none",
    borderRadius: "0 0 12px 12px",
    overflow: "hidden",
    marginBottom: 14,
  },
  ptHead: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 90px",
    padding: "10px 20px",
    fontSize: 10,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#888780",
    background: "#fafaf8",
    borderBottom: "0.5px solid #ece9e2",
  },
  ptRow: (isLast) => ({
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 90px",
    padding: "13px 20px",
    alignItems: "center",
    borderBottom: isLast ? "none" : "0.5px solid #f0ede6",
  }),
  ptNum: {
    fontSize: 13,
    fontWeight: 500,
    color: "#1a1f36",
    fontFamily: "'Courier New', monospace",
    letterSpacing: "0.02em",
  },
  ptMeta: {
    fontSize: 12,
    color: "#888780",
  },
  badgeNew: {
    fontSize: 11,
    padding: "3px 10px",
    borderRadius: 20,
    fontWeight: 500,
    display: "inline-block",
    background: "#EAF3DE",
    color: "#3B6D11",
  },
  badgeUpdate: {
    fontSize: 11,
    padding: "3px 10px",
    borderRadius: 20,
    fontWeight: 500,
    display: "inline-block",
    background: "#E6F1FB",
    color: "#185FA5",
  },
  // Actions
  actionRow: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
    marginBottom: 28,
  },
  btnDiscard: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 18px",
    borderRadius: 8,
    border: "0.5px solid #d3d1c7",
    background: "#fff",
    cursor: "pointer",
    fontSize: 13,
    color: "#888780",
  },
  btnConfirm: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 22px",
    borderRadius: 8,
    border: "none",
    background: "#0f1f2e",
    cursor: "pointer",
    fontSize: 13,
    color: "#f0ede6",
    fontWeight: 500,
  },
  // Success
  successBanner: {
    background: "#EAF3DE",
    border: "0.5px solid #C0DD97",
    borderRadius: 12,
    padding: "22px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 28,
  },
  successIcon: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "#1D9E75",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color: "#fff",
  },
  // History
  historyCard: {
    background: "#fff",
    border: "0.5px solid #d3d1c7",
    borderRadius: 12,
    overflow: "hidden",
  },
  historyRow: (isLast) => ({
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 20px",
    borderBottom: isLast ? "none" : "0.5px solid #f0ede6",
  }),
  historyIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    background: "#EAF3DE",
    color: "#3B6D11",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  historyTime: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11,
    color: "#b0b8cc",
    justifyContent: "flex-end",
    marginBottom: 4,
  },
  historyBadge: {
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 20,
    background: "#EAF3DE",
    color: "#3B6D11",
    fontWeight: 500,
  },
};

// ─── Initial history data ──────────────────────────────────────────────────

const INITIAL_HISTORY = [
  {
    filename: "containers_juin_2026.xlsx",
    uploadedAt: "2026-06-01 09:14",
    containers: 8,
    groupages: 21,
  },
  {
    filename: "containers_mai_2026.xlsx",
    uploadedAt: "2026-05-02 11:03",
    containers: 11,
    groupages: 34,
  },
  {
    filename: "containers_avril_2026.xlsx",
    uploadedAt: "2026-04-01 08:47",
    containers: 9,
    groupages: 27,
  },
];

const EXISTING_NUMBERS = ["MSCU7654321", "CMAU1234567"];

// ─── Sub-components ────────────────────────────────────────────────────────

function HeroDeco() {
  const box = (bg, w = 36, h = 22) => (
    <div style={{ background: bg, width: w, height: h, borderRadius: 3 }} />
  );
  return (
    <div style={S.heroDeco}>
      <div style={S.decoStack}>
        {box("#1D9E75")}
        {box("#185FA5")}
        {box("#BA7517")}
      </div>
      <div style={{ ...S.decoStack, marginTop: 14 }}>
        {box("#3B6D11")}
        {box("#0f4a7a")}
        {box("#633806")}
      </div>
      <div style={{ ...S.decoStack, marginTop: 28 }}>
        {box("#185FA5")}
        {box("#1D9E75")}
      </div>
    </div>
  );
}

function FileDropZone({ onFile, isDragging, setIsDragging }) {
  const inputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current.click()}
      style={S.dropZone(isDragging)}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: "none" }}
        onChange={(e) => { if (e.target.files[0]) onFile(e.target.files[0]); }}
      />
      <div style={S.dropIcon(isDragging)}>
        <Upload size={22} />
      </div>
      <p style={S.dropTitle}>
        {isDragging ? "Drop to import" : "Drop your Excel file here"}
      </p>
      <p style={S.dropSub}>or click to browse — .xlsx and .xls supported</p>
      <span style={S.dropBtn}>Browse files</span>
    </div>
  );
}

function PreviewTable({ rows, filename, onConfirm, onDiscard }) {
  const newCount = rows.filter((r) => r.isNew).length;
  const updateCount = rows.filter((r) => !r.isNew).length;

  return (
    <div style={{ marginBottom: 28 }}>
      <p style={S.sectionLabel}>Preview — {filename}</p>

      <div style={S.previewBar}>
        <div style={S.previewBarLeft}>
          <FileSpreadsheet size={16} />
          {filename}
        </div>
        <div style={S.previewBarRight}>
          {newCount > 0 && <span>✦ {newCount} new</span>}
          {updateCount > 0 && (
            <span>↻ {updateCount} update{updateCount > 1 ? "s" : ""}</span>
          )}
        </div>
      </div>

      <div style={S.previewTable}>
        <div style={S.ptHead}>
          <span>Container number</span>
          <span>Groupages</span>
          <span>Origin</span>
          <span>Type</span>
        </div>
        {rows.map((row, i) => (
          <div key={i} style={S.ptRow(i === rows.length - 1)}>
            <span style={S.ptNum}>{row.number}</span>
            <span style={S.ptMeta}>
              {row.groupages} groupage{row.groupages !== 1 ? "s" : ""}
            </span>
            <span style={S.ptMeta}>{row.origin}</span>
            <span style={row.isNew ? S.badgeNew : S.badgeUpdate}>
              {row.isNew ? "New" : "Update"}
            </span>
          </div>
        ))}
      </div>

      <div style={S.actionRow}>
        <button onClick={onDiscard} style={S.btnDiscard}>
          <Trash2 size={14} /> Discard
        </button>
        <button onClick={onConfirm} style={S.btnConfirm}>
          <CheckCircle size={14} /> Confirm & save all
        </button>
      </div>
    </div>
  );
}

function SuccessBanner({ filename, count, onReset }) {
  return (
    <div style={S.successBanner}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={S.successIcon}>
          <CheckCircle size={20} />
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 500, color: "#3B6D11", margin: "0 0 2px" }}>
            Import successful
          </p>
          <p style={{ fontSize: 13, color: "#3B6D11", margin: 0 }}>
            {count} container{count !== 1 ? "s" : ""} saved from {filename}
          </p>
        </div>
      </div>
      <button
        onClick={onReset}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 16px", borderRadius: 8,
          border: "0.5px solid #97C459", background: "#fff",
          cursor: "pointer", fontSize: 13, color: "#3B6D11",
        }}
      >
        <RefreshCw size={13} /> Import another
      </button>
    </div>
  );
}

function HistoryList({ history }) {
  const totalContainers = history.reduce((s, h) => s + h.containers, 0);
  const totalGroupages = history.reduce((s, h) => s + h.groupages, 0);
  const lastImport = history[0]
    ? history[0].filename.replace("containers_", "").replace(".xlsx", "").replace("_", " ")
    : "—";

  return (
    <>
      {/* Stat bar */}
      <div style={S.statBar}>
        <div style={S.statItem}>
          <div style={S.statVal}>{history.length}</div>
          <div style={S.statLabel}>Files imported</div>
        </div>
        <div style={S.statItem}>
          <div style={S.statVal}>{totalContainers}</div>
          <div style={S.statLabel}>Total containers</div>
        </div>
        <div style={{ ...S.statItem }}>
          <div style={{ ...S.statVal, color: "#3B6D11" }}>{totalGroupages}</div>
          <div style={S.statLabel}>Groupages added</div>
        </div>
        <div style={{ ...S.statItem, borderRight: "none" }}>
          <div style={{ ...S.statVal, color: "#BA7517", fontSize: 20, paddingTop: 3 }}>
            {lastImport}
          </div>
          <div style={S.statLabel}>Last import</div>
        </div>
      </div>

      {/* History rows */}
      <div style={S.body}>
        <p style={S.sectionLabel}>Import history</p>
        <div style={S.historyCard}>
          {history.map((item, i) => (
            <div key={i} style={S.historyRow(i === history.length - 1)}>
              <div style={S.historyIcon}>
                <FileSpreadsheet size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#1a1f36", margin: "0 0 2px" }}>
                  {item.filename}
                </p>
                <p style={{ fontSize: 12, color: "#888780", margin: 0 }}>
                  {item.containers} containers · {item.groupages} groupages
                </p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={S.historyTime}>
                  <Clock size={11} />
                  {item.uploadedAt}
                </div>
                <span style={S.historyBadge}>Imported</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export default function Import() {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [history, setHistory] = useState(INITIAL_HISTORY);

  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (raw.length === 0) {
          alert("No data found in this file. Make sure your Excel has headers.");
          return;
        }

        const get = (row, ...names) => {
          for (const n of names) {
            const k = Object.keys(row).find((k) => k.toLowerCase().includes(n));
            if (k) return String(row[k]).trim();
          }
          return "—";
        };

        const rows = raw.map((row) => {
          const number = get(row, "container", "number", "ctr", "num");
          const origin = get(row, "origin", "port", "loading", "from", "pol");
          const groupages = parseInt(get(row, "groupage", "shipment", "count", "qty")) || 1;
          return { number, origin, groupages, isNew: !EXISTING_NUMBERS.includes(number) };
        });

        setPreview({ rows, filename: file.name });
        setConfirmed(false);
      } catch {
        alert("Could not read this file. Please upload a valid .xlsx or .xls file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirm = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    setHistory((prev) => [
      {
        filename: preview.filename,
        uploadedAt: timestamp,
        containers: preview.rows.length,
        groupages: preview.rows.reduce((sum, r) => sum + r.groupages, 0),
      },
      ...prev,
    ]);
    setConfirmed(true);
  };

  const handleReset = () => {
    setPreview(null);
    setConfirmed(false);
  };

  return (
    <div>
      {/* ── Hero (nav lives inside here) ── */}
      <div style={S.hero}>
        <TopNav heroBackground="#0f1f2e" />
        <div style={{ padding: "28px 40px 32px", position: "relative" }}>
        <HeroDeco />
        <p style={S.heroEyebrow}>Portivo · Data import</p>
        <h1 style={S.heroTitle}>Import</h1>
        <p style={S.heroSub}>
          Upload your monthly Excel file — containers, groupages and clients are added automatically.
        </p>
        <div style={S.heroLegend}>
          <div style={S.legendItem}>
            <div style={{ ...S.legendDot, background: "#1D9E75" }} />
            New containers
          </div>
          <div style={S.legendItem}>
            <div style={{ ...S.legendDot, background: "#185FA5" }} />
            Updates
          </div>
          <div style={S.legendItem}>
            <div style={{ ...S.legendDot, background: "#BA7517" }} />
            Conflicts
          </div>
        </div>
        </div> {/* end inner padding div */}
      </div>

      {/* ── Stat bar + history (always visible) ── */}
      <HistoryList history={history} />

      {/* ── Upload / preview / success (body section) ── */}
      <div style={{ ...S.body, paddingTop: 0 }}>
        <div style={{ ...S.body, background: "transparent", padding: "28px 0 0" }}>

          {!preview && !confirmed && (
            <>
              <p style={S.sectionLabel}>Upload file</p>
              <FileDropZone
                onFile={handleFile}
                isDragging={isDragging}
                setIsDragging={setIsDragging}
              />
            </>
          )}

          {preview && !confirmed && (
            <PreviewTable
              rows={preview.rows}
              filename={preview.filename}
              onConfirm={handleConfirm}
              onDiscard={handleReset}
            />
          )}

          {confirmed && (
            <>
              <SuccessBanner
                filename={preview.filename}
                count={preview.rows.length}
                onReset={handleReset}
              />
              <p style={S.sectionLabel}>Upload another file</p>
              <FileDropZone
                onFile={handleFile}
                isDragging={isDragging}
                setIsDragging={setIsDragging}
              />
            </>
          )}

        </div>
      </div>
    </div>
  );
}
