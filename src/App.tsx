/* @ts-nocheck */
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Style } from "./components/ui/UI";
import AssetShell from "./components/AssetShell";

import FrontPage from "./components/FrontPage";
import AssetRegisterPanel from "./components/AssetRegisterPanel";
import AssetsPanel from "./components/AssetsPanel";
import DocumentsPanel from "./components/DocumentsPanel";
import PeoplePanel from "./components/PeoplePanel";

/** Oude shell blijft bestaan voor /legacy */
function LegacyAssetShell() {
  const [tab, setTab] = useState<
    "assets" | "asset-register" | "docs" | "people" | "about"
  >("assets");

  return (
    <div className="container">
      <div className="tabs">
        <button className={`tab ${tab === "assets" ? "active" : ""}`} onClick={() => setTab("assets")}>Assets</button>
        <button className={`tab ${tab === "asset-register" ? "active" : ""}`} onClick={() => setTab("asset-register")}>Asset Register</button>
        <button className={`tab ${tab === "docs" ? "active" : ""}`} onClick={() => setTab("docs")}>Docs</button>
        <button className={`tab ${tab === "people" ? "active" : ""}`} onClick={() => setTab("people")}>Mensen</button>
        <button className={`tab ${tab === "about" ? "active" : ""}`} onClick={() => setTab("about")}>About</button>
      </div>

      {tab === "assets" && (
        <section className="stack">
          <h1>Assets</h1>
          <AssetsPanel />
        </section>
      )}

      {tab === "asset-register" && (
        <section className="stack">
          <h1>Asset register</h1>
          <div className="asset-form-scope">
            <AssetRegisterPanel />
          </div>
        </section>
      )}

      {tab === "docs" && (
        <section className="stack">
          <h1>Documenten</h1>
          <DocumentsPanel />
        </section>
      )}

      {tab === "people" && <PeoplePanel />}

      {tab === "about" && (
        <section className="stack">
          <h1>Over PAM</h1>
          <div className="card">
            <p>Personal Asset Manager.</p>
          </div>
        </section>
      )}
    </div>
  );
}

export default function App() {
  // Env voor badge (niet kritisch)
  const appName = import.meta.env.VITE_APP_NAME ?? "PAM";
  const emailApi = import.meta.env.VITE_EMAIL_API_URL ?? "";

  // --- VEILIGE debug-balk (blokkeert nooit rendering) ---
  const API =
    (import.meta as any).env?.VITE_API_BASE ||
    "https://pam-desktop-api.onrender.com";

  const [apiStatus, setApiStatus] = useState<"idle" | "loading" | "ok" | "fail">(
    "idle"
  );
  const [counts, setCounts] = useState<{ people?: number; assets?: number }>({});

  useEffect(() => {
    let alive = true;
    // geen fetch → geen probleem
    if (!API) return;

    (async () => {
      try {
        setApiStatus("loading");
        // ping
        await fetch(`${API}/healthz`, { method: "GET" }).then((r) => r.text());
        // probeer rustig data te lezen (valt stil bij fout)
        const [people, assets] = await Promise.all([
          fetch(`${API}/people`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
          fetch(`${API}/assets`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
        ]);
        if (!alive) return;
        setCounts({
          people: Array.isArray(people) ? people.length : 0,
          assets: Array.isArray(assets) ? assets.length : 0,
        });
        setApiStatus("ok");
      } catch {
        if (alive) setApiStatus("fail");
      }
    })();

    return () => {
      alive = false;
    };
  }, [API]);

  return (
    <BrowserRouter>
      {/* Debug-balk (kan later uit als je wilt) */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 9999,
          padding: "8px 12px",
          background:
            apiStatus === "ok" ? "#e7f9ed" :
            apiStatus === "fail" ? "#fdeaea" : "#fffbe6",
          borderBottom: "1px solid",
          borderColor:
            apiStatus === "ok" ? "#c2efd0" :
            apiStatus === "fail" ? "#f5c2c7" : "#ffe58f",
          fontSize: 13,
        }}
      >
        {apiStatus === "idle" || apiStatus === "loading"
          ? "Connecting…"
          : apiStatus === "ok"
          ? `API connected • People: ${counts.people ?? 0} • Assets: ${
              counts.assets ?? 0
            }`
          : "API not reachable. Check VITE_API_BASE & CORS_ORIGIN."}
      </div>

      {/* UI-kit styles */}
      <Style />

      {/* Tijdelijke layout-fix */}
      <style>{`
        .container { margin-left: 32px !important; margin-right: auto !important; }
        .asset-form-scope { max-width: 760px; }
        .asset-form-scope form * { box-sizing: border-box; }
        .asset-form-scope form .row,
        .asset-form-scope form .grid,
        .asset-form-scope form [class*="grid"],
        .asset-form-scope form [style*="grid"],
        .asset-form-scope form .inline,
        .asset-form-scope form [class*="flex"] {
          display: block !important;
        }
        @media (min-width: 760px) {
          .asset-form-scope form label {
            display: inline-block;
            width: 240px;
            margin-right: 12px;
            vertical-align: middle;
            white-space: nowrap;
          }
          .asset-form-scope form label + input,
          .asset-form-scope form label + select,
          .asset-form-scope form label + textarea {
            display: inline-block;
            width: calc(100% - 240px - 12px);
            vertical-align: middle;
            margin-bottom: 12px;
          }
        }
        .env-badge {
          position: fixed; right: 10px; bottom: 10px;
          background: rgba(0,0,0,0.65); color: #fff; padding: 6px 10px;
          border-radius: 10px; font-size: 12px; z-index: 9999; pointer-events: none;
        }
      `}</style>

      <Routes>
        <Route path="/" element={<FrontPage />} />
        <Route path="/assets" element={<AssetShell />} />
        <Route path="/legacy" element={<LegacyAssetShell />} />
        <Route path="/debug-asset-register" element={<AssetRegisterPanel />} />
      </Routes>

      {/* Dev-badge */}
      {import.meta.env.DEV && (
        <div className="env-badge">
          {appName} • {emailApi ? "mail API ✔︎" : "mail API ⨯"}
        </div>
      )}
    </BrowserRouter>
  );
}
