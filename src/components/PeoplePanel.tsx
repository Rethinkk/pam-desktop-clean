/* @ts-nocheck */
import React, { useState } from "react";
import { nanoid } from "nanoid";
import { allPeople, upsertPerson, removePerson } from "../lib/peopleStore";
import type { Person, PersonRole } from "../types";

const roleOptions: { value: PersonRole; label: string }[] = [
  { value: "hoofdgebruiker", label: "Hoofdgebruiker" },
  { value: "partner", label: "Partner" },
  { value: "kind", label: "Kind" },
  { value: "gemachtigde", label: "Gemachtigde" },
  { value: "serviceprovider", label: "Service provider" },
  { value: "overig", label: "Overig" },
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
      const clash = people.find(
        (p) =>
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
    if (v.length) {
      setErrors(v);
      return;
    }

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
    <>
      {/* ----- SCOPED LAYOUT: gelijk aan Assets/Docs ----- */}
      <style>{`
        .people-scope { --field-max: 720px; } /* pas aan naar 680/740/760 voor finetune */

        /* 2-koloms grid in het formulier:
           kolom 1 = labels (auto breedte), kolom 2 = velden (max --field-max) */
        .people-scope form {
          display: grid;
          grid-template-columns: max-content minmax(0, var(--field-max));
          column-gap: 16px;
          row-gap: 12px;
          align-items: center;
          /* ➜ voeg deze regel toe voor extra ruimte links */
  padding-left: 12px;  /* probeer 12–16px */
}

/* optioneel: op mobiel geen extra inset */
@media (max-width: 640px) {
  .people-scope form { padding-left: 0; }
        }

        /* Veel markup gebruikt wrappers; flatten zodat label/veld per rij komen */
        .people-scope form > div,
        .people-scope form > section,
        .people-scope form > fieldset,
        .people-scope form > div > div {
          display: contents;
        }

        /* Titel bovenaan over volle breedte */
        .people-scope form h2 {
          grid-column: 1 / -1;
          font-size: 20px;
          font-weight: 700;
          margin: 4px 0 12px;
        }

        /* Labels links */
        .people-scope form label {
          grid-column: 1;
          white-space: nowrap;
          font-weight: 600;
          color: #0f172a;
        }

        /* Velden rechts (beperkte breedte) */
        .people-scope form input,
        .people-scope form select,
        .people-scope form textarea {
          grid-column: 2;
          max-width: var(--field-max);
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          background: #fff;
          color: #0f172a;
          padding: 10px 12px;
          height: 44px;
          box-sizing: border-box;
        }
        .people-scope form textarea {
          min-height: 120px; height: auto; resize: vertical;
        }

        /* Validatie & acties over volledige breedte */
        .people-scope .errors,
        .people-scope .actions {
          grid-column: 1 / -1;
        }

        .people-scope .btn {
          height: 44px;
          padding: 0 16px;
          border-radius: 12px;
          font-weight: 700;
          border: 0;
        }
        .people-scope .btn-primary {
          background: #0f172a; color: #fff;
        }
        .people-scope .btn-ghost {
          background: #f1f5f9; color: #0f172a; border: 1px solid #e2e8f0;
        }

        /* Responsief: laat velden meerekken; labels boven velden */
        @media (max-width: 1100px) { .people-scope { --field-max: 100%; } }
        @media (max-width: 640px)  {
          .people-scope form { grid-template-columns: 1fr; }
          .people-scope form label { margin-bottom: 4px; white-space: normal; }
        }
      `}</style>

      <div className="people-scope grid md:grid-cols-2 gap-6">
        {/* Linkerkolom: formulier (logica blijft identiek) */}
        <form onSubmit={handleSubmit} className="border rounded-2xl p-4 shadow-sm" noValidate>
          <h2>{editing ? "Persoon bewerken" : "Nieuwe persoon"}</h2>

          <label htmlFor="pp-name">Naam</label>
          <input
            id="pp-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <label htmlFor="pp-role">Rol</label>
          <select
            id="pp-role"
            value={role}
            onChange={(e) => setRole(e.target.value as PersonRole)}
          >
            {roleOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* E-mail en Telefoon stonden in een nested grid;
              door 'display: contents' worden die wrappers genegeerd */}
          <label htmlFor="pp-email">E-mail</label>
          <input
            id="pp-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="pp-phone">Telefoon</label>
          <input
            id="pp-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            pattern="^\+?[0-9\s\-()]{8,20}$"
            title="Gebruik alleen cijfers, spaties, - ( ) en optioneel +; 8–20 tekens"
          />

          {errors.length > 0 && (
            <div className="errors text-red-600 text-sm mt-1 space-y-1">
              {errors.map((err) => (
                <div key={err}>• {err}</div>
              ))}
            </div>
          )}

          <div className="actions mt-3 flex items-center gap-2">
            <button className="btn btn-primary">
              {editing ? "Bijwerken" : "Opslaan"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={cancelEdit}
                className="btn btn-ghost"
              >
                Annuleren
              </button>
            )}
          </div>
        </form>

        {/* Rechterkolom: lijst (ongewijzigd) */}
        <div>
          <h2 className="font-semibold text-lg mb-3">Mensen</h2>
          <ul className="space-y-2">
            {people
              .slice()
              .reverse()
              .map((p) => (
                <li
                  key={p.id}
                  className="border rounded-2xl p-3 flex items-start justify-between"
                >
                  <div>
                    <div className="font-medium">{p.fullName}</div>
                    <div className="text-sm text-gray-600 capitalize">{p.role}</div>
                    {(p.email || p.phone) && (
                      <div className="text-sm mt-1 text-gray-700">
                        {p.email && <span>{p.email}</span>}{" "}
                        {p.email && p.phone && "· "} {p.phone}
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
                      onClick={() => {
                        removePerson(p.id);
                        refresh();
                      }}
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
    </>
  );
}
