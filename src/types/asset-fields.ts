// src/types/asset-fields.ts
export type AssetType =
  | "Verzekeringen" | "Abonnementen" | "Domeinnamen" | "Huishoudelijke apparaten"
  | "Audio en video" | "Vervoersmiddelen" | "Interieur-items" | "Antiek" | "Kunst"
  | "Hypotheek" | "Leningen" | "Bankrekeningen" | "Beleggingen" | "Technische installaties"
  | "Pensioenen" | "Rijbewijzen" | "Identificatie bewijzen" | "Nalatenschap bewijzen"
  | "Zakelijke belangen" | "ICT apparatuur" | "Schuldbekentenissen" | "Vastgoed bezittingen"
  | "Service providers";

export type FieldKind = "text" | "number" | "money" | "date" | "select" | "multiline" | "boolean" | "url";

export type FieldDef = {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: string[]; // alleen voor select
  placeholder?: string;
  hint?: string;
};

export type AssetSchema = {
  type: AssetType;
  fields: FieldDef[];
};

// Handige helper
export const money = (key: string, label: string, required=false): FieldDef =>
  ({ key, label, kind: "money", required });
