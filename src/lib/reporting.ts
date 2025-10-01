/* eslint-disable @typescript-eslint/no-explicit-any */
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Asset } from "../types";
import { SCHEMA_BY_CODE, ASSET_SCHEMAS } from "../assetSchemas";

/** ---- Types ---- */
export type ReportKind = "by-category" | "by-selection" | "total";
export type ReportInput = {
  kind: ReportKind;
  categoryCode?: string;   // voor 'by-category'
  selectedIds?: string[];  // voor 'by-selection'
};

type Row = [string, string, string, string];

// Minimal asset shape (we leunen niet op strikte 'Asset' velden hier)
type MinimalAsset = {
  id: string;
  number?: string | number;
  name?: string;
  typeCode?: string;
  createdAt?: string | number | Date;
} & Partial<Asset>;

/** ---- Veilige wrappers om indexering te typeren ---- */
const BY_CODE: Record<string, any> = SCHEMA_BY_CODE as unknown as Record<string, any>;
const SCHEMAS: Array<{ code: string; label?: string }> =
  ASSET_SCHEMAS as unknown as Array<{ code: string; label?: string }>;

function getLabelForCode(code: string): string {
  if (!code) return "";
  const fromMap = BY_CODE[code];
  if (fromMap && typeof fromMap.label === "string") return fromMap.label;
  const fromArr = SCHEMAS.find((s) => s.code === code);
  if (fromArr && typeof fromArr.label === "string") return fromArr.label!;
  return code;
}

/** ---- Helpers ---- */
function assetToRow(a: MinimalAsset): Row {
  const label = getLabelForCode(String(a.typeCode ?? ""));
  const created = a.createdAt ? new Date(a.createdAt as any).toLocaleDateString() : "";
  return [
    String(a.number ?? a.id ?? ""),
    String(a.name ?? ""),
    label,
    created,
  ];
}

/** Lijst categorieën die daadwerkelijk in gebruik zijn */
export function listCategoriesInUse(assets: MinimalAsset[]) {
  const seen = new Set<string>();
  for (const a of assets || []) {
    if (a && typeof a.typeCode === "string" && a.typeCode) seen.add(a.typeCode);
  }
  return Array.from(seen).map((code) => ({ code, label: getLabelForCode(code) }));
}

/** Bouw PDF-rapport (Blob + bestandsnaam) */
export function buildReport(assetsAll: MinimalAsset[], input: ReportInput) {
  let title = "Total Asset Report";
  let rows: Row[] = [];
  let subtitle = "";

  const all = Array.isArray(assetsAll) ? assetsAll : [];

  if (input.kind === "total") {
    rows = all.map(assetToRow);
    subtitle = `${rows.length} items`;
  } else if (input.kind === "by-selection") {
    const ids = new Set(input.selectedIds || []);
    const sel = all.filter((a) => ids.has(a.id));
    title = "Selected Assets Report";
    rows = sel.map(assetToRow);
    subtitle = `${rows.length} selected items`;
  } else if (input.kind === "by-category") {
    const code = input.categoryCode || "";
    const pick = all.filter((a) => a.typeCode === code);
    const label = getLabelForCode(code);
    title = `Category Report — ${label}`;
    rows = pick.map(assetToRow);
    subtitle = `${rows.length} items in ${label}`;
  }

  const doc = new jsPDF({ unit: "pt" });
  const when = new Date().toLocaleString();

  // Header
  doc.setFontSize(18);
  doc.text("PAM — Reporting", 40, 40);
  doc.setFontSize(14);
  doc.text(title, 40, 65);
  doc.setFontSize(10);
  doc.text(`Generated: ${when}`, 40, 82);
  if (subtitle) doc.text(subtitle, 40, 96);

  // Tabel
  autoTable(doc as any, {
    startY: 120,
    head: [["Nr/ID", "Naam", "Categorie", "Aangemaakt"]],
    body: rows,
    styles: { fontSize: 10, cellPadding: 6, overflow: "linebreak" },
    headStyles: { fillColor: [0, 0, 0], textColor: 255 },
    didDrawPage: () => {
      const str = `Page ${doc.getNumberOfPages()}`;
      doc.setFontSize(9);
      doc.text(
        str,
        (doc as any).internal.pageSize.getWidth() - 60,
        (doc as any).internal.pageSize.getHeight() - 20
      );
    },
  } as any);

  const blob = doc.output("blob");
  const safe = (s: string) => s.replace(/\s+/g, "_").replace(/[^\w\-]/g, "");
  const fileName =
    `PAM_${safe(title)}_${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "")}.pdf`;

  return { blob, fileName };
}
