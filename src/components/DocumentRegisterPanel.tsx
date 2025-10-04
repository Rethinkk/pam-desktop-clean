/* @ts-nocheck */
import React from "react";

type DocRow = {
  id: string;
  title: string;
  type?: string;
  number?: string;
  ownerName?: string;
  issuedAt?: string;  // yyyy-mm-dd
  expiresAt?: string; // yyyy-mm-dd
};

const DOCS_KEY = "pam-docs-v1";
const ASSETS_KEY = "pam-assets-v1";

function parseYMD(s?: string) {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]) - 1, d = Number(m[3]);
  return new Date(y, mo, d);
}
function daysUntil(exp?: string) {
  const dt = parseYMD(exp);
  if (!dt) return null;
  const today = new Date();
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const b = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  const diffMs = b.getTime() - a.getTime();
  return Math.round(diffMs / 86400000);
}
function expiryStatus(expiresAt?: string) {
  const d = daysUntil(expiresAt);
  if (d === null) return { label: "—", cls: "ui-badge" };
  if (d < 0) return { label: "Verlopen", cls: "ui-badge danger" };
  if (d <= 30) return { label: `Binnen ${d} d`, cls: "ui-badge warn" };
  return { label: "Actief", cls: "ui-badge ok" };
}

export default function DocumentRegisterPanel() {
  const [rows, setRows] = React.useState<DocRow[]>([]);
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState<{ key: keyof DocRow | "status"; dir: "asc" | "desc" }>({
    key: "title",
    dir: "asc",
  });

  React.useEffect(() => {
    load();
  }, []);

  function load() {
    try {
      const raw = localStorage.getItem(DOCS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const docs: DocRow[] = Array.isArray(parsed?.docs) ? parsed.docs : Array.isArray(parsed) ? parsed : [];
      const norm = docs.map((d: any) => ({
        id: d.id ?? String(Math.random()),
        title: d.title ?? d.name ?? "",
        type: d.type ?? d.kind ?? "",
        number: d.number ?? d.no ?? "",
        ownerName: d.ownerName ?? d.personName ?? d.owner ?? "",
        issuedAt: d.issuedAt ?? d.issueDate ?? "",
        expiresAt: d.expiresAt ?? d.validUntil ?? d.expiryDate ?? "",
      })) as DocRow[];
      setRows(norm);
    } catch {}
  }

  function persistDelete(docId: string) {
    // 1) Documenten opschonen
    try {
      const raw = localStorage.getItem(DOCS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const isContainer = parsed && Array.isArray(parsed.docs);
        const arr: any[] = isContainer ? parsed.docs : Array.isArray(parsed) ? parsed : [];
        const next = arr.filter((d) => d.id !== docId);
        const out = isContainer ? { ...parsed, docs: next } : Array.isArray(parsed) ? next : { docs: next };
        localStorage.setItem(DOCS_KEY, JSON.stringify(out));
      }
    } catch {}

    // 2) Document-koppelingen bij assets verwijderen (documentIds[])
    try {
      const rawA = localStorage.getItem(ASSETS_KEY);
      if (rawA) {
        const parsedA = JSON.parse(rawA);
        const isContainerA = parsedA && Array.isArray(parsedA.assets);
        const arrA: any[] = isContainerA ? parsedA.assets : Array.isArray(parsedA) ? parsedA : [];
        const nextA = arrA.map((a) => {
          if (Array.isArray(a.documentIds)) {
            return { ...a, documentIds: a.documentIds.filter((x: any) => x !== docId) };
          }
          return a;
        });
        const outA = isContainerA ? { ...parsedA, assets: nextA } : Array.isArray(parsedA) ? nextA : { assets: nextA };
        localStorage.setItem(ASSETS_KEY, JSON.stringify(outA));
      }
    } catch {}
  }

  function handleDelete(id: string) {
    if (!confirm("Weet je zeker dat je dit document wilt verwijderen?")) return;
    persistDelete(id);
    setRows((r) => r.filter((x) => x.id !== id));
  }

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = !needle
      ? rows
      : rows.filter((r) =>
          [r.title, r.type, r.number, r.ownerName].filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(needle))
        );

    out = [...out].sort((a, b) => {
      if (sort.key === "status") {
        const sa = expiryStatus(a.expiresAt).label;
        const sb = expiryStatus(b.expiresAt).label;
        return sort.dir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
      }
      const ka = String(a[sort.key] ?? "");
      const kb = String(b[sort.key] ?? "");
      return sort.dir === "asc" ? ka.localeCompare(kb) : kb.localeCompare(ka);
    });

    return out;
  }, [rows, q, sort]);

  function toggleSort(key: keyof DocRow | "status") {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  return (
    <div className="ui-page">
      <div className="ui-section-title">Document register</div>

      <div className="ui-toolbar">
        <input placeholder="Zoeken…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="spacer" />
        <small>{filtered.length} resultaten</small>
      </div>

      <div className="ui-table-wrap">
        <table className="ui-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort("title")}>Titel</th>
              <th onClick={() => toggleSort("type")}>Type</th>
              <th onClick={() => toggleSort("number")}>Nummer</th>
              <th onClick={() => toggleSort("ownerName")}>Persoon</th>
              <th onClick={() => toggleSort("issuedAt")}>Uitgegeven</th>
              <th onClick={() => toggleSort("expiresAt")}>Geldig tot</th>
              <th onClick={() => toggleSort("status")}>Status</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const st = expiryStatus(r.expiresAt);
              return (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{r.type || ""}</td>
                  <td>{r.number || ""}</td>
                  <td>{r.ownerName || ""}</td>
                  <td>{r.issuedAt || ""}</td>
                  <td>{r.expiresAt || ""}</td>
                  <td><span className={st.cls}>{st.label}</span></td>
                  <td>
                    <button className="ui-btn ui-btn--sm ui-btn--danger" onClick={() => handleDelete(r.id)}>
                      Verwijderen
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8}><em>Geen documenten gevonden.</em></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


