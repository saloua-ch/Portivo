import crypto from "node:crypto";
import { config } from "../config.js";

const DEFAULT_TTL_SECONDS = 600; // 10 minutes, matches the old Supabase signed URL TTL

function hmac(path, exp) {
  return crypto
    .createHmac("sha256", config.fileSigningSecret)
    .update(`${path}:${exp}`)
    .digest("hex");
}

export function signPath(path, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const sig = hmac(path, exp);
  return { exp, sig };
}

export function verifyPath(path, exp, sig) {
  if (!path || !exp || !sig) return false;
  if (Math.floor(Date.now() / 1000) > Number(exp)) return false;
  const expected = hmac(path, exp);
  const a = Buffer.from(expected);
  const b = Buffer.from(String(sig));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
