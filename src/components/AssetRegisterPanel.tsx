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

  // detail-weergave helper: toon alle data-velden die in het formulier zijn ingevuld
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

  // documenten bij asset: via docsStore op assetNumber
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
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold" style={{ color: "blue" }}>
          Asset REGISTER — OVERZICHT
        </h2>
        <input
          className="border rounded px-2 py-1 w-64"
          placeholder="Zoek op nummer/naam/type…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="text-xs text-gray-500">
        Totaal: <strong>{filtered.length}</strong> {filtered.length === 1 ? "item" : "items"}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500">Nog geen assets in het register.</p>
      ) : (
        <div className="overflow-auto">
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
