import React from "react";

import { allAuditEvents, exportAuditPayload } from "../lib/auditTrail";
import { downloadJson } from "../lib/downloadJson";
import type { AuditEvent } from "../types";
import { EmptyState } from "./ui/UI";

const ACTION_LABELS: Record<string, string> = {
  asset_created: "Asset aangemaakt",
  asset_updated: "Asset aangepast",
  asset_finalized: "Asset vastgelegd",
  asset_deleted: "Asset verwijderd",
  document_created: "Document aangemaakt",
  document_viewed: "Document bekeken",
  document_linked: "Document gekoppeld",
  document_deleted: "Document verwijderd",
  person_created: "Persoon aangemaakt",
  person_updated: "Persoon aangepast",
  person_deleted: "Persoon verwijderd",
  consent_created: "Toestemming vastgelegd",
  consent_revoked: "Toestemming ingetrokken",
  consent_receipt_downloaded: "Toestemmingsbewijs gedownload",
  report_downloaded: "Rapportage gedownload",
  export_downloaded: "Export gedownload",
  backup_restored: "Backup hersteld",
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("nl-NL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function AuditTrailPanel() {
  const [events, setEvents] = React.useState<AuditEvent[]>(() => allAuditEvents());
  const [q, setQ] = React.useState("");
  const [entityType, setEntityType] = React.useState("all");

  React.useEffect(() => {
    const refresh = () => setEvents(allAuditEvents());
    window.addEventListener("pam-audit-updated", refresh);
    return () => window.removeEventListener("pam-audit-updated", refresh);
  }, []);

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return events.filter((event) => {
      if (entityType !== "all" && event.entityType !== entityType) return false;
      if (!needle) return true;
      return [
        ACTION_LABELS[event.action] ?? event.action,
        event.summary,
        event.entityLabel,
        event.actorName,
        event.actorEmail,
        event.entityType,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [entityType, events, q]);

  function exportAudit() {
    downloadJson(`pam-audit-${new Date().toISOString().slice(0, 10)}.json`, exportAuditPayload());
  }

  return (
    <div className="ui-page">
      <div className="audit-head">
        <div>
          <h1 className="ui-h1">Audit trail</h1>
          <p className="ui-muted">
            Een chronologisch logboek van belangrijke acties in PAM. Dit helpt bij controle, verantwoording en vertrouwen.
          </p>
        </div>
        <button className="ui-btn ui-btn--primary" type="button" onClick={exportAudit} disabled={!events.length}>
          Audit exporteren
        </button>
      </div>

      <style>{`
        .audit-head {
          align-items: flex-start;
          display: flex;
          gap: 16px;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .audit-meta {
          color: var(--pam-slate);
          font-size: 13px;
          line-height: 1.45;
        }
        @media (max-width: 760px) {
          .audit-head {
            flex-direction: column;
          }
          .audit-head .ui-btn {
            width: 100%;
          }
        }
      `}</style>

      {events.length === 0 ? (
        <EmptyState
          title="Nog geen audit events"
          body="Zodra u assets, documenten, personen, toestemmingen of rapportages gebruikt, bouwt PAM hier automatisch een audit trail op."
        />
      ) : (
        <>
          <div className="ui-toolbar">
            <input
              placeholder="Zoeken in audit trail..."
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
            <select
              className="ui-select"
              value={entityType}
              onChange={(event) => setEntityType(event.target.value)}
              style={{ maxWidth: 220 }}
            >
              <option value="all">Alle onderdelen</option>
              <option value="asset">Assets</option>
              <option value="document">Documenten</option>
              <option value="person">Mensen</option>
              <option value="consent">Toestemming</option>
              <option value="report">Rapportage</option>
              <option value="export">Export</option>
            </select>
            <div className="spacer" />
            <small>{filtered.length} events</small>
          </div>

          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Tijdstip</th>
                  <th>Actie</th>
                  <th>Onderdeel</th>
                  <th>Object</th>
                  <th>Gebruiker</th>
                  <th>Samenvatting</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((event) => (
                  <tr key={event.id}>
                    <td>{formatDateTime(event.createdAt)}</td>
                    <td><span className="ui-badge">{ACTION_LABELS[event.action] ?? event.action}</span></td>
                    <td>{event.entityType}</td>
                    <td>{event.entityLabel || event.entityId || "—"}</td>
                    <td>
                      <div>{event.actorName || "PAM gebruiker"}</div>
                      {event.actorEmail && <div className="audit-meta">{event.actorEmail}</div>}
                    </td>
                    <td>{event.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
