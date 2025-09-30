/* @ts-nocheck */
import React, { useState } from "react";

// LET OP: omdat dit bestand in src/components/ staat,
// importeer je de andere panels met "./BestandsNaam"
import AssetsPanel from "./AssetsPanel";
import DocumentsPanel from "./DocumentsPanel";
import PeoplePanel from "./PeoplePanel";
import AssetRegisterPanel from "./AssetRegisterPanel";

export default function AssetShell() {
  // GEEN object; gewoon een string-union
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
          <AssetRegisterPanel />
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
