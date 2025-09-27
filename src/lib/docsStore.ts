/* @ts-nocheck */
import type { DocumentItem } from "../types";
import { loadRegister } from "./assetNumber";
import {
  loadDocsCompat, saveDocsCompat, persistDocCompat, generateDocNumberCompat,
  docsForAssetCompat, linkDocToAssetCompat, unlinkDocFromAssetCompat,
  linkDocToPersonCompat, unlinkDocFromPersonCompat
} from "./compatDocs";

export function loadDocs() { return loadDocsCompat(); }
export function saveDocs(state: { docs: DocumentItem[] }) { return saveDocsCompat(state.docs); }
export function persistDoc(doc: DocumentItem) { return persistDocCompat(doc); }
export function generateDocNumber() { return generateDocNumberCompat(); }

export function docsForAsset(assetKey: string) { return docsForAssetCompat(assetKey); }
export function linkDocToAsset(docId: string, assetIdOrNumber: string) {
  const reg = loadRegister(); const assets = Array.isArray(reg?.assets) ? reg.assets : [];
  return linkDocToAssetCompat(docId, assetIdOrNumber, assets);
}
export function unlinkDocFromAsset(docId: string, assetIdOrNumber: string) {
  const reg = loadRegister(); const assets = Array.isArray(reg?.assets) ? reg.assets : [];
  return unlinkDocFromAssetCompat(docId, assetIdOrNumber, assets);
}

export function linkDocToPerson(docId: string, personId: string, relation: "uploadedBy"|"recipient") {
  return linkDocToPersonCompat(docId, personId, relation);
}
export function unlinkDocFromPerson(docId: string, personId: string, relation: "uploadedBy"|"recipient") {
  return unlinkDocFromPersonCompat(docId, personId, relation);
}

/* Legacy helpers op assetNumber blijven werken */
export function linkDocToAssetNumber(docId: string, assetNumber: string) { return linkDocToAsset(docId, assetNumber); }
export function unlinkDocFromAssetNumber(docId: string, assetNumber: string) { return unlinkDocFromAsset(docId, assetNumber); }
