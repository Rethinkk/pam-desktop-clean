/* @ts-nocheck */
import React from "react";
import { loadRegister, saveRegister } from "../lib/assetNumber";
import { docsForAsset } from "../lib/docsStore";
import type { Asset } from "../types";

// ⬇️ vervangt: `import { getPerson } from "../lib/peopleStore";`
import * as peopleStore from "../lib/peopleStore";
const PS: any = peopleStore as any;
const getPersonSafe = (id: string) =>
  typeof PS.getPerson === "function" ? PS.getPerson(id) : undefined;

console.log("RENDER AssetRegisterPanel");

/** Normaliseer legacy velden naar het huidige model (personIds). */
function normalizeAssets(list: any[]): any[] {
  return (Array.isArray(list) ? list : []).map((a) => {
    if (!a || typeof a !== "object") return a;
    // personId -> personIds
    if (a.personId && !Array.isArray(a.personIds)) {
      return { ...a, personIds: [a.personId] };
    }
    // personalID (typefout) -> personIds
    if (a.personalID && !Array.isArray(a.personIds)) {
      return { ...a, personIds: [a.personalID] };
    }
    return a;
  });
}

export default function AssetRegisterPanel() {
  // init: altijd uit het centrale register lezen
  const [assets, setAssets] = React.useState<Asset[]>(
    () => normalizeAssets(loadRegister().assets ?? [])
  );
  const [q, setQ] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const refresh = React.useCallback(() => {
    const reg = loadRegister();
    setAssets(normalizeAssets(reg?.assets ?? []));
  }, []);

  // live verversen
  React.useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("pam-assets-updated", handler);
    return () => window.removeEventListener("pam-assets-updated", handler);
  }, [refresh]);

  // hash deeplink (#asset/<id>)
  React.useEffect(() => {
    const applyFromHash = () => {
      const m = location.hash.match(/^#asset\/(.+)$/);
      setSelectedId(m ? m[1] : null);
    };
    applyFromHash();
    window.addEventListener("hashchange", applyFromHash);
    return () => window.removeEventListener("hashchange", applyFromHash);
  }, []);

  function openDetails(id: string) {
    setSelectedId(id);
    try { history.replaceState(null, "", `#asset/${id}`); } catch {}
  }
  function closeDetails() {
    setSelectedId(null);
    try {
      if (location.hash.startsWith("#asset/")) history.replaceState(null, "", location.pathname + location.search);
    } catch {}
  }

  function removeAsset(id: string | undefined) {
    if (!id) return;
    if (!window.confirm("Weet je zeker dat je dit asset wilt verwijderen?")) return;
    const reg = loadRegister();
    const next = (reg.assets ?? []).filter((a: any) => a?.id !== id);
    // saveRegister is nog in gebruik elders; laten staan
    saveRegister({ assets: next });
    setAssets(normalizeAssets(next));
    if (selectedId === id) closeDetails();
  }

  // filter + sort (nieuwste eerst)
  const filtered = React.useMemo(() => {
    const list = Array.isArray(assets) ? assets.slice() : [];
    const s = q.trim().toLowerCase();
    const searched = s
      ? list.filter((a: any) => {
          const t = (a?.type || a?.typeCode || a?.category || "") + "";
          return (
            (a?.assetNumber || "").toLowerCase().includes(s) ||
            (a?.name || "").toLowerCase().includes(s) ||
            t.toLowerCase().includes(s)
          );
        })
      : list;
    searched.sort((a: any, b: any) => {
      const da = Date.parse(a?.createdAt || "") || 0;
      const db = Date.parse(b?.createdAt || "") || 0;
      if (db !== da) return db - da;
      return String(b?.assetNumber || "").localeCompare(String(a?.assetNumber || ""));
    });
    return searched;
  }, [q, assets]);

  const selected = React.useMemo(
    () => filtered.find(a => a.id === selectedId) || assets.find(a => a.id === selectedId) || null,
    [filtered, assets, selectedId]
  );

  function fmtDate(d?: string) {
    if (!d) return "—";
    try { return new Date(d).toLocaleString(); } catch { return d; }
  }

  // detail-weergave helper
  function DataRows({ data }: { data: Record<string, any> | undefined }) {
    if (!data || typeof data !== "object") return <em className="text-gray-500">Geen aanvullende velden.</em>;
    const entries = Object.entries(data).filter(([k]) => k !== "__docIds");
    if (entries.length === 0) return <em className="text-gray-500">Geen aanvullende velden.</em>;

    return (
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {entries.map(([k, v]) => (
          <div key={k} className="border rounded p-2">
            <dt className="text-xs uppercase tracking-wide text-gray-500">{k}</dt>
            <dd className="text-sm break-words">
              {Array.isArray(v) ? v.join(", ")
                : v === true ? "ja"
                : v === false ? "nee"
                : v == null ? "—"
                : String(v)}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  // documenten bij asset
  function DocsList({ assetNumber, inline }: { assetNumber?: string; inline?: boolean }) {
    const docs = React.useMemo(() => (assetNumber ? docsForAsset(assetNumber) : []), [assetNumber]);
    if (!docs || docs.length === 0) return <span className="text-gray-500">{inline ? "geen" : "Geen documenten"}</span>;
    return (
      <ul className="list-disc pl-5 text-sm">
        {docs.map((d: any) => (
          <li key={d.id}>{d.title || d.name || d.fileName || d.filename || d.id}</li>
        ))}
      </ul>
    );
  }

  return (
    <div className="areg space-y-4">
      {/* --- SCOPED STYLES: uitsluitend voor dit panel --- */}
      <style>{`
        .areg {
          background:#fff !important;
          border-radius:12px !important;
          padding:20px !important;
          box-shadow:0 1px 2px rgba(0,0,0,.03) !important;
        }

        /* Titel in blauw */
        .areg h2{
          margin:0 0 8px !important;
          font-size:22px !important;
          font-weight:700 !important;
          color:#0F2C6E!important; /* blauw */
        }

        /* Zoekveld rustiger (werkt voor text/search) */
        .areg input[type="text"], .areg input[type="search"]{
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
        .areg input[type="text"]:focus, .areg input[type="search"]:focus{
          border-color:#94a3b8 !important;
          background:#fff !important;
          box-shadow:0 0 0 3px rgba(30,58,138,.12) !important;
        }

        /* Header-rij en meta */
        .areg .header-row{
          display:flex !important;
          align-items:center !important;
          justify-content:space-between !important;
          gap:12px !important;
        }
        .areg .meta{
          color:#64748b !important;
          font-size:12px !important;
        }

        /* Ronde hoeken om de tabel */
        .areg .table-wrap{
          border:1px solid #e2e8f0 !important;
          border-radius:12px !important;
          overflow:hidden !important;
          background:#fff !important;
        }

        .areg table{
          width:100% !important;
          border-collapse:separate !important;
          border-spacing:0 !important;
          margin-top:0 !important; /* binnen de wrap geen extra marge */
        }
        .areg thead th{
          text-align:left !important;
          font-size:12px !important;
          text-transform:uppercase !important;
          letter-spacing:.04em !important;
          color:#475569 !important;
          background:#f8fafc !important;
          padding:10px 12px !important;
          border-bottom:1px solid #e2e8f0 !important;
        }
        .areg tbody td{
          padding:12px !important;
          border-bottom:1px solid #e2e8f0 !important;
          vertical-align:middle !important;
          color:#0f172a !important;
        }
        .areg tbody tr:hover{ background:#f8fafc !important; }

        /* Acties rechts; knop blauw met witte letters */
        .areg td:last-child, .areg .col-actions{ text-align:right !important; white-space:nowrap !important; }
        .areg td:last-child button, .areg .col-actions button{
          background:#0F2C6E !important;     /* blauw */
          border:1px solid #1e40af !important;
          color:#ffffff !important;          /* witte letters */
          border-radius:9999px !important;   /* pill */
          padding:8px 12px !important;
          font-weight:600 !important;
          line-height:1 !important;
          cursor:pointer !important;
          transition:background .15s, border-color .15s, color .15s !important;
        }
        .areg td:last-child button:hover, .areg .col-actions button:hover{
          background:#0F2C6E !important;     /* iets donkerder */
          border-color:#1e3a8a !important;
        }
      `}</style>

      <div className="header-row">
        <h2>Asset Register — Overzicht</h2>
        <input
          className="border rounded px-2 py-1 w-64"
          placeholder="Zoek op nummer/naam/type…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
        />
      </div>

      <div className="meta">
        Totaal: <strong>{filtered.length}</strong> {filtered.length === 1 ? "item" : "items"}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500">Nog geen assets in het register.</p>
      ) : (
        <div className="table-wrap overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3 whitespace-nowrap">Nr</th>
                <th className="py-2 pr-3">Naam</th>
                <th className="py-2 pr-3 whitespace-nowrap">Type</th>
                <th className="py-2 pr-3 whitespace-nowrap">Aangemaakt</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a: any) => (
                <tr key={a?.id || a?.assetNumber} className="border-b last:border-0">
                  <td className="py-2 pr-3 whitespace-nowrap">
                    <a
                      href={`#asset/${a?.id}`}
                      onClick={(e) => { e.preventDefault(); openDetails(a?.id); }}
                      className="underline hover:no-underline"
                      title="Bekijk details"
                    >
                      {a?.assetNumber || "—"}
                    </a>
                  </td>
                  <td className="py-2 pr-3">
                    <a
                      href={`#asset/${a?.id}`}
                      onClick={(e) => { e.preventDefault(); openDetails(a?.id); }}
                      className="underline hover:no-underline"
                      title="Bekijk details"
                    >
                      {a?.name || "—"}
                    </a>
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {(a?.type || a?.typeCode || a?.category) ?? "—"}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(a?.createdAt)}</td>
                  <td className="py-2 pr-3 text-right">
                    {a?.id ? (
                      <button
                        className="border rounded px-2 py-1 text-xs"
                        onClick={() => removeAsset(a.id)}
                        title="Verwijder dit asset"
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

      {/* Detailpaneel (overlay) */}
      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/40 flex items-start justify-center p-4 z-50"
          onClick={closeDetails}
        >
          <div
            className="bg-white max-w-3xl w-full rounded-xl shadow-xl p-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-gray-500">Assetnummer</div>
                <div className="font-semibold">{selected.assetNumber}</div>
                <div className="text-xs text-gray-500 mt-1">Naam</div>
                <div className="">{selected.name || "—"}</div>
              </div>
              <button className="border rounded px-3 py-1 text-sm" onClick={closeDetails}>Sluiten</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Kerngegevens</h3>
                <dl className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                  <dt className="text-gray-500">Type</dt>
                  <dd>{(selected.type || selected.typeCode || selected.category) ?? "—"}</dd>
                  <dt className="text-gray-500">Aangemaakt</dt>
                  <dd>{fmtDate(selected.createdAt)}</dd>
                  <dt className="text-gray-500">Laatst bijgewerkt</dt>
                  <dd>{fmtDate(selected.updatedAt)}</dd>
                  <dt className="text-gray-500">Personen</dt>
                  <dd>
                    {Array.isArray(selected.personIds) && selected.personIds.length > 0 ? (
                      <ul className="list-disc pl-4">
                        {selected.personIds.map((pid: string) => (
                          <li key={pid}>
                            {getPersonSafe(pid)?.fullName ?? pid}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "—"
                    )}
                  </dd>
                </dl>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Documenten</h3>
                <DocsList assetNumber={selected.assetNumber} />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Formuliervelden</h3>
              <DataRows data={selected.data} />
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Nieuwe items maak je aan via de tab <strong>Assets</strong>.
      </p>
    </div>
  );
}
