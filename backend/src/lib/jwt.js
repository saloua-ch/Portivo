import jwt from "jsonwebtoken";
import { config } from "../config.js";

export function signToken(user) {
  const expiresIn = config.sessionHours * 3600;
  const token = jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, { expiresIn });
  const expires_at = Math.floor(Date.now() / 1000) + expiresIn;
  return { token, expires_at };
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}
