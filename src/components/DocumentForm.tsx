/* @ts-nocheck */
import React, { useEffect, useMemo, useState } from "react";
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

  const [linkedAssetId, setLinkedAssetId] = useState<string | undefined>(undefined);
  const [uploadedById, setUploadedById] = useState<string | undefined>(undefined);
  const [recipientIds, setRecipientIds] = useState<string[]>([]);

  const [assets, setAssets] = useState<Asset[]>([]);
  useEffect(() => { setAssets(loadRegister()?.assets ?? []); }, []);
  const assetOptions = useMemo(
    () => assets.map(a => ({ id: a.id, label: `${a.assetNumber ?? "—"} — ${a.name ?? "—"}` })),
    [assets]
  );

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) { alert("Bestand is groter dan 4MB."); e.target.value = ""; return; }
    setFileName(f.name); setFileSize(f.size); setMimeType(f.type || "application/octet-stream");
    const r = new FileReader(); r.onload = () => setFileDataUrl(String(r.result || "")); r.readAsDataURL(f);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return alert("Titel is verplicht.");
    if (!fileDataUrl) return alert("Bestand is verplicht (max 4MB).");

    const now = new Date().toISOString();
    const doc: DocumentItem = {
      id: crypto.randomUUID(),
      docNumber: generateDocNumber(),
      title: title.trim(),
      fileName, fileSize, mimeType, fileDataUrl,
      assetIds: linkedAssetId ? [linkedAssetId] : [],
      uploadedById, recipientIds,
      createdAt: now, updatedAt: now,
    };
    persistDoc(doc);
    onCreated?.(doc);

    setTitle(""); setFileName(""); setFileSize(0); setMimeType(""); setFileDataUrl("");
    setLinkedAssetId(undefined); setUploadedById(undefined); setRecipientIds([]);
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-3">
      <h2 className="font-semibold text-lg mb-1">Nieuw document</h2>

      <div>
        <label className="label">Titel *</label>
        <input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Bijv. Polisblad.pdf" />
      </div>

      <div>
        <label className="label">Bestand *</label>
        <input className="input" type="file" onChange={onFileChange} />
        {fileName && <div className="text-xs mt-1">Gekozen: {fileName} · {(fileSize/1024).toFixed(0)} KB · {mimeType}</div>}
      </div>

      <div>
        <label className="label">Koppel aan asset (optioneel)</label>
        <select className="input" value={linkedAssetId ?? ""} onChange={e=>setLinkedAssetId(e.target.value || undefined)}>
          <option value="">— geen koppeling —</option>
          {assetOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
        </select>
      </div>

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
