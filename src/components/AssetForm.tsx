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

    const newAsset: Asset = {
      id,
      assetNumber,
      name,
      type: code,
      category: code,
      typeCode: code as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: { ...formData, __docIds: docIds },
      ...(personId ? { personIds: [personId] } : {}),
    };

    // Schrijf naar register
    const reg = loadRegister();
    const nextAssets = [...reg.assets, newAsset];
    saveRegister({ assets: nextAssets });

    try {
      localStorage.setItem("pam-assets-tick", String(Date.now()));
      window.dispatchEvent(new CustomEvent("pam-assets-updated"));
    } catch {}

    // Koppelingen (best-effort)
    try {
      if (personId) linkPersonToAsset(newAsset.assetNumber, personId);
      if (docIds?.length) for (const d of docIds) linkDocToAsset(d, newAsset.assetNumber);
    } catch (err) {
      console.warn("linking error:", err);
    }

    onCreated?.(newAsset);
    setName(""); setFormData({}); setPersonId(""); setDocIds([]);
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

      {/* Bovenste velden (zelfde methodiek: label links, veld rechts) */}
      <div className="field">
        <label htmlFor="assetName" className="text-sm font-medium">Assetnaam / Benoeming *</label>
        <input
          id="assetName"
          className="border rounded px-2 py-1 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Bijv. MacBook Pro 14”"
        />
      </div>

      <div className="field">
        <label htmlFor="typeCode" className="text-sm font-medium">Assettype *</label>
        <select
          id="typeCode"
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
      <div className="field">
        <label htmlFor="person" className="text-sm font-medium">Koppel aan persoon (optioneel)</label>
        <select
          id="person"
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
      <div className="field">
        <label htmlFor="docs" className="text-sm font-medium">Koppel documenten (optioneel)</label>
        <select
          id="docs"
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
      </div>
      <p className="text-xs text-gray-500 tip">Tip: houd ⌘/Ctrl ingedrukt om meerdere documenten te selecteren.</p>

      {/* Verplicht */}
      <fieldset className="border rounded p-3">
        <legend className="text-sm font-semibold">Verplicht</legend>
        <div className="space-y-2">
          {schema.required.map((f: any) => (
            <div className="field" key={f.key}>
              <label htmlFor={f.key} className="text-sm">{f.label} *</label>
              {renderField(f)}
            </div>
          ))}
        </div>
      </fieldset>

      {/* Optioneel —zelfde methodologie als Verplicht */}
      <fieldset className="border rounded p-3">
        <legend className="text-sm font-semibold">Optioneel</legend>
        <div className="space-y-2">
          {schema.optional.map((f: any) => (
            <div className="field" key={f.key}>
              <label htmlFor={f.key} className="text-sm">{f.label}</label>
              {renderField(f)}
            </div>
          ))}
        </div>
      </fieldset>

      <button type="submit" className="border rounded px-4 py-2 font-medium">
        Opslaan in register
      </button>
    </form>
  );
}
