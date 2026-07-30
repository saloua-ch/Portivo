// ISO 6346 container number helpers — format normalization and the real
// check-digit algorithm (not just a shape regex). Verified against the
// standard's own worked example: CSQU3054383 → check digit 3.
//
// Format: 4 letters (3 owner-code letters + 1 equipment category letter,
// U/J/Z) + 6 digit serial number + 1 check digit = 11 characters.

const LETTER_VALUES = {
  A: 10, B: 12, C: 13, D: 14, E: 15, F: 16, G: 17, H: 18, I: 19, J: 20,
  K: 21, L: 23, M: 24, N: 25, O: 26, P: 27, Q: 28, R: 29, S: 30, T: 31,
  U: 32, V: 34, W: 35, X: 36, Y: 37, Z: 38,
};

const FORMAT_RE = /^[A-Z]{4}\d{7}$/;

/** Strips whitespace and uppercases — the canonical form used everywhere else. */
export function normalizeContainerNumber(raw) {
  return (raw || "").replace(/\s+/g, "").toUpperCase();
}

/** True if the string is 4 letters + 7 digits (the ISO 6346 shape), nothing more. */
export function hasValidFormat(raw) {
  return FORMAT_RE.test(normalizeContainerNumber(raw));
}

/** Computes the ISO 6346 check digit for the first 10 characters (4 letters + 6 digits). */
export function computeCheckDigit(prefix10) {
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const ch = prefix10[i];
    const val = /[A-Z]/.test(ch) ? LETTER_VALUES[ch] : Number(ch);
    sum += val * 2 ** i;
  }
  const remainder = sum % 11;
  return remainder === 10 ? 0 : remainder;
}

/**
 * Full validation. Returns:
 *   { status: "empty" }                         — nothing typed yet
 *   { status: "incomplete" }                     — too short to judge yet
 *   { status: "bad_format" }                     — wrong shape (not 4 letters + 7 digits)
 *   { status: "checksum_mismatch", expected }    — right shape, check digit doesn't match
 *   { status: "valid" }                          — right shape AND checksum matches
 * "checksum_mismatch" is deliberately not an error — plenty of real-world
 * entries (typos in source documents, non-standard reefers, etc.) won't
 * satisfy the checksum, so callers should treat it as a soft warning, not
 * a submit-blocker.
 */
export function validateContainerNumber(raw) {
  const clean = normalizeContainerNumber(raw);
  if (!clean) return { status: "empty" };
  if (clean.length < 11) return { status: "incomplete" };
  if (!hasValidFormat(clean)) return { status: "bad_format" };
  const expected = computeCheckDigit(clean.slice(0, 10));
  const provided = Number(clean[10]);
  if (expected !== provided) return { status: "checksum_mismatch", expected };
  return { status: "valid" };
}
