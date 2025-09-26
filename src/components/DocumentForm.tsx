/* @ts-nocheck */
import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import { DocumentItem } from "../docTypes";
import { generateDocNumber, loadDocs, persistDoc } from "../lib/docsStore";
import { loadRegister } from "../lib/assetNumber";
import { Asset } from "../types";

type Props = { onCreated?: (d: DocumentItem) => void };

export default function DocumentForm({ onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [mimeType, setMimeType] = useState("");
  const [fileDataUrl, setFileDataUrl] = useState("");

  const [linkedAssetId, setLinkedAssetId] = useState<string>("");
  const [personRole, setPersonRole] = useState<'uploaded_by'|'recipient'|''>('');
  const [personName, setPersonName] = useState("");
  const [personEmail, setPersonEmail] = useState("");

  const [assets, setAssets] = useState<Asset[]>([]);
  useEffect(() => { setAssets(loadRegister().assets); }, []);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) { // 4MB limiet
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
    if (personRole && !personName.trim()) errs.push("Naam bij persoon is verplicht als een rol is gekozen.");
    return errs;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (errs.length) { alert(errs.join("\n")); return; }

    const doc: DocumentItem = {
      id: uuid(),
      docNumber: generateDocNumber(),
      title: title.trim(),
      fileName,
      fileSize,
      mimeType,
      fileDataUrl,
      linkedAssetId: linkedAssetId || undefined,
      personRole: personRole || undefined,
      personName: personRole ? personName.trim() : undefined,
      personEmail: personRole ? personEmail.trim() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    persistDoc(doc);
    onCreated?.(doc);

    setTitle("");
    setFileName(""); setFileSize(0); setMimeType(""); setFileDataUrl("");
    setLinkedAssetId(""); setPersonRole(""); setPersonName(""); setPersonEmail("");
  }

  const assetOptions = useMemo(() => assets.map(a => ({ id: a.id, label: `${a.assetNumber} — ${a.name}` })), [assets]);

  return (
    <form onSubmit={onSubmit} className="card space-y-3">
      <div>
        <label className="label">Titel *</label>
        <input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Bijv. Polisblad-ABN-2025.pdf" />
      </div>

      <div>
        <label className="label">Bestand *</label>
        <input className="input" type="file" onChange={onFileChange} />
        {fileName && (
          <div className="text-xs" style={{marginTop:6}}>
            Gekozen: {fileName} · {(fileSize/1024).toFixed(0)} KB · {mimeType}
          </div>
        )}
      </div>

      <div>
        <label className="label">Koppel aan asset (optioneel)</label>
        <select className="input" value={linkedAssetId} onChange={e=>setLinkedAssetId(e.target.value)}>
          <option value="">— geen koppeling —</option>
          {assetOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
        </select>
      </div>

      <fieldset className="card" style={{padding:'12px'}}>
        <legend className="label">Persoon (optioneel)</legend>
        <div className="grid-2">
          <div>
            <label className="label">Rol</label>
            <select className="input" value={personRole} onChange={e=>setPersonRole(e.target.value as any)}>
              <option value="">— geen —</option>
              <option value="uploaded_by">Geüpload door</option>
              <option value="recipient">Ontvanger</option>
            </select>
          </div>
          <div>
            <label className="label">Naam</label>
            <input className="input" value={personName} onChange={e=>setPersonName(e.target.value)} placeholder="Naam persoon" />
          </div>
          <div>
            <label className="label">E-mail (optioneel)</label>
            <input className="input" type="email" value={personEmail} onChange={e=>setPersonEmail(e.target.value)} placeholder="naam@domein.nl" />
          </div>
        </div>
      </fieldset>

      <button type="submit" className="btn primary">Opslaan in documentregister</button>
    </form>
  );
}
