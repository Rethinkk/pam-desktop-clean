/* @ts-nocheck */
import React from "react";
import { allPeople } from "../lib/peopleStore";

export function SinglePersonSelect({
  value,
  onChange,
  placeholder,
}: {
  value?: string;
  onChange: (id?: string) => void;
  placeholder?: string;
}) {
  const people = allPeople();
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || undefined)}
      className="w-full border rounded p-2"
    >
      <option value="">{placeholder ?? "— kies persoon —"}</option>
      {people.map((p: any) => (
        <option key={p.id} value={p.id}>
          {p.fullName}
        </option>
      ))}
    </select>
  );
}

export function MultiPersonSelect({
  values,
  onChange,
}: {
  values: string[];
  onChange: (ids: string[]) => void;
}) {
  const people = allPeople();

  function toggle(id: string) {
    const set = new Set(values);
    set.has(id) ? set.delete(id) : set.add(id);
    onChange([...set]);
  }

  return (
    <div className="border rounded p-2 max-h-40 overflow-auto space-y-1">
      {people.length === 0 && (
        <div className="text-sm text-gray-500">
          Nog geen mensen. Voeg ze toe via tab <b>Mensen</b>.
        </div>
      )}
      {people.map((p: any) => (
        <label key={p.id} className="flex gap-2 items-center text-sm">
          <input
            type="checkbox"
            checked={values.includes(p.id)}
            onChange={() => toggle(p.id)}
          />
          <span>{p.fullName}</span>
        </label>
      ))}
    </div>
  );
}
