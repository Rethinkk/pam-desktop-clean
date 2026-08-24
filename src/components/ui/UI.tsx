/* @ts-nocheck */
import React from "react";

/** Style once, use anywhere (scoped onder .ui-*) */
export function Style() {
  return (
    <style>{`
      :root {
        --pam-deep-navy: #123052;
        --pam-navy: #173A61;
        --pam-olive: #687348;
        --pam-ivory: #F8F5EE;
        --pam-soft-white: #FCFBF8;
        --pam-slate: #60718A;
        --pam-warm-grey: #DEDCD5;
      }

      /* Container helpers (optioneel) */
      .ui-page { color: var(--pam-deep-navy); padding: 0; }

      /* Cards */
      .ui-card {
        background:var(--pam-soft-white);
        border:1px solid var(--pam-warm-grey);
        border-radius:16px;
        box-shadow:0 8px 22px rgba(18,48,82,.055);
        color:var(--pam-deep-navy);
        padding:18px;
        margin-bottom:16px;
      }

      /* --- Form layout tweaks (gedeeld) --- */
      .ui-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 24px; align-items: start; }
      .ui-form-grid .span-2 { grid-column: 1 / span 2; }
      .ui-tip { font-size: 13px; color: var(--pam-slate); display:flex; gap:8px; align-items:center; line-height:1.45; }
      .ui-select-multi { height: 120px; overflow: auto; resize: vertical; }
      .ui-aside { background:var(--pam-navy); color:#fff; border-radius:16px; padding:20px; position: sticky; top: 24px; }
      .ui-aside .ui-btn { width:100%; border-radius:12px; padding:12px 15px; font-weight:650; }
      .ui-count-badge { background:#EFEEE8; color:var(--pam-olive); border:1px solid var(--pam-warm-grey); padding:3px 9px; border-radius:999px; font-size:12px; font-weight:740; }
      .ui-section-title { font-size:16px; font-weight:760; color:var(--pam-deep-navy); margin: 10px 0 10px; }
      .ui-field small { display:block; margin-top:8px; color:var(--pam-slate); }
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
      .ui-field label { display:block; font-size:13px; color:var(--pam-deep-navy); font-weight:760; margin-bottom:7px; }
      /* Je kunt óf de classes gebruiken óf gewoon standaard inputs binnen .ui-field */
      .ui-input, .ui-select, .ui-textarea,
      .ui-field input, .ui-field select, .ui-field textarea {
        width:100%;
        border:1px solid #D5D8DD;
        border-radius:12px;
        padding:10px 13px;
        font-size:14px;
        outline:none;
        background:rgba(255,255,255,.82);
        color:var(--pam-deep-navy);
        transition:border-color .15s ease, box-shadow .15s ease, background .15s ease;
      }
      .ui-input::placeholder, .ui-field input::placeholder,
      .ui-textarea::placeholder, .ui-field textarea::placeholder { color:#8490A2; }
      .ui-input:focus, .ui-select:focus, .ui-textarea:focus,
      .ui-field input:focus, .ui-field select:focus, .ui-field textarea:focus {
        background:#fff;
        border-color:var(--pam-navy);
        box-shadow:0 0 0 4px rgba(23,58,97,.12);
      }
      .ui-textarea, .ui-field textarea { min-height: 120px; }
      .ui-field input[type="checkbox"] {
        accent-color: var(--pam-olive);
        border-radius:4px;
        display:inline-block;
        height:18px;
        margin:0 9px 0 0;
        padding:0;
        vertical-align:middle;
        width:18px;
      }

      /* Actiebalk onder het formulier */
      .ui-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 22px;
        padding: 18px 22px;
        position: sticky;
        bottom: 12px;
        background:#F3F1EA;
        border:1px solid var(--pam-warm-grey);
        border-radius:16px;
      }

      /* Buttons (alias voor beide conventies) */
      .ui-btn {
        display:inline-flex; align-items:center; justify-content:center;
        border-radius:12px; padding:10px 15px; font-size:14px; font-weight:760; white-space:nowrap;
        border:1px solid var(--pam-warm-grey); background:var(--pam-soft-white); color:var(--pam-deep-navy); cursor:pointer;
        box-shadow:0 5px 14px rgba(18,48,82,.06);
      }
      .ui-btn:hover { background:#fff; border-color:var(--pam-olive); }
      .ui-btn-secondary, .ui-btn--secondary {
        background:var(--pam-soft-white);
        border-color:var(--pam-warm-grey);
        color:var(--pam-deep-navy);
      }
      .ui-btn-primary, .ui-btn--primary {
        background:linear-gradient(180deg, #74815a 0%, #4f5c36 100%);
        color:#fff;
        border-color:#4f5c36;
      }
      .ui-btn-primary:hover, .ui-btn--primary:hover { filter: brightness(1.04); }
      .ui-btn-primary:disabled, .ui-btn--primary:disabled { opacity:.5; cursor:not-allowed; }
      /* Kleine & rode knoppen */
.ui-btn--sm { padding: 7px 11px; font-size: 13px; border-radius: 11px; min-width: 82px; }
.ui-btn-danger, .ui-btn--danger {
  background:#FCFBF8;
  color:#60718A;
  border-color:#DEDCD5;
}
.ui-btn-danger:hover, .ui-btn--danger:hover {
  background:#F3F1EA;
  border-color:#60718A;
  color:#123052;
}


      /* Controls bar / Toolbar */
      .ui-controls { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
      .ui-toolbar { display:flex; align-items:center; gap:12px; margin: 8px 0 12px; }
      .ui-toolbar .spacer { flex:1; }

      /* KPI */
      .ui-kpi { background:var(--pam-soft-white); border:1px solid var(--pam-warm-grey); border-radius:14px; padding:15px; }
      .ui-kpi .label { font-size:12px; color:var(--pam-slate); font-weight:680; }
      .ui-kpi .value { color:var(--pam-deep-navy); font-size:22px; font-weight:760; }

      /* Tables (beide varianten ondersteund) */
      .ui-tablewrap, .ui-table-wrap { border:1px solid var(--pam-warm-grey); border-radius:14px; overflow:auto; background:var(--pam-soft-white); }
      .ui-table { width:100%; border-collapse:separate; border-spacing:0; color:var(--pam-deep-navy); font-size:14px; }
      .ui-table thead th { position:sticky; top:0; background:#F3F1EA; color:var(--pam-deep-navy); text-align:left; font-weight:760; border-bottom:1px solid var(--pam-warm-grey); padding:10px 12px; }
      .ui-table tbody td { border-bottom:1px solid #ECEAE3; padding:10px 12px; }
      .ui-table tbody tr:hover td { background:#fff; }
      .ui-table tbody tr:nth-child(even) td { background:#FAF8F2; }

      /* Badges (status) */
      .ui-badge {
        display:inline-block; padding:4px 10px; border-radius:999px;
        color:var(--pam-deep-navy);
        font-size:12px; font-weight:720; border:1px solid var(--pam-warm-grey); background:#F3F1EA;
      }
      .ui-badge.ok { background:#F0F3EA; border-color:#C8D0B8; color:var(--pam-olive); }
      .ui-badge.warn { background:#fffbeb; border-color:#fde68a; }
      .ui-badge.danger { background:#e5e7eb; border-color:#e5e7eb; }

      /* Headings */
      .ui-h1 { color:var(--pam-deep-navy); font-size:26px; line-height:1.2; margin:0 0 16px; font-weight:780; letter-spacing:-.01em; }
      .ui-h2 { color:var(--pam-deep-navy); font-size:18px; font-weight:760; margin:0 0 10px; }
      .ui-muted { color:var(--pam-slate); font-weight:650; }

      /* Empty states */
      .ui-empty {
        border: 1px solid var(--pam-warm-grey);
        border-radius: 16px;
        background: #F3F1EA;
        padding: 20px;
        color: var(--pam-deep-navy);
      }
      .ui-empty-title {
        color: var(--pam-deep-navy);
        font-size: 16px;
        font-weight: 760;
        margin-bottom: 8px;
      }
      .ui-empty-body {
        color: var(--pam-slate);
        line-height: 1.6;
        margin: 0;
      }
      .ui-empty-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 14px;
      }

      /* Tabs (optioneel voor AssetShell) */
      .ui-tabs { display:flex; gap:8px; flex-wrap:wrap; margin:0 0 12px; }
      .ui-tab {
        border:1px solid var(--pam-warm-grey); background:var(--pam-soft-white); color:var(--pam-deep-navy);
        padding:9px 16px; border-radius:999px; font-weight:720; cursor:pointer;
      }
      .ui-tab:hover { background:#fff; border-color:var(--pam-olive); }
      .ui-tab.active { background:var(--pam-olive); color:#fff; border-color:var(--pam-olive); }
      .ui-tab-spacer { flex:1 1 auto; }

/* Toasts (rechtsonder) */
.ui-toast-container {
  position: fixed;
  right: 16px;
  bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 9999;
}
.ui-toast {
  background: var(--pam-navy);
  color: #fff;
  border: 1px solid rgba(255,255,255,.15);
  border-radius: 12px;
  padding: 10px 12px;
  box-shadow: 0 8px 28px rgba(0,0,0,.18);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;             /* klik om te sluiten */
  transform: translateY(8px);
  opacity: 0;
  animation: ui-toast-in .2s ease-out forwards;
}
@keyframes ui-toast-in {
  to { transform: translateY(0); opacity: 1; }
}
/* optionele tonen (allemaal niet-rood) */
.ui-toast.info    { background: #1f2937; }
.ui-toast.success { background: var(--pam-navy); }
.ui-toast.warn    { background: var(--pam-olive); }


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
export const EmptyState: React.FC<{
  title: string;
  body: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}> = ({ title, body, actionLabel, onAction, secondaryLabel, onSecondary }) => (
  <div className="ui-empty">
    <div className="ui-empty-title">{title}</div>
    <p className="ui-empty-body">{body}</p>
    {(actionLabel || secondaryLabel) && (
      <div className="ui-empty-actions">
        {actionLabel && (
          <button className="ui-btn ui-btn--primary" onClick={onAction}>
            {actionLabel}
          </button>
        )}
        {secondaryLabel && (
          <button className="ui-btn" onClick={onSecondary}>
            {secondaryLabel}
          </button>
        )}
      </div>
    )}
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
// --- Toast host: luister naar window events en toon meldingen rechtsonder ---
export const ToastHost: React.FC = () => {
  const [items, setItems] = React.useState<
    { id: number; msg: string; tone?: "success" | "info" | "warn"; ttl?: number }[]
  >([]);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const d: any = (e as CustomEvent).detail ?? {};
      const id = Date.now() + Math.random();
      setItems((s) => [...s, { id, msg: d.message || String(d), tone: d.tone || "success", ttl: d.ttl }]);
      const ttl = Number.isFinite(d.ttl) ? d.ttl : 2200;
      setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), ttl);
    };
    window.addEventListener("pam:toast", handler as any);
    return () => window.removeEventListener("pam:toast", handler as any);
  }, []);

  return (
    <div className="ui-toast-container" role="status" aria-live="polite">
      {items.map((t) => (
        <div
          key={t.id}
          className={`ui-toast ${t.tone || ""}`}
          onClick={() => setItems((s) => s.filter((x) => x.id !== t.id))}
          title="Klik om te sluiten"
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
};
