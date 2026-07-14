// Supabase backend — used when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.

import { containers as seedContainers } from "../data/mockData";
import { getSupabase } from "./supabaseClient";

let seeded = false;
let realtimeReady = false;

const KEY         = "pv:containers:v1";
const HISTORY_KEY = "pv:import-history:v1";

function delay(ms = 120) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function emitChange() {
  window.dispatchEvent(new CustomEvent("pv:data-updated", { detail: { timestamp: Date.now() } }));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function genId() {
  return "CNT-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 9000 + 1000).toString(36);
}

function rowToContainer(row) {
  return {
    id: row.id,
    number: row.number,
    ref: row.ref ?? null,
    sheet: row.sheet ?? null,
    importId: row.import_id ?? null,
    status: row.status,
    eta: row.eta ?? null,
    etd: row.etd ?? null,
    origin: row.origin ?? "",
    destination: row.destination ?? "",
    carrier: row.carrier ?? "",
    needsAttention: !!row.needs_attention,
    attentionReason: row.attention_reason ?? null,
    etdVerified: !!row.etd_verified,
    etdVerifiedBy: row.etd_verified_by ?? null,
    etdVerifiedAt: row.etd_verified_at ?? null,
    etaVerified: !!row.eta_verified,
    etaVerifiedBy: row.eta_verified_by ?? null,
    etaVerifiedAt: row.eta_verified_at ?? null,
    groupages: row.groupages ?? [],
    timeline: row.timeline ?? [],
    created_at: row.created_at,
    updated_at: row.updated_at,
    metadata: row.metadata ?? {},
  };
}

function containerToRow(item) {
  return {
    id: item.id,
    number: item.number,
    ref: item.ref ?? null,
    sheet: item.sheet ?? null,
    import_id: item.importId ?? null,
    status: item.status ?? "in_transit",
    eta: item.eta ?? null,
    etd: item.etd ?? null,
    origin: item.origin ?? "",
    destination: item.destination ?? "",
    carrier: item.carrier ?? "",
    needs_attention: !!item.needsAttention,
    attention_reason: item.attentionReason ?? null,
    etd_verified: !!item.etdVerified,
    etd_verified_by: item.etdVerifiedBy ?? null,
    etd_verified_at: item.etdVerifiedAt ?? null,
    eta_verified: !!item.etaVerified,
    eta_verified_by: item.etaVerifiedBy ?? null,
    eta_verified_at: item.etaVerifiedAt ?? null,
    groupages: item.groupages ?? [],
    timeline: item.timeline ?? [],
    metadata: item.metadata ?? {},
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

function rowToHistory(row) {
  return {
    id: row.id,
    filename: row.filename,
    at: row.at,
    ctr: row.ctr,
    grp: row.grp,
    sheets: row.sheets,
    skipped: row.skipped,
    containerIds: row.container_ids ?? [],
  };
}

function historyToRow(record) {
  return {
    id: record.id,
    filename: record.filename ?? "",
    at: record.at ?? "",
    ctr: record.ctr ?? 0,
    grp: record.grp ?? 0,
    sheets: record.sheets ?? 0,
    skipped: record.skipped ?? 0,
    container_ids: record.containerIds ?? [],
  };
}

function buildContainerItem(payload, id, now) {
  return {
    id,
    number: payload.number,
    ref: payload.ref ?? null,
    sheet: payload.sheet ?? null,
    importId: payload.importId ?? null,
    status: payload.status ?? "in_transit",
    eta: payload.eta ?? null,
    etd: payload.etd ?? null,
    origin: payload.origin ?? "",
    destination: payload.destination ?? "",
    carrier: payload.carrier ?? "",
    needsAttention: !!payload.needsAttention,
    attentionReason: payload.attentionReason ?? null,
    etdVerified: payload.etdVerified ?? false,
    etdVerifiedBy: payload.etdVerifiedBy ?? null,
    etdVerifiedAt: payload.etdVerifiedAt ?? null,
    etaVerified: payload.etaVerified ?? false,
    etaVerifiedBy: payload.etaVerifiedBy ?? null,
    etaVerifiedAt: payload.etaVerifiedAt ?? null,
    groupages: payload.groupages ?? [],
    timeline: payload.timeline ?? [],
    created_at: now,
    updated_at: now,
    metadata: payload.metadata ?? {},
  };
}

function filterContainers(list, { q, status, eta_from, eta_to, sort = "eta_asc" } = {}) {
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
  return list;
}

function readLegacyContainers() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function readLegacyHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function ensureSeeded() {
  if (seeded) return;

  const supabase = getSupabase();
  const { count, error } = await supabase
    .from("containers")
    .select("*", { count: "exact", head: true });

  if (error) throw new Error(error.message);

  if (!count) {
    const legacyContainers = readLegacyContainers();
    const legacyHistory = readLegacyHistory();
    const now = new Date().toISOString();
    const source = legacyContainers?.length ? legacyContainers : seedContainers;

    const rows = source.map(c =>
      containerToRow(buildContainerItem(c, c.id || genId(), c.created_at || now))
    );

    const { error: insertError } = await supabase.from("containers").insert(rows);
    if (insertError) throw new Error(insertError.message);

    if (legacyHistory?.length) {
      const historyRows = legacyHistory.map(historyToRow);
      const { error: historyError } = await supabase.from("import_history").insert(historyRows);
      if (historyError) throw new Error(historyError.message);
    }
  }

  seeded = true;
}

function ensureRealtime() {
  if (realtimeReady) return;

  const supabase = getSupabase();
  supabase
    .channel("pv-storage")
    .on("postgres_changes", { event: "*", schema: "public", table: "containers" }, () => emitChange())
    .on("postgres_changes", { event: "*", schema: "public", table: "import_history" }, () => emitChange())
    .subscribe();

  realtimeReady = true;
}

async function fetchAllContainers() {
  await ensureSeeded();
  ensureRealtime();

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("containers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToContainer);
}

export async function getContainers(opts = {}) {
  await delay();
  const list = await fetchAllContainers();
  return clone(filterContainers(list, opts));
}

export async function getContainer(id) {
  await delay();
  await ensureSeeded();
  ensureRealtime();

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("containers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? clone(rowToContainer(data)) : null;
}

export async function addContainer(payload) {
  await delay();

  if (!payload.number) {
    throw new Error("Container number is required");
  }

  const supabase = getSupabase();
  await ensureSeeded();
  ensureRealtime();

  const { data: existing, error: lookupError } = await supabase
    .from("containers")
    .select("id")
    .eq("number", payload.number)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);
  if (existing) throw new Error("Container number already exists");

  const now = new Date().toISOString();
  const item = buildContainerItem(payload, genId(), now);
  const { data, error } = await supabase
    .from("containers")
    .insert(containerToRow(item))
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  emitChange();
  return clone(rowToContainer(data));
}

export async function updateContainer(id, patch) {
  await delay();
  await ensureSeeded();
  ensureRealtime();

  const supabase = getSupabase();
  const { data: current, error: fetchError } = await supabase
    .from("containers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!current) throw new Error("Not found");

  const merged = {
    ...rowToContainer(current),
    ...patch,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("containers")
    .update(containerToRow(merged))
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  emitChange();
  return clone(rowToContainer(data));
}

export async function importContainers(csvText) {
  await delay();
  if (!csvText || !csvText.trim()) return { imported: 0, errors: ["Empty CSV"] };

  const rows = csvText.split(/\r?\n/).map(r => r.trim()).filter(r => r.length > 0);
  if (rows.length < 2) return { imported: 0, errors: ["No data rows"] };

  const headers = rows[0].split(",").map(h => h.trim().toLowerCase());
  const dataRows = rows.slice(1);

  const list = await fetchAllContainers();
  const existingNumbers = new Set(list.map(c => c.number));
  const errors = [];
  const toInsert = [];
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
    if (existingNumbers.has(obj.number)) {
      errors.push(`Row ${i + 2}: container ${obj.number} already exists`);
      continue;
    }

    const now = new Date().toISOString();
    const item = buildContainerItem({
      number: obj.number,
      ref: obj.ref || null,
      sheet: obj.sheet || null,
      importId: obj.importid || null,
      status: obj.status || "in_transit",
      eta: obj.eta || null,
      etd: obj.etd || null,
      origin: obj.origin || "",
      destination: obj.destination || "",
      carrier: obj.carrier || "",
      needsAttention: obj.needsattention === "true" || obj.needsattention === "1",
      attentionReason: obj.attentionreason || null,
      groupages: [],
      timeline: [],
    }, genId(), now);

    toInsert.push(containerToRow(item));
    existingNumbers.add(obj.number);
    imported++;
  }

  if (toInsert.length) {
    const supabase = getSupabase();
    const { error } = await supabase.from("containers").insert(toInsert);
    if (error) throw new Error(error.message);
    emitChange();
  }

  return { imported, errors };
}

export async function getImportHistory() {
  await delay();
  ensureRealtime();

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("import_history")
    .select("*")
    .order("inserted_at", { ascending: false });

  if (error) throw new Error(error.message);
  return clone((data ?? []).map(rowToHistory));
}

export async function addImportHistory(record) {
  await delay();
  ensureRealtime();

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("import_history")
    .upsert(historyToRow(record), { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  emitChange();
  return clone(rowToHistory(data));
}

export async function deleteImport(importId) {
  await delay();
  ensureRealtime();

  const supabase = getSupabase();

  const { error: historyError } = await supabase
    .from("import_history")
    .delete()
    .eq("id", importId);

  if (historyError) throw new Error(historyError.message);

  const { error: containersError } = await supabase
    .from("containers")
    .delete()
    .eq("import_id", importId);

  if (containersError) throw new Error(containersError.message);

  emitChange();
}

export function onChange(callback) {
  ensureRealtime();
  const handler = (e) => callback(e.detail);
  window.addEventListener("pv:data-updated", handler);
  return () => window.removeEventListener("pv:data-updated", handler);
}
