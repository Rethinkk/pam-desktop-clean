// src/lib/assetLinks.ts
import { loadRegister, saveRegister } from "./assetNumber";
import type { Asset } from "../types";

/** Interne helper: vind index van asset, -1 als niet gevonden */
function findAssetIndex(assets: Asset[], assetId: string): number {
  return assets.findIndex((a: Asset) => a.id === assetId);
}

/** Koppel 1 persoon aan 1 asset (idempotent) */
export function linkPersonToAsset(assetId: string, personId: string): void {
    const reg = loadRegister() as { assets: Asset[] };
    const idx = reg.assets.findIndex((a: Asset) => a.id === assetId);
    if (idx === -1) return;
  
    const set = new Set<string>(reg.assets[idx].personIds ?? []);
    set.add(personId);
  
    reg.assets[idx] = { ...reg.assets[idx], personIds: Array.from(set) };
  
    // saveRegister verwacht een array:
    saveRegister(reg.assets);
  }
  
  /** Ontkoppel 1 persoon van 1 asset */
  export function unlinkPersonFromAsset(assetId: string, personId: string): void {
    const reg = loadRegister() as { assets: Asset[] };
    const idx = reg.assets.findIndex((a: Asset) => a.id === assetId);
    if (idx === -1) return;
  
    const next = (reg.assets[idx].personIds ?? []).filter((id: string) => id !== personId);
    reg.assets[idx] = { ...reg.assets[idx], personIds: next };
  
    // saveRegister verwacht een array:
    saveRegister(reg.assets);
  }