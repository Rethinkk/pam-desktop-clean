/* @ts-nocheck */
import React, { useEffect, useMemo, useState } from "react";
import { loadRegister } from "../lib/assetNumber";
import {
  loadDocs,
  linkDocToAsset,
  unlinkDocFromAsset,
  linkDocToPerson,
  unlinkDocFromPerson,
} from "../lib/docsStore";
import type { Asset, DocumentItem } from "../types";
import { getPerson, allPeople } from "../lib/peopleStore";
import { SinglePersonSelect, MultiPersonSelect } from "./PersonSelect";

/** Backwards-compat normalizer (maakt arrays en velden aanwezig) */
function normalizeDoc(d: any): DocumentItem | null {
  if (!d) return null;
  return {
    ...d,
    fileName: d.fileName ?? d.filename ?? "",
    assetIds: Array.isArray(d.assetIds) ? d.assetIds : [],
    recipientIds: Array.isArray(d.recipientIds) ? d.recipientIds : [],
  };
}

/** Haal docs array uit diverse mogelijke vormen van loadDocs() */
function readDocsArray(): DocumentItem[] {
  const raw = loadDocs();
  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.docs)
    ? raw.docs
    : Array.isArray(raw?.documents)
    ? raw.documents
    : [];
  return arr.map(normalizeDoc).filter(Boolean) as DocumentItem[];
}

export default function DocLinker() {
  const [docs, setDocs] = useState<DocumentItem[]>(() => readDocsArray());
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetByDoc, setSelectedAssetByDoc] = useState<Record<string, string>>({});
  const people = allPeople();

  const refresh = () => setDocs(readDocsArray());

  useEffect(() => {
    const reg = loadRegister();
    setAssets(Array.isArray(reg?.assets) ? reg.assets : []);
  }, []);

  const assetsById = useMemo(() => {
    const m: Record<string, Asset> = {};
    for (const a of assets) m[a.id] = a;
    return m;
  }, [assets]);

  const assetOptions = useMemo(
    () => assets.map(a => ({ value: a.id, label: `${a.assetNumber ?? "—"} — ${a.name ?? "—"}` })),
    [assets]
  );

  /** ASSET-KOPPELINGEN */
  const handleLinkAsset = (docId: string) => {
    const assetId = selectedAssetByDoc[docId];
    if (!assetId) { alert("Kies eerst een asset."); return; }
    linkDocToAsset(docId, assetId);
    setSelectedAssetByDoc(prev => ({ ...prev, [docId]: "" }));
    refresh();
  };

  const handleUnlinkAsset = (docId: string, assetId: string) => {
    unlinkDocFromAsset(docId, assetId);
    refresh();
  };

  /** UPLOADER */
  const handleSetUploader = (docId: string, personId?: string) => {
    if (!personId) {
      const d = docs.find(x => x.id === docId);
      if (d?.uploadedById) unlinkDocFromPerson(docId, d.uploadedById, "uploadedBy");
    } else {
      linkDocToPerson(docId, personId, "uploadedBy");
    }
    refresh();
  };

  /** ONTVANGERS (multi): diff huidige vs nieuwe set */
  const handleSetRecipients = (doc: DocumentItem, nextIds: string[]) => {
    const prev = new Set(doc.recipientIds ?? []);
    const next = new Set(nextIds);
    for (const id of next) if (!prev.has(id)) linkDocToPerson(doc.id, id, "recipient");
    for (const id of prev) if (!next.has(id)) unlinkDocFromPerson(doc.id, id, "recipient");
    refresh();
  };

  return (
    <div className="mt-6">
      <h3 className="font-semibold mb-2">Koppelingen</h3>

      {docs.length === 0 ? (
        <p className="text-sm text-gray-600">Nog geen documenten om te koppelen.</p>
      ) : (
        <ul className="space-y-3">
          {docs.map(d => {
            const uploader = d.uploadedById ? getPerson(d.uploadedById) : undefined;
            const linkedAssetIds = d.assetIds ?? [];
            const selectableAssets = assets.filter(a => !linkedAssetIds.includes(a.id));

            return (
              <li key={d.id} className="border rounded p-3">
                <div className="font-medium">{d.title}</div>
                <div className="text-sm text-gray-600">{d.fileName || "—"}</div>

                {/* Huidige koppelingen (badges) */}
                <div className="mt-2 text-xs text-gray-700 flex flex-wrap gap-2">
                  {/* Uploader */}
                  {uploader && (
                    <span className="px-2 py-0.5 rounded-full border">
                      uploader: {uploader.fullName}
                    </span>
                  )}
                  {/* Ontvangers */}
                  {(d.recipientIds ?? []).map(pid => {
                    const p = getPerson(pid);
                    return (
                      <span key={pid} className="px-2 py-0.5 rounded-full border">
                        naar: {p?.fullName ?? "—"}
                      </span>
                    );
                  })}
                  {/* Assets */}
                  {linkedAssetIds.map(aid => {
                    const a = assetsById[aid];
                    const label = a ? `${a.assetNumber ?? "—"} — ${a.name ?? "—"}` : aid;
                    return (
                      <span key={aid} className="px-2 py-0.5 rounded-full border flex items-center gap-2">
                        asset: {label}
                        <button
                          type="button"
                          className="text-red-600"
                          onClick={() => handleUnlinkAsset(d.id, aid)}
                          aria-label={`Ontkoppel asset ${label}`}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                  {linkedAssetIds.length === 0 && (
                    <span className="text-gray-500">Nog geen asset-koppelingen.</span>
                  )}
                </div>

                {/* Bewerken: Uploader */}
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Geüpload door</label>
                    <SinglePersonSelect
                      value={d.uploadedById}
                      onChange={(pid) => handleSetUploader(d.id, pid)}
                      placeholder="— kies persoon —"
                    />
                  </div>

                  {/* Bewerken: Ontvangers */}
                  <div>
                    <label className="block text-sm mb-1">Ontvangers</label>
                    <MultiPersonSelect
                      values={d.recipientIds ?? []}
                      onChange={(ids) => handleSetRecipients(d, ids)}
                    />
                  </div>
                </div>

                {/* Bewerken: Asset-koppeling toevoegen */}
                <div className="mt-4 flex gap-2">
                  <select
                    className="border rounded px-2 py-1"
                    value={selectedAssetByDoc[d.id] ?? ""}
                    onChange={e =>
                      setSelectedAssetByDoc(prev => ({ ...prev, [d.id]: e.target.value }))
                    }
                    aria-label={`Kies asset voor document ${d.title}`}
                  >
                    <option value="">— Kies asset —</option>
                    {selectableAssets.map(a => (
                      <option key={a.id} value={a.id}>
                        {(a.assetNumber ?? "—") + " — " + (a.name ?? "—")}
                      </option>
                    ))}
                  </select>
                  <button className="btn" type="button" onClick={() => handleLinkAsset(d.id)}>
                    Koppel aan asset
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}