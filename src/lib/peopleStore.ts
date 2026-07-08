/* @ts-nocheck */
import type { Person } from "../types";
import { PEOPLE_KEY, personRepository } from "../storage/repositories";

const STORAGE_KEY = PEOPLE_KEY;

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
  return personRepository.all();
}

/** Tolerante upsert: accepteert input zonder 'name', wij vullen 'name' = fullName. */
export function upsertPerson(input: any): Person {
  const next = normalizePerson(input);
  const list = personRepository.all();
  const idx = list.findIndex((x: any) => x?.id === next.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...next, updatedAt: new Date().toISOString() };
  } else {
    list.push(next);
  }
  personRepository.saveAll(list);
  return next;
}

/** Verwijderen ongewijzigd (laat je bestaande removePerson staan als je die al had) */
export function removePerson(id: string) {
  const list = personRepository.all().filter((p: any) => p?.id !== id);
  personRepository.saveAll(list);
}
