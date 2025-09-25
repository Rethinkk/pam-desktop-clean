import { AssetTypeSchema } from "./types";

export const ASSET_SCHEMAS: AssetTypeSchema[] = [
  {
    code: "ITM",
    label: "IT-Materieel",
    required: [
      { key: "serialNumber", label: "Serienummer", kind: "text", placeholder: "SN-..." },
      { key: "purchaseDate", label: "Aankoopdatum", kind: "date" },
      { key: "purchasePrice", label: "Aankoopprijs", kind: "currency", placeholder: "€ 0,00" },
    ],
    optional: [
      { key: "brand", label: "Merk", kind: "text" },
      { key: "model", label: "Model", kind: "text" },
      { key: "warrantyUntil", label: "Garantie tot", kind: "date" },
      { key: "notes", label: "Notities", kind: "textarea" },
    ],
  },
  {
    code: "VEH",
    label: "Voertuig",
    required: [
      { key: "vin", label: "VIN / Chassisnr", kind: "text" },
      { key: "registration", label: "Kenteken", kind: "text" },
      { key: "firstUse", label: "Datum eerste toelating", kind: "date" },
    ],
    optional: [
      { key: "brand", label: "Merk", kind: "text" },
      { key: "model", label: "Model", kind: "text" },
      { key: "odometer", label: "Kilometerstand", kind: "number", placeholder: "0" },
      { key: "notes", label: "Notities", kind: "textarea" },
    ],
  },
  // ——— Nieuw: Rijbewijs ———
  {
    code: "DLV",
    label: "Rijbewijs",
    required: [
      { key: "issuingCountry", label: "Land van uitgifte", kind: "text" },
      { key: "issuingCity", label: "Plaats van uitgifte", kind: "text" },
      { key: "issueDate", label: "Datum van uitgifte", kind: "date" },
      { key: "expiryDate", label: "Expiratiedatum", kind: "date" },
      { key: "licenseNumber", label: "Rijbewijsnummer", kind: "text" },
    ],
    optional: [
      {
        key: "licenseCategory",
        label: "Rijbewijs type",
        kind: "select",
        options: ["A","A1","A2","AM","B","BE","C","CE","D","DE","T","Overig"],
      },
      { key: "licensePin", label: "Pincode rijbewijs", kind: "password", placeholder: "••••" },
    ],
  },
  // ——— Nieuw: Kunst ———
  {
    code: "ART",
    label: "Kunst",
    required: [
      { key: "artworkName", label: "Naam kunstwerk", kind: "text" },
      { key: "purchaseDate", label: "Datum van aankoop", kind: "date" },
      { key: "purchasePrice", label: "Aankoopbedrag", kind: "currency", placeholder: "€ 0,00" },
      { key: "hasCertificate", label: "Certificaat aanwezig", kind: "checkbox" },
      { key: "artistName", label: "Naam kunstenaar", kind: "text" },
      { key: "artworkPhotoUrl", label: "Foto kunstwerk (URL)", kind: "url", placeholder: "https://..." },
      {
        key: "artForm",
        label: "Kunstvorm",
        kind: "select",
        options: ["Schilderij","Beeldhouwwerk","Fotografie","Tekening","Installatie","Video","Mixed media","Anders"],
      },
    ],
    optional: [
      { key: "insurancePolicy", label: "Verzekeringspolisnummer", kind: "text" },
      { key: "insuredValue", label: "Verzekeringswaarde", kind: "currency", placeholder: "€ 0,00" },
    ],
  },
];

export const SCHEMA_BY_CODE: Record<string, AssetTypeSchema> =
  Object.fromEntries(ASSET_SCHEMAS.map(s => [s.code, s]));
