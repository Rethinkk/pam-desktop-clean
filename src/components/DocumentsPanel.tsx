/* @ts-nocheck */
import React, { useEffect, useMemo, useState } from "react";
import DocumentForm from "./DocumentForm";
import { loadRegister } from "../lib/assetNumber";
import { loadDocs } from "../lib/docsStore";
import type { Asset, DocumentItem } from "../types";

import * as peopleStore from "../lib/peopleStore";
// 👉 forceer losjes typen zodat TS niet klaagt over ontbrekende export
const PS: any = peopleStore as any;
const getPersonSafe = (id: string) =>
  typeof PS.getPerson === "function" ? PS.getPerson(id) : undefined;

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
    <>
      {/* -------- SCOPED LAYOUT: laat Docs eruitzien als Assets -------- */}
      <style>{`
        /* Basis: smalle veldkolom zoals Assets/Reporting */
        .docs-scope { --field-max: 720px; }

        /* Zet het eerste <form> binnen DocumentForm in een 2-koloms grid
           Kolom 1 = label-kolom (breedte = langste label), kolom 2 = veld (max --field-max) */
        .docs-scope form {
          display: grid;
          grid-template-columns: max-content minmax(0, var(--field-max));
          column-gap: 16px;
          row-gap: 12px;
          align-items: center;
        }

        /* zorg dat nested wrappers geen lege kolom veroorzaken */
.docs-scope form > div,
.docs-scope form > section,
.docs-scope form > fieldset,
.docs-scope form > div > div {           /* ← nieuw: nog één niveau flatten */
  display: contents;
}

/* FORCE: alle labels horen in kolom 1 (fix voor "Titel *") */
.docs-scope form label { grid-column: 1; }   /* ← nieuw */

/* velden blijven in kolom 2 – dit had je al, laat zo staan */
.docs-scope form input,
.docs-scope form select,
.docs-scope form textarea,
.docs-scope form .form-field {
  grid-column: 2;
}

        /* Labels links, strak en onwrappable */
        .docs-scope form label {
          white-space: nowrap;
          font-weight: 600;
          color: #0f172a;
        }

        /* Velden rechts; beperk breedte */
        .docs-scope form input,
        .docs-scope form select,
        .docs-scope form textarea,
        .docs-scope form .form-field {
          grid-column: 2;
          max-width: var(--field-max);
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          background: #fff;
          color: #0f172a;
          padding: 10px 12px;
          height: 44px;
          box-sizing: border-box;
        }

        /* Bestand-uploads / textareas */
        .docs-scope form input[type="file"] { padding: 6px 8px; height: auto; }
        .docs-scope form textarea { min-height: 120px; height: auto; resize: vertical; }

        /* Volle-breedte elementen (hints, sectietitels, actions) */
        .docs-scope form .full,
        .docs-scope form .hint,
        .docs-scope form .tip,
        .docs-scope form .actions,
        .docs-scope form p,
        .docs-scope form small {
          grid-column: 1 / -1;
        }

        /* Opslaan-knop over volle breedte, links uitgelijnd */
        .docs-scope form button[type="submit"],
        .docs-scope form .button-primary {
          grid-column: 1 / -1;
          justify-self: start;
          height: 44px;
          padding: 0 16px;
          border-radius: 12px;
          background: #0f172a;
          color: #fff;
          font-weight: 700;
          border: 0;
        }

        /* Responsief gedrag: op smalle schermen stapelen en veldkolom = 100% */
        @media (max-width: 1100px) { .docs-scope { --field-max: 100%; } }
        @media (max-width: 640px)  {
          .docs-scope form { grid-template-columns: 1fr; }
          .docs-scope form label { margin-bottom: 4px; white-space: normal; }
        }

        /* Lijst (rechterkolom) visueel wat netter */
        .docs-list-item {
          border: 1px solid rgba(0,0,0,.08);
          border-radius: 12px;
          padding: 12px;
          background: #fff;
        }
        .docs-chip {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 999px;
          border: 1px solid rgba(0,0,0,.1);
          font-size: 12px;
          background: #fff;
        }
      `}</style>

      <div className="docs-scope grid md:grid-cols-2 gap-6">
        {/* Linker kolom: DocumentForm – UI wordt via bovenstaande CSS in 2 kolommen gezet */}
        <DocumentForm onCreated={refreshDocs} />

        {/* Rechter kolom: overzicht */}
        <div>
          <h2 className="font-semibold text-lg mb-3">Documenten</h2>

          <ul className="space-y-2">
            {docs.slice().reverse().map((doc) => {
              const uploader = doc.uploadedById ? getPersonSafe(doc.uploadedById) : undefined;

              return (
                <li key={doc.id} className="docs-list-item">
                  <div className="font-medium">{doc.title}</div>
                  <div className="text-sm text-gray-600">
                    {doc.fileName}
                    {doc.fileSize ? ` · ${(doc.fileSize / 1024).toFixed(0)} KB` : ""}
                    {doc.mimeType ? ` · ${doc.mimeType}` : ""}
                  </div>

                  <div className="text-xs text-gray-600 mt-2 flex flex-wrap gap-2">
                    {uploader && (
                      <span className="docs-chip">uploader: {uploader.fullName}</span>
                    )}

                    {(doc.recipientIds ?? []).map((personId: string) => {
                      const p = getPersonSafe(personId);
                      return (
                        <span key={personId} className="docs-chip">
                          naar: {p?.fullName ?? "—"}
                        </span>
                      );
                    })}

                    {(doc.assetIds ?? []).map((assetId: string) => {
                      const a = assetsById[assetId];
                      const label = a ? `${a.assetNumber ?? "—"} — ${a.name ?? "—"}` : assetId;
                      return <span key={assetId} className="docs-chip">asset: {label}</span>;
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
    </>
  );
}



