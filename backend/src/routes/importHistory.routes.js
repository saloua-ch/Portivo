import { Router } from "express";
import { listImportHistory, upsertImportHistory } from "../repositories/importHistory.repo.js";
import { broadcastChange } from "../realtime.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const importHistoryRouter = Router();

importHistoryRouter.get("/", asyncHandler(async (_req, res) => {
  res.json(await listImportHistory());
}));

importHistoryRouter.post("/", asyncHandler(async (req, res) => {
  const record = await upsertImportHistory(req.body || {});
  broadcastChange();
  res.status(201).json(record);
}));
