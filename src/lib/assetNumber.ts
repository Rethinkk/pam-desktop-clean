/* @ts-nocheck */
import type { Asset } from "../types";
import { assetRepository, ASSETS_KEY } from "../storage/repositories";

/** Één bron van waarheid */
export const STORAGE_KEY = ASSETS_KEY;

/** Lees register (altijd {assets: Asset[]}). Inclusief automatische migratie. */
export function loadRegister(): { assets: Asset[] } {
  return assetRepository.load();
}

/** Sla register op. Neemt ofwel {assets} of direct Asset[] (back-compat). */
export function saveRegister(next: { assets: Asset[] } | Asset[]) {
  assetRepository.save(next);
}

/** Simpel volgnummer (houd gerust je eigen logic). */
export function nextAssetNumber(prefix = "PAM-ITM"): string {
  const { assets } = loadRegister();
  const n = assets.length + 1;
  return `${prefix}-${String(n).padStart(4, "0")}`;
}

/** ----------------------------------------------------------------------- */
/** People-koppelingen – compat: lees zowel legacy `people` als `personIds`,
 *  schrijf voortaan als `personIds` (meervoud).                              */
function readPersonIds(a: any): string[] {
  // nieuwe veldnaam
  if (Array.isArray(a?.personIds)) return a.personIds;
  // legacy veldnaam
  if (Array.isArray(a?.people)) return a.people;
  return [];
}

function writePersonIds(a: any, ids: string[]): any {
  // we normaliseren naar personIds, maar laten overige data intact
  const clone = { ...a, personIds: ids };
  // optioneel: legacy veld opruimen om dubbel opslaan te voorkomen
  if ("people" in clone) delete (clone as any).people;
  return clone;
}

/** Koppel persoon-id aan asset (via assetNumber). */
export function linkPersonToAsset(assetNumber: string, personId: string) {
  const reg = loadRegister();
  const idx = reg.assets.findIndex(a => a.assetNumber === assetNumber);
  if (idx === -1) return;

  const a: any = reg.assets[idx];
  const current = readPersonIds(a);
  const nextIds = Array.from(new Set([...current, personId]));
  reg.assets[idx] = writePersonIds(a, nextIds) as any;

  saveRegister(reg);
}

/** Ontkoppel persoon-id van asset (via assetNumber). */
export function unlinkPersonFromAsset(assetNumber: string, personId: string) {
  const reg = loadRegister();
  const idx = reg.assets.findIndex(a => a.assetNumber === assetNumber);
  if (idx === -1) return;

  const a: any = reg.assets[idx];
  const current = readPersonIds(a);
  const nextIds = current.filter(p => p !== personId);
  reg.assets[idx] = writePersonIds(a, nextIds) as any;

  saveRegister(reg);
}
