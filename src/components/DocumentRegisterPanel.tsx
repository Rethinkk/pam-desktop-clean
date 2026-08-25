/* @ts-nocheck */
import React from "react";
import { openPamTab } from "../lib/workspaceTabs";
import { assetRepository, documentRepository } from "../storage/repositories";
import { loadAssetSchema } from "../config/assetSchema";
import { EmptyState } from "./ui/UI";

type DocRow = {
  id: string;
  title: string;
  type?: string;
  number?: string;
  ownerName?: string;
  assetIds?: string[];
  assetNames?: string[];
  issuedAt?: string;  // yyyy-mm-dd
  expiresAt?: string; // yyyy-mm-dd
};

function parseYMD(s?: string) {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]) - 1, d = Number(m[3]);
  return new Date(y, mo, d);
}
function daysUntil(exp?: string) {
  const dt = parseYMD(exp);
  if (!dt) return null;
  const today = new Date();
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const b = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  const diffMs = b.getTime() - a.getTime();
  return Math.round(diffMs / 86400000);
}
function expiryStatus(expiresAt?: string) {
  const d = daysUntil(expiresAt);
  if (d === null) return { label: "—", cls: "ui-badge" };
  if (d < 0) return { label: "Verlopen", cls: "ui-badge danger" };
  if (d <= 30) return { label: `Binnen ${d} d`, cls: "ui-badge warn" };
  return { label: "Actief", cls: "ui-badge ok" };
}

function inferDocumentType(fieldKey: string, fieldLabel: string) {
  const text = `${fieldKey} ${fieldLabel}`.toLowerCase();
  if (text.includes("factuur")) return "Factuur";
  if (text.includes("garantie")) return "Garantiebewijs";
  if (text.includes("polis")) return "Polis";
  if (text.includes("contract")) return "Contract";
  return "Overig";
}

function isFileValue(value: any) {
  return value && typeof value === "object" && typeof value.name === "string";
}

export default function DocumentRegisterPanel() {
  const [rows, setRows] = React.useState<DocRow[]>([]);
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState<{ key: keyof DocRow | "status"; dir: "asc" | "desc" }>({
    key: "title",
    dir: "asc",
  });

  React.useEffect(() => {
    load();
  }, []);

  function load() {
    try {
      const assets = assetRepository.load().assets as any[];
      syncExistingAssetFileDocuments(assets);
      const docs: DocRow[] = documentRepository.all() as any;
      const assetLabelById = new Map(
        assets.map((asset: any) => [
          asset.id,
          [
            asset.name ?? asset.data?.naam ?? asset.data?.titel ?? asset.assetNumber ?? "Asset",
            asset.typeLabel ?? asset.type,
          ].filter(Boolean).join(" — "),
        ]),
      );
      const norm = docs.map((d: any) => ({
        id: d.id ?? String(Math.random()),
        title: d.title ?? d.name ?? "",
        type: d.type ?? d.kind ?? "",
        number: d.number ?? d.no ?? "",
        ownerName: d.ownerName ?? d.personName ?? d.owner ?? "",
        assetIds: Array.isArray(d.assetIds) ? d.assetIds : [],
        assetNames: Array.isArray(d.assetIds)
          ? d.assetIds.map((assetId: string) => assetLabelById.get(assetId) ?? assetId)
          : Array.isArray(d.assetNames)
            ? d.assetNames
            : [],
        issuedAt: d.issuedAt ?? d.issueDate ?? "",
        expiresAt: d.expiresAt ?? d.validUntil ?? d.expiryDate ?? "",
      })) as DocRow[];
      setRows(norm);
    } catch {}
  }

  function syncExistingAssetFileDocuments(assets: any[]) {
    const schema = loadAssetSchema();
    const docs = documentRepository.all() as any[];
    const nextDocs = [...docs];
    let changed = false;
    const now = new Date().toISOString();

    for (const asset of assets) {
      if (!asset?.id || !asset?.data) continue;
      const type = schema.types.find((candidate) =>
        candidate.id === asset.typeId ||
        candidate.id === asset.type ||
        candidate.label === asset.typeLabel ||
        candidate.label === asset.type,
      );
      const fileLabels = new Map(
        (type?.fields ?? [])
          .filter((field) => field.type === "file")
          .map((field) => [field.key, field.label]),
      );
      Object.entries(asset.data).forEach(([fieldKey, file]: [string, any]) => {
        if (!isFileValue(file)) return;
        const existing = nextDocs.find((doc: any) => doc.sourceAssetId === asset.id && doc.sourceFieldKey === fieldKey);
        if (existing) return;

        const fieldLabel = fileLabels.get(fieldKey) ?? fieldKey;
        const assetLabel = asset.name ?? asset.data?.naam ?? asset.data?.titel ?? asset.assetNumber ?? "Asset";
        nextDocs.push({
          id: crypto.randomUUID(),
          title: `${fieldLabel} - ${assetLabel}`,
          type: inferDocumentType(fieldKey, fieldLabel),
          fileName: file.name,
          filename: file.name,
          fileSize: file.size ?? 0,
          size: file.size ?? 0,
          mimeType: file.type || "application/octet-stream",
          mime: file.type || "application/octet-stream",
          fileDataUrl: file.dataUrl ?? "",
          dataUrl: file.dataUrl ?? "",
          assetIds: [asset.id],
          sourceAssetId: asset.id,
          sourceFieldKey: fieldKey,
          notes: `Automatisch aangemaakt vanuit assetveld '${fieldLabel}'.`,
          createdAt: now,
          updatedAt: now,
        });
        changed = true;
      });
    }

    if (changed) {
      documentRepository.saveAll(nextDocs as any);
      const generatedByAsset = new Map<string, string[]>();
      nextDocs.forEach((doc: any) => {
        if (!doc.sourceAssetId || !doc.assetIds?.includes(doc.sourceAssetId)) return;
        const ids = generatedByAsset.get(doc.sourceAssetId) ?? [];
        ids.push(doc.id);
        generatedByAsset.set(doc.sourceAssetId, ids);
      });
      const nextAssets = assets.map((asset: any) => {
        const generatedIds = generatedByAsset.get(asset.id);
        if (!generatedIds?.length) return asset;
        return {
          ...asset,
          documentIds: Array.from(new Set([...(asset.documentIds ?? []), ...generatedIds])),
          updatedAt: now,
        };
      });
      assetRepository.save({ assets: nextAssets });
    }
  }

  function persistDelete(docId: string) {
    const deletedDoc = documentRepository.all().find((doc: any) => doc.id === docId) as any;

    // 1) Documenten opschonen
    try {
      documentRepository.saveAll(documentRepository.all().filter((d: any) => d.id !== docId));
    } catch {}

    // 2) Document-koppelingen bij assets verwijderen (documentIds[])
    try {
      const nextA = assetRepository.load().assets.map((a: any) => {
        const nextData = { ...(a.data ?? {}) };
        if (deletedDoc?.sourceAssetId === a.id && deletedDoc?.sourceFieldKey) {
          delete nextData[deletedDoc.sourceFieldKey];
        }
        if (Array.isArray(a.documentIds)) {
          return {
            ...a,
            data: nextData,
            documentIds: a.documentIds.filter((x: any) => x !== docId),
            updatedAt: new Date().toISOString(),
          };
        }
        if (deletedDoc?.sourceAssetId === a.id && deletedDoc?.sourceFieldKey) {
          return { ...a, data: nextData, updatedAt: new Date().toISOString() };
        }
        return a;
      });
      assetRepository.save({ assets: nextA });
    } catch {}
  }

  function handleDelete(id: string) {
    if (!confirm("Weet je zeker dat je dit document wilt verwijderen?")) return;
    persistDelete(id);
    setRows((r) => r.filter((x) => x.id !== id));

    // ✅ mini-bericht na verwijderen (nul dependencies)
  alert("Document verwijderd");

  }

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = !needle
      ? rows
      : rows.filter((r) =>
          [r.title, r.type, r.number, r.ownerName, ...(r.assetNames ?? [])].filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(needle))
        );

    out = [...out].sort((a, b) => {
      if (sort.key === "status") {
        const sa = expiryStatus(a.expiresAt).label;
        const sb = expiryStatus(b.expiresAt).label;
        return sort.dir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
      }
      const ka = String(a[sort.key] ?? "");
      const kb = String(b[sort.key] ?? "");
      return sort.dir === "asc" ? ka.localeCompare(kb) : kb.localeCompare(ka);
    });

    return out;
  }, [rows, q, sort]);

  function toggleSort(key: keyof DocRow | "status") {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  return (
    <div className="ui-page">
      <div className="ui-section-title">Document register</div>

      {rows.length === 0 && (
        <div style={{ marginBottom: 16 }}>
          <EmptyState
            title="Nog geen documenten in het register"
            body="Documenten worden waardevoller zodra ze gekoppeld zijn aan assets of personen. Begin met een polis, factuur, contract of garantiebewijs."
            actionLabel="Document toevoegen"
            secondaryLabel="Eerst asset toevoegen"
            onAction={() => openPamTab("docs")}
            onSecondary={() => openPamTab("assets")}
          />
        </div>
      )}

      <div className="ui-toolbar">
        <input placeholder="Zoeken…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="spacer" />
        <small>{filtered.length} resultaten</small>
      </div>

      <div className="ui-table-wrap">
        <table className="ui-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort("title")}>Titel</th>
              <th onClick={() => toggleSort("type")}>Type</th>
              <th onClick={() => toggleSort("number")}>Nummer</th>
              <th onClick={() => toggleSort("assetNames")}>Assets</th>
              <th onClick={() => toggleSort("ownerName")}>Persoon</th>
              <th onClick={() => toggleSort("issuedAt")}>Uitgegeven</th>
              <th onClick={() => toggleSort("expiresAt")}>Geldig tot</th>
              <th onClick={() => toggleSort("status")}>Status</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const st = expiryStatus(r.expiresAt);
              return (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{r.type || ""}</td>
                  <td>{r.number || ""}</td>
                  <td>
                    {r.assetNames?.length ? (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {r.assetNames.map((assetName) => (
                          <span key={assetName} className="ui-badge">{assetName}</span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: "#60718A" }}>Geen asset gekoppeld</span>
                    )}
                  </td>
                  <td>{r.ownerName || ""}</td>
                  <td>{r.issuedAt || ""}</td>
                  <td>{r.expiresAt || ""}</td>
                  <td><span className={st.cls}>{st.label}</span></td>
                  <td>
                    <button className="ui-btn ui-btn--sm ui-btn--danger" onClick={() => handleDelete(r.id)}>
                      Verwijderen
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9}>
                  <em>
                    {rows.length === 0
                      ? "Nog geen documenten vastgelegd."
                      : "Geen documenten gevonden binnen deze zoekopdracht."}
                  </em>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
