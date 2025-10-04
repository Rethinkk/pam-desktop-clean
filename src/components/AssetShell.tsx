/* @ts-nocheck */
import React from "react";

import AssetsPanel from "./AssetsPanel";
import DocumentsPanel from "./DocumentsPanel";
import PeoplePanel from "./PeoplePanel";
import ReportingPanel from "./ReportingPanel";
import AssetRegisterPanel from "./AssetRegisterPanel";
import DocumentRegisterPanel from "./DocumentRegisterPanel";

type TabKey =
  | "assets"
  | "asset-register"
  | "docs"
  | "doc-register"
  | "people"
  | "reporting";

const TAB_STORAGE_KEY = "pam-active-tab";

/** Injecteer de 'Reporting-look' als algemene UI-stijl (scoped onder .rp) */
function ReportingLook() {
  return (
    <style>{`
      /* Brand sizing control (één plek tweaken) */
      .rp { --brand-scale: 1.40; } /* verander deze waarde naar smaak */

      /* Brandbar (boven tabs) */
      .rp .brandbar {
        display:flex; align-items:baseline; gap:8px;
        margin: 0 0 24px; color:#fff; /* witte merktekst */
      }
      /* SCHAALBARE varianten: deze moeten NA de brandbar komen
         en er mag GEEN tweede set .brand-word/.brand-tag meer onder staan */
      .rp .brand-word {
        font-weight: 800;
        font-size: calc(16px * var(--brand-scale));
        line-height: 1.12;
        letter-spacing: .2px;
      }
      .rp .brand-tag {
        font-weight: 600;
        font-size: calc(16px * var(--brand-scale));
        opacity: .95;
      }
      .rp .brand-sep { opacity:.9; }

      /* Overige RP-styling */
      .rp { padding: 24px 24px 32px 24px; }
      .rp h1 { font-size: 28px; line-height: 1.2; margin: 0 0 16px; font-weight: 700; }
      .rp .card { background: #ffffff; border-radius: 16px; box-shadow: 0 6px 20px rgba(0,0,0,0.08); padding: 16px; margin-bottom: 16px; }
      .rp .tabs { display:flex; gap:8px; flex-wrap:wrap; margin: 0 0 12px; }
      .rp .tab {
        border:1px solid #e5e7eb; background:#fff; color:#0f172a;
        padding:8px 12px; border-radius:12px; font-weight:600; cursor:pointer;
      }
      .rp .tab:hover { background:#f8fafc; }
      .rp .tab.active { background:#0f172a; color:#fff; border-color:#0f172a; }
      .rp .tab-spacer { flex:1 1 auto; }
    `}</style>
  );
}

function usePersistedTab(defaultTab: TabKey = "assets") {
  const [tab, setTab] = React.useState<TabKey>(() => {
    const saved = localStorage.getItem(TAB_STORAGE_KEY);
    return (saved as TabKey) || defaultTab;
  });
  React.useEffect(() => {
    localStorage.setItem(TAB_STORAGE_KEY, tab);
  }, [tab]);
  return [tab, setTab] as const;
}

export default function AssetShell() {
  const [tab, setTab] = usePersistedTab("assets");

  return (
    <div className="rp">
      <ReportingLook />
{/* BRAND – above tabs, white on dark header */}
<div className="brandbar" aria-label="Brand">
  <span className="brand-word">PAM</span>
  <span className="brand-sep">—</span>
  <span className="brand-tag">Your Personal Asset Manager</span>
</div>

      <div className="card" style={{ marginBottom: 8 }}>
        <div className="tabs">
          <button className={`tab ${tab==="assets" ? "active":""}`} onClick={()=>setTab("assets")}>
            Assets
          </button>
          <button className={`tab ${tab==="asset-register" ? "active":""}`} onClick={()=>setTab("asset-register")}>
            Asset register
          </button>
          <button className={`tab ${tab==="docs" ? "active":""}`} onClick={()=>setTab("docs")}>
            Documenten
          </button>
          <button className={`tab ${tab==="doc-register" ? "active":""}`} onClick={()=>setTab("doc-register")}>
            Document register
          </button>
          <button className={`tab ${tab==="people" ? "active":""}`} onClick={()=>setTab("people")}>
            Mensen
          </button>
          <button className={`tab ${tab==="reporting" ? "active":""}`} onClick={()=>setTab("reporting")}>
            Rapportage
          </button>
          <div className="tab-spacer" />
        </div>
      </div>


      


      {/* Panels - zonder extra <h1> om dubbele titels te voorkomen */}
      {tab === "assets" && (
        <div className="card">
          <AssetsPanel />
        </div>
      )}

      {tab === "asset-register" && (
        <div className="card">
          <AssetRegisterPanel />
        </div>
      )}

      {tab === "docs" && (
        <div className="card">
          <DocumentsPanel />
        </div>
      )}

      {tab === "doc-register" && (
        <div className="card">
          <DocumentRegisterPanel />
        </div>
      )}

      {tab === "people" && (
        <div className="card">
          <PeoplePanel />
        </div>
      )}

      {tab === "reporting" && (
        <div className="card" style={{ padding: 0 }}>
          <ReportingPanel />
        </div>
      )}
    </div>
  );
}

