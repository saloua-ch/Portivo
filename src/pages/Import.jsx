/**
 * Portivo — Import page
 * Drop-in replacement for Import.jsx
 * Requires: xlsx  →  npm install xlsx
 * Fonts loaded via index.html or a global CSS import:
 *   @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
 */

import { useState, useRef } from "react";
import * as XLSX from "xlsx";

// ─── Constants ─────────────────────────────────────────────────────────────

const KNOWN_CONTAINERS = ["MSCU7654321", "CMAU1234567", "HLCU8823001"];

const INITIAL_HISTORY = [
  { filename: "containers_juin_2026.xlsx",   at: "2026-06-01 09:14", ctr: 8,  grp: 21 },
  { filename: "containers_mai_2026.xlsx",    at: "2026-05-02 11:03", ctr: 11, grp: 34 },
  { filename: "containers_avril_2026.xlsx",  at: "2026-04-01 08:47", ctr: 9,  grp: 27 },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function pad(n) {
  return String(n).padStart(2, "0");
}

function nowTs() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getCol(row, ...names) {
  for (const n of names) {
    const key = Object.keys(row).find((k) => k.toLowerCase().includes(n));
    if (key) return String(row[key]).trim();
  }
  return "—";
}

function parseWorkbook(file, onSuccess, onError) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const wb = XLSX.read(e.target.result, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });
      if (!raw.length) {
        onError("No data found — make sure your Excel file has column headers.");
        return;
      }
      const rows = raw.map((row) => {
        const num = getCol(row, "container", "ctr", "number", "num");
        const org = getCol(row, "origin", "port", "loading", "from", "pol");
        const grp = parseInt(getCol(row, "groupage", "shipment", "count", "qty")) || 1;
        return {
          num,
          org,
          grp,
          isNew: !KNOWN_CONTAINERS.includes(num),
          isCon: false,
        };
      });
      onSuccess({ rows, file: file.name });
    } catch {
      onError("Could not read this file. Please upload a valid .xlsx or .xls file.");
    }
  };
  reader.readAsArrayBuffer(file);
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

.portivo-import * { box-sizing: border-box; margin: 0; padding: 0; }
.portivo-import { font-family: 'Inter', system-ui, sans-serif; background: #f5f2eb; }

/* ── Hero — now a full photo hero like Arrivals/Search ── */
.pi-hero {
  position: relative;
  height: 560px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.pi-hero-photo {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  object-position: center 35%;
}
.pi-hero-gradient {
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(8,32,48,.05) 0%, rgba(8,32,48,.25) 55%, rgba(8,32,48,.92) 100%);
}
.pi-hero-tint {
  position: absolute; inset: 0;
  background: rgba(11,42,61,.1);
}
.pi-hero-credit {
  position: absolute; bottom: 100px; right: 16px; z-index: 3;
  font-family: 'JetBrains Mono', monospace; font-size: 9px;
  letter-spacing: .1em; color: rgba(255,255,255,.28); text-transform: uppercase;
}

.pi-hero-content { position: relative; z-index: 2; padding: 0 44px; }

.pi-tag {
  display: inline-flex; align-items: center; gap: 7px;
  background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14);
  border-radius: 20px; padding: 5px 14px;
  font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase;
  color: #c7e0d8; margin-bottom: 18px;
}
.pi-tag-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #1D9E75;
  animation: pi-pulse 2s infinite;
}
@keyframes pi-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }

.pi-h1 {
  font-family: 'DM Serif Display', serif; font-size: clamp(2.4rem, 5vw, 4rem); font-weight: 400;
  color: #eae6dc; line-height: 1; margin-bottom: 12px; letter-spacing: -.5px;
}
.pi-sub { font-size: 13.5px; color: rgba(234,230,220,.72); line-height: 1.7; max-width: 420px; margin-bottom: 24px; }

.pi-pills { display: flex; gap: 10px; flex-wrap: wrap; }
.pi-pill {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 13px; border-radius: 6px;
  font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase;
}
.pi-pill svg { width: 13px; height: 13px; flex-shrink: 0; }
.pi-pill-green { background: rgba(29,158,117,.18); color: #4dcca0; border: 1px solid rgba(29,158,117,.3); }
.pi-pill-blue  { background: rgba(24,95,165,.18);  color: #5ba3e0; border: 1px solid rgba(24,95,165,.3); }
.pi-pill-amber { background: rgba(186,117,23,.18); color: #e8a838; border: 1px solid rgba(186,117,23,.3); }

/* ── Process strip — sits at the bottom edge of the hero photo ── */
.pi-process {
  position: relative; z-index: 2;
  display: grid; grid-template-columns: repeat(3,1fr);
  margin-top: 28px;
  border-top: 1px solid rgba(255,255,255,.12);
}
.pi-step {
  padding: 16px 24px 20px; display: flex; align-items: center; gap: 12px;
  border-right: 1px solid rgba(255,255,255,.1);
}
.pi-step:last-child { border-right: none; }
.pi-step-num {
  font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 500;
  color: #4dcca0; background: rgba(29,158,117,.18); border: 1px solid rgba(29,158,117,.28);
  border-radius: 4px; padding: 3px 7px; flex-shrink: 0;
}
.pi-step-text { font-size: 12px; color: rgba(220,230,234,.65); line-height: 1.4; }
.pi-step-text strong { display: block; color: #DCE6EA; font-weight: 500; font-size: 12px; margin-bottom: 2px; }

/* ── Stat bar ── */
.pi-stats { display: grid; grid-template-columns: repeat(4,1fr); background: #eae6dc; border-bottom: 1px solid #ccc8be; }
.pi-stat { padding: 20px 28px; border-right: 1px solid #ccc8be; position: relative; }
.pi-stat:last-child { border-right: none; }
.pi-stat-accent { position: absolute; top: 0; left: 0; width: 3px; height: 100%; }
.pi-stat-n {
  font-family: 'JetBrains Mono', monospace; font-size: 30px; font-weight: 500;
  color: #111820; line-height: 1; margin-bottom: 5px; font-variant-numeric: tabular-nums;
}
.pi-stat-l { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .12em; color: #8a8680; }

/* ── Body ── */
.pi-body { background: #f5f2eb; padding: 36px 44px; }
.pi-slabel { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .12em; color: #9a968e; margin-bottom: 16px; }

/* ── Drop zone ── */
.pi-dz {
  border: 1.5px dashed #c2bdb0; border-radius: 16px; cursor: pointer;
  background: #fff; transition: border-color .2s, background .2s;
  overflow: hidden; margin-bottom: 32px;
}
.pi-dz:hover, .pi-dz.drag { border-color: #185FA5; background: #f0f6fe; }
.pi-dz-inner { padding: 52px 32px; text-align: center; }
.pi-dz-icon {
  width: 64px; height: 64px; border-radius: 16px; background: #E6F1FB; color: #185FA5;
  display: flex; align-items: center; justify-content: center; margin: 0 auto 18px;
  transition: background .2s, color .2s;
}
.pi-dz-icon svg { width: 28px; height: 28px; }
.pi-dz:hover .pi-dz-icon, .pi-dz.drag .pi-dz-icon { background: #185FA5; color: #fff; }
.pi-dz-title { font-size: 16px; font-weight: 600; color: #111820; margin-bottom: 6px; }
.pi-dz-sub { font-size: 13px; color: #8a8680; margin-bottom: 20px; line-height: 1.6; }
.pi-dz-fmts { display: flex; gap: 8px; justify-content: center; }
.pi-dz-fmt {
  font-size: 11px; padding: 4px 12px; border-radius: 5px;
  border: 1px solid #d8d3c8; color: #8a8680; background: #f5f2eb; font-weight: 500; letter-spacing: .04em;
}
.pi-dz-hints { display: grid; grid-template-columns: repeat(3,1fr); border-top: 1px solid #f0ece3; }
.pi-dz-hint { padding: 14px 20px; display: flex; align-items: center; gap: 10px; border-right: 1px solid #f0ece3; }
.pi-dz-hint:last-child { border-right: none; }
.pi-dz-hint svg { width: 16px; height: 16px; color: #8a8680; flex-shrink: 0; }
.pi-dz-hint-text { font-size: 12px; color: #8a8680; line-height: 1.4; }
.pi-dz-hint-text strong { display: block; color: #444; font-weight: 500; font-size: 12px; margin-bottom: 1px; }

/* ── Preview ── */
.pi-preview-top {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; background: #EAF3DE; border: 1px solid #b8d988;
  border-radius: 12px 12px 0 0;
}
.pi-preview-file { display: flex; align-items: center; gap: 9px; font-size: 13px; font-weight: 600; color: #2a5a08; }
.pi-preview-file svg { width: 18px; height: 18px; }
.pi-preview-counts { display: flex; gap: 10px; }
.pi-pcount { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 5px; }
.pi-pcount-new { background: #d4edbe; color: #2a5a08; }
.pi-pcount-upd { background: #ddeeff; color: #0c447c; }
.pi-pcount-con { background: #fce8c8; color: #633806; }

.pi-table {
  background: #fff; border: 1px solid #d8d3c8; border-top: none;
  border-radius: 0 0 12px 12px; overflow: hidden; margin-bottom: 12px;
}
.pi-thead {
  display: grid; grid-template-columns: 40px 1.8fr 1fr 1fr 100px;
  padding: 10px 20px; font-size: 10px; font-weight: 600;
  text-transform: uppercase; letter-spacing: .1em; color: #8a8680;
  background: #faf9f5; border-bottom: 1px solid #ece8e0;
}
.pi-trow {
  display: grid; grid-template-columns: 40px 1.8fr 1fr 1fr 100px;
  padding: 14px 20px; align-items: center; border-bottom: 1px solid #f0ece3;
  transition: background .1s;
}
.pi-trow:last-child { border-bottom: none; }
.pi-trow:hover { background: #faf9f5; }
.pi-idx { font-size: 11px; color: #b5b0a8; font-family: 'JetBrains Mono', monospace; }
.pi-num { font-size: 13px; font-weight: 500; color: #111820; font-family: 'JetBrains Mono', monospace; letter-spacing: .04em; }
.pi-meta { font-size: 12.5px; color: #666260; }
.pi-badge { font-size: 11px; padding: 3px 10px; border-radius: 20px; font-weight: 600; display: inline-block; }
.pi-badge-new { background: #EAF3DE; color: #2a5a08; }
.pi-badge-upd { background: #E6F1FB; color: #0c447c; }
.pi-badge-con { background: #FAEEDA; color: #633806; }

.pi-warn {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 13px 18px; background: #FAEEDA; border: 1px solid #e8c070;
  border-radius: 9px; margin-bottom: 12px; font-size: 13px; color: #633806; line-height: 1.5;
}
.pi-warn svg { width: 17px; height: 17px; margin-top: 1px; flex-shrink: 0; }

.pi-act { display: flex; gap: 10px; justify-content: flex-end; }
.pi-btn-d {
  display: flex; align-items: center; gap: 7px; padding: 10px 20px;
  border-radius: 8px; border: 1px solid #d8d3c8; background: #fff;
  cursor: pointer; font-size: 13px; color: #666260; font-family: 'Inter', sans-serif;
  transition: background .15s;
}
.pi-btn-d:hover { background: #f5f2eb; }
.pi-btn-c {
  display: flex; align-items: center; gap: 7px; padding: 10px 26px;
  border-radius: 8px; border: none; background: #07151f;
  cursor: pointer; font-size: 13px; color: #eae6dc; font-weight: 600;
  font-family: 'Inter', sans-serif; transition: background .15s;
}
.pi-btn-c:hover { background: #0f2436; }
.pi-btn-d svg, .pi-btn-c svg { width: 14px; height: 14px; }

/* ── Success ── */
.pi-success {
  background: #EAF3DE; border: 1px solid #b8d988; border-radius: 14px;
  padding: 24px 28px; display: flex; align-items: center; justify-content: space-between;
  gap: 16px; margin-bottom: 32px;
}
.pi-succ-left { display: flex; align-items: center; gap: 16px; }
.pi-succ-icon {
  width: 46px; height: 46px; border-radius: 50%; background: #1D9E75;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #fff;
}
.pi-succ-icon svg { width: 22px; height: 22px; }
.pi-succ-h { font-size: 15px; font-weight: 600; color: #2a5a08; margin-bottom: 3px; }
.pi-succ-s { font-size: 13px; color: #3B6D11; }
.pi-btn-more {
  display: flex; align-items: center; gap: 7px; padding: 9px 18px;
  border-radius: 8px; border: 1px solid #97C459; background: #fff;
  cursor: pointer; font-size: 13px; color: #3B6D11; font-family: 'Inter', sans-serif;
  transition: background .15s;
}
.pi-btn-more:hover { background: #f0fadf; }
.pi-btn-more svg { width: 13px; height: 13px; }

/* ── History ── */
.pi-hist { background: #fff; border: 1px solid #d8d3c8; border-radius: 14px; overflow: hidden; }
.pi-hist-head {
  display: grid; grid-template-columns: 40px 1.8fr 1fr 1fr 120px;
  padding: 11px 20px; font-size: 10px; font-weight: 600;
  text-transform: uppercase; letter-spacing: .1em; color: #8a8680;
  background: #faf9f5; border-bottom: 1px solid #ece8e0;
}
.pi-hist-row {
  display: grid; grid-template-columns: 40px 1.8fr 1fr 1fr 120px;
  padding: 15px 20px; align-items: center; border-bottom: 1px solid #f0ece3;
  transition: background .1s;
}
.pi-hist-row:last-child { border-bottom: none; }
.pi-hist-row:hover { background: #faf9f5; }
.pi-hist-icon {
  width: 32px; height: 32px; border-radius: 7px; background: #EAF3DE;
  color: #3B6D11; display: flex; align-items: center; justify-content: center;
}
.pi-hist-icon svg { width: 15px; height: 15px; }
.pi-hist-n { font-size: 13px; font-weight: 500; color: #111820; margin-bottom: 2px; }
.pi-hist-sub { font-size: 12px; color: #8a8680; }
.pi-hist-time { font-size: 12px; color: #b5b0a8; font-family: 'JetBrains Mono', monospace; margin-bottom: 5px; }
.pi-hist-badge { font-size: 11px; padding: 3px 10px; border-radius: 20px; background: #EAF3DE; color: #2a5a08; font-weight: 600; }
.pi-empty { padding: 44px; text-align: center; color: #8a8680; font-size: 13px; }

/* ── Spacing utility ── */
.pi-mt { margin-top: 36px; }
`;

// ─── Inline SVG icons ────────────────────────────────────────────────────────

const Icon = {
  Upload: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  File: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  ),
  Refresh: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
  Alert: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Columns: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="8" height="18"/><rect x="13" y="3" width="8" height="18"/>
    </svg>
  ),
  Database: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function Hero() {
  return (
    <div className="pi-hero">
      {/* Photo — container terminal / dock scene */}
      <img
        className="pi-hero-photo"
        src="https://images.unsplash.com/photo-1720931623686-588ef1014e2a?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=1600&q=80&auto=format&fit=crop"
        alt="Container terminal with stacked shipping containers"
      />
      <div className="pi-hero-gradient" />
      <div className="pi-hero-tint" />
      <span className="pi-hero-credit">Photo: Unsplash</span>

      <div className="pi-hero-content">
        <div className="pi-tag">
          <div className="pi-tag-dot" />
          Live sync active — Tunis-Goulette Terminal
        </div>
        <h1 className="pi-h1">Manifest Import</h1>
        <p className="pi-sub">
          Upload your monthly Excel export to update the fleet registry.
          New containers are added, existing ones flagged for review before any changes are committed.
        </p>
        <div className="pi-pills">
          <span className="pi-pill pi-pill-green"><Icon.Plus /> New containers</span>
          <span className="pi-pill pi-pill-blue"><Icon.Refresh /> Updates</span>
          <span className="pi-pill pi-pill-amber"><Icon.Alert /> Conflicts</span>
        </div>
      </div>

      <div className="pi-process">
        {[
          ["01", "Upload Excel file", "Drag-drop or browse your .xlsx manifest"],
          ["02", "Review preview", "Inspect every row — new, updates, conflicts"],
          ["03", "Confirm & sync", "Data is written to the fleet registry"],
        ].map(([num, title, desc]) => (
          <div className="pi-step" key={num}>
            <span className="pi-step-num">{num}</span>
            <div className="pi-step-text">
              <strong>{title}</strong>
              {desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatBar({ history }) {
  const tc = history.reduce((a, h) => a + h.ctr, 0);
  const tg = history.reduce((a, h) => a + h.grp, 0);
  const last = history[0]
    ? history[0].filename.replace("containers_", "").replace(".xlsx", "").replace(/_/g, " ")
    : "—";
  return (
    <div className="pi-stats">
      <div className="pi-stat">
        <div className="pi-stat-accent" style={{ background: "#185FA5" }} />
        <div className="pi-stat-n">{pad(history.length)}</div>
        <div className="pi-stat-l">Files imported</div>
      </div>
      <div className="pi-stat">
        <div className="pi-stat-accent" style={{ background: "#1D9E75" }} />
        <div className="pi-stat-n">{tc}</div>
        <div className="pi-stat-l">Total containers</div>
      </div>
      <div className="pi-stat">
        <div className="pi-stat-accent" style={{ background: "#3B6D11" }} />
        <div className="pi-stat-n" style={{ color: "#3B6D11" }}>{tg}</div>
        <div className="pi-stat-l">Groupages tracked</div>
      </div>
      <div className="pi-stat">
        <div className="pi-stat-accent" style={{ background: "#BA7517" }} />
        <div className="pi-stat-n" style={{ color: "#BA7517", fontSize: 18, paddingTop: 6 }}>{last}</div>
        <div className="pi-stat-l">Last import</div>
      </div>
    </div>
  );
}

function DropZone({ onFile, isDragging, setIsDragging }) {
  const inputRef = useRef();
  return (
    <div
      className={`pi-dz${isDragging ? " drag" : ""}`}
      onClick={() => inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: "none" }}
        onChange={(e) => { if (e.target.files[0]) onFile(e.target.files[0]); }}
      />
      <div className="pi-dz-inner">
        <div className="pi-dz-icon"><Icon.Upload /></div>
        <p className="pi-dz-title">{isDragging ? "Release to start import" : "Drop your manifest here"}</p>
        <p className="pi-dz-sub">
          Drag your monthly Excel file — containers, routes and groupages<br />
          are automatically detected from your column headers.
        </p>
        <div className="pi-dz-fmts">
          <span className="pi-dz-fmt">XLSX</span>
          <span className="pi-dz-fmt">XLS</span>
          <span className="pi-dz-fmt">Click to browse</span>
        </div>
      </div>
      <div className="pi-dz-hints">
        <div className="pi-dz-hint">
          <Icon.Columns />
          <div className="pi-dz-hint-text"><strong>Auto-detected columns</strong>Container, origin, groupages</div>
        </div>
        <div className="pi-dz-hint">
          <Icon.Database />
          <div className="pi-dz-hint-text"><strong>Duplicate detection</strong>Flags updates vs new entries</div>
        </div>
        <div className="pi-dz-hint">
          <Icon.Shield />
          <div className="pi-dz-hint-text"><strong>Preview before saving</strong>Review every row first</div>
        </div>
      </div>
    </div>
  );
}

function PreviewTable({ preview, onConfirm, onDiscard }) {
  const { rows, file } = preview;
  const nc = rows.filter((r) => r.isNew).length;
  const uc = rows.filter((r) => !r.isNew && !r.isCon).length;
  const cc = rows.filter((r) => r.isCon).length;
  return (
    <div style={{ marginBottom: 32 }}>
      <p className="pi-slabel">Preview — {file}</p>
      {cc > 0 && (
        <div className="pi-warn">
          <Icon.Alert />
          <div>
            {cc} container number{cc > 1 ? "s" : ""} already exist in the system.
            Confirming will overwrite those records with the new data.
          </div>
        </div>
      )}
      <div className="pi-preview-top">
        <div className="pi-preview-file"><Icon.File />{file}</div>
        <div className="pi-preview-counts">
          {nc > 0 && <span className="pi-pcount pi-pcount-new">+ {nc} new</span>}
          {uc > 0 && <span className="pi-pcount pi-pcount-upd">↻ {uc} update{uc > 1 ? "s" : ""}</span>}
          {cc > 0 && <span className="pi-pcount pi-pcount-con">⚠ {cc} conflict{cc > 1 ? "s" : ""}</span>}
        </div>
      </div>
      <div className="pi-table">
        <div className="pi-thead">
          <span>#</span><span>Container</span><span>Groupages</span><span>Origin</span><span>Type</span>
        </div>
        {rows.map((r, i) => (
          <div className="pi-trow" key={i}>
            <span className="pi-idx">{pad(i + 1)}</span>
            <span className="pi-num">{r.num}</span>
            <span className="pi-meta">{r.grp} groupage{r.grp !== 1 ? "s" : ""}</span>
            <span className="pi-meta">{r.org}</span>
            <span className={`pi-badge ${r.isCon ? "pi-badge-con" : r.isNew ? "pi-badge-new" : "pi-badge-upd"}`}>
              {r.isCon ? "Conflict" : r.isNew ? "New" : "Update"}
            </span>
          </div>
        ))}
      </div>
      <div className="pi-act">
        <button className="pi-btn-d" onClick={onDiscard}><Icon.Trash /> Discard</button>
        <button className="pi-btn-c" onClick={onConfirm}><Icon.Check /> Confirm & save all</button>
      </div>
    </div>
  );
}

function SuccessBanner({ preview, onReset }) {
  return (
    <div className="pi-success">
      <div className="pi-succ-left">
        <div className="pi-succ-icon"><Icon.Check /></div>
        <div>
          <div className="pi-succ-h">Import successful</div>
          <div className="pi-succ-s">
            {preview.rows.length} container{preview.rows.length !== 1 ? "s" : ""} saved from {preview.file}
          </div>
        </div>
      </div>
      <button className="pi-btn-more" onClick={onReset}><Icon.Refresh /> Import another file</button>
    </div>
  );
}

function HistoryTable({ history }) {
  if (!history.length) {
    return <div className="pi-hist"><div className="pi-empty">No imports yet — upload your first file above.</div></div>;
  }
  return (
    <div className="pi-hist">
      <div className="pi-hist-head">
        <span />
        <span>File</span>
        <span>Containers</span>
        <span>Groupages</span>
        <span style={{ textAlign: "right" }}>Date & time</span>
      </div>
      {history.map((h, i) => (
        <div className="pi-hist-row" key={i}>
          <div className="pi-hist-icon"><Icon.File /></div>
          <div>
            <div className="pi-hist-n">{h.filename}</div>
            <div className="pi-hist-sub">{h.ctr} containers · {h.grp} groupages</div>
          </div>
          <div style={{ fontSize: 13, color: "#444" }}>{h.ctr}</div>
          <div style={{ fontSize: 13, color: "#3B6D11", fontWeight: 500 }}>{h.grp}</div>
          <div style={{ textAlign: "right" }}>
            <div className="pi-hist-time">{h.at}</div>
            <span className="pi-hist-badge">Imported</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function Import() {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview]       = useState(null);
  const [confirmed, setConfirmed]   = useState(false);
  const [history, setHistory]       = useState(INITIAL_HISTORY);

  const handleFile = (file) => {
    parseWorkbook(
      file,
      (result) => { setPreview(result); setConfirmed(false); },
      (msg)    => alert(msg)
    );
  };

  const handleConfirm = () => {
    setHistory((prev) => [
      { filename: preview.file, at: nowTs(), ctr: preview.rows.length, grp: preview.rows.reduce((a, r) => a + r.grp, 0) },
      ...prev,
    ]);
    setConfirmed(true);
  };

  const handleReset = () => { setPreview(null); setConfirmed(false); };

  return (
    <>
      <style>{css}</style>
      <div className="portivo-import">
        <Hero />
        <StatBar history={history} />
        <div className="pi-body">
          {confirmed && <SuccessBanner preview={preview} onReset={handleReset} />}
          {preview && !confirmed && (
            <PreviewTable preview={preview} onConfirm={handleConfirm} onDiscard={handleReset} />
          )}
          {(!preview || confirmed) && (
            <>
              <p className="pi-slabel">{confirmed ? "Upload another file" : "Upload file"}</p>
              <DropZone onFile={handleFile} isDragging={isDragging} setIsDragging={setIsDragging} />
            </>
          )}
          <p className="pi-slabel pi-mt">Import history</p>
          <HistoryTable history={history} />
        </div>
      </div>
    </>
  );
}
