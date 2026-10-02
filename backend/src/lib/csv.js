// Parses the same simple comma-separated format the frontend used to parse
// client-side (see the old storageSupabase.js importContainers). Column
// order comes from the header row; unknown headers are ignored.

export function parseContainerCsv(csvText, existingNumbers) {
  const seen = new Set(existingNumbers);

  if (!csvText || !csvText.trim()) {
    return { rows: [], errors: ["Empty CSV"] };
  }

  const rows = csvText.split(/\r?\n/).map(r => r.trim()).filter(r => r.length > 0);
  if (rows.length < 2) {
    return { rows: [], errors: ["No data rows"] };
  }

  const headers = rows[0].split(",").map(h => h.trim().toLowerCase());
  const dataRows = rows.slice(1);

  const errors = [];
  const parsed = [];

  for (let i = 0; i < dataRows.length; i++) {
    const cols = dataRows[i].split(",").map(c => c.trim());
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j].replace(/\s+/g, "");
      obj[key] = cols[j] ?? "";
    }

    if (!obj.number) {
      errors.push(`Row ${i + 2}: missing number`);
      continue;
    }
    if (seen.has(obj.number)) {
      errors.push(`Row ${i + 2}: container ${obj.number} already exists`);
      continue;
    }

    parsed.push({
      number: obj.number,
      ref: obj.ref || null,
      sheet: obj.sheet || null,
      importId: obj.importid || null,
      status: obj.status || "in_transit",
      eta: obj.eta || null,
      etd: obj.etd || null,
      origin: obj.origin || "",
      destination: obj.destination || "",
      carrier: obj.carrier || "",
      needsAttention: obj.needsattention === "true" || obj.needsattention === "1",
      attentionReason: obj.attentionreason || null,
      groupages: [],
      timeline: [],
    });
    seen.add(obj.number);
  }

  return { rows: parsed, errors };
}
