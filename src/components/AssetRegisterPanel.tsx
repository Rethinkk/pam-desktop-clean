/* @ts-nocheck */
import React from "react";
import {
  loadAssetSchema,
  validateAsset,
  type AssetSchema,
  type AssetTypeDefinition,
} from "../config/assetSchema";
import { openPamTab } from "../lib/workspaceTabs";
import { assetRepository, documentRepository, personRepository } from "../storage/repositories";
import { EmptyState } from "./ui/UI";



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
  finalizedAt?: string;
  status?: string;
  // nieuwe structuur
  typeId?: string;
  typeLabel?: string;
  data?: Record<string, any>;
  /** laat dynamische toegang toe: row[someKey] */
  [key: string]: any;
};

type OptionRow = {
  id: string;
  label: string;
  assetIds?: string[];
};

const PSEUDO_DETAILS = "__details__";
const PSEUDO_PEOPLE = "__people__";
const PSEUDO_DOCUMENTS = "__documents__";
const PSEUDO_STATUS = "__status__";

const LEGACY_TYPE_ALIASES: Record<string, string> = {
  ict: "ict-apparatuur",
  vastgoed_bezittingen: "vastgoed",
  verzekeringen: "verzekering",
  abonnementen: "abonnement",
  domeinnamen: "domeinnaam",
  bankrekeningen: "bankrekening",
  beleggingen: "belegging",
  pensioenen: "pensioen",
  service_providers: "serviceprovider",
};

const LEGACY_FIELD_ALIASES: Record<string, string> = {
  brand: "merk",
  serial: "serienummer",
  purchaseDate: "aankoopdatum",
  warrantyUntil: "garantie_tot",
  priceCents: "aankoopwaarde",
};

/** -----------------------------
 *  INLINE dynamisch veldenformulier (geen apart bestand nodig)
 *  ----------------------------- */
function DynamicFieldsFormInline({
  fields,
  value,
  errors = {},
  onChange,
}: {
  fields: { key: string; label: string; type: string; required?: boolean; options?: string[]; placeholder?: string; hint?: string }[];
  value: Record<string, any>;
  errors?: Record<string, string>;
  onChange: (next: Record<string, any>) => void;
}) {
  function upd(k: string, v: any) {
    onChange({ ...value, [k]: v });
  }
  async function onFile(k: string, file?: File | null) {
    if (!file) { upd(k, undefined); return; }
    const toDataURL = (f: File) => new Promise<string>((res, rej) => {
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
          <div key={f.key} className={`ui-card p-4 rounded-2xl border shadow-sm ${err ? "border-red-300" : ""}`}>
            <label className="block text-sm font-medium mb-1">
              {f.label}{f.required && <span className="text-red-500"> *</span>}
            </label>

            {(f.type === "text" || f.type === "email" || f.type === "url" || f.type === "phone") && (
              <input
                className="ui-input w-full"
                type={f.type === "email" ? "email" : f.type === "url" ? "url" : f.type === "phone" ? "tel" : "text"}
                placeholder={f.placeholder}
                value={value[f.key] ?? ""}
                onChange={(e) => upd(f.key, e.target.value)}
              />
            )}

            {f.type === "textarea" && (
              <textarea
                className="ui-input w-full"
                rows={3}
                placeholder={f.placeholder}
                value={value[f.key] ?? ""}
                onChange={(e) => upd(f.key, e.target.value)}
              />
            )}

            {(f.type === "number" || f.type === "currency") && (
              <input
                className="ui-input w-full"
                type="number"
                step={f.type === "currency" ? "0.01" : "1"}
                placeholder={f.type === "currency" ? "0,00" : undefined}
                value={value[f.key] ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") return upd(f.key, "");
                  const num = Number(raw);
                  upd(f.key, isNaN(num) ? raw : num);
                }}
              />
            )}

            {f.type === "date" && (
              <input
                className="ui-input w-full"
                type="date"
                value={value[f.key] ?? ""}
                onChange={(e) => upd(f.key, e.target.value)}
              />
            )}

            {f.type === "select" && (
              <select
                className="ui-input w-full"
                value={value[f.key] ?? ""}
                onChange={(e) => upd(f.key, e.target.value)}
              >
                <option value="">— kies —</option>
                {(f.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}

            {f.type === "file" && (
              <>
                <input className="ui-input w-full" type="file" onChange={(e) => onFile(f.key, e.target.files?.[0] ?? null)} />
                {value[f.key]?.name && (
                  <div className="mt-2 text-xs text-gray-600">
                    Gekozen: <strong>{value[f.key].name}</strong> ({Math.round((value[f.key].size || 0) / 1024)} kB)
                    <button className="ml-2 underline" onClick={() => upd(f.key, undefined)}>verwijderen</button>
                  </div>
                )}
              </>
            )}

            {f.type === "boolean" && (
              <div className="flex items-center gap-2">
                <input
                  id={`chk-${f.key}`}
                  type="checkbox"
                  checked={!!value[f.key]}
                  onChange={(e) => upd(f.key, e.target.checked)}
                />
                <label htmlFor={`chk-${f.key}`} className="text-sm">Ja / Nee</label>
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

function DetailBlock({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#FCFBF8",
        border: "1px solid #DEDCD5",
        borderRadius: 12,
        padding: "11px 13px",
      }}
    >
      <div style={{ color: "#60718A", fontSize: 12, fontWeight: 720, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ color: "#123052", fontSize: 14, lineHeight: 1.45, overflowWrap: "anywhere" }}>
        {value}
      </div>
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
  map["name"] = map["name"] || "Naam";
  map["type"] = map["type"] || "Type";
  map["typeLabel"] = map["typeLabel"] || "Type";
  map["priceCents"] = map["priceCents"] || "Prijs";
  map["serial"] = map["serial"] || "Serienummer";
  map["personName"] = map["personName"] || "Persoon";
  map["purchaseDate"] = map["purchaseDate"] || "Aankoopdatum";
  map[PSEUDO_DETAILS] = "Details";
  map[PSEUDO_PEOPLE] = "Mensen";
  map[PSEUDO_STATUS] = "Status";
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
      if (f.key === "name" || f.key === "type") continue;
      freq[f.key] = (freq[f.key] || 0) + 1;
    }
  }
  const COMMON_SCHEMA_KEYS = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
    .slice(0, 8);

  const LEGACY_HINTS = [
    "serienummer",
    "merk",
    "model",
    "aankoopdatum",
    "garantie_tot",
    "aankoopwaarde",
  ];

  const BASE = ["name", "typeLabel"];
  return Array.from(new Set([...BASE, ...COMMON_SCHEMA_KEYS, ...LEGACY_HINTS]));
}

/** -----------------------------
 *  Helpers voor waarden
 *  ----------------------------- */
function formatPrice(cents?: number) {
  if (cents == null || isNaN(Number(cents)) || Number(cents) <= 0) return "";
  try {
    return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(cents) / 100);
  } catch {
    return `€ ${(Number(cents) / 100).toFixed(2)}`;
  }
}

function currencyToCents(value: any) {
  if (value == null || value === "") return undefined;
  const normalized =
    typeof value === "string"
      ? value.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "")
      : value;
  const amount = Number(normalized);
  if (Number.isNaN(amount)) return undefined;
  return Math.round(amount * 100);
}

function valueFromRow(row: Row, key: string) {
  // vlakke property
  const flat = (row as Record<string, any>)[key];
  if (flat !== undefined && flat !== null && flat !== "") return flat;

  // property uit data{}
  const d = row?.data as Record<string, any> | undefined;
  if (d && d[key] !== undefined && d[key] !== null && d[key] !== "") return d[key];

  // fallback voor type
  if (key === "typeLabel") return row.typeLabel || row.type || "";
  return "";
}

function fieldTypeForKey(schema: AssetSchema, key: string) {
  for (const type of schema.types) {
    const field = type.fields.find((item) => item.key === key);
    if (field) return field.type;
  }
  return undefined;
}

function cmp(a: any, b: any, dir: "asc" | "desc") {
  const A = a ?? "";
  const B = b ?? "";
  if (typeof A === "number" && typeof B === "number") {
    return dir === "asc" ? A - B : B - A;
  }
  const sA = String(A);
  const sB = String(B);
  return dir === "asc" ? sA.localeCompare(sB) : sB.localeCompare(sA);
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
    "";

  const typeLabel = r.typeLabel ?? r.type ?? "";

  const merged = { ...(r.data || {}), ...r };
  if (!merged.name) merged.name = name;
  if (!merged.type) merged.type = typeLabel;
  if (!merged.typeLabel) merged.typeLabel = typeLabel;
  if (!merged.merk && merged.brand) merged.merk = merged.brand;
  if (!merged.serienummer && merged.serial) merged.serienummer = merged.serial;
  if (!merged.aankoopdatum && merged.purchaseDate) merged.aankoopdatum = merged.purchaseDate;
  if (!merged.garantie_tot && merged.warrantyUntil) merged.garantie_tot = merged.warrantyUntil;
  if ((merged.aankoopwaarde === undefined || merged.aankoopwaarde === "") && merged.priceCents) {
    merged.aankoopwaarde = Number(merged.priceCents) / 100;
  }

  return merged;
}

function assetNameFromData(data?: Record<string, any>) {
  return (
    data?.naam ??
    data?.titel ??
    data?.object ??
    data?.domein ??
    data?.domeinnaam ??
    data?.adres ??
    data?.merk_model ??
    data?.apparaat ??
    data?.bank ??
    data?.entiteit ??
    ""
  );
}

function isFinalized(row: Row) {
  return row.status === "finalized" || !!row.finalizedAt;
}

function normalizeEditData(row: Row, typeId?: string) {
  const src: Record<string, any> = { ...(row.data || {}), ...(row as any) };
  const next = { ...(row.data || {}) };

  if (typeId === "ict-apparatuur") {
    next.naam = next.naam ?? src.name;
    next.merk = next.merk ?? src.brand;
    next.serienummer = next.serienummer ?? src.serial;
    next.model = next.model ?? src.model;
    next.aankoopdatum = next.aankoopdatum ?? src.purchaseDate;
    next.garantie_tot = next.garantie_tot ?? src.warrantyUntil;
    next.aankoopwaarde = next.aankoopwaarde ?? src.priceCents;
  }

  return next;
}

function legacyFieldsFromData(typeId: string, data: Record<string, any>) {
  if (typeId === "ict-apparatuur") {
    return {
      name: data.naam,
      brand: data.merk,
      serial: data.serienummer,
      model: data.model,
      purchaseDate: data.aankoopdatum,
      warrantyUntil: data.garantie_tot,
      priceCents: currencyToCents(data.aankoopwaarde),
    };
  }

  return {};
}

function isFileLike(value: any) {
  return value && typeof value === "object" && value.name;
}

function formatDetailValue(value: any, fieldType?: string, key?: string) {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Ja" : "Nee";
  if (isFileLike(value)) {
    const size = value.size ? ` (${Math.round(Number(value.size) / 1024)} kB)` : "";
    return `${value.name}${size}`;
  }
  if (key === "priceCents") return formatPrice(value);
  if (fieldType === "currency" && !isNaN(Number(value))) {
    try {
      return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(value));
    } catch {
      return `€ ${Number(value).toFixed(2)}`;
    }
  }
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formatMetaDate(value: any) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("nl-NL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function detailEntriesForRow(schema: AssetSchema, row: Row, labelMap: Record<string, string>) {
  const type = resolveType(schema, row);
  const src: Record<string, any> = { ...(row.data || {}), ...(row as any) };
  const hidden = new Set([
    "id",
    "typeId",
    "type",
    "typeLabel",
    "name",
    "personId",
    "personName",
    "personIds",
    "documentIds",
    PSEUDO_DOCUMENTS,
    "status",
    "finalizedAt",
    "createdAt",
    "updatedAt",
    "data",
    ...Object.keys(LEGACY_FIELD_ALIASES),
  ]);
  const fieldByKey = new Map((type?.fields ?? []).map((field) => [field.key, field]));
  const orderedKeys = [
    ...(type?.fields ?? []).map((field) => field.key),
    ...Object.keys(src).filter((key) => !fieldByKey.has(key)),
  ];
  const seen = new Set<string>();

  return orderedKeys
    .filter((key) => {
      if (seen.has(key) || hidden.has(key) || key.startsWith("_")) return false;
      seen.add(key);
      const canonicalKey = LEGACY_FIELD_ALIASES[key];
      if (canonicalKey && src[canonicalKey] !== undefined && src[canonicalKey] !== null && src[canonicalKey] !== "") {
        return false;
      }
      const value = src[key];
      return value !== undefined && value !== null && value !== "";
    })
    .map((key) => {
      const field = fieldByKey.get(key);
      return {
        key,
        label: field?.label || labelMap[key] || key,
        value: formatDetailValue(src[key], field?.type, key),
      };
    });
}

/** -----------------------------
 *  Type-resolve o.b.v. row
 *  ----------------------------- */
function resolveType(schema: AssetSchema, row: Row): AssetTypeDefinition | undefined {
  if (row.typeId) {
    const byId = schema.types.find((t) => t.id === row.typeId);
    if (byId) return byId;
    const alias = LEGACY_TYPE_ALIASES[row.typeId];
    if (alias) {
      const byAlias = schema.types.find((t) => t.id === alias);
      if (byAlias) return byAlias;
    }
  }
  const label = row.typeLabel || row.type || "";
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
function summarizeRow(schema: AssetSchema, row: Row, labelMap: Record<string, string>) {
  const t = resolveType(schema, row);

  // 1) Neem schema-velden van dit type; filter op bruikbaar voor lijst
  const preferredKeys = (t?.fields ?? [])
    .filter((f) => !["file", "textarea", "boolean"].includes(f.type))
    .map((f) => f.key);

  // 2) Val terug op aanwezige keys in data/row
  const src: Record<string, any> = { ...(row.data || {}), ...(row as any) };
  const presentKeys = new Set<string>();
  Object.keys(src).forEach((k) => {
    if (k.startsWith("_")) return;
    if (LEGACY_FIELD_ALIASES[k]) return;
    if ([
      "id",
      "typeId",
      "type",
      "typeLabel",
      "name",
      "notes",
      "personId",
      "personIds",
      "personName",
      "documentIds",
      PSEUDO_DOCUMENTS,
      "status",
      "finalizedAt",
      "createdAt",
      "updatedAt",
    ].includes(k)) return;
    if (src[k] === undefined || src[k] === null || src[k] === "") return;
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
        const fieldType = t?.fields.find((field) => field.key === k)?.type;
        if (fieldType === "currency") v = formatDetailValue(v, fieldType, k);
        if (v && typeof v === "object" && v.name) v = v.name; // file-achtig object → naam
        const label = labelMap[k] || k;
        return (
          <span key={k} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border">
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
  const LABELS_FROM_SCHEMA = React.useMemo(() => buildLabelMap(schema), [schema]);
  const CANDIDATE_KEYS = React.useMemo(() => computeCandidateKeys(schema), [schema]);

  

  // 🔹 NIEUW: state voor invoerformulier
  const [typeId, setTypeId] = React.useState<string>("");
  const typeDef = React.useMemo(
    () => (typeId ? schema.types.find((t) => t.id === typeId) : undefined),
    [schema, typeId]
  );
  const [data, setData] = React.useState<Record<string, any>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [selectedPersonIds, setSelectedPersonIds] = React.useState<string[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = React.useState<string[]>([]);
  const [people, setPeople] = React.useState<OptionRow[]>([]);
  const [documents, setDocuments] = React.useState<OptionRow[]>([]);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [rows, setRows] = React.useState<Row[]>([]);
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState<{ key: string; dir: "asc" | "desc" }>({
    key: "name",
    dir: "asc",
  });
  const [highlightId, setHighlightId] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    load();
    loadLinkOptions();
    try {
      const id = sessionStorage.getItem("pam-last-created");
      if (id) {
        setHighlightId(id);
        sessionStorage.removeItem("pam-last-created");
      }
    } catch {}
  }, []);

  function load() {
    try {
      const arr: Row[] = assetRepository.load().assets;
      // Flatten ALTIJD: toont ook records met .data
      const normalized = arr.map((r: any) => (r?.data ? flattenRow(r) : r));
      setRows(normalized);
    } catch {}
  }

  function loadLinkOptions() {
    try {
      const personOptions = personRepository
        .all()
        .map((p: any) => ({
          id: p.id,
          label: (p.fullName ?? p.name ?? "").trim(),
        }))
        .filter((p) => !!p.id && !!p.label);
      setPeople(personOptions);
    } catch {}

    try {
      const docOptions = documentRepository
        .all()
        .map((d: any) => ({
          id: d.id,
          label: [d.title ?? d.fileName ?? "Document", d.type].filter(Boolean).join(" — "),
          assetIds: Array.isArray(d.assetIds) ? d.assetIds : [],
        }))
        .filter((d) => !!d.id && !!d.label);
      setDocuments(docOptions);
    } catch {}
  }

  function toggleSort(key: string) {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  }

  function handleDelete(id: string) {
    if (!confirm("Weet je zeker dat je dit asset wilt verwijderen?")) return;

    try {
      const next = assetRepository.load().assets.filter((a: any) => a.id !== id);
      assetRepository.save({ assets: next });
    } catch {}

    setRows((r) => r.filter((x) => x.id !== id));
    if (expandedId === id) setExpandedId(null);

    try {
      window.dispatchEvent(
        new CustomEvent("pam:toast", {
          detail: { message: "Asset verwijderd", tone: "info" },
        })
      );
    } catch {}
  }

  // 🔹 NIEUW: opslaan van nieuw asset (compatibel met alle opslagvormen)
  function persistAdd(record: any) {
    try {
      const reg = assetRepository.load();
      assetRepository.save({ assets: [record, ...reg.assets] });
    } catch {}
  }

  function resetForm() {
    setData({});
    setErrors({});
    setTypeId("");
    setSelectedPersonIds([]);
    setSelectedDocumentIds([]);
    setEditingId(null);
  }

  function toggleId(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
  }

  function syncDocumentAssetLinks(assetId: string, selectedIds: string[]) {
    const selected = new Set(selectedIds);
    const nextDocs = documentRepository.all().map((doc: any) => {
      const current = new Set<string>(Array.isArray(doc.assetIds) ? doc.assetIds : []);
      if (selected.has(doc.id)) {
        current.add(assetId);
      } else {
        current.delete(assetId);
      }
      return {
        ...doc,
        assetIds: Array.from(current),
        updatedAt: new Date().toISOString(),
      };
    });
    documentRepository.saveAll(nextDocs as any);
  }

  function inferDocumentType(fieldKey: string, fieldLabel: string) {
    const text = `${fieldKey} ${fieldLabel}`.toLowerCase();
    if (text.includes("factuur")) return "Factuur";
    if (text.includes("garantie")) return "Garantiebewijs";
    if (text.includes("polis")) return "Polis";
    if (text.includes("contract")) return "Contract";
    return "Overig";
  }

  function syncAssetFileDocuments(asset: any, assetLabel: string): string[] {
    const fileFields = (typeDef?.fields ?? []).filter((field) => field.type === "file");
    if (!fileFields.length) return Array.isArray(asset.documentIds) ? asset.documentIds : [];

    const now = new Date().toISOString();
    const docs = documentRepository.all() as any[];
    const generatedIds: string[] = [];
    const fileFieldKeys = new Set(fileFields.map((field) => field.key));
    const nextDocs = docs.filter((doc: any) => {
      const isGeneratedForAsset = doc.sourceAssetId === asset.id && fileFieldKeys.has(doc.sourceFieldKey);
      if (!isGeneratedForAsset) return true;
      return Boolean(asset.data?.[doc.sourceFieldKey]?.name);
    });

    for (const field of fileFields) {
      const file = asset.data?.[field.key];
      if (!file?.name) continue;

      const existing = docs.find((doc: any) => doc.sourceAssetId === asset.id && doc.sourceFieldKey === field.key);
      const docId = existing?.id ?? crypto.randomUUID();
      generatedIds.push(docId);

      const generatedDoc = {
        ...(existing ?? {}),
        id: docId,
        title: `${field.label} - ${assetLabel}`,
        type: inferDocumentType(field.key, field.label),
        fileName: file.name,
        filename: file.name,
        fileSize: file.size ?? 0,
        size: file.size ?? 0,
        mimeType: file.type || "application/octet-stream",
        mime: file.type || "application/octet-stream",
        fileDataUrl: file.dataUrl ?? "",
        dataUrl: file.dataUrl ?? "",
        assetIds: Array.from(new Set([...(existing?.assetIds ?? []), asset.id])),
        sourceAssetId: asset.id,
        sourceFieldKey: field.key,
        notes: existing?.notes ?? `Automatisch aangemaakt vanuit assetveld '${field.label}'.`,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      const existingIndex = nextDocs.findIndex((doc: any) => doc.id === docId);
      if (existingIndex >= 0) nextDocs[existingIndex] = generatedDoc;
      else nextDocs.push(generatedDoc);
    }

    documentRepository.saveAll(nextDocs as any);
    return generatedIds;
  }

  function saveAsset() {
    const errs = validateAsset(schema, typeId, data);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      window.dispatchEvent(new CustomEvent("pam:toast", {
        detail: { message: "Vul de verplichte velden aan voordat u opslaat.", tone: "warn" },
      }));
      return;
    }

    const existing = editingId
      ? assetRepository.load().assets.find((asset: any) => asset.id === editingId)
      : null;
    if (existing && isFinalized(existing as Row)) {
      window.dispatchEvent(new CustomEvent("pam:toast", {
        detail: { message: "Dit asset is vastgelegd en kan niet meer worden aangepast.", tone: "warn" },
      }));
      resetForm();
      return;
    }

    const primaryPerson = people.find((person) => person.id === selectedPersonIds[0]);
    const assetName = assetNameFromData(data);
    const legacyFields = legacyFieldsFromData(typeId, data);
    const wasEditing = !!editingId;
    const rec = {
      ...(existing ?? {}),
      ...legacyFields,
      id: editingId ?? crypto.randomUUID(),
      typeId,
      typeLabel: typeDef?.label ?? typeId,
      name: assetName || (legacyFields as any).name || existing?.name || undefined,
      personId: selectedPersonIds[0] || undefined,
      personName: primaryPerson?.label,
      personIds: selectedPersonIds.length ? selectedPersonIds : undefined,
      documentIds: selectedDocumentIds.length ? selectedDocumentIds : undefined,
      data,
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: new Date().toISOString(),
    };

    const autoDocumentIds = syncAssetFileDocuments(rec, assetName || (legacyFields as any).name || "Asset");
    const combinedDocumentIds = Array.from(new Set([...selectedDocumentIds, ...autoDocumentIds]));
    rec.documentIds = combinedDocumentIds.length ? combinedDocumentIds : undefined;

    if (editingId) {
      const reg = assetRepository.load();
      assetRepository.save({
        assets: reg.assets.map((asset: any) => (asset.id === editingId ? rec : asset)),
      });
    } else {
      persistAdd(rec);
      sessionStorage.setItem("pam-last-created", rec.id);
    }

    syncDocumentAssetLinks(rec.id, combinedDocumentIds);
    load();
    resetForm();

    try {
      window.dispatchEvent(new CustomEvent("pam:toast", {
        detail: { message: wasEditing ? "Asset aangepast" : "Asset opgeslagen", tone: "success" },
      }));
    } catch {}
  }

  function startEdit(row: Row) {
    if (isFinalized(row)) {
      window.dispatchEvent(new CustomEvent("pam:toast", {
        detail: { message: "Dit asset is vastgelegd en kan niet meer worden aangepast.", tone: "warn" },
      }));
      return;
    }

    const resolved = resolveType(schema, row);
    const nextTypeId = resolved?.id || row.typeId || "";
    setEditingId(row.id);
    setTypeId(nextTypeId);
    setData(normalizeEditData(row, nextTypeId));
    setSelectedPersonIds(Array.from(new Set([row.personId, ...(row.personIds ?? [])].filter(Boolean) as string[])));
    setSelectedDocumentIds(documentIdsForRow(row));
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function finalizeAsset(id: string) {
    const row = assetRepository.load().assets.find((asset: any) => asset.id === id);
    if (!row || isFinalized(row as Row)) return;
    if (!confirm("Weet u zeker dat u dit asset wilt vastleggen? Daarna kan het niet meer worden aangepast.")) return;

    const now = new Date().toISOString();
    const next = assetRepository.load().assets.map((asset: any) =>
      asset.id === id
        ? { ...asset, status: "finalized", finalizedAt: now, updatedAt: now }
        : asset,
    );
    assetRepository.save({ assets: next });
    if (editingId === id) resetForm();
    load();
    window.dispatchEvent(new CustomEvent("pam:toast", {
      detail: { message: "Asset vastgelegd", tone: "success" },
    }));
  }

  function personNamesForRow(row: Row): string[] {
    const ids = Array.from(new Set([row.personId, ...(row.personIds ?? [])].filter(Boolean) as string[]));
    const names = ids
      .map((id) => people.find((person) => person.id === id)?.label)
      .filter(Boolean) as string[];
    if (!names.length && row.personName) return [row.personName];
    return names;
  }

  function renderPeople(row: Row) {
    const names = personNamesForRow(row);
    if (!names.length) return <span className="text-gray-400">—</span>;
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, minWidth: 160 }}>
        {names.map((name) => (
          <span
            key={name}
            className="ui-badge"
            style={{ background: "#eef5ff", borderColor: "#c7d8ee", color: "#0f2d4a" }}
          >
            {name}
          </span>
        ))}
      </div>
    );
  }

  function documentNamesForRow(row: Row): string[] {
    const ids = documentIdsForRow(row);
    return ids
      .map((id) => documents.find((document) => document.id === id)?.label)
      .filter(Boolean) as string[];
  }

  function documentIdsForRow(row: Row): string[] {
    const directIds = Array.isArray(row.documentIds) ? row.documentIds : [];
    const reverseIds = documents
      .filter((document) => Array.isArray(document.assetIds) && document.assetIds.map(String).includes(String(row.id)))
      .map((document) => document.id);
    return Array.from(new Set([...directIds, ...reverseIds].filter(Boolean)));
  }

  function renderDocuments(row: Row) {
    const names = documentNamesForRow(row);
    if (!names.length) return <span className="text-gray-400">—</span>;
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, minWidth: 170 }}>
        {names.slice(0, 2).map((name) => (
          <span
            key={name}
            className="ui-badge"
            style={{ background: "#F3F1EA", borderColor: "#DEDCD5", color: "#123052" }}
          >
            {name}
          </span>
        ))}
        {names.length > 2 && (
          <span
            className="ui-badge"
            style={{ background: "#F0F3EA", borderColor: "#C8D0B8", color: "#687348" }}
          >
            +{names.length - 2}
          </span>
        )}
      </div>
    );
  }

  function renderAssetDetails(row: Row) {
    const entries = detailEntriesForRow(schema, row, LABELS_FROM_SCHEMA);
    const typeLabel = resolveType(schema, row)?.label || row.typeLabel || row.type || "Onbekend type";
    const peopleNames = personNamesForRow(row);
    const documentNames = documentNamesForRow(row);

    return (
      <div
        style={{
          background: "#F3F1EA",
          border: "1px solid #DEDCD5",
          borderRadius: 14,
          padding: 18,
        }}
      >
        <div
          style={{
            alignItems: "flex-start",
            display: "flex",
            gap: 12,
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div>
            <strong style={{ color: "#123052", display: "block", fontSize: 18 }}>
              {row.name || "Asset zonder naam"}
            </strong>
            <span style={{ color: "#60718A", display: "block", marginTop: 3 }}>
              {typeLabel} · {isFinalized(row) ? "Vastgelegd" : "Concept"}
            </span>
          </div>
          <button className="ui-btn ui-btn--sm" onClick={() => setExpandedId(null)}>
            Sluiten
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          <DetailBlock label="Mensen" value={peopleNames.length ? peopleNames.join(", ") : "Geen mensen gekoppeld"} />
          <DetailBlock
            label="Documenten"
            value={documentNames.length ? documentNames.join(", ") : "Geen documenten gekoppeld"}
          />
          {row.createdAt && <DetailBlock label="Aangemaakt" value={formatMetaDate(row.createdAt)} />}
          {row.updatedAt && <DetailBlock label="Laatst aangepast" value={formatMetaDate(row.updatedAt)} />}
          {row.finalizedAt && <DetailBlock label="Vastgelegd op" value={formatMetaDate(row.finalizedAt)} />}
          {entries.map((entry) => (
            <DetailBlock key={entry.key} label={entry.label} value={entry.value} />
          ))}
        </div>

        {entries.length === 0 && (
          <p style={{ color: "#60718A", margin: "14px 0 0" }}>
            Er zijn nog geen extra velden ingevuld voor dit asset.
          </p>
        )}
      </div>
    );
  }

  function renderStatus(row: Row) {
    return isFinalized(row) ? (
      <span className="ui-badge ok">Vastgelegd</span>
    ) : (
      <span className="ui-badge">Concept</span>
    );
  }

  // Kolommen: toon kandidaten die voorkomen + altijd name/type + altijd Details
  const TABLE_KEYS: string[] = React.useMemo(() => {
    const present = new Set<string>();
    for (const r of rows) {
      for (const k of CANDIDATE_KEYS) {
        const val = valueFromRow(r, k);
        if (val !== "" && val !== undefined && val !== null) present.add(k);
      }
    }
    present.add("name");
    present.add("typeLabel");
    present.add(PSEUDO_STATUS);
    present.add(PSEUDO_PEOPLE);
    present.add(PSEUDO_DOCUMENTS);
    present.add(PSEUDO_DETAILS); // altijd samenvatting
    return Array.from(present);
  }, [rows, CANDIDATE_KEYS]);

  const colLabel = (key: string) =>
    LABELS_FROM_SCHEMA[key] ||
    (key === "name"
      ? "Naam"
      : key === "typeLabel"
        ? "Type"
        : key === PSEUDO_STATUS
          ? "Status"
          : key === PSEUDO_PEOPLE
            ? "Mensen"
            : key === PSEUDO_DOCUMENTS
              ? "Documenten"
              : key === PSEUDO_DETAILS
                ? "Details"
                : String(key));

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    const SEARCH_KEYS = Array.from(new Set([...TABLE_KEYS, "type", "notes", "brand", "model", "serial"]));

    let out = !needle
      ? rows
      : rows.filter((r) =>
          [
            ...SEARCH_KEYS
            .filter((k) => k !== PSEUDO_DETAILS) // details is afgeleid
            .map((k) => valueFromRow(r, k))
            .filter(Boolean),
            ...personNamesForRow(r),
            ...documentNamesForRow(r),
          ]
            .some((v) => String(v).toLowerCase().includes(needle))
        );

    out = [...out].sort((a, b) => {
      if ([PSEUDO_DETAILS, PSEUDO_PEOPLE, PSEUDO_DOCUMENTS, PSEUDO_STATUS].includes(sort.key)) return 0; // niet sorteren op afgeleide kolommen
      const A = valueFromRow(a, sort.key);
      const B = valueFromRow(b, sort.key);
      if (sort.key === "priceCents") {
        const nA = Number(A ?? 0);
        const nB = Number(B ?? 0);
        return sort.dir === "asc" ? nA - nB : nB - nA;
      }
      return cmp(A, B, sort.dir);
    });

    return out;
  }, [rows, q, sort, TABLE_KEYS, people, documents]);

  return (
    <div className="ui-page">
      <div className="ui-section-title">Asset register ({filtered.length})</div>

      {rows.length === 0 && !typeId && (
        <div style={{ marginBottom: 16 }}>
          <EmptyState
            title="Uw asset register is nog leeg"
            body="Het register wordt het overzicht waar alles samenkomt. Voeg een eerste asset toe, of gebruik de eenvoudige Assets-tab als u liever stap voor stap begint."
            actionLabel="Kies asset type"
            secondaryLabel="Naar eenvoudige invoer"
            onAction={() => document.querySelector<HTMLSelectElement>(".ui-input")?.focus()}
            onSecondary={() => openPamTab("assets")}
          />
        </div>
      )}

      {/* 🔹 NIEUW: Invoerblok */}
      <div className="ui-card p-4 rounded-2xl border shadow-sm mb-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Asset type</label>
            <select className="ui-input w-full" value={typeId} onChange={(e) => { setTypeId(e.target.value); setErrors({}); setData({}); }}>
              <option value="">— kies asset type —</option>
              {schema.types.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          {typeDef && (
            <div className="md:col-span-2">
              <div className="text-sm text-gray-600 mb-2">
                {editingId ? "Asset aanpassen" : "Velden voor"}: <strong>{typeDef.label}</strong>
              </div>
              <DynamicFieldsFormInline fields={typeDef.fields} value={data} errors={errors} onChange={setData} />

              <div className="ui-form-grid" style={{ marginTop: 16 }}>
                <div className="span-2 ui-field" aria-describedby="asset-register-people-tip">
                  <label htmlFor="asset-register-people">
                    Koppel mensen (optie){" "}
                    {selectedPersonIds.length > 0 && (
                      <span className="ui-count-badge">{selectedPersonIds.length} geselecteerd</span>
                    )}
                  </label>
                  <div
                    id="asset-register-people"
                    style={{
                      display: "grid",
                      gap: 8,
                      maxHeight: 170,
                      overflow: "auto",
                      border: "1px solid #d8e0ea",
                      borderRadius: 12,
                      padding: 10,
                      background: "#fff",
                    }}
                  >
                    {people.map((person) => (
                      <label key={person.id} style={{ display: "flex", gap: 8, alignItems: "center", margin: 0 }}>
                        <input
                          type="checkbox"
                          style={{ width: "auto" }}
                          checked={selectedPersonIds.includes(person.id)}
                          onChange={() => setSelectedPersonIds((ids) => toggleId(ids, person.id))}
                        />
                        <span>{person.label}</span>
                      </label>
                    ))}
                    {people.length === 0 && <small>Geen mensen beschikbaar.</small>}
                  </div>
                  <small id="asset-register-people-tip" className="ui-tip">
                    {people.length
                      ? "Vink één of meer mensen aan die bij dit asset horen."
                      : "Er zijn nog geen mensen om aan dit asset te koppelen."}
                  </small>
                </div>

                <div className="span-2 ui-field" aria-describedby="asset-register-docs-tip">
                  <label htmlFor="asset-register-docs">
                    Koppel documenten (optie){" "}
                    {selectedDocumentIds.length > 0 && (
                      <span className="ui-count-badge">{selectedDocumentIds.length} geselecteerd</span>
                    )}
                  </label>
                  <div
                    id="asset-register-docs"
                    style={{
                      display: "grid",
                      gap: 8,
                      maxHeight: 170,
                      overflow: "auto",
                      border: "1px solid #d8e0ea",
                      borderRadius: 12,
                      padding: 10,
                      background: "#fff",
                    }}
                  >
                    {documents.map((document) => (
                      <label key={document.id} style={{ display: "flex", gap: 8, alignItems: "center", margin: 0 }}>
                        <input
                          type="checkbox"
                          style={{ width: "auto" }}
                          checked={selectedDocumentIds.includes(document.id)}
                          onChange={() => setSelectedDocumentIds((ids) => toggleId(ids, document.id))}
                        />
                        <span>{document.label}</span>
                      </label>
                    ))}
                    {documents.length === 0 && <small>Geen documenten beschikbaar.</small>}
                  </div>
                  <small id="asset-register-docs-tip" className="ui-tip">
                    {documents.length
                      ? "Vink één of meer documenten aan die bij dit asset horen."
                      : "Er zijn nog geen documenten om aan dit asset te koppelen."}
                  </small>
                </div>
              </div>

              <div className="mt-3 flex justify-end gap-2">
                <button className="ui-btn" onClick={resetForm}>Annuleren</button>
                <button className="ui-btn ui-btn--primary" onClick={saveAsset}>
                  {editingId ? "Wijzigingen opslaan" : "Opslaan"}
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
                  onClick={() =>
                    ![PSEUDO_DETAILS, PSEUDO_PEOPLE, PSEUDO_DOCUMENTS, PSEUDO_STATUS].includes(k) && toggleSort(k)
                  }
                >
                  {colLabel(k)}
                </th>
              ))}
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <React.Fragment key={r.id}>
                <tr
                  className={r.id === highlightId ? "ui-row-highlight" : ""}
                  onClick={() => setExpandedId((current) => (current === r.id ? null : r.id))}
                  style={{ cursor: "pointer" }}
                  title="Klik om alle gegevens te bekijken"
                >
                  {TABLE_KEYS.map((k) => {
                    if (k === PSEUDO_STATUS) {
                      return <td key={k}>{renderStatus(r)}</td>;
                    }

                    if (k === PSEUDO_PEOPLE) {
                      return <td key={k}>{renderPeople(r)}</td>;
                    }

                    if (k === PSEUDO_DOCUMENTS) {
                      return <td key={k}>{renderDocuments(r)}</td>;
                    }

                    if (k === PSEUDO_DETAILS) {
                      return <td key={k}>{summarizeRow(schema, r, LABELS_FROM_SCHEMA)}</td>;
                    }

                    const rawVal = valueFromRow(r, k);
                    let cell = rawVal ?? "";
                    const fieldType = fieldTypeForKey(schema, k);

                    if (k === "priceCents") cell = formatPrice(rawVal);
                    if (fieldType === "currency") cell = formatDetailValue(rawVal, fieldType, k);
                    if (rawVal && typeof rawVal === "object" && rawVal.name && rawVal.size) {
                      cell = `${rawVal.name} (${Math.round(rawVal.size / 1024)} kB)`;
                    }

                    return <td key={String(k)}>{cell}</td>;
                  })}
                  <td onClick={(event) => event.stopPropagation()}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minWidth: 220 }}>
                      <button
                        className="ui-btn ui-btn--sm"
                        disabled={isFinalized(r)}
                        onClick={() => startEdit(r)}
                      >
                        Aanpassen
                      </button>
                      <button
                        className="ui-btn ui-btn--sm ui-btn--primary"
                        disabled={isFinalized(r)}
                        onClick={() => finalizeAsset(r.id)}
                      >
                        {isFinalized(r) ? "Vastgelegd" : "Vastleggen"}
                      </button>
                      <button
                        className="ui-btn ui-btn--sm ui-btn--danger"
                        onClick={() => handleDelete(r.id)}
                      >
                        Verwijderen
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedId === r.id && (
                  <tr>
                    <td colSpan={TABLE_KEYS.length + 1} style={{ background: "#FCFBF8", padding: 14 }}>
                      {renderAssetDetails(r)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={TABLE_KEYS.length + 1}>
                  <em>
                    {rows.length === 0
                      ? "Nog geen assets vastgelegd."
                      : "Geen assets gevonden binnen deze zoekopdracht."}
                  </em>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
