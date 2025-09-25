import React, { useState } from "react";
import AssetsPanel from "./components/AssetsPanel";
import DocumentsPanel from "./components/DocumentsPanel"; // <-- naam = bestandsnaam

export default function App() {
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
          {/* … jouw asset UI … */}<AssetsPanel />
        </section>
      ) : tab === 'docs' ? (
        <section className="stack">
          <h1>Documenten</h1>
          <DocumentsPanel /> {/* <-- hier rendert het witte venster-inhoud */}
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