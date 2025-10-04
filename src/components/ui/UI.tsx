/* @ts-nocheck */
import React from "react";

/** Style once, use anywhere (scoped onder .ui-*) */
export function Style() {
  return (
    <style>{`
      /* Container helpers (optioneel) */
      .ui-page { padding: 24px 24px 32px 24px; }

      /* Cards */
      .ui-card { background:#fff; border-radius:16px; box-shadow:0 6px 20px rgba(0,0,0,.08); padding:16px; margin-bottom:16px; }

      /* --- Form layout tweaks (gedeeld) --- */
      .ui-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 24px; align-items: start; }
      .ui-form-grid .span-2 { grid-column: 1 / span 2; }
      .ui-tip { font-size: 12px; color: #6b7280; display:flex; gap:8px; align-items:center; }
      .ui-select-multi { height: 120px; overflow: auto; resize: vertical; }
      .ui-aside { background:#18324f; color:#fff; border-radius:16px; padding:24px; position: sticky; top: 24px; }
      .ui-aside .ui-btn { width:100%; border-radius:12px; padding:14px 16px; font-weight:600; }
      .ui-count-badge { background:#0b2034; border:1px solid rgba(255,255,255,.15); padding:2px 8px; border-radius:999px; font-size:12px; }
      .ui-section-title { font-size:14px; font-weight:600; color:#0b2034; margin: 12px 0 8px; }
      .ui-field small { display:block; margin-top:6px; color:#6b7280; }
      .ui-btn[disabled] { opacity:.5; cursor:not-allowed; }

      /* Grid */
      .ui-grid { display:grid; gap:12px; }
      .ui-grid.cols-1 { grid-template-columns: 1fr; }
      .ui-grid.cols-2 { grid-template-columns: repeat(2,1fr); }
      .ui-grid.cols-3 { grid-template-columns: repeat(3,1fr); }
      .ui-grid.cols-4 { grid-template-columns: repeat(4,1fr); }
      @media (max-width: 900px){
        .ui-grid.cols-2, .ui-grid.cols-3, .ui-grid.cols-4 { grid-template-columns: 1fr; }
      }

      /* Fields + baseline inputs */
      .ui-field label { display:block; font-size:12px; color:#64748b; margin-bottom:6px; }
      /* Je kunt óf de classes gebruiken óf gewoon standaard inputs binnen .ui-field */
      .ui-input, .ui-select, .ui-textarea,
      .ui-field input, .ui-field select, .ui-field textarea {
        width:100%; border:1px solid #d1d5db; border-radius:12px; padding:10px 12px; font-size:14px; outline:none; background:#fff;
      }
      .ui-textarea, .ui-field textarea { min-height: 120px; }

      /* Actiebalk onder het formulier */
      .ui-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 16px;
        padding-top: 8px;
        position: sticky;
        bottom: 12px;
        background: linear-gradient(180deg, rgba(255,255,255,0), #fff 60%);
      }

      /* Buttons (alias voor beide conventies) */
      .ui-btn {
        display:inline-flex; align-items:center; justify-content:center;
        border-radius:12px; padding:10px 14px; font-size:14px; border:1px solid #d1d5db; background:#fff; cursor:pointer;
      }
      .ui-btn-primary, .ui-btn--primary { background:#0f2d4a; color:#fff; border-color:#0f2d4a; }
      .ui-btn-primary:hover, .ui-btn--primary:hover { filter: brightness(1.06); }
      .ui-btn-primary:disabled, .ui-btn--primary:disabled { opacity:.5; cursor:not-allowed; }
      /* Kleine & rode knoppen */
.ui-btn--sm { padding: 6px 10px; font-size: 13px; border-radius: 10px; }
.ui-btn-danger, .ui-btn--danger { background:#8796A5; color:#fff; border-color:#8796A5; }
.ui-btn-danger:hover, .ui-btn--danger:hover { filter: brightness(1.05); }


      /* Controls bar / Toolbar */
      .ui-controls { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
      .ui-toolbar { display:flex; align-items:center; gap:12px; margin: 8px 0 12px; }
      .ui-toolbar .spacer { flex:1; }

      /* KPI */
      .ui-kpi { border:1px solid #e5e7eb; border-radius:14px; padding:14px; }
      .ui-kpi .label { font-size:12px; color:#64748b; }
      .ui-kpi .value { font-size:22px; font-weight:600; }

      /* Tables (beide varianten ondersteund) */
      .ui-tablewrap, .ui-table-wrap { border:1px solid #e5e7eb; border-radius:12px; overflow:auto; background:#fff; }
      .ui-table { width:100%; border-collapse:separate; border-spacing:0; font-size:14px; }
      .ui-table thead th { position:sticky; top:0; background:#f8fafc; text-align:left; font-weight:600; border-bottom:1px solid #e5e7eb; padding:10px 12px; }
      .ui-table tbody td { border-bottom:1px solid #f1f5f9; padding:10px 12px; }
      .ui-table tbody tr:hover td { background:#fafcff; }
      .ui-table tbody tr:nth-child(even) td { background:#fafafa; }

      /* Badges (status) */
      .ui-badge {
        display:inline-block; padding:2px 8px; border-radius:999px;
        font-size:12px; border:1px solid #e5e7eb; background:#f8fafc;
      }
      .ui-badge.ok { background:#ecfdf5; border-color:#a7f3d0; }
      .ui-badge.warn { background:#fffbeb; border-color:#fde68a; }
      .ui-badge.danger { background:#e5e7eb; border-color:#e5e7eb; }

      /* Headings */
      .ui-h1 { font-size:28px; line-height:1.2; margin:0 0 16px; font-weight:700; }
      .ui-h2 { font-size:18px; font-weight:600; margin:0 0 8px; color:#0f172a; }
      .ui-muted { color:#64748b; font-weight:600; }

      /* Tabs (optioneel voor AssetShell) */
      .ui-tabs { display:flex; gap:8px; flex-wrap:wrap; margin:0 0 12px; }
      .ui-tab {
        border:1px solid #e5e7eb; background:#fff; color:#0f172a;
        padding:8px 12px; border-radius:12px; font-weight:600; cursor:pointer;
      }
      .ui-tab:hover { background:#f8fafc; }
      .ui-tab.active { background:#0f172a; color:#fff; border-color:#0f172a; }
      .ui-tab-spacer { flex:1 1 auto; }
    `}</style>
  );
}

/** Primitive building blocks */
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className="", ...p }) => (
  <div className={`ui-card ${className}`} {...p} />
);
export const Controls: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className="", ...p }) => (
  <div className={`ui-controls ${className}`} {...p}/>
);
export const Grid: React.FC<{cols?: 1|2|3|4} & React.HTMLAttributes<HTMLDivElement>> = ({cols=2, className="", ...p}) => (
  <div className={`ui-grid cols-${cols} ${className}`} {...p}/>
);
export const Field: React.FC<{label?: string} & React.HTMLAttributes<HTMLDivElement>> = ({label, children, className="", ...p}) => (
  <div className={`ui-field ${className}`} {...p}>
    {label ? <label>{label}</label> : null}
    {children}
  </div>
);
export const Button: React.FC<{variant?: "primary" | "secondary"} & React.ButtonHTMLAttributes<HTMLButtonElement>> =
  ({variant="secondary", className="", ...p}) => (
    <button className={`ui-btn ${variant==="primary" ? "ui-btn--primary":""} ${className}`} {...p} />
);
export const TableWrap: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({className="", ...p}) => (
  <div className={`ui-tablewrap ${className}`} {...p}/>
);
export const H1: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({className="", ...p}) => (
  <h1 className={`ui-h1 ${className}`} {...p}/>
);
export const H2: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({className="", ...p}) => (
  <div className={`ui-h2 ${className}`} {...p}/>
);
export const KPI: React.FC<{label:string; value:React.ReactNode}> = ({label, value}) => (
  <div className="ui-kpi">
    <div className="label">{label}</div>
    <div className="value">{value}</div>
  </div>
);
/** Tabel: jij levert <thead> en <tbody> zelf aan */
export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({className="", ...p}) => (
  <table className={`ui-table ${className}`} {...p}/>
);

/** (optioneel) Exporteer ook tab-primitives */
export const Tabs: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({className="", ...p}) => (
  <div className={`ui-tabs ${className}`} {...p}/>
);
export const TabButton: React.FC<{active?: boolean} & React.ButtonHTMLAttributes<HTMLButtonElement>> =
  ({active=false, className="", ...p}) => (
    <button className={`ui-tab ${active? "active": ""} ${className}`} {...p}/>
);
export const TabSpacer: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({className="", ...p}) => (
  <div className={`ui-tab-spacer ${className}`} {...p}/>
);
