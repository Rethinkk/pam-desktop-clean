/* @ts-nocheck */
import React from "react";
import { ASSET_TYPES, ASSET_SCHEMAS } from "../config/assetTypes";

// Stabiel type-ID + label
type AssetTypeId = (typeof ASSET_TYPES)[number]["id"];

type FormState = {
  name: string;
  typeId: AssetTypeId | "";
  typeLabel: string;        // afgeleid uit select
  personId: string;
  documentIds: string[];
  serial: string;
  brand: string;
  model: string;
  purchaseDate: string;     // yyyy-mm-dd
  warrantyUntil: string;    // yyyy-mm-dd
  priceRaw: string;         // user input/mask
  priceCents: number;       // numeric for storage
  notes: string;
};

const ASSETS_KEY = "pam-assets-v1";
const PEOPLE_KEY = "pam-people-v1";
const DOCS_KEY   = "pam-docs-v1";

export default function AssetsPanel() {
  const [form, setForm] = React.useState<FormState>({
    name: "",
    typeId: "",
    typeLabel: "",
    personId: "",
    documentIds: [],
    serial: "",
    brand: "",
    model: "",
    purchaseDate: "",
    warrantyUntil: "",
    priceRaw: "",
    priceCents: 0,
    notes: "",
  });

  const [docCount, setDocCount] = React.useState<number>(0);
  const [people, setPeople] = React.useState<Array<{ id: string; name: string }>>([]);
  const [docs, setDocs]     = React.useState<Array<{ id: string; title: string }>>([]);

  // Personen + documenten laden voor selecties
  React.useEffect(() => {
    try {
      const rawP = localStorage.getItem(PEOPLE_KEY);
      if (rawP) {
        const parsed = JSON.parse(rawP);
        const arr = Array.isArray(parsed?.people) ? parsed.people : Array.isArray(parsed) ? parsed : [];
        setPeople(arr.map((p: any) => ({ id: p.id, name: p.fullName ?? p.name ?? "" })).filter((p: { id: any; name: any; }) => p.id && p.name));
      }
    } catch {}
    try {
      const rawD = localStorage.getItem(DOCS_KEY);
      if (rawD) {
        const parsed = JSON.parse(rawD);
        const arr = Array.isArray(parsed?.docs) ? parsed.docs : Array.isArray(parsed) ? parsed : [];
        setDocs(arr.map((d: any) => ({ id: d.id, title: d.title ?? d.name ?? "" })).filter((d: { id: any; title: any; }) => d.id && d.title));
      }
    } catch {}
  }, []);

  function onChange<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((s) => ({ ...s, [key]: val }));
  }

  // --- helpers
  function handleTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value as AssetTypeId | "";
    const rec = ASSET_TYPES.find((t) => t.id === id);
    onChange("typeId", id);
    onChange("typeLabel", rec?.label ?? "");
  }

  function handleSerial(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.toUpperCase().trim();
    onChange("serial", v);
  }

  function handlePrice(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/[^\d,.\s]/g, "").replace(/\s+/g, "");
    onChange("priceRaw", v);
    const normalized = v.replace(/\./g, "").replace(",", ".");
    const num = Number.parseFloat(normalized);
    onChange("priceCents", Number.isFinite(num) ? Math.round(num * 100) : 0);
  }

  function formatPriceForDisplay() {
    const euros = form.priceCents / 100;
    if (!euros) return form.priceRaw || "";
    try {
      return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(euros);
    } catch {
      return `€ ${euros.toFixed(2)}`;
    }
  }

  function handlePriceBlur() {
    if (form.priceCents > 0) {
      onChange("priceRaw", formatPriceForDisplay());
    }
  }

  function handleDocsChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
    onChange("documentIds", selected);
    setDocCount(selected.length);
  }

  /** Weergavenaam gekoppelde persoon (voor register) */
  function resolvePersonName(personId: string): string | undefined {
    try {
      const raw = localStorage.getItem(PEOPLE_KEY);
      if (!raw) return undefined;
      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed?.people) ? parsed.people : Array.isArray(parsed) ? parsed : [];
      const hit = arr.find((p: any) => p.id === personId);
      const name = hit?.fullName ?? hit?.name;
      return name ? String(name) : undefined;
    } catch {
      return undefined;
    }
  }

  // --- schema-koppeling via stabiele id
  const schema = form.typeId ? ASSET_SCHEMAS[form.typeId] : { fields: [] };
  const requiredKeys: string[] = schema.fields.filter((f: any) => f.required).map((f: any) => f.key);

  function isFieldSatisfied(key: string): boolean {
    const v = (form as any)[key];
    switch (key) {
      case "priceCents":
        return Number.isFinite(v) && v > 0;
      default:
        return v !== undefined && v !== null && String(v).trim().length > 0;
    }
  }

  const requiredOK =
    form.name.trim().length > 1 &&
    !!form.typeId &&
    requiredKeys.every((k) => isFieldSatisfied(k));

  // --- opslaan
  function save(): void {
    if (!requiredOK) return;

    const id =
      (globalThis as any).crypto?.randomUUID?.() ??
      `a_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

    const personName = form.personId ? resolvePersonName(form.personId) : undefined;

    // 🔐 Compatibele opslag:
    //  - plat: voor legacy lezers
    //  - data:   mirror voor nieuwere lezers
    //  - typeId + typeLabel: stabiel + toonbaar
    const asset = {
      id,
      name: form.name.trim(),
      typeId: form.typeId || undefined,
      typeLabel: form.typeLabel || undefined,

      // plat
      serial: form.serial.trim() || undefined,
      brand: form.brand.trim() || undefined,
      model: form.model.trim() || undefined,
      purchaseDate: form.purchaseDate || undefined,
      warrantyUntil: form.warrantyUntil || undefined,
      priceCents: form.priceCents > 0 ? form.priceCents : undefined,
      personId: form.personId || undefined,
      personName,
      documentIds: form.documentIds?.length ? form.documentIds : undefined,
      notes: form.notes.trim() || undefined,

      // mirror (nieuw)
      data: {
        serial: form.serial.trim() || undefined,
        brand: form.brand.trim() || undefined,
        model: form.model.trim() || undefined,
        purchaseDate: form.purchaseDate || undefined,
        warrantyUntil: form.warrantyUntil || undefined,
        priceCents: form.priceCents > 0 ? form.priceCents : undefined,
        notes: form.notes.trim() || undefined,
      },

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const raw = localStorage.getItem(ASSETS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;

      let out: any;
      if (parsed && Array.isArray(parsed.assets)) {
        out = { ...parsed, assets: [...parsed.assets, asset] };
      } else if (Array.isArray(parsed)) {
        out = [...parsed, asset];
      } else if (parsed && Array.isArray(parsed.rows)) {
        out = { ...parsed, rows: [...parsed.rows, asset] };
      } else {
        // voorkeursvorm
        out = { assets: [asset] };
      }

      localStorage.setItem(ASSETS_KEY, JSON.stringify(out));

      try {
        window.dispatchEvent(new CustomEvent("pam:toast", { detail: { message: "Asset opgeslagen", type: "success" } }));
      } catch {}

      try { sessionStorage.setItem("pam-last-created", id); } catch {}

      // reset
      setForm({
        name: "",
        typeId: "",
        typeLabel: "",
        personId: "",
        documentIds: [],
        serial: "",
        brand: "",
        model: "",
        purchaseDate: "",
        warrantyUntil: "",
        priceRaw: "",
        priceCents: 0,
        notes: "",
      });
      setDocCount(0);
    } catch (err) {
      console.error("Asset opslaan faalde:", err);
      alert("Opslaan is mislukt. Probeer het opnieuw.");
    }
  }

  // --- UI helpers
  function labelFor(key: string) {
    const def = schema.fields.find((f: any) => f.key === key);
    return def?.label ?? key;
  }

  function renderRequiredField(key: string) {
    switch (key) {
      case "serial":
        return (
          <>
            <label htmlFor="serial">{labelFor("serial")} *</label>
            <input id="serial" placeholder="SN-…" value={form.serial} onChange={handleSerial} />
          </>
        );
      case "purchaseDate":
        return (
          <>
            <label htmlFor="purchaseDate" style={{ marginTop: 12 }}>{labelFor("purchaseDate")} *</label>
            <input
              id="purchaseDate"
              type="date"
              value={form.purchaseDate}
              onChange={(e) => onChange("purchaseDate", e.target.value)}
              placeholder="dd/mm/jjjj"
            />
          </>
        );
      case "priceCents":
        return (
          <>
            <label htmlFor="price" style={{ marginTop: 12 }}>{labelFor("priceCents")} *</label>
            <input
              id="price"
              inputMode="decimal"
              value={form.priceRaw}
              onChange={handlePrice}
              onBlur={handlePriceBlur}
              placeholder="€ 0,00"
            />
          </>
        );
      default:
        return (
          <>
            <label htmlFor={`req-${key}`}>{labelFor(key)} *</label>
            <input id={`req-${key}`} value={(form as any)[key] ?? ""} onChange={(e) => onChange(key as any, e.target.value)} />
          </>
        );
    }
  }

  function renderOptionalField(key: string) {
    switch (key) {
      case "brand":
      case "model":
      case "notes":
        return (
          <>
            <label htmlFor={key} style={{ marginTop: key === "brand" ? 0 : 12 }}>{labelFor(key)}</label>
            {key === "notes" ? (
              <textarea id="notes" rows={5} value={form.notes} onChange={(e) => onChange("notes", e.target.value)} />
            ) : (
              <input id={key} value={(form as any)[key] ?? ""} onChange={(e) => onChange(key as any, e.target.value)} />
            )}
          </>
        );
      case "warrantyUntil":
        return (
          <>
            <label htmlFor="warrantyUntil" style={{ marginTop: 12 }}>{labelFor("warrantyUntil")}</label>
            <input
              id="warrantyUntil"
              type="date"
              value={form.warrantyUntil}
              onChange={(e) => onChange("warrantyUntil", e.target.value)}
              placeholder="dd/mm/jjjj"
            />
          </>
        );
      case "purchaseDate":
      case "priceCents":
      case "serial":
        // optioneel: render zonder ster
        return renderRequiredField(key).props
          ? React.cloneElement(<div />, {}, renderRequiredField(key).props.children?.map?.((c: any) =>
              c?.type === "label"
                ? React.cloneElement(c, {}, labelFor(key))
                : c
            ) ?? renderRequiredField(key))
          : null;
      default:
        return (
          <>
            <label htmlFor={`opt-${key}`}>{labelFor(key)}</label>
            <input id={`opt-${key}`} value={(form as any)[key] ?? ""} onChange={(e) => onChange(key as any, e.target.value)} />
          </>
        );
    }
  }

  // sets vanuit schema (excl. name/type die hierboven staan)
  const requiredFieldKeys = schema.fields
    .filter((f: any) => f.required && f.key !== "name" && f.key !== "type")
    .map((f: any) => f.key as string);

  const optionalFieldKeys = schema.fields
    .filter((f: any) => !f.required && f.key !== "name" && f.key !== "type")
    .map((f: any) => f.key as string);

  return (
    <div className="ui-page">
      <div className="ui-section-title">Nieuw asset</div>

      <div className="ui-form-grid">
        {/* Naam */}
        <div className="span-2 ui-field">
          <label htmlFor="asset-name">Assetnaam / Benoeming *</label>
          <input
            id="asset-name"
            placeholder='Bijv. "MacBook Pro 14″"'
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
          />
        </div>

        {/* Type (id) */}
        <div className="span-2 ui-field">
          <label htmlFor="asset-type">Assettype *</label>
          <select id="asset-type" value={form.typeId} onChange={handleTypeChange}>
            <option value="">— Kies een type —</option>
            {ASSET_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Persoon (optie) */}
        <div className="span-2 ui-field">
          <label htmlFor="asset-person">Koppel aan persoon (optie)</label>
          <select
            id="asset-person"
            value={form.personId}
            onChange={(e) => onChange("personId", e.target.value)}
          >
            <option value="">— Geen —</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Documenten (optie) */}
        <div className="span-2 ui-field" aria-describedby="docs-tip">
          <label htmlFor="asset-docs">
            Koppel documenten (optie){" "}
            {docCount > 0 && <span className="ui-count-badge">{docCount} geselecteerd</span>}
          </label>
          <select
            id="asset-docs"
            multiple
            className="ui-select-multi"
            value={form.documentIds}
            onChange={handleDocsChange}
          >
            {docs.map((d) => (
              <option key={d.id} value={d.id}>{d.title}</option>
            ))}
          </select>
          <small id="docs-tip" className="ui-tip">
            <span>ℹ️</span>
            Meerdere selecties: Shift-klik (bereik) of Cmd/Ctrl-klik (los).
          </small>
        </div>

        {/* Linkerkolom: VERPLICHT */}
        <div className="ui-field">
          <div className="ui-section-title">Verplicht</div>
          {requiredFieldKeys.length === 0 && <small><em>Geen verplichte velden voor dit type.</em></small>}
          {requiredFieldKeys.map((k) => (
            <div key={`req-${k}`} style={{ marginBottom: 6 }}>
              {renderRequiredField(k)}
            </div>
          ))}
        </div>

        {/* Rechterkolom: OPTIONEEL */}
        <div className="ui-field">
          <div className="ui-section-title">Optioneel</div>
          {optionalFieldKeys.map((k) => (
            <div key={`opt-${k}`} style={{ marginBottom: 6 }}>
              {renderOptionalField(k)}
            </div>
          ))}
        </div>
      </div>

      {/* Acties */}
      <div className="ui-actions">
        <button className="ui-btn ui-btn-primary" disabled={!requiredOK} onClick={save}>
          Opslaan in register
        </button>
      </div>

      {!requiredOK && (
        <small style={{ display: "block", marginTop: 8 }}>
          Vul alle velden met <strong>*</strong> in voor het gekozen assettype.
        </small>
      )}

      <small style={{ display: "block", marginTop: 12 }}>
        Na opslaan verschijnt het item in de tab <strong>Asset register</strong>.
      </small>
    </div>
  );
}

