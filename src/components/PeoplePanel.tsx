/* @ts-nocheck */
import React from "react";

type PersonRole = "Eigenaar" | "Medewerker" | "Relatie" | "Overig";

type FormState = {
  fullName: string;
  role: PersonRole | "";
  email: string;
  phone: string;
  notes: string;
};

type Row = {
  id: string;
  fullName: string;
  name?: string;
  role: PersonRole;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

const PEOPLE_KEY = "pam-people-v1";
const ASSETS_KEY = "pam-assets-v1";
const DOCS_KEY = "pam-docs-v1";

export default function PeoplePanel() {
  const [form, setForm] = React.useState<FormState>({
    fullName: "",
    role: "",
    email: "",
    phone: "",
    notes: "",
  });

  const [rows, setRows] = React.useState<Row[]>([]);
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState<{ key: keyof Row; dir: "asc" | "desc" }>({
    key: "fullName",
    dir: "asc",
  });

  React.useEffect(() => { load(); }, []);

  function load() {
    try {
      const raw = localStorage.getItem(PEOPLE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const arr: Row[] = Array.isArray(parsed?.people) ? parsed.people : Array.isArray(parsed) ? parsed : [];
      const norm = arr.map((p) => ({ ...p, fullName: (p.fullName || p.name || "").trim() }));
      setRows(norm);
    } catch {}
  }

  function onChange<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((s) => ({ ...s, [key]: val }));
  }

  const requiredOK = form.fullName.trim().length > 1 && !!form.role;

  function save() {
    if (!requiredOK) return;

    const id = (globalThis as any).crypto?.randomUUID?.() ?? `p_${Date.now()}_${Math.floor(Math.random()*1e6)}`;
    const now = new Date().toISOString();
    const person: Row = {
      id,
      fullName: form.fullName.trim(),
      name: form.fullName.trim(),
      role: form.role as PersonRole,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      notes: form.notes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const raw = localStorage.getItem(PEOPLE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      const out = parsed && Array.isArray(parsed.people)
        ? { ...parsed, people: [...parsed.people, person] }
        : Array.isArray(parsed)
        ? [...parsed, person]
        : { people: [person] };
      localStorage.setItem(PEOPLE_KEY, JSON.stringify(out));
    } catch {
      localStorage.setItem(PEOPLE_KEY, JSON.stringify({ people: [person] }));
    }

    setRows((r) => [...r, person]);
    setForm({ fullName: "", role: "", email: "", phone: "", notes: "" });
  }

  function unlinkFromAssetsAndDocs(personId: string) {
    // Assets: personId leegmaken
    try {
      const rawA = localStorage.getItem(ASSETS_KEY);
      if (rawA) {
        const parsedA = JSON.parse(rawA);
        const isContainerA = parsedA && Array.isArray(parsedA.assets);
        const arrA: any[] = isContainerA ? parsedA.assets : Array.isArray(parsedA) ? parsedA : [];
        const nextA = arrA.map((a) => (a.personId === personId ? { ...a, personId: undefined } : a));
        const outA = isContainerA ? { ...parsedA, assets: nextA } : Array.isArray(parsedA) ? nextA : { assets: nextA };
        localStorage.setItem(ASSETS_KEY, JSON.stringify(outA));
      }
    } catch {}

    // Docs: ownerId leegmaken
    try {
      const rawD = localStorage.getItem(DOCS_KEY);
      if (rawD) {
        const parsedD = JSON.parse(rawD);
        const isContainerD = parsedD && Array.isArray(parsedD.docs);
        const arrD: any[] = isContainerD ? parsedD.docs : Array.isArray(parsedD) ? parsedD : [];
        const nextD = arrD.map((d) => (d.ownerId === personId ? { ...d, ownerId: undefined } : d));
        const outD = isContainerD ? { ...parsedD, docs: nextD } : Array.isArray(parsedD) ? nextD : { docs: nextD };
        localStorage.setItem(DOCS_KEY, JSON.stringify(outD));
      }
    } catch {}
  }

  function handleDelete(personId: string) {
    if (!confirm("Weet je zeker dat je deze persoon wilt verwijderen?")) return;

    // 1) Verwijderen uit people storage
    try {
      const raw = localStorage.getItem(PEOPLE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const isContainer = parsed && Array.isArray(parsed.people);
        const arr: any[] = isContainer ? parsed.people : Array.isArray(parsed) ? parsed : [];
        const next = arr.filter((p) => p.id !== personId);
        const out = isContainer ? { ...parsed, people: next } : Array.isArray(parsed) ? next : { people: next };
        localStorage.setItem(PEOPLE_KEY, JSON.stringify(out));
      }
    } catch {}

    // 2) Loskoppelen uit assets/docs
    unlinkFromAssetsAndDocs(personId);

    // 3) UI updaten
    setRows((r) => r.filter((x) => x.id !== personId));
  }

  function toggleSort(key: keyof Row) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = !needle
      ? rows
      : rows.filter((r) =>
          [r.fullName, r.role, r.email, r.phone]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(needle))
        );

    out = [...out].sort((a, b) => {
      const A = String(a[sort.key] ?? "");
      const B = String(b[sort.key] ?? "");
      return sort.dir === "asc" ? A.localeCompare(B) : B.localeCompare(A);
    });

    return out;
  }, [rows, q, sort]);

  return (
    <div className="ui-page">
      <div className="ui-section-title">Nieuw persoon</div>

      <div className="ui-form-grid">
        {/* Verplicht (links) */}
        <div className="ui-field">
          <div className="ui-section-title">Verplicht</div>

          <label htmlFor="pp-name">Volledige naam *</label>
          <input
            id="pp-name"
            placeholder="Bijv. Jan Jansen"
            value={form.fullName}
            onChange={(e) => onChange("fullName", e.target.value)}
          />

          <label htmlFor="pp-role" style={{ marginTop: 12 }}>Rol *</label>
          <select
            id="pp-role"
            value={form.role}
            onChange={(e) => onChange("role", e.target.value as FormState["role"])}
          >
            <option value="">— Kies een rol —</option>
            <option>Eigenaar</option>
            <option>Medewerker</option>
            <option>Relatie</option>
            <option>Overig</option>
          </select>
        </div>

        {/* Optioneel (rechts) */}
        <div className="ui-field">
          <div className="ui-section-title">Contact (optie)</div>

          <label htmlFor="pp-email">E-mail</label>
          <input
            id="pp-email"
            type="email"
            placeholder="naam@bedrijf.nl"
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
          />

          <label htmlFor="pp-phone" style={{ marginTop: 12 }}>Telefoon</label>
          <input
            id="pp-phone"
            placeholder="+31 6 12 34 56 78"
            value={form.phone}
            onChange={(e) => onChange("phone", e.target.value)}
          />

          <label htmlFor="pp-notes" style={{ marginTop: 12 }}>Notities</label>
          <textarea
            id="pp-notes"
            rows={5}
            placeholder="Opmerkingen over rol/bereikbaarheid…"
            value={form.notes}
            onChange={(e) => onChange("notes", e.target.value)}
          />
        </div>
      </div>

      {/* Acties onderaan formulier */}
      <div className="ui-actions">
        <button className="ui-btn ui-btn--primary" disabled={!requiredOK} onClick={save}>
          Opslaan in register
        </button>
      </div>

      {!requiredOK && (
        <small style={{ display: "block", marginTop: 8 }}>
          Vul minimaal <strong>Volledige naam</strong> en <strong>Rol</strong> in.
        </small>
      )}

      {/* Overzicht */}
      <div style={{ marginTop: 16 }}>
        <div className="ui-section-title">Mensen ({filtered.length})</div>

        <div className="ui-toolbar">
          <input placeholder="Zoeken…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="spacer" />
          <small>{filtered.length} resultaten</small>
        </div>

        <div className="ui-table-wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort("fullName")}>Naam</th>
                <th onClick={() => toggleSort("role")}>Rol</th>
                <th onClick={() => toggleSort("email")}>E-mail</th>
                <th onClick={() => toggleSort("phone")}>Telefoon</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>{p.fullName || p.name}</td>
                  <td>{p.role}</td>
                  <td>{p.email || ""}</td>
                  <td>{p.phone || ""}</td>
                  <td>
                    <button className="ui-btn ui-btn--sm ui-btn--danger" onClick={() => handleDelete(p.id)}>
                      Verwijderen
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5}><em>Geen personen gevonden.</em></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}



