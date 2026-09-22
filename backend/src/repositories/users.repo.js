import { query } from "../db.js";

export async function findUserByEmail(email) {
  const { rows } = await query(
    "select id, email, password_hash from users where email = $1",
    [email]
  );
  return rows[0] || null;
}

export async function upsertUser(email, passwordHash) {
  const { rows } = await query(
    `insert into users (email, password_hash)
     values ($1, $2)
     on conflict (email) do update set password_hash = excluded.password_hash
     returning id, email`,
    [email, passwordHash]
  );
  return rows[0];
}
