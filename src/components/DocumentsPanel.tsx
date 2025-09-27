/* @ts-nocheck */
import React, { useEffect, useMemo, useState } from "react";
import DocumentForm from "./DocumentForm";
import { loadRegister } from "../lib/assetNumber";
import { loadDocs } from "../lib/docsStore";
import type { Asset, DocumentItem } from "../types";
import { getPerson } from "../lib/peopleStore";

function normalizeDoc(d: any): DocumentItem {
  return {
    ...d,
    fileName: d.fileName ?? d.filename ?? "",
    fileSize: d.fileSize ?? d.size ?? 0,
    mimeType: d.mimeType ?? d.mime ?? "application/octet-stream",
    assetIds: Array.isArray(d.assetIds) ? d.assetIds : [],
    recipientIds: Array.isArray(d.recipientIds) ? d.recipientIds : [],
  };
}

export default function DocumentsPanel() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [docs, setDocs] = useState<DocumentItem[]>([]);

  useEffect(() => {
    const reg = loadRegister();
    setAssets(Array.isArray(reg?.assets) ? reg.assets : []);
    refreshDocs();
  }, []);

  function refreshDocs() {
    const raw = loadDocs();
    const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.docs) ? raw.docs : [];
    setDocs(arr.map(normalizeDoc));
  }

  const assetsById = useMemo(() => {
    const m: Record<string, Asset> = {};
    for (const a of assets) m[a.id] = a;
    return m;
  }, [assets]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <DocumentForm onCreated={refreshDocs} />

      <div>
        <h2 className="font-semibold text-lg mb-3">Documenten</h2>
        <ul className="space-y-2">
          {docs.slice().reverse().map((doc) => {
            const uploader = doc.uploadedById ? getPerson(doc.uploadedById) : undefined;

            return (
              <li key={doc.id} className="border rounded-xl p-3">
                <div className="font-medium">{doc.title}</div>
                <div className="text-sm text-gray-600">
                  {doc.fileName}
                  {doc.fileSize ? ` · ${(doc.fileSize / 1024).toFixed(0)} KB` : ""}
                  {doc.mimeType ? ` · ${doc.mimeType}` : ""}
                </div>

                <div className="text-xs text-gray-600 mt-2 flex flex-wrap gap-2">
                  {uploader && (
                    <span className="px-2 py-0.5 rounded-full border">
                      uploader: {uploader.fullName}
                    </span>
                  )}

                  {(doc.recipientIds ?? []).map((personId: string) => {
                    const p = getPerson(personId);
                    return (
                      <span key={personId} className="px-2 py-0.5 rounded-full border">
                        naar: {p?.fullName ?? "—"}
                      </span>
                    );
                  })}

                  {(doc.assetIds ?? []).map((assetId: string) => {
                    const a = assetsById[assetId];
                    const label = a ? `${a.assetNumber ?? "—"} — ${a.name ?? "—"}` : assetId;
                    return (
                      <span key={assetId} className="px-2 py-0.5 rounded-full border">
                        asset: {label}
                      </span>
                    );
                  })}
                </div>

                {doc.docNumber && (
                  <div className="text-[11px] text-gray-500 mt-1">#{doc.docNumber}</div>
                )}
              </li>
            );
          })}

          {docs.length === 0 && (
            <li className="text-sm text-gray-500">Nog geen documenten in het register.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
