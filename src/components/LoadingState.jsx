/**
 * LoadingState — the one loading indicator used across every page.
 * Three dots blinking in sequence, using the exact same opacity-blink
 * technique already established by TopNav's "Synced" dot and Home's
 * Tunis marker — adapted into a classic staggered "..." pattern so a
 * full-page loading moment reads as more active than a single static
 * dot, without inventing a new motion language for it.
 */
export default function LoadingState({ label }) {
  return (
    <div style={WRAP}>
      <style>{CSS}</style>
      <span className="pv-loading-dots" aria-hidden="true">
        <span /><span /><span />
      </span>
      {label && <span style={LABEL}>{label}</span>}
    </div>
  );
}

const WRAP = { display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "56px 0" };
const LABEL = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6E7F87" };

const CSS = `
.pv-loading-dots { display: flex; align-items: center; gap: 5px; }
.pv-loading-dots span {
  width: 7px; height: 7px; border-radius: 50%;
  background: #2F7E6C;
}
@media (prefers-reduced-motion: no-preference) {
  .pv-loading-dots span { animation: pv-loading-blink 1.2s ease-in-out infinite; }
  .pv-loading-dots span:nth-child(2) { animation-delay: 0.15s; }
  .pv-loading-dots span:nth-child(3) { animation-delay: 0.3s; }
}
@keyframes pv-loading-blink { 0%, 80%, 100% { opacity: 0.25; } 40% { opacity: 1; } }
`;
