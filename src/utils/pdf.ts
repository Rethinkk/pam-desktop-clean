/* @ts-nocheck */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Asset = {
  id: string;
  number?: string;
  name?: string;
  type?: string;
  owner?: string;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Doc = {
  id: string;
  title?: string;
  type?: string;
  assetId?: string;
  assetNumber?: string;
  expiryDate?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Person = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
};

const fmt = (v?: string) => (v ?? "—");
const today = () => new Date().toLocaleDateString();

/** Genereer basis header/footer */
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

/** 1) Rapport per asset-type */
export function buildAssetTypeReport(assets: Asset[], docs: Doc[], people: Person[], type: string) {
  const t = type.toUpperCase();
  const title = `Rapport — Asset type: ${t}`;
  const doc = new jsPDF();
  const { addFooter } = withHeaderFooter(doc, title);

  const subset = assets.filter(a => (a.type ? String(a.type).toUpperCase() : "UNKNOWN") === t);

  autoTable(doc, {
    startY: 24,
    head: [["Nummer", "Naam", "Owner", "Aangemaakt"]],
    body: subset.map(a => [fmt(a.number), fmt(a.name), fmt(a.owner ?? a.ownerId), fmt(a.createdAt)]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [16, 42, 74] },
    theme: "grid",
  });

  // Koppelde documenten (indien aanwezig)
  const byAssetId = new Map<string, Doc[]>();
  docs.forEach(d => {
    const key = d.assetId ?? d.assetNumber;
    if (!key) return;
    byAssetId.set(key, [...(byAssetId.get(key) ?? []), d]);
  });

  autoTable(doc, {
    head: [["Asset", "Doc-titel", "Type", "Vervaldatum"]],
    body: subset.flatMap(a => {
      const linked = byAssetId.get(a.id) ?? byAssetId.get(a.number ?? "") ?? [];
      if (!linked.length) return [];
      return linked.map(d => [fmt(a.number), fmt(d.title), fmt(d.type), fmt(d.expiryDate)]);
    }),
    styles: { fontSize: 9 },
    theme: "grid",
    margin: { top: 10 },
  });

  addFooter();
  return doc.output("blob");
}

/** 2) Rapport voor geselecteerde assets */
export function buildSelectedAssetsReport(assets: Asset[], docs: Doc[], selectedIds: string[]) {
  const picked = assets.filter(a => selectedIds.includes(a.id));
  const title = `Rapport — Geselecteerde assets (${picked.length})`;
  const doc = new jsPDF();
  const { addFooter } = withHeaderFooter(doc, title);

  autoTable(doc, {
    startY: 24,
    head: [["Nummer", "Naam", "Type", "Owner", "Aangemaakt"]],
    body: picked.map(a => [fmt(a.number), fmt(a.name), (a.type ?? "—").toUpperCase(), fmt(a.owner ?? a.ownerId), fmt(a.createdAt)]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [16, 42, 74] },
    theme: "grid",
  });

  // bijlagen: documenten per geselecteerde asset
  const byAssetId = new Map<string, Doc[]>();
  docs.forEach(d => {
    const key = d.assetId ?? d.assetNumber;
    if (!key) return;
    byAssetId.set(key, [...(byAssetId.get(key) ?? []), d]);
  });

  autoTable(doc, {
    head: [["Asset", "Doc-titel", "Type", "Vervaldatum"]],
    body: picked.flatMap(a => {
      const linked = byAssetId.get(a.id) ?? byAssetId.get(a.number ?? "") ?? [];
      if (!linked.length) return [];
      return linked.map(d => [fmt(a.number), fmt(d.title), fmt(d.type), fmt(d.expiryDate)]);
    }),
    styles: { fontSize: 9 },
    theme: "grid",
    margin: { top: 10 },
  });

  addFooter();
  return doc.output("blob");
}

/** 3) Totaalrapport (compact) */
export function buildTotalReport(assets: Asset[], docs: Doc[], people: Person[]) {
  const doc = new jsPDF();
  const { addFooter } = withHeaderFooter(doc, "Totaalrapport — Assets, Docs, Mensen");

  // KPIs
  autoTable(doc, {
    startY: 24,
    head: [["KPI", "Waarde"]],
    body: [
      ["Totaal assets", String(assets.length)],
      ["Totaal docs", String(docs.length)],
      ["Totaal mensen", String(people.length)],
    ],
    styles: { fontSize: 9 },
    theme: "grid",
  });

  // Assets (afgekapt op 40 regels voor PDF-compactheid)
  autoTable(doc, {
    head: [["Nummer", "Naam", "Type", "Owner", "Aangemaakt"]],
    body: assets.slice(0, 40).map(a => [fmt(a.number), fmt(a.name), (a.type ?? "—").toUpperCase(), fmt(a.owner ?? a.ownerId), fmt(a.createdAt)]),
    styles: { fontSize: 9 },
    theme: "grid",
    margin: { top: 10 },
  });

  // Docs (afgekapt)
  autoTable(doc, {
    head: [["Titel", "Type", "Asset", "Vervaldatum"]],
    body: docs.slice(0, 40).map(d => [fmt(d.title), fmt(d.type), fmt(d.assetNumber ?? d.assetId), fmt(d.expiryDate)]),
    styles: { fontSize: 9 },
    theme: "grid",
    margin: { top: 10 },
  });

  addFooter();
  return doc.output("blob");
}
