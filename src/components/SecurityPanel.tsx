import React from "react";
import ExportButton from "./ExportButton";
import { hydrateSecureLocalStorageAdapter } from "../storage/secureLocalStorageAdapter";
import {
  queueLocalDataForCloudSync,
  runCloudSyncNow,
} from "../sync/syncCoordinator";
import { getCloudSyncStatus } from "../sync/syncStatus";
import type { CloudSyncStatus } from "../sync/types";
import {
  getSecureMigrationStatus,
  migrateLocalStorageToEncryptedIndexedDb,
  type SecureMigrationStatus,
  type SecureMigrationVerification,
  verifyEncryptedMigration,
} from "../storage/secureMigration";
import {
  parsePamBackup,
  restorePamBackup,
  summarizePamBackup,
  type BackupSummary,
} from "../lib/backupRestore";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function SecurityPanel() {
  const [status, setStatus] = React.useState<SecureMigrationStatus | null>(null);
  const [verification, setVerification] =
    React.useState<SecureMigrationVerification | null>(null);
  const [cloudStatus, setCloudStatus] = React.useState<CloudSyncStatus>(() =>
    getCloudSyncStatus(),
  );
  const [message, setMessage] = React.useState("");
  const [cloudMessage, setCloudMessage] = React.useState("");
  const [restoreFile, setRestoreFile] = React.useState<File | null>(null);
  const [restoreMessage, setRestoreMessage] = React.useState("");
  const [restoreSummary, setRestoreSummary] = React.useState<BackupSummary | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [cloudBusy, setCloudBusy] = React.useState(false);
  const [restoreBusy, setRestoreBusy] = React.useState(false);

  const refreshStatus = React.useCallback(async () => {
    const nextStatus = await getSecureMigrationStatus();
    setStatus(nextStatus);
  }, []);

  React.useEffect(() => {
    refreshStatus().catch((error: unknown) => {
      setMessage(`Status ophalen mislukt: ${getErrorMessage(error)}`);
    });
  }, [refreshStatus]);

  const runMigration = React.useCallback(async () => {
    setBusy(true);
    setMessage("");
    setVerification(null);
    try {
      const nextStatus = await migrateLocalStorageToEncryptedIndexedDb({ force: true });
      if (nextStatus.secureModeEnabled) {
        await hydrateSecureLocalStorageAdapter();
      }
      setStatus(nextStatus);
      setMessage("Migratie naar encrypted IndexedDB is afgerond.");
    } catch (error: unknown) {
      setMessage(`Migratie mislukt: ${getErrorMessage(error)}`);
    } finally {
      setBusy(false);
    }
  }, []);

  const runVerification = React.useCallback(async () => {
    setBusy(true);
    setMessage("");
    try {
      const result = await verifyEncryptedMigration();
      setVerification(result);
      setMessage(
        result.ok
          ? "Controle geslaagd: alle bekende POC-sleutels staan encrypted in IndexedDB."
          : "Controle niet volledig: er ontbreken nog sleutels in encrypted opslag.",
      );
      await refreshStatus();
    } catch (error: unknown) {
      setMessage(`Controle mislukt: ${getErrorMessage(error)}`);
    } finally {
      setBusy(false);
    }
  }, [refreshStatus]);

  const queueCloudSync = React.useCallback(async () => {
    setCloudBusy(true);
    setCloudMessage("");
    try {
      const nextStatus = await queueLocalDataForCloudSync();
      setCloudStatus(nextStatus);
      setCloudMessage("Lokale data staat klaar in de cloud-sync wachtrij.");
    } catch (error: unknown) {
      setCloudMessage(`Queue mislukt: ${getErrorMessage(error)}`);
    } finally {
      setCloudBusy(false);
    }
  }, []);

  const syncNow = React.useCallback(async () => {
    setCloudBusy(true);
    setCloudMessage("");
    try {
      const nextStatus = await runCloudSyncNow();
      setCloudStatus(nextStatus);
      setCloudMessage(
        nextStatus.state === "success"
          ? "Cloud-sync afgerond."
          : nextStatus.lastError ?? "Cloud-sync is nog niet actief.",
      );
    } catch (error: unknown) {
      setCloudMessage(`Sync mislukt: ${getErrorMessage(error)}`);
    } finally {
      setCloudBusy(false);
    }
  }, []);

  const inspectRestoreFile = React.useCallback(async (file: File | null) => {
    setRestoreFile(file);
    setRestoreMessage("");
    setRestoreSummary(null);
    if (!file) return;

    try {
      const payload = parsePamBackup(await file.text());
      const summary = summarizePamBackup(payload);
      setRestoreSummary(summary);
      setRestoreMessage(
        `Backup gelezen: ${summary.assets} assets, ${summary.documents} documenten, ${summary.people} personen, ${summary.consents} toestemmingen.`,
      );
    } catch (error: unknown) {
      setRestoreFile(null);
      setRestoreMessage(`Backup kan niet worden gelezen: ${getErrorMessage(error)}`);
    }
  }, []);

  const runRestore = React.useCallback(async () => {
    if (!restoreFile) return;
    const ok = confirm(
      "Weet je zeker dat je deze backup wilt herstellen? De huidige lokale PAM-data op dit apparaat wordt vervangen.",
    );
    if (!ok) return;

    setRestoreBusy(true);
    setRestoreMessage("");
    try {
      const payload = parsePamBackup(await restoreFile.text());
      const summary = restorePamBackup(payload);
      setRestoreSummary(summary);
      setRestoreMessage(
        `Backup hersteld: ${summary.assets} assets, ${summary.documents} documenten, ${summary.people} personen en ${summary.consents} toestemmingen.`,
      );
      await refreshStatus();
      window.dispatchEvent(new CustomEvent("pam:toast", {
        detail: { message: "PAM-backup hersteld", tone: "success" },
      }));
    } catch (error: unknown) {
      setRestoreMessage(`Herstellen mislukt: ${getErrorMessage(error)}`);
    } finally {
      setRestoreBusy(false);
    }
  }, [refreshStatus, restoreFile]);

  const encryptedCount = status?.encryptedKeys?.length ?? 0;
  const sourceKeys = status?.sourceKeys ?? [];
  const sourceCount = sourceKeys.length;

  return (
    <div className="ui-page">
      {/* Info-balk bovenaan */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 24,
        }}
      >
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#334155" }}>
          Je werkt nu in de lokale PAM-omgeving. Cloud-sync komt pas na een
          expliciete account- en sleutelkeuze; tot die tijd blijven gegevens op
          dit apparaat.
        </p>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
        Beveiliging & Privacy
      </h1>

      {/* Introductie */}
      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ lineHeight: 1.6 }}>
          In de huidige versie van <strong>Personal Asset Manager</strong> staat
          veiligheid gelijk aan transparantie. We verwerken geen gegevens buiten
          jouw eigen apparaat. Alles wat je invoert blijft{" "}
          <strong>uitsluitend lokaal</strong> opgeslagen in jouw browser.
        </p>
        <p style={{ lineHeight: 1.6 }}>
          De applicatie is ontworpen volgens één kernprincipe:{" "}
          <strong>jij behoudt de controle</strong>. Geen stille synchronisatie,
          geen externe opslag. Alleen jij beslist of en wanneer gegevens worden
          gedeeld, geback-upt of verwijderd.
        </p>
      </div>

      {/* Opslagwijze */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          Huidige opslagwijze
        </h2>
        <p>
          De POC gebruikt nog <code>localStorage</code> als brondata. Voor de
          secure lokale modus kan PAM deze gegevens kopiëren naar encrypted
          IndexedDB. Dit betekent:
        </p>
        <ul style={{ lineHeight: 1.6, paddingLeft: 24 }}>
          <li>Je data blijft op je eigen apparaat, niet op een server.</li>
          <li>Encrypted IndexedDB is de beoogde lokale opslaglaag voor gevoelige data.</li>
          <li>
            Verwijder je browserdata, dan verdwijnt ook je informatie uit de
            applicatie.
          </li>
          <li>
            Gebruik je een andere computer of browser, dan begin je opnieuw met
            een lege omgeving.
          </li>
        </ul>
      </div>

      {/* Export / Backup */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          Back-up maken voor migratie
        </h2>
        <p style={{ marginBottom: 12 }}>
          Maak eerst een back-up voordat je lokale data naar encrypted opslag
          migreert. Dit JSON-bestand bevat gevoelige gegevens; bewaar het in een
          digitale kluis of op een versleutelde schijf.
        </p>
        <ExportButton className="ui-btn" />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          Back-up herstellen
        </h2>
        <p style={{ marginBottom: 12, lineHeight: 1.6 }}>
          Herstel alleen een PAM-backup die je vertrouwt. Bij herstel worden de
          huidige lokale assets, documenten, personen, toestemmingen en auditregels
          op dit apparaat vervangen door de inhoud van het bestand.
        </p>
        <div style={{ display: "grid", gap: 10, maxWidth: 620 }}>
          <input
            accept="application/json,.json"
            className="ui-input"
            onChange={(event) => inspectRestoreFile(event.target.files?.[0] ?? null)}
            type="file"
          />
          {restoreSummary && (
            <div
              style={{
                background: "#F8F5EE",
                border: "1px solid #DEDCD5",
                borderRadius: 12,
                color: "#123052",
                padding: 12,
              }}
            >
              {restoreSummary.assets} assets · {restoreSummary.documents} documenten ·{" "}
              {restoreSummary.people} personen · {restoreSummary.consents} toestemmingen ·{" "}
              {restoreSummary.auditEvents} auditregels
            </div>
          )}
          <div>
            <button
              className="ui-btn ui-btn--secondary"
              disabled={!restoreFile || restoreBusy}
              onClick={runRestore}
              type="button"
            >
              Backup herstellen
            </button>
          </div>
          {restoreMessage && (
            <p style={{ color: restoreMessage.includes("mislukt") || restoreMessage.includes("niet") ? "#991b1b" : "#166534", margin: 0 }}>
              {restoreMessage}
            </p>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          Secure local mode
        </h2>
        <p style={{ lineHeight: 1.6 }}>
          Deze stap kopieert de bekende POC-data naar encrypted IndexedDB. In
          productie wordt de kluis geopend met hybride sleutelbeheer: account
          login voor toegang tot de app, plus een aparte vault- of recovery-key
          voor decryptie van echte data.
        </p>

        <div
          style={{
            display: "grid",
            gap: 8,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            margin: "12px 0",
          }}
        >
          <div>
            <strong>Secure flag</strong>
            <div>{status?.secureModeEnabled ? "Aan" : "Uit"} via <code>VITE_SECURE_LOCAL_STORAGE</code></div>
          </div>
          <div>
            <strong>Migratiestatus</strong>
            <div>{status?.migrated ? `Gemigreerd op ${status.migratedAt}` : "Nog niet gemigreerd"}</div>
          </div>
          <div>
            <strong>Brondata</strong>
            <div>{sourceCount} bekende POC-sleutel(s)</div>
          </div>
          <div>
            <strong>Encrypted opslag</strong>
            <div>{encryptedCount} sleutel(s) in IndexedDB</div>
          </div>
        </div>

        {sourceKeys.length > 0 && (
          <p style={{ fontSize: 13, color: "#475569", marginBottom: 12 }}>
            Bron: {sourceKeys.join(", ")}
          </p>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="ui-btn ui-btn--primary" onClick={runMigration} disabled={busy}>
            Start encrypted migratie
          </button>
          <button className="ui-btn ui-btn--secondary" onClick={runVerification} disabled={busy}>
            Controleer encrypted opslag
          </button>
        </div>

        {verification && (
          <p style={{ marginTop: 12, color: verification.ok ? "#166534" : "#991b1b" }}>
            {verification.ok
              ? "Verificatie OK."
              : `Ontbrekend: ${verification.missingKeys.join(", ") || "onbekend"}`}
          </p>
        )}

        {message && (
          <p style={{ marginTop: 12, color: message.includes("mislukt") ? "#991b1b" : "#166534" }}>
            {message}
          </p>
        )}

        <p style={{ marginTop: 12, fontSize: 13, color: "#64748b" }}>
          Let op: de huidige vault-key helper is alleen bedoeld voor ontwikkeling.
          Productie vereist een echte unlock-, recovery- en key-rotation flow.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          Cloud sync
        </h2>
        <p style={{ lineHeight: 1.6 }}>
          De cloud-laag staat nu als boundary klaar. PAM kan lokale data in een
          sync-wachtrij zetten en alleen encrypted records aanbieden aan een
          toekomstige provider-adapter. Er wordt nog geen backend gekoppeld.
        </p>

        <div
          style={{
            display: "grid",
            gap: 8,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            margin: "12px 0",
          }}
        >
          <div>
            <strong>Cloud flag</strong>
            <div>{cloudStatus.enabled ? "Aan" : "Uit"} via <code>VITE_CLOUD_SYNC_ENABLED</code></div>
          </div>
          <div>
            <strong>Provider</strong>
            <div>{cloudStatus.provider}</div>
          </div>
          <div>
            <strong>Status</strong>
            <div>{cloudStatus.state}</div>
          </div>
          <div>
            <strong>Wachtrij</strong>
            <div>{cloudStatus.queuedCount} recordgroep(en)</div>
          </div>
        </div>

        {cloudStatus.lastAttemptAt && (
          <p style={{ fontSize: 13, color: "#475569" }}>
            Laatste poging: {cloudStatus.lastAttemptAt}
          </p>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="ui-btn ui-btn--primary" onClick={queueCloudSync} disabled={cloudBusy}>
            Zet lokale data klaar
          </button>
          <button className="ui-btn ui-btn--secondary" onClick={syncNow} disabled={cloudBusy}>
            Sync nu
          </button>
        </div>

        {(cloudMessage || cloudStatus.lastError) && (
          <p
            style={{
              marginTop: 12,
              color: cloudStatus.state === "error" ? "#991b1b" : "#166534",
            }}
          >
            {cloudMessage || cloudStatus.lastError}
          </p>
        )}
      </div>

      {/* Toekomstige opties */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          Vooruitblik
        </h2>
        <p style={{ marginBottom: 8 }}>
          In een volgende versie kun je zelf kiezen welk beveiligingsniveau je
          wilt gebruiken:
        </p>
        <ul style={{ lineHeight: 1.6, paddingLeft: 24 }}>
          <li>
            <strong>Local secure mode</strong> - encrypted opslag op je eigen apparaat
          </li>
          <li>
            <strong>Cloud sync</strong> - end-to-end encryptie met eigen
            sleutel
          </li>
          <li>
            <strong>Audit trail</strong> - vastlegging van elke wijziging
          </li>
          <li>
            <strong>Hybride sleutelbeheer</strong> - account login plus aparte controle over
            decryptie
          </li>
        </ul>
        <p style={{ marginTop: 8 }}>
          Tot die tijd kun je met een gerust hart testen, wetende dat alle data
          alleen op jouw apparaat blijft.
        </p>
      </div>

      <footer style={{ marginTop: 32, fontSize: "0.9em", color: "#666" }}>
        <p>Versie 1.0 — Local Secure Mode</p>
      </footer>
    </div>
  );
}
