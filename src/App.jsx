import { BrowserRouter, Routes, Route } from "react-router-dom";
import TopNav from "./components/TopNav";
import Home from "./pages/Home";
import Arrivals from "./pages/Arrivals";
import Containers from "./pages/Containers";
import ContainerDetail from "./pages/ContainerDetail";
import Search from "./pages/Search";
import Import from "./pages/Import";
import Analytics from "./pages/Analytics";

function AppShell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#ECE7DA" }}>
      <TopNav />
      <main style={{ padding: "32px clamp(20px, 4vw, 48px)" }}>
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Full-screen home page — no top nav, no padding */}
        <Route path="/" element={<Home />} />

        {/* Everything else lives inside the top-nav shell */}
        <Route path="/arrivals" element={<AppShell><Arrivals /></AppShell>} />
        <Route path="/containers" element={<AppShell><Containers /></AppShell>} />
        <Route path="/containers/:id" element={<AppShell><ContainerDetail /></AppShell>} />
        <Route path="/search" element={<AppShell><Search /></AppShell>} />
        <Route path="/import" element={<AppShell><Import /></AppShell>} />
        <Route path="/analytics" element={<AppShell><Analytics /></AppShell>} />
      </Routes>
    </BrowserRouter>
  );
}
