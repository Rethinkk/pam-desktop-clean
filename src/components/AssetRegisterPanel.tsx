/* @ts-nocheck */
import React from "react";

type Row = {
  id: string;
  name: string;
  type?: string;
  serial?: string;
  brand?: string;
  model?: string;
  purchaseDate?: string; // yyyy-mm-dd
  priceCents?: number;
  personName?: string;
};

const STORAGE_KEY = "pam-assets-v1";

function parseEuroToCents(v?: any) {
  if (v == null) return undefined;
  if (typeof v === "number") return Math.round(v * 100);
  const s = String(v).trim();
  if (!s) return undefined;
  const n = s.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const f = Number.parseFloat(n);
  return Number.isFinite(f) ? Math.round(f * 100) : undefined;
}

function euro(cents?: number) {
  if (cents == null) return "";
  try {
    return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100);
  } catch {
    return `€ ${(cents / 100).toFixed(2)}`;
  }
}

export default function AssetRegisterPanel() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState<{ key: keyof Row; dir: "asc" | "desc" }>({
    key: "name",
    dir: "asc",
  });

  React.useEffect(() => {
    load();
  }, []);

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const arr: any[] = Array.isArray(parsed?.assets) ? parsed.assets : Array.isArray(parsed) ? parsed : [];

      const norm: Row[] = arr.map((a) => {
        const cents =
          a.priceCents ??
          parseEuroToCents(a.price) ??
          (typeof a.price_eur === "number" ? Math.round(a.price_eur * 100) : undefined);

        return {
          id: a.id ?? String(Math.random()),
          name: a.name ?? a.title ?? "",
          type: a.type ?? a.kind ?? "",
          serial: a.serial ?? a.sn ?? a.serialNumber ?? "",
          brand: a.brand ?? "",
          model: a.model ?? "",
          purchaseDate: a.purchaseDate ?? a.boughtAt ?? a.purchase_at ?? "",
          priceCents: cents,
          personName: a.personName ?? a.ownerName ?? a.assigneeName ?? "",
        };
      });

      setRows(norm);
    } catch {}
  }

  function persistDelete(id: string) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const isContainer = parsed && Array.isArray(parsed.assets);
      const arr: any[] = isContainer ? parsed.assets : Array.isArray(parsed) ? parsed : [];

      const next = arr.filter((a) => a.id !== id);

      const out = isContainer ? { ...parsed, assets: next } : Array.isArray(parsed) ? next : { assets: next };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
    } catch {}
  }

  function handleDelete(id: string) {
    if (!confirm("Weet je zeker dat je dit asset wilt verwijderen?")) return;
    persistDelete(id);
    setRows((r) => r.filter((x) => x.id !== id));
  }

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = !needle
      ? rows
      : rows.filter((r) =>
          [r.name, r.type, r.serial, r.brand, r.model, r.personName]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(needle))
        );

    out = [...out].sort((a, b) => {
      const ka = String(a[sort.key] ?? "");
      const kb = String(b[sort.key] ?? "");
      return sort.dir === "asc" ? ka.localeCompare(kb) : kb.localeCompare(ka);
    });
    return out;
  }, [rows, q, sort]);

  function toggleSort(key: keyof Row) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  return (
    <div className="ui-page">
      <div className="ui-section-title">Asset register</div>

      <div className="ui-toolbar">
        <input placeholder="Zoeken…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="spacer" />
        <small>{filtered.length} resultaten</small>
      </div>

      <div className="ui-table-wrap">
        <table className="ui-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort("name")}>Naam</th>
              <th onClick={() => toggleSort("type")}>Type</th>
              <th onClick={() => toggleSort("serial")}>Serienr</th>
              <th onClick={() => toggleSort("brand")}>Merk/Model</th>
              <th onClick={() => toggleSort("purchaseDate")}>Aankoopdatum</th>
              <th onClick={() => toggleSort("priceCents")}>Prijs</th>
              <th onClick={() => toggleSort("personName")}>Persoon</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.type || ""}</td>
                <td>{r.serial || ""}</td>
                <td>{[r.brand, r.model].filter(Boolean).join(" ")}</td>
                <td>{r.purchaseDate || ""}</td>
                <td>{euro(r.priceCents)}</td>
                <td>{r.personName || ""}</td>
                <td>
                  <button className="ui-btn ui-btn--sm ui-btn--danger" onClick={() => handleDelete(r.id)}>
                    Verwijderen
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8}><em>Geen assets gevonden.</em></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

