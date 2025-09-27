/* @ts-nocheck */
import type { DocumentItem } from "../types";

const LS_KEY = "pam-docs-v1";
const SEQ_KEY = "pam-docs-seq";

function readRaw(): any[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.docs) ? parsed.docs : (Array.isArray(parsed) ? parsed : []);
  } catch { return []; }
}
function writeRaw(arr: any[]) { localStorage.setItem(LS_KEY, JSON.stringify({ docs: arr })); }

function normalize(d: any): DocumentItem {
  const created = d.createdAt ?? d.uploadedAt ?? new Date().toISOString();
  const updated = d.updatedAt ?? created;
  return {
    id: d.id ?? ("doc_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2,8)),
    docNumber: d.docNumber,
    title: d.title ?? d.filename ?? "Document",
    fileName: d.fileName ?? d.filename ?? "",
    fileSize: d.fileSize ?? d.size ?? 0,
    mimeType: d.mimeType ?? d.mime ?? "application/octet-stream",
    fileDataUrl: d.fileDataUrl ?? d.dataUrl ?? "",
    assetIds: Array.isArray(d.assetIds) ? d.assetIds : [],
    uploadedById: d.uploadedById ?? d.uploadedBy,
    recipientIds: Array.isArray(d.recipientIds) ? d.recipientIds : (Array.isArray(d.recipients) ? d.recipients : []),
    createdAt: created,
    updatedAt: updated,
    notes: d.notes,
    assetNumbers: Array.isArray(d.assetNumbers) ? d.assetNumbers : undefined, // legacy tolerant
  };
}

export const loadDocsCompat = () => ({ docs: readRaw().map(normalize) });
export const saveDocsCompat = (docs: DocumentItem[]) => writeRaw(docs.map(normalize));

export function generateDocNumberCompat(): string {
  const n = Number(localStorage.getItem(SEQ_KEY) ?? "0") + 1;
  localStorage.setItem(SEQ_KEY, String(n));
  return `DOC-${String(n).padStart(4, "0")}`;
}

export function persistDocCompat(doc: DocumentItem) {
  const arr = readRaw();
  arr.push(normalize({ ...doc, updatedAt: new Date().toISOString() }));
  writeRaw(arr);
}

export function docsForAssetCompat(assetKey: string): DocumentItem[] {
  const key = String(assetKey ?? "");
  return loadDocsCompat().docs.filter(d =>
    (Array.isArray(d.assetIds) && d.assetIds.includes(key)) ||
    (Array.isArray((d as any).assetNumbers) && (d as any).assetNumbers.includes(key))
  );
}
