import { query } from "../db.js";

export function genId() {
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

const COLUMNS = [
  "id", "number", "ref", "sheet", "import_id", "status", "eta", "etd",
  "origin", "destination", "carrier", "needs_attention", "attention_reason",
  "etd_verified", "etd_verified_by", "etd_verified_at",
  "eta_verified", "eta_verified_by", "eta_verified_at",
  "groupages", "timeline", "metadata", "created_at", "updated_at",
];

function itemToValues(item) {
  return [
    item.id, item.number, item.ref, item.sheet, item.importId, item.status, item.eta, item.etd,
    item.origin, item.destination, item.carrier, item.needsAttention, item.attentionReason,
    item.etdVerified, item.etdVerifiedBy, item.etdVerifiedAt,
    item.etaVerified, item.etaVerifiedBy, item.etaVerifiedAt,
    JSON.stringify(item.groupages), JSON.stringify(item.timeline), JSON.stringify(item.metadata),
    item.created_at, item.updated_at,
  ];
}

export async function listContainers({ q, status } = {}) {
  const clauses = [];
  const params = [];

  if (status && status !== "all") {
    params.push(status);
    clauses.push(`status = $${params.length}`);
  }
  if (q && q.trim()) {
    params.push(`%${q.trim()}%`);
    const p = `$${params.length}`;
    clauses.push(`(number ilike ${p} or carrier ilike ${p} or origin ilike ${p} or destination ilike ${p})`);
  }

  const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
  const { rows } = await query(
    `select * from containers ${where} order by created_at desc`,
    params
  );
  return rows.map(rowToContainer);
}

export async function getContainerById(id) {
  const { rows } = await query("select * from containers where id = $1", [id]);
  return rows[0] ? rowToContainer(rows[0]) : null;
}

export async function getContainerByNumber(number) {
  const { rows } = await query("select id from containers where number = $1", [number]);
  return rows[0] || null;
}

export async function insertContainer(payload) {
  const now = new Date().toISOString();
  const item = buildContainerItem(payload, genId(), now);
  const placeholders = COLUMNS.map((_, i) => `$${i + 1}`).join(", ");
  const { rows } = await query(
    `insert into containers (${COLUMNS.join(", ")}) values (${placeholders}) returning *`,
    itemToValues(item)
  );
  return rowToContainer(rows[0]);
}

export async function updateContainer(id, patch) {
  const current = await getContainerById(id);
  if (!current) return null;
  const merged = { ...current, ...patch, id: current.id, updated_at: new Date().toISOString() };
  const assignments = COLUMNS.filter(c => c !== "id").map((c, i) => `${c} = $${i + 2}`).join(", ");
  const values = itemToValues(merged).filter((_, i) => COLUMNS[i] !== "id");
  const { rows } = await query(
    `update containers set ${assignments} where id = $1 returning *`,
    [id, ...values]
  );
  return rows[0] ? rowToContainer(rows[0]) : null;
}

export async function deleteContainer(id) {
  await query("delete from containers where id = $1", [id]);
}

export async function deleteByImportId(importId) {
  await query("delete from containers where import_id = $1", [importId]);
}

export async function bulkInsertContainers(payloads) {
  const now = new Date().toISOString();
  const items = payloads.map(p => buildContainerItem(p, genId(), now));

  for (const item of items) {
    const placeholders = COLUMNS.map((_, i) => `$${i + 1}`).join(", ");
    await query(
      `insert into containers (${COLUMNS.join(", ")}) values (${placeholders})`,
      itemToValues(item)
    );
  }
  return items.map(rowToContainer_fromItem);
}

// bulkInsertContainers builds JS items directly (not DB rows), so map them
// through the same shape rowToContainer would produce without a round trip.
function rowToContainer_fromItem(item) {
  return { ...item };
}
