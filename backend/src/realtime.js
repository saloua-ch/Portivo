import { Server } from "socket.io";
import { verifyToken } from "./lib/jwt.js";

let io = null;

export function initRealtime(httpServer, corsOrigin) {
  io = new Server(httpServer, { cors: { origin: corsOrigin } });

  io.use((socket, next) => {
    try {
      verifyToken(socket.handshake.auth?.token || "");
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  return io;
}

export function broadcastChange() {
  if (io) io.emit("data:changed", { timestamp: Date.now() });
}
