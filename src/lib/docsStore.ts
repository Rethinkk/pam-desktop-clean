/* @ts-nocheck */
import type { DocumentItem } from "../types";

const LS_KEY = "pam-docs-v1";
const SEQ_KEY = "pam-docs-seq";

type DocState = { docs: DocumentItem[] };

export function loadDocs(): DocState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { docs: [] };
    const parsed = JSON.parse(raw);
    const docs = Array.isArray(parsed?.docs) ? parsed.docs : Array.isArray(parsed) ? parsed : [];
    return { docs: docs.map(normalizeDoc) };
  } catch {
    return { docs: [] };
  }
}
export function saveDocs(state: DocState) { localStorage.setItem(LS_KEY, JSON.stringify(state)); }

function normalizeDoc(d: any): DocumentItem {
  const created = d.createdAt ?? d.uploadedAt ?? new Date().toISOString();
  const updated = d.updatedAt ?? created;
  return {
    id: d.id ?? makeId(),
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
    assetNumbers: Array.isArray(d.assetNumbers) ? d.assetNumbers : undefined, // legacy
  };
}
function makeId() { return "doc_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2,8); }

export function generateDocNumber(): string {
  const n = Number(localStorage.getItem(SEQ_KEY) ?? "0") + 1;
  localStorage.setItem(SEQ_KEY, String(n));
  return `DOC-${String(n).padStart(4, "0")}`;
}
export function persistDoc(doc: DocumentItem): void {
  const state = loadDocs();
  const toSave = normalizeDoc({ ...doc, updatedAt: new Date().toISOString() });
  state.docs.push(toSave);
  saveDocs(state);
}

export function getDocs(): DocumentItem[] {
  return loadDocs().docs.slice().sort((a,b)=> (a.createdAt < b.createdAt ? 1 : -1));
}
export async function addDoc(file: File, meta?: { uploadedById?: string; recipientIds?: string[]; notes?: string; title?: string }): Promise<DocumentItem> {
  const dataUrl = await new Promise<string>((res, rej) => { const fr = new FileReader(); fr.onload=()=>res(String(fr.result??"")); fr.onerror=rej; fr.readAsDataURL(file); });
  const now = new Date().toISOString();
  const doc: DocumentItem = {
    id: makeId(),
    docNumber: generateDocNumber(),
    title: (meta?.title ?? file.name)?.trim(),
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || "application/octet-stream",
    fileDataUrl: dataUrl,
    assetIds: [],
    uploadedById: meta?.uploadedById,
    recipientIds: meta?.recipientIds ?? [],
    createdAt: now,
    updatedAt: now,
    notes: meta?.notes,
  };
  persistDoc(doc); return doc;
}
export function removeDoc(docId: string) {
  const state = loadDocs();
  state.docs = state.docs.filter(d=>d.id!==docId);
  saveDocs(state);
}
export function docsForAsset(assetKey: string): DocumentItem[] {
  const key = String(assetKey ?? "");
  const { docs } = loadDocs();
  return docs.filter(d =>
    (Array.isArray(d.assetIds) && d.assetIds.includes(key)) ||
    (Array.isArray((d as any).assetNumbers) && (d as any).assetNumbers.includes(key))
  );
}
export function updateDocMeta(docId: string, patch: Partial<Pick<DocumentItem, "title"|"uploadedById"|"recipientIds"|"notes">>) {
  const state = loadDocs();
  const d = state.docs.find(x=>x.id===docId);
  if (!d) return;
  Object.assign(d, patch);
  d.updatedAt = new Date().toISOString();
  saveDocs(state);
}

/* Linking helpers */
export function linkDocToAsset(docId: string, assetId: string) {
  if (!assetId) return;
  const state = loadDocs(); const d = state.docs.find(x=>x.id===docId); if (!d) return;
  const set = new Set(d.assetIds ?? []); set.add(assetId);
  d.assetIds = [...set]; d.updatedAt = new Date().toISOString(); saveDocs(state);
}
export function unlinkDocFromAsset(docId: string, assetId: string) {
  const state = loadDocs(); const d = state.docs.find(x=>x.id===docId); if (!d) return;
  d.assetIds = (d.assetIds ?? []).filter(id=>id!==assetId);
  d.updatedAt = new Date().toISOString(); saveDocs(state);
}
export function linkDocToPerson(docId: string, personId: string, relation: "uploadedBy"|"recipient") {
  const state = loadDocs(); const d = state.docs.find(x=>x.id===docId); if (!d) return;
  if (relation==="uploadedBy") d.uploadedById = personId || undefined;
  else { const set = new Set(d.recipientIds ?? []); set.add(personId); d.recipientIds = [...set]; }
  d.updatedAt = new Date().toISOString(); saveDocs(state);
}
export function unlinkDocFromPerson(docId: string, personId: string, relation: "uploadedBy"|"recipient") {
  const state = loadDocs(); const d = state.docs.find(x=>x.id===docId); if (!d) return;
  if (relation==="uploadedBy") { if (d.uploadedById===personId) d.uploadedById = undefined; }
  else d.recipientIds = (d.recipientIds ?? []).filter(id=>id!==personId);
  d.updatedAt = new Date().toISOString(); saveDocs(state);
}

/* Legacy number helpers (optioneel) */
export function linkDocToAssetNumber(docId: string, assetNumber: string) {
  const state = loadDocs(); const d: any = state.docs.find(x=>x.id===docId); if (!d) return;
  const arr = Array.isArray(d.assetNumbers) ? d.assetNumbers : [];
  if (!arr.includes(assetNumber)) { d.assetNumbers = [...arr, assetNumber]; d.updatedAt=new Date().toISOString(); saveDocs(state); }
}
export function unlinkDocFromAssetNumber(docId: string, assetNumber: string) {
  const state = loadDocs(); const d: any = state.docs.find(x=>x.id===docId); if (!d) return;
  d.assetNumbers = (Array.isArray(d.assetNumbers) ? d.assetNumbers : []).filter((an:string)=>an!==assetNumber);
  d.updatedAt=new Date().toISOString(); saveDocs(state);
}

