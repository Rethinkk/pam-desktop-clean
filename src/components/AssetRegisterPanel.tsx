/* @ts-nocheck */
import React from "react";
import { ASSET_SCHEMAS } from "../config/assetTypes";

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

/** ---- Dynamische kolom-config uit schema --------------------------------- */
// 1) labels verzamelen uit alle schema's
const LABELS_FROM_SCHEMA: Record<string, string> = {};
Object.values(ASSET_SCHEMAS).forEach((s: any) => {
  (s.fields || []).forEach((f: any) => {
    if (f.label) LABELS_FROM_SCHEMA[f.key] = f.label;
  });
});

// 2) basiskolommen + union van alle fields met table:true (excl. name/type)
const BASE_KEYS: Array<keyof Row> = ["name", "type"];
const SCHEMA_TABLE_KEYS: string[] = Array.from(
  new Set(
    Object.values(ASSET_SCHEMAS)
      .flatMap((s: any) => (s.fields || []).filter((f: any) => f.table).map((f: any) => f.key))
      .filter((k) => k !== "name" && k !== "type")
  )
);
const TABLE_KEYS: Array<keyof Row> = Array.from(new Set([...BASE_KEYS, ...SCHEMA_TABLE_KEYS])) as any;

// 3) nette kolomtitel
function colLabel(key: keyof Row): string {
  if (key === "name") return "Naam";
  if (key === "type") return "Type";
  if (key === "priceCents") return "Prijs";
  if (key === "serial") return "Serienummer";
  if (key === "personName") return "Persoon";
  if (key === "purchaseDate") return "Aankoopdatum";
  return LABELS_FROM_SCHEMA[key as string] || String(key);
}

/** ------------------------------------------------------------------------- */

export default function AssetRegisterPanel() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState<{ key: keyof Row; dir: "asc" | "desc" }>({
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

  function toggleSort(key: keyof Row) {
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

    // Toast (alleen bij echt verwijderen)
    try {
      window.dispatchEvent(
        new CustomEvent("pam:toast", {
          detail: { message: "Asset verwijderd", tone: "info" },
        })
      );
    } catch {}
  }

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();

    // zoek in een vaste set + alle TABLE_KEYS
    const SEARCH_KEYS: (keyof Row)[] = Array.from(
      new Set<keyof Row>([
        "name",
        "type",
        "serial",
        "brand",
        "model",
        "personName",
        "purchaseDate",
        "notes",
        ...TABLE_KEYS,
      ])
    ) as any;

    let out = !needle
      ? rows
      : rows.filter((r) =>
          SEARCH_KEYS
            .map((k) => (r as any)[k])
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(needle))
        );

    // sortering
    out = [...out].sort((a, b) => {
      const k = sort.key;
      const A = (a as any)[k];
      const B = (b as any)[k];

      // numeriek voor prijs
      if (k === "priceCents") {
        const nA = Number(A ?? 0);
        const nB = Number(B ?? 0);
        return sort.dir === "asc" ? nA - nB : nB - nA;
      }

      // default: string-vergelijking
      const sA = String(A ?? "");
      const sB = String(B ?? "");
      return sort.dir === "asc" ? sA.localeCompare(sB) : sB.localeCompare(sA);
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
              {TABLE_KEYS.map((k) => (
                <th key={String(k)} onClick={() => toggleSort(k)}>
                  {colLabel(k)}
                </th>
              ))}
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                className={r.id === highlightId ? "ui-row-highlight" : ""}
              >
                {TABLE_KEYS.map((k) => {
                  const v = (r as any)[k];
                  if (k === "priceCents") return <td key={String(k)}>{formatPrice(r.priceCents)}</td>;
                  return <td key={String(k)}>{v ?? ""}</td>;
                })}
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
                <td colSpan={TABLE_KEYS.length + 1}>
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
