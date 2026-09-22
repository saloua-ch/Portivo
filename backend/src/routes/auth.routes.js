import { Router } from "express";
import bcrypt from "bcryptjs";
import { findUserByEmail } from "../repositories/users.repo.js";
import { signToken, verifyToken } from "../lib/jwt.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const authRouter = Router();

authRouter.post("/login", asyncHandler(async (req, res) => {
  const email = (req.body?.email || "").trim().toLowerCase();
  const password = req.body?.password || "";

  const user = await findUserByEmail(email);
  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok) return res.status(401).json({ error: "Invalid email or password" });

  const { token, expires_at } = signToken(user);
  res.json({ token, session: { user: { email: user.email }, expires_at } });
}));

authRouter.post("/logout", (_req, res) => {
  // Stateless JWT — the client just discards the token. Nothing to do server-side.
  res.status(204).end();
});

authRouter.get("/session", (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.json({ session: null });

  try {
    const payload = verifyToken(token);
    res.json({ session: { user: { email: payload.email }, expires_at: payload.exp } });
  } catch {
    res.json({ session: null });
  }
});
