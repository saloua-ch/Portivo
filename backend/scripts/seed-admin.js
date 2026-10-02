import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool } from "../src/db.js";
import { upsertUser } from "../src/repositories/users.repo.js";

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "";
  if (!email || !password) {
    throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in backend/.env first");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await upsertUser(email, passwordHash);
  console.log(`Seeded admin user: ${user.email}`);
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
