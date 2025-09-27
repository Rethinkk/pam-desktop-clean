export type {DocumentItem, Asset } from "./types";
  id: string;
  docNumber: string;      // PAM-DOC-YYYYMMDD-XXXX
  title: string;
  fileName?: string;
  fileSize: number;
  mimeType: string;
  fileDataUrl: string;    // DataURL <= ~4MB
  linkedAssetId?: string; // verwijzing naar Asset.id
  personRole?: 'uploaded_by' | 'recipient';
  personName?: string;
  personEmail?: string;
  createdAt: string;
  updatedAt: string;
uploadedAt: string;
assetNumbers?: string[];
uploadedBy?: string;
recipient?: string;
};

export type DocumentsRegister = {
  version: number;
  documents: DocumentItem[];
  counters: Record<string, number>; // per dag-sequence
};
