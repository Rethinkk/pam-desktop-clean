/* @ts-nocheck */
import React, { useMemo, useState } from "react";
import AssetForm from "./AssetForm";
import { loadRegister, saveRegister } from "../lib/assetNumber";
import { linkDocToAsset, unlinkDocFromAsset, docsForAsset } from "../lib/docsStore";
import type { Asset } from "../types";
import { ENV, DEBUG, API_URL, STORAGE_KEY } from "../lib/config";

// --- Helpers ---------------------------------------------------------------

/** Lees alle documenten rechtstreeks uit localStorage (veilig, geen import-gedoe). */
function getAllDocsFromStorage(): Array<any> {
  try {
    const raw = localStorage.getItem("pam-docs-v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.docs) ? parsed.docs : [];
  } catch {
    return [];
  }
}

/** Sla assets op — werkt met beide saveRegister-signatures (met/zonder wrapper). */
function persistAssets(nextAssets: Asset[]) {
  try {
    const current = loadRegister() as any;
    if (current && typeof current === "object" && "assets" in current) {
      // saveRegister verwacht waarschijnlijk een object met { assets }
      try {
        (saveRegister as any)({ ...current, assets: nextAssets });
        return;
      } catch {
        // val terug op array-signature
      }
    }
    // saveRegister verwacht mogelijk direct de array
    (saveRegister as any)(nextAssets as any);
  } catch {
    // Laat falen stil vallen; UI blijft in ieder geval up-to-date in state
  }
}

// --------------------------------------------------------------------------

export default function AssetsPanel() {
  const [assets, setAssets] = useState<Asset[]>(()  => {
    try {
 const reg: any = loadRegister();
return Array.isArray(reg?.assets) ? (reg.assets as Asset[])  :  [];
} catch {
return [];
 }
  });
  const [docs, setDocs] = useState<any[]>(
    () => getAllDocsFromStorage()
  );
  const [selectedDocByAsset, setSelectedDocByAsset] = useState<Record<string, string>>({});

  const refreshAssets = () => setAssets(loadRegister()?.assets ?? []);
  const refreshDocs = () => setDocs(getAllDocsFromStorage());

  // Verwijder op originele index en schrijf meteen weg (robust tegen reverse-weergave)
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
    if (!docId) {
      alert("Kies eerst een document.");
      return;
    }
    linkDocToAsset(docId, assetNumber);
    setSelectedDocByAsset(prev => ({ ...prev, [assetNumber]: "" }));
    refreshDocs();
  };

  const handleUnlinkDoc = (assetNumber: string, docId: string) => {
    unlinkDocFromAsset(docId, assetNumber);
    refreshDocs();
  };

  // Maak display-lijst met originele index vastgeklikt (we tonen nieuw → oud)
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
              // Gekoppelde documenten (uit store-functie, leest localStorage)
              const linkedDocs = (docsForAsset as (n: string) => any[])(a.assetNumber);

              return (
                <li
                  key={(a.id || `${a.assetNumber}-${originalIndex}` || idx).toString()}
                  className="border rounded p-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Linkerblok: asset meta */}
                    <div className="min-w-0">
                      <div className="text-sm text-gray-600 truncate">{a.assetNumber}</div>
                      <div className="font-medium truncate">{a.name || a.category}</div>
                      {a.type && (
                        <div className="text-xs text-gray-500">
                          Type: {a.type}
                        </div>
                      )}

                      {/* Lijst gekoppelde documenten (namen) */}
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500">Documenten:</span>{" "}
                        {Array.isArray(linkedDocs) && linkedDocs.length > 0
                          ? linkedDocs.map(d => (d.title || d.filename || "document")).join(", ")
                          : "geen"}
                      </div>

                      {/* Ontkoppel knoppen per document */}
                      {Array.isArray(linkedDocs) && linkedDocs.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {linkedDocs.map(d => (
                            <button
                              key={d.id}
                              className="text-red-600 hover:text-red-800 text-xs underline"
                              onClick={() => handleUnlinkDoc(a.assetNumber, d.id)}
                            >
                              Ontkoppel “{d.title || d.filename || "document"}”
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Rechterblok: acties */}
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
                        setSelectedDocByAsset(prev => ({
                          ...prev,
                          [a.assetNumber]: e.target.value,
                        }))
                      }
                    >
                      <option value="">— Kies document —</option>
                      {docs.map(d => (
                        <option key={d.id} value={d.id}>
                          {(d.title || d.filename || "document") +
                            (d.filename && d.title ? ` (${d.filename})` : "")}
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
