// src/config/assetSchema.ts

/** -----------------------------
 *  Type-definities
 *  ----------------------------- */
export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "file"
  | "currency"
  | "boolean"
  | "url"
  | "email"
  | "phone";

export interface AssetFieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];      // bij select
  placeholder?: string;
  hint?: string;           // korte helptekst
}

export interface AssetTypeDefinition {
  id: string;              // machine id, bv. "verzekering"
  label: string;           // UI label, bv. "Verzekering"
  fields: AssetFieldDefinition[];
}

export interface AssetSchema {
  version: number;
  types: AssetTypeDefinition[];
}

/** -----------------------------
 *  Helpers voor opslag/gebruik
 *  ----------------------------- */
const STORAGE_KEY = "pam-asset-schema-v1";

export function loadAssetSchema(): AssetSchema {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_ASSET_SCHEMA;
  try {
    const parsed = JSON.parse(raw);
    // simpele guard: val terug als er geen types zijn
    if (!parsed?.types?.length) return DEFAULT_ASSET_SCHEMA;
    return parsed;
  } catch {
    return DEFAULT_ASSET_SCHEMA;
  }
}

export function saveAssetSchema(schema: AssetSchema) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schema));
}

export function getAssetType(schema: AssetSchema, typeId: string): AssetTypeDefinition | undefined {
  return schema.types.find(t => t.id === typeId);
}

/**
 * Valideer asset-data tegen het schema van het gekozen type.
 * @returns errors: Record<fieldKey, message>
 */
export function validateAsset(schema: AssetSchema, typeId: string, data: Record<string, any>) {
  const type = getAssetType(schema, typeId);
  const errors: Record<string, string> = {};
  if (!type) {
    errors["_type"] = "Onbekend asset type.";
    return errors;
  }
  for (const f of type.fields) {
    const v = data?.[f.key];
    if (f.required) {
      const empty =
        v === undefined ||
        v === null ||
        (typeof v === "string" && v.trim() === "");
      if (empty) errors[f.key] = `${f.label} is verplicht.`;
    }
  }
  return errors;
}

/** -----------------------------
 *  Standaard-velden (meeneembaar)
 *  ----------------------------- */
const COMMON_OWNER_FIELDS: AssetFieldDefinition[] = [
  { key: "eigenaar", label: "Eigenaar", type: "text", required: false, hint: "Persoon of entiteit" },
];

const COMMON_VALUE_FIELDS: AssetFieldDefinition[] = [
  { key: "waarde", label: "Waarde", type: "currency", required: false },
  { key: "valuta", label: "Valuta", type: "select", required: false, options: ["EUR","USD","GBP","JPY","CHF"] },
];

const COMMON_META_FIELDS: AssetFieldDefinition[] = [
  { key: "aankoopdatum", label: "Aankoopdatum", type: "date", required: false },
  { key: "notities", label: "Notities", type: "textarea", required: false },
  { key: "bijlage", label: "Bijlage", type: "file", required: false },
];

/** -----------------------------
 *  DEFAULT_ASSET_SCHEMA
 *  (alle types met kernvelden)
 *  ----------------------------- */
export const DEFAULT_ASSET_SCHEMA: AssetSchema = {
  version: 1,
  types: [
    {
      id: "verzekering",
      label: "Verzekering",
      fields: [
        { key: "maatschappij", label: "Maatschappij", type: "text", required: true },
        { key: "polisnummer", label: "Polisnummer", type: "text", required: true },
        { key: "ingangsdatum", label: "Ingangsdatum", type: "date", required: true },
        { key: "einddatum", label: "Einddatum", type: "date", required: false },
        { key: "premie_per_maand", label: "Premie per maand", type: "currency", required: false },
        ...COMMON_OWNER_FIELDS,
        ...COMMON_META_FIELDS,
      ],
    },
    {
      id: "abonnement",
      label: "Abonnement",
      fields: [
        { key: "provider", label: "Provider", type: "text", required: true },
        { key: "product", label: "Product", type: "text", required: true, placeholder: "Bijv. Internet 1 Gbps" },
        { key: "klantnummer", label: "Klantnummer", type: "text", required: false },
        { key: "startdatum", label: "Startdatum", type: "date", required: true },
        { key: "opzegtermijn", label: "Opzegtermijn", type: "text", required: false, hint: "Bijv. 1 maand" },
        { key: "kosten_per_maand", label: "Kosten per maand", type: "currency", required: false },
        ...COMMON_OWNER_FIELDS,
        ...COMMON_META_FIELDS,
      ],
    },
    {
      id: "domeinnaam",
      label: "Domeinnaam",
      fields: [
        { key: "naam", label: "Domein", type: "text", required: true, placeholder: "voorbeeld.nl" },
        { key: "registrar", label: "Registrar", type: "text", required: true },
        { key: "expiratiedatum", label: "Expiratiedatum", type: "date", required: true },
        { key: "nameservers", label: "Nameservers", type: "textarea", required: false, hint: "Eén per regel" },
        ...COMMON_OWNER_FIELDS,
        ...COMMON_META_FIELDS,
      ],
    },
    {
      id: "huishoudelijke-apparaten",
      label: "Huishoudelijke apparaten",
      fields: [
        { key: "naam", label: "Apparaat", type: "text", required: true },
        { key: "merk", label: "Merk", type: "text", required: false },
        { key: "model", label: "Model", type: "text", required: false },
        { key: "serienummer", label: "Serienummer", type: "text", required: false },
        { key: "garantie_tot", label: "Garantie tot", type: "date", required: false },
        ...COMMON_VALUE_FIELDS,
        ...COMMON_OWNER_FIELDS,
        ...COMMON_META_FIELDS,
      ],
    },
    {
      id: "audio-video",
      label: "Audio en video",
      fields: [
        { key: "naam", label: "Naam", type: "text", required: true },
        { key: "merk", label: "Merk", type: "text", required: false },
        { key: "model", label: "Model", type: "text", required: false },
        { key: "serienummer", label: "Serienummer", type: "text", required: false },
        ...COMMON_VALUE_FIELDS,
        ...COMMON_OWNER_FIELDS,
        ...COMMON_META_FIELDS,
      ],
    },
    {
      id: "vervoersmiddelen",
      label: "Vervoersmiddelen",
      fields: [
        { key: "type", label: "Type", type: "select", required: true, options: ["Auto","Motor","Fiets","Boot","Overig"] },
        { key: "merk", label: "Merk", type: "text", required: true },
        { key: "model", label: "Model", type: "text", required: true },
        { key: "kenteken", label: "Kenteken/VIN", type: "text", required: false },
        { key: "bouwjaar", label: "Bouwjaar", type: "number", required: false },
        ...COMMON_VALUE_FIELDS,
        ...COMMON_OWNER_FIELDS,
        ...COMMON_META_FIELDS,
      ],
    },
    {
      id: "interieur-items",
      label: "Interieur-items",
      fields: [
        { key: "naam", label: "Item", type: "text", required: true },
        { key: "materiaal", label: "Materiaal", type: "text", required: false },
        { key: "afmetingen", label: "Afmetingen", type: "text", required: false },
        ...COMMON_VALUE_FIELDS,
        ...COMMON_META_FIELDS,
      ],
    },
    {
      id: "antiek",
      label: "Antiek",
      fields: [
        { key: "naam", label: "Object", type: "text", required: true },
        { key: "periode", label: "Periode", type: "text", required: false },
        { key: "herkomst", label: "Herkomst", type: "text", required: false },
        { key: "certificaat", label: "Certificaat", type: "file", required: false },
        ...COMMON_VALUE_FIELDS,
        ...COMMON_META_FIELDS,
      ],
    },
    {
      id: "kunst",
      label: "Kunst",
      fields: [
        { key: "titel", label: "Titel", type: "text", required: true },
        { key: "kunstenaar", label: "Kunstenaar", type: "text", required: true },
        { key: "jaar", label: "Jaar", type: "number", required: false },
        { key: "certificaat", label: "Certificaat", type: "file", required: false },
        ...COMMON_VALUE_FIELDS,
        ...COMMON_META_FIELDS,
      ],
    },
    {
      id: "hypotheek",
      label: "Hypotheek",
      fields: [
        { key: "verstrekker", label: "Hypotheekverstrekker", type: "text", required: true },
        { key: "leningnummer", label: "Leningnummer", type: "text", required: true },
        { key: "hoofdsom", label: "Hoofdsom", type: "currency", required: true },
        { key: "rente", label: "Rente (%)", type: "number", required: true },
        { key: "looptijd_einde", label: "Einde looptijd", type: "date", required: false },
        ...COMMON_META_FIELDS,
      ],
    },
    {
      id: "leningen",
      label: "Leningen",
      fields: [
        { key: "verstrekker", label: "Verstrekker/Uitlener", type: "text", required: true },
        { key: "leningnummer", label: "Leningnummer", type: "text", required: false },
        { key: "bedrag", label: "Bedrag", type: "currency", required: true },
        { key: "rente", label: "Rente (%)", type: "number", required: false },
        { key: "aflosschema", label: "Aflosschema", type: "textarea", required: false },
        ...COMMON_META_FIELDS,
      ],
    },
    {
      id: "bankrekeningen",
      label: "Bankrekeningen",
      fields: [
        { key: "bank", label: "Bank", type: "text", required: true },
        { key: "iban", label: "IBAN", type: "text", required: true },
        { key: "bic", label: "BIC", type: "text", required: false },
        ...COMMON_META_FIELDS,
      ],
    },
    {
      id: "beleggingen",
      label: "Beleggingen",
      fields: [
        { key: "partij", label: "Broker/Bank", type: "text", required: true },
        { key: "rekening", label: "Rekening/Depot", type: "text", required: false },
        { key: "categorie", label: "Categorie", type: "select", required: false, options: ["Aandelen","Obligaties","ETF","Fonds","Alternatief"] },
        ...COMMON_VALUE_FIELDS,
        ...COMMON_META_FIELDS,
      ],
    },
    {
      id: "technische-installaties",
      label: "Technische installaties",
      fields: [
        { key: "naam", label: "Installatie", type: "text", required: true },
        { key: "merk", label: "Merk", type: "text", required: false },
        { key: "model", label: "Model", type: "text", required: false },
        { key: "onderhoudscontract", label: "Onderhoudscontract", type: "boolean", required: false },
        ...COMMON_META_FIELDS,
      ],
    },
    {
      id: "pensioenen",
      label: "Pensioenen",
      fields: [
        { key: "uitvoerder", label: "Uitvoerder", type: "text", required: true },
        { key: "polisnummer", label: "Polis-/Deelnemingsnr.", type: "text", required: true },
        { key: "pensioendatum", label: "Pensioendatum", type: "date", required: false },
        ...COMMON_META_FIELDS,
      ],
    },
    {
      id: "rijbewijzen",
      label: "Rijbewijzen",
      fields: [
        { key: "nummer", label: "Nummer", type: "text", required: true },
        { key: "afgiftedatum", label: "Afgiftedatum", type: "date", required: true },
        { key: "geldig_tot", label: "Geldig tot", type: "date", required: true },
        ...COMMON_META_FIELDS,
      ],
    },
    {
      id: "identificatie-bewijzen",
      label: "Identificatie bewijzen",
      fields: [
        { key: "type", label: "Type", type: "select", required: true, options: ["Paspoort","ID-kaart","VISA","Overig"] },
        { key: "nummer", label: "Nummer", type: "text", required: true },
        { key: "geldig_tot", label: "Geldig tot", type: "date", required: true },
        ...COMMON_META_FIELDS,
      ],
    },
    {
      id: "nalatenschap-bewijzen",
      label: "Nalatenschap bewijzen",
      fields: [
        { key: "document_type", label: "Documenttype", type: "select", required: true, options: ["Testament","Levenstestament","Akte","Overig"] },
        { key: "datum", label: "Datum", type: "date", required: false },
        { key: "document", label: "Document", type: "file", required: false },
        ...COMMON_META_FIELDS,
      ],
    },
    {
      id: "zakelijke-belang",
      label: "Zakelijke belangen",
      fields: [
        { key: "entiteit", label: "Entiteit", type: "text", required: true, placeholder: "BV/VOF/Stichting" },
        { key: "kvk", label: "KvK-nummer", type: "text", required: false },
        { key: "aandeel", label: "Aandeel (%)", type: "number", required: false },
        ...COMMON_META_FIELDS,
      ],
    },
    {
      id: "ict-apparatuur",
      label: "ICT apparatuur",
      fields: [
        { key: "naam", label: "Apparaat", type: "text", required: true },
        { key: "merk", label: "Merk", type: "text", required: false },
        { key: "model", label: "Model", type: "text", required: false },
        { key: "serienummer", label: "Serienummer", type: "text", required: false },
        { key: "garantie_tot", label: "Garantie tot", type: "date", required: false },
        ...COMMON_VALUE_FIELDS,
        ...COMMON_META_FIELDS,
      ],
    },
    {
      id: "schuldbekentenissen",
      label: "Schuldbekentenissen",
      fields: [
        { key: "tegenpartij", label: "Tegenpartij", type: "text", required: true },
        { key: "bedrag", label: "Bedrag", type: "currency", required: true },
        { key: "ondertekend_op", label: "Ondertekend op", type: "date", required: false },
        { key: "document", label: "Document", type: "file", required: false },
        ...COMMON_META_FIELDS,
      ],
    },
    {
      id: "vastgoed",
      label: "Vastgoed bezittingen",
      fields: [
        { key: "adres", label: "Adres", type: "text", required: true },
        { key: "kadastraal", label: "Kadastrale gegevens", type: "text", required: false },
        { key: "bouwjaar", label: "Bouwjaar", type: "number", required: false },
        ...COMMON_VALUE_FIELDS,
        ...COMMON_META_FIELDS,
      ],
    },
    {
      id: "service-providers",
      label: "Service providers",
      fields: [
        { key: "naam", label: "Naam", type: "text", required: true },
        { key: "categorie", label: "Categorie", type: "select", required: false, options: ["Onderhoud","Schoonmaak","IT","Juridisch","Financieel","Overig"] },
        { key: "email", label: "E-mail", type: "email", required: false },
        { key: "telefoon", label: "Telefoon", type: "phone", required: false },
        { key: "website", label: "Website", type: "url", required: false },
        ...COMMON_META_FIELDS,
      ],
    },
  ],
};

/** -----------------------------
 *  Quick usage (voorbeeld)
 *  -----------------------------
 *  const schema = loadAssetSchema();
 *  const typeDef = getAssetType(schema, selectedTypeId);
 *  const errors = validateAsset(schema, selectedTypeId, formState);
 */
