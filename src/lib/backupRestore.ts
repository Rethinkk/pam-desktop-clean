import { AUDIT_KEY, logAuditEvent } from "./auditTrail";
import {
  assetRepository,
  consentRepository,
  documentRepository,
  schemaRepository,
  personRepository,
} from "../storage/repositories";
import type { AssetSchema } from "../config/assetSchema";
import type { AuditEvent } from "../types";

export type BackupSummary = {
  assets: number;
  documents: number;
  people: number;
  consents: number;
  auditEvents: number;
};

type BackupPayload = {
  app?: string;
  version?: number;
  createdAt?: string;
  schema?: unknown;
  assets?: unknown;
  docs?: unknown;
  people?: unknown;
  consents?: unknown;
  auditTrail?: unknown;
};

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function hasSchema(value: unknown): value is AssetSchema {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as AssetSchema).version === "number" &&
      Array.isArray((value as AssetSchema).types),
  );
}

export function parsePamBackup(raw: string): BackupPayload {
  const payload = JSON.parse(raw) as BackupPayload;
  if (!payload || typeof payload !== "object") {
    throw new Error("Dit bestand is geen geldige PAM-backup.");
  }
  if (payload.app !== "PersonalAssetManager") {
    throw new Error("Dit bestand lijkt geen PAM-backup te zijn.");
  }
  if (!Array.isArray(payload.assets) || !Array.isArray(payload.docs) || !Array.isArray(payload.people)) {
    throw new Error("De backup mist assets, documenten of personen.");
  }
  return payload;
}

export function summarizePamBackup(payload: BackupPayload): BackupSummary {
  return {
    assets: asArray(payload.assets).length,
    documents: asArray(payload.docs).length,
    people: asArray(payload.people).length,
    consents: asArray(payload.consents).length,
    auditEvents: asArray(payload.auditTrail).length,
  };
}

export function restorePamBackup(payload: BackupPayload): BackupSummary {
  const summary = summarizePamBackup(payload);

  assetRepository.save({ assets: asArray(payload.assets) as any[] });
  documentRepository.saveAll(asArray(payload.docs) as any[]);
  personRepository.saveAll(asArray(payload.people) as any[]);
  consentRepository.saveAll(asArray(payload.consents) as any[]);

  if (hasSchema(payload.schema)) {
    schemaRepository.save(payload.schema);
  }

  const auditEvents = asArray(payload.auditTrail).filter(Boolean) as AuditEvent[];
  if (auditEvents.length) {
    localStorage.setItem(AUDIT_KEY, JSON.stringify({ events: auditEvents }));
    window.dispatchEvent(new CustomEvent("pam-audit-updated"));
  }

  logAuditEvent({
    action: "backup_restored",
    entityType: "system",
    entityLabel: "Backup herstel",
    summary: "PAM-backup hersteld op dit apparaat.",
    metadata: {
      context: "backup-restore",
      assetCount: summary.assets,
      documentCount: summary.documents,
      personCount: summary.people,
      consentCount: summary.consents,
      auditEventCount: summary.auditEvents,
    },
  });

  return summary;
}
