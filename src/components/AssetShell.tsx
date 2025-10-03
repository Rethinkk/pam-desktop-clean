/* @ts-nocheck */
import React, { useState } from "react";

import AssetsPanel from "./AssetsPanel";
import DocumentsPanel from "./DocumentsPanel";
import PeoplePanel from "./PeoplePanel";
import AssetRegisterPanel from "./AssetRegisterPanel";
import DocumentRegisterPanel from "./DocumentRegisterPanel";
import ReportingPanel from "./ReportingPanel";

export default function AssetShell() {
  const [tab, setTab] = useState<
    "assets" | "asset-register" | "docs" | "doc-register" | "people" | "reporting" | "about"
  >("assets");

  // --- HOTFIX: normaliseer pam-docs-v1 zodat Document Register altijd kan lezen
  React.useEffect(() => {
    try {
      const KEY = "pam-docs-v1";
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const docs = Array.isArray(parsed?.docs)
        ? parsed.docs
        : Array.isArray(parsed)
        ? parsed
        : [];
      if (!Array.isArray(docs)) return;

      const normalized = docs.map((d: any) => ({
        ...d,
        id: d.id ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title: d.title ?? d.name ?? d.fileName ?? d.filename ?? "",
        name: d.name ?? d.title ?? "",
        fileName: d.fileName ?? d.filename ?? "",
        filename: d.filename ?? d.fileName ?? "",
        createdAt: d.createdAt ?? d.created ?? new Date().toISOString(),
        updatedAt: d.updatedAt ?? d.updated ?? d.createdAt ?? new Date().toISOString(),
      }));

      const base =
        parsed && !Array.isArray(parsed) && typeof parsed === "object" ? parsed : {};
      localStorage.setItem(KEY, JSON.stringify({ ...base, docs: normalized }));
      window.dispatchEvent(new Event("pam-docs-updated"));
    } catch {
      /* ignore */
    }
  }, []);

  console.log("[AssetShell] active tab:", tab);

  return (
    <div className="container">
      <div className="tabs">
        <button className={`tab ${tab === "assets" ? "active" : ""}`} onClick={() => setTab("assets")}>
          Assets
        </button>
        <button className={`tab ${tab === "asset-register" ? "active" : ""}`} onClick={() => setTab("asset-register")}>
          Asset Register
        </button>
        <button className={`tab ${tab === "docs" ? "active" : ""}`} onClick={() => setTab("docs")}>
          Docs
        </button>
        <button className={tab === "doc-register" ? "tab active" : "tab"} onClick={() => setTab("doc-register")}>
          Document Register
        </button>
        <button className={`tab ${tab === "people" ? "active" : ""}`} onClick={() => setTab("people")}>
          Mensen
        </button>
        <button
  className={`tab ${tab === "reporting" ? "active" : ""}`}
  onClick={() => setTab("reporting")}
>
  Reporting
</button>

        <button className={`tab ${tab === "about" ? "active" : ""}`} onClick={() => setTab("about")}>
          About
        </button>
      </div>

      {/* ===== Assets-tab ===== */}
      {tab === "assets" && (
        <section className="stack">
          <h1>Assets</h1>
          <div className="form-scope">
            <AssetsPanel onCreated={() => setTab("asset-register")} />
          </div>
          <style>{`
            .form-scope * { box-sizing: border-box; }
            @media (min-width: 760px) {
              .form-scope form label{
                display:inline-block !important;
                width:240px !important;
                margin-right:12px !important;
                vertical-align:middle !important;
                white-space:nowrap !important;
              }
              .form-scope form label + *{
                display:inline-block !important;
                width:calc(100% - 240px - 12px) !important;
                vertical-align:middle !important;
                margin-bottom:12px !important;
              }
              .form-scope form label + * :is(input,select,textarea,.input,.control){ width:100% !important; }
              .form-scope form .field{ display:flex !important; align-items:center !important; gap:12px !important; margin-bottom:12px !important; }
              .form-scope form .field > label{ width:240px !important; margin:0 !important; white-space:nowrap !important; display:inline-block !important; }
              .form-scope form .field > :not(label){ flex:1 1 auto !important; }
              .form-scope form .inline, .form-scope form .inline-controls{ display:flex !important; gap:12px !important; }
              .form-scope form h2, .form-scope form h3, .form-scope form .section-title, .form-scope form .tip, .form-scope form hr, .form-scope form button[type="submit"]{
                display:block !important; width:100% !important;
              }
            }
          `}</style>
        </section>
      )}

      {/* ===== Asset Register-tab ===== */}
      {tab === "asset-register" && (
        <section className="stack">
          <h1>Asset register</h1>
          <AssetRegisterPanel />
        </section>
      )}

      {/* ===== Docs-tab ===== */}
      {tab === "docs" && (
        <section className="stack">
          <h1>Documenten</h1>
          <div className="form-scope">
            <DocumentsPanel />
          </div>
          <style>{`
            .form-scope * { box-sizing: border-box; }
            .form-scope form .actions{
              display:flex !important;
              flex-direction:column !important;
              gap:10px !important;
              align-items:flex-start !important;
              margin-top:6px !important;
            }
            .form-scope form .actions > *{
              width:auto !important;
              max-width:unset !important;
              display:inline-block !important;
            }
            @media (min-width: 760px) {
              .form-scope form label{
                display:inline-block !important;
                width:240px !important;
                margin-right:12px !important;
                vertical-align:middle !important;
                white-space:nowrap !important;
              }
              .form-scope form label + *{
                display:inline-block !important;
                width:calc(100% - 240px - 12px) !important;
                vertical-align:middle !important;
                margin-bottom:12px !important;
              }
              .form-scope form label + * :is(input,select,textarea,.input,.control){ width:100% !important; }
              .form-scope form .field{ display:flex !important; align-items:center !important; gap:12px !important; margin-bottom:12px !important; }
              .form-scope form .field > label{ width:240px !important; margin:0 !important; white-space:nowrap !important; display:inline-block !important; }
              .form-scope form .field > :not(label){ flex:1 1 auto !important; }
              .form-scope form .inline, .form-scope form .inline-controls{ display:flex !important; gap:12px !important; }
              .form-scope form h2, .form-scope form h3, .form-scope form .section-title, .form-scope form .tip, .form-scope form hr{
                display:block !important; width:100% !important;
              }
            }
          `}</style>
        </section>
      )}

      {/* ===== Document Register-tab ===== */}
      {tab === "doc-register" && (
        <section className="stack">
          <DocumentRegisterPanel />
        </section>
      )}

{/* ===== Mensen-tab ===== */}
{tab === "people" && (
  <section className="stack">
    <h1>Mensen</h1>
    <div className="form-scope">
      <PeoplePanel />
    </div>
    <style>{`
      .form-scope * { box-sizing: border-box; }
      @media (min-width: 760px) {
        .form-scope form label{
          display:inline-block !important;
          width:240px !important;
          margin-right:12px !important;
          vertical-align:middle !important;
          white-space:nowrap !important;
        }
        .form-scope form label + *{
          display:inline-block !important;
          width:calc(100% - 240px - 12px) !important;
          vertical-align:middle !important;
          margin-bottom:12px !important;
        }
        .form-scope form label + * :is(input,select,textarea,.input,.control){ width:100% !important; }
        .form-scope form .field{ display:flex !important; align-items:center !important; gap:12px !important; margin-bottom:12px !important; }
        .form-scope form .field > label{ width:240px !important; margin:0 !important; white-space:nowrap !important; display:inline-block !important; }
        .form-scope form .field > :not(label){ flex:1 1 auto !important; }
        .form-scope form .inline, .form-scope form .inline-controls{ display:flex !important; gap:12px !important; }
        .form-scope form h2, .form-scope form h3, .form-scope form .section-title, .form-scope form .tip, .form-scope form hr, .form-scope form button[type="submit"]{
          display:block !important; width:100% !important;
        }
      }
    `}</style>
  </section>
)}

{/* ===== Reporting-tab ===== */}
{tab === "reporting" && (
  <section className="stack">
    <ReportingPanel />
  </section>
)}

{/* ===== About-tab ===== */}
{tab === "about" && (
  <section className="stack">
    <h1>Over PAM</h1>

    <div className="form-scope">
      <div className="card">
        <div className="field">
          <label>Naam</label>
          <div className="control">Personal Asset Manager</div>
        </div>

        <div className="field">
          <label>Beschrijving</label>
          <div className="control">
            Eenvoudig je assets, documenten en mensen beheren in één overzicht.
          </div>
        </div>

        <div className="field">
          <label>Lokale opslagkeys</label>
          <div className="control">
            <code>pam-asset-register-v1</code>, <code>pam-docs-v1</code>, <code>pam-people-v1</code>
          </div>
        </div>

        <div className="field">
          <label>Opmerking</label>
          <div className="control">
            Je data wordt lokaal in de browser opgeslagen en kan via export/backup worden veiliggesteld.
          </div>
        </div>
      </div>
    </div>

    <style>{`
      .form-scope * { box-sizing: border-box; }
      @media (min-width: 760px) {
        .form-scope .field {
          display:flex !important;
          align-items:center !important;
          gap:12px !important;
          margin-bottom:12px !important;
        }
        .form-scope .field > label{
          display:inline-block !important;
          width:240px !important;
          margin:0 !important;
          white-space:nowrap !important;
        }
        .form-scope .field > .control{
          flex:1 1 auto !important;
        }
        .form-scope .card code {
          padding: 2px 6px;
          border-radius: 6px;
          background: #f1f5f9;
        }
      }
    `}</style>
  </section>
)}

</div>  
);       {/* sluit return( ... ) */}
}        {/* sluit function AssetShell */}
