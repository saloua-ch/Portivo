import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Anchor, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";
import * as auth from "../api/auth";
import { useLanguage } from "../context/LanguageContext";

const MONO = "'IBM Plex Mono', monospace";

export default function Login() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await auth.signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.message?.toLowerCase().includes("invalid") ? t("login.errorInvalid") : t("login.errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pv-login-root">
      <style>{CSS}</style>

      {/* ── Left: photo panel ── */}
      <div className="pv-login-hero">
        <img
          loading="eager" fetchPriority="high"
          className="pv-login-hero-photo"
          src="/images/terminal.avif"
          alt="Container terminal at Tunis-Goulette"
        />
        <div className="pv-login-hero-gradient" />
        <div className="pv-login-hero-tint" />

        <div className="pv-login-hero-content">
          <div className="pv-login-brand">
            <Anchor size={18} strokeWidth={1.8} />
            <span>{t("login.heroTitle")}</span>
          </div>

          <p className="pv-login-eyebrow">{t("login.heroEyebrow")}</p>
          <p className="pv-login-tagline">{t("login.heroTagline")}</p>

          <div className="pv-login-terminal-tag">
            <span className="pv-login-dot" aria-hidden="true" />
            {t("login.terminalLabel")}
          </div>
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div className="pv-login-panel">
        <form className="pv-login-card" onSubmit={handleSubmit} noValidate>
          <p className="pv-login-card-eyebrow">{t("login.terminalLabel")}</p>
          <h1 className="pv-login-card-title">{t("login.welcomeTitle")}</h1>
          <p className="pv-login-card-sub">{t("login.welcomeSubtitle")}</p>

          {error && (
            <div className="pv-login-error" role="alert">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <label className="pv-login-field">
            <span className="pv-login-label">{t("login.emailLabel")}</span>
            <div className="pv-login-input-wrap">
              <Mail size={15} className="pv-login-input-icon" />
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t("login.emailPlaceholder")}
                disabled={submitting}
              />
            </div>
          </label>

          <label className="pv-login-field">
            <span className="pv-login-label">{t("login.passwordLabel")}</span>
            <div className="pv-login-input-wrap">
              <Lock size={15} className="pv-login-input-icon" />
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t("login.passwordPlaceholder")}
                disabled={submitting}
              />
            </div>
          </label>

          <button type="submit" className="pv-login-submit" disabled={submitting}>
            {submitting ? t("login.signingIn") : (
              <>
                {t("login.signInButton")}
                <ArrowRight size={15} />
              </>
            )}
          </button>

          <div className="pv-login-secure">
            <span className="pv-login-dot pv-login-dot-small" aria-hidden="true" />
            {t("login.secureNote")}
          </div>
        </form>
      </div>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap');

.pv-login-root * { box-sizing: border-box; }
.pv-login-root {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  font-family: 'IBM Plex Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ── Hero / photo panel ── */
.pv-login-hero {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 100vh;
  background: #0B2A3D;
  padding: 0 clamp(28px, 4vw, 56px) clamp(40px, 6vh, 72px);
}
.pv-login-hero-photo {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover; object-position: center 40%;
}
.pv-login-hero-gradient {
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(8,32,48,.35) 0%, rgba(8,32,48,.55) 45%, rgba(7,21,31,.95) 100%);
}
.pv-login-hero-tint {
  position: absolute; inset: 0;
  background: rgba(11,42,61,.12);
}
.pv-login-hero-content {
  position: relative;
  z-index: 2;
  max-width: 480px;
}

.pv-login-brand {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 1.3rem;
  letter-spacing: .02em;
  color: #DCE6EA;
  margin-bottom: 28px;
}

.pv-login-eyebrow {
  font-family: ${MONO};
  font-size: 0.7rem;
  letter-spacing: .22em;
  text-transform: uppercase;
  color: #C7E0D8;
  margin: 0 0 14px;
}

.pv-login-tagline {
  font-family: 'Fraunces', serif;
  font-weight: 300;
  font-size: clamp(1.4rem, 2.6vw, 2rem);
  line-height: 1.35;
  color: rgba(220,230,234,.88);
  max-width: 22ch;
  margin: 0 0 32px;
}

.pv-login-terminal-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: ${MONO};
  font-size: 0.68rem;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: rgba(220,230,234,.65);
  padding: 8px 14px;
  border: 1px solid rgba(255,255,255,.14);
  border-radius: 20px;
  background: rgba(255,255,255,.05);
}

.pv-login-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #4dcca0;
  flex-shrink: 0;
}
@media (prefers-reduced-motion: no-preference) {
  .pv-login-dot { animation: pv-login-blink 2.4s ease-in-out infinite; }
}
@keyframes pv-login-blink { 0%,100% { opacity: 1; } 50% { opacity: .3; } }

/* ── Form panel ── */
.pv-login-panel {
  background: #ECE7DA;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
}

.pv-login-card {
  width: 100%;
  max-width: 380px;
}

.pv-login-card-eyebrow {
  font-family: ${MONO};
  font-size: 0.64rem;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: #6E7F87;
  margin: 0 0 20px;
}

.pv-login-card-title {
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: clamp(2rem, 3.6vw, 2.6rem);
  letter-spacing: -.01em;
  color: #0B2A3D;
  margin: 0 0 8px;
  line-height: 1;
}

.pv-login-card-sub {
  font-size: 0.9rem;
  color: #6E7F87;
  line-height: 1.5;
  margin: 0 0 30px;
  max-width: 36ch;
}

.pv-login-error {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 11px 14px;
  margin-bottom: 20px;
  background: #FBEAE4;
  border: 1px solid rgba(214,73,47,.3);
  border-radius: 8px;
  color: #a13a26;
  font-size: 0.83rem;
  line-height: 1.4;
}
.pv-login-error svg { flex-shrink: 0; margin-top: 1px; }

.pv-login-field {
  display: block;
  margin-bottom: 18px;
}

.pv-login-label {
  display: block;
  font-family: ${MONO};
  font-size: 0.64rem;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: #6E7F87;
  margin-bottom: 7px;
}

.pv-login-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid rgba(11,42,61,.18);
  border-radius: 9px;
  transition: border-color .15s, box-shadow .15s;
}
.pv-login-input-wrap:focus-within {
  border-color: #185FA5;
  box-shadow: 0 0 0 3px rgba(24,95,165,.12);
}

.pv-login-input-icon {
  position: absolute;
  left: 13px;
  color: #A8A39A;
  pointer-events: none;
}

.pv-login-input-wrap input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  padding: 12px 14px 12px 38px;
  font-size: 0.9rem;
  font-family: 'IBM Plex Sans', sans-serif;
  color: #1C2B33;
}
.pv-login-input-wrap input::placeholder { color: #C2BDB1; }
.pv-login-input-wrap input:disabled { opacity: .6; }

.pv-login-submit {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  margin-top: 8px;
  padding: 13px 20px;
  border: none;
  border-radius: 9px;
  background: #0B2A3D;
  color: #DCE6EA;
  font-family: ${MONO};
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: .1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background .15s, transform .15s;
}
.pv-login-submit:hover:not(:disabled) {
  background: #163E54;
  transform: translateY(-1px);
}
.pv-login-submit:disabled {
  opacity: .65;
  cursor: default;
}

.pv-login-secure {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  margin-top: 22px;
  font-family: ${MONO};
  font-size: 0.66rem;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: #A8A39A;
}
.pv-login-dot-small { background: #2F7E6C; }

/* ── Responsive ── */
@media (max-width: 860px) {
  .pv-login-root { grid-template-columns: 1fr; }
  .pv-login-hero { min-height: 42vh; padding-bottom: 32px; }
  .pv-login-tagline { display: none; }
  .pv-login-panel { padding: 36px 24px 56px; }
}
`;