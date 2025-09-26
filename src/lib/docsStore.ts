import { DocumentItem } from "../types";

const LS_KEY = "pam-docs-v1";

type DocState = { docs: DocumentItem[] };

function load(): DocState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { docs: [] };
    const parsed = JSON.parse(raw) as DocState;
    // defensieve normalisatie
    return {
      docs: (parsed.docs || []).map(d => ({
        ...d,
        assetNumbers: Array.isArray(d.assetNumbers) ? d.assetNumbers : [],
        recipients: Array.isArray(d.recipients) ? d.recipients : [],
      })),
    };
  } catch {
    return { docs: [] };
  }
}

function save(state: DocState) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

function makeId() {
  return (
    "doc_" +
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).slice(2, 8)
  );
}

export function getDocs(): DocumentItem[] {
  return load()
    .docs.slice()
    .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
}

export async function addDoc(
  file: File,
  meta?: { uploadedBy?: string; recipients?: string[]; notes?: string }
): Promise<DocumentItem> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });

  const doc: DocumentItem = {
    id: makeId(),
    filename: file.name,
    mime: file.type || "application/octet-stream",
    size: file.size,
    dataUrl,
    uploadedAt: new Date().toISOString(),
    uploadedBy: meta?.uploadedBy,
    recipients: meta?.recipients || [],
    assetNumbers: [],
    notes: meta?.notes,
  };

  const state = load();
  state.docs.push(doc);
  save(state);
  return doc;
}

export function removeDoc(docId: string) {
  const state = load();
  const next = state.docs.filter(d => d.id !== docId);
  save({ docs: next });
}

export function linkDocToAsset(docId: string, assetNumber: string) {
  const state = load();
  const d = state.docs.find(x => x.id === docId);
  if (!d) return;
  if (!d.assetNumbers.includes(assetNumber)) {
    d.assetNumbers.push(assetNumber);
    save(state);
  }
}

export function unlinkDocFromAsset(docId: string, assetNumber: string) {
  const state = load();
  const d = state.docs.find(x => x.id === docId);
  if (!d) return;
  d.assetNumbers = d.assetNumbers.filter(an => an !== assetNumber);
  save(state);
}

export function docsForAsset(assetNumber: string): DocumentItem[] {
  return getDocs().filter(d => d.assetNumbers.includes(assetNumber));
}

export function updateDocMeta(
  docId: string,
  patch: Partial<Pick<DocumentItem, "uploadedBy" | "recipients" | "notes">>
) {
  const state = load();
  const d = state.docs.find(x => x.id === docId);
  if (!d) return;
  Object.assign(d, patch);
  save(state);
}
