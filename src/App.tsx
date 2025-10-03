/* @ts-nocheck */
import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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
          <AssetsPanel onCreated={() => setTab('asset-register')} />
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

  // Alleen in development wat extra logging (onzichtbaar voor eindgebruikers)
  if (import.meta.env.DEV) {
    console.log("[ENV] VITE_APP_NAME =", appName);
    console.log("[ENV] VITE_EMAIL_API_URL =", emailApi || "(niet ingesteld)");
  }

  return (
    <BrowserRouter>
      {/* ---- Alleen layout-fix, netjes binnen App ---- */}
      <style>{`
        /* 1) Paneel niet gecentreerd maar links uitlijnen */
        .container {
          margin-left: 32px !important;
          margin-right: auto !important;
        }

        /* Alleen toepassen op het Asset Register-scherm */
        .asset-form-scope {
          /* maximaal dezelfde breedte houden als voorheen */
          max-width: 760px;
        }

        /* 2) Eén veld per regel (ook als er ergens grid/flex staat) */
        .asset-form-scope form * { box-sizing: border-box; }
        .asset-form-scope form .row,
        .asset-form-scope form .grid,
        .asset-form-scope form [class*="grid"],
        .asset-form-scope form [style*="grid"],
        .asset-form-scope form .inline,
        .asset-form-scope form [class*="flex"] {
          display: block !important;
        }

        /* 3) Label links naast het veld, veld vult de resterende breedte */
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
            margin-bottom: 12px; /* eigen regel afsluiten */
          }
        }

        /* 🔹 Niet-intrusieve env-badge rechtsonder (alleen in DEV getoond via JSX) */
        .env-badge {
          position: fixed;
          right: 10px;
          bottom: 10px;
          background: rgba(0,0,0,0.65);
          color: #fff;
          padding: 6px 10px;
          border-radius: 10px;
          font-size: 12px;
          z-index: 9999;
          pointer-events: none; /* nooit klikken blokkeren */
        }
      `}</style>

      <Routes>
        {/* Je bestaande routes blijven behouden */}
        <Route path="/" element={<FrontPage />} />

        {/* 👉 NIEUWE shell (uit components) met de Document Register-tab */}
        <Route path="/assets" element={<AssetShell />} />

        {/* 👇 Jouw oude shell blijft bereikbaar voor vergelijking/back-up */}
        <Route path="/legacy" element={<LegacyAssetShell />} />

        {/* Jouw debugroute blijft bestaan */}
        <Route path="/debug-asset-register" element={<AssetRegisterPanel />} />
      </Routes>

      {/* 🔹 Toon de badge alleen in development; in productie is dit onzichtbaar */}
      {import.meta.env.DEV && (
        <div className="env-badge">
          {appName} • {emailApi ? "mail API ✔︎" : "mail API ⨯"}
        </div>
      )}
    </BrowserRouter>
  );
}
