/* @ts-nocheck */
import React from "react";
import { assetRepository, documentRepository, personRepository } from "../storage/repositories";
import { openPamTab } from "../lib/workspaceTabs";
import { EmptyState } from "./ui/UI";

/** —— ROL-CONFIG —— 
 * Pas alleen HIER de labels aan. Bestaande records tonen dan meteen de nieuwe labels.
 * Laat 'value' gelijk aan de sleutel die je opslaat (of al in storage staat),
 * zet 'label' op de gewenste zichtbare naam.
 */
const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "Hoofdgebruiker",   label: "Hoofdgebruiker" },
  { value: "Partner", label: "Partner" },
  { value: "Kind",    label: "Kind" },
  { value: "Ouder",     label: "Ouder" },
  { value: "Familielid",     label: "Familielid" },
  { value: "Mede-eigenaar",     label: "Mede-eigenaar" },
  
];
// label lookup (fallback = originele waarde)
function roleLabel(v?: string) {
  if (!v) return "";
  const hit = ROLE_OPTIONS.find(o => o.value === v);
  return hit?.label ?? v;
}

type FormState = {
  fullName: string;
  role: string | "";
  email: string;
  phone: string;
  notes: string;
  assetIds: string[];
};

type Row = {
  id: string;
  fullName: string;
  name?: string;
  role: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

type AssetOption = {
  id: string;
  label: string;
};

function assetLabel(a: any): string {
  return [
    a.name ??
      a.data?.naam ??
      a.data?.titel ??
      a.data?.object ??
      a.data?.adres ??
      a.assetNumber ??
      "Asset",
    a.typeLabel ?? a.type,
  ]
    .filter(Boolean)
    .join(" — ");
}

export default function PeoplePanel() {
  const [form, setForm] = React.useState<FormState>({
    fullName: "",
    role: "",
    email: "",
    phone: "",
    notes: "",
    assetIds: [],
  });

  const [rows, setRows] = React.useState<Row[]>([]);
  const [assets, setAssets] = React.useState<AssetOption[]>([]);
  const [assetLinksByPerson, setAssetLinksByPerson] = React.useState<Record<string, string[]>>({});
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState<{ key: keyof Row; dir: "asc" | "desc" }>({
    key: "fullName",
    dir: "asc",
  });

  React.useEffect(() => { load(); }, []);

  function load() {
    try {
      const arr: Row[] = personRepository.all() as any;
      const norm = arr.map((p) => ({
        ...p,
        fullName: (p.fullName || p.name || "").trim(),
        role: String(p.role ?? ""), // zorg dat we altijd een string hebben
      }));
      setRows(norm);
    } catch {}

    try {
      const assetRows = assetRepository.load().assets;
      setAssets(
        assetRows
          .map((a: any) => ({ id: a.id, label: assetLabel(a) }))
          .filter((a: AssetOption) => !!a.id && !!a.label),
      );

      const links: Record<string, string[]> = {};
      for (const rawAsset of assetRows) {
        const asset: any = rawAsset;
        const ids = new Set<string>();
        if (asset.personId) ids.add(asset.personId);
        if (Array.isArray(asset.personIds)) {
          asset.personIds.forEach((id: string) => ids.add(id));
        }
        ids.forEach((personId) => {
          links[personId] = [...(links[personId] ?? []), asset.id];
        });
      }
      setAssetLinksByPerson(links);
    } catch {}
  }

  function onChange<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((s) => ({ ...s, [key]: val }));
  }

  const requiredOK = form.fullName.trim().length > 1 && !!form.role;

  function toggleId(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
  }

  function toggleFormAsset(assetId: string) {
    onChange("assetIds", toggleId(form.assetIds, assetId));
  }

  function updatePersonAssetLinks(personId: string, personName: string, selectedAssetIds: string[]) {
    const selected = new Set(selectedAssetIds);
    const nextAssets = assetRepository.load().assets.map((asset: any) => {
      const currentIds = new Set<string>(Array.isArray(asset.personIds) ? asset.personIds : []);
      if (asset.personId) currentIds.add(asset.personId);

      if (selected.has(asset.id)) {
        currentIds.add(personId);
      } else {
        currentIds.delete(personId);
      }

      const nextPersonIds = Array.from(currentIds);
      const next = {
        ...asset,
        personIds: nextPersonIds.length ? nextPersonIds : undefined,
        updatedAt: new Date().toISOString(),
      };

      if (asset.personId === personId && !selected.has(asset.id)) {
        next.personId = nextPersonIds[0] || undefined;
        next.personName = next.personId === personId ? personName : undefined;
      } else if (!asset.personId && selected.has(asset.id)) {
        next.personId = personId;
        next.personName = personName;
      } else if (asset.personId === personId) {
        next.personName = personName;
      }

      return next;
    });

    assetRepository.save({ assets: nextAssets });
    load();
  }

  function save() {
    if (!requiredOK) return;

    const id = (globalThis as any).crypto?.randomUUID?.() ?? `p_${Date.now()}_${Math.floor(Math.random()*1e6)}`;
    const now = new Date().toISOString();
    const person: Row = {
      id,
      fullName: form.fullName.trim(),
      name: form.fullName.trim(),
      role: String(form.role), // sla de 'value' op
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      notes: form.notes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    personRepository.saveAll([...personRepository.all(), person as any]);
    if (form.assetIds.length) {
      updatePersonAssetLinks(person.id, person.fullName, form.assetIds);
    }

    // ✅ bevestiging alleen hier bij opslaan
    window.dispatchEvent(new CustomEvent("pam:toast", {
      detail: { message: "Persoon opgeslagen ✅", tone: "success" }
    }));

    // UI bijwerken
    load();
    setForm({ fullName: "", role: "", email: "", phone: "", notes: "", assetIds: [] });
  }

  function unlinkFromAssetsAndDocs(personId: string) {
    // GEEN toasts hier.
    // Assets: personId leegmaken
    try {
      const nextA = assetRepository.load().assets.map((a: any) => {
        const personIds = Array.isArray(a.personIds)
          ? a.personIds.filter((id: string) => id !== personId)
          : [];
        const next = {
          ...a,
          personIds: personIds.length ? personIds : undefined,
          updatedAt: new Date().toISOString(),
        };
        if (a.personId === personId) {
          next.personId = personIds[0] || undefined;
          next.personName = undefined;
        }
        return next;
      });
      assetRepository.save({ assets: nextA });
    } catch {}

    // Docs: ownerId leegmaken
    try {
      const nextD = documentRepository
        .all()
        .map((d: any) => (d.ownerId === personId ? { ...d, ownerId: undefined } : d));
      documentRepository.saveAll(nextD as any);
    } catch {}
  }

  function handleDelete(id: string) {
    if (!confirm("Weet je zeker dat je deze persoon wilt verwijderen?")) return;

    let removed = false;

    // 1) Verwijderen uit people storage
    try {
      const next = personRepository.all().filter((p: any) => p.id !== id);
      personRepository.saveAll(next);
      removed = true;
    } catch {}

    // 2) Loskoppelen uit assets/docs
    try { unlinkFromAssetsAndDocs(id); } catch {}

    // 3) UI updaten
    setRows((r) => r.filter((x) => x.id !== id));
    load();

    // 4) Toast alleen hier en alleen bij succes
    if (removed) {
      window.dispatchEvent(new CustomEvent("pam:toast", {
        detail: { message: "Persoon verwijderd", tone: "info" }
      }));
    }
  }

  function toggleSort(key: keyof Row) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  function toggleExistingPersonAsset(person: Row, assetId: string) {
    const current = assetLinksByPerson[person.id] ?? [];
    const next = toggleId(current, assetId);
    updatePersonAssetLinks(person.id, person.fullName || person.name || "", next);

    window.dispatchEvent(new CustomEvent("pam:toast", {
      detail: { message: "Assetkoppeling bijgewerkt", tone: "success" }
    }));
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

      {rows.length === 0 && (
        <div style={{ marginBottom: 16 }}>
          <EmptyState
            title="Voeg een betrokken persoon toe"
            body="Denk aan uzelf, een partner, kind, familielid of mede-eigenaar. Personen maken later duidelijk wie bij welk asset, document of toestemming hoort."
            actionLabel="Persoon invullen"
            secondaryLabel="Eerst asset toevoegen"
            onAction={() => document.getElementById("pp-name")?.focus()}
            onSecondary={() => openPamTab("assets")}
          />
        </div>
      )}

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
            {ROLE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
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

        {/* Assets koppelen */}
        <div className="span-2 ui-field" aria-describedby="pp-assets-tip">
          <label htmlFor="pp-assets">
            Koppel aan assets (optie){" "}
            {form.assetIds.length > 0 && <span className="ui-count-badge">{form.assetIds.length} geselecteerd</span>}
          </label>
          <div
            id="pp-assets"
            style={{
              display: "grid",
              gap: 8,
              maxHeight: 180,
              overflow: "auto",
              border: "1px solid #d8e0ea",
              borderRadius: 12,
              padding: 10,
              background: "#fff",
            }}
          >
            {assets.map((asset) => (
              <label key={asset.id} style={{ display: "flex", gap: 8, alignItems: "center", margin: 0 }}>
                <input
                  type="checkbox"
                  style={{ width: "auto" }}
                  checked={form.assetIds.includes(asset.id)}
                  onChange={() => toggleFormAsset(asset.id)}
                />
                <span>{asset.label}</span>
              </label>
            ))}
            {assets.length === 0 && <small>Geen assets beschikbaar.</small>}
          </div>
          <small id="pp-assets-tip" className="ui-tip">
            Vink één of meer assets aan waar deze persoon bij hoort.
          </small>
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
                <th>Assets</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>{p.fullName || p.name}</td>
                  <td>{roleLabel(p.role)}</td>
                  <td>{p.email || ""}</td>
                  <td>{p.phone || ""}</td>
                  <td>
                    <div style={{ display: "grid", gap: 6, minWidth: 220 }}>
                      {assets.map((asset) => (
                        <label key={asset.id} style={{ display: "flex", gap: 8, alignItems: "center", margin: 0 }}>
                          <input
                            type="checkbox"
                            style={{ width: "auto" }}
                            checked={(assetLinksByPerson[p.id] ?? []).includes(asset.id)}
                            onChange={() => toggleExistingPersonAsset(p, asset.id)}
                          />
                          <span>{asset.label}</span>
                        </label>
                      ))}
                      {assets.length === 0 && <small>Geen assets beschikbaar.</small>}
                    </div>
                  </td>
                  <td>
                    <button className="ui-btn ui-btn--sm ui-btn--danger" onClick={() => handleDelete(p.id)}>
                      Verwijderen
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <em>
                      {rows.length === 0
                        ? "Nog geen personen vastgelegd."
                        : "Geen personen gevonden binnen deze zoekopdracht."}
                    </em>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
