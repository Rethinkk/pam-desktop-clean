import React from "react";

type AssetType = "IT-Materieel" | "Meubilair" | "Overig";

type FormState = {
  name: string;
  type: AssetType | "";
  personId: string;
  documentIds: string[];
  serial: string;
  brand: string;
  model: string;
  purchaseDate: string;   // yyyy-mm-dd uit <input type="date">
  warrantyUntil: string;  // idem
  priceRaw: string;       // invoer zoals getypt / gemaskeerd
  priceCents: number;     // numeriek voor opslag
  notes: string;
};

export default function AssetsPanel() {
  const [form, setForm] = React.useState<FormState>({
    name: "",
    type: "",
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

  function onChange<K extends keyof FormState>(key: K, val: FormState[K]): void {
    setForm((s) => ({ ...s, [key]: val }));
  }

  // --- helpers
  const requiredOK =
    form.name.trim().length > 1 &&
    !!form.type &&
    form.serial.trim().length > 0 &&
    !!form.purchaseDate;

  function handleSerial(e: React.ChangeEvent<HTMLInputElement>): void {
    const v = e.target.value.toUpperCase().trim();
    onChange("serial", v);
  }

  function handlePrice(e: React.ChangeEvent<HTMLInputElement>): void {
    const v = e.target.value.replace(/[^\d,.\s]/g, "").replace(/\s+/g, "");
    onChange("priceRaw", v);
    const normalized = v.replace(/\./g, "").replace(",", ".");
    const num = Number.parseFloat(normalized);
    onChange("priceCents", Number.isFinite(num) ? Math.round(num * 100) : 0);
  }

  function formatPriceForDisplay(): string {
    const euros = form.priceCents / 100;
    if (!euros) return form.priceRaw || "";
    try {
      return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(euros);
    } catch {
      return `€ ${euros.toFixed(2)}`;
    }
  }

  function handlePriceBlur(): void {
    if (form.priceCents > 0) {
      onChange("priceRaw", formatPriceForDisplay());
    }
  }

  function handleDocsChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    const selected = Array.from(e.target.selectedOptions).map(
      (o: HTMLOptionElement) => o.value
    );
    onChange("documentIds", selected);
    setDocCount(selected.length);
  }

  function save(): void {
    if (!requiredOK) return;
    // 👉 TODO: jouw bestaande save-logica hier
  }

  return (
    <div className="ui-page">
      <div className="ui-section-title">Nieuw asset</div>

      <div className="ui-form-grid">
        {/* Naam (verplicht) */}
        <div className="span-2 ui-field">
          <label htmlFor="asset-name">Assetnaam / Benoeming *</label>
          <input
            id="asset-name"
            placeholder='Bijv. "MacBook Pro 14″"'
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
          />
        </div>

        {/* Type (verplicht) */}
        <div className="span-2 ui-field">
          <label htmlFor="asset-type">Assettype *</label>
          <select
            id="asset-type"
            value={form.type}
            onChange={(e) => onChange("type", e.target.value as FormState["type"])}
          >
            <option value="">— Kies een type —</option>
            <option>IT-Materieel</option>
            <option>Meubilair</option>
            <option>Overig</option>
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
            {/* map je personen */}
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
            {/* map je documenten */}
          </select>
          <small id="docs-tip" className="ui-tip">
            <span>ℹ️</span>
            Je kunt meerdere documenten selecteren. Gebruik Shift-klik voor een bereik of Cmd/Ctrl-klik voor losse keuzes.
          </small>
        </div>

        {/* Kolom links (verplicht) */}
        <div className="ui-field">
          <div className="ui-section-title">Verplicht</div>

          <label htmlFor="serial">Serienummer *</label>
          <input
            id="serial"
            placeholder="SN-…"
            value={form.serial}
            onChange={handleSerial}
          />

          <label htmlFor="purchaseDate" style={{ marginTop: 12 }}>Aankoopdatum *</label>
          <input
            id="purchaseDate"
            type="date"
            value={form.purchaseDate}
            onChange={(e) => onChange("purchaseDate", e.target.value)}
            placeholder="dd/mm/jjjj"
          />

          <label htmlFor="price" style={{ marginTop: 12 }}>Aankoopprijs *</label>
          <input
            id="price"
            inputMode="decimal"
            value={form.priceRaw}
            onChange={handlePrice}
            onBlur={handlePriceBlur}
            placeholder="€ 0,00"
          />
        </div>

        {/* Kolom rechts (optioneel) */}
        <div className="ui-field">
          <div className="ui-section-title">Optioneel</div>

          <label htmlFor="brand">Merk</label>
          <input id="brand" value={form.brand} onChange={(e) => onChange("brand", e.target.value)} />

          <label htmlFor="model" style={{ marginTop: 12 }}>Model</label>
          <input id="model" value={form.model} onChange={(e) => onChange("model", e.target.value)} />

          <label htmlFor="warrantyUntil" style={{ marginTop: 12 }}>Garantie tot</label>
          <input
            id="warrantyUntil"
            type="date"
            value={form.warrantyUntil}
            onChange={(e) => onChange("warrantyUntil", e.target.value)}
            placeholder="dd/mm/jjjj"
          />

          <label htmlFor="notes" style={{ marginTop: 12 }}>Notities</label>
          <textarea id="notes" rows={5} value={form.notes} onChange={(e) => onChange("notes", e.target.value)} />
        </div>
      </div>

      {/* Acties onderaan formulier */}
      <div className="ui-actions">
        <button className="ui-btn ui-btn-primary" disabled={!requiredOK} onClick={save}>
          Opslaan in register
        </button>
      </div>

      {!requiredOK && (
        <small style={{ display: "block", marginTop: 8 }}>
          Vul minimaal <strong>Assetnaam</strong>, <strong>Assettype</strong>, <strong>Serienummer</strong> en <strong>Aankoopdatum</strong> in.
        </small>
      )}

      <small style={{ display: "block", marginTop: 12 }}>
        Na opslaan verschijnt het item in de tab <strong>Asset register</strong>.
      </small>
    </div>
  );
}


