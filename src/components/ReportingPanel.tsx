/* @ts-nocheck */
import React from "react";
import { loadRegister } from "../lib/assetNumber";
import type { Asset, Person } from "../types";
import { allPeople } from "../lib/peopleStore";
import { listCategoriesInUse, buildReport } from "../lib/reporting";

const RECIP_KEY = "pam-reporting-recipients";

function useAssets(): Asset[] {
  try {
    const { assets } = loadRegister();
    return Array.isArray(assets) ? assets : [];
  } catch {
    return [];
  }
}

function useRecipients() {
  const [ids, setIds] = React.useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(RECIP_KEY) || "[]");
    } catch {
      return [];
    }
  });
  React.useEffect(() => {
    localStorage.setItem(RECIP_KEY, JSON.stringify(ids));
  }, [ids]);
  return [ids, setIds] as const;
}

export default function ReportingPanel() {
  const assets = useAssets();
  // cast naar any[] zodat TS niet struikelt over jouw Asset-shape
  const categories = listCategoriesInUse(assets as any);

  const people: Person[] = React.useMemo(() => {
    try {
      return allPeople().filter((p) => !!p.email?.trim());
    } catch {
      return [];
    }
  }, []);
  const [recipientIds, setRecipientIds] = useRecipients();

  const [kind, setKind] = React.useState<"by-category" | "by-selection" | "total">("total");
  const [categoryCode, setCategoryCode] = React.useState<string>(categories[0]?.code ?? "");
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (!categoryCode && categories.length > 0) setCategoryCode(categories[0].code);
  }, [categories, categoryCode]);

  const selectedIds = React.useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([id]) => id),
    [selected]
  );

  function toggleSelected(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleRecipient(id: string) {
    setRecipientIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  // laat input any zijn zodat we niet afhankelijk zijn van reporting-types
  function buildInput(): any {
    if (kind === "total") return { kind: "total" };
    if (kind === "by-category") return { kind: "by-category", categoryCode };
    return { kind: "by-selection", selectedIds };
  }

  function handlePreview() {
    const input = buildInput();
    const { blob } = buildReport(assets as any[], input as any);
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function handleDownload() {
    const input = buildInput();
    const { blob, fileName } = buildReport(assets as any[], input as any);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
  }

  function handlePush() {
    const emails = people.filter((p) => recipientIds.includes(p.id)).map((p) => p.email!);
    const subject = encodeURIComponent("PAM Report");
    const body = encodeURIComponent("Beste ontvanger,\n\nIn de bijlage het nieuwste PAM-rapport.\n\nGroet,\nPAM");
    const bcc = emails.join(",");
    window.location.href = `mailto:?subject=${subject}&body=${body}&bcc=${encodeURIComponent(bcc)}`;
  }

  return (
    <div style={{ padding: 16, maxWidth: 1000 }}>
      <h2>Reporting</h2>
      <p>Genereer PDF-rapporten en verstuur ze naar gekozen ontvangers.</p>

      <section style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
        <h3 style={{ marginTop: 0 }}>Rapport type</h3>

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <label><input type="radio" name="kind" checked={kind === "total"} onChange={() => setKind("total")} /> Totaalrapport</label>
          <label><input type="radio" name="kind" checked={kind === "by-category"} onChange={() => setKind("by-category")} /> Per assetcategorie</label>
          <label><input type="radio" name="kind" checked={kind === "by-selection"} onChange={() => setKind("by-selection")} /> Voor geselecteerde assets</label>
        </div>

        {kind === "by-category" && (
          <div style={{ marginTop: 12 }}>
            <label>
              Categorie:&nbsp;
              <select value={categoryCode} onChange={(e) => setCategoryCode(e.target.value)}>
                {categories.map((c: any) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
                {categories.length === 0 && <option value="">(geen categorieën)</option>}
              </select>
            </label>
          </div>
        )}

        {kind === "by-selection" && (
          <div style={{ marginTop: 12, maxHeight: 280, overflow: "auto", border: "1px solid #eee", borderRadius: 8, padding: 8 }}>
            {assets.map((a: any) => {
              const nr = a?.number ?? a?.id; // veilig: jouw Asset hoeft 'number' niet te hebben
              return (
                <label key={a.id} style={{ display: "block", padding: "4px 2px" }}>
                  <input type="checkbox" checked={!!selected[a.id]} onChange={() => toggleSelected(a.id)} />{" "}
                  {String(nr)} — {a.name} ({String(a.typeCode)})
                </label>
              );
            })}
            {assets.length === 0 && <em>Geen assets gevonden.</em>}
          </div>
        )}
      </section>

      <section style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
        <h3 style={{ marginTop: 0 }}>Ontvangers</h3>
        <p style={{ marginTop: 0 }}>Selecteer wie de rapporten ontvangt (we gebruiken BCC).</p>
        <div style={{ maxHeight: 220, overflow: "auto", border: "1px solid #eee", borderRadius: 8, padding: 8 }}>
          {people.map((p) => (
            <label key={p.id} style={{ display: "block", padding: "4px 2px" }}>
              <input type="checkbox" checked={recipientIds.includes(p.id)} onChange={() => toggleRecipient(p.id)} />{" "}
              {p.name} &lt;{p.email}&gt;
            </label>
          ))}
          {people.length === 0 && <em>Geen personen met e-mail gevonden in People.</em>}
        </div>
      </section>

      <section style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button onClick={handlePreview}>Preview</button>
        <button onClick={handleDownload}>Download PDF</button>
        <button onClick={handlePush}>Push (e-mailconcept)</button>
      </section>
    </div>
  );
}
