import { query } from "../db.js";

function rowToHistory(row) {
  return {
    id: row.id,
    filename: row.filename,
    at: row.at,
    ctr: row.ctr,
    grp: row.grp,
    sheets: row.sheets,
    skipped: row.skipped,
    containerIds: row.container_ids ?? [],
  };
}

export async function listImportHistory() {
  const { rows } = await query("select * from import_history order by inserted_at desc");
  return rows.map(rowToHistory);
}

export async function upsertImportHistory(record) {
  const { rows } = await query(
    `insert into import_history (id, filename, at, ctr, grp, sheets, skipped, container_ids)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict (id) do update set
       filename = excluded.filename, at = excluded.at, ctr = excluded.ctr,
       grp = excluded.grp, sheets = excluded.sheets, skipped = excluded.skipped,
       container_ids = excluded.container_ids
     returning *`,
    [
      record.id,
      record.filename ?? "",
      record.at ?? "",
      record.ctr ?? 0,
      record.grp ?? 0,
      record.sheets ?? 0,
      record.skipped ?? 0,
      JSON.stringify(record.containerIds ?? []),
    ]
  );
  return rowToHistory(rows[0]);
}

export async function deleteImportHistory(id) {
  await query("delete from import_history where id = $1", [id]);
}
