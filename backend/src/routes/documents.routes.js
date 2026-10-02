import { Router } from "express";
import path from "node:path";
import fs from "node:fs/promises";
import multer from "multer";
import { config } from "../config.js";
import { signPath, verifyPath } from "../lib/signedUrl.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { asyncHandler } from "../lib/asyncHandler.js";

const uploadRoot = path.resolve(config.uploadDir);
const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024; // 15 MB, same cap as before

function resolveSafe(storagePath) {
  const resolved = path.resolve(uploadRoot, storagePath);
  if (!resolved.startsWith(uploadRoot)) return null; // rejects "../" traversal
  return resolved;
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_DOCUMENT_BYTES } });

export const documentsRouter = Router();

documentsRouter.post(
  "/containers/:containerId/documents/:groupageIndex",
  requireAuth,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const { containerId, groupageIndex } = req.params;
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const ext = (file.originalname.split(".").pop() || "bin").toLowerCase();
    const storagePath = `${containerId}/${groupageIndex}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const fullPath = resolveSafe(storagePath);
    if (!fullPath) return res.status(400).json({ error: "Invalid path" });

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, file.buffer);

    res.status(201).json({
      id: storagePath,
      name: file.originalname.replace(/\.[^/.]+$/, ""),
      fileName: file.originalname,
      mimeType: file.mimetype || "application/octet-stream",
      size: file.size,
      storagePath,
      uploadedAt: new Date().toISOString(),
    });
  })
);

documentsRouter.get("/documents/sign", requireAuth, (req, res) => {
  const storagePath = req.query.path;
  if (!storagePath || !resolveSafe(storagePath)) return res.status(400).json({ error: "Invalid path" });

  const { exp, sig } = signPath(storagePath);
  const url = `/api/documents/download?path=${encodeURIComponent(storagePath)}&exp=${exp}&sig=${sig}`;
  res.json({ url });
});

// Deliberately not behind requireAuth: this is a direct-navigation link
// (window.open / <a href>), authorized instead by the time-limited HMAC
// signature minted by the /sign endpoint above — same shape as a Supabase
// Storage signed URL.
documentsRouter.get("/documents/download", async (req, res) => {
  const { path: storagePath, exp, sig } = req.query;
  if (!verifyPath(storagePath, exp, sig)) return res.status(403).json({ error: "Invalid or expired link" });

  const fullPath = resolveSafe(storagePath);
  if (!fullPath) return res.status(400).json({ error: "Invalid path" });

  res.sendFile(fullPath, err => {
    if (err && !res.headersSent) res.status(404).json({ error: "File not found" });
  });
});

documentsRouter.delete("/documents", requireAuth, asyncHandler(async (req, res) => {
  const storagePath = req.body?.storagePath;
  if (!storagePath) return res.status(400).json({ error: "storagePath is required" });

  const fullPath = resolveSafe(storagePath);
  if (!fullPath) return res.status(400).json({ error: "Invalid path" });

  await fs.rm(fullPath, { force: true });
  res.status(204).end();
}));
