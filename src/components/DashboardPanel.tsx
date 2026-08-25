/* @ts-nocheck */
import React from "react";

import { openPamTab } from "../lib/workspaceTabs";
import {
  assetRepository,
  consentRepository,
  documentRepository,
  personRepository,
} from "../storage/repositories";
import { EmptyState, KPI } from "./ui/UI";

type DashboardSnapshot = ReturnType<typeof loadDashboardSnapshot>;

const SOON_DAYS = 30;

function asArray(value: any): any[] {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function uniq(values: any[]) {
  return Array.from(new Set(values.filter(Boolean).map(String)));
}

function assetTitle(asset: any) {
  return (
    asset?.name ??
    asset?.data?.naam ??
    asset?.data?.titel ??
    asset?.data?.omschrijving ??
    asset?.assetNumber ??
    "Asset"
  );
}

function assetType(asset: any) {
  return asset?.typeLabel ?? asset?.type ?? asset?.typeCode ?? "Onbekend type";
}

function documentTitle(document: any) {
  return document?.title ?? document?.fileName ?? document?.filename ?? "Document";
}

function isFinalized(asset: any) {
  return Boolean(
    asset?.finalizedAt ||
      asset?.lockedAt ||
      asset?.isFinalized ||
      asset?.status === "finalized" ||
      asset?.status === "vastgelegd",
  );
}

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysUntil(value?: string) {
  const date = parseDate(value);
  if (!date) return null;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((target.getTime() - start.getTime()) / 86400000);
}

function hasDashboardDate<T extends { days: number | null }>(item: T): item is T & { days: number } {
  return item.days !== null;
}

function loadDashboardSnapshot() {
  const assets = assetRepository.load().assets as any[];
  const documents = documentRepository.all() as any[];
  const people = personRepository.all() as any[];
  const consents = consentRepository.all() as any[];

  const documentIdsByAsset = new Map<string, string[]>();
  for (const document of documents) {
    for (const assetId of asArray(document.assetIds)) {
      const list = documentIdsByAsset.get(String(assetId)) ?? [];
      list.push(String(document.id));
      documentIdsByAsset.set(String(assetId), list);
    }
  }

  const assetRows = assets.map((asset) => {
    const personIds = uniq([
      ...asArray(asset.personIds),
      ...asArray(asset.ownerIds),
      asset.personId,
      asset.ownerId,
    ]);
    const documentIds = uniq([
      ...asArray(asset.documentIds),
      ...(documentIdsByAsset.get(String(asset.id)) ?? []),
    ]);
    const finalized = isFinalized(asset);
    const missing = finalized
      ? []
      : [
          !documentIds.length ? "documenten" : null,
          !personIds.length ? "mensen" : null,
          "vastleggen",
        ].filter(Boolean);

    let status = finalized ? "Vastgelegd" : "Compleet";
    let tone = "ok";
    if (!finalized && missing.length === 1 && missing[0] === "vastleggen") {
      status = "Klaar om vast te leggen";
      tone = "warn";
    } else if (!finalized && missing.length) {
      status = `Mist ${missing.join(", ")}`;
      tone = "warn";
    }

    return {
      id: asset.id,
      title: assetTitle(asset),
      type: assetType(asset),
      finalized,
      documentCount: documentIds.length,
      personCount: personIds.length,
      status,
      tone,
      missing,
    };
  });

  const documentsWithoutAssets = documents.filter((document) => !asArray(document.assetIds).length);
  const expiringDocuments = documents
    .map((document) => ({
      id: document.id,
      title: documentTitle(document),
      expiresAt: document.expiresAt ?? document.validUntil ?? document.expiryDate,
      days: daysUntil(document.expiresAt ?? document.validUntil ?? document.expiryDate),
    }))
    .filter(hasDashboardDate)
    .filter((document) => document.days <= SOON_DAYS)
    .sort((a, b) => a.days - b.days);

  const activeConsents = consents.filter((consent) => consent.status === "active");
  const openAssets = assetRows.filter((asset) => !asset.finalized);
  const expiringConsents = activeConsents
    .map((consent) => ({
      id: consent.id,
      title: consent.professionalName || consent.organizationName || "Toestemming",
      expiresAt: consent.expiresAt,
      days: daysUntil(consent.expiresAt),
    }))
    .filter(hasDashboardDate)
    .filter((consent) => consent.days <= SOON_DAYS)
    .sort((a, b) => a.days - b.days);

  return {
    assets,
    documents,
    people,
    consents,
    activeConsents,
    assetRows,
    documentsWithoutAssets,
    expiringDocuments,
    expiringConsents,
    assetsWithoutDocuments: openAssets.filter((asset) => asset.documentCount === 0),
    assetsWithoutPeople: openAssets.filter((asset) => asset.personCount === 0),
    conceptAssets: openAssets,
  };
}

function useDashboardSnapshot() {
  const [snapshot, setSnapshot] = React.useState<DashboardSnapshot>(() => loadDashboardSnapshot());

  React.useEffect(() => {
    const refresh = () => setSnapshot(loadDashboardSnapshot());
    const events = [
      "pam-assets-updated",
      "pam-docs-updated",
      "pam-people-updated",
      "pam-consents-updated",
    ];
    events.forEach((event) => window.addEventListener(event, refresh));
    window.addEventListener("storage", refresh);
    return () => {
      events.forEach((event) => window.removeEventListener(event, refresh));
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return snapshot;
}

function ActionCard({
  count,
  title,
  body,
  action,
  tab,
  urgent = false,
}: {
  count: number;
  title: string;
  body: string;
  action: string;
  tab: Parameters<typeof openPamTab>[0];
  urgent?: boolean;
}) {
  return (
    <div className="ui-card pam-dashboard-action">
      <div>
        <span className={`ui-badge ${urgent && count ? "warn" : count ? "" : "ok"}`}>
          {count ? `${count} aandachtspunt${count === 1 ? "" : "en"}` : "Op orde"}
        </span>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
      <button className="ui-btn ui-btn--secondary" type="button" onClick={() => openPamTab(tab)}>
        {action}
      </button>
    </div>
  );
}

function ExpiryLabel({ days }: { days: number }) {
  if (days < 0) return <span className="ui-badge danger">Verlopen</span>;
  if (days === 0) return <span className="ui-badge warn">Vandaag</span>;
  return <span className="ui-badge warn">Binnen {days} dagen</span>;
}

export default function DashboardPanel() {
  const snapshot = useDashboardSnapshot();
  const {
    activeConsents,
    assetRows,
    assets,
    assetsWithoutDocuments,
    assetsWithoutPeople,
    conceptAssets,
    documents,
    documentsWithoutAssets,
    expiringConsents,
    expiringDocuments,
    people,
  } = snapshot;

  const completeAssets = assetRows.filter(
    (asset) => asset.finalized && asset.documentCount > 0 && asset.personCount > 0,
  ).length;
  const attentionCount =
    assetsWithoutDocuments.length +
    assetsWithoutPeople.length +
    documentsWithoutAssets.length +
    expiringDocuments.length +
    expiringConsents.length;

  if (!assets.length && !documents.length && !people.length) {
    return (
      <div className="ui-page pam-dashboard">
        <DashboardStyle />
        <h1 className="ui-h1">Dashboard</h1>
        <EmptyState
          title="Begin met je eerste asset"
          body="Zodra je een asset vastlegt, laat PAM hier zien welke documenten, mensen en toestemmingen al gekoppeld zijn en wat nog aandacht verdient."
          actionLabel="Eerste asset vastleggen"
          onAction={() => openPamTab("assets")}
          secondaryLabel="Document toevoegen"
          onSecondary={() => openPamTab("docs")}
        />
      </div>
    );
  }

  return (
    <div className="ui-page pam-dashboard">
      <DashboardStyle />
      <div className="pam-dashboard-header">
        <div>
          <h1 className="ui-h1">Dashboard</h1>
          <p className="ui-muted">
            Je persoonlijke controlekamer: wat is vastgelegd, wat is gekoppeld en wat vraagt nog aandacht.
          </p>
        </div>
        <button className="ui-btn ui-btn--primary" type="button" onClick={() => openPamTab("assets")}>
          Nieuwe asset vastleggen
        </button>
      </div>

      <div className="ui-grid cols-4">
        <KPI label="Assets" value={assets.length} />
        <KPI label="Documenten" value={documents.length} />
        <KPI label="Mensen" value={people.length} />
        <KPI label="Actieve toestemmingen" value={activeConsents.length} />
      </div>

      <div className="pam-dashboard-focus">
        <div>
          <span className={`ui-badge ${attentionCount ? "warn" : "ok"}`}>
            {attentionCount ? `${attentionCount} aandachtspunten` : "Alles op orde"}
          </span>
          <h2>Volgende beste stap</h2>
          <p>
            {assetsWithoutDocuments.length
              ? "Koppel documenten aan je assets. Dan wordt het overzicht direct bruikbaarder voor jezelf en voor mensen die je vertrouwt."
              : assetsWithoutPeople.length
                ? "Koppel mensen aan de assets waarbij zij horen. Zo wordt duidelijk wie betrokken is of wie later mag meekijken."
                : documentsWithoutAssets.length
                  ? "Er staan documenten klaar die nog geen asset hebben. Koppel ze zodat je dossier logisch blijft."
                  : conceptAssets.length
                    ? "Er zijn assets die klaarstaan als concept. Leg ze vast wanneer de gegevens kloppen."
                    : "Je basis staat stevig. De volgende stap is periodiek controleren of documenten en toestemmingen actueel blijven."}
          </p>
        </div>
        <button
          className="ui-btn ui-btn--primary"
          type="button"
          onClick={() =>
            openPamTab(
              assetsWithoutDocuments.length || assetsWithoutPeople.length || conceptAssets.length
                ? "asset-register"
                : documentsWithoutAssets.length
                  ? "doc-register"
                  : "reporting",
            )
          }
        >
          Ga naar actie
        </button>
      </div>

      <div className="ui-grid cols-3">
        <ActionCard
          count={assetsWithoutDocuments.length}
          title="Assets zonder documenten"
          body="Maak zichtbaar welke facturen, polissen, contracten of bewijsstukken nog ontbreken."
          action="Bekijk assets"
          tab="asset-register"
          urgent
        />
        <ActionCard
          count={assetsWithoutPeople.length}
          title="Assets zonder mensen"
          body="Koppel partners, familieleden, adviseurs of andere betrokkenen aan de juiste assets."
          action="Koppel mensen"
          tab="asset-register"
          urgent
        />
        <ActionCard
          count={documentsWithoutAssets.length}
          title="Documenten zonder asset"
          body="Voorkom losse documenten door ze aan de juiste asset te hangen."
          action="Bekijk documenten"
          tab="doc-register"
          urgent
        />
      </div>

      <div className="ui-card">
        <div className="pam-dashboard-section-head">
          <div>
            <h2 className="ui-h2">Compleetheidsstatus per asset</h2>
            <p className="ui-muted">
              {completeAssets} van {assetRows.length} assets zijn volledig gekoppeld en vastgelegd.
            </p>
          </div>
          <button className="ui-btn ui-btn--secondary" type="button" onClick={() => openPamTab("asset-register")}>
            Naar asset register
          </button>
        </div>
        <div className="ui-tablewrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Type</th>
                <th>Status</th>
                <th>Documenten</th>
                <th>Mensen</th>
              </tr>
            </thead>
            <tbody>
              {assetRows
                .slice()
                .sort((a, b) => Number(a.status === "Compleet") - Number(b.status === "Compleet"))
                .map((asset) => (
                  <tr key={asset.id}>
                    <td><strong>{asset.title}</strong></td>
                    <td>{asset.type}</td>
                    <td><span className={`ui-badge ${asset.tone}`}>{asset.status}</span></td>
                    <td>{asset.documentCount}</td>
                    <td>{asset.personCount}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {(expiringDocuments.length || expiringConsents.length) ? (
        <div className="ui-grid cols-2">
          <div className="ui-card">
            <h2 className="ui-h2">Documenten met datum</h2>
            <div className="pam-dashboard-list">
              {expiringDocuments.slice(0, 5).map((document) => (
                <div key={document.id} className="pam-dashboard-list-row">
                  <span>{document.title}</span>
                  <ExpiryLabel days={document.days} />
                </div>
              ))}
            </div>
          </div>
          <div className="ui-card">
            <h2 className="ui-h2">Toestemmingen met datum</h2>
            <div className="pam-dashboard-list">
              {expiringConsents.slice(0, 5).map((consent) => (
                <div key={consent.id} className="pam-dashboard-list-row">
                  <span>{consent.title}</span>
                  <ExpiryLabel days={consent.days} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DashboardStyle() {
  return (
    <style>{`
      .pam-dashboard .ui-muted {
        margin: 0;
      }
      .pam-dashboard-header,
      .pam-dashboard-section-head {
        align-items: flex-start;
        display: flex;
        gap: 16px;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      .pam-dashboard-focus {
        align-items: center;
        background: #F3F1EA;
        border: 1px solid var(--pam-warm-grey);
        border-radius: 16px;
        display: flex;
        gap: 22px;
        justify-content: space-between;
        margin: 16px 0;
        padding: 20px;
      }
      .pam-dashboard-focus h2,
      .pam-dashboard-action h3 {
        color: var(--pam-deep-navy);
        font-size: 19px;
        line-height: 1.2;
        margin: 10px 0 7px;
      }
      .pam-dashboard-focus p,
      .pam-dashboard-action p {
        color: var(--pam-slate);
        line-height: 1.55;
        margin: 0;
      }
      .pam-dashboard-action {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 190px;
      }
      .pam-dashboard-action .ui-btn {
        align-self: flex-start;
        margin-top: 18px;
      }
      .pam-dashboard-list {
        display: grid;
        gap: 10px;
      }
      .pam-dashboard-list-row {
        align-items: center;
        border-top: 1px solid #ECEAE3;
        display: flex;
        gap: 12px;
        justify-content: space-between;
        padding-top: 10px;
      }
      @media (max-width: 760px) {
        .pam-dashboard-header,
        .pam-dashboard-focus,
        .pam-dashboard-section-head {
          align-items: stretch;
          flex-direction: column;
        }
        .pam-dashboard-header .ui-btn,
        .pam-dashboard-focus .ui-btn,
        .pam-dashboard-section-head .ui-btn {
          width: 100%;
        }
      }
    `}</style>
  );
}
