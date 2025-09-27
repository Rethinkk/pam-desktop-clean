/* @ts-nocheck */
import type { DocumentItem } from "../types";

const LS_KEY = "pam-docs-v1";
const SEQ_KEY = "pam-docs-seq";

/* raw read/write */
function readRaw(): any[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.docs) ? parsed.docs : (Array.isArray(parsed) ? parsed : []);
  } catch {
    return [];
  }
}
function writeRaw(arr: any[]) {
  localStorage.setItem(LS_KEY, JSON.stringify({ docs: arr }));
}

/* normalizer: tilt legacy -> nieuw */
function normalizeDoc(d: any): DocumentItem {
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

/* API */
export function loadDocsCompat(): { docs: DocumentItem[] } {
  return { docs: readRaw().map(normalizeDoc) };
}
export function saveDocsCompat(docs: DocumentItem[]) {
  writeRaw(docs.map(normalizeDoc));
}
export function persistDocCompat(doc: DocumentItem) {
  const arr = readRaw();
  const n = normalizeDoc({ ...doc, updatedAt: new Date().toISOString() });
  arr.push(n);
  writeRaw(arr);
}
export function generateDocNumberCompat(): string {
  const n = Number(localStorage.getItem(SEQ_KEY) ?? "0") + 1;
  localStorage.setItem(SEQ_KEY, String(n));
  return `DOC-${String(n).padStart(4, "0")}`;
}

/* queries */
export function docsForAssetCompat(assetKey: string): DocumentItem[] {
  const key = String(assetKey ?? "");
  return loadDocsCompat().docs.filter(d =>
    (Array.isArray(d.assetIds) && d.assetIds.includes(key)) ||
    (Array.isArray((d as any).assetNumbers) && (d as any).assetNumbers.includes(key))
  );
}

/* linking (asset number of id; we schrijven beide waar mogelijk) */
export function linkDocToAssetCompat(docId: string, assetNumberOrId: string, assets: Array<{id?: string; assetNumber?: string}>) {
  const arr = readRaw();
  const idx = arr.findIndex((x:any) => x.id === docId);
  if (idx < 0) return;
  const d = normalizeDoc(arr[idx]);

  const found = assets.find(a => a.assetNumber === assetNumberOrId || a.id === assetNumberOrId);
  const assetId = found?.id;
  const assetNumber = found?.assetNumber ?? (found?.id ? undefined : assetNumberOrId);

  const ids = new Set(d.assetIds ?? []);
  if (assetId) ids.add(assetId);
  d.assetIds = [...ids];

  const nums = new Set(Array.isArray((d as any).assetNumbers) ? (d as any).assetNumbers : []);
  if (assetNumber) nums.add(assetNumber);
  (d as any).assetNumbers = [...nums];

  d.updatedAt = new Date().toISOString();
  arr[idx] = d;
  writeRaw(arr);
}

export function unlinkDocFromAssetCompat(docId: string, assetNumberOrId: string, assets: Array<{id?: string; assetNumber?: string}>) {
  const arr = readRaw();
  const idx = arr.findIndex((x:any) => x.id === docId);
  if (idx < 0) return;
  const d = normalizeDoc(arr[idx]);

  const found = assets.find(a => a.assetNumber === assetNumberOrId || a.id === assetNumberOrId);
  const assetId = found?.id ?? assetNumberOrId;
  const assetNumber = found?.assetNumber ?? assetNumberOrId;

  d.assetIds = (d.assetIds ?? []).filter((id:string) => id !== assetId && id !== assetNumber);
  if (Array.isArray((d as any).assetNumbers)) {
    (d as any).assetNumbers = (d as any).assetNumbers.filter((n:string) => n !== assetNumber && n !== assetId);
  }
  d.updatedAt = new Date().toISOString();
  arr[idx] = d;
  writeRaw(arr);
}

/* people linking */
export function linkDocToPersonCompat(docId: string, personId: string, relation: "uploadedBy"|"recipient") {
  const arr = readRaw();
  const idx = arr.findIndex((x:any) => x.id === docId);
  if (idx < 0) return;
  const d = normalizeDoc(arr[idx]);

  if (relation === "uploadedBy") d.uploadedById = personId || undefined;
  else {
    const set = new Set(d.recipientIds ?? []);
    set.add(personId);
    d.recipientIds = [...set];
  }
  d.updatedAt = new Date().toISOString();
  arr[idx] = d;
  writeRaw(arr);
}
export function unlinkDocFromPersonCompat(docId: string, personId: string, relation: "uploadedBy"|"recipient") {
  const arr = readRaw();
  const idx = arr.findIndex((x:any) => x.id === docId);
  if (idx < 0) return;
  const d = normalizeDoc(arr[idx]);

  if (relation === "uploadedBy") { if (d.uploadedById === personId) d.uploadedById = undefined; }
  else d.recipientIds = (d.recipientIds ?? []).filter((id:string) => id !== personId);

  d.updatedAt = new Date().toISOString();
  arr[idx] = d;
  writeRaw(arr);
}
