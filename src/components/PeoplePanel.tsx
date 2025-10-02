/* @ts-nocheck */
import React, { useState, useEffect } from "react";
import { nanoid } from "nanoid";
import { allPeople, upsertPerson, removePerson } from "../lib/peopleStore";
import type { Person, PersonRole } from "../types";

const roleOptions: { value: PersonRole; label: string }[] = [
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
  const [name, setName]   = useState("");
  const [role, setRole]   = useState<PersonRole>("overig");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  // bewerken
  const [editing, setEditing] = useState<Person | null>(null);

  // helpers
  const normalizeName  = (raw: string) => (raw || "").trim().replace(/\s+/g, " ");
  const getDisplayName = (p: Partial<Person>) => normalizeName(String(p.name ?? p.fullName ?? ""));

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("pam-people-updated", handler);
    return () => window.removeEventListener("pam-people-updated", handler);
  }, []);

  function validate(isEdit: boolean): string[] {
    const errs: string[] = [];
    const nameNorm  = normalizeName(name);
    const emailNorm = (email || "").trim().toLowerCase();
    const phoneTrim = (phone || "").trim();

    if (!nameNorm || nameNorm.length < 2) errs.push("Naam is verplicht (min. 2 tekens).");

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
    setName("");
    setRole("overig");
    setEmail("");
    setPhone("");
    setErrors([]);
  }

  function startEdit(p: Person) {
    setEditing(p);
    setName(getDisplayName(p));
    setRole((p.role as PersonRole) || "overig");
    setEmail((p.email || "").trim());
    setPhone((p.phone || "").trim());
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
    const safeName = normalizeName(name);

    if (editing) {
      const updated: Person = {
        ...editing,
        name: safeName,
        fullName: safeName,
        role,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        updatedAt: now,
      };
      try { upsertPerson(updated); } catch {}
      refresh();
      setEditing(null);
      resetForm();
      return;
    }

    const created: Person = {
      id: nanoid(),
      name: safeName,
      fullName: safeName,
      role,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
    try { upsertPerson(created); } catch {}
    refresh();
    resetForm();
  }

  return (
    <div className="stack">
      <form onSubmit={handleSubmit} className="card">
        <h2 className="section-title">Nieuwe persoon</h2>

        <div className="field">
          <label>Naam</label>
          <input
            className="input"
            value={name}
            onChange={e=>setName(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label>Rol</label>
          <select
            className="input"
            value={role}
            onChange={e=>setRole(e.target.value as PersonRole)}
          >
            {roleOptions.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="inline-controls">
          <div className="field" style={{flex:1}}>
            <label>E-mail</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
            />
          </div>
          <div className="field" style={{flex:1}}>
            <label>Telefoon</label>
            <input
              className="input"
              value={phone}
              onChange={e=>setPhone(e.target.value)}
              pattern="^\+?[0-9\\s\\-()]{8,20}$"
              title="Gebruik alleen cijfers, spaties, - ( ) en optioneel +; 8–20 tekens"
            />
          </div>
        </div>

        {errors.length > 0 && (
          <div className="tip" style={{color:"#b91c1c"}}>
            {errors.map(err => <div key={err}>• {err}</div>)}
          </div>
        )}

        <div className="actions">
          <button type="submit" className="btn primary">
            {editing ? "Bijwerken" : "Opslaan"}
          </button>
          {editing && (
            <button type="button" className="btn" onClick={cancelEdit}>
              Annuleren
            </button>
          )}
        </div>
      </form>

      <div className="stack">
        <h2 className="section-title">Mensen</h2>
        {people.length === 0 ? (
          <div className="card">Nog geen personen toegevoegd.</div>
        ) : (
          <ul className="stack">
            {people.slice().reverse().map(p => {
              const display = getDisplayName(p);
              return (
                <li key={p.id} className="card" style={{padding:"12px"}}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{display}</div>
                      <div className="text-sm capitalize">{p.role}</div>
                      {(p.email || p.phone) && (
                        <div className="text-sm" style={{marginTop:4}}>
                          {p.email && <span>{p.email}</span>} {p.email && p.phone && "· "} {p.phone}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className="btn" onClick={() => startEdit(p)}>Bewerken</button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => { try { removePerson(p.id); } catch {}; refresh(); }}
                      >
                        Verwijderen
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}


