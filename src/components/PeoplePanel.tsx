/* @ts-nocheck */
import React from "react";
import { assetRepository, documentRepository, personRepository } from "../storage/repositories";
import { logAuditEvent } from "../lib/auditTrail";
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
  finalized?: boolean;
};

type DocumentOption = {
  id: string;
  label: string;
  role: string;
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

function isAssetFinalized(asset: any) {
  return Boolean(
    asset?.finalizedAt ||
      asset?.lockedAt ||
      asset?.isFinalized ||
      asset?.status === "finalized" ||
      asset?.status === "vastgelegd",
  );
}

function documentLabel(document: any): string {
  return [
    document.title ?? document.fileName ?? document.filename ?? "Document",
    document.type ?? document.kind,
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
  const [documentsByPerson, setDocumentsByPerson] = React.useState<Record<string, DocumentOption[]>>({});
  const [assetLinksByPerson, setAssetLinksByPerson] = React.useState<Record<string, string[]>>({});
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
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
          .map((a: any) => ({ id: a.id, label: assetLabel(a), finalized: isAssetFinalized(a) }))
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

    try {
      const people = personRepository.all() as any[];
      const personNameById = new Map(
        people.map((person: any) => [person.id, (person.fullName ?? person.name ?? "").trim()]),
      );
      const docsByPerson: Record<string, DocumentOption[]> = {};
      for (const document of documentRepository.all() as any[]) {
        const candidates = [
          { id: document.ownerId ?? document.personId, role: "Eigenaar" },
          { id: document.uploadedById ?? document.uploadedBy, role: "Geupload door" },
          ...((Array.isArray(document.recipientIds) ? document.recipientIds : document.recipients ?? []).map((id: string) => ({
            id,
            role: "Ontvanger",
          }))),
        ].filter((candidate) => candidate.id);

        if (!candidates.length && document.ownerName) {
          for (const [personId, personName] of personNameById.entries()) {
            if (personName && personName === document.ownerName) {
              candidates.push({ id: personId, role: "Eigenaar" });
            }
          }
        }

        for (const candidate of candidates) {
          docsByPerson[candidate.id] = [
            ...(docsByPerson[candidate.id] ?? []),
            { id: document.id, label: documentLabel(document), role: candidate.role },
          ];
        }
      }
      setDocumentsByPerson(docsByPerson);
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
      if (isAssetFinalized(asset)) return asset;
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
    logAuditEvent({
      action: "person_created",
      entityType: "person",
      entityId: person.id,
      entityLabel: person.fullName,
      summary: `Persoon '${person.fullName}' aangemaakt.`,
      metadata: {
        role: person.role,
        assetCount: form.assetIds.length,
      },
    });

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
        .map((d: any) => {
          const next = {
            ...d,
            recipientIds: Array.isArray(d.recipientIds)
              ? d.recipientIds.filter((id: string) => id !== personId)
              : d.recipientIds,
            recipients: Array.isArray(d.recipients)
              ? d.recipients.filter((id: string) => id !== personId)
              : d.recipients,
            updatedAt: new Date().toISOString(),
          };
          if (d.ownerId === personId || d.personId === personId) {
            next.ownerId = undefined;
            next.personId = undefined;
            next.ownerName = undefined;
          }
          if (d.uploadedById === personId || d.uploadedBy === personId) {
            next.uploadedById = undefined;
            next.uploadedBy = undefined;
          }
          return next;
        });
      documentRepository.saveAll(nextD as any);
    } catch {}
  }

  function handleDelete(id: string) {
    const row = rows.find((person) => person.id === id);
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
    if (selectedId === id) setSelectedId(null);
    load();

    // 4) Toast alleen hier en alleen bij succes
    if (removed) {
      logAuditEvent({
        action: "person_deleted",
        entityType: "person",
        entityId: id,
        entityLabel: row?.fullName || row?.name,
        summary: `Persoon '${row?.fullName || row?.name || id}' verwijderd.`,
      });
      window.dispatchEvent(new CustomEvent("pam:toast", {
        detail: { message: "Persoon verwijderd", tone: "info" }
      }));
    }
  }

  function toggleSort(key: keyof Row) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  function toggleExistingPersonAsset(person: Row, assetId: string) {
    const asset = assets.find((candidate) => candidate.id === assetId);
    if (asset?.finalized) {
      window.dispatchEvent(new CustomEvent("pam:toast", {
        detail: { message: "Deze asset is vastgelegd en kan niet meer worden aangepast.", tone: "warn" }
      }));
      return;
    }

    const current = assetLinksByPerson[person.id] ?? [];
    const next = toggleId(current, assetId);
    updatePersonAssetLinks(person.id, person.fullName || person.name || "", next);
    logAuditEvent({
      action: "person_updated",
      entityType: "person",
      entityId: person.id,
      entityLabel: person.fullName || person.name,
      summary: `Asset-koppeling voor persoon '${person.fullName || person.name}' bijgewerkt.`,
      metadata: {
        assetCount: next.length,
      },
    });

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

  const selected = React.useMemo(
    () => rows.find((person) => person.id === selectedId) ?? null,
    [rows, selectedId],
  );

  function linkedAssetsForPerson(person: Row): AssetOption[] {
    const linkedIds = new Set(assetLinksByPerson[person.id] ?? []);
    return assets.filter((asset) => linkedIds.has(asset.id));
  }

  function linkedDocumentsForPerson(person: Row): DocumentOption[] {
    return documentsByPerson[person.id] ?? [];
  }

  function renderAssetBadges(person: Row) {
    const linkedAssets = linkedAssetsForPerson(person);
    if (!linkedAssets.length) return <span className="ui-muted">Geen assets gekoppeld</span>;
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, minWidth: 190 }}>
        {linkedAssets.slice(0, 2).map((asset) => (
          <span key={asset.id} className={`ui-badge ${asset.finalized ? "ok" : ""}`}>
            {asset.label}
          </span>
        ))}
        {linkedAssets.length > 2 && <span className="ui-badge">+{linkedAssets.length - 2}</span>}
      </div>
    );
  }

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
                <tr
                  key={p.id}
                  onClick={() => setSelectedId((current) => (current === p.id ? null : p.id))}
                  style={{ cursor: "pointer" }}
                  title="Klik om de persoon te bekijken"
                >
                  <td>{p.fullName || p.name}</td>
                  <td>{roleLabel(p.role)}</td>
                  <td>{p.email || ""}</td>
                  <td>{p.phone || ""}</td>
                  <td>{renderAssetBadges(p)}</td>
                  <td onClick={(event) => event.stopPropagation()}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="ui-btn ui-btn--sm" onClick={() => setSelectedId(p.id)}>
                        Bekijken
                      </button>
                      <button className="ui-btn ui-btn--sm ui-btn--danger" onClick={() => handleDelete(p.id)}>
                        Verwijderen
                      </button>
                    </div>
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

        {selected && (
          <PersonDetail
            assets={assets}
            assetLinks={assetLinksByPerson[selected.id] ?? []}
            documents={linkedDocumentsForPerson(selected)}
            onClose={() => setSelectedId(null)}
            onToggleAsset={(assetId) => toggleExistingPersonAsset(selected, assetId)}
            person={selected}
          />
        )}
      </div>
    </div>
  );
}

function PersonDetail({
  assets,
  assetLinks,
  documents,
  onClose,
  onToggleAsset,
  person,
}: {
  assets: AssetOption[];
  assetLinks: string[];
  documents: DocumentOption[];
  onClose: () => void;
  onToggleAsset: (assetId: string) => void;
  person: Row;
}) {
  const linkedIds = new Set(assetLinks);

  return (
    <div className="ui-card" style={{ marginTop: 18 }}>
      <div style={{ alignItems: "flex-start", display: "flex", gap: 12, justifyContent: "space-between" }}>
        <div>
          <div className="ui-section-title" style={{ marginTop: 0 }}>Persoon bekijken</div>
          <h2 className="ui-h2" style={{ marginBottom: 4 }}>{person.fullName || person.name}</h2>
          <div className="ui-muted">{roleLabel(person.role) || "Geen rol vastgelegd"}</div>
        </div>
        <button className="ui-btn ui-btn--sm" type="button" onClick={onClose}>
          Sluiten
        </button>
      </div>

      <div className="ui-grid cols-4" style={{ marginTop: 16 }}>
        <Meta label="Naam" value={person.fullName || person.name || "—"} />
        <Meta label="Rol" value={roleLabel(person.role) || "—"} />
        <Meta label="E-mail" value={person.email || "—"} />
        <Meta label="Telefoon" value={person.phone || "—"} />
      </div>

      {person.notes && (
        <div style={{ marginTop: 14 }}>
          <strong style={{ display: "block", marginBottom: 6 }}>Notities</strong>
          <p className="ui-muted" style={{ margin: 0 }}>{person.notes}</p>
        </div>
      )}

      <div className="ui-grid cols-2" style={{ marginTop: 16 }}>
        <div className="ui-card" style={{ marginBottom: 0 }}>
          <h3 className="ui-h2">Gekoppelde assets</h3>
          <p className="ui-muted" style={{ marginTop: -4 }}>
            Vink concept-assets aan of uit. Vastgelegde assets zijn alleen zichtbaar.
          </p>
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {assets.map((asset) => (
              <label key={asset.id} style={{ alignItems: "center", display: "flex", gap: 8, margin: 0 }}>
                <input
                  checked={linkedIds.has(asset.id)}
                  disabled={asset.finalized}
                  onChange={() => onToggleAsset(asset.id)}
                  style={{ width: "auto" }}
                  type="checkbox"
                />
                <span>
                  {asset.label}{" "}
                  {asset.finalized && <span className="ui-badge ok">Vastgelegd</span>}
                </span>
              </label>
            ))}
            {!assets.length && <small>Geen assets beschikbaar.</small>}
          </div>
        </div>

        <div className="ui-card" style={{ marginBottom: 0 }}>
          <h3 className="ui-h2">Gekoppelde documenten</h3>
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {documents.map((document) => (
              <div
                key={`${document.id}-${document.role}`}
                style={{
                  borderTop: "1px solid #ECEAE3",
                  display: "grid",
                  gap: 4,
                  paddingTop: 10,
                }}
              >
                <strong>{document.label}</strong>
                <span className="ui-muted">{document.role}</span>
              </div>
            ))}
            {!documents.length && (
              <div className="ui-empty" style={{ padding: 14 }}>
                <div className="ui-empty-title">Geen documenten gekoppeld</div>
                <p className="ui-empty-body">
                  Documenten worden hier zichtbaar zodra deze persoon als eigenaar, uploader of ontvanger is gekoppeld.
                </p>
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <button className="ui-btn ui-btn--secondary" type="button" onClick={() => openPamTab("doc-register")}>
              Naar document register
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="ui-kpi">
      <div className="label">{label}</div>
      <div style={{ fontSize: 14, fontWeight: 720, overflowWrap: "anywhere", marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}
