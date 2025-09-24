import React from "react";

export type CategoryOption = { value: string; label: string };

type Props = {
  id?: string;
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options?: CategoryOption[];
  required?: boolean;
};

const DEFAULT_OPTIONS: CategoryOption[] = [
  { value: "", label: "-- Selecteer --" },
  { value: "onroerend", label: "Onroerend goed" },
  { value: "voertuig", label: "Voertuigen" },
  { value: "aandeel", label: "Aandelen" },
  { value: "kunst", label: "Kunst & antiek" },
];

export default function CategorySelect({
  id = "categorie",
  label = "Kies categorie",
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  required,
}: Props) {
  return (
    <div className="form-row">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        {options.map((opt) => (
          <option key={opt.value || "empty"} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

