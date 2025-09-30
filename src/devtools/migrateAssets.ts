/* @ts-nocheck */
// tijdelijke migratie van assets tussen verschillende keys
export function migrateAssets() {
    const CANDIDATES = ["pam-assets-register-v1","pam-assets-v1"];
    const map = new Map();
    const sources: string[] = [];
  
    for (const k of Object.keys(localStorage)) {
      try {
        const v = JSON.parse(localStorage.getItem(k)!);
        const arr = Array.isArray(v?.assets) ? v.assets : Array.isArray(v) ? v : [];
        if (arr.length) sources.push(k);
        for (const a of arr) {
          if (!a) continue;
          const key = a.id || a.assetNumber;
          if (key && !map.has(key)) map.set(key, a);
        }
      } catch {}
    }
  
    const merged = [...map.values()];
    localStorage.setItem("pam-assets-v1", JSON.stringify({ assets: merged }));
    localStorage.setItem("pam-assets-register-v1", JSON.stringify({ assets: merged }));
    window.dispatchEvent(new CustomEvent("pam-assets-updated"));
  
    console.log("✅ Migrated", merged.length, "assets from", sources);
  }
  