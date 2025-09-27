export type FieldKind =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'currency'
  | 'checkbox'
  | 'textarea'
  | 'password'
  | 'url';

export type FieldDef = {
  key: string;
  label: string;
  kind: FieldKind;
  options?: string[];
  placeholder?: string;
};

export type AssetTypeSchema = {
  code: string;              // bv. "ART"
  label: string;             // bv. "Kunst"
  required: FieldDef[];
  optional: FieldDef[];
};

export type AssetPayload = Record<string, any>;

export type Asset = {
  id: string;
  assetNumber: string;       // PAM-<CODE>-YYYYMMDD-XXXX
  name: string;              // asset benoeming
  type: string;              // schema.code
category: string;
value?: number;
notes?: string;
  createdAt: string;
  updatedAt: string;
  data: AssetPayload;

// NIEUW: koppelingen met personen
  ownerIds?: string[];   // eigenaren/verantwoordelijken
  watcherIds?: string[]; // meelezers/notificaties
};


export type AssetRegister = {
  version: 1;
  assets: Asset[];
  counters: Record<string, number>; // per <type:date> sequence
};// -- Documenten gekoppeld aan assets --

export type DocumentItem = {
  id: string;
  filename: string;
  mime: string;
  size: number;
  dataUrl: string;           // base64 data URL voor lokaal opslaan
  uploadedAt: string;        // ISO string
  uploadedBy?: string;       // bv. naam/email van uploader
  recipients?: string[];     // wie het moet ontvangen
  assetNumbers: string[];    // gekoppelde assets (assetNumber)
  notes?: string;

// Bestaand bij jou:
  assetIds?: string[];

  // NIEUW: koppelingen met personen
  uploadedById?: string;   // wie heeft geüpload
  recipientIds?: string[]; // naar wie is/wordt gestuurd


};
export type PersonRole =
  | "hoofdgebruiker"
  | "partner"
  | "kind"
  | "gemachtigde"
  | "serviceprovider"
  | "overig";

export type Person = {
  id: string;
  fullName: string;
  role: PersonRole;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
};


