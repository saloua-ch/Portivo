import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { LanguageProvider } from "./context/LanguageContext";
import * as auth from "./api/auth";
import TopNav from "./components/TopNav";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Arrivals from "./pages/Arrivals";
import Containers from "./pages/Containers";
import ContainerDetail from "./pages/ContainerDetail";
import Search from "./pages/Search";
import Import from "./pages/Import";
import Analytics from "./pages/Analytics";
import AddEntry from "./pages/AddEntry";
import Archives from "./pages/Archives";
import Documents from "./pages/Documents";

/**
 * AppShell — only renders the TopNav.
 * No padding, no background, no wrapper styles.
 * Each page owns its full layout: hero, body, spacing — everything.
 */
function AppShell({ children }) {
  return (
    <div style={{ minHeight: "100vh" }}>
      <TopNav />
      {children}
    </div>
  );
}

/**
 * useAuthState — tracks the current session via the auth facade.
 * "loading" while the initial session check is in flight, then
 * "authed" / "anon" and kept in sync via onAuthChange (covers sign-out,
 * token expiry, and cross-tab changes).
 */
function useAuthState() {
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    let mounted = true;
    auth.getSession().then(session => {
      if (mounted) setStatus(session ? "authed" : "anon");
    });
    const unsubscribe = auth.onAuthChange(session => {
      if (mounted) setStatus(session ? "authed" : "anon");
    });
    return () => { mounted = false; unsubscribe(); };
  }, []);
  return status;
}

function AuthLoading() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0B2A3D", color: "#6F8B9C",
      fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
      letterSpacing: "0.16em", textTransform: "uppercase",
    }}>
      Loading…
    </div>
  );
}

/** RequireAuth — gates a route behind a valid session, redirecting to
 * /login (and remembering where the person was headed) otherwise. */
function RequireAuth({ children }) {
  const status = useAuthState();
  const location = useLocation();
  if (status === "loading") return <AuthLoading />;
  if (status === "anon") return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Home is full-screen — no nav, no shell, but still gated */}
          <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />

          {/* All inner pages get the nav bar only, no padding wrapper */}
          <Route path="/arrivals"                          element={<RequireAuth><AppShell><Arrivals /></AppShell></RequireAuth>} />
          <Route path="/containers"                        element={<RequireAuth><AppShell><Containers /></AppShell></RequireAuth>} />
          <Route path="/containers/:id"                    element={<RequireAuth><AppShell><ContainerDetail /></AppShell></RequireAuth>} />
          {/* Documents must be nested under /containers/:id so the page can
              read the container id from params. The ?g=<index> query string
              selects which groupage's docs to show — handled inside the page. */}
          <Route path="/containers/:id/documents"          element={<RequireAuth><AppShell><Documents /></AppShell></RequireAuth>} />
          <Route path="/search"                            element={<RequireAuth><AppShell><Search /></AppShell></RequireAuth>} />
          <Route path="/import"                            element={<RequireAuth><AppShell><Import /></AppShell></RequireAuth>} />
          <Route path="/analytics"                         element={<RequireAuth><AppShell><Analytics /></AppShell></RequireAuth>} />
          <Route path="/AddEntry"                          element={<RequireAuth><AppShell><AddEntry /></AppShell></RequireAuth>} />
          <Route path="/Archives"                          element={<RequireAuth><AppShell><Archives /></AppShell></RequireAuth>} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}