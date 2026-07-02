/**
 * Portivo — Documents page
 * Place at: src/pages/Documents.jsx
 *
 * Reached two ways:
 *   1. Groupage row in ContainerDetail → /containers/:id/documents?g=2
 *   2. Documents tab in ContainerDetail → /containers/:id/documents
 *
 * WHY BLOB URLS instead of data URLs:
 *   Browsers (Chrome, Safari, Firefox) block window.open(<data-url>) for
 *   security reasons — the tab opens but shows a blank page or is blocked
 *   entirely. Converting to a Blob object URL first works reliably for
 *   PDFs, images, and text files. For everything else a download is the
 *   safe fallback.
 */

import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import * as storage from "../api/storage";
import {
  ArrowLeft, FileText, Receipt, FileCheck2, Upload,
  Package, Trash2, Download, Eye, ChevronDown, Plus,
} from "lucide-react";

const MONO = "'IBM Plex Mono', monospace";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (!bytes) return "—";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function docIconFor(name = "") {
  const n = name.toLowerCase();
  if (n.includes("invoice") || n.includes("receipt")) return Receipt;
  if (n.includes("customs") || n.includes("declaration")) return FileCheck2;
  return FileText;
}

function groupageLabel(g, i) {
  const who = g.client && g.client.trim()
    ? `${g.supplier} → ${g.client}`
    : g.supplier;
  return `#${i + 1} · ${who}`;
}

// Convert a stored data URL → temporary Blob object URL.
// Blob URLs are not subject to the browser's data-URL navigation block.
function dataUrlToObjectUrl(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mime = (header.match(/:(.*?);/) || [])[1] || "application/octet-stream";
  const binary = atob(base64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });
  return { url: URL.createObjectURL(blob), mime };
}

// PDFs, images, and plain text can be previewed inline in the browser.
const PREVIEW_PREFIXES = ["image/", "text/plain", "application/pdf"];
function isPreviewable(mimeType = "") {
  return PREVIEW_PREFIXES.some(p => mimeType.startsWith(p));
}

function viewDoc(doc) {
  const { url } = dataUrlToObjectUrl(doc.dataUrl);
  window.open(url, "_blank", "noopener");
  // Give the browser 60 s to load it, then free memory.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function downloadDoc(doc) {
  const { url } = dataUrlToObjectUrl(doc.dataUrl);
  const a = document.createElement("a");
  a.href     = url;
  a.download = doc.fileName || doc.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Documents() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [container, setContainer] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await storage.getContainer(id);
      setContainer(data);
      setLoading(false);
    }
    load();
    const unsubscribe = storage.onChange(() => load());
    return unsubscribe;
  }, [id]);

  const groupages = container?.groupages?.length ? container.groupages : [];

  // Which groupage is active — driven by ?g=<index>, defaulting to 0.
  const gParam      = searchParams.get("g");
  const activeIndex = gParam !== null && groupages[Number(gParam)]
    ? Number(gParam) : 0;
  const activeGroupage = groupages[activeIndex];

  function selectGroupage(index) {
    setSearchParams({ g: String(index) });
  }

  async function persistGroupages(updatedGroupages) {
    await storage.updateContainer(container.id, { groupages: updatedGroupages });
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !activeGroupage) return;
    setUploading(true);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader  = new FileReader();
        reader.onload  = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.readAsDataURL(file);
      });
      const newDoc = {
        id:         `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name:       file.name.replace(/\.[^/.]+$/, ""),
        fileName:   file.name,
        mimeType:   file.type || "application/octet-stream",
        size:       file.size,
        dataUrl,
        uploadedAt: new Date().toISOString(),
      };
      const updatedGroupages = groupages.map((g, i) =>
        i === activeIndex
          ? { ...g, documents: [...(g.documents || []), newDoc] }
          : g
      );
      await persistGroupages(updatedGroupages);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Couldn't upload that file — please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDeleteDoc(docId) {
    if (!activeGroupage) return;
    if (!window.confirm("Remove this document?")) return;
    const updatedGroupages = groupages.map((g, i) =>
      i === activeIndex
        ? { ...g, documents: (g.documents || []).filter(d => d.id !== docId) }
        : g
    );
    try {
      await persistGroupages(updatedGroupages);
    } catch (err) {
      console.error("Delete failed", err);
      alert("Couldn't remove that document — please try again.");
    }
  }

  // ─── Early returns ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ textAlign: "center", paddingTop: 80, color: "#6E7F87", fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <p style={{ fontSize: 14 }}>Loading documents…</p>
      </div>
    );
  }

  if (!container) {
    return (
      <div style={{ textAlign: "center", paddingTop: 80, color: "#6E7F87", fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <p style={{ fontSize: 16 }}>Container not found.</p>
        <button
          onClick={() => navigate("/containers")}
          style={{ marginTop: 16, padding: "8px 20px", border: "1px solid rgba(11,42,61,0.22)", background: "#fff", cursor: "pointer", fontSize: 13, borderRadius: 6 }}
        >
          Back to containers
        </button>
      </div>
    );
  }

  const docs = activeGroupage?.documents || [];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{CSS}</style>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: "#ECE7DA", color: "#1C2B33", minHeight: "100vh" }}>

        {/* Header */}
        <div style={{ background: "#0B2A3D", padding: "0 clamp(24px,5vw,48px) 32px" }}>
          <div style={{ paddingTop: 28 }}>
            <button className="pvdoc-back" onClick={() => navigate(`/containers/${container.id}`)}>
              <ArrowLeft size={13} /> {container.number}
            </button>
          </div>
          <p style={{ fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#9DB5C0", margin: "0 0 12px" }}>
            Documents · {container.carrier}
          </p>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "clamp(2rem,4vw,2.8rem)", letterSpacing: "-0.02em", color: "#DCE6EA", margin: 0 }}>
            Groupage documents
          </h1>
        </div>

        <div style={{ padding: "32px clamp(24px,5vw,48px) 64px", maxWidth: 900 }}>

          {groupages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#6E7F87", fontFamily: MONO, fontSize: 12 }}>
              This container has no groupages yet.
            </div>
          ) : (
            <>
              {/* ── Groupage switcher ── */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontFamily: MONO, fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#6E7F87", marginBottom: 8 }}>
                  Viewing documents for
                </p>
                <div style={{ position: "relative", maxWidth: 420 }}>
                  <Package size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6E7F87", pointerEvents: "none" }} />
                  <select
                    value={activeIndex}
                    onChange={e => selectGroupage(Number(e.target.value))}
                    className="pvdoc-select"
                  >
                    {groupages.map((g, i) => (
                      <option key={i} value={i}>{groupageLabel(g, i)}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#6E7F87", pointerEvents: "none" }} />
                </div>
              </div>

              {/* ── Groupage summary card ── */}
              {activeGroupage && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "16px 20px", marginBottom: 24,
                  background: "#fff", border: "1px solid rgba(11,42,61,0.14)", borderRadius: 10,
                }}>
                  <div style={{ width: 38, height: 38, borderRadius: 8, background: "rgba(11,42,61,0.06)", color: "#0B2A3D", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Package size={17} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: "0.85rem", color: "#0B2A3D" }}>
                      {activeGroupage.supplier}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#6E7F87" }}>
                      {activeGroupage.client ? `Client: ${activeGroupage.client}` : "Client TBD"}
                      <span style={{ margin: "0 6px" }}>·</span>
                      {activeGroupage.delivered ? "Delivered" : "Pending delivery"}
                    </div>
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: "0.66rem", color: "#6E7F87" }}>
                    {docs.length} doc{docs.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {/* ── Upload button ── */}
              <div style={{ marginBottom: 20 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: "none" }}
                  onChange={handleUpload}
                  disabled={uploading}
                  accept="application/pdf,image/*,text/plain,.doc,.docx,.xls,.xlsx"
                />
                <button
                  className="pvdoc-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading
                    ? <Upload size={14} style={{ animation: "pvdoc-spin 1s linear infinite" }} />
                    : <Plus size={14} />}
                  {uploading ? "Uploading…" : "Add document"}
                </button>
              </div>

              {/* ── Document list ── */}
              {docs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "44px 20px", color: "#6E7F87", border: "1px dashed rgba(11,42,61,0.18)", borderRadius: 10 }}>
                  <FileText size={24} style={{ opacity: 0.4, marginBottom: 10, display: "block", margin: "0 auto 10px" }} />
                  <p style={{ fontFamily: MONO, fontSize: 12 }}>No documents uploaded for this groupage yet.</p>
                </div>
              ) : (
                <div style={{ border: "1px solid rgba(11,42,61,0.18)", borderRadius: 10, overflow: "hidden" }}>
                  {docs.map((doc, i) => {
                    const DocIcon   = docIconFor(doc.name);
                    const canView   = isPreviewable(doc.mimeType);
                    return (
                      <div key={doc.id} className="pvdoc-row" style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "15px 18px", background: "#fff",
                        borderBottom: i < docs.length - 1 ? "1px solid rgba(11,42,61,0.08)" : "none",
                      }}>

                        {/* File type icon */}
                        <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 9, background: "rgba(47,126,108,0.08)", color: "#2F7E6C", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <DocIcon size={17} />
                        </div>

                        {/* Name + meta */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "0.9rem", color: "#0B2A3D", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {doc.name}
                          </div>
                          <div style={{ fontFamily: MONO, fontSize: "0.62rem", letterSpacing: "0.04em", color: "#6E7F87" }}>
                            {doc.fileName} · {formatBytes(doc.size)} · {formatDateTime(doc.uploadedAt)}
                          </div>
                        </div>

                        {/* Actions: View (only for previewable types) + Download + Delete */}
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          {canView && (
                            <button
                              className="pvdoc-icon-btn"
                              onClick={() => viewDoc(doc)}
                              title="Open in new tab"
                            >
                              <Eye size={15} />
                            </button>
                          )}
                          <button
                            className="pvdoc-icon-btn"
                            onClick={() => downloadDoc(doc)}
                            title="Download"
                          >
                            <Download size={15} />
                          </button>
                          <button
                            className="pvdoc-icon-btn danger"
                            onClick={() => handleDeleteDoc(doc.id)}
                            title="Remove"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap');

.pvdoc-back {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: 'IBM Plex Mono', monospace; font-size: 0.65rem;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: #9DB5C0; background: none; border: none; cursor: pointer;
  margin-bottom: 16px; padding: 0; transition: color .15s;
}
.pvdoc-back:hover { color: #DCE6EA; }

.pvdoc-select {
  width: 100%; appearance: none; -webkit-appearance: none;
  font-family: 'IBM Plex Sans', sans-serif; font-size: 0.85rem; color: #1C2B33;
  padding: 12px 40px; border: 1px solid rgba(11,42,61,0.18); border-radius: 9px;
  background: #fff; cursor: pointer;
}
.pvdoc-select:focus { outline: 2px solid rgba(11,42,61,0.25); outline-offset: 1px; }

.pvdoc-upload-btn {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: 'IBM Plex Mono', monospace; font-size: 0.7rem;
  letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600;
  padding: 10px 18px; border-radius: 8px; border: none; cursor: pointer;
  background: #0B2A3D; color: #DCE6EA; transition: background .15s;
}
.pvdoc-upload-btn:hover:not(:disabled) { background: #163E54; }
.pvdoc-upload-btn:disabled { opacity: 0.65; cursor: default; }

.pvdoc-row { transition: background .12s; }
.pvdoc-row:hover { background: #faf9f5 !important; }

.pvdoc-icon-btn {
  width: 32px; height: 32px; flex-shrink: 0; border-radius: 7px;
  border: 1px solid rgba(11,42,61,0.14); background: #fff; color: #6E7F87;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background .12s, color .12s, border-color .12s;
}
.pvdoc-icon-btn:hover       { background: #E6F1FB; color: #185FA5; border-color: rgba(24,95,165,0.3); }
.pvdoc-icon-btn.danger:hover { background: #FBEAE4; color: #D6492F; border-color: rgba(214,73,47,0.3); }

@keyframes pvdoc-spin { to { transform: rotate(360deg); } }
`;
