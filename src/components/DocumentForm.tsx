/* @ts-nocheck */
import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import { generateDocNumber, persistDoc } from "../lib/docsStore";
import { loadRegister } from "../lib/assetNumber";
import type { Asset, DocumentItem } from "../types";
import { SinglePersonSelect, MultiPersonSelect } from "./PersonSelect";

type Props = { onCreated?: (d: DocumentItem) => void };

export default function DocumentForm({ onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [mimeType, setMimeType] = useState("");
  const [fileDataUrl, setFileDataUrl] = useState("");

  // NIEUW: koppelingen
  const [linkedAssetId, setLinkedAssetId] = useState<string | undefined>(undefined);
  const [uploadedById, setUploadedById] = useState<string | undefined>(undefined);
  const [recipientIds, setRecipientIds] = useState<string[]>([]);

  const [assets, setAssets] = useState<Asset[]>([]);
  useEffect(() => { setAssets(loadRegister().assets ?? []); }, []);

  const assetOptions = useMemo(
    () => assets.map(a => ({ id: a.id, label: `${a.assetNumber ?? "—"} — ${a.name}` })),
    [assets]
  );

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) {
      alert("Bestand is groter dan 4MB. Kies kleiner bestand of sla alleen metadata op.");
      e.target.value = "";
      return;
    }
    setFileName(f.name);
    setFileSize(f.size);
    setMimeType(f.type || "application/octet-stream");
    const reader = new FileReader();
    reader.onload = () => setFileDataUrl(String(reader.result || ""));
    reader.readAsDataURL(f);
  }

  function validate(): string[] {
    const errs: string[] = [];
    if (!title.trim()) errs.push("Titel is verplicht.");
    if (!fileDataUrl) errs.push("Bestand is verplicht (max 4MB).");
    return errs;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (errs.length) { alert(errs.join("\n")); return; }

    const now = new Date().toISOString();
    const doc: DocumentItem = {
      id: uuid(),
      docNumber: generateDocNumber(),      // jouw bestaande nummer
      title: title.trim(),
      fileName,
      fileSize,
      mimeType,
      fileDataUrl,                         // je bewaart de data-URL
      // nieuwe en consistente koppelingen
      assetIds: linkedAssetId ? [linkedAssetId] : [],
      uploadedById,
      recipientIds,
      createdAt: now,
      updatedAt: now,
    };

    persistDoc(doc);
    onCreated?.(doc);

    // reset
    setTitle("");
    setFileName(""); setFileSize(0); setMimeType(""); setFileDataUrl("");
    setLinkedAssetId(undefined);
    setUploadedById(undefined);
    setRecipientIds([]);
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-3">
      <h2 className="font-semibold text-lg mb-1">Nieuw document</h2>

      <div>
        <label className="label">Titel *</label>
        <input
          className="input"
          value={title}
          onChange={e=>setTitle(e.target.value)}
          placeholder="Bijv. Polisblad-ABN-2025.pdf"
        />
      </div>

      <div>
        <label className="label">Bestand *</label>
        <input className="input" type="file" onChange={onFileChange} />
        {fileName && (
          <div className="text-xs" style={{ marginTop: 6 }}>
            Gekozen: {fileName} · {(fileSize/1024).toFixed(0)} KB · {mimeType}
          </div>
        )}
      </div>

      <div>
        <label className="label">Koppel aan asset (optioneel)</label>
        <select
          className="input"
          value={linkedAssetId ?? ""}
          onChange={e => setLinkedAssetId(e.target.value || undefined)}
        >
          <option value="">— geen koppeling —</option>
          {assetOptions.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Personen-koppelingen */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="label">Geüpload door</label>
          <SinglePersonSelect value={uploadedById} onChange={setUploadedById} />
        </div>
        <div>
          <label className="label">Ontvangers</label>
          <MultiPersonSelect values={recipientIds} onChange={setRecipientIds} />
        </div>
      </div>

      <button type="submit" className="btn primary">Opslaan in documentregister</button>
    </form>
  );
}