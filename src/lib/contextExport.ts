import {
  assetRepository,
  consentRepository,
  documentRepository,
  personRepository,
} from "../storage/repositories";
import type { Asset, AuditEvent, ConsentRecord, DocumentItem, Person } from "../types";
import { allAuditEvents } from "./auditTrail";

type ContextKind = "asset" | "persoon" | "document";

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(Boolean).map(String);
}

function cleanSlug(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "context"
  );
}

export function contextExportFilename(kind: ContextKind, label: string) {
  const date = new Date().toISOString().slice(0, 10);
  return `pam-${kind}-${cleanSlug(label)}-${date}.json`;
}

function assetLabel(asset: any): string {
  return (
    asset?.name ??
    asset?.data?.naam ??
    asset?.data?.titel ??
    asset?.data?.object ??
    asset?.data?.adres ??
    asset?.assetNumber ??
    "Asset"
  );
}

function personLabel(person: any): string {
  return person?.fullName ?? person?.name ?? "Persoon";
}

function documentLabel(document: any): string {
  return document?.title ?? document?.fileName ?? document?.filename ?? "Document";
}

function personIdsForAsset(asset: any): string[] {
  return Array.from(
    new Set([
      asset?.personId,
      ...stringArray(asset?.personIds),
      ...stringArray(asset?.ownerIds),
      ...stringArray(asset?.watcherIds),
    ].filter(Boolean).map(String)),
  );
}

function documentIdsForAsset(asset: any, documents: DocumentItem[]): string[] {
  const ids = new Set(stringArray(asset?.documentIds));
  documents.forEach((document: any) => {
    if (stringArray(document?.assetIds).includes(String(asset?.id))) ids.add(String(document.id));
  });
  return [...ids];
}

function personIdsForDocument(document: any, people: Person[]): string[] {
  const ids = new Set([
    document?.ownerId,
    document?.personId,
    document?.uploadedById,
    document?.uploadedBy,
    ...stringArray(document?.recipientIds),
    ...stringArray(document?.recipients),
  ].filter(Boolean).map(String));

  if (document?.ownerName) {
    people.forEach((person: any) => {
      if (personLabel(person) === document.ownerName) ids.add(String(person.id));
    });
  }

  return [...ids];
}

function assetsForDocument(document: any, assets: Asset[]): Asset[] {
  const ids = new Set(stringArray(document?.assetIds));
  return assets.filter((asset: any) => ids.has(String(asset.id)));
}

function documentsForPerson(person: any, documents: DocumentItem[]): DocumentItem[] {
  const id = String(person?.id);
  const name = personLabel(person);
  return documents.filter((document: any) => {
    const ids = personIdsForDocument(document, [person]);
    return ids.includes(id) || document?.ownerName === name;
  });
}

function assetsForPerson(person: any, assets: Asset[]): Asset[] {
  const id = String(person?.id);
  return assets.filter((asset) => personIdsForAsset(asset).includes(id));
}

function consentMatchesAsset(consent: ConsentRecord, assetIds: Set<string>, documentIds: Set<string>) {
  if (consent.status !== "active") return false;
  const assetScopeMatches =
    consent.assetScope === "all" || consent.assetIds.some((id) => assetIds.has(String(id)));
  const documentScopeMatches =
    consent.documentScope === "all" || consent.documentIds.some((id) => documentIds.has(String(id)));
  return assetScopeMatches || documentScopeMatches;
}

function relevantAuditEvents(ids: Set<string>, entityTypes: Set<AuditEvent["entityType"]>) {
  return allAuditEvents().filter((event) => {
    if (!entityTypes.has(event.entityType)) return false;
    return Boolean(event.entityId && ids.has(String(event.entityId)));
  });
}

function basePayload(kind: "asset" | "person" | "document", id: string, label: string) {
  return {
    type: `pam.context.${kind}.v1`,
    exportedAt: new Date().toISOString(),
    context: {
      kind,
      id,
      label,
    },
  };
}

export function buildAssetContextExport(assetId: string) {
  const assets = assetRepository.load().assets as Asset[];
  const people = personRepository.all() as Person[];
  const documents = documentRepository.all() as DocumentItem[];
  const consents = consentRepository.all();
  const asset = assets.find((candidate: any) => String(candidate.id) === String(assetId));
  if (!asset) return null;

  const personIds = new Set(personIdsForAsset(asset));
  const documentIds = new Set(documentIdsForAsset(asset, documents));
  const linkedPeople = people.filter((person: any) => personIds.has(String(person.id)));
  const linkedDocuments = documents.filter((document: any) => documentIds.has(String(document.id)));
  const relevantConsents = consents.filter((consent) =>
    consentMatchesAsset(consent, new Set([String(asset.id)]), documentIds),
  );
  const auditIds = new Set([
    String(asset.id),
    ...[...personIds],
    ...[...documentIds],
    ...relevantConsents.map((consent) => String(consent.id)),
  ]);

  return {
    ...basePayload("asset", String(asset.id), assetLabel(asset)),
    asset,
    linkedPeople,
    linkedDocuments,
    relevantConsents,
    auditTrail: relevantAuditEvents(
      auditIds,
      new Set(["asset", "person", "document", "consent", "export"]),
    ),
    counts: {
      people: linkedPeople.length,
      documents: linkedDocuments.length,
      consents: relevantConsents.length,
    },
  };
}

export function buildPersonContextExport(personId: string) {
  const assets = assetRepository.load().assets as Asset[];
  const people = personRepository.all() as Person[];
  const documents = documentRepository.all() as DocumentItem[];
  const consents = consentRepository.all();
  const person = people.find((candidate: any) => String(candidate.id) === String(personId));
  if (!person) return null;

  const linkedAssets = assetsForPerson(person, assets);
  const linkedAssetIds = new Set(linkedAssets.map((asset: any) => String(asset.id)));
  const directDocuments = documentsForPerson(person, documents);
  const assetDocuments = documents.filter((document: any) =>
    stringArray(document?.assetIds).some((id) => linkedAssetIds.has(id)),
  );
  const linkedDocuments = Array.from(
    new Map([...directDocuments, ...assetDocuments].map((document: any) => [document.id, document])).values(),
  );
  const documentIds = new Set(linkedDocuments.map((document: any) => String(document.id)));
  const relevantConsents = consents.filter((consent) =>
    consent.status === "active" &&
    (consent.accessRights.includes("people_read") ||
      consent.assetScope === "all" ||
      consent.documentScope === "all" ||
      consent.assetIds.some((id) => linkedAssetIds.has(String(id))) ||
      consent.documentIds.some((id) => documentIds.has(String(id)))),
  );
  const auditIds = new Set([
    String(person.id),
    ...[...linkedAssetIds],
    ...[...documentIds],
    ...relevantConsents.map((consent) => String(consent.id)),
  ]);

  return {
    ...basePayload("person", String(person.id), personLabel(person)),
    person,
    linkedAssets,
    linkedDocuments,
    relevantConsents,
    auditTrail: relevantAuditEvents(
      auditIds,
      new Set(["asset", "person", "document", "consent", "export"]),
    ),
    counts: {
      assets: linkedAssets.length,
      documents: linkedDocuments.length,
      consents: relevantConsents.length,
    },
  };
}

export function buildDocumentContextExport(documentId: string) {
  const assets = assetRepository.load().assets as Asset[];
  const people = personRepository.all() as Person[];
  const documents = documentRepository.all() as DocumentItem[];
  const consents = consentRepository.all();
  const document = documents.find((candidate: any) => String(candidate.id) === String(documentId));
  if (!document) return null;

  const linkedAssets = assetsForDocument(document, assets);
  const assetPeopleIds = linkedAssets.flatMap((asset) => personIdsForAsset(asset));
  const directPeopleIds = personIdsForDocument(document, people);
  const personIds = new Set([...assetPeopleIds, ...directPeopleIds]);
  const linkedPeople = people.filter((person: any) => personIds.has(String(person.id)));
  const assetIds = new Set(linkedAssets.map((asset: any) => String(asset.id)));
  const relevantConsents = consents.filter((consent) =>
    consentMatchesAsset(consent, assetIds, new Set([String(document.id)])),
  );
  const auditIds = new Set([
    String(document.id),
    ...[...assetIds],
    ...[...personIds],
    ...relevantConsents.map((consent) => String(consent.id)),
  ]);

  return {
    ...basePayload("document", String(document.id), documentLabel(document)),
    document,
    linkedAssets,
    linkedPeople,
    relevantConsents,
    auditTrail: relevantAuditEvents(
      auditIds,
      new Set(["asset", "person", "document", "consent", "export"]),
    ),
    counts: {
      assets: linkedAssets.length,
      people: linkedPeople.length,
      consents: relevantConsents.length,
    },
  };
}
