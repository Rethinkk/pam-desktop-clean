import React from "react";

type DocType = "Polis" | "Factuur" | "Garantiebewijs" | "Contract" | "Overig";

type FormState = {
  title: string;
  type: DocType | "";
  number: string;
  personId: string;
  issuedAt: string;   // yyyy-mm-dd
  expiresAt: string;  // yyyy-mm-dd
  notes: string;
};

type PersonLite = { id: string; display: string };

const DOCS_KEY = "pam-docs-v1";
const PEOPLE_KEY = "pam-people-v1";

export default function DocumentsPanel() {
  const [form, setForm] = React.useState<FormState>({
    title: "",
    type: "",
    number: "",
    personId: "",
    issuedAt: "",
    expiresAt: "",
    notes: "",
  });

  const [people, setPeople] = React.useState<PersonLite[]>([]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(PEOPLE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed?.people) ? parsed.people : Array.isArray(parsed) ? parsed : [];
      const norm: PersonLite[] = arr.map((p: any) => ({
        id: p.id ?? String(p.email ?? p.phone ?? Math.random()),
        display: (p.fullName ?? p.name ?? "—").trim(),
      }));
      setPeople(norm.filter((p) => !!p.display && !!p.id));
    } catch {}
  }, []);

  function onChange<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((s) => ({ ...s, [key]: val }));
  }

  const requiredOK =
    form.title.trim().length > 1 &&
    !!form.type;

  function save() {
    if (!requiredOK) return;

    const id = (globalThis as any).crypto?.randomUUID?.() ?? String(Date.now());
    const owner = people.find((p) => p.id === form.personId);

    const doc = {
      id,
      title: form.title.trim(),
      type: form.type,
      number: form.number.trim() || undefined,
      ownerId: form.personId || undefined,
      ownerName: owner?.display || undefined,
      issuedAt: form.issuedAt || undefined,
      expiresAt: form.expiresAt || undefined,
      notes: form.notes?.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // compat: {docs:[...]} of een kale array [] ondersteunen
    let out: any;
    try {
      const raw = localStorage.getItem(DOCS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && Array.isArray(parsed.docs)) {
        out = { ...parsed, docs: [...parsed.docs, doc] };
      } else if (Array.isArray(parsed)) {
        out = [...parsed, doc];
      } else {
        out = { docs: [doc] };
      }
    } catch {
      out = { docs: [doc] };
    }
    localStorage.setItem(DOCS_KEY, JSON.stringify(out));

    // reset naar leeg formulier
    setForm({
      title: "",
      type: "",
      number: "",
      personId: "",
      issuedAt: "",
      expiresAt: "",
      notes: "",
    });
  }

  return (
    <div className="ui-page">
      <div className="ui-section-title">Nieuw document</div>

      <div className="ui-form-grid">
        {/* Titel (verplicht) */}
        <div className="span-2 ui-field">
          <label htmlFor="doc-title">Titel *</label>
          <input
            id="doc-title"
            placeholder='Bijv. "Polis Aansprakelijkheid 2025"'
            value={form.title}
            onChange={(e) => onChange("title", e.target.value)}
          />
          <small>Gebruik een herkenbare naam. Nummer en datums kun je hieronder kwijt.</small>
        </div>

        {/* Type (verplicht) */}
        <div className="span-2 ui-field">
          <label htmlFor="doc-type">Type *</label>
          <select
            id="doc-type"
            value={form.type}
            onChange={(e) => onChange("type", e.target.value as FormState["type"])}
          >
            <option value="">— Kies een type —</option>
            <option>Polis</option>
            <option>Factuur</option>
            <option>Garantiebewijs</option>
            <option>Contract</option>
            <option>Overig</option>
          </select>
        </div>

        {/* Persoon (optie) */}
        <div className="span-2 ui-field">
          <label htmlFor="doc-person">Koppel aan persoon (optie)</label>
          <select
            id="doc-person"
            value={form.personId}
            onChange={(e) => onChange("personId", e.target.value)}
          >
            <option value="">— Geen —</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.display}</option>
            ))}
          </select>
        </div>

        {/* Nummer (optie) */}
        <div className="span-2 ui-field">
          <label htmlFor="doc-number">Documentnummer (optie)</label>
          <input
            id="doc-number"
            placeholder="Bijv. POL-2025-00123"
            value={form.number}
            onChange={(e) => onChange("number", e.target.value)}
          />
        </div>

        {/* Linkerkolom */}
        <div className="ui-field">
          <div className="ui-section-title">Datums</div>

          <label htmlFor="issuedAt">Uitgegeven op</label>
          <input
            id="issuedAt"
            type="date"
            value={form.issuedAt}
            onChange={(e) => onChange("issuedAt", e.target.value)}
            placeholder="dd/mm/jjjj"
          />

          <label htmlFor="expiresAt" style={{ marginTop: 12 }}>Geldig tot</label>
          <input
            id="expiresAt"
            type="date"
            value={form.expiresAt}
            onChange={(e) => onChange("expiresAt", e.target.value)}
            placeholder="dd/mm/jjjj"
          />
        </div>

        {/* Rechterkolom */}
        <div className="ui-field">
          <div className="ui-section-title">Notities</div>
          <label htmlFor="doc-notes">Opmerkingen</label>
          <textarea
            id="doc-notes"
            rows={7}
            placeholder="Bijv. Polisnummer op PDF, bijlage staat in e-mail van 12-03-2025, enz."
            value={form.notes}
            onChange={(e) => onChange("notes", e.target.value)}
          />
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
          Vul minimaal <strong>Titel</strong> en <strong>Type</strong> in.
        </small>
      )}

      <small style={{ display: "block", marginTop: 12 }}>
        Na opslaan verschijnt het item in <strong>Document register</strong>.
      </small>
    </div>
  );
}





