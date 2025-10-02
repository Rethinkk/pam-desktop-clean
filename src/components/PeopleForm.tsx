/* @ts-nocheck */
import React, { useEffect, useState } from "react";
import type { Person, PersonRole } from "../types";
import { allPeople, upsertPerson } from "../lib/peopleStore";

type Props = {
  editing?: Person | null;           // laat leeg voor "nieuw"
  onSaved?: (p: Person) => void;     // callback na succesvol opslaan
  onCancel?: () => void;             // optioneel, bij bewerken
};

const ROLES: PersonRole[] = [
  "hoofdgebruiker",
  "partner",
  "kind",
  "gemachtigde",
  "serviceprovider",
  "overig",
];

export default function PeopleForm({ editing, onSaved, onCancel }: Props) {
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<PersonRole | "">("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  // 🔁 Gebruik een live people-lijst voor uniciteitschecks
  const [people, setPeople] = useState<Person[]>(() => allPeople());
  useEffect(() => {
    const handler = () => setPeople(allPeople());
    window.addEventListener("pam-people-updated", handler);
    return () => window.removeEventListener("pam-people-updated", handler);
  }, []);

  const editingId = editing?.id ?? null;

  // Prefill bij bewerken
  useEffect(() => {
    if (!editing) {
      setFullName(""); setRole(""); setEmail(""); setPhone(""); setNotes(""); setErrors([]);
      return;
    }
    const initialName = (editing.name || editing.fullName || "").trim();
    setFullName(initialName);
    setRole((editing.role as any) ?? "");
    setEmail(editing.email ?? "");
    setPhone(editing.phone ?? "");
    setNotes(editing.notes ?? "");
    setErrors([]);
  }, [editing]);

  function validate(): string[] {
    const errs: string[] = [];
    const nameNorm = fullName.trim().replace(/\s+/g, " ");
    const emailNorm = email.trim().toLowerCase();
    const phoneTrim = phone.trim();

    if (!nameNorm || nameNorm.length < 2) errs.push("Naam is verplicht (min. 2 tekens).");
    if (!role) errs.push("Rol is verplicht.");

    if (emailNorm) {
      if (!/.+@.+\..+/.test(emailNorm)) errs.push("E-mail is ongeldig.");
      const clash = people.find(
        (p) => (p.id !== editingId) && (p.email || "").trim().toLowerCase() === emailNorm
      );
      if (clash) errs.push("E-mail is al in gebruik.");
    }

    if (phoneTrim && !/^\+?[0-9\s\-()]{8,20}$/.test(phoneTrim)) {
      errs.push("Telefoonnummer is ongeldig.");
    }
    return errs;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v.length) { setErrors(v); return; }

    const now = new Date().toISOString();
    const normalized = fullName.trim().replace(/\s+/g, " ");

    const person: Person = {
      id: editingId ?? (crypto?.randomUUID ? crypto.randomUUID() : String(Date.now())),
      name: normalized,            // ✅ hoofdveld
      fullName: normalized,        // ✅ mag blijven als alias; kan ook weggelaten worden
      role: role as PersonRole,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    };

    upsertPerson(person);
    setErrors([]);
    onSaved?.(person);

    if (!editingId) {
      // reset alleen in nieuw-modus
      setFullName(""); setRole(""); setEmail(""); setPhone(""); setNotes("");
    }
  }

  const hasErrors = errors.length > 0;

  return (
    <form onSubmit={onSubmit} className="card space-y-3">
      <h2 className="font-semibold text-lg">{editing ? "Persoon bewerken" : "Nieuwe persoon"}</h2>

      {/* naam */}
      <div>
        <label className="label">Naam *</label>
        <input
          className="input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Bijv. Jan Jansen"
        />
      </div>

      {/* rol */}
      <div>
        <label className="label">Rol *</label>
        <select
          className="input"
          value={role}
          onChange={(e) => setRole(e.target.value as PersonRole)}
        >
          <option value="">— kies rol —</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* email/phone */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="label">E-mail (optioneel)</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="naam@domein.nl"
          />
        </div>
        <div>
          <label className="label">Telefoon (optioneel)</label>
          <input
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+31 6 1234 5678"
          />
        </div>
      </div>

      {/* notes */}
      <div>
        <label className="label">Notities (optioneel)</label>
        <textarea
          className="input"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Bijzonderheden, voorkeuren, etc."
        />
      </div>

      {/* errors */}
      {hasErrors && (
        <div className="text-red-600 text-sm space-y-1">
          {errors.map((err) => <div key={err}>• {err}</div>)}
        </div>
      )}

      {/* acties */}
      <div className="flex gap-2">
        <button
          type="submit"
          className="btn primary"
          disabled={hasErrors || !fullName.trim() || !role}
        >
          Opslaan
        </button>
        {editing && (
          <button type="button" className="btn" onClick={onCancel}>
            Annuleren
          </button>
        )}
      </div>
    </form>
  );
}

