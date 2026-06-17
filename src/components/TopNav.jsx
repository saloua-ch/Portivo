import { NavLink, Link } from "react-router-dom";
import { useState, useEffect } from "react";

/**
 * TopNav — replaces Sidebar across inner app pages.
 * Mirrors the topbar treatment from the Home hero (dark ink bar,
 * mono uppercase links, sync indicator, faint chart-grid texture)
 * so inner pages still feel part of the same instrument.
 *
 * Place at: src/components/TopNav.jsx
 */
export default function TopNav() {
  const [syncTime, setSyncTime] = useState("");

  useEffect(() => {
    setSyncTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
  }, []);

  return (
    <header className="pv-topnav">
      <style>{CSS}</style>

      {/* faint chart-grid texture, purely decorative */}
      <svg className="pv-topnav-grid" viewBox="0 0 1440 64" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" y1="32" x2="1440" y2="32" />
        <line x1="240" y1="0" x2="240" y2="64" />
        <line x1="480" y1="0" x2="480" y2="64" />
        <line x1="720" y1="0" x2="720" y2="64" />
        <line x1="960" y1="0" x2="960" y2="64" />
        <line x1="1200" y1="0" x2="1200" y2="64" />
      </svg>

      <Link to="/" className="pv-topnav-brand">
        Portivo
      </Link>

      <nav className="pv-topnav-links">
        <NavLink to="/arrivals" className={navClass}>Arrivals</NavLink>
        <NavLink to="/containers" className={navClass}>Containers</NavLink>
        <NavLink to="/search" className={navClass}>Search</NavLink>
        <NavLink to="/import" className={navClass}>Import</NavLink>
        <NavLink to="/analytics" className={navClass}>Analytics</NavLink>
        <NavLink to="/AddEntry" className={navClass}>Add Entry</NavLink>
      </nav>

      <span className="pv-topnav-sync">
        <span className="pv-topnav-dot" aria-hidden="true" />
        Synced {syncTime}
      </span>
    </header>
  );
}

function navClass({ isActive }) {
  return `pv-topnav-link ${isActive ? "is-active" : ""}`;
}

const CSS = `
.pv-topnav{
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 18px clamp(20px, 4vw, 48px);
  background: #0B2A3D;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  font-family: 'IBM Plex Sans', sans-serif;
  overflow: hidden;
}

.pv-topnav-grid{
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  stroke: #18435A;
  stroke-width: 1;
  opacity: 0.5;
  pointer-events: none;
}

.pv-topnav-brand{
  position: relative;
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 1.15rem;
  letter-spacing: 0.04em;
  color: #DCE6EA;
  text-decoration: none;
  flex-shrink: 0;
}

.pv-topnav-links{
  position: relative;
  display: flex;
  gap: clamp(14px, 2.6vw, 32px);
  flex-wrap: wrap;
}

.pv-topnav-link{
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #6F8B9C;
  text-decoration: none;
  padding: 4px 0;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
}

.pv-topnav-link:hover{ color: #DCE6EA; }

.pv-topnav-link.is-active{
  color: #DCE6EA;
  border-bottom-color: #2F7E6C;
}

.pv-topnav-sync{
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #6F8B9C;
  flex-shrink: 0;
}

.pv-topnav-dot{
  width: 6px; height: 6px; border-radius: 50%;
  background: #C7E0D8;
  flex-shrink: 0;
}
@media (prefers-reduced-motion: no-preference){
  .pv-topnav-dot{ animation: pv-topnav-blink 2.4s ease-in-out infinite; }
}
@keyframes pv-topnav-blink{ 0%,100%{ opacity: 1; } 50%{ opacity: 0.25; } }

@media (max-width: 860px){
  .pv-topnav{ flex-direction: column; align-items: flex-start; gap: 14px; }
  .pv-topnav-links{ gap: 16px; }
  .pv-topnav-sync{ align-self: flex-start; }
}
`;
