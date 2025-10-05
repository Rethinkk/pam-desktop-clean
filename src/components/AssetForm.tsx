/* @ts-nocheck */
import React from "react";
import {
  loadAssetSchema,
  getAssetType,
  validateAsset,
  type AssetFieldDefinition,
} from "../config/assetSchema";

type Asset = {
  id?: string;
  typeId: string;                 // moet matchen met schema.types[].id
  data: Record<string, any>;      // veldwaarden per key
};

type Props = {
  value: Asset;                    // huidig asset (bijv. uit parent state)
  onChange: (next: Asset) => void; // bubbelt wijzigingen omhoog
  onSubmit: (asset: Asset) => void;// opslaan
};

export default function AssetForm({ value, onChange, onSubmit }: Props) {
  const schema = React.useMemo(() => loadAssetSchema(), []);
  const typeDef = React.useMemo(
    () => getAssetType(schema, value.typeId),
    [schema, value.typeId]
  );

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // ⬇️ Plaats dit direct hier
React.useEffect(() => {
  const next = validateAsset(schema, value.typeId, value.data);
  setErrors(next);
}, [schema, value.typeId, value.data]);

  const setField = (key: string, v: any) =>
    onChange({ ...value, data: { ...value.data, [key]: v } });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateAsset(schema, value.typeId, value.data);
    setErrors(errs);
    if (Object.keys(errs).length === 0) onSubmit(value);
  };

  return (
    <form className="asset-form" onSubmit={handleSubmit}>
      {/* Type selector */}
      <label className="field">
        <span>Type</span>
        <select
          value={value.typeId}
          onChange={(e) =>
            onChange({ ...value, typeId: e.target.value, data: {} })
          }
        >
          {schema.types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      {/* Dynamische velden */}
      {typeDef?.fields.map((f) => (
        <FieldInput
          key={f.key}
          def={f}
          value={value.data?.[f.key]}
          error={errors[f.key]}
          onChange={(v) => setField(f.key, v)}
        />
      ))}

      {/* Form status */}
      {errors["_type"] && <div className="error">{errors["_type"]}</div>}

      <div className="actions">
        <button type="submit" disabled={!!errors["_type"]}>
          Opslaan
        </button>
      </div>
    </form>
  );
}

/** Kleine input-renderer op basis van AssetFieldDefinition */
function FieldInput({
  def,
  value,
  error,
  onChange,
}: {
  def: AssetFieldDefinition;
  value: any;
  error?: string;
  onChange: (v: any) => void;
}) {
  const id = `fld-${def.key}`;

  const input =
    def.type === "select" ? (
      <select id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">— kies —</option>
        {def.options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    ) : def.type === "textarea" ? (
      <textarea id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    ) : def.type === "file" ? (
      <input id={id} type="file" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
    ) : def.type === "boolean" ? (
      <input id={id} type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
    ) : (
      <input
        id={id}
        type={
          def.type === "number"
            ? "number"
            : def.type === "date"
            ? "date"
            : def.type === "email"
            ? "email"
            : def.type === "url"
            ? "url"
            : def.type === "phone"
            ? "tel"
            : "text"
        }
        value={value ?? ""}
        placeholder={def.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    );

  return (
    <label htmlFor={id} className={`field ${error ? "has-error" : ""}`}>
      <span className="label">
        {def.label}
        {def.required && <span className="req">*</span>}
      </span>
      {input}
      {def.hint && <small className="hint">{def.hint}</small>}
      {error && <div className="error">{error}</div>}
    </label>
  );
}

