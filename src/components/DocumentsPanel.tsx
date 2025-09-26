import React, { useMemo, useState } from "react";
import { addDoc, getDocs, linkDocToAsset, unlinkDocFromAsset, removeDoc } from "../lib/docsStore";
import { loadRegister } from "../lib/assetNumber";
import type { DocumentItem } from "../types";

function getAssetNumber(a: any) {
  return a?.assetNumber || a?.number || a?.code || a?.id || "";
}
function getAssetLabel(a: any) {
  const an = getAssetNumber(a);
  const nm = a?.name || a?.category || "";
  return nm ? `${an} — ${nm}` : an;
}

export default function DocumentsPanel() {
  const [docs, setDocs] = useState<DocumentItem[]>(() => getDocs());
  const [uploadedBy, setUploadedBy] = useState("");
  const [recipients, setRecipients] = useState("");
  const [notes, setNotes] = useState("");

  // assets uit register voor koppeling (robust default)
  const assets = useMemo<any[]>(() => (loadRegister()?.assets ?? []), []);
  const [linkTarget, setLinkTarget] = useState<Record<string, string>>({}); // docId -> assetNumber

  const refresh = () => setDocs(getDocs());

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      await addDoc(f, {
        uploadedBy: uploadedBy || undefined,
        recipients: recipients
          .split(",")
          .map(s => s.trim())
          .filter(Boolean),
        notes: notes || undefined,
      });
    }
    setUploadedBy("");
    setRecipients("");
    setNotes("");
    (e.target as any).value = "";
    refresh();
  }

  function handleLink(docId: string) {
    const an = linkTarget[docId];
    if (!an) return;
    linkDocToAsset(docId, an);
    setLinkTarget(prev => ({ ...prev, [docId]: "" }));
    refresh();
  }

  function handleUnlink(docId: string, assetNumber: string) {
    unlinkDocFromAsset(docId, assetNumber);
    refresh();
  }

  function handleDelete(docId: string) {
    if (confirm("Dit document verwijderen?")) {
      removeDoc(docId);
      refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="border rounded p-4">
        <h2 className="font-semibold mb-3">Document uploaden</h2>
        <div className="grid md:grid-cols-3 gap-3 mb-3">
          <input
            className="border rounded p-2"
            placeholder="Geüpload door (optioneel)"
            value={uploadedBy}
            onChange={e => setUploadedBy(e.target.value)}
          />
          <input
            className="border rounded p-2"
            placeholder="Ontvangers, komma-gescheiden (optioneel)"
            value={recipients}
            onChange={e => setRecipients(e.target.value)}
          />
          <input
            className="border rounded p-2"
            placeholder="Notitie (optioneel)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
        <input
          type="file"
          multiple
          onChange={handleUpload}
          className="block"
        />
        <p className="text-xs text-gray-500 mt-2">
          Bestanden worden lokaal (base64) opgeslagen in je browseropslag.
        </p>
      </div>

      <div>
        <h2 className="font-semibold mb-2">Documenten</h2>
        <ul className="space-y-3">
          {docs.map(d => (
            <li key={d.id} className="border rounded p-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium">{d.filename}</div>
                  <div className="text-xs text-gray-600">
                    {Math.round(d.size / 1024)} KB · {d.mime} · {new Date(d.uploadedAt).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">
                    {d.uploadedBy ? <>Uploader: {d.uploadedBy} · </> : null}
                    {d.recipients?.length ? <>Ontvangers: {d.recipients.join(", ")} · </> : null}
                    {d.notes ? <>Notitie: {d.notes}</> : null}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {d.assetNumbers.map(an => (
                      <span
                        key={an}
                        className="inline-flex items-center gap-2 text-xs border rounded-full px-2 py-1"
                      >
                        {an}
                        <button
                          className="text-red-600"
                          onClick={() => handleUnlink(d.id, an)}
                          title="Koppeling verwijderen"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="min-w-56">
                  <div className="flex gap-2">
                    <select
                      className="border rounded p-2 w-full"
                      value={linkTarget[d.id] || ""}
                      onChange={e =>
                        setLinkTarget(prev => ({ ...prev, [d.id]: e.target.value }))
                      }
                      disabled={!assets.length}
                    >
                      <option value="">
                        {assets.length ? "Koppel aan asset…" : "Geen assets gevonden — maak er eerst één"}
                      </option>
                      {assets
                        .slice()
                        .reverse()
                        .map(a => {
                          const value = getAssetNumber(a);
                          if (!value) return null; // sla assets zonder herkenbare ID over
                          return (
                            <option key={a.id ?? value} value={value}>
                              {getAssetLabel(a)}
                            </option>
                          );
                        })}
                    </select>
                    <button
                      className="border rounded px-3"
                      onClick={() => handleLink(d.id)}
                      disabled={!assets.length || !linkTarget[d.id]}
                    >
                      Link
                    </button>
                  </div>

                  <button
                    className="text-xs text-red-700 mt-3"
                    onClick={() => handleDelete(d.id)}
                  >
                    Verwijder document
                  </button>
                </div>
              </div>

              {/* Optioneel: download/preview knop */}
              <details className="mt-2">
                <summary className="text-sm cursor-pointer">Voorbeeld / downloaden</summary>
                <div className="mt-2">
                  <a
                    href={d.dataUrl}
                    download={d.filename}
                    className="text-blue-700 underline"
                  >
                    Download {d.filename}
                  </a>
                </div>
              </details>
            </li>
          ))}
          {docs.length === 0 && (
            <li className="text-sm text-gray-500 italic">Nog geen documenten.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
