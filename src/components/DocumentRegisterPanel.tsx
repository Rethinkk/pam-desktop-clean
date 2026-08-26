/* @ts-nocheck */
import React from "react";
import { logAuditEvent } from "../lib/auditTrail";
import { buildDocumentContextExport, contextExportFilename } from "../lib/contextExport";
import { downloadJson } from "../lib/downloadJson";
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
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  fileDataUrl?: string;
  notes?: string;
  issuedAt?: string;  // yyyy-mm-dd
  expiresAt?: string; // yyyy-mm-dd
};

type AssetOption = {
  id: string;
  label: string;
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

function formatFileSize(size?: number) {
  if (!size) return "—";
  if (size < 1024) return `${size} bytes`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} kB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function fileKind(row: DocRow) {
  const mime = row.mimeType || "";
  const dataUrl = row.fileDataUrl || "";
  if (mime.startsWith("image/") || /^data:image\//.test(dataUrl)) return "image";
  if (mime === "application/pdf" || /^data:application\/pdf/.test(dataUrl)) return "pdf";
  if (
    mime.startsWith("text/") ||
    ["application/json", "application/xml"].includes(mime) ||
    /^data:text\//.test(dataUrl) ||
    /^data:application\/json/.test(dataUrl)
  ) {
    return "text";
  }
  return row.fileDataUrl ? "download" : "none";
}

function decodeTextDataUrl(dataUrl?: string) {
  if (!dataUrl) return "";
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return "";
  const meta = dataUrl.slice(0, comma);
  const payload = dataUrl.slice(comma + 1);
  try {
    if (meta.includes(";base64")) {
      return decodeURIComponent(
        Array.from(atob(payload))
          .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
          .join(""),
      );
    }
    return decodeURIComponent(payload);
  } catch {
    return "";
  }
}

export default function DocumentRegisterPanel() {
  const [rows, setRows] = React.useState<DocRow[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
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
        fileName: d.fileName ?? d.filename ?? "",
        fileSize: d.fileSize ?? d.size ?? 0,
        mimeType: d.mimeType ?? d.mime ?? "",
        fileDataUrl: d.fileDataUrl ?? d.dataUrl ?? "",
        notes: d.notes ?? "",
        issuedAt: d.issuedAt ?? d.issueDate ?? "",
        expiresAt: d.expiresAt ?? d.validUntil ?? d.expiryDate ?? "",
      })) as DocRow[];
      setRows(norm);
      if (selectedId && !norm.some((row) => row.id === selectedId)) setSelectedId(null);
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
    const row = rows.find((document) => document.id === id);
    if (!confirm("Weet je zeker dat je dit document wilt verwijderen?")) return;
    persistDelete(id);
    logAuditEvent({
      action: "document_deleted",
      entityType: "document",
      entityId: id,
      entityLabel: row?.title,
      summary: `Document '${row?.title ?? id}' verwijderd.`,
    });
    setRows((r) => r.filter((x) => x.id !== id));
    if (selectedId === id) setSelectedId(null);

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

  const selected = React.useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
  );

  function toggleSort(key: keyof DocRow | "status") {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  function selectDocument(row: DocRow) {
    setSelectedId(row.id);
    logAuditEvent({
      action: "document_viewed",
      entityType: "document",
      entityId: row.id,
      entityLabel: row.title,
      summary: `Document '${row.title}' bekeken.`,
    });
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
                <tr
                  key={r.id}
                  onClick={() => selectDocument(r)}
                  style={{ cursor: "pointer" }}
                >
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
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      className="ui-btn ui-btn--sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        selectDocument(r);
                      }}
                    >
                      Bekijken
                    </button>
                    <button
                      className="ui-btn ui-btn--sm ui-btn--danger"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(r.id);
                      }}
                    >
                      Verwijderen
                    </button>
                    </div>
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

      {selected && (
        <DocumentPreview row={selected} onClose={() => setSelectedId(null)} onUpdated={load} />
      )}
    </div>
  );
}

function DocumentPreview({
  row,
  onClose,
  onUpdated,
}: {
  row: DocRow;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const kind = fileKind(row);
  const isImage = kind === "image";
  const isPdf = kind === "pdf";
  const isText = kind === "text";
  const canPreview = Boolean(row.fileDataUrl && (isImage || isPdf || isText));
  const textPreview = isText ? decodeTextDataUrl(row.fileDataUrl).slice(0, 8000) : "";
  const status = expiryStatus(row.expiresAt);
  const [assetOptions, setAssetOptions] = React.useState<AssetOption[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = React.useState<string[]>(row.assetIds ?? []);

  React.useEffect(() => {
    const assets = assetRepository.load().assets as any[];
    setAssetOptions(
      assets
        .map((asset) => ({
          id: asset.id,
          label: [
            asset.name ?? asset.data?.naam ?? asset.data?.titel ?? asset.assetNumber ?? "Asset",
            asset.typeLabel ?? asset.type,
          ].filter(Boolean).join(" — "),
        }))
        .filter((asset) => asset.id && asset.label),
    );
  }, []);

  React.useEffect(() => {
    setSelectedAssetIds(row.assetIds ?? []);
  }, [row.id, row.assetIds]);

  function toggleAsset(assetId: string) {
    setSelectedAssetIds((ids) =>
      ids.includes(assetId) ? ids.filter((id) => id !== assetId) : [...ids, assetId],
    );
  }

  function saveAssetLinks() {
    const now = new Date().toISOString();
    const selected = new Set(selectedAssetIds);
    const nextDocs = documentRepository.all().map((document: any) =>
      document.id === row.id
        ? {
            ...document,
            assetIds: selectedAssetIds,
            updatedAt: now,
          }
        : document,
    );
    documentRepository.saveAll(nextDocs as any);

    const nextAssets = assetRepository.load().assets.map((asset: any) => {
      const documentIds = new Set(Array.isArray(asset.documentIds) ? asset.documentIds : []);
      if (selected.has(asset.id)) documentIds.add(row.id);
      else documentIds.delete(row.id);
      return {
        ...asset,
        documentIds: Array.from(documentIds),
        updatedAt: now,
      };
    });
    assetRepository.save({ assets: nextAssets });
    logAuditEvent({
      action: "document_linked",
      entityType: "document",
      entityId: row.id,
      entityLabel: row.title,
      summary: `Asset-koppeling voor document '${row.title}' bijgewerkt.`,
      metadata: {
        assetCount: selectedAssetIds.length,
      },
    });
    onUpdated();
    window.dispatchEvent(new CustomEvent("pam:toast", {
      detail: { message: "Documentkoppeling bijgewerkt", tone: "success" },
    }));
  }

  function exportDocumentContext() {
    const label = row.title || row.fileName || "document";
    const payload = buildDocumentContextExport(row.id);
    if (!payload) return;
    downloadJson(contextExportFilename("document", label), payload);
    logAuditEvent({
      action: "export_downloaded",
      entityType: "document",
      entityId: row.id,
      entityLabel: label,
      summary: `Context-export voor document '${label}' gedownload.`,
      metadata: {
        context: "document",
        assetCount: payload.counts.assets,
        personCount: payload.counts.people,
      },
    });
  }

  return (
    <div className="ui-card" style={{ marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <div className="ui-section-title" style={{ marginTop: 0 }}>Document bekijken</div>
          <h2 className="ui-h2" style={{ marginBottom: 4 }}>{row.title}</h2>
          <div className="ui-muted">{[row.type, row.fileName].filter(Boolean).join(" — ") || "Document"}</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
          <button className="ui-btn ui-btn--secondary ui-btn--sm" type="button" onClick={exportDocumentContext}>
            Context exporteren
          </button>
          <button className="ui-btn ui-btn--sm" onClick={onClose}>Sluiten</button>
        </div>
      </div>

      <div className="ui-grid cols-4" style={{ marginTop: 16 }}>
        <Meta label="Bestand" value={row.fileName || "—"} />
        <Meta label="Bestandsgrootte" value={formatFileSize(row.fileSize)} />
        <Meta label="Type" value={row.mimeType || row.type || "—"} />
        <Meta label="Status" value={status.label} />
      </div>

      <div className="ui-grid cols-4" style={{ marginTop: 12 }}>
        <Meta label="Persoon" value={row.ownerName || "—"} />
        <Meta label="Documentnummer" value={row.number || "—"} />
        <Meta label="Uitgegeven" value={row.issuedAt || "—"} />
        <Meta label="Geldig tot" value={row.expiresAt || "—"} />
      </div>

      <div style={{ marginTop: 14 }}>
        <strong style={{ display: "block", marginBottom: 8 }}>Koppeling met assets</strong>
        {row.assetNames?.length ? (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {row.assetNames.map((assetName) => (
              <span key={assetName} className="ui-badge">{assetName}</span>
            ))}
          </div>
        ) : (
          <div className="ui-empty" style={{ padding: 14 }}>
            <div className="ui-empty-title">Geen asset gekoppeld</div>
            <p className="ui-empty-body">
              Dit document staat nog los. Koppel het aan een asset om het dossier compleet te maken.
            </p>
          </div>
        )}
      </div>

      <div className="ui-field" style={{ marginTop: 14 }}>
        <label>Asset-koppeling aanpassen</label>
        <div
          style={{
            background: "#fff",
            border: "1px solid #DEDCD5",
            borderRadius: 12,
            display: "grid",
            gap: 8,
            maxHeight: 150,
            overflow: "auto",
            padding: 10,
          }}
        >
          {assetOptions.map((asset) => (
            <label key={asset.id} style={{ alignItems: "center", display: "flex", gap: 8, margin: 0 }}>
              <input
                checked={selectedAssetIds.includes(asset.id)}
                onChange={() => toggleAsset(asset.id)}
                style={{ width: "auto" }}
                type="checkbox"
              />
              <span>{asset.label}</span>
            </label>
          ))}
          {!assetOptions.length && <small>Er zijn nog geen assets beschikbaar.</small>}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button className="ui-btn ui-btn--primary" type="button" onClick={saveAssetLinks}>
            Koppeling opslaan
          </button>
        </div>
      </div>

      {row.notes && (
        <div style={{ marginTop: 14 }}>
          <strong style={{ display: "block", marginBottom: 6 }}>Notities</strong>
          <p className="ui-muted" style={{ margin: 0 }}>{row.notes}</p>
        </div>
      )}

      <div
        style={{
          background: "#F3F1EA",
          border: "1px solid #DEDCD5",
          borderRadius: 14,
          marginTop: 18,
          minHeight: 260,
          overflow: "hidden",
          padding: canPreview ? 0 : 18,
        }}
      >
        {isImage && row.fileDataUrl && (
          <img
            alt={row.title}
            src={row.fileDataUrl}
            style={{ display: "block", maxHeight: 520, objectFit: "contain", width: "100%" }}
          />
        )}
        {isPdf && row.fileDataUrl && (
          <iframe
            src={row.fileDataUrl}
            title={row.title}
            style={{ border: 0, display: "block", height: 520, width: "100%" }}
          />
        )}
        {isText && row.fileDataUrl && (
          <pre
            style={{
              color: "#123052",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: 13,
              lineHeight: 1.55,
              margin: 0,
              maxHeight: 520,
              overflow: "auto",
              padding: 18,
              whiteSpace: "pre-wrap",
            }}
          >
            {textPreview || "Tekstpreview kon niet worden gelezen."}
          </pre>
        )}
        {!canPreview && (
          <div>
            <strong>{row.fileDataUrl ? "Geen inline preview beschikbaar" : "Geen bestand opgeslagen"}</strong>
            <p className="ui-muted" style={{ margin: "8px 0 0" }}>
              {row.fileDataUrl
                ? "PAM heeft het bestand opgeslagen, maar dit bestandstype kan hier niet direct worden getoond. U kunt het bestand wel openen of downloaden."
                : "PAM heeft de documentgegevens opgeslagen. Voeg via Documenten een bestand toe als u hier ook de inhoud wilt bekijken."}
            </p>
          </div>
        )}
      </div>

      {row.fileDataUrl && (
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14, flexWrap: "wrap" }}>
          <a
            className="ui-btn ui-btn--primary"
            download={row.fileName || row.title}
            href={row.fileDataUrl}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none" }}
          >
            Openen / downloaden
          </a>
        </div>
      )}
      {!row.fileDataUrl && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
          <button className="ui-btn ui-btn--primary" type="button" onClick={() => openPamTab("docs")}>
            Nieuw document toevoegen
          </button>
        </div>
      )}
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
