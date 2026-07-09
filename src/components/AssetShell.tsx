/* @ts-nocheck */
import React from "react";
import { useLocation } from "react-router-dom";

import AssetsPanel from "./AssetsPanel";
import DocumentsPanel from "./DocumentsPanel";
import PeoplePanel from "./PeoplePanel";
import ReportingPanel from "./ReportingPanel";
import AssetRegisterPanel from "./AssetRegisterPanel";
import DocumentRegisterPanel from "./DocumentRegisterPanel";
import SecurityPanel from "./SecurityPanel";
import AboutPanel from "./AboutPanel"; // ✅ About terug
import { Style as UIStyle, ToastHost } from "./ui/UI";

type TabKey =
  | "assets"
  | "asset-register"
  | "docs"
  | "doc-register"
  | "people"
  | "reporting"
  | "about"
  | "security";

const TAB_STORAGE_KEY = "pam-active-tab";
const ALLOWED_TABS: TabKey[] = [
  "assets",
  "asset-register",
  "docs",
  "doc-register",
  "people",
  "reporting",
  "about",
  "security",
];

/** Injecteer de 'Reporting-look' als algemene UI-stijl (scoped onder .rp) */
function ReportingLook() {
  return (
    <style>{`
      .rp { --brand-scale: 1.40; }

      /* Brand header */
      .rp .brandwrap {
        background:#f8fafc;
        color:#0f172a;
        border-radius:16px;
        padding:14px 16px;
        margin: 0 0 16px;
        box-shadow:0 6px 20px rgba(0,0,0,0.08);
      }
      .rp .brandbar { display:flex; align-items:baseline; gap:8px; }
      .rp .brand-word { font-weight:800; font-size: calc(16px * var(--brand-scale)); line-height:1.12; letter-spacing:.2px; }
      .rp .brand-sep { opacity:.9; }
      .rp .brand-tag { font-weight:600; font-size: calc(16px * var(--brand-scale)); opacity:.95; }

      /* Layout & cards */
      .rp { padding: 24px 24px 32px 24px; }
      .rp h1 { font-size: 28px; line-height: 1.2; margin: 0 0 16px; font-weight: 700; }
      .rp .card { background:#fff; border-radius:16px; box-shadow:0 6px 20px rgba(0,0,0,0.08); padding:16px; margin-bottom:16px; }

      /* Tabs */
      .rp .tabs { display:flex; gap:8px; flex-wrap:wrap; margin:0 0 12px; }
      .rp .tab { border:1px solid #e5e7eb; background:#fff; color:#0f172a; padding:8px 12px; border-radius:12px; font-weight:600; cursor:pointer; }
      .rp .tab:hover { background:#f8fafc; }
      .rp .tab.active { background:#0f172a; color:#fff; border-color:#0f172a; }
      .rp .tab-spacer { flex:1 1 auto; }
    `}</style>
  );
}

/** Slaat de actieve tab op in localStorage en herstelt veilig */
function usePersistedTab(defaultTab: TabKey = "assets") {
  const [tab, setTab] = React.useState<TabKey>(() => {
    try {
      const saved = localStorage.getItem(TAB_STORAGE_KEY) as TabKey | null;
      return (saved && ALLOWED_TABS.includes(saved)) ? saved : defaultTab;
    } catch {
      return defaultTab;
    }
  });

  React.useEffect(() => {
    try {
      if (ALLOWED_TABS.includes(tab)) {
        localStorage.setItem(TAB_STORAGE_KEY, tab);
      } else {
        localStorage.removeItem(TAB_STORAGE_KEY);
      }
    } catch {}
  }, [tab]);

  return [tab, setTab] as const;
}

export default function AssetShell() {
  const location = useLocation();
  const requestedTab = location.state?.tab;
  const initialTab = ALLOWED_TABS.includes(requestedTab) ? requestedTab : "assets";
  const [tab, setTab] = usePersistedTab(initialTab);
  

  return (
    <div className="rp">
      <ReportingLook />
      <UIStyle />
      <ToastHost />

      {/* Brand (donkere balk, witte tekst) */}
      <div className="brandwrap">
        <div className="brandbar" aria-label="Brand">
          <span className="brand-word">PAM</span>
          <span className="brand-sep">—</span>
          <span className="brand-tag">Your Personal Asset Manager</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ marginBottom: 8 }}>
        <div className="tabs">
          <button className={`tab ${tab === "assets" ? "active" : ""}`} onClick={() => setTab("assets")}>
            Assets
          </button>
          <button className={`tab ${tab === "asset-register" ? "active" : ""}`} onClick={() => setTab("asset-register")}>
            Asset register
          </button>
          <button className={`tab ${tab === "docs" ? "active" : ""}`} onClick={() => setTab("docs")}>
            Documenten
          </button>
          <button className={`tab ${tab === "doc-register" ? "active" : ""}`} onClick={() => setTab("doc-register")}>
            Document register
          </button>
          <button className={`tab ${tab === "people" ? "active" : ""}`} onClick={() => setTab("people")}>
            Mensen
          </button>
          <button className={`tab ${tab === "reporting" ? "active" : ""}`} onClick={() => setTab("reporting")}>
            Rapportage
          </button>
          <button className={`tab ${tab === "about" ? "active" : ""}`} onClick={() => setTab("about")}>
            About
          </button>
          <button className={`tab ${tab === "security" ? "active" : ""}`} onClick={() => setTab("security")}>
            Security
          </button>
          <div className="tab-spacer" />
        </div>
      </div>

      {/* Panels */}
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

      {tab === "about" && (
        <div className="card">
          <AboutPanel />
        </div>
      )}

      {tab === "security" && (
        <div className="card">
          <SecurityPanel />
        </div>
      )}
    </div>
  );
}
