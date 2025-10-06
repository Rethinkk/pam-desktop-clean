// src/lib/exportAll.ts
type PamExport = {
  app: 'PersonalAssetManager';
  version: number; // export-formaatversie
  createdAt: string; // ISO datum
  schema?: unknown;
  assets: unknown[]; // expliciet als array
  docs: unknown[]; // expliciet als array
  people: unknown[]; // expliciet als array
  meta?: Record<string, unknown>;
};

// Helper om veilig JSON uit localStorage te lezen, met generics
function readJSON<T = unknown>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

// Zorg dat we altijd een array teruggeven
function toArray(x: unknown | undefined): unknown[] {
  return Array.isArray(x) ? x : [];
}

export function buildPamExport(): PamExport {
  // ✅ Geef hier het verwachte type mee
  const schema = readJSON<unknown>('pam-asset-schema-v1');
  const assets = toArray(readJSON<unknown[]>('pam-assets-v1'));
  const docs = toArray(readJSON<unknown[]>('pam-docs-v1'));
  const people = toArray(readJSON<unknown[]>('pam-people-v1'));

  return {
    app: 'PersonalAssetManager',
    version: 1,
    createdAt: new Date().toISOString(),
    schema,
    assets,
    docs,
    people,
    meta: {
      locale: navigator.language,
      userAgent: navigator.userAgent,
    },
  };
}
