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
  createdAt: string;
  updatedAt: string;
  data: AssetPayload;
};

export type AssetRegister = {
  version: 1;
  assets: Asset[];
  counters: Record<string, number>; // per <type:date> sequence
};
