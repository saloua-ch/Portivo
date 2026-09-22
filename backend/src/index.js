import express from "express";
import cors from "cors";
import http from "node:http";
import { config } from "./config.js";
import { initRealtime } from "./realtime.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { authRouter } from "./routes/auth.routes.js";
import { containersRouter } from "./routes/containers.routes.js";
import { importHistoryRouter } from "./routes/importHistory.routes.js";
import { documentsRouter } from "./routes/documents.routes.js";

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/containers", requireAuth, containersRouter);
app.use("/api/import-history", requireAuth, importHistoryRouter);
app.use("/api", documentsRouter); // documents router applies requireAuth per-route (download link is unauthenticated by design)

// Catches errors forwarded by asyncHandler() (and anything else passed to
// next(err)) so a failed query returns a JSON 500 instead of the request
// hanging until the client times out.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const server = http.createServer(app);
initRealtime(server, config.corsOrigin);

server.listen(config.port, () => {
  console.log(`Portivo API listening on http://localhost:${config.port}`);
});
