/* @ts-nocheck */
import React from 'react';
import {
  loadAssetSchema,
  validateAsset,
  type AssetSchema,
  type AssetTypeDefinition,
} from '../config/assetSchema';

/**
 * Register dat werkt met:
 *  - legacy vlakke rows
 *  - nieuwe rows met .data + { typeId, typeLabel }
 * Bovenaan zit nu een invoerformulier dat ALLE asset types uit config/assetSchema.ts rendert.
 */

type Row = {
  id: string;
  name?: string;
  type?: string;
  serial?: string;
  brand?: string;
  model?: string;
  personId?: string;
  personName?: string;
  purchaseDate?: string;
  warrantyUntil?: string;
  priceCents?: number;
  documentIds?: string[];
  notes?: string;
  createdAt?: string | number;
  updatedAt?: string | number;
  // nieuwe structuur
  typeId?: string;
  typeLabel?: string;
  data?: Record<string, any>;
  /** laat dynamische toegang toe: row[someKey] */
  [key: string]: any;
};

const ASSETS_KEY = 'pam-assets-v1';
const PSEUDO_DETAILS = '__details__';

/** -----------------------------
 *  INLINE dynamisch veldenformulier (geen apart bestand nodig)
 *  ----------------------------- */
function DynamicFieldsFormInline({
  fields,
  value,
  errors = {},
  onChange,
}: {
  fields: {
    key: string;
    label: string;
    type: string;
    required?: boolean;
    options?: string[];
    placeholder?: string;
    hint?: string;
  }[];
  value: Record<string, any>;
  errors?: Record<string, string>;
  onChange: (next: Record<string, any>) => void;
}) {
  function upd(k: string, v: any) {
    onChange({ ...value, [k]: v });
  }
  async function onFile(k: string, file?: File | null) {
    if (!file) {
      upd(k, undefined);
      return;
    }
    const toDataURL = (f: File) =>
      new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.onerror = rej;
        r.readAsDataURL(f);
      });
    const dataUrl = await toDataURL(file);
    upd(k, { name: file.name, size: file.size, type: file.type, dataUrl });
  }

  return (
    <div className="ui-stack">
      {fields.map((f) => {
        const err = (errors as any)[f.key];
        return (
          <div
            key={f.key}
            className={`ui-card p-4 rounded-2xl border shadow-sm ${err ? 'border-red-300' : ''}`}
          >
            <label className="block text-sm font-medium mb-1">
              {f.label}
              {f.required && <span className="text-red-500"> *</span>}
            </label>

            {(f.type === 'text' ||
              f.type === 'email' ||
              f.type === 'url' ||
              f.type === 'phone') && (
              <input
                className="ui-input w-full"
                type={
                  f.type === 'email'
                    ? 'email'
                    : f.type === 'url'
                      ? 'url'
                      : f.type === 'phone'
                        ? 'tel'
                        : 'text'
                }
                placeholder={f.placeholder}
                value={value[f.key] ?? ''}
                onChange={(e) => upd(f.key, e.target.value)}
              />
            )}

            {f.type === 'textarea' && (
              <textarea
                className="ui-input w-full"
                rows={3}
                placeholder={f.placeholder}
                value={value[f.key] ?? ''}
                onChange={(e) => upd(f.key, e.target.value)}
              />
            )}

            {(f.type === 'number' || f.type === 'currency') && (
              <input
                className="ui-input w-full"
                type="number"
                step={f.type === 'currency' ? '0.01' : '1'}
                placeholder={f.type === 'currency' ? '0,00' : undefined}
                value={value[f.key] ?? ''}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') return upd(f.key, '');
                  const num = Number(raw);
                  upd(f.key, isNaN(num) ? raw : num);
                }}
              />
            )}

            {f.type === 'date' && (
              <input
                className="ui-input w-full"
                type="date"
                value={value[f.key] ?? ''}
                onChange={(e) => upd(f.key, e.target.value)}
              />
            )}

            {f.type === 'select' && (
              <select
                className="ui-input w-full"
                value={value[f.key] ?? ''}
                onChange={(e) => upd(f.key, e.target.value)}
              >
                <option value="">— kies —</option>
                {(f.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}

            {f.type === 'file' && (
              <>
                <input
                  className="ui-input w-full"
                  type="file"
                  onChange={(e) => onFile(f.key, e.target.files?.[0] ?? null)}
                />
                {value[f.key]?.name && (
                  <div className="mt-2 text-xs text-gray-600">
                    Gekozen: <strong>{value[f.key].name}</strong> (
                    {Math.round((value[f.key].size || 0) / 1024)} kB)
                    <button
                      className="ml-2 underline"
                      onClick={() => upd(f.key, undefined)}
                    >
                      verwijderen
                    </button>
                  </div>
                )}
              </>
            )}

            {f.type === 'boolean' && (
              <div className="flex items-center gap-2">
                <input
                  id={`chk-${f.key}`}
                  type="checkbox"
                  checked={!!value[f.key]}
                  onChange={(e) => upd(f.key, e.target.checked)}
                />
                <label htmlFor={`chk-${f.key}`} className="text-sm">
                  Ja / Nee
                </label>
              </div>
            )}

            {f.hint && <p className="text-xs text-gray-500 mt-1">{f.hint}</p>}
            {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
          </div>
        );
      })}
    </div>
  );
}

/** -----------------------------
 *  Labels uit schema
 *  ----------------------------- */
function buildLabelMap(schema: AssetSchema): Record<string, string> {
  const map: Record<string, string> = {};
  for (const t of schema.types) {
    for (const f of t.fields) {
      if (f?.key && f?.label) map[f.key] = f.label;
    }
  }
  map['name'] = map['name'] || 'Naam';
  map['type'] = map['type'] || 'Type';
  map['typeLabel'] = map['typeLabel'] || 'Type';
  map['priceCents'] = map['priceCents'] || 'Prijs';
  map['serial'] = map['serial'] || 'Serienummer';
  map['personName'] = map['personName'] || 'Persoon';
  map['purchaseDate'] = map['purchaseDate'] || 'Aankoopdatum';
  map[PSEUDO_DETAILS] = 'Details';
  return map;
}

/** -----------------------------
 *  Kandidaten-kolommen obv schema
 *  ----------------------------- */
function computeCandidateKeys(schema: AssetSchema): string[] {
  const freq: Record<string, number> = {};
  for (const t of schema.types) {
    for (const f of t.fields) {
      if (!f?.key) continue;
      if (f.key === 'name' || f.key === 'type') continue;
      freq[f.key] = (freq[f.key] || 0) + 1;
    }
  }
  const COMMON_SCHEMA_KEYS = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
    .slice(0, 8);

  const LEGACY_HINTS = [
    'serial',
    'brand',
    'model',
    'purchaseDate',
    'warrantyUntil',
    'priceCents',
    'personName',
  ];

  const BASE = ['name', 'typeLabel'];
  return Array.from(new Set([...BASE, ...COMMON_SCHEMA_KEYS, ...LEGACY_HINTS]));
}

/** -----------------------------
 *  Helpers voor waarden
 *  ----------------------------- */
function formatPrice(cents?: number) {
  if (cents == null || isNaN(Number(cents)) || Number(cents) <= 0) return '';
  try {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(Number(cents) / 100);
  } catch {
    return `€ ${(Number(cents) / 100).toFixed(2)}`;
  }
}

function valueFromRow(row: Row, key: string) {
  // vlakke property
  const flat = (row as Record<string, any>)[key];
  if (flat !== undefined && flat !== null && flat !== '') return flat;

  // property uit data{}
  const d = row?.data as Record<string, any> | undefined;
  if (d && d[key] !== undefined && d[key] !== null && d[key] !== '')
    return d[key];

  // fallback voor type
  if (key === 'typeLabel') return row.typeLabel || row.type || '';
  return '';
}

function cmp(a: any, b: any, dir: 'asc' | 'desc') {
  const A = a ?? '';
  const B = b ?? '';
  if (typeof A === 'number' && typeof B === 'number') {
    return dir === 'asc' ? A - B : B - A;
  }
  const sA = String(A);
  const sB = String(B);
  return dir === 'asc' ? sA.localeCompare(sB) : sB.localeCompare(sA);
}

/** -----------------------------
 *  Flatten voor .data-records
 *  ----------------------------- */
function flattenRow(r: any): any {
  const name =
    r.name ??
    r?.data?.naam ??
    r?.data?.titel ??
    r?.data?.object ??
    r?.data?.domein ??
    r?.data?.domeinnaam ??
    r?.data?.adres ??
    r?.data?.merk_model ??
    r?.data?.apparaat ??
    r?.data?.bank ??
    r?.data?.entiteit ??
    '';

  const typeLabel = r.typeLabel ?? r.type ?? '';

  const merged = { ...(r.data || {}), ...r };
  if (!merged.name) merged.name = name;
  if (!merged.type) merged.type = typeLabel;
  if (!merged.typeLabel) merged.typeLabel = typeLabel;

  return merged;
}

/** -----------------------------
 *  Type-resolve o.b.v. row
 *  ----------------------------- */
function resolveType(
  schema: AssetSchema,
  row: Row,
): AssetTypeDefinition | undefined {
  if (row.typeId) {
    const byId = schema.types.find((t) => t.id === row.typeId);
    if (byId) return byId;
  }
  const label = row.typeLabel || row.type || '';
  if (label) {
    const byLabel = schema.types.find((t) => t.label === label);
    if (byLabel) return byLabel;
    const byId2 = schema.types.find((t) => t.id === label);
    if (byId2) return byId2;
  }
  return undefined;
}

/** -----------------------------
 *  Samenvatting per rij (Details)
 *  ----------------------------- */
function summarizeRow(
  schema: AssetSchema,
  row: Row,
  labelMap: Record<string, string>,
) {
  const t = resolveType(schema, row);

  // 1) Neem schema-velden van dit type; filter op bruikbaar voor lijst
  const preferredKeys = (t?.fields ?? [])
    .filter((f) => !['file', 'textarea', 'boolean'].includes(f.type))
    .map((f) => f.key);

  // 2) Val terug op aanwezige keys in data/row
  const src: Record<string, any> = { ...(row.data || {}), ...(row as any) };
  const presentKeys = new Set<string>();
  Object.keys(src).forEach((k) => {
    if (k.startsWith('_')) return;
    if (
      [
        'id',
        'typeId',
        'type',
        'typeLabel',
        'name',
        'notes',
        'documentIds',
        'createdAt',
        'updatedAt',
      ].includes(k)
    )
      return;
    if (src[k] === undefined || src[k] === null || src[k] === '') return;
    presentKeys.add(k);
  });

  // 3) Rangorde: eerst schema keys (volgorde uit type), daarna overige
  const ordered = [
    ...preferredKeys.filter((k) => presentKeys.has(k)),
    ...Array.from(presentKeys).filter((k) => !preferredKeys.includes(k)),
  ];

  const take = ordered.slice(0, 5); // toon 3–5 kernvelden
  if (take.length === 0) return <span className="text-gray-400">—</span>;

  return (
    <div className="flex flex-wrap gap-2">
      {take.map((k) => {
        let v = src[k];
        if (k === 'priceCents') v = formatPrice(v);
        if (v && typeof v === 'object' && v.name) v = v.name; // file-achtig object → naam
        const label = labelMap[k] || k;
        return (
          <span
            key={k}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border"
          >
            <strong>{label}:</strong> <span>{String(v)}</span>
          </span>
        );
      })}
    </div>
  );
}

/** -----------------------------
 *  Component
 *  ----------------------------- */
export default function AssetRegisterPanel() {
  const [schema] = React.useState<AssetSchema>(() => loadAssetSchema());
  const LABELS_FROM_SCHEMA = React.useMemo(
    () => buildLabelMap(schema),
    [schema],
  );
  const CANDIDATE_KEYS = React.useMemo(
    () => computeCandidateKeys(schema),
    [schema],
  );

  // 🔹 NIEUW: state voor invoerformulier
  const [typeId, setTypeId] = React.useState<string>('');
  const typeDef = React.useMemo(
    () => (typeId ? schema.types.find((t) => t.id === typeId) : undefined),
    [schema, typeId],
  );
  const [data, setData] = React.useState<Record<string, any>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [rows, setRows] = React.useState<Row[]>([]);
  const [q, setQ] = React.useState('');
  const [sort, setSort] = React.useState<{ key: string; dir: 'asc' | 'desc' }>({
    key: 'name',
    dir: 'asc',
  });
  const [highlightId, setHighlightId] = React.useState<string | null>(null);

  React.useEffect(() => {
    load();
    try {
      const id = sessionStorage.getItem('pam-last-created');
      if (id) {
        setHighlightId(id);
        sessionStorage.removeItem('pam-last-created');
      }
    } catch {}
  }, []);

  function load() {
    try {
      const raw = localStorage.getItem(ASSETS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);

      const arr: Row[] = Array.isArray(parsed?.assets)
        ? parsed.assets
        : Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.items)
            ? parsed.items
            : [];

      // Flatten ALTIJD: toont ook records met .data
      const normalized = arr.map((r: any) => (r?.data ? flattenRow(r) : r));
      setRows(normalized);
    } catch {}
  }

  function toggleSort(key: string) {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' },
    );
  }

  function handleDelete(id: string) {
    if (!confirm('Weet je zeker dat je dit asset wilt verwijderen?')) return;

    try {
      const raw = localStorage.getItem(ASSETS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const isContainer =
          parsed &&
          (Array.isArray(parsed.assets) || Array.isArray(parsed.items));
        const list = Array.isArray(parsed?.assets)
          ? parsed.assets
          : Array.isArray(parsed?.items)
            ? parsed.items
            : Array.isArray(parsed)
              ? parsed
              : [];

        const next = list.filter((a: any) => a.id !== id);
        let out: any;
        if (Array.isArray(parsed?.assets)) out = { ...parsed, assets: next };
        else if (Array.isArray(parsed?.items)) out = { ...parsed, items: next };
        else if (Array.isArray(parsed)) out = next;
        else out = { assets: next };

        localStorage.setItem(ASSETS_KEY, JSON.stringify(out));
      }
    } catch {}

    setRows((r) => r.filter((x) => x.id !== id));

    try {
      window.dispatchEvent(
        new CustomEvent('pam:toast', {
          detail: { message: 'Asset verwijderd', tone: 'info' },
        }),
      );
    } catch {}
  }

  // 🔹 NIEUW: opslaan van nieuw asset (compatibel met alle opslagvormen)
  function persistAdd(record: any) {
    try {
      const raw = localStorage.getItem(ASSETS_KEY);
      if (!raw) {
        localStorage.setItem(ASSETS_KEY, JSON.stringify([record]));
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        localStorage.setItem(ASSETS_KEY, JSON.stringify([record, ...parsed]));
      } else if (Array.isArray(parsed?.assets)) {
        localStorage.setItem(
          ASSETS_KEY,
          JSON.stringify({ ...parsed, assets: [record, ...parsed.assets] }),
        );
      } else if (Array.isArray(parsed?.items)) {
        localStorage.setItem(
          ASSETS_KEY,
          JSON.stringify({ ...parsed, items: [record, ...parsed.items] }),
        );
      } else {
        localStorage.setItem(ASSETS_KEY, JSON.stringify([record]));
      }
    } catch {}
  }

  function resetForm() {
    setData({});
    setErrors({});
    setTypeId('');
  }

  function saveNew() {
    const errs = validateAsset(schema, typeId, data);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const rec = {
      id: crypto.randomUUID(),
      typeId,
      typeLabel: typeDef?.label ?? typeId,
      data,
      createdAt: Date.now(),
    };

    persistAdd(rec);
    sessionStorage.setItem('pam-last-created', rec.id);
    // ook direct in UI
    setRows((prev) => [flattenRow(rec), ...prev]);
    resetForm();

    try {
      window.dispatchEvent(
        new CustomEvent('pam:toast', {
          detail: { message: 'Asset opgeslagen', tone: 'success' },
        }),
      );
    } catch {}
  }

  // Kolommen: toon kandidaten die voorkomen + altijd name/type + altijd Details
  const TABLE_KEYS: string[] = React.useMemo(() => {
    const present = new Set<string>();
    for (const r of rows) {
      for (const k of CANDIDATE_KEYS) {
        const val = valueFromRow(r, k);
        if (val !== '' && val !== undefined && val !== null) present.add(k);
      }
    }
    present.add('name');
    present.add('typeLabel');
    present.add(PSEUDO_DETAILS); // altijd samenvatting
    return Array.from(present);
  }, [rows, CANDIDATE_KEYS]);

  const colLabel = (key: string) =>
    LABELS_FROM_SCHEMA[key] ||
    (key === 'name'
      ? 'Naam'
      : key === 'typeLabel'
        ? 'Type'
        : key === PSEUDO_DETAILS
          ? 'Details'
          : String(key));

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    const SEARCH_KEYS = Array.from(
      new Set([...TABLE_KEYS, 'type', 'notes', 'brand', 'model', 'serial']),
    );

    let out = !needle
      ? rows
      : rows.filter((r) =>
          SEARCH_KEYS.filter((k) => k !== PSEUDO_DETAILS) // details is afgeleid
            .map((k) => valueFromRow(r, k))
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(needle)),
        );

    out = [...out].sort((a, b) => {
      if (sort.key === PSEUDO_DETAILS) return 0; // niet sorteren op afgeleide kolom
      const A = valueFromRow(a, sort.key);
      const B = valueFromRow(b, sort.key);
      if (sort.key === 'priceCents') {
        const nA = Number(A ?? 0);
        const nB = Number(B ?? 0);
        return sort.dir === 'asc' ? nA - nB : nB - nA;
      }
      return cmp(A, B, sort.dir);
    });

    return out;
  }, [rows, q, sort, TABLE_KEYS]);

  return (
    <div className="ui-page">
      <div className="ui-section-title">Asset register ({filtered.length})</div>

      {/* 🔹 NIEUW: Invoerblok */}
      <div className="ui-card p-4 rounded-2xl border shadow-sm mb-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Asset type</label>
            <select
              className="ui-input w-full"
              value={typeId}
              onChange={(e) => {
                setTypeId(e.target.value);
                setErrors({});
                setData({});
              }}
            >
              <option value="">— kies asset type —</option>
              {schema.types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {typeDef && (
            <div className="md:col-span-2">
              <div className="text-sm text-gray-600 mb-2">
                Velden voor: <strong>{typeDef.label}</strong>
              </div>
              <DynamicFieldsFormInline
                fields={typeDef.fields}
                value={data}
                errors={errors}
                onChange={setData}
              />
              <div className="mt-3 flex justify-end gap-2">
                <button className="ui-btn" onClick={resetForm}>
                  Annuleren
                </button>
                <button className="ui-btn ui-btn--primary" onClick={saveNew}>
                  Opslaan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar + lijst */}
      <div className="ui-toolbar">
        <input
          placeholder="Zoeken…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="spacer" />
        <small>{filtered.length} resultaten</small>
      </div>

      <div className="ui-table-wrap">
        <table className="ui-table">
          <thead>
            <tr>
              {TABLE_KEYS.map((k) => (
                <th
                  key={String(k)}
                  onClick={() => k !== PSEUDO_DETAILS && toggleSort(k)}
                >
                  {colLabel(k)}
                </th>
              ))}
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                className={r.id === highlightId ? 'ui-row-highlight' : ''}
              >
                {TABLE_KEYS.map((k) => {
                  if (k === PSEUDO_DETAILS) {
                    return (
                      <td key={k}>
                        {summarizeRow(schema, r, LABELS_FROM_SCHEMA)}
                      </td>
                    );
                  }

                  const rawVal = valueFromRow(r, k);
                  let cell = rawVal ?? '';

                  if (k === 'priceCents') cell = formatPrice(rawVal);
                  if (
                    rawVal &&
                    typeof rawVal === 'object' &&
                    rawVal.name &&
                    rawVal.size
                  ) {
                    cell = `${rawVal.name} (${Math.round(rawVal.size / 1024)} kB)`;
                  }

                  return <td key={String(k)}>{cell}</td>;
                })}
                <td>
                  <button
                    className="ui-btn ui-btn--sm ui-btn--danger"
                    onClick={() => handleDelete(r.id)}
                  >
                    Verwijderen
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={TABLE_KEYS.length + 1}>
                  <em>Geen assets gevonden.</em>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
