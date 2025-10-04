/* @ts-nocheck */
import React from "react";

type AssetType = "IT-Materieel" | "Meubilair" | "Overig";

type Row = {
  id: string;
  name: string;
  type: AssetType;
  serial?: string;
  brand?: string;
  model?: string;
  personId?: string;
  personName?: string;
  purchaseDate?: string; // yyyy-mm-dd
  warrantyUntil?: string;
  priceCents?: number;
  documentIds?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

const ASSETS_KEY = "pam-assets-v1";

export default function AssetRegisterPanel() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState<{ key: keyof Row | "price"; dir: "asc" | "desc" }>({
    key: "name",
    dir: "asc",
  });

  // optioneel: highlight laatste aangemaakte asset
  const [highlightId, setHighlightId] = React.useState<string | null>(null);

  React.useEffect(() => {
    load();
    try {
      const id = sessionStorage.getItem("pam-last-created");
      if (id) {
        setHighlightId(id);
        sessionStorage.removeItem("pam-last-created");
      }
    } catch {}
  }, []);

  function load() {
    try {
      const raw = localStorage.getItem(ASSETS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const arr: Row[] = Array.isArray(parsed?.assets)
        ? parsed.assets
        : Array.isArray(parsed)
        ? parsed
        : [];
      setRows(arr);
    } catch {}
  }

  function formatPrice(cents?: number) {
    if (!cents || cents <= 0) return "";
    try {
      return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100);
    } catch {
      return `€ ${(cents / 100).toFixed(2)}`;
    }
  }

  function toggleSort(key: keyof Row | "price") {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  }

  function handleDelete(id: string) {
    if (!confirm("Weet je zeker dat je dit asset wilt verwijderen?")) return;

    try {
      const raw = localStorage.getItem(ASSETS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const isContainer = parsed && Array.isArray(parsed.assets);
        const arr: any[] = isContainer ? parsed.assets : Array.isArray(parsed) ? parsed : [];
        const next = arr.filter((a) => a.id !== id);
        const out = isContainer ? { ...parsed, assets: next } : Array.isArray(parsed) ? next : { assets: next };
        localStorage.setItem(ASSETS_KEY, JSON.stringify(out));
      }
    } catch {}

    setRows((r) => r.filter((x) => x.id !== id));

    // ✅ alleen hier een toast
    window.dispatchEvent(
      new CustomEvent("pam:toast", {
        detail: { message: "Asset verwijderd", tone: "info" },
      })
    );
  }

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();

    let out = !needle
      ? rows
      : rows.filter((r) =>
          [
            r.name,
            r.type,
            r.serial,
            r.brand,
            r.model,
            r.personName,
            r.purchaseDate,
            r.notes,
          ]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(needle))
        );

    out = [...out].sort((a, b) => {
      let A: string | number = "";
      let B: string | number = "";

      if (sort.key === "price") {
        A = a.priceCents ?? 0;
        B = b.priceCents ?? 0;
      } else {
        A = String(a[sort.key] ?? "");
        B = String(b[sort.key] ?? "");
      }

      if (typeof A === "number" && typeof B === "number") {
        return sort.dir === "asc" ? A - B : B - A;
      }
      return sort.dir === "asc"
        ? String(A).localeCompare(String(B))
        : String(B).localeCompare(String(A));
    });

    return out;
  }, [rows, q, sort]);

  return (
    <div className="ui-page">
      <div className="ui-section-title">Asset register ({filtered.length})</div>

      <div className="ui-toolbar">
        <input
          placeholder="Zoeken…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="spacer" />
        <small>{filtered.length} resultaten</small>
      </div>

      <div className="ui-table-wrap">
        <table className="ui-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort("name")}>Naam</th>
              <th onClick={() => toggleSort("type")}>Type</th>
              <th onClick={() => toggleSort("serial")}>Serienummer</th>
              <th onClick={() => toggleSort("personName")}>Persoon</th>
              <th onClick={() => toggleSort("purchaseDate")}>Aankoopdatum</th>
              <th onClick={() => toggleSort("price")}>Prijs</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                className={r.id === highlightId ? "ui-row-highlight" : ""}
              >
                <td>{r.name}</td>
                <td>{r.type}</td>
                <td>{r.serial || ""}</td>
                <td>{r.personName || ""}</td>
                <td>{r.purchaseDate || ""}</td>
                <td>{formatPrice(r.priceCents)}</td>
                <td>
                  <button
                    className="ui-btn ui-btn--sm ui-btn--danger"
                    onClick={() => handleDelete(r.id)}
                  >
                    Verwijderen
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <em>Geen assets gevonden.</em>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
