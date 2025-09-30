/* @ts-nocheck */
import type { Asset } from "../types";

/** Één bron van waarheid */
export const STORAGE_KEY = "pam-assets-v1";

/** Kandidaten die we (eenmalig / telkens) migreren naar STORAGE_KEY */
const CANDIDATE_KEYS = [
  STORAGE_KEY,
  "pam-asset-register-v1",   // jouw oude key uit dit bestand
  "pam-assets-register-v1",  // varianten die we zijn tegengekomen
];

/** Safe parse helper – accepteert {assets:[]} of direct [] */
function safeParse(raw: string | null) {
  if (!raw) return { assets: [] as Asset[] };
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { assets: parsed as Asset[] }; // backwards compat
    if (Array.isArray(parsed?.assets)) return { assets: parsed.assets as Asset[] };
    return { assets: [] as Asset[] };
  } catch {
    return { assets: [] as Asset[] };
  }
}

/** Merge helper: unieke assets op id → assetNumber → referentie */
function mergeAssets(lists: Asset[][]): Asset[] {
  const byKey = new Map<string, Asset>();
  for (const list of lists) {
    for (const a of list || []) {
      if (!a) continue;
      const k = (a as any).id || (a as any).assetNumber;
      if (!k) continue;
      if (!byKey.has(k)) byKey.set(k, a);
    }
  }
  return [...byKey.values()];
}

/** Migreer alle kandidaat-sleutels naar STORAGE_KEY (non-destructief). */
function migrateToPrimary(): { assets: Asset[] } {
  const all: Asset[][] = [];
  const seenSources: string[] = [];

  for (const key of CANDIDATE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const { assets } = safeParse(raw);
      if (assets.length) {
        all.push(assets);
        seenSources.push(key);
      }
    } catch {}
  }

  // Ook alle andere keys meenemen die op 'pam' en 'asset' lijken, voor de zekerheid
  for (const key of Object.keys(localStorage)) {
    if (CANDIDATE_KEYS.includes(key)) continue;
    if (!/pam|asset/i.test(key)) continue;
    try {
      const raw = localStorage.getItem(key);
      const { assets } = safeParse(raw);
      if (assets.length) {
        all.push(assets);
        seenSources.push(key);
      }
    } catch {}
  }

  const merged = mergeAssets(all);

  // Altijd als {assets:[]} wegschrijven naar de primaire key
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ assets: merged }));
    // Event voor UI-refresh
    try { window.dispatchEvent(new CustomEvent("pam-assets-updated")); } catch {}
    if (seenSources.length) {
      console.log("assetNumber.migrateToPrimary → merged", merged.length, "assets from", seenSources);
    }
  } catch (e) {
    console.warn("migrateToPrimary error:", e);
  }

  return { assets: merged };
}

/** Lees register (altijd {assets: Asset[]}). Inclusief automatische migratie. */
export function loadRegister(): { assets: Asset[] } {
  // 1) probeer primaire key
  const primary = safeParse(localStorage.getItem(STORAGE_KEY));
  if (primary.assets.length) return primary;

  // 2) niets gevonden → migreren vanaf kandidaten/legacy
  return migrateToPrimary();
}

/** Sla register op. Neemt ofwel {assets} of direct Asset[] (back-compat). */
export function saveRegister(next: { assets: Asset[] } | Asset[]) {
  const payload = Array.isArray(next) ? { assets: next } : (next || { assets: [] });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    // notify UI's
    try { window.dispatchEvent(new CustomEvent("pam-assets-updated")); } catch {}
  } catch (e) {
    console.warn("saveRegister error:", e);
  }
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

