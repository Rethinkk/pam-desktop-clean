/* @ts-nocheck */
import type { DocumentItem } from "../types";
import { documentRepository } from "../storage/repositories";

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

export const loadDocsCompat = () => ({ docs: documentRepository.all().map(normalize) });
export const saveDocsCompat = (docs: DocumentItem[]) => documentRepository.saveAll(docs.map(normalize));

export function generateDocNumberCompat(): string {
  return documentRepository.nextNumber();
}

export function persistDocCompat(doc: DocumentItem) {
  const arr = documentRepository.all();
  arr.push(normalize({ ...doc, updatedAt: new Date().toISOString() }));
  documentRepository.saveAll(arr);
}

export function docsForAssetCompat(assetKey: string): DocumentItem[] {
  const key = String(assetKey ?? "");
  return loadDocsCompat().docs.filter(d =>
    (Array.isArray(d.assetIds) && d.assetIds.includes(key)) ||
    (Array.isArray((d as any).assetNumbers) && (d as any).assetNumbers.includes(key))
  );
}
