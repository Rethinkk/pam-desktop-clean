/* @ts-nocheck */
// Verwijder de @ts-nocheck weer zodra je elders types hebt rechtgetrokken.

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Genereert volgend assetnummer.
 * Voorbeeld: nextAssetNumber("PAM-ITM", "PAM-ITM-20250926-0007") => "PAM-ITM-20250926-0008"
 * Of (nieuwe dag/geen last): "PAM-ITM-YYYYMMDD-0001"
 */
export function nextAssetNumber(prefix: string, lastNumber?: string): string {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const today = `${yyyy}${mm}${dd}`;

  let nextSeq = 1;

  if (lastNumber) {
    // Match exact: PREFIX-YYYYMMDD-#### (#### = 4 cijfers)
    const re = new RegExp(`^${escapeRegExp(prefix)}-(\\d{8})-(\\d{4})$`);
    const m = lastNumber.match(re);
    if (m) {
      const lastDate = m[1];
      const lastSeq = parseInt(m[2], 10);
      nextSeq = lastDate === today ? lastSeq + 1 : 1;
    }
  }

  return `${prefix}-${today}-${String(nextSeq).padStart(4, "0")}`;
}
// --- opslaghelpers ---------------------------------------------------------
// Houd deze shape aan: { assets: Asset[] }  (types zijn niet nodig i.v.m. @ts-nocheck)
const ASSET_LS_KEY = "pam-assets-v1";

export function loadRegister() {
  try {
    const raw = localStorage.getItem(ASSET_LS_KEY);
    if (!raw) return { assets: [] };
    const parsed = JSON.parse(raw);
    return {
      assets: Array.isArray(parsed?.assets) ? parsed.assets : [],
    };
  } catch {
    return { assets: [] };
  }
}

export function saveRegister(nextAssets: any[]) {
  const reg = { assets: Array.isArray(nextAssets) ? nextAssets : [] };
  localStorage.setItem(ASSET_LS_KEY, JSON.stringify(reg));
}