import React, { useMemo, useState } from "react";
import { ASSET_SCHEMAS, SCHEMA_BY_CODE } from "../assetSchemas";
import type  { Asset} from "../types";
import { nextAssetNumber, loadRegister, saveRegister } from "../lib/assetNumber";
import { v4 as uuid } from "uuid";

const ASSET_PREFIX = "PAM-ITM";
          

type Props = { onCreated?: (asset: Asset) => void };

export default function AssetForm({ onCreated }: Props) {
  const [name, setName] = useState("");
  const [typeCode, setTypeCode] = useState(ASSET_SCHEMAS[0]?.code ?? "");
  const schema = useMemo(() => SCHEMA_BY_CODE[typeCode], [typeCode]);
  const [formData, setFormData] = useState<Record<string, any>>({});
const id = (typeof crypto !== "undefined" && crypto.randomUUID)
  ? crypto.randomUUID()
  : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  function setField(key: string, value: any) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  function validate(): string[] {
    const errors: string[] = [];
    if (!name.trim()) errors.push("Naam (benoeming) is verplicht.");
    if (!schema) errors.push("Ongeldig assettype.");
    schema?.required.forEach(f => {
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

  function persist(asset: Asset) {
    const reg = loadRegister();
    reg.assets.push(asset);
    saveRegister(reg.assets);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate();
    if (errors.length) { alert(errors.join("\n")); return; }

const code = schema?.code ?? "GEN";
    const prefix = code.startsWith("PAM-") ? code : `${ASSET_PREFIX}-${code}`;

    const asset: Asset = {
  id,
  assetNumber: nextAssetNumber(prefix),
  name,
type: code,
  category: code,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  data: formData,
    };
    persist(asset);
    onCreated?.(asset);
    setName("");
    setFormData({});
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
      case "textarea":
        return <textarea {...common} rows={4} />;
      case "select":
        return (
          <select {...common}>
            <option value="">— kies —</option>
            {(f.options ?? []).map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case "number":
        return <input type="number" {...common} />;
      case "currency":
        return <input type="number" step="0.01" {...common} />;
      case "date":
        return <input type="date" {...common} />;
      case "checkbox":
        return <input type="checkbox" checked={!!(formData[f.key])} onChange={common.onChange} />;
      case "password":
        return <input type="password" {...common} />;
      case "url":
        return <input type="url" {...common} />;
      default:
        return <input type="text" {...common} />;
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
