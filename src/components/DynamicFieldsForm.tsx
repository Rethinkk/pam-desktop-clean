// src/components/DynamicFieldsForm.tsx
/* @ts-nocheck */
import React from "react";
import type { AssetFieldDefinition } from "../config/assetSchema";

type Props = {
  fields: AssetFieldDefinition[];
  value: Record<string, any>;
  errors?: Record<string, string>;
  onChange: (next: Record<string, any>) => void;
};

export default function DynamicFieldsForm({ fields, value, errors = {}, onChange }: Props) {
  function upd(key: string, v: any) {
    onChange({ ...value, [key]: v });
  }

  async function handleFileChange(key: string, file?: File | null) {
    if (!file) {
      upd(key, undefined);
      return;
    }
    // NB: LocalStorage kan geen binaries; we bewaren klein base64-voorbeeld.
    // Voor échte bijlages -> Documenten-module of IndexedDB.
    const toDataURL = (f: File) =>
      new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.onerror = rej;
        r.readAsDataURL(f);
      });

    const dataUrl = await toDataURL(file);
    upd(key, { name: file.name, size: file.size, type: file.type, dataUrl });
  }

  return (
    <div className="ui-stack">
      {fields.map((f) => {
        const err = errors[f.key];
        const commonLabel = (
          <label className="block text-sm font-medium mb-1">
            {f.label}{f.required && <span className="text-red-500"> *</span>}
          </label>
        );

        return (
          <div key={f.key} className={`ui-card p-4 rounded-2xl shadow-sm border ${err ? "border-red-300" : ""}`}>
            {commonLabel}

            {/* Tekst/Email/URL/Telefoon */}
            {(f.type === "text" || f.type === "email" || f.type === "url" || f.type === "phone") && (
              <input
                className="ui-input w-full"
                type={f.type === "email" ? "email" : f.type === "url" ? "url" : f.type === "phone" ? "tel" : "text"}
                placeholder={f.placeholder}
                value={value[f.key] ?? ""}
                onChange={(e) => upd(f.key, e.target.value)}
              />
            )}

            {/* Tekst area */}
            {f.type === "textarea" && (
              <textarea
                className="ui-input w-full"
                rows={3}
                placeholder={f.placeholder}
                value={value[f.key] ?? ""}
                onChange={(e) => upd(f.key, e.target.value)}
              />
            )}

            {/* Getallen & Valuta */}
            {(f.type === "number" || f.type === "currency") && (
              <input
                className="ui-input w-full"
                type="number"
                step={f.type === "currency" ? "0.01" : "1"}
                placeholder={f.type === "currency" ? "0,00" : undefined}
                value={value[f.key] ?? ""}
                onChange={(e) => upd(f.key, e.target.value === "" ? "" : Number(e.target.value))}
              />
            )}

            {/* Datum */}
            {f.type === "date" && (
              <input
                className="ui-input w-full"
                type="date"
                value={value[f.key] ?? ""}
                onChange={(e) => upd(f.key, e.target.value)}
              />
            )}

            {/* Select */}
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

            {/* Bestand */}
            {f.type === "file" && (
              <>
                <input
                  className="ui-input w-full"
                  type="file"
                  onChange={(e) => handleFileChange(f.key, e.target.files?.[0] ?? null)}
                />
                {value[f.key]?.name && (
                  <div className="mt-2 text-xs text-gray-600">
                    Gekozen: <strong>{value[f.key].name}</strong> ({Math.round((value[f.key].size || 0) / 1024)} kB)
                    <button className="ml-2 underline" onClick={() => upd(f.key, undefined)}>verwijderen</button>
                  </div>
                )}
              </>
            )}

            {/* Boolean */}
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

            {/* Hints & fouten */}
            {f.hint && <p className="text-xs text-gray-500 mt-1">{f.hint}</p>}
            {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
          </div>
        );
      })}
    </div>
  );
}
