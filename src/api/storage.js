// Lightweight client-side data API that persists into localStorage.
// - Seeds from src/data/mockData.js if no data present
// - Exposes async functions: getContainers, getContainer, addContainer, updateContainer, importContainers
// - Emits a "pv:data-updated" CustomEvent on window when data changes so UI can reload

import { containers as seedContainers } from "../data/mockData";

const KEY = "pv:containers:v1";

function delay(ms = 120) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function readStore() {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    localStorage.setItem(KEY, JSON.stringify(seedContainers));
    return JSON.parse(JSON.stringify(seedContainers));
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    localStorage.removeItem(KEY);
    localStorage.setItem(KEY, JSON.stringify(seedContainers));
    return JSON.parse(JSON.stringify(seedContainers));
  }
}

function writeStore(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("pv:data-updated", { detail: { timestamp: Date.now() } }));
}

function genId() {
  return "CNT-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 9000 + 1000).toString(36);
}

export async function getContainers({ q, status, eta_from, eta_to, sort = "eta_asc" } = {}) {
  await delay();
  let list = readStore();

  if (status && status !== "all") {
    list = list.filter(c => c.status === status);
  }
  if (q && q.trim()) {
    const s = q.trim().toLowerCase();
    list = list.filter(c =>
      [c.number, c.carrier, c.origin, c.destination].some(v => v && v.toLowerCase().includes(s))
    );
  }
  if (eta_from) {
    const from = new Date(eta_from);
    list = list.filter(c => new Date(c.eta) >= from);
  }
  if (eta_to) {
    const to = new Date(eta_to);
    list = list.filter(c => new Date(c.eta) <= to);
  }
  list.sort((a, b) => {
    const da = new Date(a.eta);
    const db = new Date(b.eta);
    return sort === "eta_asc" ? da - db : db - da;
  });
  return JSON.parse(JSON.stringify(list));
}

export async function getContainer(id) {
  await delay();
  const list = readStore();
  const item = list.find(c => c.id === id);
  return item ? JSON.parse(JSON.stringify(item)) : null;
}

export async function addContainer(payload) {
  await delay();
  const list = readStore();
  if (!payload.number) {
    throw new Error("Container number is required");
  }
  if (list.some(c => c.number === payload.number)) {
    throw new Error("Container number already exists");
  }
  const now = new Date().toISOString();
  const item = {
    id: genId(),
    number: payload.number,
    status: payload.status || "in_transit",
    eta: payload.eta || null,
    origin: payload.origin || "",
    destination: payload.destination || "",
    carrier: payload.carrier || "",
    needsAttention: !!payload.needsAttention,
    attentionReason: payload.attentionReason || null,
    groupages: payload.groupages || [],
    timeline: payload.timeline || [],
    created_at: now,
    updated_at: now,
    metadata: payload.metadata || {},
  };
  list.unshift(item);
  writeStore(list);
  return JSON.parse(JSON.stringify(item));
}

export async function updateContainer(id, patch) {
  await delay();
  const list = readStore();
  const idx = list.findIndex(c => c.id === id);
  if (idx === -1) throw new Error("Not found");
  const updated = { ...list[idx], ...patch, updated_at: new Date().toISOString() };
  list[idx] = updated;
  writeStore(list);
  return JSON.parse(JSON.stringify(updated));
}

export async function importContainers(csvText) {
  await delay();
  if (!csvText || !csvText.trim()) return { imported: 0, errors: ["Empty CSV"] };

  const rows = csvText.split(/\r?\n/).map(r => r.trim()).filter(r => r.length > 0);
  if (rows.length < 2) return { imported: 0, errors: ["No data rows"] };

  const headers = rows[0].split(",").map(h => h.trim().toLowerCase());
  const dataRows = rows.slice(1);

  const list = readStore();
  const errors = [];
  let imported = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const cols = dataRows[i].split(",").map(c => c.trim());
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j].replace(/\s+/g, "");
      obj[key] = cols[j] ?? "";
    }
    if (!obj.number) {
      errors.push(`Row ${i + 2}: missing number`);
      continue;
    }
    if (list.some(c => c.number === obj.number)) {
      errors.push(`Row ${i + 2}: container ${obj.number} already exists`);
      continue;
    }
    const item = {
      id: genId(),
      number: obj.number,
      status: obj.status || "in_transit",
      eta: obj.eta || null,
      origin: obj.origin || "",
      destination: obj.destination || "",
      carrier: obj.carrier || "",
      needsAttention: obj.needsattention === "true" || obj.needsattention === "1",
      attentionReason: obj.attentionreason || null,
      groupages: [],
      timeline: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(item);
    imported++;
  }

  writeStore(list);
  return { imported, errors };
}

// Subscribe to changes — returns an unsubscribe function, call it in useEffect cleanup
export function onChange(callback) {
  const handler = (e) => callback(e.detail);
  window.addEventListener("pv:data-updated", handler);
  return () => window.removeEventListener("pv:data-updated", handler);
}
