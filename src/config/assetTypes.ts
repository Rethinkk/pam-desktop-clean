/* @ts-nocheck */

/**
 * SKELET – platte lijst met AL je types, fields voorlopig leeg
 * => Breekt niets: in AssetsPanel blijven alleen "Naam" + "Assettype" verplicht.
 * => Morgen vullen we per type de fields (required/optional + table:true).
 *
 * Tip: keys die nu al goed werken in je UI:
 * - serial, brand, model, purchaseDate (date), warrantyUntil (date), priceCents (number),
 * - personName (text), notes (text)
 *
 * Je kunt ook nieuwe keys gebruiken (bv. provider, number, startDate, endDate, iban, accountNumber).
 * Die rendert de UI nu als tekstvelden; dates/numbers kunnen we morgen netjes maken.
 */

export const ASSET_SCHEMAS: Record<string, { fields: Array<{
  key: string;
  label: string;
  input?: "text" | "date" | "number" | "select";
  required?: boolean;
  table?: boolean;
  options?: string[];
}>}> = {
  // ——— JOUW OORSPRONKELIJKE TYPES ———
  "Verzekeringen":           { fields: [] },
  "Abonnementen":            { fields: [] },
  "Domeinnamen":             { fields: [] },
  "Huishoudelijke apparaten":{ fields: [] },
  "Audio en video":          { fields: [] },
  "Vervoersmiddelen":        { fields: [] },
  "Interieur-items":         { fields: [] },
  "Antiek":                  { fields: [] },
  "Kunst":                   { fields: [] },
  "Hypotheek":               { fields: [] },
  "Leningen":                { fields: [] },
  "Bankrekeningen":          { fields: [] },
  "Beleggingen":             { fields: [] },
  "Technische installaties": { fields: [] },
  "Pensioenen":              { fields: [] },
  "Rijbewijzen":             { fields: [] },
  "Identificatie bewijzen":  { fields: [] },
  "Nalatenschap bewijzen":   { fields: [] },
  "Zakelijke belangen":      { fields: [] },
  "ICT apparatuur":          { fields: [
    // Kleine, veilige start (kan zo blijven werken met je huidige UI)
    { key: "serial",        label: "Serienummer",  input: "text",  required: true, table: true },
    { key: "purchaseDate",  label: "Aankoopdatum", input: "date",  required: true, table: true },
    { key: "priceCents",    label: "Aankoopprijs", input: "number",               table: true },
    { key: "brand",         label: "Merk",         input: "text" },
    { key: "model",         label: "Model",        input: "text" },
    { key: "warrantyUntil", label: "Garantie tot", input: "date" },
    { key: "notes",         label: "Notities",     input: "text" },
  ]},
  "Schuldbekentenissen":     { fields: [] },
  "Vastgoed bezittingen":    { fields: [] },
  "Service providers":       { fields: [] },

  // ——— JOUW 12 TOEGEVOEGDE TYPES ———
  "Garanties & aankoopbonnen":     { fields: [] },
  "Licenties & vergunningen":      { fields: [] },
  "Intellectueel eigendom":        { fields: [] },
  "Digitale accounts & nalatenschap": { fields: [] },
  "Crypto & digitale wallets":     { fields: [] },
  "Utilities & contracten":        { fields: [] },
  "Onderwijs & certificaten":      { fields: [] },
  "Medisch & zorg":                { fields: [] },
  "Testament & volmachten":        { fields: [] },
  "Sieraden & horloges / verzamelobjecten": { fields: [] },
  "Sleutels & beveiliging":        { fields: [] },
  "Loyalty & memberships":         { fields: [] },
};

// Type-select voedt zich hier automatisch uit
export const ASSET_TYPES = Object.keys(ASSET_SCHEMAS);
