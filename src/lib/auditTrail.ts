import type { AuditAction, AuditEvent } from "../types";

export const AUDIT_KEY = "pam-audit-v1";
const USERS_KEY = "pam-auth-users-v1";
const SESSION_KEY = "pam-auth-session-v1";
const MAX_AUDIT_EVENTS = 1000;

type AuditInput = {
  action: AuditAction;
  entityType: AuditEvent["entityType"];
  entityId?: string;
  entityLabel?: string;
  summary: string;
  metadata?: AuditEvent["metadata"];
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function currentActor() {
  const userId = localStorage.getItem(SESSION_KEY) || undefined;
  if (!userId) return {};
  const users = readJson<any[]>(USERS_KEY, []);
  const user = users.find((candidate) => candidate.id === userId);
  return {
    actorId: userId,
    actorName: user?.name,
    actorEmail: user?.email,
  };
}

export function allAuditEvents(): AuditEvent[] {
  const stored = readJson<{ events?: AuditEvent[] } | AuditEvent[]>(AUDIT_KEY, []);
  const events = Array.isArray(stored) ? stored : stored.events ?? [];
  return events
    .filter(Boolean)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function logAuditEvent(input: AuditInput) {
  try {
    const event: AuditEvent = {
      id: crypto.randomUUID(),
      ...currentActor(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    const next = [event, ...allAuditEvents()].slice(0, MAX_AUDIT_EVENTS);
    localStorage.setItem(AUDIT_KEY, JSON.stringify({ events: next }));
    window.dispatchEvent(new CustomEvent("pam-audit-updated"));
    return event;
  } catch {
    return undefined;
  }
}

export function exportAuditPayload() {
  return {
    type: "pam.audit.v1",
    exportedAt: new Date().toISOString(),
    events: allAuditEvents(),
  };
}
