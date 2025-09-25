import React, { useEffect, useMemo, useState} from "react";
import DocumentForm from "./DocumentForm";
import { loadDocs } from "../lib/docsStore";
import { DocumentItem } from "../docTypes";
import { loadRegister } from "../lib/assetNumber";

export type AssetRef = { id: string; name: string };
export type PersonRef = { id: string; name: string };



type Doc = {
  id: string;
  filename: string;
  size: number;
  uploadedAt: string; // ISO
  assetId?: string;
  personId?: string;
  notes?: string;
};

const DOCS_LS_KEY = "pam-docs-v1";

type Props = {
  assets?: AssetRef[];   // optioneel, voor koppelen
  people?: PersonRef[];  // optioneel, voor koppelen
};

export default function DocumentsPanel({ assets = [], people = [] }: Props) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [fileList, setFileList] = useState<FileList | null>(null);
  const [assetId, setAssetId] = useState<string>("");
  const [personId, setPersonId] = useState<string>("");
  const [notes, setNotes] = useState("");

  // load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DOCS_LS_KEY);
      if (raw) setDocs(JSON.parse(raw));
    } catch {}
  }, []);
  // persist
  useEffect(() => {
    localStorage.setItem(DOCS_LS_KEY, JSON.stringify(docs));
  }, [docs]);

  const onSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileList(e.target.files);
  };

  const onUpload = () => {
    if (!fileList || fileList.length === 0) return;

    const now = new Date().toISOString();
    const newDocs: Doc[] = Array.from(fileList).map((f) => ({
      id: crypto.randomUUID(),
      filename: f.name,
      size: f.size,
      uploadedAt: now,
      assetId: assetId || undefined,
      personId: personId || undefined,
      notes: notes || undefined,
    }));
    setDocs((prev) => [...newDocs, ...prev]);
    // reset
    setFileList(null);
    const inp = document.getElementById("doc-file-input") as HTMLInputElement | null; if (ind) inp.value = "";
    setNotes("");
  };

  const onDelete = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const assetMap = useMemo(
    () => Object.fromEntries(assets.map((a) => [a.id, a.name])),
    [assets]
  );
  const personMap = useMemo(
    () => Object.fromEntries(people.map((p) => [p.id, p.name])),
    [people]
  );

  return (
    <div className="stack">
      <div className="card">
        <div className="form-grid">
          <div className="col-12">
            <label>Bestanden</label>
            <input
              id="doc-file-input"
              type="file"
              multiple
              onChange={onSelectFiles}
            />
          </div>

          <div className="col-6">
            <label>Koppel aan asset</label>
            <select value={assetId} onChange={(e) => setAssetId(e.target.value)}>
              <option value="">— geen koppeling —</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6">
            <label>Koppel aan persoon</label>
            <select value={personId} onChange={(e) => setPersonId(e.target.value)}>
              <option value="">— geen koppeling —</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12">
            <label>Notities</label>
            <textarea
              rows={3}
              placeholder="Bijv. garantiecertificaat, factuur, handleiding…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="col-12">
            <button onClick={onUpload}>Upload registreren</button>
          </div>
        </div>
      </div>

      <div className="register">
        <h2>Geregistreerde documenten</h2>
        {docs.length === 0 ? (
          <p className="mt-8">Nog geen documenten geregistreerd.</p>
        ) : (
          <ul>
            {docs.map((d) => (
              <li key={d.id}>
                <strong>{d.filename}</strong>
                <span>
                  {Math.round(d.size / 1024)} KB •{" "}
                  {new Date(d.uploadedAt).toLocaleString()}
                </span>
                <span>
                  {d.assetId ? `Asset: ${assetMap[d.assetId] ?? d.assetId}` : "—"}
                  {"  |  "}
                  {d.personId
                    ? `Persoon: ${personMap[d.personId] ?? d.personId}`
                    : "—"}
                </span>
                {d.notes && <span>Notities: {d.notes}</span>}
                <div className="mt-8">
                  <button className="btn-secondary" onClick={() => onDelete(d.id)}>
                    Verwijderen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}