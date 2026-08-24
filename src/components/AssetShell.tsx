/* @ts-nocheck */
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AssetsPanel from "./AssetsPanel";
import DocumentsPanel from "./DocumentsPanel";
import PeoplePanel from "./PeoplePanel";
import ReportingPanel from "./ReportingPanel";
import AssetRegisterPanel from "./AssetRegisterPanel";
import DocumentRegisterPanel from "./DocumentRegisterPanel";
import ConsentPanel from "./ConsentPanel";
import SecurityPanel from "./SecurityPanel";
import AboutPanel from "./AboutPanel"; // ✅ About terug
import { Style as UIStyle, ToastHost } from "./ui/UI";
import { useAuth } from "../auth/AuthContext";
import {
  PAM_ACTIVE_TAB_STORAGE_KEY,
  PAM_ALLOWED_TABS,
  type PamWorkspaceTab,
} from "../lib/workspaceTabs";

type TabKey = PamWorkspaceTab;

const TAB_STORAGE_KEY = PAM_ACTIVE_TAB_STORAGE_KEY;
const ALLOWED_TABS: TabKey[] = PAM_ALLOWED_TABS;

/** Injecteer de 'Reporting-look' als algemene UI-stijl (scoped onder .rp) */
function ReportingLook() {
  return (
    <style>{`
      .rp {
        --pam-deep-navy: #123052;
        --pam-navy: #173A61;
        --pam-olive: #687348;
        --pam-ivory: #F8F5EE;
        --pam-soft-white: #FCFBF8;
        --pam-slate: #60718A;
        --pam-warm-grey: #DEDCD5;
        --brand-scale: 1.40;
      }

      /* Brand header */
      .rp .brandwrap {
        align-items:center;
        background:rgba(252,251,248,.97);
        border:1px solid var(--pam-warm-grey);
        border-radius:14px;
        box-shadow:0 8px 22px rgba(18,48,82,0.08);
        color:var(--pam-deep-navy);
        display:flex;
        gap:18px;
        justify-content:space-between;
        margin:0 0 16px;
        min-height:64px;
        padding:14px 24px;
      }
      .rp .brandbar { display:flex; align-items:baseline; gap:10px; min-width:0; }
      .rp .brand-home { appearance:none; border:0; background:transparent; color:inherit; padding:0; box-shadow:none; cursor:pointer; text-align:left; }
      .rp .brand-home:hover { background:transparent; text-decoration:none; }
      .rp .brand-word { color:var(--pam-deep-navy); font-weight:850; font-size:28px; line-height:1; letter-spacing:-.02em; }
      .rp .brand-sep { color:var(--pam-navy); opacity:.95; }
      .rp .brand-tag { color:var(--pam-deep-navy); font-weight:680; font-size:15px; opacity:.98; }
      .rp .brand-actions { align-items:center; display:flex; gap:18px; color:var(--pam-deep-navy); flex:0 0 auto; }
      .rp .brand-profile-wrap { position:relative; }
      .rp .brand-icon {
        align-items:center;
        background:transparent;
        border:2px solid var(--pam-deep-navy);
        border-radius:999px;
        box-shadow:none;
        color:var(--pam-deep-navy);
        display:inline-flex;
        font-size:15px;
        font-weight:780;
        height:26px;
        justify-content:center;
        padding:0;
        width:26px;
      }
      .rp .brand-icon:hover,
      .rp .brand-profile:hover {
        background:transparent;
        color:var(--pam-olive);
      }
      .rp .brand-profile {
        align-items:center;
        background:transparent;
        border:0;
        box-shadow:none;
        color:var(--pam-deep-navy);
        display:inline-flex;
        gap:10px;
        font-size:14px;
        font-weight:700;
        padding:0;
      }
      .rp .brand-person { font-size:20px; line-height:1; }
      .rp .brand-chevron { font-size:15px; line-height:1; }
      .rp .brand-menu {
        background:var(--pam-soft-white);
        border:1px solid var(--pam-warm-grey);
        border-radius:14px;
        box-shadow:0 14px 32px rgba(18,48,82,0.14);
        min-width:230px;
        padding:12px;
        position:absolute;
        right:0;
        top:34px;
        z-index:20;
      }
      .rp .brand-menu-name { font-weight:800; margin-bottom:3px; }
      .rp .brand-menu-email { color:var(--pam-slate); font-size:13px; margin-bottom:10px; overflow-wrap:anywhere; }

      /* Layout & cards */
      .rp {
        background:var(--pam-ivory);
        color:var(--pam-deep-navy);
        border-radius:18px;
        box-shadow:0 14px 38px rgba(0,0,0,0.18);
        margin:0 auto;
        min-height:calc(100vh - 40px);
        overflow:hidden;
        padding:0 26px 30px;
        width:min(calc(100% - clamp(22px, 8vw, 92px)), 1840px);
      }
      .rp h1 { color:var(--pam-deep-navy); font-size:26px; line-height:1.2; margin:0 0 12px; font-weight:780; letter-spacing:-.01em; }
      .rp h2, .rp h3 { color:var(--pam-deep-navy); }
      .rp .card {
        background:rgba(252,251,248,.94);
        border:1px solid var(--pam-warm-grey);
        border-radius:16px;
        box-shadow:0 8px 22px rgba(18,48,82,0.055);
        color:var(--pam-deep-navy);
        padding:22px;
        margin-bottom:16px;
      }
      .rp .pam-panel-card {
        min-height:560px;
      }

      /* Tabs */
      .rp .pam-tabs-shell {
        margin:0 0 18px;
        padding:2px 12px;
      }
      .rp .tabs { display:flex; gap:12px; flex-wrap:wrap; margin:0; }
      .rp .tab {
        border:1px solid var(--pam-warm-grey);
        background:rgba(252,251,248,.95);
        border-radius:999px;
        box-shadow:0 4px 12px rgba(18,48,82,0.06);
        color:var(--pam-deep-navy);
        cursor:pointer;
        font-size:14px;
        font-weight:700;
        padding:9px 17px;
      }
      .rp .tab:hover { background:#fff; border-color:var(--pam-olive); color:var(--pam-deep-navy); }
      .rp .tab.active {
        background:linear-gradient(180deg, #74815a 0%, #4f5c36 100%);
        border-color:#4f5c36;
        box-shadow:0 8px 18px rgba(79,92,54,0.18);
        color:#fff;
      }
      .rp .tab-spacer { flex:1 1 auto; }

      @media (max-width: 760px) {
        .rp {
          padding:0 14px 22px;
          width:100%;
        }
        .rp .brandwrap {
          align-items:flex-start;
          flex-direction:column;
          padding:16px 18px;
        }
        .rp .brand-word { font-size:30px; }
        .rp .brand-tag { font-size:14px; }
        .rp .brand-actions { justify-content:space-between; width:100%; }
        .rp .pam-tabs-shell { overflow-x:auto; padding:2px 2px 16px; }
        .rp .tabs { flex-wrap:nowrap; }
        .rp .card { border-radius:16px; padding:18px; }
      }
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
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = React.useState(false);
  const requestedTab = location.state?.tab;
  const initialTab = ALLOWED_TABS.includes(requestedTab) ? requestedTab : "assets";
  const [tab, setTab] = usePersistedTab(initialTab);

  React.useEffect(() => {
    if (ALLOWED_TABS.includes(requestedTab)) setTab(requestedTab);
  }, [requestedTab, setTab]);

  React.useEffect(() => {
    const handler = (event: Event) => {
      const nextTab = (event as CustomEvent).detail?.tab;
      if (ALLOWED_TABS.includes(nextTab)) setTab(nextTab);
    };
    window.addEventListener("pam:set-tab", handler);
    return () => window.removeEventListener("pam:set-tab", handler);
  }, [setTab]);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }
  

  return (
    <div className="rp">
      <ReportingLook />
      <UIStyle />
      <ToastHost />

      <div className="brandwrap">
        <button className="brandbar brand-home" onClick={() => navigate("/start")} aria-label="Terug naar PAM startpagina">
          <span className="brand-word">PAM</span>
          <span className="brand-sep">-</span>
          <span className="brand-tag">Your Personal Asset Manager</span>
        </button>
        <div className="brand-actions" aria-label="Profiel en hulp">
          <button className="brand-icon" type="button" aria-label="Help">
            ?
          </button>
          <div className="brand-profile-wrap">
            <button
              className="brand-profile"
              type="button"
              aria-expanded={profileOpen}
              aria-label="Profiel"
              onClick={() => setProfileOpen((open) => !open)}
            >
              <span className="brand-person" aria-hidden="true">♙</span>
              <span>{user?.name ?? "PAM gebruiker"}</span>
              <span className="brand-chevron" aria-hidden="true">⌄</span>
            </button>
            {profileOpen && (
              <div className="brand-menu">
                <div className="brand-menu-name">{user?.name}</div>
                <div className="brand-menu-email">{user?.email}</div>
                <button className="ui-btn ui-btn--secondary" type="button" onClick={handleLogout}>
                  Uitloggen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="pam-tabs-shell">
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
          <button className={`tab ${tab === "consents" ? "active" : ""}`} onClick={() => setTab("consents")}>
            Toestemming
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
        <div className="card pam-panel-card">
          <AssetsPanel />
        </div>
      )}

      {tab === "asset-register" && (
        <div className="card pam-panel-card">
          <AssetRegisterPanel />
        </div>
      )}

      {tab === "docs" && (
        <div className="card pam-panel-card">
          <DocumentsPanel />
        </div>
      )}

      {tab === "doc-register" && (
        <div className="card pam-panel-card">
          <DocumentRegisterPanel />
        </div>
      )}

      {tab === "people" && (
        <div className="card pam-panel-card">
          <PeoplePanel />
        </div>
      )}

      {tab === "consents" && (
        <div className="card pam-panel-card">
          <ConsentPanel />
        </div>
      )}

      {tab === "reporting" && (
        <div className="card pam-panel-card">
          <ReportingPanel />
        </div>
      )}

      {tab === "about" && (
        <div className="card pam-panel-card">
          <AboutPanel />
        </div>
      )}

      {tab === "security" && (
        <div className="card pam-panel-card">
          <SecurityPanel />
        </div>
      )}
    </div>
  );
}
