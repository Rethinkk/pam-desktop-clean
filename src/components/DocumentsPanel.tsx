import React from "react";
import { assetRepository, documentRepository, personRepository } from "../storage/repositories";
import { openPamTab } from "../lib/workspaceTabs";
import { EmptyState } from "./ui/UI";

type DocType = "Polis" | "Factuur" | "Garantiebewijs" | "Contract" | "Overig";

type FormState = {
  title: string;
  type: DocType | "";
  assetId: string;
  number: string;
  personId: string;
  issuedAt: string;   // yyyy-mm-dd
  expiresAt: string;  // yyyy-mm-dd
  notes: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileDataUrl: string;
};

type PersonLite = { id: string; display: string };
type AssetLite = { id: string; display: string };

export default function DocumentsPanel() {
  const [form, setForm] = React.useState<FormState>({
    title: "",
    type: "",
    assetId: "",
    number: "",
    personId: "",
    issuedAt: "",
    expiresAt: "",
    notes: "",
    fileName: "",
    fileSize: 0,
    mimeType: "",
    fileDataUrl: "",
  });

  const [people, setPeople] = React.useState<PersonLite[]>([]);
  const [assets, setAssets] = React.useState<AssetLite[]>([]);
  const [docCount, setDocCount] = React.useState(0);

  React.useEffect(() => {
    setDocCount(documentRepository.all().length);

    const assetList: AssetLite[] = assetRepository.load().assets.map((a: any) => ({
      id: a.id,
      display: [
        a.name ?? a.data?.naam ?? a.data?.titel ?? a.assetNumber ?? "Asset",
        a.typeLabel ?? a.type,
      ].filter(Boolean).join(" — "),
    }));
    setAssets(assetList.filter((a) => !!a.id && !!a.display));

    const norm: PersonLite[] = personRepository.all().map((p: any) => ({
      id: p.id ?? String(p.email ?? p.phone ?? Math.random()),
      display: (p.fullName ?? p.name ?? "—").trim(),
    }));
    setPeople(norm.filter((p) => !!p.display && !!p.id));
  }, []);

  function onChange<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((s) => ({ ...s, [key]: val }));
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setForm((s) => ({ ...s, fileName: "", fileSize: 0, mimeType: "", fileDataUrl: "" }));
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      window.dispatchEvent(
        new CustomEvent("pam:toast", {
          detail: { message: "Bestand is groter dan 4MB.", tone: "warn" },
        }),
      );
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((s) => ({
        ...s,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        fileDataUrl: String(reader.result || ""),
      }));
    };
    reader.readAsDataURL(file);
  }

  const requiredOK =
    form.title.trim().length > 1 &&
    !!form.type;

  function save() {
    if (!requiredOK) return;

    const id = (globalThis as any).crypto?.randomUUID?.() ?? String(Date.now());
    const owner = people.find((p) => p.id === form.personId);
    const linkedAsset = assets.find((a) => a.id === form.assetId);

    const doc = {
      id,
      title: form.title.trim(),
      type: form.type,
      assetIds: form.assetId ? [form.assetId] : [],
      assetNames: linkedAsset ? [linkedAsset.display] : undefined,
      number: form.number.trim() || undefined,
      ownerId: form.personId || undefined,
      ownerName: owner?.display || undefined,
      fileName: form.fileName || undefined,
      filename: form.fileName || undefined,
      fileSize: form.fileSize || undefined,
      size: form.fileSize || undefined,
      mimeType: form.mimeType || undefined,
      mime: form.mimeType || undefined,
      fileDataUrl: form.fileDataUrl || undefined,
      dataUrl: form.fileDataUrl || undefined,
      issuedAt: form.issuedAt || undefined,
      expiresAt: form.expiresAt || undefined,
      notes: form.notes?.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    documentRepository.saveAll([...documentRepository.all(), doc as any]);
    if (form.assetId) {
      const nextAssets = assetRepository.load().assets.map((asset: any) => {
        if (asset.id !== form.assetId) return asset;
        return {
          ...asset,
          documentIds: Array.from(new Set([...(asset.documentIds ?? []), id])),
          updatedAt: new Date().toISOString(),
        };
      });
      assetRepository.save({ assets: nextAssets });
    }
    setDocCount((current) => current + 1);

    window.dispatchEvent(
      new CustomEvent("pam:toast", {
        detail: { message: "Document opgeslagen in register ✅", tone: "success" }
      })
    );


    // reset naar leeg formulier
    setForm({
      title: "",
      type: "",
      assetId: "",
      number: "",
      personId: "",
      issuedAt: "",
      expiresAt: "",
      notes: "",
      fileName: "",
      fileSize: 0,
      mimeType: "",
      fileDataUrl: "",
    });
  }

  return (
    <div className="ui-page">
      <div className="ui-section-title">Nieuw document</div>

      {docCount === 0 && (
        <div style={{ marginBottom: 16 }}>
          <EmptyState
            title="Bewaar uw eerste document"
            body="Voeg een polis, factuur, contract of garantiebewijs toe. PAM helpt zo om bewijsstukken later snel aan assets en betrokken personen te koppelen."
            actionLabel="Document invullen"
            secondaryLabel="Naar asset register"
            onAction={() => document.getElementById("doc-title")?.focus()}
            onSecondary={() => openPamTab("asset-register")}
          />
        </div>
      )}

      <div className="ui-form-grid">
        {/* Titel (verplicht) */}
        <div className="span-2 ui-field">
          <label htmlFor="doc-title">Titel *</label>
          <input
            id="doc-title"
            placeholder='Bijv. "Polis Aansprakelijkheid 2025"'
            value={form.title}
            onChange={(e) => onChange("title", e.target.value)}
          />
          <small>Gebruik een herkenbare naam. Nummer en datums kun je hieronder kwijt.</small>
        </div>

        {/* Type (verplicht) */}
        <div className="span-2 ui-field">
          <label htmlFor="doc-type">Type *</label>
          <select
            id="doc-type"
            value={form.type}
            onChange={(e) => onChange("type", e.target.value as FormState["type"])}
          >
            <option value="">— Kies een type —</option>
            <option>Polis</option>
            <option>Factuur</option>
            <option>Garantiebewijs</option>
            <option>Contract</option>
            <option>Overig</option>
          </select>
        </div>

        {/* Asset (optie) */}
        <div className="span-2 ui-field">
          <label htmlFor="doc-asset">Koppel aan asset (optie)</label>
          <select
            id="doc-asset"
            value={form.assetId}
            onChange={(e) => onChange("assetId", e.target.value)}
          >
            <option value="">— Geen —</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>{a.display}</option>
            ))}
          </select>
          {assets.length === 0 && (
            <small>Er zijn nog geen assets om aan te koppelen.</small>
          )}
        </div>

        {/* Persoon (optie) */}
        <div className="span-2 ui-field">
          <label htmlFor="doc-person">Koppel aan persoon (optie)</label>
          <select
            id="doc-person"
            value={form.personId}
            onChange={(e) => onChange("personId", e.target.value)}
          >
            <option value="">— Geen —</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.display}</option>
            ))}
          </select>
        </div>

        {/* Nummer (optie) */}
        <div className="span-2 ui-field">
          <label htmlFor="doc-number">Documentnummer (optie)</label>
          <input
            id="doc-number"
            placeholder="Bijv. POL-2025-00123"
            value={form.number}
            onChange={(e) => onChange("number", e.target.value)}
          />
        </div>

        <div className="span-2 ui-field">
          <label htmlFor="doc-file">Bestand toevoegen (optie)</label>
          <input
            id="doc-file"
            type="file"
            accept="image/*,application/pdf,text/plain,text/csv,application/json"
            onChange={onFileChange}
          />
          <small>
            {form.fileName
              ? `Gekozen: ${form.fileName} · ${Math.round(form.fileSize / 1024)} kB · ${form.mimeType || "onbekend type"}`
              : "Voeg een pdf, afbeelding of tekstbestand toe als u het document ook direct wilt kunnen bekijken."}
          </small>
        </div>

        {/* Linkerkolom */}
        <div className="ui-field">
          <div className="ui-section-title">Datums</div>

          <label htmlFor="issuedAt">Uitgegeven op</label>
          <input
            id="issuedAt"
            type="date"
            value={form.issuedAt}
            onChange={(e) => onChange("issuedAt", e.target.value)}
            placeholder="dd/mm/jjjj"
          />

          <label htmlFor="expiresAt" style={{ marginTop: 12 }}>Geldig tot</label>
          <input
            id="expiresAt"
            type="date"
            value={form.expiresAt}
            onChange={(e) => onChange("expiresAt", e.target.value)}
            placeholder="dd/mm/jjjj"
          />
        </div>

        {/* Rechterkolom */}
        <div className="ui-field">
          <div className="ui-section-title">Notities</div>
          <label htmlFor="doc-notes">Opmerkingen</label>
          <textarea
            id="doc-notes"
            rows={7}
            placeholder="Bijv. Polisnummer op PDF, bijlage staat in e-mail van 12-03-2025, enz."
            value={form.notes}
            onChange={(e) => onChange("notes", e.target.value)}
          />
        </div>
      </div>

      {/* Acties onderaan formulier */}
      <div className="ui-actions">
        <button className="ui-btn ui-btn-primary" disabled={!requiredOK} onClick={save}>
          Opslaan in register
        </button>
      </div>

      {!requiredOK && (
        <small style={{ display: "block", marginTop: 8 }}>
          Vul minimaal <strong>Titel</strong> en <strong>Type</strong> in.
        </small>
      )}

      <small style={{ display: "block", marginTop: 12 }}>
        Na opslaan verschijnt het item in <strong>Document register</strong>.
      </small>
    </div>
  );
}

