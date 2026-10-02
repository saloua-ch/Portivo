import pg from "pg";
import { config } from "./config.js";

const { Pool } = pg;

// Supabase's direct Postgres connection requires SSL; the default
// Supabase-issued cert isn't in Node's default CA bundle, so we trust it
// without rejecting on that mismatch (still fully encrypted in transit).
export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: { rejectUnauthorized: false },
});

export async function query(text, params) {
  return pool.query(text, params);
}
