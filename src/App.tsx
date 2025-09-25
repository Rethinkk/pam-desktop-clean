import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import FrontPage from "./components/FrontPage";
import AssetsPanel from "./components/AssetsPanel";
import DocumentsPanel from "./components/DocumentsPanel";

// Dit is je bestaande tab-UI, nu als aparte component voor route /assets
function AssetShell() {
  const [tab, setTab] = useState<'assets' | 'docs' | 'about'>('assets');

  return (
    <div className="container">
      <div className="tabs">
        <button className={`tab ${tab==='assets'?'active':''}`} onClick={() => setTab('assets')}>Assets</button>
        <button className={`tab ${tab==='docs'?'active':''}`} onClick={() => setTab('docs')}>Docs</button>
        <button className={`tab ${tab==='about'?'active':''}`} onClick={() => setTab('about')}>About</button>
      </div>

      {tab === 'assets' ? (
        <section className="stack">
          <h1>Assets</h1>
          <AssetsPanel />
        </section>
      ) : tab === 'docs' ? (
        <section className="stack">
          <h1>Documenten</h1>
          <DocumentsPanel />
        </section>
      ) : (
        <section className="stack">
          <h1>Over PAM</h1>
          <div className="card"><p>Personal Asset Manager.</p></div>
        </section>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Frontpage op root */}
        <Route path="/" element={<FrontPage />} />
        {/* Jouw bestaande UI onder /assets */}
        <Route path="/assets" element={<AssetShell />} />
      </Routes>
    </BrowserRouter>
  );
}