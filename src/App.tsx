import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import FrontPage from "./components/FrontPage";
import AssetsPanel from "./components/AssetsPanel";
import DocumentsPanel from "./components/DocumentsPanel"; // <-- als jij DocsPanel gebruikt, zie noot hieronder
import PeoplePanel from "./components/PeoplePanel";

// Bestaande tab-UI, uitgebreid met Mensen-tab
function AssetShell() {
  const [tab, setTab] = useState<'assets' | 'docs' | 'people' | 'about'>('assets');

  return (
    <div className="container">
      <div className="tabs">
        <button className={`tab ${tab==='assets'?'active':''}`} onClick={() => setTab('assets')}>Assets</button>
        <button className={`tab ${tab==='docs'?'active':''}`} onClick={() => setTab('docs')}>Docs</button>
        <button className={`tab ${tab==='people'?'active':''}`} onClick={() => setTab('people')}>Mensen</button>
        <button className={`tab ${tab==='about'?'active':''}`} onClick={() => setTab('about')}>About</button>
      </div>

      {tab === 'assets' && (
        <section className="stack">
          <h1>Assets</h1>
          <AssetsPanel />
        </section>
      )}

      {tab === 'docs' && (
        <section className="stack">
          <h1>Documenten</h1>
          <DocumentsPanel />
        </section>
      )}

      {tab === 'people' && (
        <section className="stack">
          <h1>Mensen</h1>
          <PeoplePanel />
        </section>
      )}

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
