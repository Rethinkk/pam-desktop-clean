import React, { useState } from "react";
import AssetRegisterPanel from "./AssetRegisterPanel";
import AssetsPanel from "./AssetsPanel";
import DocumentsPanel from "./DocumentsPanel";
import PeoplePanel from "./PeoplePanel";
import ReportingPanel from "./ReportingPanel";

type Tab = "assets" | "asset-register" | "docs" | "people" | "reporting" | "about";

/** Compacte pill-tab; geen invloed op panel-logic */
function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={
        "h-8 px-3 rounded-full text-sm font-medium transition shadow-sm " +
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 " +
        (active ? "bg-white text-slate-900" : "text-slate-200 hover:bg-slate-700/60")
      }
    >
      {label}
    </button>
  );
}

export default function AssetShell() {
  const [tab, setTab] = useState<Tab>("assets");

  /** Eén uniforme content-shell: overal dezelfde linker ‘lijn’ + breedte */
  const shellStyle: React.CSSProperties = {
    padding: "24px 16px",
    paddingLeft: "clamp(16px, 4vw, 40px)", // identieke linker gutter
    maxWidth: 1100,                        // identieke contentbreedte
  };

  /** Basis kaartstijl voor de panelcontainer (alle tabs hetzelfde) */
  const cardStyle: React.CSSProperties = {
    backgroundColor: "#ffffff",
    color: "#0f172a",
    borderRadius: 16,
    boxShadow: "0 1px 2px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.06)",
    border: "1px solid rgba(0,0,0,.06)",
    width: "100%",
    padding: 24,
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Form grid helpers (zoals je had) */}
        <style>{`
  .auto-form-grid form {
    display: grid;
    grid-template-columns: max-content minmax(0, 720px);
    column-gap: 16px;
    row-gap: 12px;
    align-items: center;
    padding-left: 12px;
  }
  .auto-form-grid form > div,
  .auto-form-grid form > section,
  .auto-form-grid form > fieldset,
  .auto-form-grid form > div > div {
    display: contents;
  }
  .auto-form-grid form label {
    grid-column: 1;
    white-space: nowrap;
    font-weight: 600;
    color: #0f172a;
  }
  .auto-form-grid form input,
  .auto-form-grid form select,
  .auto-form-grid form textarea,
  .auto-form-grid form .form-field {
    grid-column: 2;
    max-width: 720px;
    width: 100%;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    background: #fff;
    color: #0f172a;
    padding: 10px 12px;
    height: 44px;
    box-sizing: border-box;
  }
  .auto-form-grid form textarea { min-height: 120px; height: auto; resize: vertical; }
  .auto-form-grid form h1,
  .auto-form-grid form h2,
  .auto-form-grid form legend,
  .auto-form-grid form .full,
  .auto-form-grid form .hint,
  .auto-form-grid form .tip,
  .auto-form-grid form .actions,
  .auto-form-grid form p,
  .auto-form-grid form small {
    grid-column: 1 / -1;
  }
  .auto-form-grid form button[type="submit"],
  .auto-form-grid .button-primary {
    grid-column: 1 / -1;
    justify-self: start;
    height: 44px;
    padding: 0 16px;
    border-radius: 12px;
    font-weight: 700;
    border: 0;
    background: #0f172a;
    color: #fff;
  }
  @media (max-width: 1100px) { .auto-form-grid form { grid-template-columns: 1fr; } }
  @media (max-width: 640px)  { .auto-form-grid form { padding-left: 0; } }
`}</style>

        {/* NAV + CONTENT samen in dezelfde shell voor perfecte uitlijning */}
        <div style={shellStyle}>
          <nav className="bg-slate-800 rounded-2xl p-2 shadow-sm mb-4">
            <div className="flex items-center flex-wrap gap-1">
              <TabButton label="Assets"         active={tab === "assets"}         onClick={() => setTab("assets")} />
              <TabButton label="Asset Register" active={tab === "asset-register"}  onClick={() => setTab("asset-register")} />
              <TabButton label="Docs"           active={tab === "docs"}           onClick={() => setTab("docs")} />
              <TabButton label="Mensen"         active={tab === "people"}         onClick={() => setTab("people")} />
              <TabButton label="Reporting"      active={tab === "reporting"}      onClick={() => setTab("reporting")} />
              <TabButton label="About"          active={tab === "about"}          onClick={() => setTab("about")} />
            </div>
          </nav>

          <section style={cardStyle}>
            {/* Uniforme header boven elk panel */}
            {(() => {
              const titles: Record<
                "assets" | "asset-register" | "docs" | "people" | "reporting" | "about",
                { title: string; subtitle?: string }
              > = {
                assets: { title: "Assets", subtitle: "Nieuw asset" },
                "asset-register": { title: "Asset Register" },
                docs: { title: "Docs" },
                people: { title: "Mensen" },
                reporting: {
                  title: "Reporting",
                  subtitle: "Genereer PDF-rapporten en verstuur ze naar gekozen ontvangers.",
                },
                about: { title: "Over PAM" },
              };
              const { title, subtitle } = titles[tab];
              return (
                <header style={{ marginBottom: 16 }}>
                  <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{title}</h1>
                  {subtitle ? <p style={{ marginTop: 6, color: "#334155" }}>{subtitle}</p> : null}
                </header>
              );
            })()}

            {/* Panels */}
            {tab === "assets" && <AssetsPanel />}
            {tab === "asset-register" && <AssetRegisterPanel />}
            {tab === "docs" && <DocumentsPanel />}
            {tab === "people" && <PeoplePanel />}
            {tab === "reporting" && <ReportingPanel />}
            {tab === "about" && (
              <section className="stack">
                <h2>Over PAM</h2>
                <div className="card">
                  <p>Personal Asset Manager.</p>
                </div>
              </section>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}




