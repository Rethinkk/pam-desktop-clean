export type DocumentItem = {
  id: string;
  docNumber: string;      // PAM-DOC-YYYYMMDD-XXXX
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileDataUrl: string;    // DataURL <= ~4MB
  linkedAssetId?: string; // verwijzing naar Asset.id
  personRole?: 'uploaded_by' | 'recipient';
  personName?: string;
  personEmail?: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentsRegister = {
  version: 1;
  documents: DocumentItem[];
  counters: Record<string, number>; // per dag-sequence
};
