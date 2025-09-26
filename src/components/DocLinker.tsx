/* @ts-nocheck */
import React, { useMemo, useState } from "react";
import { loadRegister } from "../lib/assetNumber";
import {
  loadDocs,
  linkDocToAsset,
  unlinkDocFromAsset,
} from "../lib/docsStore";
import type { DocumentItem } from "../docTypes";

export default function DocLinker() {
  const [docs, setDocs] = useState<DocumentItem[]>(() => loadDocs().documents ?? []);
  const [assets] = useState(() => (loadRegister()?.assets ?? []));
  const [selectedAssetByDoc, setSelectedAssetByDoc] = useState<Record<string, string>>({});

  const refresh = () => setDocs(loadDocs().documents ?? []);

  const assetOptions = useMemo(
    () => assets.map(a => ({ value: a.assetNumber, label: `${a.assetNumber} — ${a.name}` })),
    [assets]
  );

  const handleLink = (docId: string) => {
    const assetNumber = selectedAssetByDoc[docId];
    if (!assetNumber) {
      alert("Kies eerst een asset.");
      return;
    }
    linkDocToAsset(docId, assetNumber);
    refresh();
  };

  const handleUnlink = (docId: string, assetNumber: string) => {
    unlinkDocFromAsset(docId, assetNumber);
    refresh();
  };

  return (
    <div className="mt-6">
      <h3 className="font-semibold mb-2">Koppelingen</h3>
      {(!docs || docs.length === 0) ? (
        <p className="text-sm text-gray-600">Nog geen documenten om te koppelen.</p>
      ) : (
        <ul className="space-y-3">
          {docs.map(d => (
            <li key={d.id} className="border rounded p-3">
              <div className="font-medium">{d.title}</div>
              <div className="text-sm text-gray-600">{d.filename ?? "—"}</div>

              <div className="mt-2 text-sm">
                <span className="text-gray-500">Gekoppeld aan:</span>{" "}
                {(d.assetNumbers?.length ?? 0) === 0
                  ? "geen"
                  : d.assetNumbers!.join(", ")}
              </div>

              <div className="mt-3 flex gap-2">
                <select
                  className="border rounded px-2 py-1"
                  value={selectedAssetByDoc[d.id] ?? ""}
                  onChange={e =>
                    setSelectedAssetByDoc(prev => ({ ...prev, [d.id]: e.target.value }))
                  }
                  aria-label={`Kies asset voor document ${d.title}`}
                >
                  <option value="">— Kies asset —</option>
                  {assetOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <button className="btn" onClick={() => handleLink(d.id)}>
                  Koppel aan asset
                </button>
              </div>

              {d.assetNumbers && d.assetNumbers.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {d.assetNumbers.map(n => (
                    <button
                      key={n}
                      className="text-red-600 hover:text-red-800 text-sm underline"
                      onClick={() => handleUnlink(d.id, n)}
                    >
                      Ontkoppel {n}
                    </button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
