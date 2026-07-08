import { assetRepository, documentRepository, personRepository, schemaRepository } from "../storage/repositories";

export type PamExport = {
  app: "PersonalAssetManager";
  version: number;
  createdAt: string;
  schema?: unknown;
  assets: unknown[];
  docs: unknown[];
  people: unknown[];
  meta?: Record<string, unknown>;
};

export function buildPamExport(): PamExport {
  return {
    app: "PersonalAssetManager",
    version: 1,
    createdAt: new Date().toISOString(),
    schema: schemaRepository.load(),
    assets: assetRepository.load().assets,
    docs: documentRepository.all(),
    people: personRepository.all(),
    meta: {
      locale: navigator.language,
      userAgent: navigator.userAgent,
    },
  };
}
