/* @ts-nocheck */
import React, { useMemo, useState } from "react";
import AssetForm from "./AssetForm";
import { loadRegister, saveRegister } from "../lib/assetNumber";
import { docsForAsset, linkDocToAsset, unlinkDocFromAsset } from "../lib/docsStore";
import type { Asset } from "../types";
import { ENV, DEBUG, API_URL, STORAGE_KEY } from "../lib/config";
import { getPerson } from "../lib/peopleStore";

/** Lees alle documenten rechtstreeks uit localStorage (veilig, geen import-gedoe). */
function getAllDocsFromStorage(): Array<any> {
  try {
    const raw = localStorage.getItem("pam-docs-v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const docs = Array.isArray(parsed?.docs) ? parsed.docs : (Array.isArray(parsed) ? parsed : []);
    return docs;
  } catch {
    return [];
  }
}

/** Sla assets op — werkt met beide saveRegister-signatures (met/zonder wrapper). */
function persistAssets(nextAssets: Asset[]) {
  try {
    const current = loadRegister() as any;
    if (current && typeof current === "object" && "assets" in current) {
      try {
        (saveRegister as any)({ ...current, assets: nextAssets });
        return;
      } catch {}
    }
    (saveRegister as any)(nextAssets as any);
  } catch {}
}

export default function AssetsPanel() {
  const [assets, setAssets] = useState<Asset[]>(()  => {
    try {
      const reg: any = loadRegister();
      return Array.isArray(reg?.assets) ? (reg.assets as Asset[]) : [];
    } catch {
      return [];
    }
  });
  const [docs, setDocs] = useState<any[]>(() => getAllDocsFromStorage());
  const [selectedDocByAsset, setSelectedDocByAsset] = useState<Record<string, string>>({});

  const refreshAssets = () => setAssets(loadRegister()?.assets ?? []);
  const refreshDocs = () => setDocs(getAllDocsFromStorage());

  const removeAt = (originalIndex: number) => {
    const next = assets.slice();
    next.splice(originalIndex, 1);
    persistAssets(next);
    setAssets(next);
  };

  const handleDelete = (originalIndex: number) => {
    if (!window.confirm("Weet je zeker dat je dit asset wilt verwijderen?")) return;
    removeAt(originalIndex);
  };

  const handleLinkDoc = (assetNumber: string) => {
    const docId = selectedDocByAsset[assetNumber];
    if (!docId) { alert("Kies eerst een document."); return; }
    // docsStore wrapper koppelt zowel via number als via id (compat)
    linkDocToAsset(docId, assetNumber);
    setSelectedDocByAsset(prev => ({ ...prev, [assetNumber]: "" }));
    refreshDocs();
  };

  const handleUnlinkDoc = (assetNumber: string, docId: string) => {
    unlinkDocFromAsset(docId, assetNumber);
    refreshDocs();
  };

  // display-lijst met originele index (nieuw -> oud)
  const display = useMemo<{ a: Asset; originalIndex: number }[]>(
    () => assets.map((a, i) => ({ a, originalIndex: i })).slice().reverse(),
    [assets]
  );

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Linker kolom: formulier voor nieuw asset */}
      <div className="border rounded p-4">
        <AssetForm onCreated={() => { refreshAssets(); }} />
      </div>

      {/* Rechter kolom: register */}
      <div>
        <h2 className="font-semibold mb-2">Register</h2>

        {assets.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Nog geen assets in het register.</p>
        ) : (
          <ul className="space-y-3">
            {display.map(({ a, originalIndex }, idx) => {
              const linkedDocs = docsForAsset(a.assetNumber); // compat: werkt op number/id

              return (
                <li key={(a.id || `${a.assetNumber}-${originalIndex}` || idx).toString()} className="border rounded p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm text-gray-600 truncate">{a.assetNumber}</div>
                      <div className="font-medium truncate">{a.name || a.category}</div>
                      {a.type && <div className="text-xs text-gray-500">Type: {a.type}</div>}

                      {/* BADGES: personen */}
                      <div className="text-xs text-gray-700 mt-2 flex flex-wrap gap-2">
                        {(a.ownerIds ?? []).map(pid => (
                          <span key={`owner-${pid}`} className="px-2 py-0.5 rounded-full border">
                            owner: {getPerson(pid)?.fullName ?? "—"}
                          </span>
                        ))}
                        {(a.watcherIds ?? []).map(pid => (
                          <span key={`watch-${pid}`} className="px-2 py-0.5 rounded-full border">
                            watch: {getPerson(pid)?.fullName ?? "—"}
                          </span>
                        ))}
                        {(!a.ownerIds || a.ownerIds.length === 0) &&
                         (!a.watcherIds || a.watcherIds.length === 0) && (
                          <span className="text-gray-500">Nog geen personen gekoppeld.</span>
                        )}
                      </div>
                      {/* Personen-badges bij dit asset */}
{(a.ownerIds?.length || a.watcherIds?.length) ? (
  <div className="mt-2 text-xs text-gray-700 flex flex-wrap gap-2">
    {(a.ownerIds ?? []).map((pid) => (
      <span key={`owner-${pid}`} className="px-2 py-0.5 rounded-full border">
        owner: {getPerson(pid)?.fullName ?? "—"}
      </span>
    ))}
    {(a.watcherIds ?? []).map((pid) => (
      <span key={`watch-${pid}`} className="px-2 py-0.5 rounded-full border">
        watcher: {getPerson(pid)?.fullName ?? "—"}
      </span>
    ))}
  </div>
) : (
  <div className="mt-2 text-xs text-gray-500">
    Nog geen personen gekoppeld.
  </div>
)}

                      {/* Gekoppelde documenten */}
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500">Documenten:</span>{" "}
                        {Array.isArray(linkedDocs) && linkedDocs.length > 0
                          ? linkedDocs.map(d => (d.title || d.fileName || d.filename || "document")).join(", ")
                          : "geen"}
                      </div>

                      {Array.isArray(linkedDocs) && linkedDocs.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {linkedDocs.map(d => (
                            <button
                              key={d.id}
                              className="text-red-600 hover:text-red-800 text-xs underline"
                              onClick={() => handleUnlinkDoc(a.assetNumber, d.id)}
                            >
                              Ontkoppel “{d.title || d.fileName || d.filename || "document"}”
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <button
                        onClick={() => handleDelete(originalIndex)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        aria-label={`Verwijder asset ${a.assetNumber ?? ""}`}
                      >
                        Verwijder
                      </button>
                    </div>
                  </div>

                  {/* Koppel: kies document → koppel */}
                  <div className="mt-3 flex gap-2">
                    <select
                      className="border rounded px-2 py-1"
                      value={selectedDocByAsset[a.assetNumber] ?? ""}
                      onChange={e =>
                        setSelectedDocByAsset(prev => ({ ...prev, [a.assetNumber]: e.target.value }))
                      }
                    >
                      <option value="">— Kies document —</option>
                      {docs.map(d => (
                        <option key={d.id} value={d.id}>
                          {(d.title || d.fileName || d.filename || "document") +
                            (d.fileName && d.title ? ` (${d.fileName})` : "")}
                        </option>
                      ))}
                    </select>
                    <button
                      className="border rounded px-3"
                      onClick={() => handleLinkDoc(a.assetNumber)}
                      disabled={!selectedDocByAsset[a.assetNumber]}
                    >
                      Koppel document
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
