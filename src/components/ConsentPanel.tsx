import React from "react";

import { downloadJson } from "../lib/downloadJson";
import { openPamTab } from "../lib/workspaceTabs";
import { consentRepository } from "../storage/repositories";
import { EmptyState } from "./ui/UI";
import type {
  ConsentAccessRight,
  ConsentProfessionalRole,
  ConsentRecord,
} from "../types";

const ROLE_OPTIONS: Array<{ value: ConsentProfessionalRole; label: string }> = [
  { value: "notaris", label: "Notaris" },
  { value: "fiscalist", label: "Fiscalist" },
  { value: "accountant", label: "Accountant" },
  { value: "executeur", label: "Executeur" },
  { value: "adviseur", label: "Adviseur" },
  { value: "overig", label: "Overig" },
];

const ACCESS_RIGHT_OPTIONS: Array<{ value: ConsentAccessRight; label: string }> = [
  { value: "assets_read", label: "Assets inzien" },
  { value: "documents_read", label: "Documenten inzien" },
  { value: "people_read", label: "Betrokken personen inzien" },
  { value: "report_download", label: "Rapportage downloaden" },
  { value: "export_download", label: "Export downloaden" },
];

type FormState = {
  professionalName: string;
  organizationName: string;
  professionalEmail: string;
  role: ConsentProfessionalRole;
  purpose: string;
  accessRights: ConsentAccessRight[];
  expiresAt: string;
};

const EMPTY_FORM: FormState = {
  professionalName: "",
  organizationName: "",
  professionalEmail: "",
  role: "notaris",
  purpose: "",
  accessRights: ["assets_read", "documents_read"],
  expiresAt: "",
};

function formatDate(value?: string): string {
  if (!value) return "Geen einddatum";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("nl-NL");
}

function makeConsentId(): string {
  return `consent_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function roleLabel(role: ConsentProfessionalRole): string {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}

function accessRightLabel(right: ConsentAccessRight): string {
  return ACCESS_RIGHT_OPTIONS.find((option) => option.value === right)?.label ?? right;
}

function buildConsentText(form: FormState, startsAt: string): string {
  const organization = form.organizationName.trim()
    ? ` namens ${form.organizationName.trim()}`
    : "";
  const expires = form.expiresAt
    ? ` tot en met ${formatDate(form.expiresAt)}`
    : " totdat ik deze toestemming intrek";
  const rights = form.accessRights.map(accessRightLabel).join(", ");

  return [
    `Ik geef ${form.professionalName.trim()}${organization} toestemming om binnen PAM toegang te krijgen tot: ${rights}.`,
    `Het doel van deze toestemming is: ${form.purpose.trim()}.`,
    `Deze toestemming geldt vanaf ${formatDate(startsAt)}${expires}.`,
    "Ik kan deze toestemming op ieder moment intrekken.",
  ].join(" ");
}

function isExpired(consent: ConsentRecord): boolean {
  return Boolean(
    consent.expiresAt &&
      consent.status === "active" &&
      new Date(consent.expiresAt).getTime() < Date.now(),
  );
}

export default function ConsentPanel() {
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [consents, setConsents] = React.useState<ConsentRecord[]>([]);

  const refresh = React.useCallback(() => {
    let changed = false;
    const next = consentRepository.all().map((consent) => {
      if (!isExpired(consent)) return consent;
      changed = true;
      return {
        ...consent,
        status: "expired" as const,
        updatedAt: new Date().toISOString(),
      };
    });
    if (changed) consentRepository.saveAll(next);
    setConsents(next);
  }, []);

  React.useEffect(() => {
    refresh();
    window.addEventListener("pam-consents-updated", refresh);
    return () => window.removeEventListener("pam-consents-updated", refresh);
  }, [refresh]);

  const requiredOk =
    form.professionalName.trim().length > 1 &&
    form.purpose.trim().length > 2 &&
    form.accessRights.length > 0;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleAccessRight(right: ConsentAccessRight) {
    setForm((current) => {
      const hasRight = current.accessRights.includes(right);
      return {
        ...current,
        accessRights: hasRight
          ? current.accessRights.filter((item) => item !== right)
          : [...current.accessRights, right],
      };
    });
  }

  function saveConsent() {
    if (!requiredOk) return;

    const now = new Date().toISOString();
    const consent: ConsentRecord = {
      id: makeConsentId(),
      professionalName: form.professionalName.trim(),
      organizationName: form.organizationName.trim() || undefined,
      professionalEmail: form.professionalEmail.trim() || undefined,
      role: form.role,
      purpose: form.purpose.trim(),
      accessRights: form.accessRights,
      assetScope: "all",
      assetIds: [],
      documentScope: "all",
      documentIds: [],
      startsAt: now,
      expiresAt: form.expiresAt || undefined,
      status: "active",
      consentText: buildConsentText(form, now),
      grantedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    consentRepository.upsert(consent);
    setForm(EMPTY_FORM);
    refresh();
    window.dispatchEvent(
      new CustomEvent("pam:toast", {
        detail: { message: "Toestemming vastgelegd", tone: "success" },
      }),
    );
  }

  function revokeConsent(id: string) {
    const revoked = consentRepository.revoke(id);
    if (revoked) {
      refresh();
      window.dispatchEvent(
        new CustomEvent("pam:toast", {
          detail: { message: "Toestemming ingetrokken", tone: "info" },
        }),
      );
    }
  }

  function downloadConsentReceipt(consent: ConsentRecord) {
    const date = new Date().toISOString().slice(0, 10);
    downloadJson(`pam-toestemming-${date}-${consent.id}.json`, {
      type: "pam.consent.receipt.v1",
      exportedAt: new Date().toISOString(),
      consent,
    });
  }

  return (
    <div className="ui-page">
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
        Toestemming
      </h1>

      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          color: "#334155",
          lineHeight: 1.6,
          marginBottom: 20,
          padding: "12px 16px",
        }}
      >
        Leg vast welke professional toestemming krijgt om PAM-gegevens in te
        zien. Dit is de basis voor latere login, rollen en audit logging. De
        gebruiker blijft eigenaar van de toestemming en kan deze intrekken.
      </div>

      <div className="ui-form-grid" style={{ alignItems: "start" }}>
        <div className="ui-field">
          <div className="ui-section-title">Professional</div>

          <label htmlFor="consent-professional">Naam *</label>
          <input
            id="consent-professional"
            placeholder="Bijv. mr. Pam de Vries"
            value={form.professionalName}
            onChange={(event) => update("professionalName", event.target.value)}
          />

          <label htmlFor="consent-organization" style={{ marginTop: 12 }}>
            Organisatie
          </label>
          <input
            id="consent-organization"
            placeholder="Bijv. Notariskantoor De Vries"
            value={form.organizationName}
            onChange={(event) => update("organizationName", event.target.value)}
          />

          <label htmlFor="consent-email" style={{ marginTop: 12 }}>
            E-mail
          </label>
          <input
            id="consent-email"
            type="email"
            placeholder="naam@organisatie.nl"
            value={form.professionalEmail}
            onChange={(event) => update("professionalEmail", event.target.value)}
          />

          <label htmlFor="consent-role" style={{ marginTop: 12 }}>
            Rol *
          </label>
          <select
            id="consent-role"
            value={form.role}
            onChange={(event) =>
              update("role", event.target.value as ConsentProfessionalRole)
            }
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="ui-field">
          <div className="ui-section-title">Toestemming</div>

          <label htmlFor="consent-purpose">Doel *</label>
          <textarea
            id="consent-purpose"
            placeholder="Bijv. voorbereiding erfplanning, fiscale aangifte of dossiercontrole"
            rows={4}
            value={form.purpose}
            onChange={(event) => update("purpose", event.target.value)}
          />

          <label style={{ marginTop: 12 }}>Rechten *</label>
          <div
            style={{
              border: "1px solid #d8e0ea",
              borderRadius: 12,
              display: "grid",
              gap: 8,
              marginTop: 8,
              padding: 10,
            }}
          >
            {ACCESS_RIGHT_OPTIONS.map((option) => (
              <label
                key={option.value}
                style={{
                  alignItems: "center",
                  display: "flex",
                  fontWeight: 500,
                  gap: 8,
                  lineHeight: 1.4,
                  margin: 0,
                }}
              >
                <input
                  checked={form.accessRights.includes(option.value)}
                  style={{ flex: "0 0 auto", width: "auto" }}
                  type="checkbox"
                  onChange={() => toggleAccessRight(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>

          <label htmlFor="consent-expires" style={{ marginTop: 12 }}>
            Geldig tot
          </label>
          <input
            id="consent-expires"
            type="date"
            value={form.expiresAt}
            onChange={(event) => update("expiresAt", event.target.value)}
          />

          <button
            className="btn"
            disabled={!requiredOk}
            style={{ marginTop: 16 }}
            onClick={saveConsent}
          >
            Toestemming vastleggen
          </button>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <div className="ui-section-title">Vastgelegde toestemmingen</div>

        {consents.length === 0 ? (
          <EmptyState
            title="Nog geen toestemming nodig"
            body="Toestemming wordt belangrijk zodra een notaris, fiscalist, accountant of adviseur mag meekijken. Leg dan vast wie toegang krijgt, met welk doel en voor welke periode."
            actionLabel="Toestemming invullen"
            secondaryLabel="Eerst rapportage bekijken"
            onAction={() => document.getElementById("consent-professional")?.focus()}
            onSecondary={() => openPamTab("reporting")}
          />
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {consents.map((consent) => (
              <div
                key={consent.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    alignItems: "flex-start",
                    display: "flex",
                    gap: 12,
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong>{consent.professionalName}</strong>
                    {consent.organizationName ? `, ${consent.organizationName}` : ""}
                    <div style={{ color: "#64748b", marginTop: 4 }}>
                      {roleLabel(consent.role)} · {consent.status}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      className="btn"
                      onClick={() => downloadConsentReceipt(consent)}
                    >
                      Bewijs downloaden
                    </button>
                    {consent.status === "active" && (
                      <button
                        className="btn"
                        onClick={() => revokeConsent(consent.id)}
                      >
                        Intrekken
                      </button>
                    )}
                  </div>
                </div>

                <p style={{ lineHeight: 1.6, margin: "12px 0 8px" }}>
                  {consent.consentText}
                </p>

                <div style={{ color: "#64748b", fontSize: 14 }}>
                  Vastgelegd op {formatDate(consent.grantedAt)} · Geldig tot{" "}
                  {formatDate(consent.expiresAt)}
                  {consent.revokedAt ? ` · Ingetrokken op ${formatDate(consent.revokedAt)}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
