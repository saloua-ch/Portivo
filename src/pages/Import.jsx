/**
 * Portivo — Import page
 * Custom parser for the Genmar/Portivo Excel format:
 *   - No headers — structured layout
 *   - Container rows: col A = "CCH001 MSCU7508269", col F = "ETA 18/07"
 *   - Groupage rows: col A empty, col B = supplier, col C = client, col D = achat, col E = vente
 *   - Works with both single-sheet (August) and multi-sheet (Archive) files
 */

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import * as storage from "../api/storage";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pad(n) { return String(n).padStart(2, "0"); }

function nowTs() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Parse one worksheet in the Portivo layout.
 * Returns an array of container objects ready for storage.addContainer().
 */
function parsePortivoSheet(ws, sheetName) {
  // Convert sheet to array-of-arrays (no header row assumed)
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  const containers = [];
  let current = null;

  for (const row of rows) {
    const [colA, colB, colC, colD, colE, colF] = row;

    const colAStr = colA ? String(colA).trim() : "";
    const colFStr = colF ? String(colF).trim() : "";

    // ── Container row: col A has the CCH/MSCU identifier ──
    if (colAStr && colAStr.length > 3) {
      if (current) containers.push(current);

      const parts = colAStr.split(/\s+/);
      const ref    = parts[0] || colAStr;      // e.g. CCH001
      const number = parts[1] || colAStr;      // e.g. MSCU7508269

      // Parse ETA: "ETA 18/07" → "2026-07-18"
      let eta = null;
      const etaMatch = colFStr.match(/(\d{2})\/(\d{2})/);
      if (etaMatch) {
        const [, day, month] = etaMatch;
        eta = `2026-${month}-${day}`;
      }

      current = {
        number,
        ref,
        eta,
        sheet: sheetName,
        origin: "Shanghai",        // default — no origin column in this format
        destination: "Tunis-Goulette",
        carrier: "MSC",
        status: "in_transit",
        needsAttention: false,
        groupages: [],
        timeline: [
          { step: "Departed origin port", date: null, done: false  },
          { step: "In transit",           date: null, current: true },
          { step: "Arrived destination",  date: null, done: false  },
        ],
      };
    }

    // ── Groupage row: col A empty, col B has supplier ──
    else if (!colAStr && colB && String(colB).trim()) {
      if (!current) continue;

      const supplier = String(colB).trim();
      const clientRaw = colC ? String(colC).trim() : "";
      // "**" and "***" mean client TBD
      const client = (clientRaw && clientRaw !== "**" && clientRaw !== "***") ? clientRaw : "";

      current.groupages.push({
        supplier,
        client,
        achat: colD ? String(colD) : "",
        vente: colE ? String(colE) : "",
        delivered: false,
      });
    }
  }

  if (current) containers.push(current);
  return containers;
}

/**
 * Parse a full workbook — all sheets.
 * Returns { containers, sheetsSummary }
 */
function parseWorkbook(file, onSuccess, onError) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const wb = XLSX.read(e.target.result, { type: "array" });

      if (!wb.SheetNames.length) {
        onError("No sheets found in this file.");
        return;
      }

      const allContainers = [];
      const sheetsSummary = [];

      for (const sheetName of wb.SheetNames) {
        const ws   = wb.Sheets[sheetName];
        const ctrs = parsePortivoSheet(ws, sheetName);
        allContainers.push(...ctrs);
        sheetsSummary.push({ name: sheetName, count: ctrs.length });
      }

      if (!allContainers.length) {
        onError("No containers found — make sure this is a Portivo-format Excel file.");
        return;
      }

      onSuccess({ containers: allContainers, file: file.name, sheetsSummary });
    } catch (err) {
      onError("Could not read this file. Please upload a valid .xlsx or .xls file.");
    }
  };
  reader.readAsArrayBuffer(file);
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

const css = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap');

.portivo-import * { box-sizing: border-box; margin: 0; padding: 0; }
.portivo-import { font-family: 'IBM Plex Sans', system-ui, sans-serif; background: #f5f2eb; }

.pi-hero { position: relative; height: 560px; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; }
.pi-hero-photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 35%; }
.pi-hero-gradient { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(8,32,48,.05) 0%, rgba(8,32,48,.25) 55%, rgba(8,32,48,.92) 100%); }
.pi-hero-tint { position: absolute; inset: 0; background: rgba(11,42,61,.1); }
.pi-hero-credit { position: absolute; bottom: 100px; right: 16px; z-index: 3; font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: .1em; color: rgba(255,255,255,.28); text-transform: uppercase; }
.pi-hero-content { position: relative; z-index: 2; padding: 0 44px; }
.pi-tag { display: inline-flex; align-items: center; gap: 7px; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14); border-radius: 20px; padding: 5px 14px; font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: #c7e0d8; margin-bottom: 18px; }
.pi-tag-dot { width: 6px; height: 6px; border-radius: 50%; background: #1D9E75; animation: pi-pulse 2s infinite; }
@keyframes pi-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
.pi-h1 { font-family: 'Fraunces', serif; font-size: clamp(2.4rem, 5vw, 4rem); font-weight: 600; color: #eae6dc; line-height: 1; margin-bottom: 12px; letter-spacing: -.02em; }
.pi-sub { font-size: 13.5px; color: rgba(234,230,220,.72); line-height: 1.7; max-width: 420px; margin-bottom: 24px; }
.pi-pills { display: flex; gap: 10px; flex-wrap: wrap; }
.pi-pill { display: flex; align-items: center; gap: 6px; padding: 6px 13px; border-radius: 6px; font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; }
.pi-pill svg { width: 13px; height: 13px; flex-shrink: 0; }
.pi-pill-green { background: rgba(29,158,117,.18); color: #4dcca0; border: 1px solid rgba(29,158,117,.3); }
.pi-pill-amber { background: rgba(186,117,23,.18); color: #e8a838; border: 1px solid rgba(186,117,23,.3); }
.pi-process { position: relative; z-index: 2; display: grid; grid-template-columns: repeat(3,1fr); margin-top: 28px; border-top: 1px solid rgba(255,255,255,.12); }
.pi-step { padding: 16px 24px 20px; display: flex; align-items: center; gap: 12px; border-right: 1px solid rgba(255,255,255,.1); }
.pi-step:last-child { border-right: none; }
.pi-step-num { font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 500; color: #4dcca0; background: rgba(29,158,117,.18); border: 1px solid rgba(29,158,117,.28); border-radius: 4px; padding: 3px 7px; flex-shrink: 0; }
.pi-step-text { font-size: 12px; color: rgba(220,230,234,.65); line-height: 1.4; }
.pi-step-text strong { display: block; color: #DCE6EA; font-weight: 500; font-size: 12px; margin-bottom: 2px; }

.pi-stats { display: grid; grid-template-columns: repeat(4,1fr); background: #eae6dc; border-bottom: 1px solid #ccc8be; }
.pi-stat { padding: 20px 28px; border-right: 1px solid #ccc8be; position: relative; }
.pi-stat:last-child { border-right: none; }
.pi-stat-accent { position: absolute; top: 0; left: 0; width: 3px; height: 100%; }
.pi-stat-n { font-family: 'IBM Plex Mono', monospace; font-size: 30px; font-weight: 500; color: #111820; line-height: 1; margin-bottom: 5px; }
.pi-stat-l { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .12em; color: #8a8680; }

.pi-body { background: #f5f2eb; padding: 36px 44px; }
.pi-slabel { font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .12em; color: #9a968e; margin-bottom: 16px; }

.pi-dz { border: 1.5px dashed #c2bdb0; border-radius: 16px; cursor: pointer; background: #fff; transition: border-color .2s, background .2s; overflow: hidden; margin-bottom: 32px; }
.pi-dz:hover, .pi-dz.drag { border-color: #185FA5; background: #f0f6fe; }
.pi-dz-inner { padding: 52px 32px; text-align: center; }
.pi-dz-icon { width: 64px; height: 64px; border-radius: 16px; background: #E6F1FB; color: #185FA5; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; transition: background .2s, color .2s; }
.pi-dz-icon svg { width: 28px; height: 28px; }
.pi-dz:hover .pi-dz-icon, .pi-dz.drag .pi-dz-icon { background: #185FA5; color: #fff; }
.pi-dz-title { font-size: 16px; font-weight: 600; color: #111820; margin-bottom: 6px; }
.pi-dz-sub { font-size: 13px; color: #8a8680; margin-bottom: 20px; line-height: 1.6; }
.pi-dz-fmts { display: flex; gap: 8px; justify-content: center; }
.pi-dz-fmt { font-size: 11px; padding: 4px 12px; border-radius: 5px; border: 1px solid #d8d3c8; color: #8a8680; background: #f5f2eb; font-weight: 500; }
.pi-dz-hints { display: grid; grid-template-columns: repeat(3,1fr); border-top: 1px solid #f0ece3; }
.pi-dz-hint { padding: 14px 20px; display: flex; align-items: center; gap: 10px; border-right: 1px solid #f0ece3; }
.pi-dz-hint:last-child { border-right: none; }
.pi-dz-hint svg { width: 16px; height: 16px; color: #8a8680; flex-shrink: 0; }
.pi-dz-hint-text { font-size: 12px; color: #8a8680; line-height: 1.4; }
.pi-dz-hint-text strong { display: block; color: #444; font-weight: 500; font-size: 12px; margin-bottom: 1px; }

.pi-sheets-strip { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
.pi-sheet-pill { font-family: 'IBM Plex Mono', monospace; font-size: 11px; padding: 4px 11px; border-radius: 20px; background: #E6F1FB; color: #0c447c; border: 1px solid rgba(24,95,165,.2); }

.pi-preview-top { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; background: #EAF3DE; border: 1px solid #b8d988; border-radius: 12px 12px 0 0; }
.pi-preview-file { display: flex; align-items: center; gap: 9px; font-size: 13px; font-weight: 600; color: #2a5a08; }
.pi-preview-file svg { width: 18px; height: 18px; }
.pi-preview-counts { display: flex; gap: 10px; }
.pi-pcount { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 5px; }
.pi-pcount-new { background: #d4edbe; color: #2a5a08; }
.pi-pcount-con { background: #fce8c8; color: #633806; }

.pi-table { background: #fff; border: 1px solid #d8d3c8; border-top: none; border-radius: 0 0 12px 12px; overflow: hidden; margin-bottom: 12px; max-height: 420px; overflow-y: auto; }
.pi-thead { display: grid; grid-template-columns: 44px 1fr 80px 100px 90px; padding: 10px 20px; font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .1em; color: #8a8680; background: #faf9f5; border-bottom: 1px solid #ece8e0; position: sticky; top: 0; }
.pi-trow { display: grid; grid-template-columns: 44px 1fr 80px 100px 90px; padding: 13px 20px; align-items: center; border-bottom: 1px solid #f0ece3; transition: background .1s; }
.pi-trow:last-child { border-bottom: none; }
.pi-trow:hover { background: #faf9f5; }
.pi-idx { font-size: 11px; color: #b5b0a8; font-family: 'IBM Plex Mono', monospace; }
.pi-num { font-size: 13px; font-weight: 500; color: #111820; font-family: 'IBM Plex Mono', monospace; letter-spacing: .04em; }
.pi-num-sub { font-size: 10px; color: #8a8680; margin-top: 2px; font-family: 'IBM Plex Mono', monospace; }
.pi-meta { font-size: 12px; color: #666260; }
.pi-badge { font-size: 11px; padding: 3px 10px; border-radius: 20px; font-weight: 600; display: inline-block; }
.pi-badge-new { background: #EAF3DE; color: #2a5a08; }
.pi-badge-con { background: #FAEEDA; color: #633806; }

.pi-warn { display: flex; align-items: flex-start; gap: 12px; padding: 13px 18px; background: #FAEEDA; border: 1px solid #e8c070; border-radius: 9px; margin-bottom: 12px; font-size: 13px; color: #633806; line-height: 1.5; }
.pi-warn svg { width: 17px; height: 17px; margin-top: 1px; flex-shrink: 0; }
.pi-err-banner { display: flex; align-items: flex-start; gap: 12px; padding: 13px 18px; background: #FBEAE4; border: 1px solid rgba(214,73,47,.3); border-radius: 9px; margin-bottom: 12px; font-size: 13px; color: #a13a26; line-height: 1.5; }

.pi-act { display: flex; gap: 10px; justify-content: flex-end; margin-top: 12px; }
.pi-btn-d { display: flex; align-items: center; gap: 7px; padding: 10px 20px; border-radius: 8px; border: 1px solid #d8d3c8; background: #fff; cursor: pointer; font-size: 13px; color: #666260; font-family: 'IBM Plex Sans', sans-serif; transition: background .15s; }
.pi-btn-d:hover { background: #f5f2eb; }
.pi-btn-c { display: flex; align-items: center; gap: 7px; padding: 10px 26px; border-radius: 8px; border: none; background: #07151f; cursor: pointer; font-size: 13px; color: #eae6dc; font-weight: 600; font-family: 'IBM Plex Sans', sans-serif; transition: background .15s; }
.pi-btn-c:hover:not(:disabled) { background: #0f2436; }
.pi-btn-c:disabled { opacity: 0.6; cursor: not-allowed; }
 @keyframes spin { to { transform: rotate(360deg); } }
.pi-success { background: #EAF3DE; border: 1px solid #b8d988; border-radius: 14px; padding: 24px 28px; display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 32px; }
.pi-succ-left { display: flex; align-items: center; gap: 16px; }
.pi-succ-icon { width: 46px; height: 46px; border-radius: 50%; background: #1D9E75; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #fff; }
.pi-succ-icon svg { width: 22px; height: 22px; }
.pi-succ-h { font-size: 15px; font-weight: 600; color: #2a5a08; margin-bottom: 3px; }
.pi-succ-s { font-size: 13px; color: #3B6D11; }
.pi-btn-more { display: flex; align-items: center; gap: 7px; padding: 9px 18px; border-radius: 8px; border: 1px solid #97C459; background: #fff; cursor: pointer; font-size: 13px; color: #3B6D11; font-family: 'IBM Plex Sans', sans-serif; transition: background .15s; }
.pi-btn-more:hover { background: #f0fadf; }

.pi-hist { background: #fff; border: 1px solid #d8d3c8; border-radius: 14px; overflow: hidden; }
.pi-hist-head { display: grid; grid-template-columns: 40px 1.8fr 80px 80px 130px; padding: 11px 20px; font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .1em; color: #8a8680; background: #faf9f5; border-bottom: 1px solid #ece8e0; }
.pi-hist-row { display: grid; grid-template-columns: 40px 1.8fr 80px 80px 130px; padding: 15px 20px; align-items: center; border-bottom: 1px solid #f0ece3; transition: background .1s; }
.pi-hist-row:last-child { border-bottom: none; }
.pi-hist-row:hover { background: #faf9f5; }
.pi-hist-icon { width: 32px; height: 32px; border-radius: 7px; background: #EAF3DE; color: #3B6D11; display: flex; align-items: center; justify-content: center; }
.pi-hist-icon svg { width: 15px; height: 15px; }
.pi-hist-n { font-size: 13px; font-weight: 500; color: #111820; margin-bottom: 2px; }
.pi-hist-sub { font-size: 12px; color: #8a8680; }
.pi-hist-time { font-size: 12px; color: #b5b0a8; font-family: 'IBM Plex Mono', monospace; margin-bottom: 5px; }
.pi-hist-badge { font-size: 11px; padding: 3px 10px; border-radius: 20px; background: #EAF3DE; color: #2a5a08; font-weight: 600; }
.pi-empty { padding: 44px; text-align: center; color: #8a8680; font-size: 13px; }
.pi-mt { margin-top: 36px; }
.pi-saving-bar { display: flex; align-items: center; gap: 10px; padding: 12px 18px; background: #E6F1FB; border: 1px solid rgba(24,95,165,.25); border-radius: 9px; margin-bottom: 12px; font-size: 13px; color: #0c447c; }
`;

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const Icon = {
  Upload:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  File:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Check:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Trash:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  Refresh: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  Alert:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Columns: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="8" height="18"/><rect x="13" y="3" width="8" height="18"/></svg>,
  Database:() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  Shield:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Plus:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Spinner: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function Hero() {
  return (
    <div className="pi-hero">
      <img className="pi-hero-photo" src="https://images.unsplash.com/photo-1720931623686-588ef1014e2a?q=80&w=1032&auto=format&fit=crop" alt="Container terminal" />
      <div className="pi-hero-gradient" /><div className="pi-hero-tint" />
      <span className="pi-hero-credit">Photo: Unsplash</span>
      <div className="pi-hero-content">
        <div className="pi-tag"><div className="pi-tag-dot" />Live sync — Tunis-Goulette Terminal</div>
        <h1 className="pi-h1">Manifest Import</h1>
        <p className="pi-sub">Upload your monthly Excel file to update the fleet registry. Containers and groupages are auto-detected from your Genmar layout.</p>
        <div className="pi-pills">
          <span className="pi-pill pi-pill-green"><Icon.Plus /> Containers + groupages</span>
          <span className="pi-pill pi-pill-amber"><Icon.Alert /> Duplicates skipped</span>
        </div>
      </div>
      <div className="pi-process">
        {[["01","Upload Excel file","Your monthly .xlsx — archive or single-month"],["02","Review preview","See every container and groupage count"],["03","Confirm & sync","Saved to fleet registry, all pages refresh"]].map(([n,t,d]) => (
          <div className="pi-step" key={n}><span className="pi-step-num">{n}</span><div className="pi-step-text"><strong>{t}</strong>{d}</div></div>
        ))}
      </div>
    </div>
  );
}

function StatBar({ history }) {
  const tc = history.reduce((a, h) => a + h.ctr, 0);
  const tg = history.reduce((a, h) => a + h.grp, 0);
  const last = history[0] ? history[0].filename.replace(".xlsx","") : "—";
  return (
    <div className="pi-stats">
      <div className="pi-stat"><div className="pi-stat-accent" style={{ background:"#185FA5" }}/><div className="pi-stat-n">{pad(history.length)}</div><div className="pi-stat-l">Files imported</div></div>
      <div className="pi-stat"><div className="pi-stat-accent" style={{ background:"#1D9E75" }}/><div className="pi-stat-n">{tc}</div><div className="pi-stat-l">Containers saved</div></div>
      <div className="pi-stat"><div className="pi-stat-accent" style={{ background:"#3B6D11" }}/><div className="pi-stat-n" style={{ color:"#3B6D11" }}>{tg}</div><div className="pi-stat-l">Groupages tracked</div></div>
      <div className="pi-stat"><div className="pi-stat-accent" style={{ background:"#BA7517" }}/><div className="pi-stat-n" style={{ color:"#BA7517", fontSize:16, paddingTop:6 }}>{last}</div><div className="pi-stat-l">Last import</div></div>
    </div>
  );
}

function DropZone({ onFile, isDragging, setIsDragging }) {
  const inputRef = useRef();
  return (
    <div className={`pi-dz${isDragging ? " drag" : ""}`} onClick={() => inputRef.current.click()}
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
    >
      <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{ display:"none" }} onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); }} />
      <div className="pi-dz-inner">
        <div className="pi-dz-icon"><Icon.Upload /></div>
        <p className="pi-dz-title">{isDragging ? "Release to import" : "Drop your manifest here"}</p>
        <p className="pi-dz-sub">Monthly archive or single-sheet file — containers and groupages<br />are detected automatically from the Genmar column layout.</p>
        <div className="pi-dz-fmts"><span className="pi-dz-fmt">XLSX</span><span className="pi-dz-fmt">XLS</span><span className="pi-dz-fmt">Click to browse</span></div>
      </div>
      <div className="pi-dz-hints">
        <div className="pi-dz-hint"><Icon.Columns /><div className="pi-dz-hint-text"><strong>Auto-detected layout</strong>CCH ref, MSCU number, ETA, groupages</div></div>
        <div className="pi-dz-hint"><Icon.Database /><div className="pi-dz-hint-text"><strong>Multi-sheet support</strong>Archive files with Jan–Dec sheets</div></div>
        <div className="pi-dz-hint"><Icon.Shield /><div className="pi-dz-hint-text"><strong>Preview before saving</strong>Review every row first</div></div>
      </div>
    </div>
  );
}

function PreviewTable({ preview, existingNumbers, onConfirm, onDiscard, importing }) {
  const { containers, file, sheetsSummary } = preview;
  const newOnes   = containers.filter(c => !existingNumbers.includes(c.number));
  const conflicts = containers.filter(c => existingNumbers.includes(c.number));
  const totalGroupages = newOnes.reduce((a, c) => a + c.groupages.length, 0);

  return (
    <div style={{ marginBottom: 32 }}>
      <p className="pi-slabel">Preview — {file}</p>

      {/* Sheet pills for archive files */}
      {sheetsSummary.length > 1 && (
        <div className="pi-sheets-strip">
          {sheetsSummary.map(s => (
            <span key={s.name} className="pi-sheet-pill">{s.name} · {s.count}</span>
          ))}
        </div>
      )}

      {conflicts.length > 0 && (
        <div className="pi-warn"><Icon.Alert /><div>{conflicts.length} container{conflicts.length > 1 ? "s" : ""} already in the registry — they'll be skipped. {newOnes.length} new ones will be saved.</div></div>
      )}

      {importing && (
        <div className="pi-saving-bar"><Icon.Spinner />Saving {newOnes.length} containers…</div>
      )}

      <div className="pi-preview-top">
        <div className="pi-preview-file"><Icon.File />{file}</div>
        <div className="pi-preview-counts">
          {newOnes.length > 0   && <span className="pi-pcount pi-pcount-new">+ {newOnes.length} new · {totalGroupages} groupages</span>}
          {conflicts.length > 0 && <span className="pi-pcount pi-pcount-con">⚠ {conflicts.length} skipped</span>}
        </div>
      </div>

      <div className="pi-table">
        <div className="pi-thead"><span>#</span><span>Container</span><span>Sheet</span><span>ETA</span><span>Status</span></div>
        {containers.map((c, i) => {
          const isConflict = existingNumbers.includes(c.number);
          return (
            <div className="pi-trow" key={i} style={{ opacity: isConflict ? 0.45 : 1 }}>
              <span className="pi-idx">{pad(i + 1)}</span>
              <div>
                <div className="pi-num">{c.number}</div>
                <div className="pi-num-sub">{c.ref} · {c.groupages.length} groupage{c.groupages.length !== 1 ? "s" : ""}</div>
              </div>
              <span className="pi-meta">{c.sheet}</span>
              <span className="pi-meta" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11 }}>{c.eta || "—"}</span>
              <span className={`pi-badge ${isConflict ? "pi-badge-con" : "pi-badge-new"}`}>{isConflict ? "Skip" : "New"}</span>
            </div>
          );
        })}
      </div>

      <div className="pi-act">
        <button className="pi-btn-d" onClick={onDiscard} disabled={importing}><Icon.Trash /> Discard</button>
        <button className="pi-btn-c" onClick={onConfirm} disabled={importing || newOnes.length === 0}>
          {importing ? "Saving…" : <><Icon.Check /> Save {newOnes.length} container{newOnes.length !== 1 ? "s" : ""}</>}
        </button>
      </div>
    </div>
  );
}

function SuccessBanner({ result, onReset }) {
  return (
    <div className="pi-success">
      <div className="pi-succ-left">
        <div className="pi-succ-icon"><Icon.Check /></div>
        <div>
          <div className="pi-succ-h">Import successful</div>
          <div className="pi-succ-s">{result.imported} container{result.imported !== 1 ? "s" : ""} saved · {result.skipped} skipped</div>
        </div>
      </div>
      <button className="pi-btn-more" onClick={onReset}><Icon.Refresh /> Import another file</button>
    </div>
  );
}

function HistoryTable({ history }) {
  if (!history.length) return <div className="pi-hist"><div className="pi-empty">No imports yet — upload your first file above.</div></div>;
  return (
    <div className="pi-hist">
      <div className="pi-hist-head"><span /><span>File</span><span>Saved</span><span>Groupages</span><span style={{ textAlign:"right" }}>Date & time</span></div>
      {history.map((h, i) => (
        <div className="pi-hist-row" key={i}>
          <div className="pi-hist-icon"><Icon.File /></div>
          <div><div className="pi-hist-n">{h.filename}</div><div className="pi-hist-sub">{h.sheets} sheet{h.sheets !== 1 ? "s" : ""} · {h.skipped} skipped</div></div>
          <div style={{ fontSize:13, color:"#2a5a08", fontWeight:600 }}>{h.ctr}</div>
          <div style={{ fontSize:13, color:"#3B6D11" }}>{h.grp}</div>
          <div style={{ textAlign:"right" }}><div className="pi-hist-time">{h.at}</div><span className="pi-hist-badge">Imported</span></div>
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Import() {
  const [isDragging, setIsDragging]     = useState(false);
  const [preview, setPreview]           = useState(null);
  const [existingNumbers, setExisting]  = useState([]);
  const [confirmed, setConfirmed]       = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting]       = useState(false);
  const [history, setHistory]           = useState([]);

  const handleFile = async (file) => {
    // Fetch existing numbers first so preview can flag conflicts
    const existing = await storage.getContainers();
    setExisting(existing.map(c => c.number));

    parseWorkbook(file,
      (result) => { setPreview(result); setConfirmed(false); setImportResult(null); },
      (msg)    => alert(msg)
    );
  };

  const handleConfirm = async () => {
    setImporting(true);
    const newOnes = preview.containers.filter(c => !existingNumbers.includes(c.number));
    let imported = 0;
    let skipped  = preview.containers.length - newOnes.length;

    for (const c of newOnes) {
      try {
        await storage.addContainer(c);
        imported++;
      } catch {
        skipped++;
      }
    }

    const result = { imported, skipped };
    setImportResult(result);
    setHistory(prev => [{
      filename: preview.file,
      at: nowTs(),
      ctr: imported,
      grp: newOnes.reduce((a, c) => a + c.groupages.length, 0),
      sheets: preview.sheetsSummary.length,
      skipped,
    }, ...prev]);
    setConfirmed(true);
    setImporting(false);
  };

  const handleReset = () => { setPreview(null); setConfirmed(false); setImportResult(null); };

  return (
    <>
      <style>{css}
       
      </style>
      <div className="portivo-import">
        <Hero />
        <StatBar history={history} />
        <div className="pi-body">
          {confirmed && importResult && <SuccessBanner result={importResult} onReset={handleReset} />}
          {preview && !confirmed && (
            <PreviewTable
              preview={preview}
              existingNumbers={existingNumbers}
              onConfirm={handleConfirm}
              onDiscard={handleReset}
              importing={importing}
            />
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
