/* @ts-nocheck */

/**
 * Stabiele IDs + labels voor ALLE asset types.
 * - id = technische sleutel (lowercase, underscores)  → voor opslag & schema lookup
 * - label = wat je in de UI ziet (Nederlands)
 */

export type AssetTypeId =
  | 'verzekeringen'
  | 'abonnementen'
  | 'domeinnamen'
  | 'huishoudelijke_apparaten'
  | 'audio_video'
  | 'vervoersmiddelen'
  | 'interieur_items'
  | 'antiek'
  | 'kunst'
  | 'hypotheek'
  | 'leningen'
  | 'bankrekeningen'
  | 'beleggingen'
  | 'technische_installaties'
  | 'pensioenen'
  | 'rijbewijzen'
  | 'identificatie_bewijzen'
  | 'nalatenschap_bewijzen'
  | 'zakelijke_belangen'
  | 'ict'
  | 'schuldbekentenissen'
  | 'vastgoed_bezittingen'
  | 'service_providers';

export const ASSET_TYPES: Array<{ id: AssetTypeId; label: string }> = [
  { id: 'verzekeringen', label: 'Verzekeringen' },
  { id: 'abonnementen', label: 'Abonnementen' },
  { id: 'domeinnamen', label: 'Domeinnamen' },
  { id: 'huishoudelijke_apparaten', label: 'Huishoudelijke apparaten' },
  { id: 'audio_video', label: 'Audio en video' },
  { id: 'vervoersmiddelen', label: 'Vervoersmiddelen' },
  { id: 'interieur_items', label: 'Interieur-items' },
  { id: 'antiek', label: 'Antiek' },
  { id: 'kunst', label: 'Kunst' },
  { id: 'hypotheek', label: 'Hypotheek' },
  { id: 'leningen', label: 'Leningen' },
  { id: 'bankrekeningen', label: 'Bankrekeningen' },
  { id: 'beleggingen', label: 'Beleggingen' },
  { id: 'technische_installaties', label: 'Technische installaties' },
  { id: 'pensioenen', label: 'Pensioenen' },
  { id: 'rijbewijzen', label: 'Rijbewijzen' },
  { id: 'identificatie_bewijzen', label: 'Identificatie bewijzen' },
  { id: 'nalatenschap_bewijzen', label: 'Nalatenschap bewijzen' },
  { id: 'zakelijke_belangen', label: 'Zakelijke belangen' },
  { id: 'ict', label: 'ICT apparatuur' },
  { id: 'schuldbekentenissen', label: 'Schuldbekentenissen' },
  { id: 'vastgoed_bezittingen', label: 'Vastgoed bezittingen' },
  { id: 'service_providers', label: 'Service providers' },
];

/* ---------- Schema-helpers (hergebruik) ---------- */
const BASE_PRICE = [
  { key: 'priceCents', label: 'Prijs/Waarde', required: true },
];
const BASE_NOTES = [{ key: 'notes', label: 'Notities' }];
const BASE_DATES = [
  { key: 'purchaseDate', label: 'Start-/Aankoopdatum', required: true },
  { key: 'warrantyUntil', label: 'Einddatum/Geldig t/m' },
];
const BASE_DEVICE = [
  { key: 'serial', label: 'Serienummer' },
  { key: 'brand', label: 'Merk' },
  { key: 'model', label: 'Model' },
  ...BASE_DATES,
  ...BASE_PRICE,
  ...BASE_NOTES,
];
const BASE_SIMPLE_CONTRACT = [
  { key: 'brand', label: 'Leverancier/Verstrekker' },
  ...BASE_DATES,
  ...BASE_PRICE,
  ...BASE_NOTES,
];

/**
 * Voor alle types definiëren we velden.
 * Let op: keys als 'serial', 'purchaseDate', 'warrantyUntil', 'priceCents', 'brand', 'model', 'notes'
 * hebben in jouw UI al speciale/bruikbare renderers. Onbekende keys vallen terug op een normaal tekstveld.
 */
export const ASSET_SCHEMAS: Record<
  AssetTypeId,
  { fields: Array<{ key: string; label: string; required?: boolean }> }
> = {
  verzekeringen: {
    fields: [
      { key: 'policyNumber', label: 'Polisnummer', required: true },
      { key: 'brand', label: 'Verzekeraar' },
      ...BASE_DATES, // start/einde
      ...BASE_PRICE, // premie/prijs
      ...BASE_NOTES,
    ],
  },
  abonnementen: {
    fields: [
      { key: 'contractId', label: 'Contract-/Klantnummer' },
      ...BASE_SIMPLE_CONTRACT,
    ],
  },
  domeinnamen: {
    fields: [
      { key: 'domainName', label: 'Domeinnaam', required: true },
      { key: 'brand', label: 'Registrar/Provider' },
      { key: 'purchaseDate', label: 'Registratiedatum', required: true },
      { key: 'warrantyUntil', label: 'Verloopt op' },
      ...BASE_PRICE, // jaarprijs
      ...BASE_NOTES,
    ],
  },
  huishoudelijke_apparaten: { fields: BASE_DEVICE },
  audio_video: { fields: BASE_DEVICE },
  vervoersmiddelen: {
    fields: [
      { key: 'serial', label: 'VIN/Chassisnr.' },
      { key: 'brand', label: 'Merk' },
      { key: 'model', label: 'Model' },
      { key: 'plate', label: 'Kenteken' },
      ...BASE_DATES,
      ...BASE_PRICE,
      ...BASE_NOTES,
    ],
  },
  interieur_items: {
    fields: [
      { key: 'brand', label: 'Merk/Omschrijving' },
      ...BASE_DATES,
      ...BASE_PRICE,
      ...BASE_NOTES,
    ],
  },
  antiek: {
    fields: [
      { key: 'brand', label: 'Herkomst/Omschrijving' },
      ...BASE_DATES,
      ...BASE_PRICE,
      ...BASE_NOTES,
    ],
  },
  kunst: {
    fields: [
      { key: 'brand', label: 'Kunstenaar' },
      { key: 'model', label: 'Werk/Serie' },
      ...BASE_DATES,
      ...BASE_PRICE,
      ...BASE_NOTES,
    ],
  },
  hypotheek: {
    fields: [
      { key: 'brand', label: 'Bank/Verstrekker', required: true },
      { key: 'purchaseDate', label: 'Startdatum', required: true },
      { key: 'warrantyUntil', label: 'Einddatum' },
      { key: 'priceCents', label: 'Restschuld/Hoofdsom', required: true },
      ...BASE_NOTES,
    ],
  },
  leningen: {
    fields: [
      { key: 'brand', label: 'Verstrekker' },
      { key: 'purchaseDate', label: 'Startdatum', required: true },
      { key: 'warrantyUntil', label: 'Einddatum' },
      { key: 'priceCents', label: 'Hoofdsom', required: true },
      ...BASE_NOTES,
    ],
  },
  bankrekeningen: {
    fields: [
      { key: 'brand', label: 'Bank', required: true },
      { key: 'iban', label: 'IBAN', required: true },
      { key: 'purchaseDate', label: 'Openingsdatum' },
      { key: 'priceCents', label: 'Saldo / Referentiewaarde' },
      ...BASE_NOTES,
    ],
  },
  beleggingen: {
    fields: [
      { key: 'brand', label: 'Broker/Beheerder' },
      { key: 'model', label: 'Product/Fonds' },
      { key: 'purchaseDate', label: 'Startdatum' },
      { key: 'priceCents', label: 'Waarde', required: true },
      ...BASE_NOTES,
    ],
  },
  technische_installaties: { fields: BASE_DEVICE },
  pensioenen: {
    fields: [
      { key: 'brand', label: 'Uitvoerder' },
      { key: 'model', label: 'Regeling/Contract' },
      { key: 'purchaseDate', label: 'Startdatum' },
      { key: 'priceCents', label: 'Waarde / Aanspraak', required: true },
      ...BASE_NOTES,
    ],
  },
  rijbewijzen: {
    fields: [
      { key: 'policyNumber', label: 'Documentnummer', required: true },
      { key: 'purchaseDate', label: 'Afgiftedatum', required: true },
      { key: 'warrantyUntil', label: 'Geldig t/m', required: true },
      ...BASE_NOTES,
    ],
  },
  identificatie_bewijzen: {
    fields: [
      { key: 'policyNumber', label: 'Documentnummer', required: true },
      { key: 'purchaseDate', label: 'Afgiftedatum', required: true },
      { key: 'warrantyUntil', label: 'Geldig t/m', required: true },
      ...BASE_NOTES,
    ],
  },
  nalatenschap_bewijzen: {
    fields: [
      { key: 'policyNumber', label: 'Referentie / Aktenummer' },
      ...BASE_DATES,
      ...BASE_NOTES,
    ],
  },
  zakelijke_belangen: {
    fields: [
      { key: 'brand', label: 'Entiteit/Naam', required: true },
      { key: 'model', label: 'Rol/Instrument' },
      { key: 'purchaseDate', label: 'Ingangsdatum' },
      { key: 'priceCents', label: 'Waarde / Inleg' },
      ...BASE_NOTES,
    ],
  },
  ict: { fields: BASE_DEVICE },
  schuldbekentenissen: {
    fields: [
      { key: 'policyNumber', label: 'Referentie / Documentnr.' },
      { key: 'brand', label: 'Schuldeiser/Schuldenaar' },
      ...BASE_DATES,
      { key: 'priceCents', label: 'Hoofdsom', required: true },
      ...BASE_NOTES,
    ],
  },
  vastgoed_bezittingen: {
    fields: [
      { key: 'brand', label: 'Adres/Omschrijving', required: true },
      { key: 'model', label: 'Kadastrale gegevens' },
      ...BASE_DATES,
      { key: 'priceCents', label: 'Waarde', required: true },
      ...BASE_NOTES,
    ],
  },
  service_providers: {
    fields: [
      { key: 'brand', label: 'Leverancier/Bedrijf', required: true },
      { key: 'model', label: 'Dienst/Contract' },
      ...BASE_DATES,
      ...BASE_PRICE,
      ...BASE_NOTES,
    ],
  },
};
