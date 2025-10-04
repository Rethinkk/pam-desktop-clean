/* @ts-nocheck */
import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// 👇 UI-kit centraal activeren (let op het pad vanaf src/)
import { Style } from "./components/ui/UI";

// 👉 Dit is je NIEUWE shell uit components (met 'doc-register' tab)
import AssetShell from "./components/AssetShell";

// Overige imports die je lokaal gebruikte in je (oude) shell en routes:
import FrontPage from "./components/FrontPage";
import AssetRegisterPanel from "./components/AssetRegisterPanel";
import AssetsPanel from "./components/AssetsPanel";
import DocumentsPanel from "./components/DocumentsPanel";
import PeoplePanel from "./components/PeoplePanel";

/**
 * ✅ BELANGRIJK:
 * We hernoemen je LOKALE shell zodat hij de geïmporteerde AssetShell niet meer overschrijft.
 * Verder is de inhoud ongewijzigd, zodat al je classNames en tabs blijven zoals je ze had.
 */
function LegacyAssetShell() {
  const [tab, setTab] = useState<'assets' | 'asset-register' | 'docs' | 'people' | 'about'>('assets');

  return (
    <div className="container">
      <div className="tabs">
        <button className={`tab ${tab==='assets'?'active':''}`} onClick={() => setTab('assets')}>Assets</button>
        <button className={`tab ${tab==='asset-register'?'active':''}`} onClick={() => setTab('asset-register')}>Asset Register</button>
        <button className={`tab ${tab==='docs'?'active':''}`} onClick={() => setTab('docs')}>Docs</button>
        <button className={`tab ${tab==='people'?'active':''}`} onClick={() => setTab('people')}>Mensen</button>
        <button className={`tab ${tab==='about'?'active':''}`} onClick={() => setTab('about')}>About</button>
      </div>

      {tab === 'assets' && (
        <section className="stack">
          <h1>Assets</h1>
          {/* Navigeer na aanmaken naar het register */}
          <AssetsPanel />
        </section>
      )}

      {tab === 'asset-register' && (
        <section className="stack">
          <h1>Asset register</h1>
          {/* >>> scope zodat alleen dit scherm gestyled wordt <<< */}
          <div className="asset-form-scope">
            <AssetRegisterPanel />
          </div>
        </section>
      )}

      {tab === 'docs' && (
        <section className="stack">
          <h1>Documenten</h1>
          <DocumentsPanel />
        </section>
      )}

      {tab === "people" && <PeoplePanel />}

      {tab === 'about' && (
        <section className="stack">
          <h1>Over PAM</h1>
          <div className="card"><p>Personal Asset Manager.</p></div>
        </section>
      )}
    </div>
  );
}

export default function App() {
  // 🔹 Lees .env-variabelen (Vite: moeten met VITE_ beginnen)
  const appName = import.meta.env.VITE_APP_NAME ?? "PAM";
  const emailApi = import.meta.env.VITE_EMAIL_API_URL ?? "";

  if (import.meta.env.DEV) {
    console.log("[ENV] VITE_APP_NAME =", appName);
    console.log("[ENV] VITE_EMAIL_API_URL =", emailApi || "(niet ingesteld)");
  }

  return (
    <BrowserRouter>
      {/* ⬇️ 1) UI-kit styles één keer injecteren, direct onder BrowserRouter */}
      <Style />

      {/* ---- 2) Bestaande tijdelijke layout-fix blijft staan ---- */}
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

      {/* Badge alleen in DEV */}
      {import.meta.env.DEV && (
        <div className="env-badge">
          {appName} • {emailApi ? "mail API ✔︎" : "mail API ⨯"}
        </div>
      )}
    </BrowserRouter>
  );
}

