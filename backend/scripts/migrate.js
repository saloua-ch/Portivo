import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../src/db.js";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "migrations");

async function main() {
  const files = (await fs.readdir(dir)).filter(f => f.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = await fs.readFile(path.join(dir, file), "utf8");
    console.log(`Running ${file}...`);
    await pool.query(sql);
  }
  console.log("Done.");
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
