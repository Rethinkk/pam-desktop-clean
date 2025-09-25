import { AssetRegister } from "../types";

export const LS_KEY = "pam-assets-v1";

export function loadRegister(): AssetRegister {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return { version: 1, assets: [], counters: {} };
  try {
    const parsed = JSON.parse(raw);
    return {
      version: 1,
      assets: parsed.assets ?? [],
      counters: parsed.counters ?? {},
    };
  } catch {
    return { version: 1, assets: [], counters: {} };
  }
}

export function saveRegister(reg: AssetRegister) {
  localStorage.setItem(LS_KEY, JSON.stringify(reg));
}

export function deleteAssetAt(index: number) {
  const { assets } = loadRegister();
  if (!Array.isArray(assets)) return;
  if (index < 0 || index >= assets.length) return;
  const next = assets.slice();
  next.splice(index, 1);
  saveRegister(next);
}


function todayYmd(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

export function generateAssetNumber(typeCode: string): string {
  const reg = loadRegister();
  const key = `${typeCode}:${todayYmd()}`;
  const current = reg.counters[key] ?? 0;
  const next = current + 1;
  reg.counters[key] = next;
  saveRegister(reg);
  return `PAM-${typeCode}-${todayYmd()}-${String(next).padStart(4, "0")}`;
}
