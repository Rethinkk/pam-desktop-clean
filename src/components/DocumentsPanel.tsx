/* @ts-nocheck */
import React, { useState } from "react";

const STORAGE_KEY = "pam-docs-v1";

function readState(): { docs: any[]; [k: string]: any } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { docs: [] };
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { docs: parsed };           // legacy root-array
    if (Array.isArray(parsed?.docs)) return { ...parsed };         // { docs: [...] }
    return { docs: [] };
  } catch {
    return { docs: [] };
  }
}

function writeState(next: { docs: any[]; [k: string]: any }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("pam-docs-updated"));
}

function uid() {
  try { return crypto.randomUUID(); }
  catch { return `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
}

export default function DocumentsPanel({ onSavedGoRegister }: { onSavedGoRegister?: () => void }) {
  const [title, setTitle] = useState("");
  const [file, setFile]   = useState("");
  const [notes, setNotes] = useState("");

  function reset() {
    setTitle(""); setFile(""); setNotes("");
  }

  function handleSave(goRegister?: boolean) {
    if (!title.trim()) { alert("Titel is verplicht."); return; }

    const now = new Date().toISOString();
    const doc = {
      id: uid(),
      title: title.trim(),
      name: title.trim(),         // compat voor read-paden die 'name' verwachten
      fileName: file.trim(),
      filename: file.trim(),      // idem voor 'filename'
      notes: notes.trim(),
      createdAt: now,
      updatedAt: now,
    };

    const prev = readState();
    const next = { ...prev, docs: [...(prev.docs || []), doc] };
    writeState(next);

    if (goRegister) {
      try { onSavedGoRegister?.(); } catch {}
      try { window.dispatchEvent(new CustomEvent("pam-open-doc-register")); } catch {}
    }
    reset();
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSave(false); }} className="space-y-4 max-w-3xl">
      <h2 className="text-lg font-semibold">Documenten</h2>
      <p className="text-sm text-gray-600 section-title">
        Hier maak je <strong>nieuwe documenten</strong> aan. Het overzicht staat in de tab <strong>Document Register</strong>.
      </p>

      <div className="field">
        <label htmlFor="doc-title" className="text-sm font-medium">Titel *</label>
        <input
          id="doc-title"
          className="border rounded px-2 py-1 w-full"
          placeholder="Bijv. Factuur 2025-001"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="doc-file" className="text-sm font-medium">Bestandsnaam / URL</label>
        <input
          id="doc-file"
          className="border rounded px-2 py-1 w-full"
          placeholder="Bijv. factuur-2025-001.pdf of https://…"
          value={file}
          onChange={(e) => setFile(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="doc-notes" className="text-sm font-medium">Notities</label>
        <textarea
          id="doc-notes"
          className="border rounded px-2 py-1 w-full"
          rows={4}
          placeholder="Optioneel"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="actions">
        <button type="submit" className="border rounded px-4 py-2 font-medium">Opslaan</button>
        <button type="button" className="border rounded px-4 py-2 font-medium" onClick={() => handleSave(true)}>
          Opslaan & naar Document Register
        </button>
      </div>
    </form>
  );
}



