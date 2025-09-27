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
  name?: string;              // asset benoeming
  type?: string;              // schema.code
category?: string;
ownerIds?: string [];
watcherIds?: string[];
value?: number;
notes?: string;
  createdAt: string;
  updatedAt: string;
  data: AssetPayload;


};


export type AssetRegister = {
  version: 1;
  assets: Asset[];
  counters: Record<string, number>; // per <type:date> sequence
};// -- Documenten gekoppeld aan assets --

export type DocumentItem = {
  id: string;

  // display/meta
  docNumber?: string;
  title: string;

  // bestand (canonieke namen)
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileDataUrl?: string;

  // koppelingen (canon)
  assetIds?: string[];
  uploadedById?: string;
  recipientIds?: string[];

  // timestamps
  createdAt: string;
  updatedAt?: string;

  // optioneel
  notes?: string;

  /* -------- Legacy aliases (houden we aan boord voor compat) -------- */
  // oude bestandsnamen (UI gebruikt soms nog deze)
  filename?: string;
  mime?: string;
  size?: number;

  // oude koppelingen/velden
  uploadedBy?: string;      // oude naam van uploadedById
  recipients?: string[];    // oude naam van recipientIds
  assetNumbers?: string[];  // oude asset-koppeling op nummer
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


