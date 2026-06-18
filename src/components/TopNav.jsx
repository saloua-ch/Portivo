import { NavLink, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Bell, Mail, Anchor } from "lucide-react";
import { getAlerts, subscribeAlerts } from "../state/alerts";

/**
 * TopNav — replaces Sidebar across inner app pages.
 * Mirrors the topbar treatment from the Home hero (dark ink bar,
 * mono uppercase links, sync indicator, faint chart-grid texture)
 * so inner pages still feel part of the same instrument.
 *
 * Place at: src/components/TopNav.jsx
 *
 * Bell behaviour:
 *  - Subscribes to the shared alerts store (src/state/alerts.js), which
 *    Arrivals.jsx publishes to whenever a container needs follow-up
 *    (ETA/ETD overdue or due today and not yet verified).
 *  - Badge count mirrors alerts.count; bell turns coral and gets a
 *    subtle pulse when count > 0, calms to neutral grey at zero.
 *  - Click opens a small dropdown listing each alert with a link to
 *    its container; clicking a row navigates to /containers/:id.
 *  - TODO: once you have real persistence/auth, the store can be filled
 *    by a polling fetch or websocket push instead of only Arrivals —
 *    the subscribe contract here doesn't need to change.
 */
export default function TopNav() {
  const [syncTime, setSyncTime] = useState("");
  const [alerts, setLocalAlerts] = useState(getAlerts());
  const [open, setOpen] = useState(false);
  const popRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    setSyncTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeAlerts(setLocalAlerts);
    return unsubscribe;
  }, []);

  // Close the dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (popRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const hasAlerts = alerts.count > 0;

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

      <div className="pv-topnav-right">
        <div className="pv-topnav-bell-wrap">
          <button
            ref={btnRef}
            type="button"
            className={`pv-topnav-bell ${hasAlerts ? "has-alerts" : ""}`}
            onClick={() => setOpen(o => !o)}
            aria-label={hasAlerts ? `${alerts.count} containers need follow-up` : "No alerts"}
            aria-expanded={open}
          >
            <Bell size={16} />
            {hasAlerts && <span className="pv-topnav-bell-badge">{alerts.count}</span>}
          </button>

          {open && (
            <div ref={popRef} className="pv-topnav-pop">
              <div className="pv-topnav-pop-head">
                {hasAlerts ? `${alerts.count} need${alerts.count === 1 ? "s" : ""} follow-up` : "No alerts"}
              </div>

              {hasAlerts ? (
                <ul className="pv-topnav-pop-list">
                  {alerts.items.map(item => (
                    <li key={`${item.id}-${item.type}`}>
                      <Link
                        to={`/containers/${item.id}`}
                        className="pv-topnav-pop-row"
                        onClick={() => setOpen(false)}
                      >
                        <span className={`pv-topnav-pop-icon ${item.severity}`}>
                          {item.type === "etd" ? <Anchor size={12} /> : <Mail size={12} />}
                        </span>
                        <span className="pv-topnav-pop-text">
                          <span className="pv-topnav-pop-number">{item.number}</span>
                          <span className="pv-topnav-pop-msg">{item.message}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="pv-topnav-pop-empty">All caught up — nothing waiting on a reply.</p>
              )}

              <Link to="/arrivals" className="pv-topnav-pop-footer" onClick={() => setOpen(false)}>
                View Arrivals →
              </Link>
            </div>
          )}
        </div>

        <span className="pv-topnav-sync">
          <span className="pv-topnav-dot" aria-hidden="true" />
          Synced {syncTime}
        </span>
      </div>
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
  overflow: visible;
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

.pv-topnav-right{
  position: relative;
  display: flex;
  align-items: center;
  gap: 18px;
  flex-shrink: 0;
}

.pv-topnav-bell-wrap{
  position: relative;
}

.pv-topnav-bell{
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 7px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
  color: #6F8B9C;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.pv-topnav-bell:hover{
  background: rgba(255,255,255,0.08);
  color: #DCE6EA;
}

.pv-topnav-bell.has-alerts{
  color: #F2A98C;
  border-color: rgba(214,73,47,0.35);
  background: rgba(214,73,47,0.12);
}

.pv-topnav-bell.has-alerts:hover{
  color: #FBEAE4;
  background: rgba(214,73,47,0.2);
}

@media (prefers-reduced-motion: no-preference){
  .pv-topnav-bell.has-alerts svg{
    animation: pv-topnav-ring 2.6s ease-in-out infinite;
  }
}
@keyframes pv-topnav-ring{
  0%, 76%, 100% { transform: rotate(0deg); }
  78% { transform: rotate(-12deg); }
  80% { transform: rotate(10deg); }
  82% { transform: rotate(-8deg); }
  84% { transform: rotate(6deg); }
  86% { transform: rotate(0deg); }
}

.pv-topnav-bell-badge{
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: #D6492F;
  color: #FBEAE4;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9.5px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
  border: 1.5px solid #0B2A3D;
}

.pv-topnav-pop{
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 320px;
  max-height: 380px;
  overflow-y: auto;
  background: #ECE7DA;
  border: 1px solid rgba(11,42,61,.14);
  border-radius: 10px;
  box-shadow: 0 12px 28px rgba(8,20,30,.28);
  z-index: 40;
}

.pv-topnav-pop-head{
  padding: 12px 16px 10px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: #1C2B33;
  border-bottom: 1px solid rgba(11,42,61,.1);
}

.pv-topnav-pop-list{
  list-style: none;
  margin: 0;
  padding: 4px 0;
}

.pv-topnav-pop-row{
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 9px 16px;
  text-decoration: none;
  transition: background 0.12s;
}

.pv-topnav-pop-row:hover{
  background: rgba(11,42,61,.06);
}

.pv-topnav-pop-icon{
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}

.pv-topnav-pop-icon.overdue{
  background: rgba(214,73,47,.14);
  color: #D6492F;
}

.pv-topnav-pop-icon.due_today{
  background: rgba(201,145,43,.16);
  color: #854F0B;
}

.pv-topnav-pop-text{
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.pv-topnav-pop-number{
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  color: #0B2A3D;
}

.pv-topnav-pop-msg{
  font-size: 11.5px;
  color: #6E7F87;
}

.pv-topnav-pop-empty{
  padding: 16px;
  font-size: 12px;
  color: #6E7F87;
}

.pv-topnav-pop-footer{
  display: block;
  padding: 10px 16px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: #0B2A3D;
  text-decoration: none;
  border-top: 1px solid rgba(11,42,61,.1);
  background: rgba(11,42,61,.03);
}

.pv-topnav-pop-footer:hover{
  background: rgba(11,42,61,.07);
}

.pv-topnav-sync{
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
  .pv-topnav-right{ align-self: flex-start; }
  .pv-topnav-pop{ right: auto; left: 0; width: min(320px, 90vw); }
}
`;
