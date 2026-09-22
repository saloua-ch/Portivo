import { Router } from "express";
import {
  listContainers, getContainerById, getContainerByNumber,
  insertContainer, updateContainer, deleteContainer,
  deleteByImportId, bulkInsertContainers,
} from "../repositories/containers.repo.js";
import { parseContainerCsv } from "../lib/csv.js";
import { broadcastChange } from "../realtime.js";
import { deleteImportHistory } from "../repositories/importHistory.repo.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const containersRouter = Router();

// eta_from/eta_to range and sort are applied here in JS rather than SQL:
// `eta` is stored as free-form text (not every row is guaranteed to be a
// parseable date), so this mirrors the previous client-side behavior
// instead of risking a cast error on malformed data.
function applyEtaRangeAndSort(list, { eta_from, eta_to, sort = "eta_asc" }) {
  let result = list;
  if (eta_from) {
    const from = new Date(eta_from);
    result = result.filter(c => new Date(c.eta) >= from);
  }
  if (eta_to) {
    const to = new Date(eta_to);
    result = result.filter(c => new Date(c.eta) <= to);
  }
  result = [...result].sort((a, b) => {
    const da = new Date(a.eta);
    const db = new Date(b.eta);
    return sort === "eta_asc" ? da - db : db - da;
  });
  return result;
}

containersRouter.get("/", asyncHandler(async (req, res) => {
  const { q, status, eta_from, eta_to, sort } = req.query;
  const list = await listContainers({ q, status });
  res.json(applyEtaRangeAndSort(list, { eta_from, eta_to, sort }));
}));

containersRouter.get("/:id", asyncHandler(async (req, res) => {
  const item = await getContainerById(req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
}));

containersRouter.post("/", asyncHandler(async (req, res) => {
  const payload = req.body || {};
  if (!payload.number) return res.status(400).json({ error: "Container number is required" });

  const existing = await getContainerByNumber(payload.number);
  if (existing) return res.status(409).json({ error: "Container number already exists" });

  const item = await insertContainer(payload);
  broadcastChange();
  res.status(201).json(item);
}));

containersRouter.patch("/:id", asyncHandler(async (req, res) => {
  const item = await updateContainer(req.params.id, req.body || {});
  if (!item) return res.status(404).json({ error: "Not found" });
  broadcastChange();
  res.json(item);
}));

containersRouter.delete("/:id", asyncHandler(async (req, res) => {
  await deleteContainer(req.params.id);
  broadcastChange();
  res.status(204).end();
}));

containersRouter.post("/import", asyncHandler(async (req, res) => {
  const csvText = req.body?.csvText || "";
  const existing = await listContainers({});
  const existingNumbers = existing.map(c => c.number);

  const { rows, errors } = parseContainerCsv(csvText, existingNumbers);
  if (rows.length) {
    await bulkInsertContainers(rows);
    broadcastChange();
  }
  res.json({ imported: rows.length, errors });
}));

containersRouter.delete("/by-import/:importId", asyncHandler(async (req, res) => {
  await deleteImportHistory(req.params.importId);
  await deleteByImportId(req.params.importId);
  broadcastChange();
  res.status(204).end();
}));
