import { BrowserRouter, Routes, Route } from "react-router-dom";
import TopNav from "./components/TopNav";
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home is full-screen — no nav, no shell */}
        <Route path="/" element={<Home />} />

        {/* All inner pages get the nav bar only, no padding wrapper */}
        <Route path="/arrivals"                          element={<AppShell><Arrivals /></AppShell>} />
        <Route path="/containers"                        element={<AppShell><Containers /></AppShell>} />
        <Route path="/containers/:id"                    element={<AppShell><ContainerDetail /></AppShell>} />
        {/* Documents must be nested under /containers/:id so the page can
            read the container id from params. The ?g=<index> query string
            selects which groupage's docs to show — handled inside the page. */}
        <Route path="/containers/:id/documents"          element={<AppShell><Documents /></AppShell>} />
        <Route path="/search"                            element={<AppShell><Search /></AppShell>} />
        <Route path="/import"                            element={<AppShell><Import /></AppShell>} />
        <Route path="/analytics"                         element={<AppShell><Analytics /></AppShell>} />
        <Route path="/AddEntry"                          element={<AppShell><AddEntry /></AppShell>} />
        <Route path="/Archives"                          element={<AppShell><Archives /></AppShell>} />
      </Routes>
    </BrowserRouter>
  );
}
