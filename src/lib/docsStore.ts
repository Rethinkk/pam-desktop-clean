import { DocumentsRegister, DocumentItem } from "../docTypes";

export const LS_KEY_DOCS = "pam-docs-v1";

function todayYmd(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

export function loadDocs(): DocumentsRegister {
  const raw = localStorage.getItem(LS_KEY_DOCS);
  if (!raw) return { version: 1, documents: [], counters: {} };
  try {
    const p = JSON.parse(raw);
    return {
      version: 1,
      documents: p.documents ?? [],
      counters: p.counters ?? {},
    };
  } catch {
    return { version: 1, documents: [], counters: {} };
  }
}

export function saveDocs(reg: DocumentsRegister) {
  localStorage.setItem(LS_KEY_DOCS, JSON.stringify(reg));
}

export function generateDocNumber(): string {
  const reg = loadDocs();
  const key = `DOC:${todayYmd()}`;
  const current = reg.counters[key] ?? 0;
  const next = current + 1;
  reg.counters[key] = next;
  saveDocs(reg);
  return `PAM-DOC-${todayYmd()}-${String(next).padStart(4, "0")}`;
}

export function persistDoc(doc: DocumentItem) {
  const reg = loadDocs();
  reg.documents.push(doc);
  saveDocs(reg);
}
