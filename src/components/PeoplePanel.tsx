/* @ts-nocheck */
import React, { useState } from "react";
import { nanoid } from "nanoid";
import { allPeople, upsertPerson, removePerson } from "../lib/peopleStore";
import type { Person, PersonRole } from "../types";

const roleOptions: {value: PersonRole; label: string}[] = [
  { value: "hoofdgebruiker", label: "Hoofdgebruiker" },
  { value: "partner",        label: "Partner" },
  { value: "kind",           label: "Kind" },
  { value: "gemachtigde",    label: "Gemachtigde" },
  { value: "serviceprovider",label: "Service provider" },
  { value: "overig",         label: "Overig" },
];

export default function PeoplePanel() {
  const [people, setPeople] = useState<Person[]>(() => allPeople());
  const refresh = () => setPeople(allPeople());

  // form state
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<PersonRole>("overig");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  // bewerken
  const [editing, setEditing] = useState<Person | null>(null);

  function validate(isEdit: boolean): string[] {
    const errs: string[] = [];
    const name = (fullName || "").trim().replace(/\s+/g, " ");
    const emailNorm = (email || "").trim().toLowerCase();
    const phoneTrim = (phone || "").trim();

    if (!name || name.length < 2) errs.push("Naam is verplicht (min. 2 tekens).");

    if (emailNorm) {
      if (!/.+@.+\..+/.test(emailNorm)) errs.push("E-mail is ongeldig.");
      const clash = people.find(p =>
        (p.email || "").trim().toLowerCase() === emailNorm &&
        (!isEdit || p.id !== editing?.id)
      );
      if (clash) errs.push("E-mail is al in gebruik.");
    }

    if (phoneTrim && !/^\+?[0-9\s\-()]{8,20}$/.test(phoneTrim)) {
      errs.push("Telefoonnummer is ongeldig.");
    }
    return errs;
  }

  function resetForm() {
    setFullName("");
    setRole("overig");
    setEmail("");
    setPhone("");
    setErrors([]);
  }

  function startEdit(p: Person) {
    setEditing(p);
    setFullName(p.fullName || "");
    setRole((p.role as PersonRole) || "overig");
    setEmail(p.email || "");
    setPhone(p.phone || "");
    setErrors([]);
  }

  function cancelEdit() {
    setEditing(null);
    resetForm();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate(Boolean(editing));
    if (v.length) { setErrors(v); return; }

    const now = new Date().toISOString();

    if (editing) {
      // bijwerken
      upsertPerson({
        ...editing,
        fullName: fullName.trim().replace(/\s+/g, " "),
        role,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        updatedAt: now,
      });
      setEditing(null);
    } else {
      // nieuw
      upsertPerson({
        id: nanoid(),
        fullName: fullName.trim().replace(/\s+/g, " "),
        role,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      });
    }

    refresh();
    resetForm();
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form onSubmit={handleSubmit} className="border rounded-2xl p-4 shadow-sm">
        <h2 className="font-semibold text-lg mb-3">
          {editing ? "Persoon bewerken" : "Nieuwe persoon"}
        </h2>

        <label className="block text-sm mb-1">Naam</label>
        <input
          value={fullName}
          onChange={e=>setFullName(e.target.value)}
          required
          className="w-full border rounded p-2 mb-3"
        />

        <label className="block text-sm mb-1">Rol</label>
        <select
          value={role}
          onChange={e=>setRole(e.target.value as PersonRole)}
          className="w-full border rounded p-2 mb-3"
        >
          {roleOptions.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Telefoon</label>
            <input
              value={phone}
              onChange={e=>setPhone(e.target.value)}
              pattern="^\+?[0-9\s\-()]{8,20}$"
              title="Gebruik alleen cijfers, spaties, - ( ) en optioneel +; 8–20 tekens"
              className="w-full border rounded p-2"
            />
          </div>
        </div>

        {errors.length > 0 && (
          <div className="text-red-600 text-sm mt-3 space-y-1">
            {errors.map(err => <div key={err}>• {err}</div>)}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <button className="px-4 py-2 rounded-xl border shadow-sm">
            {editing ? "Bijwerken" : "Opslaan"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 rounded-xl border shadow-sm"
            >
              Annuleren
            </button>
          )}
        </div>
      </form>

      <div>
        <h2 className="font-semibold text-lg mb-3">Mensen</h2>
        <ul className="space-y-2">
          {people.slice().reverse().map(p => (
            <li key={p.id} className="border rounded-xl p-3 flex items-start justify-between">
              <div>
                <div className="font-medium">{p.fullName}</div>
                <div className="text-sm text-gray-600 capitalize">{p.role}</div>
                {(p.email || p.phone) && (
                  <div className="text-sm mt-1 text-gray-700">
                    {p.email && <span>{p.email}</span>} {p.email && p.phone && "· "} {p.phone}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => startEdit(p)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Bewerken
                </button>
                <button
                  onClick={()=>{ removePerson(p.id); refresh(); }}
                  className="text-sm text-red-600 hover:underline"
                >
                  Verwijderen
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

