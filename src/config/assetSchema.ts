// src/config/assetSchema.ts
import { schemaRepository } from "../storage/repositories";

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
export function loadAssetSchema(): AssetSchema {
  const parsed = schemaRepository.load();
  if (!parsed?.types?.length) return DEFAULT_ASSET_SCHEMA;
  return parsed;
}

export function saveAssetSchema(schema: AssetSchema) {
  schemaRepository.save(schema);
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
  version: 2,
  types: [
    /* 1) VERZEKERINGEN */
    {
      id: "verzekering",
      label: "Verzekering",
      fields: [
        { key: "maatschappij", label: "Maatschappij", type: "text", required: true },
        { key: "polisnummer", label: "Polisnummer", type: "text", required: true },
        { key: "ingangsdatum", label: "Ingangsdatum", type: "date", required: true },
        { key: "einddatum", label: "Einddatum", type: "date", required: false },
        { key: "type_verzekering", label: "Type verzekering", type: "select", required: false, options: ["Auto","Woning","Reis","Aansprakelijkheid","Overig"] },
        { key: "verzekerd_bedrag", label: "Verzekerd bedrag", type: "currency", required: false },
        { key: "premie_per_jaar", label: "Premie per jaar", type: "currency", required: false },
        { key: "betalingsfrequentie", label: "Betalingsfrequentie", type: "select", required: false, options: ["Maandelijks","Jaarlijks"] },
        { key: "document", label: "Polisdocument", type: "file", required: false },
      ],
    },

    /* 2) ICT-APPARATUUR */
    {
      id: "ict-apparatuur",
      label: "ICT apparatuur",
      fields: [
        { key: "naam", label: "Apparaat", type: "text", required: true },
        { key: "merk", label: "Merk", type: "text", required: true },
        { key: "serienummer", label: "Serienummer", type: "text", required: true },
        { key: "model", label: "Model", type: "text", required: false },
        { key: "aankoopdatum", label: "Aankoopdatum", type: "date", required: false },
        { key: "garantie_tot", label: "Garantie tot", type: "date", required: false },
        { key: "aankoopwaarde", label: "Waarde bij aankoop", type: "currency", required: false },
        { key: "locatie", label: "Locatie (huis/kantoor)", type: "text", required: false },
        { key: "factuur", label: "Factuur", type: "file", required: false },
      ],
    },

    /* 3) ABONNEMENTEN */
    {
      id: "abonnement",
      label: "Abonnement",
      fields: [
        { key: "aanbieder", label: "Aanbieder", type: "text", required: true },
        { key: "type_dienst", label: "Type dienst", type: "select", required: true, options: ["Telefoon","Internet","Streaming","Software","Energie","Overig"] },
        { key: "maandbedrag", label: "Maandbedrag", type: "currency", required: true },
        { key: "startdatum", label: "Startdatum", type: "date", required: false },
        { key: "einddatum", label: "Einddatum", type: "date", required: false },
        { key: "contractduur", label: "Contractduur", type: "text", required: false },
        { key: "opzegtermijn", label: "Opzegtermijn", type: "text", required: false },
        { key: "klantnummer", label: "Klantnummer", type: "text", required: false },
      ],
    },

    /* 4) DOMEINNAMEN */
    {
      id: "domeinnaam",
      label: "Domeinnaam",
      fields: [
        { key: "naam", label: "Domeinnaam", type: "text", required: true, placeholder: "voorbeeld.nl" },
        { key: "registrar", label: "Registrar", type: "text", required: true },
        { key: "extensie", label: "Extensie", type: "select", required: false, options: [".nl",".com",".eu",".org",".io",".net"] },
        { key: "verlengdatum", label: "Verlengdatum", type: "date", required: false },
        { key: "nameservers", label: "Nameservers", type: "textarea", required: false, hint: "Eén per regel" },
        { key: "hostingprovider", label: "Hostingprovider", type: "text", required: false },
        { key: "autorisatiecode", label: "Autorisatiecode", type: "text", required: false },
      ],
    },

    /* 5) VASTGOED */
    {
      id: "vastgoed",
      label: "Vastgoed bezittingen",
      fields: [
        { key: "adres", label: "Adres", type: "text", required: true },
        { key: "type_pand", label: "Type pand", type: "select", required: true, options: ["Woning","Appartement","Garage","Grond"] },
        { key: "aankoopdatum", label: "Aankoopdatum", type: "date", required: false },
        { key: "aankoopprijs", label: "Aankoopprijs", type: "currency", required: false },
        { key: "huidige_waarde", label: "Huidige waarde", type: "currency", required: false },
        { key: "hypotheekverstrekker", label: "Hypotheekverstrekker", type: "text", required: false },
        { key: "perceelnummer", label: "Perceelnummer", type: "text", required: false },
        { key: "oppervlakte_m2", label: "Oppervlakte (m²)", type: "number", required: false },
        { key: "energielabel", label: "Energielabel", type: "select", required: false, options: ["A","B","C","D","E","F","G"] },
        { key: "foto", label: "Foto", type: "file", required: false },
      ],
    },

    /* 6) HYPOTHEEK */
    {
      id: "hypotheek",
      label: "Hypotheek",
      fields: [
        { key: "verstrekker", label: "Hypotheekverstrekker", type: "text", required: true },
        { key: "hoofdsom", label: "Totaalbedrag", type: "currency", required: true },
        { key: "rentepercentage", label: "Rente (%)", type: "number", required: true },
        { key: "startdatum", label: "Startdatum", type: "date", required: false },
        { key: "einddatum", label: "Einddatum", type: "date", required: false },
        { key: "contract", label: "Contract", type: "file", required: false },
      ],
    },

    /* 7) LENINGEN (niet-hypotheek) */
    {
      id: "leningen",
      label: "Leningen",
      fields: [
        { key: "verstrekker", label: "Verstrekker/Uitlener", type: "text", required: true },
        { key: "type_lening", label: "Type lening", type: "select", required: true, options: ["Persoonlijk","Doorlopend krediet","Studieschuld","Overig"] },
        { key: "totaalbedrag", label: "Totaalbedrag", type: "currency", required: true },
        { key: "maandlast", label: "Maandlast", type: "currency", required: false },
        { key: "rentepercentage", label: "Rente (%)", type: "number", required: false },
        { key: "looptijd_jaren", label: "Looptijd (jaren)", type: "number", required: false },
        { key: "startdatum", label: "Startdatum", type: "date", required: false },
        { key: "einddatum", label: "Einddatum", type: "date", required: false },
        { key: "contract", label: "Contract", type: "file", required: false },
      ],
    },

    /* 8) BANKREKENINGEN */
    {
      id: "bankrekeningen",
      label: "Bankrekeningen",
      fields: [
        { key: "bank", label: "Bank/Instelling", type: "text", required: true },
        { key: "iban", label: "IBAN", type: "text", required: true },
        { key: "type_rekening", label: "Type rekening", type: "select", required: false, options: ["Betaal","Spaar","Beleggings"] },
        { key: "valuta", label: "Valuta", type: "select", required: false, options: ["EUR","USD","GBP","Overig"] },
        { key: "saldo", label: "Saldo", type: "currency", required: false },
        { key: "sinds", label: "Sinds", type: "date", required: false },
        { key: "rekeninghouder", label: "Rekeninghouder", type: "text", required: false },
        { key: "bic", label: "BIC", type: "text", required: false },
      ],
    },

    /* 9) BELEGGINGEN */
    {
      id: "beleggingen",
      label: "Beleggingen",
      fields: [
        { key: "partij", label: "Broker/Bank", type: "text", required: true },
        { key: "rekening", label: "Rekening/Depot", type: "text", required: false },
        { key: "categorie", label: "Categorie", type: "select", required: false, options: ["Aandelen","Obligaties","ETF","Fonds","Alternatief"] },
        { key: "valuta", label: "Valuta", type: "select", required: false, options: ["EUR","USD","GBP","Overig"] },
        { key: "notities", label: "Notities", type: "textarea", required: false },
      ],
    },

    /* 10) PENSIOENEN */
    {
      id: "pensioenen",
      label: "Pensioenen",
      fields: [
        { key: "maatschappij", label: "Uitvoerder/Maatschappij", type: "text", required: true },
        { key: "polisnummer", label: "Polis-/Deelnemingsnr.", type: "text", required: true },
        { key: "startjaar", label: "Startjaar", type: "text", required: false },
        { key: "jaarlijkse_opbouw", label: "Jaarlijkse opbouw", type: "currency", required: false },
        { key: "verwachte_uitkering", label: "Verwachte uitkering", type: "currency", required: false },
        { key: "pensioenleeftijd", label: "Pensioenleeftijd", type: "number", required: false },
        { key: "deelnemer_sinds", label: "Deelnemer sinds", type: "date", required: false },
      ],
    },

    /* 11) KUNST */
    {
      id: "kunst",
      label: "Kunst",
      fields: [
        { key: "titel", label: "Titel", type: "text", required: true },
        { key: "kunstenaar", label: "Kunstenaar", type: "text", required: true },
        { key: "jaar", label: "Jaar", type: "text", required: false },
        { key: "materiaal", label: "Materiaal", type: "text", required: false },
        { key: "afmetingen", label: "Afmetingen", type: "text", required: false },
        { key: "aankoopdatum", label: "Aankoopdatum", type: "date", required: false },
        { key: "aankoopprijs", label: "Aankoopprijs", type: "currency", required: false },
        { key: "huidige_waarde", label: "Huidige waarde", type: "currency", required: false },
        { key: "locatie", label: "Locatie", type: "text", required: false },
        { key: "certificaat", label: "Certificaat", type: "file", required: false },
        { key: "foto", label: "Foto", type: "file", required: false },
      ],
    },

    /* 12) ANTIEK */
    {
      id: "antiek",
      label: "Antiek",
      fields: [
        { key: "naam", label: "Object", type: "text", required: true },
        { key: "maker", label: "Maker", type: "text", required: true },
        { key: "periode", label: "Periode", type: "text", required: false },
        { key: "materiaal", label: "Materiaal", type: "text", required: false },
        { key: "afmetingen", label: "Afmetingen", type: "text", required: false },
        { key: "aankoopdatum", label: "Aankoopdatum", type: "date", required: false },
        { key: "aankoopprijs", label: "Aankoopprijs", type: "currency", required: false },
        { key: "huidige_waarde", label: "Huidige waarde", type: "currency", required: false },
        { key: "certificaat", label: "Certificaat", type: "file", required: false },
        { key: "foto", label: "Foto", type: "file", required: false },
      ],
    },

    /* 13) INTERIEUR-ITEMS */
    {
      id: "interieur-items",
      label: "Interieur-items",
      fields: [
        { key: "naam", label: "Item", type: "text", required: true },
        { key: "categorie", label: "Categorie", type: "select", required: true, options: ["Meubel","Apparaat","Verlichting","Decoratie"] },
        { key: "merk", label: "Merk", type: "text", required: false },
        { key: "model", label: "Model", type: "text", required: false },
        { key: "aankoopdatum", label: "Aankoopdatum", type: "date", required: false },
        { key: "waarde", label: "Waarde", type: "currency", required: false },
        { key: "garantie_tot", label: "Garantie tot", type: "date", required: false },
        { key: "foto", label: "Foto", type: "file", required: false },
      ],
    },

    /* 14) HUISHOUDELIJKE APPARATEN */
    {
      id: "huishoudelijke-apparaten",
      label: "Huishoudelijke apparaten",
      fields: [
        { key: "naam", label: "Apparaat", type: "text", required: true },
        { key: "categorie", label: "Categorie", type: "select", required: true, options: ["Keuken","Schoonmaak","Wassen/Drogen","Overig"] },
        { key: "merk", label: "Merk", type: "text", required: false },
        { key: "model", label: "Model", type: "text", required: false },
        { key: "aankoopdatum", label: "Aankoopdatum", type: "date", required: false },
        { key: "waarde", label: "Waarde", type: "currency", required: false },
        { key: "garantie_tot", label: "Garantie tot", type: "date", required: false },
        { key: "foto", label: "Foto", type: "file", required: false },
      ],
    },

    /* 15) AUDIO EN VIDEO */
    {
      id: "audio-video",
      label: "Audio en video",
      fields: [
        { key: "naam", label: "Naam", type: "text", required: true },
        { key: "merk", label: "Merk", type: "text", required: true },
        { key: "serienummer", label: "Serienummer", type: "text", required: false },
        { key: "model", label: "Model", type: "text", required: false },
        { key: "aankoopdatum", label: "Aankoopdatum", type: "date", required: false },
        { key: "waarde", label: "Waarde", type: "currency", required: false },
        { key: "foto", label: "Foto", type: "file", required: false },
      ],
    },

    /* 16) VERVOERSMIDDELEN */
    {
      id: "vervoersmiddelen",
      label: "Vervoersmiddelen",
      fields: [
        { key: "type", label: "Type voertuig", type: "select", required: true, options: ["Auto","Motor","Fiets","Boot","Overig"] },
        { key: "merk", label: "Merk", type: "text", required: true },
        { key: "identificatie", label: "Kenteken/Identificatie", type: "text", required: true },
        { key: "bouwjaar", label: "Bouwjaar", type: "number", required: false },
        { key: "kilometerstand", label: "Kilometerstand", type: "number", required: false },
        { key: "aankoopdatum", label: "Aankoopdatum", type: "date", required: false },
        { key: "verzekering", label: "Verzekering", type: "text", required: false },
        { key: "waarde", label: "Waarde", type: "currency", required: false },
        { key: "onderhoudsboekje", label: "Onderhoudsboekje", type: "file", required: false },
      ],
    },

    /* 17) RIJBEWIJZEN */
    {
      id: "rijbewijzen",
      label: "Rijbewijzen",
      fields: [
        { key: "nummer", label: "Nummer", type: "text", required: true },
        { key: "afgiftedatum", label: "Afgiftedatum", type: "date", required: true },
        { key: "geldig_tot", label: "Geldig tot", type: "date", required: true },
        { key: "scan", label: "Scan", type: "file", required: false },
      ],
    },

    /* 18) IDENTIFICATIE-BEWIJZEN */
    {
      id: "identificatie-bewijzen",
      label: "Identificatie bewijzen",
      fields: [
        { key: "type", label: "Type", type: "select", required: true, options: ["Paspoort","ID-kaart","VISA","Overig"] },
        { key: "nummer", label: "Documentnummer", type: "text", required: true },
        { key: "uitgegeven_door", label: "Uitgegeven door", type: "text", required: false },
        { key: "uitgiftedatum", label: "Uitgiftedatum", type: "date", required: false },
        { key: "geldig_tot", label: "Geldig tot", type: "date", required: false },
        { key: "scan", label: "Scan", type: "file", required: false },
      ],
    },

    /* 19) ZAKELIJKE BELANGEN */
    {
      id: "zakelijke-belang",
      label: "Zakelijke belangen",
      fields: [
        { key: "entiteit", label: "Organisatie/Entiteit", type: "text", required: true },
        { key: "type_belang", label: "Type belang", type: "select", required: true, options: ["Bedrijf","Aandelen","Partnerschap","Overig"] },
        { key: "percentage", label: "Percentage eigendom", type: "number", required: false },
        { key: "kvk", label: "KvK-nummer", type: "text", required: false },
        { key: "startdatum", label: "Startdatum", type: "date", required: false },
        { key: "document", label: "Document", type: "file", required: false },
      ],
    },

    /* 20) TECHNISCHE INSTALLATIES */
    {
      id: "technische-installaties",
      label: "Technische installaties",
      fields: [
        { key: "naam", label: "Systeemnaam", type: "text", required: true },
        { key: "leverancier", label: "Leverancier", type: "text", required: true },
        { key: "type_installatie", label: "Type installatie", type: "select", required: false, options: ["Zonnepanelen","Alarmsysteem","Airco","Boiler","Overig"] },
        { key: "installatiedatum", label: "Installatiedatum", type: "date", required: false },
        { key: "onderhoudsinterval", label: "Onderhoudsinterval", type: "text", required: false },
        { key: "contract", label: "Contract", type: "file", required: false },
        { key: "waarde", label: "Waarde", type: "currency", required: false },
      ],
    },

    /* 21) SCHULDBEKENTENISSEN */
    {
      id: "schuldbekentenissen",
      label: "Schuldbekentenissen",
      fields: [
        { key: "schuldeiser", label: "Schuldeiser/Tegenpartij", type: "text", required: true },
        { key: "bedrag", label: "Bedrag", type: "currency", required: true },
        { key: "rentepercentage", label: "Rente (%)", type: "number", required: false },
        { key: "looptijd", label: "Looptijd", type: "text", required: false },
        { key: "startdatum", label: "Startdatum", type: "date", required: false },
        { key: "document", label: "Document", type: "file", required: false },
      ],
    },

    /* 22) NALATENSCHAP BEWIJZEN */
    {
      id: "nalatenschap-bewijzen",
      label: "Nalatenschap bewijzen",
      fields: [
        { key: "document_type", label: "Documenttype", type: "select", required: true, options: ["Testament","Verklaring van erfrecht","Levenstestament","Overig"] },
        { key: "referentie", label: "Referentienummer", type: "text", required: true },
        { key: "notaris", label: "Notaris", type: "text", required: false },
        { key: "datum", label: "Datum opmaak", type: "date", required: false },
        { key: "betrokkenen", label: "Betrokken personen", type: "textarea", required: false },
        { key: "document", label: "Kopie document", type: "file", required: false },
      ],
    },

    /* 23) SERVICE PROVIDERS */
    {
      id: "service-providers",
      label: "Service providers",
      fields: [
        { key: "naam", label: "Naam leverancier", type: "text", required: true },
        { key: "type_dienst", label: "Type dienst", type: "select", required: true, options: ["Onderhoud","Schoonmaak","Beveiliging","IT/Software","Advies","Overig"] },
        { key: "contactpersoon", label: "Contactpersoon", type: "text", required: false },
        { key: "telefoon", label: "Telefoon", type: "phone", required: false },
        { key: "email", label: "E-mail", type: "email", required: false },
        { key: "contractdatum", label: "Contractdatum", type: "date", required: false },
        { key: "contract", label: "Contract (bijlage)", type: "file", required: false },
        { key: "website", label: "Website", type: "url", required: false },
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
