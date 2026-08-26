import { ReactNode } from "react";

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
  typeCode: ReactNode;
  id: string;
  assetNumber: string;       // PAM-<CODE>-YYYYMMDD-XXXX
  name?: string;              // asset benoeming
  type?: string;              // schema.code
category?: import ("./constants/assetCategories").AssetCategory;
ownerIds?: string [];
watcherIds?: string[];
value?: number;
notes?: string;
  createdAt: string;
  updatedAt: string;
  data: AssetPayload;

/** NIEUW: gekoppelde personen (ids) */
personIds?: string[];

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
  name: string;
  id: string;
  fullName: string;
  role: PersonRole;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
};

export type ConsentProfessionalRole =
  | "notaris"
  | "fiscalist"
  | "accountant"
  | "executeur"
  | "adviseur"
  | "overig";

export type ConsentAccessRight =
  | "assets_read"
  | "documents_read"
  | "people_read"
  | "report_download"
  | "export_download";

export type ConsentRecord = {
  id: string;
  professionalName: string;
  organizationName?: string;
  professionalEmail?: string;
  role: ConsentProfessionalRole;
  purpose: string;
  accessRights: ConsentAccessRight[];
  assetScope: "all" | "selected";
  assetIds: string[];
  documentScope: "all" | "selected";
  documentIds: string[];
  startsAt: string;
  expiresAt?: string;
  status: "active" | "revoked" | "expired";
  consentText: string;
  grantedAt: string;
  revokedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AuditAction =
  | "asset_created"
  | "asset_updated"
  | "asset_finalized"
  | "asset_deleted"
  | "document_created"
  | "document_viewed"
  | "document_linked"
  | "document_deleted"
  | "person_created"
  | "person_updated"
  | "person_deleted"
  | "consent_created"
  | "consent_revoked"
  | "consent_receipt_downloaded"
  | "report_downloaded"
  | "export_downloaded"
  | "backup_restored";

export type AuditEvent = {
  id: string;
  action: AuditAction;
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  entityType: "asset" | "document" | "person" | "consent" | "report" | "export" | "system";
  entityId?: string;
  entityLabel?: string;
  summary: string;
  metadata?: Record<string, string | number | boolean | null | string[]>;
  createdAt: string;
};
