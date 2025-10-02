/* @ts-nocheck */
import React from "react";

const STORAGE_KEY = "pam-docs-v1";

/** Lees docs, ondersteunt zowel [] als {docs: []} (back-compat) */
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

/** Sla docs op in {docs: []} en zend update-event uit */
function saveDocs(nextDocs: any[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ docs: nextDocs }));
  // Laat andere panels (zoals DocumentRegisterPanel) live verversen
  window.dispatchEvent(new Event("pam-docs-updated"));
}

export default function DocumentsPanel() {
  const [title, setTitle] = React.useState("");
  const [filename, setFilename] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [savedId, setSavedId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const makeId = () =>
    (crypto?.randomUUID ? crypto.randomUUID() : `doc_${Date.now()}`);

  const handleSave = (goToRegisterAfter = false) => {
    setError(null);
    const t = title.trim();
    if (!t) {
      setError("Titel is verplicht.");
      return;
    }
    const now = new Date().toISOString();
    const newDoc = {
      id: makeId(),
      title: t,
      filename: filename.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    const docs = readDocs();
    docs.unshift(newDoc); // nieuw bovenaan
    saveDocs(docs);
    setSavedId(newDoc.id);

    // formulier leegmaken
    setTitle("");
    setFilename("");
    setNotes("");

    if (goToRegisterAfter) {
      // laat de shell naar de Document Register-tab springen
      const ev = new CustomEvent("pam-nav", { detail: "doc-register" });
      window.dispatchEvent(ev);
    }
  };

  const goToRegister = () => {
    const ev = new CustomEvent("pam-nav", { detail: "doc-register" });
    window.dispatchEvent(ev);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Documenten</h2>

      <p className="text-sm opacity-80">
        Hier maak je <strong>nieuwe documenten</strong> aan. Het overzicht van alle documenten staat in de tab{" "}
        <strong>Document Register</strong>.
      </p>

      <div className="rounded-lg border p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Titel *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded px-2 py-1"
            placeholder="Bijv. Factuur 2025-001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bestandsnaam / URL</label>
          <input
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="w-full border rounded px-2 py-1"
            placeholder="Bijv. factuur-2025-001.pdf of https://…"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notities</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded px-2 py-1"
            rows={3}
            placeholder="Optioneel"
          />
        </div>

        {error && <div className="text-red-700 text-sm">{error}</div>}
        {savedId && (
          <div className="text-green-700 text-sm">
            Document opgeslagen (ID: {savedId}). Je vindt ‘m in <button className="underline" onClick={goToRegister}>Document Register</button>.
          </div>
        )}

        <div className="flex gap-8 pt-2">
          <button className="btn" onClick={() => handleSave(false)}>
            Opslaan
          </button>
          <button className="btn" onClick={() => handleSave(true)}>
            Opslaan & naar Document Register
          </button>
        </div>
      </div>

      <div className="rounded-lg border p-3 text-sm opacity-70">
        (Later kun je hier extra tools zetten — viewer/annotate/koppelen — maar het registeroverzicht blijft
        exclusief in <em>Document Register</em>.)
      </div>
    </div>
  );
}


