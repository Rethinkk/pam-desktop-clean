/* @ts-nocheck */
import React from "react";

const STORAGE_KEY = "pam-docs-v1";

/** Robuust lezen: ondersteunt [] én {docs: []} */
function readDocs(): any[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.docs)) return parsed.docs;
    return [];
  } catch {
    return [];
  }
}

/** Opslaan in {docs: []} + update-event */
function saveDocs(nextDocs: any[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ docs: nextDocs }));
  window.dispatchEvent(new Event("pam-docs-updated"));
}

export default function DocumentRegisterPanel() {
  const [docs, setDocs] = React.useState<any[]>(() => readDocs());
  const [q, setQ] = React.useState("");

  // live refresh
  React.useEffect(() => {
    const handler = () => setDocs(readDocs());
    window.addEventListener("pam-docs-updated", handler);
    return () => window.removeEventListener("pam-docs-updated", handler);
  }, []);

  function fmtDate(d?: string) {
    if (!d) return "—";
    try { return new Date(d).toLocaleString(); } catch { return d; }
  }

  function removeDoc(id?: string) {
    if (!id) return;
    if (!window.confirm("Weet je zeker dat je dit document wilt verwijderen?")) return;
    const next = readDocs().filter((d: any) => d?.id !== id);
    saveDocs(next);
    setDocs(next);
  }

  // filter + sort (nieuwste eerst)
  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = Array.isArray(docs) ? docs.slice() : [];
    const searched = s
      ? list.filter((d: any) => {
          const title = (d?.title || d?.name || "") + "";
          const file  = (d?.filename || d?.fileName || "") + "";
          const id    = (d?.id || "") + "";
          return (
            title.toLowerCase().includes(s) ||
            file.toLowerCase().includes(s) ||
            id.toLowerCase().includes(s)
          );
        })
      : list;

    searched.sort((a: any, b: any) => {
      const da = Date.parse(a?.createdAt || "") || 0;
      const db = Date.parse(b?.createdAt || "") || 0;
      if (db !== da) return db - da;
      return String((a?.title || a?.name || "")).localeCompare(String(b?.title || b?.name || ""));
    });
    return searched;
  }, [q, docs]);

  return (
    <div className="dreg space-y-4">
      {/* ---- SCOPED STYLES (zelfde stijl als Asset Register) ---- */}
      <style>{`
        .dreg {
          background:#fff !important;
          border-radius:12px !important;
          padding:20px !important;
          box-shadow:0 1px 2px rgba(0,0,0,.03) !important;
        }
        /* Kop in blauw (pas hex aan naar jouw merkblauw) */
        .dreg h2{
          margin:0 0 8px !important;
          font-size:22px !important;
          font-weight:700 !important;
          color:#1e3a8a !important;
        }

        /* Header rij + meta */
        .dreg .header-row{
          display:flex !important;
          align-items:center !important;
          justify-content:space-between !important;
          gap:12px !important;
        }
        .dreg .meta{
          color:#64748b !important;
          font-size:12px !important;
        }

        /* Zoekveld */
        .dreg input[type="text"], .dreg input[type="search"]{
          width:100% !important;
          padding:10px 12px 10px 36px !important;
          border:1px solid #cbd5e1 !important;
          border-radius:10px !important;
          background:#f8fafc !important;
          outline:none !important;
          transition:border-color .15s, box-shadow .15s, background .15s !important;
          background-image:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="%23475569"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z"/></svg>') !important;
          background-repeat:no-repeat !important;
          background-position:10px 50% !important;
          max-width:420px !important;
        }
        .dreg input[type="text"]:focus, .dreg input[type="search"]:focus{
          border-color:#94a3b8 !important;
          background:#fff !important;
          box-shadow:0 0 0 3px rgba(30,58,138,.12) !important;
        }

        /* Ronde hoeken rond tabel */
        .dreg .table-wrap{
          border:1px solid #e2e8f0 !important;
          border-radius:12px !important;
          overflow:hidden !important;
          background:#fff !important;
        }
        .dreg table{
          width:100% !important;
          border-collapse:separate !important;
          border-spacing:0 !important;
        }
        .dreg thead th{
          text-align:left !important;
          font-size:12px !important;
          text-transform:uppercase !important;
          letter-spacing:.04em !important;
          color:#475569 !important;
          background:#f8fafc !important;
          padding:10px 12px !important;
          border-bottom:1px solid #e2e8f0 !important;
        }
        .dreg tbody td{
          padding:12px !important;
          border-bottom:1px solid #e2e8f0 !important;
          vertical-align:middle !important;
          color:#0f172a !important;
        }
        .dreg tbody tr:hover{ background:#f8fafc !important; }

        /* Acties rechts; knop blauw met witte letters */
        .dreg td:last-child, .dreg .col-actions{ text-align:right !important; white-space:nowrap !important; }
        .dreg td:last-child button, .dreg .col-actions button{
          background:#1e40af !important;
          border:1px solid #1e40af !important;
          color:#ffffff !important;
          border-radius:9999px !important;
          padding:8px 12px !important;
          font-weight:600 !important;
          line-height:1 !important;
          cursor:pointer !important;
          transition:background .15s, border-color .15s, color .15s !important;
        }
        .dreg td:last-child button:hover, .dreg .col-actions button:hover{
          background:#1e3a8a !important;
          border-color:#1e3a8a !important;
        }
      `}</style>

      <div className="header-row">
        <h2>Document Register — Overzicht</h2>
        <input
          className="border rounded px-2 py-1 w-64"
          placeholder="Zoek op titel/bestand/ID…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
        />
      </div>

      <div className="meta">
        Totaal: <strong>{filtered.length}</strong> {filtered.length === 1 ? "document" : "documenten"}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500">Nog geen documenten in het register.</p>
      ) : (
        <div className="table-wrap overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3">Titel</th>
                <th className="py-2 pr-3 whitespace-nowrap">Bestand</th>
                <th className="py-2 pr-3 whitespace-nowrap">Aangemaakt</th>
                <th className="py-2 pr-3 whitespace-nowrap">ID</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d: any) => (
                <tr key={d?.id || d?.title} className="border-b last:border-0">
                  <td className="py-2 pr-3">
                    {d?.title || d?.name || "—"}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {d?.filename || d?.fileName || "—"}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {fmtDate(d?.createdAt)}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {d?.id || "—"}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    {d?.id ? (
                      <button
                        className="border rounded px-2 py-1 text-xs"
                        onClick={() => removeDoc(d.id)}
                        title="Verwijder dit document"
                      >
                        Verwijderen
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Nieuwe documenten maak je aan in de tab <strong>Docs</strong>.
      </p>
    </div>
  );
}
