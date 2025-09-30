/* @ts-nocheck */
import React, { useMemo, useState } from "react";
import { allPeople } from "../lib/peopleStore";
import { ASSET_SCHEMAS, SCHEMA_BY_CODE } from "../assetSchemas";
import type { Asset } from "../types";
import { linkPersonToAsset, loadRegister, saveRegister, nextAssetNumber } from "../lib/assetNumber";
import { linkDocToAsset } from "../lib/docsStore";
import { nanoid } from "nanoid";

const ASSET_PREFIX = "PAM-ITM";

type Props = { onCreated?: (asset: Asset) => void };

// Docs uit localStorage voor de dropdown
const getDocs = () => {
  try {
    const raw = localStorage.getItem("pam-docs-v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const docs = Array.isArray(parsed?.docs) ? parsed.docs : (Array.isArray(parsed) ? parsed : []);
    return docs.filter((d: any) => d && d.id);
  } catch { return []; }
};

export default function AssetForm({ onCreated }: Props) {
  const [name, setName] = useState("");
  const [typeCode, setTypeCode] = useState(ASSET_SCHEMAS[0]?.code ?? "");
  const schema = useMemo(() => SCHEMA_BY_CODE[typeCode], [typeCode]);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // uniek id
  const id = (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  // Koppelingen
  const people = useMemo(() => allPeople?.() ?? [], []);
  const docs = useMemo(() => getDocs(), []);
  const [personId, setPersonId] = useState<string>("");
  const [docIds, setDocIds] = useState<string[]>([]);

  function setField(key: string, value: any) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }
  function onChangeDocs(e: React.ChangeEvent<HTMLSelectElement>) {
    const values = Array.from(e.target.selectedOptions).map((o) => o.value);
    setDocIds(values);
  }

  function validate(): string[] {
    const errors: string[] = [];
    if (!name.trim()) errors.push("Naam (benoeming) is verplicht.");
    if (!schema) errors.push("Ongeldig assettype.");
    schema?.required.forEach((f: any) => {
      const v = formData[f.key];
      if (f.kind === "checkbox") {
        if (v !== true) errors.push(`${f.label} is verplicht.`);
      } else {
        const empty = v === undefined || v === null || v === "";
        if (empty) errors.push(`${f.label} is verplicht.`);
      }
    });
    return errors;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate();
    if (errors.length) { alert(errors.join("\n")); return; }

    const code = schema?.code ?? "GEN";
    const date = new Date();
    const yyyymmdd = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,"0")}${String(date.getDate()).padStart(2,"0")}`;

    // Nummering: kies jouw bestaande of de helper
    const assetNumber = `${ASSET_PREFIX}-${code}-${yyyymmdd}-${String(date.getTime()).slice(-4)}`;
    // of gebruik centraal oplopend:
    // const assetNumber = nextAssetNumber(ASSET_PREFIX);

    // 👇 replace your current newAsset object with this:
const newAsset: Asset = {
  id,
  assetNumber,
  name,
  // keep your own fields
  type: code,
  category: code,
  // ✅ add this field to satisfy Asset.type requirements
  typeCode: code as any, // if your Asset.typeCode is typed oddly (ReactNode), ts-nocheck will allow this

  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),

  // your form payload + linked docs
  data: { ...formData, __docIds: docIds },

  // ✅ store people as an array per your model
  ...(personId ? { personIds: [personId] } : {}),
};


    // Schrijf naar het centrale register
    const reg = loadRegister();                    // { assets: Asset[] }
    const nextAssets = [...reg.assets, newAsset];
    saveRegister({ assets: nextAssets });          // dispatcht 'pam-assets-updated'

    // (optioneel) extra tik voor andere listeners
    try {
      localStorage.setItem("pam-assets-tick", String(Date.now()));
      window.dispatchEvent(new CustomEvent("pam-assets-updated"));
    } catch {}

    // Koppelingen (best-effort, niet blocking)
    try {
      if (personId) {
        // let op: (assetNumber, personId)
        linkPersonToAsset(newAsset.assetNumber, personId);
      }
      if (docIds && docIds.length) {
        for (const d of docIds) {
          // docs: (docId, assetNumber)
          linkDocToAsset(d, newAsset.assetNumber);
        }
      }
    } catch (err) {
      console.warn("linking error:", err);
    }

    // callback + reset
    onCreated?.(newAsset);
    setName("");
    setFormData({});
    setPersonId("");
    setDocIds([]);
  }

  function renderField(f: any) {
    const common: any = {
      id: f.key,
      name: f.key,
      value: formData[f.key] ?? (f.kind === "checkbox" ? false : ""),
      onChange: (e: any) =>
        setField(f.key, f.kind === "checkbox" ? e.target.checked : e.target.value),
      placeholder: f.placeholder ?? "",
      className: "border rounded px-2 py-1 w-full",
    };

    switch (f.kind) {
      case "textarea":  return <textarea {...common} rows={4} />;
      case "select":    return (
        <select {...common}>
          <option value="">— kies —</option>
          {(f.options ?? []).map((opt: string) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
      case "number":    return <input type="number" {...common} />;
      case "currency":  return <input type="number" step="0.01" {...common} />;
      case "date":      return <input type="date" {...common} />;
      case "checkbox":  return <input type="checkbox" checked={!!(formData[f.key])} onChange={common.onChange} />;
      case "password":  return <input type="password" {...common} />;
      case "url":       return <input type="url" {...common} />;
      default:          return <input type="text" {...common} />;
    }
  }

  if (!schema) return <div>Geen assettype beschikbaar.</div>;

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-2xl">
      <div>
        <label className="block text-sm font-medium mb-1">Assetnaam / Benoeming *</label>
        <input
          className="border rounded px-2 py-1 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Bijv. MacBook Pro 14”"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Assettype *</label>
        <select
          className="border rounded px-2 py-1 w-full"
          value={typeCode}
          onChange={(e) => setTypeCode(e.target.value)}
        >
          {ASSET_SCHEMAS.map(s => (
            <option key={s.code} value={s.code}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Persoon */}
      <div>
        <label className="block text-sm font-medium mb-1">Koppel aan persoon (optioneel)</label>
        <select
          className="border rounded px-2 py-1 w-full"
          value={personId}
          onChange={(e) => setPersonId(e.target.value)}
        >
          <option value="">— Geen —</option>
          {people.map((p: any) => (
            <option key={p.id} value={p.id}>{p.fullName || p.name || p.id}</option>
          ))}
        </select>
      </div>

      {/* Documenten */}
      <div>
        <label className="block text-sm font-medium mb-1">Koppel documenten (optioneel)</label>
        <select
          multiple
          className="border rounded px-2 py-1 w-full h-36"
          value={docIds}
          onChange={onChangeDocs}
        >
          {docs.length === 0 && <option disabled>— Geen documenten gevonden —</option>}
          {docs.map((d: any) => {
            const label = d.title || d.name || d.fileName || d.filename || d.id;
            return <option key={d.id} value={d.id}>{label}</option>;
          })}
        </select>
        <p className="text-xs text-gray-500 mt-1">Tip: houd ⌘/Ctrl ingedrukt om meerdere documenten te selecteren.</p>
      </div>

      <fieldset className="border rounded p-3">
        <legend className="text-sm font-semibold">Verplicht</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {schema.required.map((f: any) => (
            <label key={f.key} className="text-sm">
              <span className="block mb-1">{f.label} *</span>
              {renderField(f)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="border rounded p-3">
        <legend className="text-sm font-semibold">Optioneel</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {schema.optional.map((f: any) => (
            <label key={f.key} className="text-sm">
              <span className="block mb-1">{f.label}</span>
              {renderField(f)}
            </label>
          ))}
        </div>
      </fieldset>

      <button type="submit" className="border rounded px-4 py-2 font-medium">
        Opslaan in register
      </button>
    </form>
  );
}
