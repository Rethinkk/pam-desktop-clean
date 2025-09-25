import React, { useState } from "react";
import DocumentForm from "./DocumentForm";
import { loadDocs } from "../lib/docsStore";
import { DocumentItem } from "../docTypes";
import { loadRegister } from "../lib/assetNumber";

export default function DocumentsPanel() {
  const [docs, setDocs] = useState<DocumentItem[]>(() => loadDocs().documents);
  const [assetsById] = useState(() => {
    const reg = loadRegister();
    const map: Record<string, string> = {};
    for (const a of reg.assets) map[a.id] = `${a.assetNumber} — ${a.name}`;
    return map;
  });

  const refresh = () => setDocs(loadDocs().documents);

  return (
    <div className="grid-2">
      <div>
        <DocumentForm onCreated={refresh} />
      </div>

      <div>
        <div className="card">
          <h2 style={{fontWeight:600, marginBottom:8}}>Documentregister</h2>
          <ul style={{display:'grid', gap:12}}>
            {docs.slice().reverse().map(d => (
              <li key={d.id} className="card">
                <div style={{fontSize:12, color:'#555'}}>{d.docNumber}</div>
                <div style={{fontWeight:600}}>{d.title}</div>
                {d.linkedAssetId && (
                  <div style={{fontSize:12}}>
                    Gelinkt aan: {assetsById[d.linkedAssetId] || d.linkedAssetId}
                  </div>
                )}
                <div style={{display:'flex', gap:8, marginTop:8}}>
                  <a className="btn" href={d.fileDataUrl} download={d.fileName}>Download</a>
                </div>
              </li>
            ))}
            {docs.length === 0 && <div style={{fontSize:12, color:'#777'}}>Nog geen documenten.</div>}
          </ul>
        </div>
      </div>
    </div>
  );
}
