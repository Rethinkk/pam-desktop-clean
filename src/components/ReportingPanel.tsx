/* @ts-nocheck */
import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { openPamTab } from "../lib/workspaceTabs";
import { assetRepository, documentRepository, personRepository } from "../storage/repositories";
import { EmptyState } from "./ui/UI";



/** ---------------- Types ---------------- **/
type MinimalAsset = {
  id: string;
  number?: string;
  name?: string;
  type?: string;
  owner?: string;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
};
type MinimalDoc = {
  id: string;
  title?: string;
  type?: string;
  assetId?: string;
  assetNumber?: string;
  expiryDate?: string;
  createdAt?: string;
  updatedAt?: string;
};
type MinimalPerson = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
};

/** ---------------- Utils & Readers ---------------- **/
const parseMaybeDate = (v?: string): Date | null => {
  if (!v) return null;
  const iso = new Date(v);
  if (!isNaN(iso.getTime())) return iso;
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const [_, dd, mm, yyyy] = m;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (!isNaN(d.getTime())) return d;
  }
  return null;
};
const fmtDate = (d?: string) => {
  const dt = parseMaybeDate(d);
  if (!dt) return d ?? "";
  return dt.toLocaleDateString();
};
const unique = <T,>(arr: T[]) => [...new Set(arr.filter(Boolean as any))];
const today = () => new Date().toLocaleDateString();

function readAssets(): MinimalAsset[] {
  const arr = assetRepository.load().assets;
  return arr.map((a: any) => ({
    id: a.id ?? a.uuid ?? a._id ?? String(a.number ?? a.name ?? Math.random()),
    number: a.number ?? a.assetNumber ?? a.code ?? a.no,
    name: a.name ?? a.title ?? a.label,
    type: a.type ?? a.category ?? a.kind,
    ownerId: a.ownerId ?? a.personId ?? a.owner?.id,
    owner: a.owner ?? a.assignee ?? a.accountable ?? a.ownerName,
    createdAt: a.createdAt ?? a.created ?? a.dateCreated,
    updatedAt: a.updatedAt ?? a.modifiedAt ?? a.dateUpdated,
  })) as MinimalAsset[];
}
function readDocs(): MinimalDoc[] {
  const arr = documentRepository.all();
  return arr.map((d: any) => ({
    id: d.id ?? d.uuid ?? d._id ?? String(d.title ?? Math.random()),
    title: d.title ?? d.name ?? d.label,
    type: d.type ?? d.category ?? d.kind,
    assetId: d.assetId ?? d.linkedAssetId ?? d.asset?.id,
    assetNumber: d.assetNumber ?? d.asset?.number,
    expiryDate: d.expiryDate ?? d.validUntil ?? d.expiresAt,
    createdAt: d.createdAt ?? d.created ?? d.dateCreated,
    updatedAt: d.updatedAt ?? d.modifiedAt ?? d.dateUpdated,
  })) as MinimalDoc[];
}
function readPeople(): MinimalPerson[] {
  const arr = personRepository.all();
  return arr.map((p: any) => ({
    id: p.id ?? p.uuid ?? p._id ?? String(p.email ?? p.name ?? Math.random()),
    name: p.name ?? p.fullName ?? p.displayName,
    email: p.email,
    phone: p.phone,
    role: p.role,
    createdAt: p.createdAt ?? p.created ?? p.dateCreated,
    updatedAt: p.updatedAt ?? p.modifiedAt ?? p.dateUpdated,
  })) as MinimalPerson[];
}

/** ---------------- PDF helpers ---------------- **/
function withHeaderFooter(doc: jsPDF, title: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(10);
  doc.text(`Datum: ${today()}`, pageWidth - 14, 16, { align: "right" });

  const addFooter = () => {
    const pageCount = (doc as any).internal.getNumberOfPages?.() ?? doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const w = doc.internal.pageSize.getWidth();
      const h = doc.internal.pageSize.getHeight();
      doc.setFontSize(9);
      doc.text(`Pagina ${i} / ${pageCount}  •  PAM`, w - 14, h - 10, { align: "right" });
    }
  };
  return { addFooter };
}
function buildAssetTypeReport(assets: MinimalAsset[], docs: MinimalDoc[], type: string): Blob {
  const t = (type || "UNKNOWN").toUpperCase();
  const pdf = new jsPDF();
  const { addFooter } = withHeaderFooter(pdf, `Rapport — Asset type: ${t}`);
  const subset = assets.filter(a => (a.type ? String(a.type).toUpperCase() : "UNKNOWN") === t);

  autoTable(pdf, {
    startY: 24,
    head: [["Nummer", "Naam", "Owner", "Aangemaakt"]],
    body: subset.map(a => [a.number ?? "—", a.name ?? "—", a.owner ?? a.ownerId ?? "—", a.createdAt ?? "—"]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [16, 42, 74] },
    theme: "grid",
  });

  const byAssetKey = new Map<string, MinimalDoc[]>();
  docs.forEach(d => {
    const k = d.assetId ?? d.assetNumber;
    if (!k) return;
    byAssetKey.set(k, [...(byAssetKey.get(k) ?? []), d]);
  });

  autoTable(pdf, {
    head: [["Asset", "Doc-titel", "Type", "Vervaldatum"]],
    body: subset.flatMap(a => {
      const linked = byAssetKey.get(a.id) ?? byAssetKey.get(a.number ?? "") ?? [];
      return linked.map(d => [a.number ?? "—", d.title ?? "—", (d.type ?? "—").toUpperCase(), d.expiryDate ?? "—"]);
    }),
    styles: { fontSize: 9 },
    theme: "grid",
    margin: { top: 10 },
  });

  addFooter();
  return pdf.output("blob");
}
function buildSelectedAssetsReport(assets: MinimalAsset[], docs: MinimalDoc[], selectedIds: string[]): Blob {
  const picked = assets.filter(a => selectedIds.includes(a.id));
  const pdf = new jsPDF();
  const { addFooter } = withHeaderFooter(pdf, `Rapport — Geselecteerde assets (${picked.length})`);

  autoTable(pdf, {
    startY: 24,
    head: [["Nummer", "Naam", "Type", "Owner", "Aangemaakt"]],
    body: picked.map(a => [a.number ?? "—", a.name ?? "—", (a.type ?? "—").toUpperCase(), a.owner ?? a.ownerId ?? "—", a.createdAt ?? "—"]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [16, 42, 74] },
    theme: "grid",
  });

  const byAssetKey = new Map<string, MinimalDoc[]>();
  docs.forEach(d => {
    const k = d.assetId ?? d.assetNumber;
    if (!k) return;
    byAssetKey.set(k, [...(byAssetKey.get(k) ?? []), d]);
  });

  autoTable(pdf, {
    head: [["Asset", "Doc-titel", "Type", "Vervaldatum"]],
    body: picked.flatMap(a => {
      const linked = byAssetKey.get(a.id) ?? byAssetKey.get(a.number ?? "") ?? [];
      return linked.map(d => [a.number ?? "—", d.title ?? "—", (d.type ?? "—").toUpperCase(), d.expiryDate ?? "—"]);
    }),
    styles: { fontSize: 9 },
    theme: "grid",
    margin: { top: 10 },
  });

  addFooter();
  return pdf.output("blob");
}
function buildTotalReport(assets: MinimalAsset[], docs: MinimalDoc[], people: MinimalPerson[]): Blob {
  const pdf = new jsPDF();
  const { addFooter } = withHeaderFooter(pdf, "Totaalrapport — Assets, Documenten, Mensen");

  autoTable(pdf, {
    startY: 24,
    head: [["KPI", "Waarde"]],
    body: [
      ["Totaal assets", String(assets.length)],
      ["Totaal documenten", String(docs.length)],
      ["Totaal mensen", String(people.length)],
    ],
    styles: { fontSize: 9 },
    theme: "grid",
  });

  autoTable(pdf, {
    head: [["Nummer", "Naam", "Type", "Owner", "Aangemaakt"]],
    body: assets.slice(0, 40).map(a => [a.number ?? "—", a.name ?? "—", (a.type ?? "—").toUpperCase(), a.owner ?? a.ownerId ?? "—", a.createdAt ?? "—"]),
    styles: { fontSize: 9 },
    theme: "grid",
    margin: { top: 10 },
  });

  autoTable(pdf, {
    head: [["Titel", "Type", "Asset", "Vervaldatum"]],
    body: docs.slice(0, 40).map(d => [d.title ?? "—", (d.type ?? "—").toUpperCase(), d.assetNumber ?? d.assetId ?? "—", d.expiryDate ?? "—"]),
    styles: { fontSize: 9 },
    theme: "grid",
    margin: { top: 10 },
  });

  addFooter();
  return pdf.output("blob");
}
async function sendPdfViaEmail(to: string, subject: string, filename: string, pdfBlob: Blob) {
  const EMAIL_API_URL = (import.meta as any).env?.VITE_EMAIL_API_URL || "";
  if (!EMAIL_API_URL) return { ok: false, reason: "Geen EMAIL_API_URL geconfigureerd." };
  const arrBuf = await pdfBlob.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrBuf)));
  const res = await fetch(EMAIL_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, filename, fileBase64: base64, mime: "application/pdf" }),
  });
  if (!res.ok) return { ok: false, reason: `Server ${res.status}` };
  return { ok: true };
}

/** ---------------- Component ---------------- **/
export default function ReportingPanel() {
  const [assets, setAssets] = React.useState<MinimalAsset[]>([]);
  const [docs, setDocs] = React.useState<MinimalDoc[]>([]);
  const [people, setPeople] = React.useState<MinimalPerson[]>([]);
  const [days, setDays] = React.useState<number | "all">(30);
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [sortDesc, setSortDesc] = React.useState<boolean>(true);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [recipient, setRecipient] = React.useState<string>("");

  React.useEffect(() => {
    setAssets(readAssets());
    setDocs(readDocs());
    setPeople(readPeople());
  }, []);

  const allTypes = React.useMemo(
    () => unique(assets.map(a => (a.type ? String(a.type).trim().toUpperCase() : "UNKNOWN"))),
    [assets]
  );

  const withinDays = (createdAt?: string, d?: number) => {
    if (!d || d <= 0) return true;
    const dt = parseMaybeDate(createdAt);
    if (!dt) return false;
    const now = new Date();
    const diff = (now.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= d;
  };

  const filtered = React.useMemo(() => {
    const d = typeof days === "number" ? days : undefined;
    return assets.filter(
      (a) =>
        withinDays(a.createdAt, d) &&
        (typeFilter === "all" ||
          (a.type ? String(a.type).trim().toUpperCase() : "UNKNOWN") === String(typeFilter))
    );
  }, [assets, days, typeFilter]);

  const sorted = React.useMemo(() => {
    const clone = [...filtered];
    clone.sort((a, b) => {
      const da = parseMaybeDate(a.createdAt)?.getTime() ?? 0;
      const db = parseMaybeDate(b.createdAt)?.getTime() ?? 0;
      return sortDesc ? db - da : da - db;
    });
    return clone;
  }, [filtered, sortDesc]);

  // KPIs
  const total = assets.length;
  const totalInWindow = filtered.length;
  const uniqueTypeCount = allTypes.length;
  const uniqueOwners = unique(assets.map((a) => a.owner)).length;

  const perType = React.useMemo(() => {
    const m = new Map<string, number>();
    assets.forEach((a) => {
      const t = a.type ? String(a.type).trim().toUpperCase() : "UNKNOWN";
      m.set(t, (m.get(t) ?? 0) + 1);
    });
    const arr: Array<[string, number]> = [];
    m.forEach((v, k) => arr.push([k, v]));
    return arr.sort((a, b) => b[1] - a[1]);
  }, [assets]);

  const perOwner = React.useMemo(() => {
    const m = new Map<string, number>();
    assets.forEach((a) => {
      const o = a.owner || "—";
      m.set(o, (m.get(o) ?? 0) + 1);
    });
    const arr: Array<[string, number]> = [];
    m.forEach((v, k) => arr.push([k, v]));
    return arr.sort((a, b) => b[1] - a[1]);
  }, [assets]);

  // Export CSV
  const toCsv = (rows: Array<Record<string, any>>) => {
    if (!rows.length) return "";
    const headerSet = new Set<string>();
    for (const r of rows) for (const k of Object.keys(r)) headerSet.add(k);
    const headers = [...headerSet];
    const esc = (v: any) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      return s.includes('"') || s.includes(",") || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
  };
  const downloadText = (filename: string, content: string, mime = "text/csv") => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  const exportCsv = () => {
    const csv = toCsv(
      sorted.map((a) => ({
        id: a.id,
        number: a.number,
        name: a.name,
        type: a.type,
        owner: a.owner,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      }))
    );
    downloadText(
      `reporting_${typeof days === "number" ? days + "d" : "all"}${typeFilter !== "all" ? "_" + typeFilter : ""}.csv`,
      csv
    );
  };

  // PDF + mail
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  const makeTypePdf = () => {
    const t = typeFilter === "all" ? (allTypes[0] ?? "UNKNOWN") : typeFilter;
    const blob = buildAssetTypeReport(assets, docs, t);
    downloadBlob(blob, `rapport_type_${t}.pdf`);
  };
  const sendTypePdf = async () => {
    const t = typeFilter === "all" ? (allTypes[0] ?? "UNKNOWN") : typeFilter;
    const blob = buildAssetTypeReport(assets, docs, t);
    const res = await sendPdfViaEmail(recipient, `PAM Rapport (type ${t})`, `rapport_type_${t}.pdf`, blob);
    alert(res.ok ? "Verzonden." : `Niet verzonden: ${res.reason || "onbekende fout"}`);
  };
  const makeSelectedPdf = () => {
    const blob = buildSelectedAssetsReport(assets, docs, selectedIds);
    downloadBlob(blob, `rapport_geselecteerd_${selectedIds.length}.pdf`);
  };
  const sendSelectedPdf = async () => {
    const blob = buildSelectedAssetsReport(assets, docs, selectedIds);
    const res = await sendPdfViaEmail(recipient, `PAM Rapport (geselecteerd)`, `rapport_geselecteerd_${selectedIds.length}.pdf`, blob);
    alert(res.ok ? "Verzonden." : `Niet verzonden: ${res.reason || "onbekende fout"}`);
  };
  const makeTotalPdf = () => {
    const blob = buildTotalReport(assets, docs, people);
    downloadBlob(blob, `rapport_totaal.pdf`);
  };
  const sendTotalPdf = async () => {
    const blob = buildTotalReport(assets, docs, people);
    const res = await sendPdfViaEmail(recipient, `PAM Totaalrapport`, `rapport_totaal.pdf`, blob);
    alert(res.ok ? "Verzonden." : `Niet verzonden: ${res.reason || "onbekende fout"}`);
  };

  const toggleSelect = (id: string, checked: boolean) =>
    setSelectedIds((prev) => (checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)));

  /** ---------------- UI ---------------- **/
  return (
    <div className="ui-page reporting-panel">
      {/* Scoped styles – onafhankelijk van Tailwind/andere CSS */}
      <style>{`
        .reporting-panel h1 {
          color: var(--pam-deep-navy);
          font-size: 26px;
          font-weight: 780;
          letter-spacing: -.01em;
          line-height: 1.2;
          margin: 0 0 16px;
        }
        .reporting-card {
          background: #FCFBF8;
          border: 1px solid var(--pam-warm-grey);
          border-radius: 14px;
          box-shadow: none;
          margin-bottom: 16px;
          padding: 18px;
        }
        .reporting-controls { display: grid; grid-template-columns: repeat(12, 1fr); gap: 12px; }
        .reporting-field { grid-column: span 6; }
        .reporting-field--quarter { grid-column: span 3; }
        .reporting-field--full { grid-column: 1 / -1; }
        @media (max-width: 900px){
          .reporting-field,
          .reporting-field--quarter { grid-column: 1 / -1; }
        }
        .reporting-panel label {
          color: var(--pam-deep-navy);
          display: block;
          font-size: 13px;
          font-weight: 760;
          margin-bottom: 7px;
        }
        .reporting-panel select,
        .reporting-panel input[type="email"] {
          background: rgba(255,255,255,.82);
          border: 1px solid #D5D8DD;
          border-radius: 12px;
          color: var(--pam-deep-navy);
          font-size: 14px;
          outline: none;
          padding: 10px 13px;
          width: 100%;
        }
        .reporting-panel select:focus,
        .reporting-panel input[type="email"]:focus {
          background: #fff;
          border-color: var(--pam-navy);
          box-shadow: 0 0 0 4px rgba(23,58,97,.12);
        }
        .reporting-actions { align-items: center; display: flex; flex-wrap: wrap; gap: 8px; }
        .reporting-actions--between { justify-content: space-between; }
        .reporting-kpis { display: grid; gap: 12px; grid-template-columns: repeat(4, 1fr); }
        @media (max-width: 900px){ .reporting-kpis { grid-template-columns: repeat(2,1fr); } }
        .reporting-kpi {
          background: #F3F1EA;
          border: 1px solid var(--pam-warm-grey);
          border-radius: 14px;
          padding: 15px;
        }
        .reporting-kpi .label { color: var(--pam-slate); font-size: 12px; font-weight: 680; }
        .reporting-kpi .value { color: var(--pam-deep-navy); font-size: 22px; font-weight: 760; }
        .reporting-twocol { display: grid; gap: 16px; grid-template-columns: 1fr 1fr; }
        @media (max-width: 900px){ .reporting-twocol { grid-template-columns: 1fr; } }
        .reporting-tablewrap {
          background: #FCFBF8;
          border: 1px solid var(--pam-warm-grey);
          border-radius: 14px;
          overflow: auto;
        }
        .reporting-panel table {
          border-collapse: separate;
          border-spacing: 0;
          color: var(--pam-deep-navy);
          font-size: 14px;
          width: 100%;
        }
        .reporting-panel thead th {
          background: #F3F1EA;
          border-bottom: 1px solid var(--pam-warm-grey);
          color: var(--pam-deep-navy);
          font-weight: 760;
          padding: 10px 12px;
          position: sticky;
          text-align: left;
          top: 0;
        }
        .reporting-panel tbody td { border-bottom: 1px solid #ECEAE3; padding: 10px 12px; }
        .reporting-panel tbody tr:nth-child(even) td { background: #FAF8F2; }
        .reporting-muted { color: var(--pam-slate); font-weight: 650; }
      `}</style>

      <h1>Rapportage</h1>

      {assets.length === 0 && (
        <div className="reporting-card">
          <EmptyState
            title="Rapportage ontstaat vanzelf"
            body="Zodra u assets, documenten en personen vastlegt, maakt PAM hier overzichtelijke rapportages van. Begin met één asset; daarna groeit het overzicht mee."
            actionLabel="Eerste asset toevoegen"
            secondaryLabel="Document toevoegen"
            onAction={() => openPamTab("assets")}
            onSecondary={() => openPamTab("docs")}
          />
        </div>
      )}

      {/* Controls */}
      <div className="reporting-card">
        <div className="reporting-controls">
          <div className="reporting-field">
            <label>Periode</label>
            <select value={String(days)} onChange={(e)=>setDays(e.target.value==="all"?"all":Number(e.target.value))}>
              <option value="7">Laatste 7 dagen</option>
              <option value="30">Laatste 30 dagen</option>
              <option value="90">Laatste 90 dagen</option>
              <option value="all">Alles</option>
            </select>
          </div>

          <div className="reporting-field">
            <label>Asset type</label>
            <select value={typeFilter} onChange={(e)=>setTypeFilter(e.target.value)}>
              <option value="all">Alle types</option>
              {allTypes.map((t)=> <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="reporting-field reporting-field--quarter">
            <label>Sortering</label>
            <button className="ui-btn" onClick={()=>setSortDesc(s=>!s)}>
              Sort: {sortDesc ? "Nieuw → Oud" : "Oud → Nieuw"}
            </button>
          </div>

          <div className="reporting-field reporting-field--quarter">
            <label>Export</label>
            <button className="ui-btn" onClick={exportCsv}>Export CSV</button>
          </div>

          <div className="reporting-field reporting-field--full">
            <label>Ontvanger (e-mail, optioneel)</label>
            <input type="email" value={recipient} onChange={(e)=>setRecipient(e.target.value)} placeholder="ontvanger@domein.com" />
          </div>
        </div>

        <div className="reporting-actions reporting-actions--between" style={{ marginTop: 12 }}>
          <div className="reporting-actions">
            <button className="ui-btn ui-btn--primary" onClick={makeTypePdf}>PDF: Per type</button>
            <button className="ui-btn ui-btn--primary" onClick={makeSelectedPdf} disabled={!selectedIds.length} title={!selectedIds.length ? "Selecteer eerst assets" : ""}>
              PDF: Geselecteerde
            </button>
            <button className="ui-btn ui-btn--primary" onClick={makeTotalPdf}>PDF: Totaal</button>
          </div>
          <div className="reporting-actions">
            <button className="ui-btn" onClick={sendTypePdf} disabled={!recipient}>Verzend type</button>
            <button className="ui-btn" onClick={sendSelectedPdf} disabled={!recipient || !selectedIds.length}>Verzend geselecteerde</button>
            <button className="ui-btn" onClick={sendTotalPdf} disabled={!recipient}>Verzend totaal</button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="reporting-card">
        <div className="reporting-kpis">
          <div className="reporting-kpi">
            <div className="label">Totaal assets</div>
            <div className="value">{total}</div>
          </div>
          <div className="reporting-kpi">
            <div className="label">In geselecteerde periode</div>
            <div className="value">{totalInWindow}</div>
          </div>
          <div className="reporting-kpi">
            <div className="label">Unieke types</div>
            <div className="value">{uniqueTypeCount}</div>
          </div>
          <div className="reporting-kpi">
            <div className="label">Unieke owners</div>
            <div className="value">{uniqueOwners}</div>
          </div>
        </div>
      </div>

      {/* Overzichten */}
      <div className="reporting-twocol">
        <div className="reporting-card">
          <div className="reporting-muted" style={{marginBottom:8}}>Per type</div>
          <div className="reporting-tablewrap">
            <table>
              <thead><tr><th>Type</th><th>Aantal</th></tr></thead>
              <tbody>
                {perType.map(([t,n],i)=>(
                  <tr key={t}><td>{t}</td><td>{n}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="reporting-card">
          <div className="reporting-muted" style={{marginBottom:8}}>Per owner</div>
          <div className="reporting-tablewrap">
            <table>
              <thead><tr><th>Owner</th><th>Aantal</th></tr></thead>
              <tbody>
                {perOwner.map(([o,n])=>(
                  <tr key={o}><td>{o}</td><td>{n}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      


      {/* Details */}
      <div className="reporting-card">
        <div className="reporting-muted" style={{marginBottom:8}}>Details</div>
        <div className="reporting-tablewrap">
          <table>
            <thead>
              <tr>
                <th>Select</th>
                <th>Nummer</th>
                <th>Naam</th>
                <th>Type</th>
                <th>Owner</th>
                <th>Aangemaakt</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((a)=>(
                <tr key={a.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(a.id)}
                      onChange={(e)=>toggleSelect(a.id, e.target.checked)}
                    />
                  </td>
                  <td>{a.number ?? "—"}</td>
                  <td>{a.name ?? "—"}</td>
                  <td>{a.type ? String(a.type).toUpperCase() : "UNKNOWN"}</td>
                  <td>{a.owner ?? a.ownerId ?? "—"}</td>
                  <td>{fmtDate(a.createdAt)}</td>
                </tr>
              ))}
              {!sorted.length && (
                <tr><td colSpan={6}>Geen assets in deze selectie.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
