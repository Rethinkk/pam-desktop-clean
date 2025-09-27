/* @ts-nocheck */
import type { DocumentItem } from "../types";
import { loadRegister } from "./assetNumber";
import {
  loadDocsCompat, saveDocsCompat, persistDocCompat, generateDocNumberCompat,
  docsForAssetCompat
} from "./compatDocs";

export const loadDocs = () => loadDocsCompat();
export const saveDocs = (s: { docs: DocumentItem[] }) => saveDocsCompat(s.docs);
export const persistDoc = (d: DocumentItem) => persistDocCompat(d);
export const generateDocNumber = () => generateDocNumberCompat();
export const docsForAsset = (k: string) => docsForAssetCompat(k);

// Koppelen: we accepteren assetNumber of assetId en schrijven beide vormen weg waar mogelijk
export function linkDocToAsset(docId: string, assetIdOrNumber: string) {
  const reg = loadRegister(); const assets = Array.isArray(reg?.assets) ? reg.assets : [];
  const raw = loadDocs().docs;
  const idx = raw.findIndex((x:any) => x.id === docId);
  if (idx < 0) return;
  const d = raw[idx];

  const found = assets.find(a => a.assetNumber === assetIdOrNumber || a.id === assetIdOrNumber);
  const assetId = found?.id ?? assetIdOrNumber;
  const assetNum = found?.assetNumber ?? assetIdOrNumber;

  const ids = new Set(d.assetIds ?? []); ids.add(assetId);
  (d as any).assetIds = [...ids];

  const nums = new Set(Array.isArray((d as any).assetNumbers) ? (d as any).assetNumbers : []);
  nums.add(assetNum); (d as any).assetNumbers = [...nums];

  d.updatedAt = new Date().toISOString();
  saveDocs({ docs: raw });
}
export function unlinkDocFromAsset(docId: string, assetIdOrNumber: string) {
  const reg = loadRegister(); const assets = Array.isArray(reg?.assets) ? reg.assets : [];
  const raw = loadDocs().docs;
  const idx = raw.findIndex((x:any) => x.id === docId);
  if (idx < 0) return;
  const d = raw[idx];

  const found = assets.find(a => a.assetNumber === assetIdOrNumber || a.id === assetIdOrNumber);
  const assetId = found?.id ?? assetIdOrNumber;
  const assetNum = found?.assetNumber ?? assetIdOrNumber;

  (d as any).assetIds = (d.assetIds ?? []).filter((x:string) => x !== assetId && x !== assetNum);
  if (Array.isArray((d as any).assetNumbers)) {
    (d as any).assetNumbers = (d as any).assetNumbers.filter((n:string) => n !== assetNum && n !== assetId);
  }
  d.updatedAt = new Date().toISOString();
  saveDocs({ docs: raw });
}

// Legacy helpers blijven werken
export const linkDocToAssetNumber = (docId: string, n: string) => linkDocToAsset(docId, n);
export const unlinkDocFromAssetNumber = (docId: string, n: string) => unlinkDocFromAsset(docId, n);
