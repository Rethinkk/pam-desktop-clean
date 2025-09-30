/* @ts-nocheck */
import type { Person } from "../types";

const STORAGE_KEY = "pam-people-v1";

function readAll(): any[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.people) ? parsed.people : (Array.isArray(parsed) ? parsed : []);
  } catch {
    return [];
  }
}

function writeAll(list: any[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ people: list }));
    window.dispatchEvent(new CustomEvent("pam-people-updated"));
  } catch {}
}

/** Altijd een geldig Person-object teruggeven, met name ← fullName fallback. */
function normalizePerson(p: any): Person {
  const now = new Date().toISOString();
  return {
    id: p?.id ?? (crypto?.randomUUID?.() ?? String(Date.now())),
    name: p?.name ?? p?.fullName ?? "",        // 👈 belangrijk
    fullName: p?.fullName ?? p?.name ?? "",
    role: p?.role ?? "overig",
    email: p?.email,
    phone: p?.phone,
    notes: p?.notes,
    createdAt: p?.createdAt ?? now,
    updatedAt: p?.updatedAt ?? now,
  };
}

/** Lees alle personen en zorg dat 'name' altijd gezet is. */
export function allPeople(): Person[] {
  const list = readAll();
  return list.map(normalizePerson);
}

/** Tolerante upsert: accepteert input zonder 'name', wij vullen 'name' = fullName. */
export function upsertPerson(input: any): Person {
  const next = normalizePerson(input);
  const list = readAll();
  const idx = list.findIndex((x: any) => x?.id === next.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...next, updatedAt: new Date().toISOString() };
  } else {
    list.push(next);
  }
  writeAll(list);
  return next;
}

/** Verwijderen ongewijzigd (laat je bestaande removePerson staan als je die al had) */
export function removePerson(id: string) {
  const list = readAll().filter((p: any) => p?.id !== id);
  writeAll(list);
}
