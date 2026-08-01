/**
 * EmptyState — the one "nothing here yet" treatment used across every
 * page. Several pages had already independently converged on almost
 * this exact look (a muted icon + mono message), just with small,
 * unintentional differences in size/opacity/spacing each time. This
 * consolidates it so it can't drift again.
 */
export default function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div style={WRAP}>
      {Icon && <Icon size={26} style={ICON_STYLE} aria-hidden="true" />}
      <p style={TITLE_STYLE}>{title}</p>
      {hint && <p style={HINT_STYLE}>{hint}</p>}
    </div>
  );
}

const WRAP = { textAlign: "center", padding: "56px 20px", color: "#6E7F87", display: "flex", flexDirection: "column", alignItems: "center" };
const ICON_STYLE = { opacity: 0.35, marginBottom: 12 };
const TITLE_STYLE = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.8rem", color: "#6E7F87", margin: 0 };
const HINT_STYLE = { fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.7rem", color: "#A8A39A", marginTop: 6 };
