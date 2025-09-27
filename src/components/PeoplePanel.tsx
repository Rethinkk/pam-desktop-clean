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

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<PersonRole>("overig");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const now = new Date().toISOString();
    upsertPerson({ id: nanoid(), fullName, role, email, phone, createdAt: now });
    setFullName(""); setEmail(""); setPhone(""); setRole("overig");
    refresh();
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form onSubmit={handleAdd} className="border rounded-2xl p-4 shadow-sm">
        <h2 className="font-semibold text-lg mb-3">Nieuwe persoon</h2>
        <label className="block text-sm mb-1">Naam</label>
        <input value={fullName} onChange={e=>setFullName(e.target.value)} required className="w-full border rounded p-2 mb-3" />
        <label className="block text-sm mb-1">Rol</label>
        <select value={role} onChange={e=>setRole(e.target.value as PersonRole)} className="w-full border rounded p-2 mb-3">
          {roleOptions.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">E-mail</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Telefoon</label>
            <input value={phone} onChange={e=>setPhone(e.target.value)} className="w-full border rounded p-2" />
          </div>
        </div>
        <button className="mt-4 px-4 py-2 rounded-xl border shadow-sm">Opslaan</button>
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
              <button onClick={()=>{ removePerson(p.id); refresh(); }} className="text-sm text-red-600 hover:underline">
                Verwijderen
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}